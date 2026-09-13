const fs = require('fs');
const path = require('path');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');

const bundled = html
  .replace('<link rel="stylesheet" href="css/style.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="js/main.js"></script>', `<script>\n${js}\n</script>`);

const outPath = path.join(root, 'index_all_in_one.html');
fs.writeFileSync(outPath, bundled, 'utf8');
console.log(`Bundled successfully to ${outPath}, size: ${bundled.length} bytes`);
