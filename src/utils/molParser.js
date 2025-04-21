

export function parseMol(molData) {
    const lines = molData.split('\n');
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
