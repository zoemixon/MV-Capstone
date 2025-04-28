import React, { useEffect } from 'react';
import { parseMol } from './molParser';
import { parseSdf } from './sdfParser';
import { parseXyz } from './xyzParser';
// import { parseCub } from './cubParser';
import { renderDensityCloud } from './cubView';

// Accepts an array of files, parses each, and applies a spatial offset to each molecule
const FileParser = ({ files, onParsed }) => {
  useEffect(() => {
    if (!files || files.length === 0) return;

    let loadedCount = 0;
    const allMolecules = [];
    const offsetStep = 6; // Distance to offset each molecule

    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        let newMolecules = [];
        if (file.name.endsWith('.mol')) {
          const mol = parseMol(content);
          mol.name = file.name;
          newMolecules = [mol];
        } else if (file.name.endsWith('.sdf')) {
          newMolecules = parseSdf(content, file.name);
        } else if (file.name.endsWith('.xyz')) {
          const mol = parseXyz(content);
          mol.name = file.name;
          newMolecules = [mol];
        } else if (file.name.endsWith('.cub')) {
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
            renderDensityCloud(densityData, dimensions);
          }, 500);
        } else {
          console.error('Unsupported file type:', file.name);
          loadedCount++;
          if (loadedCount === files.length) onParsed(allMolecules);
          return;
        }
        // Offset each molecule in X direction
        newMolecules.forEach((mol) => {
          mol.atoms.forEach(atom => {
            atom.x += idx * offsetStep;
          });
          mol.source = 'file';
          mol.visible = mol.visible ?? true;
          mol.labelsVisible = mol.labelsVisible ?? false;
          allMolecules.push(mol);
        });
        loadedCount++;
        if (loadedCount === files.length) onParsed(allMolecules);
      };
      reader.readAsText(file);
    });
  }, [files, onParsed]);

  return null;
};

export default FileParser;
