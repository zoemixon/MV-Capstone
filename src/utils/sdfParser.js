import { parseMol } from './molParser'; 

export function parseSdf(sdfData, fileName) {
  const chunks = sdfData.split('$$$$\n').filter(mol => mol.trim());
  if (chunks.length === 0) return [{ atoms: [], bonds: [], name: fileName }];
  return chunks.map((mol, idx) => {
    const parsed = parseMol(mol);
    parsed.name = chunks.length > 1 ? `Molecule ${idx + 1}` : fileName;
    return parsed;
  });
}
