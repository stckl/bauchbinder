#!/usr/bin/env node
/**
 * Sets the version in package.json and manifest.json
 * Usage: node scripts/set-version.js <version>
 * Example: node scripts/set-version.js 1.0.0
 */

const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version) {
	console.error('Usage: node scripts/set-version.js <version>');
	console.error('Example: node scripts/set-version.js 1.0.0');
	process.exit(1);
}

// Validate version format (semver)
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
	console.error(`Invalid version format: ${version}`);
	console.error('Expected format: X.Y.Z or X.Y.Z-suffix');
	process.exit(1);
}

const rootDir = path.join(__dirname, '..');

// Update package.json
const packagePath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.version = version;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, '\t') + '\n');
console.log(`Updated package.json to version ${version}`);

// Update manifest.json
const manifestPath = path.join(rootDir, 'companion', 'manifest.json');
const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifestJson.version = version;
fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, '\t') + '\n');
console.log(`Updated manifest.json to version ${version}`);

console.log(`\nCompanion module version set to ${version}`);
