// Patches esbuild to use esbuild-wasm when native binaries are blocked
// (e.g. by Windows Application Control policies)
const fs = require('fs');
const path = require('path');

const esbuildMain = path.join(__dirname, '..', 'node_modules', 'esbuild', 'lib', 'main.js');
const esbuildESM = path.join(__dirname, '..', 'node_modules', 'esbuild', 'lib', 'main.mjs');

if (fs.existsSync(esbuildMain)) {
  fs.writeFileSync(esbuildMain, 'module.exports = require("esbuild-wasm");');
}
if (fs.existsSync(esbuildESM)) {
  fs.writeFileSync(esbuildESM, 'export * from "esbuild-wasm";');
}
console.log('Patched esbuild -> esbuild-wasm');
