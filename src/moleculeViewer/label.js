import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

const Label = ({ element }) => {
  const div = document.createElement('div');
  div.className = 'label';
  div.textContent = element;
  div.style.color = 'white';
  div.style.fontSize = '12px';

  const label = new CSS2DObject(div);
  label.position.set(0, 0.6, 0); 
  return label;
};

export default Label;
