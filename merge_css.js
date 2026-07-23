const fs = require('fs');
const path = require('path');

const srcDir = 'd:/SGP/Healthcare-Ai/frontend/css';
const destFile = 'd:/SGP/lifesphere/src/app/dashboard/legacy.css';

const files = ['styles.css', 'components.css', 'dashboard.css', 'responsive.css'];

let combinedCss = '';

for (const file of files) {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  combinedCss += `\n/* === ${file} === */\n` + content;
}

// Replace body selectors with .legacy-body
combinedCss = combinedCss.replace(/(^|\s|\})body\s*\{/g, '$1.legacy-body {');
combinedCss = combinedCss.replace(/(^|\s|\})body::before\s*\{/g, '$1.legacy-body::before {');
combinedCss = combinedCss.replace(/(^|\s|\})html\s*\{/g, '$1.legacy-html {');

fs.writeFileSync(destFile, combinedCss);
console.log('Successfully created legacy.css');
