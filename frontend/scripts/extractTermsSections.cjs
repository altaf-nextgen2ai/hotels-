const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'src', 'components', 'TermsPage.jsx');
const targetPath = path.join(__dirname, '..', 'src', 'data', 'termsSections.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const match = source.match(/const SECTIONS = (\[[\s\S]*?\]);\r?\n\r?\nexport default/);
if (!match) {
  throw new Error('Could not find SECTIONS array in TermsPage.jsx');
}

const footer = `
export const getTermsSection = (id) => TERMS_SECTIONS.find((section) => section.id === id);

export const getTermsSectionsByIds = (ids) => ids.map(getTermsSection).filter(Boolean);

export const TERMS_AND_CONDITIONS_SECTION_IDS = TERMS_SECTIONS
  .filter((section) => section.id !== 'help' && section.id !== 'privacy')
  .map((section) => section.id);
`;

fs.writeFileSync(targetPath, `export const TERMS_SECTIONS = ${match[1]};${footer}`, 'utf8');
console.log('Wrote', targetPath);
