const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const manifest=require('../scripts/public-files.json').files;
const key='ppat_consent_v1', attribution='ppat_marketing_attribution_v1';
function fixture(choice, pathname='/') {
 const store=new Map([[attribution,'{"legacy":true}']]);
 if(choice)store.set(key,JSON.stringify(choice));
 const listeners={};
 const window={location:{pathname,search:'?utm_source=google&utm_medium=cpc',hostname:'www.parisprivateairporttransfer.com'},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},addEventListener:(n,f)=>listeners[n]=f,dispatchEvent:e=>listeners[e.type]?.(e)};
 const document={head:{append(){}},createElement:()=>({remove(){}}),readyState:'loading',referrer:'',addEventListener(){}};
 const ctx=vm.createContext({window,document,URL,URLSearchParams,Date,Event});
 vm.runInContext(fs.readFileSync('js/consent.js','utf8'),ctx);
 return {window,store,ctx,listeners};
}
const choice=(audience,advertising)=>{const savedAt=Date.now();return {version:2,audience,advertising,savedAt,expiresAt:savedAt+180*86400000};};
test('no consent, invalid and expired preferences purge legacy attribution',()=>{
 for(const c of [null,{advertising:true},{...choice(true,true),expiresAt:0}]) {
  const f=fixture(c); assert.equal(f.store.has(attribution),false);assert.equal(f.window.PPATConsent.allows('advertising'),false);
 }
});
test('separate purposes gate attribution; unsupported conversions stay disabled',()=>{
 for(const [a,b] of [[false,false],[true,false],[false,true],[true,true]]) {
  const f=fixture(choice(a,b));f.store.delete(attribution);
  vm.runInContext(fs.readFileSync('js/marketing-attribution.js','utf8'),f.ctx);
  assert.equal(f.window.PPATConsent.allows('audience'),a);
  assert.equal(!!f.window.PPATMarketing.getAttribution(),b);
  assert.equal(f.window.PPATMarketing.trackEvent('booking_confirmed'),false);
  assert.equal(f.window.PPATConsent.futureAnalytics.enabled,true);
  assert.equal(typeof f.window.gtag,'undefined');
 }
});
test('sensitive route variants never read campaign attribution or authorize measurement',()=>{
 for(const name of ['confirm','manage-booking','admin'])for(const suffix of ['','.html','/']) {
  const f=fixture(choice(true,true),'/'+name+suffix);
  vm.runInContext(fs.readFileSync('js/marketing-attribution.js','utf8'),f.ctx);
  assert.equal(f.window.PPATConsent.allows('audience'),false);
  assert.equal(f.window.PPATMarketing.getAttribution(),null);
 }
});
test('withdrawal in another tab clears attribution including in-memory fallback',()=>{
 const f=fixture(choice(true,true));f.store.delete(attribution);
 vm.runInContext(fs.readFileSync('js/marketing-attribution.js','utf8'),f.ctx);
 assert.ok(f.window.PPATMarketing.getAttribution());
 f.store.set(key,JSON.stringify(choice(false,false)));f.listeners.storage({key});
 assert.equal(f.window.PPATMarketing.getAttribution(),null);assert.equal(f.store.has(attribution),false);
});
test('every public HTML uses consent gate and no longer embeds Google tags',()=>{
 for(const file of manifest.filter(f=>f.endsWith('.html'))) {
  const html=fs.readFileSync(file,'utf8');
  assert.match(html,/src="\/js\/consent.js"/);assert.match(html,/href="\/css\/consent.css"/);
  assert.doesNotMatch(html,/googletagmanager|gtag\s*\(/,file);
 }
 assert.ok(manifest.includes('js/consent.js'));assert.ok(manifest.includes('css/consent.css'));
});
test('confirmation retains only business flow and suppresses referrers',()=>{
 const html=fs.readFileSync('confirm.html','utf8');
 assert.match(html,/api\/confirm/);assert.match(html,/JSON.stringify\(\{ token \}\)/);
 assert.doesNotMatch(html,/trackBookingConfirmed|trackGoogleAdsConversion/);
 for(const file of ['confirm.html','manage-booking.html','admin.html'])assert.match(fs.readFileSync(file,'utf8'),/name="referrer" content="no-referrer"/);
});
