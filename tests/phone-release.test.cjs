const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const manifest=require('../scripts/public-files.json').files;

test('public release includes both legacy entry points and the complete international phone component',()=>{
 for(const asset of ['js/contact.js','js/reservation.js','js/contact-phone-v2.js','js/reservation-phone-v2.js','js/phone-input.js','js/phone-validation.js','js/libphonenumber-max.js','css/phone-input.css']){
  assert.ok(manifest.includes(asset),asset+' must be published');assert.ok(fs.statSync(path.join(root,asset)).isFile());
 }
 for(const name of ['contact','reservation'])assert.doesNotMatch(fs.readFileSync(path.join(root,`js/${name}.js`),'utf8'),/PPATPhoneInput/,name+' legacy entry point must not acquire new dependencies');
});

test('new HTML uses distinct phone entry points, ordered dependencies and refreshed main script URL',()=>{
 for(const name of ['contact','reservation']){
  const html=fs.readFileSync(path.join(root,`${name}.html`),'utf8').replace(/<!--[\s\S]*?-->/g,'');
  const scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);
  let previous=-1;
  for(const script of ['js/libphonenumber-max.js','js/phone-validation.js','js/phone-input.js?v=20261026-mobile-1',`js/${name}-phone-v2.js`]){
   const index=scripts.indexOf(script);assert.ok(index>previous,script+' must load after its dependencies');previous=index;
  }
  assert.ok(scripts.includes('js/main.js?v=20261025-phone-v2'));assert.ok(!scripts.includes(`js/${name}.js`));
  const phone=html.match(/<input\b[^>]*id="(?:contact-phone|phone-number)"[^>]*>/)?.[0];
  assert.ok(phone);assert.match(phone,/placeholder="Phone number"/);
  for(const [,asset]of html.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)(?:\?[^" ]*)?"/g))assert.ok(manifest.includes(asset),asset+' must be in build manifest');
 }
});
