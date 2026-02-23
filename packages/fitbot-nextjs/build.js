const fs = require('fs');
const path = require('path');

const srcCode = `"use client";\n\nimport { FitBotWidget } from '@fitbot/react';\n\nexport { FitBotWidget };`;

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

// CommonJS
fs.writeFileSync(path.join(__dirname, 'dist/index.js'), srcCode);

// ESM
fs.writeFileSync(path.join(__dirname, 'dist/index.mjs'), srcCode);

// DTS
fs.writeFileSync(path.join(__dirname, 'dist/index.d.ts'), `import { FitBotWidgetProps } from '@fitbot/react';\nimport React from 'react';\nexport declare const FitBotWidget: React.FC<FitBotWidgetProps>;\n`);

console.log('Build complete');
