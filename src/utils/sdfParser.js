import { parseMol } from './molParser'; 

export function parseSdf(sdfData) {
  const chunks = sdfData.split('$$$$\n').filter(mol => mol.trim());
  if (chunks.length === 0) return [{ atoms: [], bonds: [] }];
  return chunks.map(mol => parseMol(mol));
}
