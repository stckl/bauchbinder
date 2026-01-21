const fs = require('fs');
const path = require('path');

const version = process.argv[2];
if (!version) {
  console.error('Please provide a version number (e.g., node update-version.js 3.1.0)');
  process.exit(1);
}

// 1. Update package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = version;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`Updated package.json to version ${version}`);

// 2. Update index.html
const indexHtmlPath = path.join(__dirname, 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

const currentYear = new Date().getFullYear();
const newCopyrightText = `${currentYear} - with ❤️ from mstockle.de`;

// Regex to find the copyright div and update it
// Old: <div class="copy">&copy; 2021 - mstoeckle.de version: {{ appversion }}</div>
indexHtml = indexHtml.replace(
  /<div class="copy">.*?version: {{ appversion }}<\/div>/,
  `<div class="copy">${newCopyrightText} version: {{ appversion }}</div>`
);

fs.writeFileSync(indexHtmlPath, indexHtml);
console.log(`Updated index.html with year ${currentYear} and new copyright text.`);
