import { jsxs, jsx } from "react/jsx-runtime";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { EventDispatcher, Vector3, MOUSE, TOUCH, Spherical, Quaternion, Vector2, Matrix4, Object3D } from "three";
const _changeEvent = { type: "change" };
const _startEvent = { type: "start" };
const _endEvent = { type: "end" };
class OrbitControls extends EventDispatcher {
  constructor(object, domElement) {
    super();
    this.object = object;
    this.domElement = domElement;
    this.domElement.style.touchAction = "none";
    this.enabled = true;
    this.target = new Vector3();
    this.minDistance = 0;
    this.maxDistance = Infinity;
    this.minZoom = 0;
    this.maxZoom = Infinity;
    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;
    this.minAzimuthAngle = -Infinity;
    this.maxAzimuthAngle = Infinity;
    this.enableDamping = false;
    this.dampingFactor = 0.05;
    this.enableZoom = true;
    this.zoomSpeed = 1;
    this.enableRotate = true;
    this.rotateSpeed = 1;
    this.enablePan = true;
    this.panSpeed = 1;
    this.screenSpacePanning = true;
    this.keyPanSpeed = 7;
    this.autoRotate = false;
    this.autoRotateSpeed = 2;
    this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" };
    this.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };
    this.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };
    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.zoom0 = this.object.zoom;
    this._domElementKeyEvents = null;
    this.getPolarAngle = function() {
      return spherical.phi;
    };
    this.getAzimuthalAngle = function() {
      return spherical.theta;
    };
    this.getDistance = function() {
      return this.object.position.distanceTo(this.target);
    };
    this.listenToKeyEvents = function(domElement2) {
      domElement2.addEventListener("keydown", onKeyDown);
      this._domElementKeyEvents = domElement2;
    };
    this.stopListenToKeyEvents = function() {
      this._domElementKeyEvents.removeEventListener("keydown", onKeyDown);
      this._domElementKeyEvents = null;
    };
    this.saveState = function() {
      scope.target0.copy(scope.target);
      scope.position0.copy(scope.object.position);
      scope.zoom0 = scope.object.zoom;
    };
    this.reset = function() {
      scope.target.copy(scope.target0);
      scope.object.position.copy(scope.position0);
      scope.object.zoom = scope.zoom0;
      scope.object.updateProjectionMatrix();
      scope.dispatchEvent(_changeEvent);
      scope.update();
      state = STATE.NONE;
    };
    this.update = function() {
      const offset = new Vector3();
      const quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0));
      const quatInverse = quat.clone().invert();
      const lastPosition = new Vector3();
      const lastQuaternion = new Quaternion();
      const twoPI = 2 * Math.PI;
      return function update() {
        const position = scope.object.position;
        offset.copy(position).sub(scope.target);
        offset.applyQuaternion(quat);
        spherical.setFromVector3(offset);
        if (scope.autoRotate && state === STATE.NONE) {
          rotateLeft(getAutoRotationAngle());
        }
        if (scope.enableDamping) {
          spherical.theta += sphericalDelta.theta * scope.dampingFactor;
          spherical.phi += sphericalDelta.phi * scope.dampingFactor;
        } else {
          spherical.theta += sphericalDelta.theta;
          spherical.phi += sphericalDelta.phi;
        }
        let min = scope.minAzimuthAngle;
        let max = scope.maxAzimuthAngle;
        if (isFinite(min) && isFinite(max)) {
          if (min < -Math.PI) min += twoPI;
          else if (min > Math.PI) min -= twoPI;
          if (max < -Math.PI) max += twoPI;
          else if (max > Math.PI) max -= twoPI;
          if (min <= max) {
            spherical.theta = Math.max(min, Math.min(max, spherical.theta));
          } else {
            spherical.theta = spherical.theta > (min + max) / 2 ? Math.max(min, spherical.theta) : Math.min(max, spherical.theta);
          }
        }
        spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
        spherical.makeSafe();
        spherical.radius *= scale;
        spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));
        if (scope.enableDamping === true) {
          scope.target.addScaledVector(panOffset, scope.dampingFactor);
        } else {
          scope.target.add(panOffset);
        }
        offset.setFromSpherical(spherical);
        offset.applyQuaternion(quatInverse);
        position.copy(scope.target).add(offset);
        scope.object.lookAt(scope.target);
        if (scope.enableDamping === true) {
          sphericalDelta.theta *= 1 - scope.dampingFactor;
          sphericalDelta.phi *= 1 - scope.dampingFactor;
          panOffset.multiplyScalar(1 - scope.dampingFactor);
        } else {
          sphericalDelta.set(0, 0, 0);
          panOffset.set(0, 0, 0);
        }
        scale = 1;
        if (zoomChanged || lastPosition.distanceToSquared(scope.object.position) > EPS || 8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {
          scope.dispatchEvent(_changeEvent);
          lastPosition.copy(scope.object.position);
          lastQuaternion.copy(scope.object.quaternion);
          zoomChanged = false;
          return true;
        }
        return false;
      };
    }();
    this.dispose = function() {
      scope.domElement.removeEventListener("contextmenu", onContextMenu);
      scope.domElement.removeEventListener("pointerdown", onPointerDown);
      scope.domElement.removeEventListener("pointercancel", onPointerUp);
      scope.domElement.removeEventListener("wheel", onMouseWheel);
      scope.domElement.removeEventListener("pointermove", onPointerMove);
      scope.domElement.removeEventListener("pointerup", onPointerUp);
      if (scope._domElementKeyEvents !== null) {
        scope._domElementKeyEvents.removeEventListener("keydown", onKeyDown);
        scope._domElementKeyEvents = null;
      }
    };
    const scope = this;
    const STATE = {
      NONE: -1,
      ROTATE: 0,
      DOLLY: 1,
      PAN: 2,
      TOUCH_ROTATE: 3,
      TOUCH_PAN: 4,
      TOUCH_DOLLY_PAN: 5,
      TOUCH_DOLLY_ROTATE: 6
    };
    let state = STATE.NONE;
    const EPS = 1e-6;
    const spherical = new Spherical();
    const sphericalDelta = new Spherical();
    let scale = 1;
    const panOffset = new Vector3();
    let zoomChanged = false;
    const rotateStart = new Vector2();
    const rotateEnd = new Vector2();
    const rotateDelta = new Vector2();
    const panStart = new Vector2();
    const panEnd = new Vector2();
    const panDelta = new Vector2();
    const dollyStart = new Vector2();
    const dollyEnd = new Vector2();
    const dollyDelta = new Vector2();
    const pointers = [];
    const pointerPositions = {};
    function getAutoRotationAngle() {
      return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
    }
    function getZoomScale() {
      return Math.pow(0.95, scope.zoomSpeed);
    }
    function rotateLeft(angle) {
      sphericalDelta.theta -= angle;
    }
    function rotateUp(angle) {
      sphericalDelta.phi -= angle;
    }
    const panLeft = function() {
      const v = new Vector3();
      return function panLeft2(distance, objectMatrix) {
        v.setFromMatrixColumn(objectMatrix, 0);
        v.multiplyScalar(-distance);
        panOffset.add(v);
      };
    }();
    const panUp = function() {
      const v = new Vector3();
      return function panUp2(distance, objectMatrix) {
        if (scope.screenSpacePanning === true) {
          v.setFromMatrixColumn(objectMatrix, 1);
        } else {
          v.setFromMatrixColumn(objectMatrix, 0);
          v.crossVectors(scope.object.up, v);
        }
        v.multiplyScalar(distance);
        panOffset.add(v);
      };
    }();
    const pan = function() {
      const offset = new Vector3();
      return function pan2(deltaX, deltaY) {
        const element = scope.domElement;
        if (scope.object.isPerspectiveCamera) {
          const position = scope.object.position;
          offset.copy(position).sub(scope.target);
          let targetDistance = offset.length();
          targetDistance *= Math.tan(scope.object.fov / 2 * Math.PI / 180);
          panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
          panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);
        } else if (scope.object.isOrthographicCamera) {
          panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth, scope.object.matrix);
          panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight, scope.object.matrix);
        } else {
          console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.");
          scope.enablePan = false;
        }
      };
    }();
    function dollyOut(dollyScale) {
      if (scope.object.isPerspectiveCamera) {
        scale /= dollyScale;
      } else if (scope.object.isOrthographicCamera) {
        scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom * dollyScale));
        scope.object.updateProjectionMatrix();
        zoomChanged = true;
      } else {
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
        scope.enableZoom = false;
      }
    }
    function dollyIn(dollyScale) {
      if (scope.object.isPerspectiveCamera) {
        scale *= dollyScale;
      } else if (scope.object.isOrthographicCamera) {
        scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / dollyScale));
        scope.object.updateProjectionMatrix();
        zoomChanged = true;
      } else {
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
        scope.enableZoom = false;
      }
    }
    function handleMouseDownRotate(event) {
      rotateStart.set(event.clientX, event.clientY);
    }
    function handleMouseDownDolly(event) {
      dollyStart.set(event.clientX, event.clientY);
    }
    function handleMouseDownPan(event) {
      panStart.set(event.clientX, event.clientY);
    }
    function handleMouseMoveRotate(event) {
      rotateEnd.set(event.clientX, event.clientY);
      rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
      const element = scope.domElement;
      rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight);
      rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
      rotateStart.copy(rotateEnd);
      scope.update();
    }
    function handleMouseMoveDolly(event) {
      dollyEnd.set(event.clientX, event.clientY);
      dollyDelta.subVectors(dollyEnd, dollyStart);
      if (dollyDelta.y > 0) {
        dollyOut(getZoomScale());
      } else if (dollyDelta.y < 0) {
        dollyIn(getZoomScale());
      }
      dollyStart.copy(dollyEnd);
      scope.update();
    }
    function handleMouseMovePan(event) {
      panEnd.set(event.clientX, event.clientY);
      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
      pan(panDelta.x, panDelta.y);
      panStart.copy(panEnd);
      scope.update();
    }
    function handleMouseWheel(event) {
      if (event.deltaY < 0) {
        dollyIn(getZoomScale());
      } else if (event.deltaY > 0) {
        dollyOut(getZoomScale());
      }
      scope.update();
    }
    function handleKeyDown(event) {
      let needsUpdate = false;
      switch (event.code) {
        case scope.keys.UP:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            rotateUp(2 * Math.PI * scope.rotateSpeed / scope.domElement.clientHeight);
          } else {
            pan(0, scope.keyPanSpeed);
          }
          needsUpdate = true;
          break;
        case scope.keys.BOTTOM:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            rotateUp(-2 * Math.PI * scope.rotateSpeed / scope.domElement.clientHeight);
          } else {
            pan(0, -scope.keyPanSpeed);
          }
          needsUpdate = true;
          break;
        case scope.keys.LEFT:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            rotateLeft(2 * Math.PI * scope.rotateSpeed / scope.domElement.clientHeight);
          } else {
            pan(scope.keyPanSpeed, 0);
          }
          needsUpdate = true;
          break;
        case scope.keys.RIGHT:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            rotateLeft(-2 * Math.PI * scope.rotateSpeed / scope.domElement.clientHeight);
          } else {
            pan(-scope.keyPanSpeed, 0);
          }
          needsUpdate = true;
          break;
      }
      if (needsUpdate) {
        event.preventDefault();
        scope.update();
      }
    }
    function handleTouchStartRotate() {
      if (pointers.length === 1) {
        rotateStart.set(pointers[0].pageX, pointers[0].pageY);
      } else {
        const x = 0.5 * (pointers[0].pageX + pointers[1].pageX);
        const y = 0.5 * (pointers[0].pageY + pointers[1].pageY);
        rotateStart.set(x, y);
      }
    }
    function handleTouchStartPan() {
      if (pointers.length === 1) {
        panStart.set(pointers[0].pageX, pointers[0].pageY);
      } else {
        const x = 0.5 * (pointers[0].pageX + pointers[1].pageX);
        const y = 0.5 * (pointers[0].pageY + pointers[1].pageY);
        panStart.set(x, y);
      }
    }
    function handleTouchStartDolly() {
      const dx = pointers[0].pageX - pointers[1].pageX;
      const dy = pointers[0].pageY - pointers[1].pageY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      dollyStart.set(0, distance);
    }
    function handleTouchStartDollyPan() {
      if (scope.enableZoom) handleTouchStartDolly();
      if (scope.enablePan) handleTouchStartPan();
    }
    function handleTouchStartDollyRotate() {
      if (scope.enableZoom) handleTouchStartDolly();
      if (scope.enableRotate) handleTouchStartRotate();
    }
    function handleTouchMoveRotate(event) {
      if (pointers.length == 1) {
        rotateEnd.set(event.pageX, event.pageY);
      } else {
        const position = getSecondPointerPosition(event);
        const x = 0.5 * (event.pageX + position.x);
        const y = 0.5 * (event.pageY + position.y);
        rotateEnd.set(x, y);
      }
      rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);
      const element = scope.domElement;
      rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight);
      rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
      rotateStart.copy(rotateEnd);
    }
    function handleTouchMovePan(event) {
      if (pointers.length === 1) {
        panEnd.set(event.pageX, event.pageY);
      } else {
        const position = getSecondPointerPosition(event);
        const x = 0.5 * (event.pageX + position.x);
        const y = 0.5 * (event.pageY + position.y);
        panEnd.set(x, y);
      }
      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
      pan(panDelta.x, panDelta.y);
      panStart.copy(panEnd);
    }
    function handleTouchMoveDolly(event) {
      const position = getSecondPointerPosition(event);
      const dx = event.pageX - position.x;
      const dy = event.pageY - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      dollyEnd.set(0, distance);
      dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed));
      dollyOut(dollyDelta.y);
      dollyStart.copy(dollyEnd);
    }
    function handleTouchMoveDollyPan(event) {
      if (scope.enableZoom) handleTouchMoveDolly(event);
      if (scope.enablePan) handleTouchMovePan(event);
    }
    function handleTouchMoveDollyRotate(event) {
      if (scope.enableZoom) handleTouchMoveDolly(event);
      if (scope.enableRotate) handleTouchMoveRotate(event);
    }
    function onPointerDown(event) {
      if (scope.enabled === false) return;
      if (pointers.length === 0) {
        scope.domElement.setPointerCapture(event.pointerId);
        scope.domElement.addEventListener("pointermove", onPointerMove);
        scope.domElement.addEventListener("pointerup", onPointerUp);
      }
      addPointer(event);
      if (event.pointerType === "touch") {
        onTouchStart(event);
      } else {
        onMouseDown(event);
      }
    }
    function onPointerMove(event) {
      if (scope.enabled === false) return;
      if (event.pointerType === "touch") {
        onTouchMove(event);
      } else {
        onMouseMove(event);
      }
    }
    function onPointerUp(event) {
      removePointer(event);
      if (pointers.length === 0) {
        scope.domElement.releasePointerCapture(event.pointerId);
        scope.domElement.removeEventListener("pointermove", onPointerMove);
        scope.domElement.removeEventListener("pointerup", onPointerUp);
      }
      scope.dispatchEvent(_endEvent);
      state = STATE.NONE;
    }
    function onMouseDown(event) {
      let mouseAction;
      switch (event.button) {
        case 0:
          mouseAction = scope.mouseButtons.LEFT;
          break;
        case 1:
          mouseAction = scope.mouseButtons.MIDDLE;
          break;
        case 2:
          mouseAction = scope.mouseButtons.RIGHT;
          break;
        default:
          mouseAction = -1;
      }
      switch (mouseAction) {
        case MOUSE.DOLLY:
          if (scope.enableZoom === false) return;
          handleMouseDownDolly(event);
          state = STATE.DOLLY;
          break;
        case MOUSE.ROTATE:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            if (scope.enablePan === false) return;
            handleMouseDownPan(event);
            state = STATE.PAN;
          } else {
            if (scope.enableRotate === false) return;
            handleMouseDownRotate(event);
            state = STATE.ROTATE;
          }
          break;
        case MOUSE.PAN:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            if (scope.enableRotate === false) return;
            handleMouseDownRotate(event);
            state = STATE.ROTATE;
          } else {
            if (scope.enablePan === false) return;
            handleMouseDownPan(event);
            state = STATE.PAN;
          }
          break;
        default:
          state = STATE.NONE;
      }
      if (state !== STATE.NONE) {
        scope.dispatchEvent(_startEvent);
      }
    }
    function onMouseMove(event) {
      switch (state) {
        case STATE.ROTATE:
          if (scope.enableRotate === false) return;
          handleMouseMoveRotate(event);
          break;
        case STATE.DOLLY:
          if (scope.enableZoom === false) return;
          handleMouseMoveDolly(event);
          break;
        case STATE.PAN:
          if (scope.enablePan === false) return;
          handleMouseMovePan(event);
          break;
      }
    }
    function onMouseWheel(event) {
      if (scope.enabled === false || scope.enableZoom === false || state !== STATE.NONE) return;
      event.preventDefault();
      scope.dispatchEvent(_startEvent);
      handleMouseWheel(event);
      scope.dispatchEvent(_endEvent);
    }
    function onKeyDown(event) {
      if (scope.enabled === false || scope.enablePan === false) return;
      handleKeyDown(event);
    }
    function onTouchStart(event) {
      trackPointer(event);
      switch (pointers.length) {
        case 1:
          switch (scope.touches.ONE) {
            case TOUCH.ROTATE:
              if (scope.enableRotate === false) return;
              handleTouchStartRotate();
              state = STATE.TOUCH_ROTATE;
              break;
            case TOUCH.PAN:
              if (scope.enablePan === false) return;
              handleTouchStartPan();
              state = STATE.TOUCH_PAN;
              break;
            default:
              state = STATE.NONE;
          }
          break;
        case 2:
          switch (scope.touches.TWO) {
            case TOUCH.DOLLY_PAN:
              if (scope.enableZoom === false && scope.enablePan === false) return;
              handleTouchStartDollyPan();
              state = STATE.TOUCH_DOLLY_PAN;
              break;
            case TOUCH.DOLLY_ROTATE:
              if (scope.enableZoom === false && scope.enableRotate === false) return;
              handleTouchStartDollyRotate();
              state = STATE.TOUCH_DOLLY_ROTATE;
              break;
            default:
              state = STATE.NONE;
          }
          break;
        default:
          state = STATE.NONE;
      }
      if (state !== STATE.NONE) {
        scope.dispatchEvent(_startEvent);
      }
    }
    function onTouchMove(event) {
      trackPointer(event);
      switch (state) {
        case STATE.TOUCH_ROTATE:
          if (scope.enableRotate === false) return;
          handleTouchMoveRotate(event);
          scope.update();
          break;
        case STATE.TOUCH_PAN:
          if (scope.enablePan === false) return;
          handleTouchMovePan(event);
          scope.update();
          break;
        case STATE.TOUCH_DOLLY_PAN:
          if (scope.enableZoom === false && scope.enablePan === false) return;
          handleTouchMoveDollyPan(event);
          scope.update();
          break;
        case STATE.TOUCH_DOLLY_ROTATE:
          if (scope.enableZoom === false && scope.enableRotate === false) return;
          handleTouchMoveDollyRotate(event);
          scope.update();
          break;
        default:
          state = STATE.NONE;
      }
    }
    function onContextMenu(event) {
      if (scope.enabled === false) return;
      event.preventDefault();
    }
    function addPointer(event) {
      pointers.push(event);
    }
    function removePointer(event) {
      delete pointerPositions[event.pointerId];
      for (let i = 0; i < pointers.length; i++) {
        if (pointers[i].pointerId == event.pointerId) {
          pointers.splice(i, 1);
          return;
        }
      }
    }
    function trackPointer(event) {
      let position = pointerPositions[event.pointerId];
      if (position === void 0) {
        position = new Vector2();
        pointerPositions[event.pointerId] = position;
      }
      position.set(event.pageX, event.pageY);
    }
    function getSecondPointerPosition(event) {
      const pointer = event.pointerId === pointers[0].pointerId ? pointers[1] : pointers[0];
      return pointerPositions[pointer.pointerId];
    }
    scope.domElement.addEventListener("contextmenu", onContextMenu);
    scope.domElement.addEventListener("pointerdown", onPointerDown);
    scope.domElement.addEventListener("pointercancel", onPointerUp);
    scope.domElement.addEventListener("wheel", onMouseWheel, { passive: false });
    this.update();
  }
}
class CSS2DObject extends Object3D {
  constructor(element = document.createElement("div")) {
    super();
    this.isCSS2DObject = true;
    this.element = element;
    this.element.style.position = "absolute";
    this.element.style.userSelect = "none";
    this.element.setAttribute("draggable", false);
    this.center = new Vector2(0.5, 0.5);
    this.addEventListener("removed", function() {
      this.traverse(function(object) {
        if (object.element instanceof Element && object.element.parentNode !== null) {
          object.element.parentNode.removeChild(object.element);
        }
      });
    });
  }
  copy(source, recursive) {
    super.copy(source, recursive);
    this.element = source.element.cloneNode(true);
    this.center = source.center;
    return this;
  }
}
const _vector = new Vector3();
const _viewMatrix = new Matrix4();
const _viewProjectionMatrix = new Matrix4();
const _a = new Vector3();
const _b = new Vector3();
class CSS2DRenderer {
  constructor(parameters = {}) {
    const _this = this;
    let _width, _height;
    let _widthHalf, _heightHalf;
    const cache = {
      objects: /* @__PURE__ */ new WeakMap()
    };
    const domElement = parameters.element !== void 0 ? parameters.element : document.createElement("div");
    domElement.style.overflow = "hidden";
    this.domElement = domElement;
    this.getSize = function() {
      return {
        width: _width,
        height: _height
      };
    };
    this.render = function(scene, camera) {
      if (scene.matrixWorldAutoUpdate === true) scene.updateMatrixWorld();
      if (camera.parent === null && camera.matrixWorldAutoUpdate === true) camera.updateMatrixWorld();
      _viewMatrix.copy(camera.matrixWorldInverse);
      _viewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, _viewMatrix);
      renderObject(scene, scene, camera);
      zOrder(scene);
    };
    this.setSize = function(width, height) {
      _width = width;
      _height = height;
      _widthHalf = _width / 2;
      _heightHalf = _height / 2;
      domElement.style.width = width + "px";
      domElement.style.height = height + "px";
    };
    function renderObject(object, scene, camera) {
      if (object.isCSS2DObject) {
        _vector.setFromMatrixPosition(object.matrixWorld);
        _vector.applyMatrix4(_viewProjectionMatrix);
        const visible = object.visible === true && (_vector.z >= -1 && _vector.z <= 1) && object.layers.test(camera.layers) === true;
        object.element.style.display = visible === true ? "" : "none";
        if (visible === true) {
          object.onBeforeRender(_this, scene, camera);
          const element = object.element;
          element.style.transform = "translate(" + -100 * object.center.x + "%," + -100 * object.center.y + "%)translate(" + (_vector.x * _widthHalf + _widthHalf) + "px," + (-_vector.y * _heightHalf + _heightHalf) + "px)";
          if (element.parentNode !== domElement) {
            domElement.appendChild(element);
          }
          object.onAfterRender(_this, scene, camera);
        }
        const objectData = {
          distanceToCameraSquared: getDistanceToSquared(camera, object)
        };
        cache.objects.set(object, objectData);
      }
      for (let i = 0, l = object.children.length; i < l; i++) {
        renderObject(object.children[i], scene, camera);
      }
    }
    function getDistanceToSquared(object1, object2) {
      _a.setFromMatrixPosition(object1.matrixWorld);
      _b.setFromMatrixPosition(object2.matrixWorld);
      return _a.distanceToSquared(_b);
    }
    function filterAndFlatten(scene) {
      const result = [];
      scene.traverse(function(object) {
        if (object.isCSS2DObject) result.push(object);
      });
      return result;
    }
    function zOrder(scene) {
      const sorted = filterAndFlatten(scene).sort(function(a, b) {
        if (a.renderOrder !== b.renderOrder) {
          return b.renderOrder - a.renderOrder;
        }
        const distanceA = cache.objects.get(a).distanceToCameraSquared;
        const distanceB = cache.objects.get(b).distanceToCameraSquared;
        return distanceA - distanceB;
      });
      const zMax = sorted.length;
      for (let i = 0, l = sorted.length; i < l; i++) {
        sorted[i].element.style.zIndex = zMax - i;
      }
    }
  }
}
const CPK_COLORS = {
  H: "#FFFFFF",
  C: "#909090",
  O: "#FF0D0D",
  N: "#3050F8",
  S: "#FFFF30",
  P: "#FF8000",
  Cl: "#1FF01F",
  Br: "#A62929",
  I: "#940094",
  F: "#90E050",
  default: "#B0B0B0"
};

