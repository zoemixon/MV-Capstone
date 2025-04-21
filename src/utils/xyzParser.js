export function parseXyz(xyzData) {
    const lines = xyzData.split('\n').filter(line => line.trim() !== '');
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
  