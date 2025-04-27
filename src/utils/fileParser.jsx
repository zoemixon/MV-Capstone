import React, { useEffect } from 'react';
import { parseMol } from './molParser';
import { parseSdf } from './sdfParser';
import { parseXyz } from './xyzParser';
import { parseCub } from './cubParser';
import { renderDensityCloud } from './cubView';

const FileParser = ({ file, onParsed, scene }) => {
  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      let newMolecules = [];

      if (file.name.endsWith('.mol')) {
        newMolecules = [parseMol(content)];
      } else if (file.name.endsWith('.sdf')) {
        newMolecules = parseSdf(content);
      } else if (file.name.endsWith('.xyz')) {
        newMolecules = [parseXyz(content)];
      } else if (file.name.endsWith('.cub') || file.name.endsWith('.cube')) {
        const parsed = parseCub(content);
        const { atoms, bonds, densityData, dimensions } = parsed;

        newMolecules = [{
          atoms,
          bonds,
          name: file.name,
          source: 'file',
          visible: true,
          labelsVisible: false,
        }];

        setTimeout(() => {
          if (scene) {
            renderDensityCloud(scene, densityData, dimensions);
            console.log('Density cloud rendered for', file.name);
          } else {
            console.warn('Scene not available for density rendering');
          }
        }, 500);
      } else {
        console.error('Unsupported file type:', file.name);
        return;
      }

      newMolecules.forEach((mol) => {
        mol.source = 'file';
        mol.visible = mol.visible ?? true;
        mol.labelsVisible = mol.labelsVisible ?? false;
      });

      onParsed(newMolecules);
    };
    reader.readAsText(file);
  }, [file, onParsed, scene]);

  return null;
};

export default FileParser;