const MoleculeViewer = ({ molecules, onSceneReady }) => {
  const containerRef = useRef();
  const labelContainerRef = useRef();
  const atomLabelRef = useRef();
  const elementColorRef = useRef();
  const bondLabelRef = useRef();
  const allMeshesRef = useRef([]);
  const previouslySelectedAtomRef = useRef(null);
  const previouslySelectedUIRef = useRef(null);
  const [scene, setScene] = useState(new THREE.Scene());
  const [selected, setSelected] = useState({ moleculeIdx: null, atomIdx: null });
  const [areLabelsVisible, setLabelsVisible] = useState(true);
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
    if (atomLabelRef.current) atomLabelRef.current.innerHTML = "";
    if (elementColorRef.current) elementColorRef.current.innerHTML = "";
    if (bondLabelRef.current) bondLabelRef.current.innerHTML = "";
  };
  useEffect(() => {

    if (onSceneReady) onSceneReady(scene);

    let camera, renderer, labelRenderer, controls, labelControls;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    allMeshesRef.current = [];
    init();
    animate();
    function init() {
      scene.clear();
      const ambientLight = new THREE.AmbientLight(4210752, 1.5);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(16777215, 1);
      directionalLight.position.set(5, 10, 7.5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      scene.add(directionalLight);
      camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1e3);
      camera.position.z = 10;
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(renderer.domElement);
      labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      labelRenderer.domElement.style.position = "absolute";
      labelRenderer.domElement.style.top = "0px";
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
      renderer.domElement.addEventListener("dblclick", onAtomDoubleClick);
    }
    function renderSingleMolecule(molecule, sceneData, moleculeIdx) {
      const { atoms, bonds, name } = molecule;
      const labels = [], atomMeshes = [], bondMeshes = [];
      const atomicRadii = { H: 0.2, C: 0.4, N: 0.35, O: 0.35 };
      const defaultRadius = 0.3;
      const atomSection = document.createElement("div");
      atomSection.innerHTML = `<h4>Atoms</h4>`;
      atomLabelRef.current.appendChild(atomSection);
      const elementSection = document.createElement("div");
      elementSection.innerHTML = `<h4>Elements</h4>`;
      elementColorRef.current.appendChild(elementSection);
      const bondSection = document.createElement("div");
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
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "4px";
        wrapper.dataset.moleculeIdx = moleculeIdx;
        wrapper.dataset.atomIndex = index;
        wrapper.innerHTML = `<strong>Atom ${index + 1} (${atom.elem}): </strong>`;
        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.value = atom.elem;
        labelInput.className = "atom-table-input";
        labelInput.oninput = () => label.element.textContent = labelInput.value;
        wrapper.appendChild(labelInput);
        const atomRadiusInput = document.createElement("input");
        atomRadiusInput.type = "number";
        atomRadiusInput.step = "0.05";
        atomRadiusInput.min = "0.01";
        atomRadiusInput.value = radius;
        atomRadiusInput.className = "atom-table-input";
        atomRadiusInput.oninput = () => {
          const newRadius = parseFloat(atomRadiusInput.value);
          sphere.geometry.dispose();
          sphere.geometry = new THREE.SphereGeometry(newRadius, 32, 32);
        };
        wrapper.appendChild(document.createTextNode(" Radius: "));
        wrapper.appendChild(atomRadiusInput);
        atomSection.appendChild(wrapper);
      });
      const uniqueElements = [...new Set(atoms.map((a) => a.elem))];
      uniqueElements.forEach((elem) => {
        const color = CPK_COLORS[elem] || CPK_COLORS.default;
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "4px";
        const lbl = document.createElement("label");
        lbl.textContent = `${elem}: `;
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = color;
        colorInput.className = "element-table-input";
        colorInput.oninput = () => {
          atomMeshes.forEach((mesh, i) => {
            if (atoms[i].elem === elem) {
              mesh.material.color.set(colorInput.value);
            }
          });
        };
        const radiusInput = document.createElement("input");
        radiusInput.type = "number";
        radiusInput.step = "0.05";
        radiusInput.min = "0.01";
        radiusInput.value = atomicRadii[elem] || defaultRadius;
        radiusInput.className = "element-table-input";
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
        wrapper.appendChild(document.createTextNode(" Radius: "));
        wrapper.appendChild(radiusInput);
        elementSection.appendChild(wrapper);
      });
      bonds.forEach((bond, index) => {
        const atom1 = atomMeshes[bond.startIdx];
        const atom2 = atomMeshes[bond.endIdx];
        const bondMaterial = new THREE.MeshPhongMaterial({ color: "#AAAAAA" });
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
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "4px";
        wrapper.innerHTML = `<strong>Bond ${index + 1}:</strong>`;
        const bondInput = document.createElement("input");
        bondInput.type = "text";
        bondInput.value = `B${index + 1}`;
        bondInput.className = "bond-table-input";
        bondInput.oninput = () => bondLabel.element.textContent = bondInput.value;
        wrapper.appendChild(bondInput);
        bondSection.appendChild(wrapper);
      });
      return { atomMeshes, bondMeshes, labels };
    }
    function createLabel(text, target) {
      const div = document.createElement("div");
      div.className = "label";
      div.textContent = text;
      div.style.background = "rgba(255, 255, 255, 0.7)";
      div.style.padding = "2px 4px";
      div.style.borderRadius = "4px";
      div.style.fontSize = "12px";
      div.style.color = "#000";
      div.style.whiteSpace = "nowrap";
      const label = new CSS2DObject(div);
      label.position.copy(target.position);
      return label;
    }
    function onAtomDoubleClick(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = (event.clientX - rect.left) / rect.width * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);
      let found = false;
      allMeshesRef.current.forEach((meshInfo, molIdx) => {
        meshInfo.atomMeshes.forEach((atomMesh, atomIdx) => {
          if (!found && intersects.find((hit) => hit.object === atomMesh)) {
            if (previouslySelectedAtomRef.current) {
              previouslySelectedAtomRef.current.material.emissive.set(0);
            }
            if (previouslySelectedUIRef.current) {
              previouslySelectedUIRef.current.classList.remove("selected-atom");
            }
            atomMesh.material.emissive = new THREE.Color(16776960);
            atomMesh.material.emissiveIntensity = 0.8;
            previouslySelectedAtomRef.current = atomMesh;
            const uiElement = atomLabelRef.current.querySelector(`[data-molecule-idx='${molIdx}'][data-atom-index='${atomIdx}']`);
            if (uiElement) {
              uiElement.classList.add("selected-atom");
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
      const duration = 1e3;
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
    }
    return () => {
      renderer.domElement.removeEventListener("dblclick", onAtomDoubleClick);
    };
  }, [molecules, onSceneReady]);
  useEffect(() => {
    if (!scene) return;
    allMeshesRef.current.forEach(({ labels }) => {
      labels.forEach((label) => {
        if (areLabelsVisible) {
          scene.add(label);
        } else {
          scene.remove(label);
        }
      });
    });
  }, [areLabelsVisible, scene]);
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("style", { children: `
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
      ` }),
    /* @__PURE__ */ jsx("div", { style: { position: "relative", width: "100%", height: "100%" }, children: molecules && molecules.length > 0 && /* @__PURE__ */ jsxs(
      "div",
      {
        id: "ui-panels",
        style: {
          display: "flex",
          flexDirection: "row",
          position: "relative",
          top: 0,
          left: 0,
          zIndex: 10
        },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "molecule-list-panel", children: [
            /* @__PURE__ */ jsx("h4", { children: "Molecules" }),
            molecules.map((mol, idx) => /* @__PURE__ */ jsxs("div", { className: "molecule-list-item", children: [
              /* @__PURE__ */ jsx("span", { style: { maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis" }, children: mol.name || `Molecule ${idx + 1}` }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "delete-molecule-btn",
                  onClick: () => onDeleteMolecule(idx),
                  title: "Delete this molecule",
                  children: "Delete"
                }
              )
            ] }, idx))
          ] }),
          /* @__PURE__ */ jsx("div", { id: "elementColors", ref: elementColorRef, className: "side-panel" }),
          /* @__PURE__ */ jsx("div", { id: "bondLabels", ref: bondLabelRef, className: "side-panel" }),
          /* @__PURE__ */ jsx("div", { id: "atomLabels", ref: atomLabelRef, className: "side-panel" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { style: { margin: "auto" }, children: [
      /* @__PURE__ */ jsx("button", { onClick: toggleLabels, style: { marginBottom: "10px" }, children: areLabelsVisible ? "Hide Labels" : "Show Labels" }),
      /* @__PURE__ */ jsx("div", { ref: labelContainerRef, style: { position: "absolute" } }),
      /* @__PURE__ */ jsx(
        "div",
        {
          id: "viewer",
          ref: containerRef,
          style: {
            width: "1100px",
            height: "600px",
            border: "1px solid #ddd",
            position: "relative"
          }
        }
      )
    ] })
  ] });
};
function parseMol(molData) {
  const lines = molData.split("\n");
  const atomCount = parseInt(lines[3].substr(0, 3).trim());
  const bondCount = parseInt(lines[3].substr(3, 3).trim());
  const atoms = [], bonds = [];
  for (let i = 4; i < 4 + atomCount; i++) {
    const line = lines[i].trim().split(/\s+/);
    atoms.push({
      x: parseFloat(line[0]),
      y: parseFloat(line[1]),
      z: parseFloat(line[2]),
      elem: line[3]
    });
  }
  for (let i = 4 + atomCount; i < 4 + atomCount + bondCount; i++) {
    const line = lines[i].trim().split(/\s+/);
    bonds.push({
      startIdx: parseInt(line[0]) - 1,
      endIdx: parseInt(line[1]) - 1
    });
  }
  return { atoms, bonds };
}
function parseSdf(sdfData, fileName) {
  const chunks = sdfData.split("$$$$\n").filter((mol) => mol.trim());
  if (chunks.length === 0) return [{ atoms: [], bonds: [], name: fileName }];
  return chunks.map((mol, idx) => {
    const parsed = parseMol(mol);
    parsed.name = chunks.length > 1 ? `Molecule ${idx + 1}` : fileName;
    return parsed;
  });
}
function parseXyz(xyzData) {
  const lines = xyzData.split("\n").filter((line) => line.trim() !== "");
  const numAtoms = parseInt(lines[0].trim(), 10);
  const atoms = [];
  for (let i = 2; i < lines.length && atoms.length < numAtoms; i++) {
    const tokens = lines[i].trim().split(/\s+/);
    if (tokens.length >= 4) {
      const elem = tokens[0];
      const x = parseFloat(tokens[1]);
      const y = parseFloat(tokens[2]);
      const z = parseFloat(tokens[3]);
      atoms.push({ elem, x, y, z });
    }
  }
  return { atoms, bonds: [] };
}
function getElementSymbol(atomicNumber) {
  const symbols = [
    "",
    "H",
    "He",
    "Li",
    "Be",
    "B",
    "C",
    "N",
    "O",
    "F",
    "Ne",
    "Na",
    "Mg",
    "Al",
    "Si",
    "P",
    "S",
    "Cl",
    "Ar",
    "K",
    "Ca",
    "Sc",
    "Ti",
    "V",
    "Cr",
    "Mn",
    "Fe",
    "Co",
    "Ni",
    "Cu",
    "Zn",
    "Ga",
    "Ge",
    "As",
    "Se",
    "Br",
    "Kr",
    "Rb",
    "Sr",
    "Y",
    "Zr",
    "Nb",
    "Mo",
    "Tc",
    "Ru",
    "Rh",
    "Pd",
    "Ag",
    "Cd",
    "In",
    "Sn",
    "Sb",
    "Te",
    "I",
    "Xe",
    "Cs",
    "Ba",
    "La",
    "Ce",
    "Pr",
    "Nd",
    "Pm",
    "Sm",
    "Eu",
    "Gd",
    "Tb",
    "Dy",
    "Ho",
    "Er",
    "Tm",
    "Yb",
    "Lu",
    "Hf",
    "Ta",
    "W",
    "Re",
    "Os",
    "Ir",
    "Pt",
    "Au",
    "Hg",
    "Tl",
    "Pb",
    "Bi",
    "Po",
    "At",
    "Rn",
    "Fr",
    "Ra",
    "Ac",
    "Th",
    "Pa",
    "U",
    "Np",
    "Pu",
    "Am",
    "Cm",
    "Bk",
    "Cf",
    "Es",
    "Fm",
    "Md",
    "No",
    "Lr",
    "Rf",
    "Db",
    "Sg",
    "Bh",
    "Hs",
    "Mt",
    "Ds",
    "Rg",
    "Cn",
    "Fl",
    "Lv",
    "Ts",
    "Og"
  ];
  return symbols[atomicNumber] || "?";
}
function parseCub(cubData) {
  const lines = cubData.split("\n");
  if (lines.length < 6) return { atoms: [], bonds: [], densityData: [], dimensions: {} };
  const atomCountLine = lines[2].trim().split(/\s+/);
  const atomCount = Math.abs(parseInt(atomCountLine[0]));
  const origin = {
    x: parseFloat(atomCountLine[1]),
    y: parseFloat(atomCountLine[2]),
    z: parseFloat(atomCountLine[3])
  };
  const voxelX = lines[3].trim().split(/\s+/);
  const voxelY = lines[4].trim().split(/\s+/);
  const voxelZ = lines[5].trim().split(/\s+/);
  const nx = parseInt(voxelX[0]);
  const ny = parseInt(voxelY[0]);
  const nz = parseInt(voxelZ[0]);
  const voxelSize = {
    x: parseFloat(voxelX[1]),
    y: parseFloat(voxelY[2]),
    z: parseFloat(voxelZ[3])
  };
  const atoms = [];
  let lineIndex = 6;
  for (let i = 0; i < atomCount; i++) {
    const parts = lines[lineIndex++].trim().split(/\s+/);
    if (parts.length < 5) continue;
    const atomicNumber = parseInt(parts[0]);
    const x = parseFloat(parts[2]);
    const y = parseFloat(parts[3]);
    const z = parseFloat(parts[4]);
    atoms.push({ x, y, z, elem: getElementSymbol(atomicNumber) });
  }
  const rawValues = [];
  while (lineIndex < lines.length) {
    const nums = lines[lineIndex++].trim().split(/\s+/);
    nums.forEach((n) => {
      const v = parseFloat(n);
      if (!isNaN(v)) rawValues.push(v);
    });
  }
  const densityData = Array.from(
    { length: nx },
    () => Array.from({ length: ny }, () => Array(nz).fill(0))
  );
  let idx = 0;
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let iz = 0; iz < nz; iz++) {
        densityData[ix][iy][iz] = rawValues[idx++];
      }
    }
  }
  const bonds = [];
  const bondThresholdSq = 3 * 3;
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const dx = atoms[i].x - atoms[j].x;
      const dy = atoms[i].y - atoms[j].y;
      const dz = atoms[i].z - atoms[j].z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < bondThresholdSq) {
        bonds.push({ startIdx: i, endIdx: j });
      }
    }
  }
  return {
    atoms,
    bonds,
    densityData,
    dimensions: { nx, ny, nz, origin, voxelSize }
  };
}
function renderDensityCloud(scene, densityData, dimensions, positiveThreshold = 1e-3, negativeThreshold = 1e-3) {
  if (window.densityCloud) {
    scene.remove(window.densityCloud);
    window.densityCloud.geometry.dispose();
    window.densityCloud.material.dispose();
  }
  const { nx, ny, nz, origin, voxelSize } = dimensions;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  for (let x = 0; x < nx; x++) {
    for (let y = 0; y < ny; y++) {
      for (let z = 0; z < nz; z++) {
        const value = densityData[x][y][z];
        if (value > 0 && value < positiveThreshold) continue;
        if (value < 0 && Math.abs(value) < negativeThreshold) continue;
        if (Math.abs(value) < 1e-5) continue;
        const px = origin.x + x * voxelSize.x;
        const py = origin.y + y * voxelSize.y;
        const pz = origin.z + z * voxelSize.z;
        positions.push(px, py, pz);
        colors.push(value > 0 ? 1 : 0, 0, value < 0 ? 1 : 0);
      }
    }
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const cloud = new THREE.Points(geometry, material);
  scene.add(cloud);
  window.densityCloud = cloud;
}

const FileParser = ({ file, onParsed, scene }) => {
  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      let newMolecules = [];
      if (file.name.endsWith(".mol")) {
        newMolecules = [parseMol(content)];
      } else if (file.name.endsWith(".sdf")) {
        newMolecules = parseSdf(content);
      } else if (file.name.endsWith(".xyz")) {
        newMolecules = [parseXyz(content)];
      } else if (file.name.endsWith(".cub") || file.name.endsWith(".cube")) {
        const parsed = parseCub(content);
        const { atoms, bonds, densityData, dimensions } = parsed;
        newMolecules = [{
          atoms,
          bonds,
          name: file.name,
          source: "file",
          visible: true,
          labelsVisible: false
        }];
        setTimeout(() => {
          if (scene) {
            renderDensityCloud(scene, densityData, dimensions);
            console.log("Density cloud rendered for", file.name);
          } else {
            console.warn("Scene not available for density rendering");
          }
        }, 500);
      } else {
        console.error("Unsupported file type:", file.name);
        return;
      }
      newMolecules.forEach((mol) => {
        mol.source = "file";
        mol.visible = mol.visible ?? true;
        mol.labelsVisible = mol.labelsVisible ?? false;
      });
      onParsed(newMolecules);
    };
    reader.readAsText(file);
  }, [file, onParsed, scene]);

  return null;
};
const UploadButton = ({ setFiles }) => {
  const fileInputRef = useRef(null);
  const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
    }
  };
  return /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
    "input",
    {
      type: "file",
      ref: fileInputRef,
      onChange: handleFileUpload,
      accept: ".mol,.sdf,.xyz,.cub",
      multiple: true
    }
  ) });
};
export {
  FileParser,
  MoleculeViewer,
  UploadButton
};
