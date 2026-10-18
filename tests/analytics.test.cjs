const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const key='ppat_consent_v1', id='G-83LVJPDG1N';
const choice=(audience,advertising,version=2)=>{const savedAt=Date.now();return {version,audience,advertising,savedAt,expiresAt:savedAt+180*86400000};};
function fixture(initial,path='/reservation') {
 const store=new Map(),listeners={},scripts=[];if(initial)store.set(key,JSON.stringify(initial));
 const window={location:{pathname:path,search:'?token=PRIVATE_TOKEN&email=private@example.test#PRIVATE_NAME',hostname:'example.test'},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},addEventListener:(n,f)=>(listeners[n]??=[]).push(f),dispatchEvent:e=>(listeners[e.type]||[]).forEach(f=>f(e))};
 const document={readyState:'loading',title:'PRIVATE_NAME',referrer:'https://example.test/confirm?token=PRIVATE_TOKEN',cookie:'',addEventListener(){},head:{append:s=>scripts.push(s)},createElement:()=>({remove(){this.removed=true;}})};
 const ctx=vm.createContext({window,document,URL,URLSearchParams,Date,Event});
 for(const file of ['consent','marketing-attribution'])vm.runInContext(fs.readFileSync('js/'+file+'.js','utf8'),ctx);
 return {window,document,scripts,events:()=>Array.from(window.dataLayer||[]).filter(x=>x[0]==='event'),load:()=>scripts.at(-1)?.onload?.(),change(a,b){store.set(key,JSON.stringify(choice(a,b)));window.dispatchEvent({type:'storage',key});}};
}
for(const [a,b] of [[false,false],[true,false],[false,true],[true,true]])test(`GA4 audience=${a} advertising=${b}`,()=>{
 const f=fixture(choice(a,b));assert.equal(f.scripts.length,a?1:0);f.load();assert.equal(f.events().length,a?1:0);
 assert.equal(f.window['ga-disable-'+id],!a);
 if(a){assert.equal(f.scripts[0].referrerPolicy,'no-referrer');const consent=f.window.dataLayer.find(x=>x[0]==='consent')[2];assert.equal(consent.ad_storage,'denied');assert.equal(consent.ad_user_data,'denied');assert.equal(consent.ad_personalization,'denied');}
});
test('initial visit and old disabled-tracking consent never load Google',()=>{for(const c of [null,choice(true,true,1)])assert.equal(fixture(c).scripts.length,0);});
test('withdrawal disables collection and reacceptance never duplicates page view',()=>{
 const f=fixture(choice(true,true));f.load();assert.equal(f.events().length,1);f.change(false,false);assert.equal(f.window['ga-disable-'+id],true);assert.equal(f.window.PPATMarketing.trackEvent('booking_form_start'),false);assert.equal(f.events().length,0);f.change(true,false);assert.equal(f.scripts.length,1);assert.equal(f.events().length,0);assert.equal(f.window.PPATMarketing.trackEvent('booking_form_start'),true);
});
test('withdrawal during script load discards pending events',()=>{
 const f=fixture(choice(true,false));f.window.PPATMarketing.trackEvent('booking_submit_success');f.change(false,false);f.load();assert.equal(f.events().length,0);assert.equal(f.scripts[0].removed,true);
});
test('one page view on reload, no duplicate from consent or pageshow',()=>{
 for(let i=0;i<2;i++){const f=fixture(choice(true,false),'/cdg-to-paris');f.load();f.change(true,true);f.window.dispatchEvent({type:'pageshow'});assert.equal(f.events().length,1);}
});
test('sensitive and unknown paths never load tags for any URL variant',()=>{
 for(const page of ['confirm','manage-booking','admin','private@example.test'])for(const suffix of ['','.html','/']){const f=fixture(choice(true,true),'/'+page+suffix);assert.equal(f.scripts.length,0);assert.equal(f.window.PPATMarketing.trackEvent('booking_submit_success'),false);}
});
test('only requested events and fixed public metadata reach GA4',()=>{
 const f=fixture(choice(true,true));f.load();for(const name of ['booking_form_start','booking_submit_success'])assert.equal(f.window.PPATMarketing.trackEvent(name,{email:'private@example.test',token:'PRIVATE_TOKEN',name:'PRIVATE_NAME'}),true);
 for(const name of ['purchase','booking_confirmed','form_submit','contact_submit_success'])assert.equal(f.window.PPATMarketing.trackEvent(name),false);
 assert.equal(f.events().length,3);const payload=JSON.stringify(f.window.dataLayer);assert.doesNotMatch(payload,/PRIVATE_|private@|token=|google_ads|AW-/);for(const event of f.events()){assert.equal(event[2].send_to,id);assert.equal(event[2].page_location,'https://www.parisprivateairporttransfer.com/reservation');assert.equal(event[2].page_referrer,'');}
});
test('authorized event waits for tag load, with page_view first',()=>{const f=fixture(choice(true,false));f.window.PPATMarketing.trackEvent('booking_form_start');f.load();assert.deepEqual(f.events().map(x=>x[1]),['page_view','booking_form_start']);});
