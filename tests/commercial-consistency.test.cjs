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

for (const script of ['js/reservation-phone-v2.js','js/reservation.js']) {
 test(script+': eight passengers accepted, nine directed to contact, sedan retained',()=>{
  const f=fixture({script}); f.evaluate('updatePriceSummary=()=>{};');
  for(const [adults,children,expected] of [[1,0,'Premium Sedan'],[2,0,'Premium Sedan'],[7,1,'Luxury Van 7 seats'],[8,0,'Luxury Van 7 seats'],[8,1,''],[8,8,'']]){
   f.node('passengers').value=String(adults);f.node('child').value=String(children);f.evaluate('autoSelectVehicle()');
   assert.equal(f.node('vehicle-type').value,expected);
   assert.equal(f.evaluate('validatePassengerCapacity()'),adults+children<=8);
   if(adults+children>8){assert.equal(f.node('passengerContactHint').hidden,false);assert.equal(f.node('submitBtn').disabled,true);}
  }
  f.node('passengers').value='3';f.node('child').value='0';f.node('vehicle-type').value='Premium Sedan';
  assert.equal(f.evaluate('validatePassengerCapacity()'),false);
 });
}
test('capacity guard blocks a nine-person payload even if ordinary validation is bypassed',async()=>{
 const f=fixture();await f.initialize();f.evaluate('validateForm=()=>true;');
 f.node('passengers').value='8';f.node('child').value='1';await f.submit();
 assert.equal(f.requests.filter(r=>r.options.method==='POST').length,0);
 assert.equal(f.node('submitBtn').disabled,true);
});
test('eight-person payload preserves vehicle identifier, luggage and free-seat counts',async()=>{
 const f=fixture();await f.initialize();f.evaluate('validateForm=()=>true;setTripMode=()=>{};');
 f.node('passengers').value='6';f.node('child').value='2';f.node('vehicle-type').value='Luxury Van 7 seats';
 f.node('luggage').value='5+ bags';f.node('baby-seat-input').value='1';f.node('child-seat-input').value='1';await f.submit();
 const body=JSON.parse(f.requests.find(r=>r.options.method==='POST').options.body);
 assert.equal(body.passengers+body.children,8);assert.equal(body.vehicle_type,'Luxury Van 7 seats');
 assert.equal(body.luggage,5);assert.equal(body.baby_seats,1);assert.equal(body.child_seats,1);
});
test('free-seat policy, van seating and luggage caveat remain visible',()=>{
 for(const file of ['index.html','flotte.html','reservation.html','manage-booking.html','pages/cgv.html','cdg-to-paris.html','cdg-to-disneyland.html','orly-to-disneyland.html','beauvais-to-disneyland.html','paris-to-disneyland.html','beauvais-to-paris.html','disneyland-transfer.html']){
  assert.match(fs.readFileSync(path.join(root,file),'utf8'),file==='index.html' ? /Free baby and child seats on request/ : /Baby seats and child seats are available free of charge upon request/);
 }
 for(const file of ['reservation.html','manage-booking.html'])assert.match(fs.readFileSync(path.join(root,file),'utf8'),/value="Luxury Van 7 seats">\s*Private Van \(1–8 passengers, excluding the chauffeur\)/);
 const fleet=fs.readFileSync(path.join(root,'flotte.html'),'utf8');assert.match(fleet,/8 large suitcases/);assert.match(fleet,/depends on passenger numbers and child-seat configuration/);
});
test('fare tables and surcharges match the pre-batch fixture; seats add no charge',()=>{
 const expected=require('./fixtures/phase2a-pricing-baseline.json');
 for(const script of ['js/pricing.js','js/reservation-phone-v2.js','js/reservation.js']){
  const f=fixture({script});const actual=JSON.parse(f.evaluate('JSON.stringify({PRICING,NIGHT_SURCHARGE})'));
  assert.deepEqual(actual,expected[script]);
 }
 const f=fixture({script:'js/pricing.js'});
 assert.equal(f.evaluate("calculatePrice({service:'cdg-paris',passengers:7,children:1,time:'12:00',baby_seats:1,child_seats:2}).total"),130);
 assert.equal(f.evaluate("calculatePrice({service:'cdg-paris',passengers:8,trip_type:'round_trip',time:'23:00',return_time:'05:00'}).total"),280);
});
