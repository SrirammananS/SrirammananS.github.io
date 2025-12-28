# JavaScript Obfuscation Setup

This project uses JavaScript obfuscation to protect the source code when deploying to GitHub Pages.

## Files

- `script.js` - Original source code (NOT committed to git)
- `script.min.js` - Obfuscated production code (committed to git)
- `build-obfuscate.js` - Build script for obfuscation
- `package.json` - NPM configuration with build scripts

## Usage

### Build for Production

```bash
npm run build
```

This will:
1. Read `script.js`
2. Apply strong obfuscation
3. Output to `script.min.js`

### Obfuscation Features

- Control flow flattening
- Dead code injection
- String array encoding (base64)
- Identifier renaming (hexadecimal)
- Self-defending code
- String splitting and rotation

### Before Pushing to GitHub

1. Make changes to `script.js`
2. Run `npm run build`
3. Commit only `script.min.js` (script.js is gitignored)
4. Push to GitHub Pages

## Security Note

The original `script.js` is excluded from git via `.gitignore` to keep your source code private. Only the obfuscated `script.min.js` is deployed to GitHub Pages.
