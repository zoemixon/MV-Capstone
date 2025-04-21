import React, { useEffect, useRef } from 'react';

const CPK_COLORS = {
  H: '#FFFFFF', C: '#909090', O: '#FF0D0D', N: '#3050F8', S: '#FFFF30',
  P: '#FF8000', Cl: '#1FF01F', Br: '#A62929', I: '#940094', F: '#90E050',
  default: '#B0B0B0'
};

const UIPanelsOnly = ({ molecules, onChange }) => {
  const atomLabelRef = useRef();
  const elementColorRef = useRef();
  const bondLabelRef = useRef();

  useEffect(() => {
    // Clear previous UI
    atomLabelRef.current.innerHTML = '';
    elementColorRef.current.innerHTML = '';
    bondLabelRef.current.innerHTML = '';

    molecules.forEach((molecule, mIndex) => {
      const { atoms, bonds, name } = molecule;
      const atomicRadii = { H: 0.2, C: 0.4, N: 0.35, O: 0.35 };
      const defaultRadius = 0.3;

      // --- Atoms UI ---
      const atomSection = document.createElement('div');
      atomSection.innerHTML = `<h4>${name} Atoms</h4>`;
      atoms.forEach((atom, aIndex) => {
        const radius = atom.radius || atomicRadii[atom.elem] || defaultRadius;

        const wrapper = document.createElement('div');
        wrapper.dataset.atomIndex = aIndex;
        wrapper.innerHTML = `<strong>Atom ${aIndex + 1} (${atom.elem}): </strong>`;

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.value = atom.elem;
        labelInput.addEventListener('input', (e) => {
          const updated = JSON.parse(JSON.stringify(molecules));
          updated[mIndex].atoms[aIndex].elem = e.target.value;
          onChange(updated);
        });

        const radiusInput = document.createElement('input');
        radiusInput.type = 'number';
        radiusInput.step = '0.05';
        radiusInput.min = '0.01';
        radiusInput.value = radius;
        radiusInput.addEventListener('input', (e) => {
          const updated = JSON.parse(JSON.stringify(molecules));
          updated[mIndex].atoms[aIndex].radius = parseFloat(e.target.value);
          onChange(updated);
        });

        wrapper.appendChild(labelInput);
        wrapper.appendChild(document.createTextNode(' Radius: '));
        wrapper.appendChild(radiusInput);
        atomSection.appendChild(wrapper);
      });
      atomLabelRef.current.appendChild(atomSection);

      // --- Elements UI ---
      const elementSection = document.createElement('div');
      elementSection.innerHTML = `<h4>${name} Elements</h4>`;
      const uniqueElements = [...new Set(atoms.map(a => a.elem))];
      uniqueElements.forEach(elem => {
        const color = atoms.find(a => a.elem === elem)?.color || CPK_COLORS[elem] || CPK_COLORS.default;
        const radius = atoms.find(a => a.elem === elem)?.radius || atomicRadii[elem] || defaultRadius;

        const wrapper = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = `${elem}: `;

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = color;
        colorInput.addEventListener('input', (e) => {
          const updated = JSON.parse(JSON.stringify(molecules));
          updated[mIndex].atoms.forEach(atom => {
            if (atom.elem === elem) {
              atom.color = e.target.value;
            }
          });
          onChange(updated);
        });

        const radiusInput = document.createElement('input');
        radiusInput.type = 'number';
        radiusInput.step = '0.05';
        radiusInput.min = '0.01';
        radiusInput.value = radius;
        radiusInput.addEventListener('input', (e) => {
          const updated = JSON.parse(JSON.stringify(molecules));
          updated[mIndex].atoms.forEach(atom => {
            if (atom.elem === elem) {
              atom.radius = parseFloat(e.target.value);
            }
          });
          onChange(updated);
        });

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(document.createTextNode(' Radius: '));
        wrapper.appendChild(radiusInput);
        elementSection.appendChild(wrapper);
      });
      elementColorRef.current.appendChild(elementSection);

      // --- Bonds UI ---
      const bondSection = document.createElement('div');
      bondSection.innerHTML = `<h4>${name} Bonds</h4>`;
      bonds.forEach((bond, bIndex) => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `<strong>Bond ${bIndex + 1}:</strong> `;

        const bondInput = document.createElement('input');
        bondInput.type = 'text';
        bondInput.value = bond.label || `B${bIndex + 1}`;
        bondInput.addEventListener('input', (e) => {
          const updated = JSON.parse(JSON.stringify(molecules));
          updated[mIndex].bonds[bIndex].label = e.target.value;
          onChange(updated);
        });

        wrapper.appendChild(bondInput);
        bondSection.appendChild(wrapper);
      });
      bondLabelRef.current.appendChild(bondSection);
    });
  }, [molecules, onChange]);

  return (
    <div>
      <div id="ui-panels" style={{
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
        top: 0,
        left: 0,
        zIndex: 10,
      }}>
        <div ref={elementColorRef} style={panelStyle} />
        <div ref={bondLabelRef} style={panelStyle} />
        <div ref={atomLabelRef} style={panelStyle} />
      </div>
    </div>
  );
};

const panelStyle = {
  pointerEvents: 'auto',
  padding: '8px',
  maxHeight: '200px',
  overflowY: 'auto',
  overflowX: 'hidden',
  border: '1px solid #ccc',
  marginRight: '8px',
};

export default UIPanelsOnly;





