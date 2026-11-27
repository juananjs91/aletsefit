import { build } from 'esbuild';
const opts = { entryPoints: ['src/fb.js'], bundle: true, minify: true, format: 'iife', target: ['es2019'] };
await build({ ...opts, outfile: 'www/js/fb.js' });
await build({ ...opts, outfile: 'docs/js/fb.js' });
console.log('Firebase empaquetado en www/js/fb.js y docs/js/fb.js');
