const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { buildPublicSite } = require('../scripts/build-public.cjs');

function fixture(t, files = ['index.html']) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ppat-public-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.writeFileSync(path.join(root, 'scripts/public-files.json'), JSON.stringify({ version: 1, files }));
  fs.writeFileSync(path.join(root, 'index.html'), '<h1>Public site</h1>');
  return root;
}

test('public build excludes unlisted and stale internal files without deleting source', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'docs/internal.md'), 'Internal fixture');
  fs.writeFileSync(path.join(root, 'new-page.html'), 'Unreviewed page');
  fs.mkdirSync(path.join(root, 'dist'));
  fs.writeFileSync(path.join(root, 'dist/config.php'), 'Stale fixture');
  buildPublicSite(root);
  assert.deepEqual(fs.readdirSync(path.join(root, 'dist')), ['index.html']);
  assert.equal(fs.readFileSync(path.join(root, 'docs/internal.md'), 'utf8'), 'Internal fixture');
  assert.equal(fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8'), '<h1>Public site</h1>');
});

test('public build rejects traversal, internal extensions and duplicate paths', t => {
  for (const files of [['../outside.html'], ['/index.html'], ['docs/report.html'], ['config.php'], ['database.sql'], ['preview.html'], ['index.html', 'index.html']]) {
    assert.throws(() => buildPublicSite(fixture(t, files)));
  }
});

test('public build rejects missing dependencies', t => {
  assert.throws(() => buildPublicSite(fixture(t, ['missing.html'])), /ENOENT/);
});

test('public build rejects file and parent-directory symlinks', t => {
  const root = fixture(t, ['linked.html']);
  fs.symlinkSync(path.join(root, 'index.html'), path.join(root, 'linked.html'));
  assert.throws(() => buildPublicSite(root), /Symlink forbidden/);
  const parent = fixture(t, ['images/internal.png']);
  fs.mkdirSync(path.join(parent, 'internal'));
  fs.writeFileSync(path.join(parent, 'internal/internal.png'), 'Private fixture');
  fs.symlinkSync(path.join(parent, 'internal'), path.join(parent, 'images'));
  assert.throws(() => buildPublicSite(parent), /Symlink forbidden/);
});

test('public build never follows an output symlink', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'private'));
  fs.writeFileSync(path.join(root, 'private/keep.txt'), 'Keep');
  fs.symlinkSync(path.join(root, 'private'), path.join(root, 'dist'));
  assert.throws(() => buildPublicSite(root), /Output must not be a symlink/);
  assert.equal(fs.readFileSync(path.join(root, 'private/keep.txt'), 'utf8'), 'Keep');
});

test('reviewed manifest contains the public routes, booking utilities and email assets', () => {
  const root = path.resolve(__dirname, '..');
  const { files } = require('../scripts/public-files.json');
  const config = require('../vercel.json');
  const aliases = Object.fromEntries(config.rewrites.map(r => [r.source, r.destination.slice(1) + '.html']));
  aliases['/'] = 'index.html';
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  for (const [, url] of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) {
    const route = new URL(url).pathname;
    assert.ok(files.includes(aliases[route] || route.slice(1) + '.html'), route);
  }
  for (const file of ['confirm.html', 'manage-booking.html', 'admin.html', 'links.html', 'pages/cgv.html', 'pages/confidentialite.html', 'assets/email/logo-signature.png', 'robots.txt']) {
    assert.ok(files.includes(file), file);
  }
  assert.equal(config.outputDirectory, 'dist');
});
