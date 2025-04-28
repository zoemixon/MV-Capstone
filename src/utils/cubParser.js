import { getElementSymbol } from './utils/atomicSymbol';

export function parseCub(cubData) {
  const lines = cubData.split('\n');
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
    nums.forEach(n => {
      const v = parseFloat(n);
      if (!isNaN(v)) rawValues.push(v);
    });
  }

  const densityData = Array.from({ length: nx }, () =>
    Array.from({ length: ny }, () => Array(nz).fill(0))
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
  const bondThresholdSq = 3.0 * 3.0;
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

import { parseCub } from './utils/cubParser';
