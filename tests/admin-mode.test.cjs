const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/reservation.js'),'utf8');
function fixture({session=null,authorized=true,networkError=false,delay}={}){
 const nodes=new Map(),requests=[],alerts=[],timers=new Map();let callback,clock=0;
 const values={name:'Test Customer',email:'client@example.com','phone-full':'+447700900123',pickup:'CDG',destination:'Paris',date:'2026-12-01',time:'12:00',passengers:'2',child:'0',luggage:'1 bag','baby-seat-input':'0','child-seat-input':'0',service:'cdg-paris',adminPromoType:'fixed'};
 function node(id){if(!nodes.has(id)){const classes=new Set();nodes.set(id,{value:values[id]||'',textContent:'',innerHTML:'',hidden:id==='adminPanel',disabled:false,style:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x),contains:x=>classes.has(x)},addEventListener(){},focus(){},scrollIntoView(){},querySelector(){return null;}});}return nodes.get(id);}
 const auth={getSession:async()=>({data:{session}}),onAuthStateChange:fn=>{callback=fn;return{data:{subscription:{unsubscribe(){}}}};},signOut:async()=>{session=null;callback?.('SIGNED_OUT',null);return{};}};
 const context=vm.createContext({console:{log(){},warn(){},error(){}},AbortSignal,Date,URLSearchParams,
  setTimeout:(fn,ms)=>{timers.set(++clock,{fn,ms});return clock;},clearTimeout:id=>timers.delete(id),
  document:{getElementById:node,addEventListener(){},querySelector:()=>({value:'cash'}),querySelectorAll:()=>[]},
  window:{ppatSupabase:{auth},location:{pathname:'/reservation'},PPATEmailOperations:{headers:async()=>({}),complete(){}},PPATMarketing:{getAttribution:()=>({source:'test'})}},
  alert:msg=>alerts.push(msg),fetch:async(url,options)=>{
   requests.push({url,options});if(url.endsWith('/session')){if(delay)await delay;if(networkError)throw Error('private transport data');return{ok:authorized};}
   return{ok:true,text:async()=>JSON.stringify({success:true,booking_number:'TEST'})};
  }});
 vm.runInContext(source,context);
 const evaluate=code=>vm.runInContext(code,context);
 return{node,requests,alerts,auth,evaluate,timers,async initialize(){evaluate('initializeAdminSession()');await evaluate('adminInitialization');},event(event,value){session=value;callback(event,value);},submit:()=>evaluate("handleFormSubmit({preventDefault(){},target:{reset(){}}})")};
}
const adminSession=()=>({user:{id:'admin-id'},access_token:'synthetic-admin-token',expires_at:Math.floor(Date.now()/1000)+3600});
function prepareSubmit(f){f.evaluate('validateForm=()=>true; setTripMode=()=>{};');}
test('markup hides admin controls and loads shared Supabase client before reservation script',()=>{
 const html=fs.readFileSync(path.join(root,'reservation.html'),'utf8');
 assert.match(html,/<div class="admin-panel" id="adminPanel" hidden>/);
 for(const id of ['adminToggleBtn','adminBar','adminCalculatedPrice'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.indexOf('supabase-js@2')<html.indexOf('src="js/supabase.js"'));
 assert.ok(html.indexOf('src="js/supabase.js"')<html.indexOf('src="js/reservation.js"'));
});
test('public: hidden panel, public endpoint, no admin fields',async()=>{
 const f=fixture();await f.initialize();assert.equal(f.node('adminPanel').hidden,true);prepareSubmit(f);await f.submit();
 const post=f.requests.find(r=>r.options.method==='POST');assert.ok(post.url.endsWith('/api/bookings'));assert.equal(post.options.headers.Authorization,undefined);
 const body=JSON.parse(post.options.body);assert.equal(body.admin_override,undefined);assert.equal(body.internal_note,undefined);assert.ok(body.marketing_attribution);
});
for(const options of [{session:adminSession(),authorized:false},{session:adminSession(),networkError:true}])test('denied or unavailable admin verification preserves public submission '+JSON.stringify({authorized:options.authorized,networkError:options.networkError}),async()=>{
 const f=fixture(options);await f.initialize();assert.equal(f.node('adminPanel').hidden,true);prepareSubmit(f);await f.submit();assert.ok(f.requests.at(-1).url.endsWith('/api/bookings'));assert.equal(f.alerts.length,0);
});
test('restored admin: verified panel, protected submission and administrative fields',async()=>{
 const f=fixture({session:adminSession()});assert.equal(f.node('adminPanel').hidden,true);await f.initialize();assert.equal(f.node('adminPanel').hidden,false);
 f.node('adminCustomPrice').value='150';f.evaluate('applyAdminPrice()');f.node('adminClientNote').value='Office booking';prepareSubmit(f);await f.submit();
 const post=f.requests.find(r=>r.options.method==='POST');assert.ok(post.url.endsWith('/api/bookings/admin'));assert.equal(post.options.headers.Authorization,'Bearer synthetic-admin-token');assert.equal(JSON.parse(post.options.body).admin_override.custom_price,150);assert.equal(JSON.parse(post.options.body).internal_note,'Office booking');assert.equal(f.node('submitBtn').disabled,false);
});
test('logout removes controls and adjustments before remote signout completes',async()=>{
 const f=fixture({session:adminSession()});await f.initialize();f.evaluate('state.customPrice=1;state.promoAmount=20;');let release;f.auth.signOut=()=>new Promise(r=>release=r);
 const pending=f.evaluate('toggleAdminMode()');assert.equal(f.node('adminPanel').hidden,true);assert.equal(f.evaluate('state.customPrice'),null);assert.equal(f.evaluate('state.promoAmount'),0);release({});await pending;
 prepareSubmit(f);await f.submit();assert.ok(f.requests.at(-1).url.endsWith('/api/bookings'));
});
test('expired session never enables admin, and expiry timer hides an active panel',async()=>{
 const expired=fixture({session:{...adminSession(),expires_at:1}});await expired.initialize();assert.equal(expired.node('adminPanel').hidden,true);assert.equal(expired.requests.length,0);
 const f=fixture({session:adminSession()});await f.initialize();const timer=[...f.timers.values()].find(t=>t.ms>0);assert.ok(timer);timer.fn();assert.equal(f.node('adminPanel').hidden,true);
});
test('logout during pending verification cannot resurrect admin controls',async()=>{
 let release;const f=fixture({session:adminSession(),delay:new Promise(r=>release=r)});const init=f.initialize();await Promise.resolve();f.event('SIGNED_OUT',null);release();await init;assert.equal(f.node('adminPanel').hidden,true);
});
test('submit awaits initial session verification and uses admin route',async()=>{
 let release;const f=fixture({session:adminSession(),delay:new Promise(r=>release=r)});const init=f.initialize();prepareSubmit(f);const pending=f.submit();assert.equal(f.requests.filter(r=>r.options.method==='POST').length,0);release();await init;await pending;assert.ok(f.requests.at(-1).url.endsWith('/api/bookings/admin'));
});
test('revoked admin submission fails without falling back to a public booking',async()=>{
 const f=fixture({session:adminSession()});await f.initialize();f.auth.getSession=async()=>({data:{session:null}});prepareSubmit(f);await f.submit();assert.equal(f.requests.filter(r=>r.options.method==='POST').length,0);assert.equal(f.node('submitBtn').disabled,false);assert.equal(f.node('adminPanel').hidden,true);
});
test('reset restores calculated price including removal of discount',async()=>{
 const f=fixture({session:adminSession()});await f.initialize();f.evaluate('state.customPrice=150;state.promoAmount=25;resetAdminPrice()');assert.equal(f.evaluate('getTotalPrice().total'),80);assert.equal(f.node('adminCalculatedPrice').textContent,'80€');
});
test('missing Supabase SDK leaves a usable public form',async()=>{
 const f=fixture();f.evaluate('window.ppatSupabase=undefined');await f.initialize();prepareSubmit(f);await f.submit();assert.ok(f.requests.at(-1).url.endsWith('/api/bookings'));
});
test('login redirect permits only the reservation allowlist',()=>{
 const login=fs.readFileSync(path.join(root,'js/admin-login.js'),'utf8');
 for(const value of ['/reservation','/reservation.html','https://evil.example','//evil.example','/\\evil.example','/reservation?next=evil','/%2f%2fevil','/admin','']){
  const c=vm.createContext({URLSearchParams,window:{location:{search:'?returnTo='+encodeURIComponent(value)}},document:{addEventListener(){}}});vm.runInContext(login,c);
  assert.equal(vm.runInContext('safeReturnPath()',c),['/reservation','/reservation.html'].includes(value)?value:'/reservation');
 }
});
test('switching accounts hides the previous admin panel synchronously',async()=>{
 const f=fixture({session:adminSession()});await f.initialize();f.event('SIGNED_IN',{...adminSession(),user:{id:'other-id'}});assert.equal(f.node('adminPanel').hidden,true);
});
test('refreshing the same admin session preserves applied price',async()=>{
 const f=fixture({session:adminSession()});await f.initialize();f.evaluate('state.customPrice=150');f.event('TOKEN_REFRESHED',adminSession());
 const queued=[...f.timers.values()].find(t=>t.ms===0);queued.fn();await f.evaluate('adminInitialization');assert.equal(f.node('adminPanel').hidden,false);assert.equal(f.evaluate('state.customPrice'),150);
});
test('verification exception before admin submission hides controls and sends no booking',async()=>{
 const f=fixture({session:adminSession()});await f.initialize();f.auth.getSession=async()=>{throw Error('private auth data');};prepareSubmit(f);await f.submit();assert.equal(f.node('adminPanel').hidden,true);assert.equal(f.requests.filter(r=>r.options.method==='POST').length,0);assert.ok(!f.alerts.join('').includes('private auth data'));
});
for(const mode of ['admin','denied','invalid','network'])test('login form handles '+mode+' safely',async()=>{
 let submit,redirect,signouts=0;const button={disabled:false};const status={textContent:''};const password={value:'synthetic-test-password'};
 const nodes={adminLoginForm:{querySelector:()=>button,addEventListener:(event,fn)=>submit=fn},adminLoginStatus:status,adminEmail:{value:' admin@example.com '},adminPassword:password};
 const context=vm.createContext({URLSearchParams,AbortSignal,document:{getElementById:id=>nodes[id],addEventListener:(event,fn)=>fn()},window:{location:{search:'?returnTo=https://evil.example',assign:path=>redirect=path},ppatSupabase:{auth:{signInWithPassword:async()=>mode==='invalid'?{error:{}}:{data:{session:adminSession()}},signOut:async()=>{signouts++;}}}},fetch:async()=>{if(mode==='network')throw Error('sensitive');return{ok:mode==='admin'};}});
 vm.runInContext(fs.readFileSync(path.join(root,'js/admin-login.js'),'utf8'),context);await submit({preventDefault(){}});
 assert.equal(redirect,mode==='admin'?'/reservation':undefined);assert.equal(button.disabled,false);assert.equal(password.value,'');assert.equal(signouts,mode==='denied'?1:0);assert.ok(!status.textContent.includes('sensitive'));
});
test('Other is available only in admin mode and cleared on logout',async()=>{
 const f=fixture({session:adminSession()});f.evaluate('setAdminUi(false)');assert.equal(f.node('adminOtherService').hidden,true);assert.equal(f.node('adminOtherService').disabled,true);
 await f.initialize();assert.equal(f.node('adminOtherService').hidden,false);assert.equal(f.node('adminOtherService').disabled,false);f.node('service').value='other';await f.evaluate('toggleAdminMode()');assert.equal(f.node('service').value,'');assert.equal(f.node('adminOtherService').disabled,true);
});
test('Other requires an applied custom price, supports submission and Reset blocks again',async()=>{
 const f=fixture({session:adminSession()});await f.initialize();f.node('service').value='other';prepareSubmit(f);await f.submit();assert.equal(f.requests.filter(r=>r.options.method==='POST').length,0);assert.equal(f.node('adminServicePriceError').hidden,false);
 f.node('adminCustomPrice').value='185';f.evaluate('applyAdminPrice()');assert.equal(f.node('adminServicePriceError').hidden,true);assert.equal(f.evaluate('getTotalPrice().total'),185);assert.match(f.node('adminCalculatedPrice').textContent,/No automatic fare/);await f.submit();const post=f.requests.find(r=>r.options.method==='POST');assert.equal(JSON.parse(post.options.body).service_type,'other');assert.equal(JSON.parse(post.options.body).admin_override.custom_price,185);
 f.evaluate('resetAdminPrice()');assert.equal(f.evaluate('validateAdminService()'),false);assert.equal(f.node('summaryTotal').textContent,'Custom price required');
});
