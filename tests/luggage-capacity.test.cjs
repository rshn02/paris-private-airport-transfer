const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function fixture({script='js/reservation-phone-v2.js',session=null,authorized=true,networkError=false,delay,bookingFailure=false}={}){
 const nodes=new Map(),requests=[],alerts=[],analytics=[],timers=new Map();let callback,clock=0;
 const values={name:'Test Customer',email:'client@example.com','phone-full':'+447700900123',pickup:'CDG',destination:'Paris',date:'2026-12-01',time:'12:00',passengers:'2',child:'0',luggage:'1 bag','baby-seat-input':'0','child-seat-input':'0',service:'cdg-paris',adminPromoType:'fixed'};
 function node(id){if(!nodes.has(id)){const classes=new Set();nodes.set(id,{value:values[id]||'',textContent:'',innerHTML:'',hidden:id==='adminPanel',disabled:false,style:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x),contains:x=>classes.has(x)},addEventListener(){},focus(){},scrollIntoView(){},querySelector(){return null;}});}return nodes.get(id);}
 const auth={getSession:async()=>({data:{session}}),onAuthStateChange:fn=>{callback=fn;return{data:{subscription:{unsubscribe(){}}}};},signOut:async()=>{session=null;callback?.('SIGNED_OUT',null);return{};}};
 const context=vm.createContext({console:{log(){},warn(){},error(){}},AbortSignal,Date,URLSearchParams,
  setTimeout:(fn,ms)=>{timers.set(++clock,{fn,ms});return clock;},clearTimeout:id=>timers.delete(id),
  document:{documentElement:{lang:"en"},getElementById:node,addEventListener(){},querySelector:()=>({value:'cash'}),querySelectorAll:()=>[]},
  window:{ppatSupabase:{auth},location:{pathname:'/reservation'},PPATEmailOperations:{headers:async()=>({}),complete(){}},PPATMarketing:{getAttribution:()=>({source:'test'}),trackEvent:(name)=>{analytics.push(name);return true;}}},
  alert:msg=>alerts.push(msg),fetch:async(url,options)=>{
   requests.push({url,options});if(url.endsWith('/session')){if(delay)await delay;if(networkError)throw Error('private transport data');return{ok:authorized};}
   return{ok:!bookingFailure,text:async()=>JSON.stringify({success:!bookingFailure,booking_number:'TEST'})};
  }});
 vm.runInContext(fs.readFileSync(path.join(root,script),'utf8'),context);
 const evaluate=code=>vm.runInContext(code,context);
 return{node,requests,alerts,analytics,auth,evaluate,timers,async initialize(){evaluate('initializeAdminSession()');await evaluate('adminInitialization');},event(event,value){session=value;callback(event,value);},submit:()=>evaluate("handleFormSubmit({preventDefault(){},target:{reset(){}}})")};
}


const choices=['No bags','1 bag','2 bags','3 bags','4 bags','5+ bags','6','7','8'];
for(const script of ['js/reservation-phone-v2.js','js/reservation.js']){
 for(let bags=0;bags<=8;bags++)test(script+': '+bags+' exact suitcases preserve numeric payload, fares and suitable suggestion',async()=>{
  const f=fixture({script});await f.initialize();f.evaluate('validateForm=()=>true;setTripMode=()=>{};');
  f.node('luggage').value=choices[bags];f.evaluate('autoSelectVehicle()');
  assert.equal(f.evaluate('readSuitcaseCount()'),bags);assert.equal(f.evaluate('validateSuitcaseCapacity()'),true);
  assert.equal(f.node('vehicle-type').value,bags<=2?'Premium Sedan':'Luxury Van 7 seats');
  assert.equal(f.evaluate('getTotalPrice().total'),80);assert.equal(f.node('summarySuitcasesVal').textContent,String(bags));
  await f.submit();const data=JSON.parse(f.requests.find(x=>x.options.method==='POST').options.body);assert.equal(data.luggage,bags);
 });
 for(const value of ['more-than-8','9','99','8x','-1',''])test(script+': unsupported suitcase value '+value+' cannot post after async guard',async()=>{
  const f=fixture({script});await f.initialize();f.evaluate('validateForm=()=>true;');f.node('luggage').value=value;f.node('vehicle-type').value='Luxury Van 7 seats';
  await f.submit();assert.equal(f.requests.filter(x=>x.options.method==='POST').length,0);assert.equal(f.node('submitBtn').disabled,false);
 });
 test(script+': sedan accepts two suitcases and rejects three; hand luggage stays in notes',async()=>{
  const f=fixture({script});await f.initialize();f.node('vehicle-type').value='Premium Sedan';f.node('luggage').value='2 bags';assert.equal(f.evaluate('validateSuitcaseCapacity()'),true);
  f.node('luggage').value='3 bags';assert.equal(f.evaluate('validateSuitcaseCapacity()'),false);
  f.node('vehicle-type').value='Luxury Van 7 seats';f.node('notes').value='Two cabin bags and a stroller; please check space.';f.evaluate('validateForm=()=>true;setTripMode=()=>{};');await f.submit();
  const data=JSON.parse(f.requests.find(x=>x.options.method==='POST').options.body);assert.equal(data.luggage,3);assert.equal(data.notes,'Two cabin bags and a stroller; please check space.');
 });
}
test('both forms present 0–8 exact suitcase choices, contact sentinel and excluded-hand-luggage instructions',()=>{
 for(const [file,id]of [['reservation.html','luggage'],['manage-booking.html','modLuggage']]){
  const html=fs.readFileSync(path.join(root,file),'utf8');const select=html.match(new RegExp('<select id="'+id+'"[^>]*>([\\s\\S]*?)</select>'))[1];
  for(let bags=0;bags<=8;bags++)assert.ok(select.includes('>'+bags+(bags===1?' suitcase':' suitcases')+'</option>'));
  assert.match(select,/value="more-than-8">More than 8 suitcases — Contact us/);assert.match(html,/Number of suitcases/);assert.match(html,/excluding hand luggage/);
  assert.ok(!/name="(?:hand_luggage|carry_on)"/.test(html),'No invented hand-luggage field');
 }
});

test('new suitcase controls load their matching cache-versioned scripts',()=>{
 const reservation=fs.readFileSync(path.join(root,'reservation.html'),'utf8');const manage=fs.readFileSync(path.join(root,'manage-booking.html'),'utf8');
 assert.match(reservation,/src="js\/reservation-phone-v2\.js\?v=20261116-suitcases-1"/);
 assert.match(manage,/src="js\/manage-booking\.js\?v=20261116-suitcases-1"/);
});
