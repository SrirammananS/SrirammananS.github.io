const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Read the original script
const scriptPath = path.join(__dirname, 'script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

console.log('🔒 Obfuscating script.js...');

// Obfuscate with strong settings
const obfuscationResult = JavaScriptObfuscator.obfuscate(scriptContent, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false, // Set to true for extra protection (may cause issues in dev tools)
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
});

// Write obfuscated code
const outputPath = path.join(__dirname, 'script.min.js');
fs.writeFileSync(outputPath, obfuscationResult.getObfuscatedCode());

console.log('✅ Obfuscation complete!');
console.log('📦 Output: script.min.js');
console.log('📏 Original size:', (scriptContent.length / 1024).toFixed(2), 'KB');
console.log('📏 Obfuscated size:', (obfuscationResult.getObfuscatedCode().length / 1024).toFixed(2), 'KB');
console.log('\n⚠️  Remember to update index.html to use script.min.js instead of script.js');
