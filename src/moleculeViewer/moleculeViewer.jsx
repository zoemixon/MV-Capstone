import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

const CPK_COLORS = {
  H: '#FFFFFF', C: '#909090', O: '#FF0D0D', N: '#3050F8', S: '#FFFF30',
  P: '#FF8000', Cl: '#1FF01F', Br: '#A62929', I: '#940094', F: '#90E050',
  default: '#B0B0B0'
};

const MoleculeViewer = ({ molecules, onDeleteMolecule, onSceneReady }) => {
  const containerRef = useRef();
  const labelContainerRef = useRef();
  const atomLabelRef = useRef();
  const elementColorRef = useRef();
  const bondLabelRef = useRef();

  const densityCloudContainerRef = useRef();
  const densityCloudRendererRef = useRef();
  const densityCloudSceneRef = useRef();
  const densityCloudCameraRef = useRef();
  const densityCloudObjectRef = useRef();

  const allMeshesRef = useRef([]);
  const previouslySelectedAtomRef = useRef(null);
  const previouslySelectedUIRef = useRef(null);

  const [scene, setScene] = useState(new THREE.Scene());
  const [selected, setSelected] = useState({ moleculeIdx: null, atomIdx: null });

  const [areLabelsVisible, setLabelsVisible] = useState(true);

  const [backgroundColor, setBackgroundColor] = useState('#000000'); // Default black

  const toggleLabels = () => {
    setLabelsVisible(!areLabelsVisible);
  };

  const cleanupSceneAndPanels = () => {
    if (scene) {
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    }
    allMeshesRef.current = [];
    if (atomLabelRef.current) atomLabelRef.current.innerHTML = '';
    if (elementColorRef.current) elementColorRef.current.innerHTML = '';
    if (bondLabelRef.current) bondLabelRef.current.innerHTML = '';
  };

  useEffect(() => {
    cleanupSceneAndPanels();

    if (onSceneReady) onSceneReady(scene);

    let camera, renderer, labelRenderer, controls, labelControls;
    let previouslySelectedUI = null;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    allMeshesRef.current = [];

    // Add density cloud overlay canvas
    if (!densityCloudContainerRef.current) {
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = 10;
      overlay.id = 'density-cloud-overlay';
      containerRef.current.parentElement.appendChild(overlay);
      densityCloudContainerRef.current = overlay;
    }
    // Setup density cloud renderer
    if (!densityCloudRendererRef.current) {
      const renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setClearColor(0x000000, 0); // transparent
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      densityCloudContainerRef.current.appendChild(renderer.domElement);
      densityCloudRendererRef.current = renderer;
    }
    // Setup density cloud scene and camera
    if (!densityCloudSceneRef.current) {
      densityCloudSceneRef.current = new THREE.Scene();
    }
    if (!densityCloudCameraRef.current) {
      densityCloudCameraRef.current = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      densityCloudCameraRef.current.position.z = 10;
    }

    init();
    animate();

    function init() {
      scene.clear();

      scene.background = new THREE.Color(backgroundColor);

      const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // soft ambient light
      scene.add(ambientLight);

      // const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      // directionalLight.position.set(5, 10, 7.5);
      // directionalLight.castShadow = true;
      // directionalLight.shadow.mapSize.width = 1024;
      // directionalLight.shadow.mapSize.height = 1024;
      // scene.add(directionalLight);

      camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
      camera.position.z = 10;
      scene.add( camera );

      var light = new THREE.PointLight( 0xffffff, 1 );
      camera.add( light );

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(renderer.domElement);

      labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0px';
      labelContainerRef.current.innerHTML = "";
      labelContainerRef.current.appendChild(labelRenderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      labelControls = new OrbitControls(camera, labelRenderer.domElement);
      labelControls.enableDamping = true;

      molecules.forEach((molecule, idx) => {
        const sceneData = { scene };
        const meshInfo = renderSingleMolecule(molecule, sceneData, idx);
        allMeshesRef.current.push(meshInfo);
      });

      renderer.domElement.addEventListener('dblclick', onAtomDoubleClick);
    }

    function renderSingleMolecule(molecule, sceneData, moleculeIdx) {
      const { atoms, bonds, name } = molecule;
      const labels = [], atomMeshes = [], bondMeshes = [];
      const atomicRadii = { H: 0.2, C: 0.4, N: 0.35, O: 0.35 };
      const defaultRadius = 0.3;

      const atomSection = document.createElement('div');
      atomSection.innerHTML = `<h4>Atoms</h4>`;
      atomLabelRef.current.appendChild(atomSection);

      const elementSection = document.createElement('div');
      elementSection.innerHTML = `<h4>Elements</h4>`;
      elementColorRef.current.appendChild(elementSection);

      const bondSection = document.createElement('div');
      bondSection.innerHTML = `<h4>Bonds</h4>`;
      bondLabelRef.current.appendChild(bondSection);

      atoms.forEach((atom, index) => {
        const radius = atomicRadii[atom.elem] || defaultRadius;
        const color = CPK_COLORS[atom.elem] || CPK_COLORS.default;

        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 32, 32),
          new THREE.MeshPhongMaterial({ color })
        );
        sphere.position.set(atom.x, atom.y, atom.z);
        sceneData.scene.add(sphere);
        atomMeshes.push(sphere);

        sphere.userData = { isAtom: true, atomIndex: index };

        const label = createLabel(atom.elem, sphere);
        labels.push(label);
        sceneData.scene.add(label);

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '4px';
        wrapper.dataset.moleculeIdx = moleculeIdx;
        wrapper.dataset.atomIndex = index;
        wrapper.innerHTML = `<strong>Atom ${index + 1} (${atom.elem}): </strong>`;

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.value = atom.elem;
        labelInput.className = 'atom-table-input';
        labelInput.oninput = () => label.element.textContent = labelInput.value;
        wrapper.appendChild(labelInput);

        const atomRadiusInput = document.createElement('input');
        atomRadiusInput.type = 'number';
        atomRadiusInput.step = '0.05';
        atomRadiusInput.min = '0.01';
        atomRadiusInput.value = radius;
        atomRadiusInput.className = 'atom-table-input';
        atomRadiusInput.oninput = () => {
          const newRadius = parseFloat(atomRadiusInput.value);
          sphere.geometry.dispose();
          sphere.geometry = new THREE.SphereGeometry(newRadius, 32, 32);
        };
        wrapper.appendChild(document.createTextNode(' Radius: '));
        wrapper.appendChild(atomRadiusInput);

        atomSection.appendChild(wrapper);
      });

      const uniqueElements = [...new Set(atoms.map(a => a.elem))];
      uniqueElements.forEach(elem => {
        const color = CPK_COLORS[elem] || CPK_COLORS.default;
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '4px';
        const lbl = document.createElement('label');
        lbl.textContent = `${elem}: `;

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = color;
        colorInput.className = 'element-table-input';
        colorInput.oninput = () => {
          atomMeshes.forEach((mesh, i) => {
            if (atoms[i].elem === elem) {
              mesh.material.color.set(colorInput.value);
            }
          });
        };

        const radiusInput = document.createElement('input');
        radiusInput.type = 'number';
        radiusInput.step = '0.05';
        radiusInput.min = '0.01';
        radiusInput.value = atomicRadii[elem] || defaultRadius;
        radiusInput.className = 'element-table-input';
        radiusInput.oninput = () => {
          const newRadius = parseFloat(radiusInput.value);
          atomMeshes.forEach((mesh, i) => {
            if (atoms[i].elem === elem) {
              mesh.geometry.dispose();
              mesh.geometry = new THREE.SphereGeometry(newRadius, 32, 32);
            }
          });
        };

        wrapper.appendChild(lbl);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(document.createTextNode(' Radius: '));
        wrapper.appendChild(radiusInput);
        elementSection.appendChild(wrapper);
      });

      bonds.forEach((bond, index) => {
        const atom1 = atomMeshes[bond.startIdx];
        const atom2 = atomMeshes[bond.endIdx];
        const bondMaterial = new THREE.MeshPhongMaterial({ color: '#AAAAAA' });
        const start = atom1.position;
        const end = atom2.position;
        const distance = start.distanceTo(end);

        const bondMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, distance, 8),
          bondMaterial
        );
        bondMesh.position.copy(start).lerp(end, 0.5);
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        bondMesh.setRotationFromQuaternion(
          new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
        );
        sceneData.scene.add(bondMesh);
        bondMeshes.push(bondMesh);

        const bondLabel = createLabel(`B${index + 1}`, bondMesh);
        labels.push(bondLabel);
        sceneData.scene.add(bondLabel);

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '4px';
        wrapper.innerHTML = `<strong>Bond ${index + 1}:</strong>`;
        const bondInput = document.createElement('input');
        bondInput.type = 'text';
        bondInput.value = `B${index + 1}`;
        bondInput.className = 'bond-table-input';
        bondInput.oninput = () => bondLabel.element.textContent = bondInput.value;
        wrapper.appendChild(bondInput);
        bondSection.appendChild(wrapper);
      });

      return { atomMeshes, bondMeshes, labels };
    }

    function createLabel(text, target) {
      const div = document.createElement('div');
      div.className = 'label';
      div.textContent = text;

      div.style.background = 'rgba(255, 255, 255, 0.7)'; // semi-transparent white
      div.style.padding = '2px 4px';
      div.style.borderRadius = '4px';
      div.style.fontSize = '12px';
      div.style.color = '#000';
      div.style.whiteSpace = 'nowrap';

      const label = new CSS2DObject(div);
      label.position.copy(target.position);
      return label;
    }

    function onAtomDoubleClick(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);
      let found = false;
      allMeshesRef.current.forEach((meshInfo, molIdx) => {
        meshInfo.atomMeshes.forEach((atomMesh, atomIdx) => {
          if (!found && intersects.find(hit => hit.object === atomMesh)) {
            // Reset previous selection using ref
            if (previouslySelectedAtomRef.current) {
              previouslySelectedAtomRef.current.material.emissive.set(0x000000);
            }
            if (previouslySelectedUIRef.current) {
              previouslySelectedUIRef.current.classList.remove('selected-atom');
            }
            atomMesh.material.emissive = new THREE.Color(0xffff00);
            atomMesh.material.emissiveIntensity = 0.8;
            previouslySelectedAtomRef.current = atomMesh;
            const uiElement = atomLabelRef.current.querySelector(`[data-molecule-idx='${molIdx}'][data-atom-index='${atomIdx}']`);
            if (uiElement) {
              uiElement.classList.add('selected-atom');
              previouslySelectedUIRef.current = uiElement;
            }
            setSelected({ moleculeIdx: molIdx, atomIdx });
            focusOnAtom(atomMesh);
            found = true;
          }
        });
      });
    }

    function focusOnAtom(atomMesh) {
      const targetPosition = atomMesh.position.clone();
      const startPosition = camera.position.clone();
      const startRotation = controls.target.clone();
      const distance = camera.position.distanceTo(controls.target);
      const newCameraPos = targetPosition.clone().add(
        camera.position.clone().sub(controls.target).normalize().multiplyScalar(distance * 0.5)
      );

      const duration = 1000;
      const startTime = performance.now();

      function animateCamera(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        camera.position.lerpVectors(startPosition, newCameraPos, easeProgress);
        controls.target.lerpVectors(startRotation, targetPosition, easeProgress);
        labelControls.target.copy(controls.target);

        controls.update();
        labelControls.update();

        if (progress < 1) requestAnimationFrame(animateCamera);
      }

      requestAnimationFrame(animateCamera);
    }

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      labelControls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);

      allMeshesRef.current.forEach(({ atomMeshes, bondMeshes, labels }) => {
        atomMeshes.forEach((mesh, i) => labels[i].position.copy(mesh.position));
        bondMeshes.forEach((mesh, j) => labels[j + atomMeshes.length].position.copy(mesh.position));
      });

      // Render density cloud overlay if present
      if (densityCloudObjectRef.current) {
        // Sync camera
        densityCloudCameraRef.current.position.copy(camera.position);
        densityCloudCameraRef.current.rotation.copy(camera.rotation);
        densityCloudCameraRef.current.fov = camera.fov;
        densityCloudCameraRef.current.aspect = camera.aspect;
        densityCloudCameraRef.current.updateProjectionMatrix();
        densityCloudRendererRef.current.render(
          densityCloudSceneRef.current,
          densityCloudCameraRef.current
        );
      }
    }

    return () => {
      renderer.domElement.removeEventListener('dblclick', onAtomDoubleClick);
    };
  }, [molecules, onSceneReady]);

  useEffect(() => {
    if (!scene) return;

    allMeshesRef.current.forEach(({ labels }) => {
      labels.forEach(label => {
        if (areLabelsVisible) {
          scene.add(label);
        } else {
          scene.remove(label);
        }
      });
    });
  }, [areLabelsVisible, scene]);

  useEffect(() => {
    if (scene) {
      // Check if density cloud is present and background is white
      const isWhite = backgroundColor.toLowerCase() === '#fff' || backgroundColor.toLowerCase() === '#ffffff';
      const hasDensityCloud = typeof window !== 'undefined' && window.densityCloud && window.densityCloud.visible;
      if (hasDensityCloud && isWhite) {
        scene.background = new THREE.Color('#000000'); // Use black for density cloud visibility
      } else {
        scene.background = new THREE.Color(backgroundColor);
      }
    }
  }, [backgroundColor, scene]);

  // Helper to add density cloud to overlay scene
  const addDensityCloud = (pointsObject) => {
    if (densityCloudObjectRef.current) {
      densityCloudSceneRef.current.remove(densityCloudObjectRef.current);
    }
    densityCloudObjectRef.current = pointsObject;
    densityCloudSceneRef.current.add(pointsObject);
  };

  return (
    <div>
      <style>{`
        .selected-atom {
          background-color: yellow !important;
        }
        .atom-table-input, .element-table-input, .bond-table-input {
          width: 90px;
          min-width: 60px;
          max-width: 120px;
          box-sizing: border-box;
          margin-right: 6px;
        }
        .molecule-list-panel {
          border: 1px solid #ccc;
          padding: 8px;
          max-height: 220px;
          min-width: 180px;
          overflow-y: auto;
          margin-right: 12px;
          background: #fafbfc;
        }
        .molecule-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .delete-molecule-btn {
          background: #ff4d4f;
          color: #fff;
          border: none;
          border-radius: 3px;
          padding: 2px 10px;
          cursor: pointer;
          font-size: 13px;
        }
        .side-panel {
          border: 1px solid #ccc;
          padding: 8px;
          max-height: 220px;
          min-width: 180px;
          overflow-y: auto;
          margin-right: 12px;
          background: #fff;
        }
      `}</style>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {molecules && molecules.length > 0 && (
          <div id="ui-panels" style={{
              display: 'flex',
              flexDirection: 'row',
              position: 'relative',
              top: 0,
              left: 0,
              zIndex: 10,
            }}
          >
            {/* Molecule List Panel */}
            <div className="molecule-list-panel">
              <h4>Molecules</h4>
              {molecules.map((mol, idx) => (
                <div className="molecule-list-item" key={idx}>
                  <span style={{maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis'}}>{mol.name || `Molecule ${idx + 1}`}</span>
                  <button
                    className="delete-molecule-btn"
                    onClick={() => onDeleteMolecule(idx)}
                    title="Delete this molecule"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            {/* Existing panels */}
            <div id="elementColors" ref={elementColorRef} className="side-panel" />
            <div id="bondLabels" ref={bondLabelRef} className="side-panel" />
            <div id="atomLabels" ref={atomLabelRef} className="side-panel" />
          </div>
        )}
      </div>
      <div style={{ margin: 'auto' }}>
        <button onClick={toggleLabels} style={{ marginBottom: '10px' }}>
          {areLabelsVisible ? 'Hide Labels' : 'Show Labels'}
        </button>
        <div style={{ margin: '10px 0' }}>
          <label>
            Background Color: 
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              style={{ marginLeft: '8px' }}
            />
          </label>
        </div>
        <div ref={labelContainerRef} style={{position: 'absolute'}} />
        <div
          id="viewer"
          ref={containerRef}
          style={{
            width: '1100px',
            height: '600px',
            border: '1px solid #ddd',
            position: 'relative',
          }}
        >
        </div>
        {/* Overlay for density cloud */}
        <div ref={densityCloudContainerRef} style={{ position: 'absolute', top: 0, left: 0, width: '1100px', height: '600px', pointerEvents: 'none', zIndex: 20 }} />
      </div>
    </div>
  );
};

export default MoleculeViewer;


