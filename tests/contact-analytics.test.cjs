const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function fixture({allowed=true,outcome='success',path='/contact',loading=false}={}) {
 const nodes=new Map(),scripts=[],listeners={},requests=[];
 const values={'contact-name':'Synthetic Person','contact-email':'synthetic@example.test','contact-phone':'2025550123','contact-subject':'quote','contact-message':'PRIVATE_MESSAGE','contact-website':''};
 const classes={toggle(){},contains(){return false;}};
 function node(id){if(!nodes.has(id)){const handlers={};const n={id,value:values[id]||'',style:{},disabled:false,classList:classes,setAttribute(){},getAttribute(){return null;},setCustomValidity(){},focus(){},reset(){},querySelectorAll(){return [];},closest(){return {querySelector:()=>({classList:classes,setAttribute(){}}),classList:classes};},addEventListener:(type,fn)=>(handlers[type]??=[]).push(fn),async fire(type,event={}){for(const fn of handlers[type]||[])await fn({preventDefault(){},...event});}};nodes.set(id,n);}return nodes.get(id);}
 const window={location:{pathname:path,search:'?service=normandy&token=PRIVATE_TOKEN',hostname:'example.test'},PPATConsent:{allows:purpose=>purpose==='audience'&&allowed,getChoice:()=>({audience:allowed,advertising:false})},PPATEmailOperations:{headers:async()=>({'Idempotency-Key':'synthetic-operation'}),complete(){}},localStorage:{removeItem(){}},addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn)};
 const document={documentElement:{lang:"en"},referrer:'https://example.test/?email=synthetic@example.test',getElementById:node,querySelector:()=>null,addEventListener(){},head:{append:s=>scripts.push(s)},createElement:()=>({remove(){}})};
 const phoneContext=vm.createContext({});
 vm.runInContext(fs.readFileSync('js/libphonenumber-max.js','utf8'),phoneContext);
 vm.runInContext(fs.readFileSync('js/phone-validation.js','utf8'),phoneContext);
 const phone=phoneContext.PPATPhone;
 window.PPATPhoneInput={create:()=>({country:'US',sync(){node('contact-phone-full').value=phone.normalize(node('contact-phone').value,'US')||'';},validate(){this.sync();return Boolean(node('contact-phone-full').value);}})};
 const context=vm.createContext({window,document,URL,URLSearchParams,Date,console:{error(){}},fetch:async(url,options)=>{requests.push({url,options});if(outcome==='network')throw Error('Simulated network failure');return {ok:outcome!=='http',json:async()=>{if(outcome==='json')throw Error('Invalid JSON');return {success:outcome!=='api'};}};}});
 for(const file of ['marketing-attribution','contact-phone-v2'])vm.runInContext(fs.readFileSync('js/'+file+'.js','utf8'),context);
 const load=()=>scripts.at(-1)?.onload?.();if(!loading)load();
 return {node,window,requests,load,events:()=>Array.from(window.dataLayer||[]).filter(x=>x[0]==='event').map(x=>({name:x[1],params:x[2]})),edit:(type='input',isTrusted=true,id='contact-name')=>node('contactForm').fire(type,{isTrusted,target:node(id)}),submit:()=>node('contactForm').fire('submit'),consent(value){allowed=value;for(const fn of listeners['ppat:consentchange']||[])fn();}};
}
test('contact starts only once after a trusted field edit, not focus or prefill',async()=>{
 const f=fixture();assert.deepEqual(f.events().map(x=>x.name),['page_view']);await f.node('contactForm').fire('focusin');await f.edit('input',false);await f.edit('input',true,'contact-website');assert.equal(f.events().length,1);await f.edit();await f.edit('change');assert.equal(f.events().filter(x=>x.name==='contact_form_start').length,1);
});
for(const outcome of ['success','network','http','api','json'])test('contact submission outcome '+outcome,async()=>{
 const f=fixture({outcome});await f.submit();assert.equal(f.requests.length,1);assert.equal(f.events().filter(x=>x.name==='contact_submit_success').length,outcome==='success'?1:0);assert.equal(f.node('contactSubmitBtn').disabled,false);if(outcome==='success')assert.equal(f.node('contactSuccess').style.display,'block');else assert.equal(f.node('contactError').style.display,'block');assert.doesNotMatch(JSON.stringify(f.events()),/Synthetic Person|synthetic@|PRIVATE_|077009|token=/);
});
test('invalid form never calls API or records success',async()=>{const f=fixture();f.node('contact-email').value='invalid';await f.submit();assert.equal(f.requests.length,0);assert.equal(f.events().length,1);});
test('honeypot success is never measured',async()=>{const f=fixture();f.node('contact-website').value='bot';await f.submit();assert.equal(f.events().length,1);});
test('no consent and withdrawal block contact events without blocking form submission',async()=>{
 const f=fixture({allowed:false});await f.edit();await f.submit();assert.equal(f.events().length,0);assert.equal(f.requests.length,1);f.consent(true);f.load();await f.edit();assert.equal(f.events().filter(x=>x.name==='contact_form_start').length,1);f.consent(false);await f.edit();await f.submit();assert.equal(f.events().length,0);assert.equal(f.requests.length,2);
});
test('queued contact events flush once after the single manual page view',async()=>{
 const f=fixture({loading:true});await f.edit();await f.submit();assert.equal(f.events().length,0);f.load();f.consent(true);assert.deepEqual(f.events().map(x=>x.name),['page_view','contact_form_start','contact_submit_success']);const config=f.window.dataLayer.find(x=>x[0]==='config');assert.equal(config[2].send_page_view,false);assert.ok(f.events().every(x=>x.params.send_to==='G-83LVJPDG1N'));
});
test('withdrawal before loading discards queued contact events',async()=>{const f=fixture({loading:true});await f.edit();f.consent(false);f.load();assert.equal(f.events().length,0);});
test('contact telemetry remains blocked on sensitive pages',async()=>{for(const path of ['/confirm','/manage-booking','/admin']){const f=fixture({path});await f.edit();await f.submit();assert.equal(f.events().length,0);}});
test('no raw gtag fallback bypasses consent when shared tracking is unavailable',async()=>{const f=fixture({allowed:false});delete f.window.PPATMarketing;await f.edit();await f.submit();assert.equal(f.events().length,0);});
