'use strict';

const fs = require('node:fs');
const path = require('node:path');

// No directory copying or automatic discovery: every published file is reviewed
// in the manifest. Adding a page or asset requires updating that list.
function buildPublicSite(root = path.resolve(__dirname, '..')) {
  root = path.resolve(root);
  const output = path.join(root, 'dist');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scripts/public-files.json'), 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.files) || !manifest.files.length) {
    throw new Error('Invalid public file manifest');
  }
  const seen = new Set();
  for (const file of manifest.files) {
    if (typeof file !== 'string' || file.includes('\\') || file.split('/').some(p => !p || p.startsWith('.'))) {
      throw new Error('Invalid public path');
    }
    const allowed = /^(?:[a-z0-9-]+\.html|pages\/(?:cgv|confidentialite)\.html|robots\.txt|sitemap\.xml|css\/[a-z0-9.-]+\.css|js\/[a-z0-9.-]+\.js|(?:images|assets)\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|svg|ico|woff2?))$/;
    if (!allowed.test(file) || ['preview.html', 'signature.html'].includes(file) || seen.has(file)) {
      throw new Error(`Disallowed or duplicate public file: ${file}`);
    }
    seen.add(file);
    let source = root;
    for (const segment of file.split('/')) {
      source = path.join(source, segment);
      if (fs.lstatSync(source).isSymbolicLink()) throw new Error(`Symlink forbidden: ${file}`);
    }
    if (!fs.statSync(source).isFile()) throw new Error(`Not a regular file: ${file}`);
  }
  // Only remove this generated directory, never any source files. Reject an
  // output symlink rather than following it outside the project.
  try {
    if (fs.lstatSync(output).isSymbolicLink()) throw new Error('Output must not be a symlink');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output);
  for (const file of manifest.files) {
    const target = path.join(output, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file), target);
  }
  return { directory: output, files: manifest.files.length };
}

if (require.main === module) {
  const result = buildPublicSite();
  console.log(`Built ${result.files} explicitly allowed public files in ${result.directory}`);
}

module.exports = { buildPublicSite };
