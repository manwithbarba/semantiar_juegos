const fs = require('fs');
const path = require('path');

const outputFile = path.join('dist', 'semantiar-juegos', 'browser', '.nojekyll');
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, '');
