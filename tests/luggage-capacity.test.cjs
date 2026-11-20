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
  assert.equal(f.node('vehicle-type').value,bags<=3?'Premium Sedan':'Luxury Van 7 seats');
  assert.equal(f.evaluate('getTotalPrice().total'),bags>=4?85:80);assert.equal(f.node('summarySuitcasesVal').textContent,String(bags));
  await f.submit();const data=JSON.parse(f.requests.find(x=>x.options.method==='POST').options.body);assert.equal(data.luggage,bags);
 });
 for(const value of ['more-than-8','9','99','8x','-1',''])test(script+': unsupported suitcase value '+value+' cannot post after async guard',async()=>{
  const f=fixture({script});await f.initialize();f.evaluate('validateForm=()=>true;');f.node('luggage').value=value;f.node('vehicle-type').value='Luxury Van 7 seats';
  await f.submit();assert.equal(f.requests.filter(x=>x.options.method==='POST').length,0);assert.equal(f.node('submitBtn').disabled,['more-than-8','9','99'].includes(value));
 });
 test(script+': sedan accepts three suitcases and rejects four; hand luggage stays in notes',async()=>{
  const f=fixture({script});await f.initialize();f.node('vehicle-type').value='Premium Sedan';f.node('luggage').value='2 bags';assert.equal(f.evaluate('validateSuitcaseCapacity()'),true);
  f.node('luggage').value='3 bags';assert.equal(f.evaluate('validateSuitcaseCapacity()'),true);
  f.node('luggage').value='4 bags';assert.equal(f.evaluate('validateSuitcaseCapacity()'),false);f.node('luggage').value='3 bags';
  f.node('vehicle-type').value='Luxury Van 7 seats';f.node('notes').value='Two cabin bags and a stroller; please check space.';f.evaluate('validateForm=()=>true;setTripMode=()=>{};');await f.submit();
  const data=JSON.parse(f.requests.find(x=>x.options.method==='POST').options.body);assert.equal(data.luggage,3);assert.equal(data.notes,'Two cabin bags and a stroller; please check space.');
 });
}
test('both forms present 0–8 exact suitcase choices, contact sentinel and excluded-hand-luggage instructions',()=>{
 for(const [file,id]of [['reservation.html','luggage'],['manage-booking.html','modLuggage']]){
  const html=fs.readFileSync(path.join(root,file),'utf8');const select=html.match(new RegExp('<select id="'+id+'"[^>]*>([\\s\\S]*?)</select>'))[1];
  for(let bags=0;bags<=8;bags++)assert.ok(select.includes('>'+bags+(bags===1?' suitcase':' suitcases')+'</option>'));
  assert.match(select,file==='reservation.html'?/value="more-than-8">More than 8 suitcases<\/option>/:/value="more-than-8">More than 8 suitcases — Contact us<\/option>/);assert.match(html,/Number of suitcases/);assert.match(html,/excluding hand luggage/);
  assert.ok(!/name="(?:hand_luggage|carry_on)"/.test(html),'No invented hand-luggage field');
 }
});

test('new suitcase controls load their matching cache-versioned scripts',()=>{
 const reservation=fs.readFileSync(path.join(root,'reservation.html'),'utf8');const manage=fs.readFileSync(path.join(root,'manage-booking.html'),'utf8');
 assert.match(reservation,/src="js\/reservation-phone-v2\.js\?v=20261120-van-threshold4-1"/);
 assert.match(manage,/src="js\/manage-booking\.js\?v=20261120-van-threshold4-1"/);
});

for(const script of ['js/reservation-phone-v2.js','js/reservation.js']) {
 for(const [adults,kids,bags,vehicle] of [[1,0,0,'Premium Sedan'],[2,0,2,'Premium Sedan'],[2,0,3,'Premium Sedan'],[3,0,1,'Luxury Van 7 seats'],[6,0,6,'Luxury Van 7 seats'],[8,0,8,'Luxury Van 7 seats'],[1,1,2,'Premium Sedan']]) {
  test(`${script}: automatic card for ${adults}+${kids} passengers / ${bags} suitcases`,()=>{
   const f=fixture({script});f.node('passengers').value=String(adults);f.node('child').value=String(kids);f.node('luggage').value=choices[bags];
   f.evaluate('autoSelectVehicle()');assert.equal(f.node('vehicle-type').value,vehicle);
   assert.equal(f.node('vehicleHintText').textContent,vehicle==='Premium Sedan'?'Private Sedan':'Private Van');
   assert.equal(f.node('passengerContactHint').hidden,true);assert.equal(f.node('luggageContactHint').hidden,true);assert.equal(f.node('submitBtn').disabled,false);
   if(vehicle==='Luxury Van 7 seats')assert.match(f.node('vehicleCapacityText').textContent,/Configuration to confirm/);
  });
 }
 test(script+': excess and recovery independently synchronize both notices, vehicle and action',async()=>{
  const f=fixture({script});await f.initialize();f.node('passengers').value='8';f.node('child').value='1';f.node('luggage').value='more-than-8';f.evaluate('autoSelectVehicle()');
  assert.equal(f.node('passengerContactHint').hidden,false);assert.equal(f.node('luggageContactHint').hidden,false);assert.equal(f.node('vehicle-type').value,'');assert.equal(f.node('submitBtn').disabled,true);
  await f.submit();assert.equal(f.requests.filter(x=>x.options.method==='POST').length,0);
  f.node('child').value='0';f.evaluate('autoSelectVehicle()');assert.equal(f.node('passengerContactHint').hidden,true);assert.equal(f.node('luggageContactHint').hidden,false);assert.equal(f.node('submitBtn').disabled,true);
  f.node('luggage').value='8';f.evaluate('updateLuggageSelection()');assert.equal(f.node('luggageContactHint').hidden,true);assert.equal(f.node('submitBtn').disabled,false);assert.equal(f.node('vehicle-type').value,'Luxury Van 7 seats');
  f.node('passengers').value='2';f.node('luggage').value='2 bags';f.evaluate('autoSelectVehicle()');assert.equal(f.node('vehicle-type').value,'Premium Sedan');
  f.node('passengers').value='';f.node('child').value='0';f.node('luggage').value='';f.evaluate('autoSelectVehicle()');assert.equal(f.node('vehicle-type').value,'');assert.equal(f.node('vehicleHintText').textContent,'Your private vehicle');
 });
 test(script+': capacity changes while awaiting session cannot submit or re-enable unsupported booking',async()=>{
  const f=fixture({script});await f.initialize();f.evaluate('validateForm=()=>true; adminInitialization=new Promise(resolve=>{window.releaseAdmin=resolve;});');f.evaluate('autoSelectVehicle()');
  const pending=f.submit();assert.equal(f.node('submitBtn').disabled,true);
  f.node('child').value='7';f.evaluate('autoSelectVehicle()');f.evaluate('window.releaseAdmin()');await pending;
  assert.equal(f.requests.filter(x=>x.options.method==='POST').length,0);assert.equal(f.node('submitBtn').disabled,true);
  f.node('child').value='0';f.evaluate('autoSelectVehicle()');assert.equal(f.node('submitBtn').disabled,false);
 });
 test(script+': returning to supported capacity during pending submission does not unlock duplicate sends',async()=>{
  const f=fixture({script});await f.initialize();f.evaluate('validateForm=()=>true; adminInitialization=new Promise(resolve=>{window.releaseAdmin=resolve;});');f.evaluate('autoSelectVehicle()');
  const pending=f.submit();f.node('luggage').value='more-than-8';f.evaluate('autoSelectVehicle()');f.node('luggage').value='2 bags';f.evaluate('autoSelectVehicle()');
  assert.equal(f.node('submitBtn').disabled,true);await f.submit();assert.equal(f.requests.filter(x=>x.options.method==='POST').length,0);
  f.evaluate('window.releaseAdmin()');await pending;assert.equal(f.requests.filter(x=>x.options.method==='POST').length,1);assert.equal(f.node('submitBtn').disabled,false);
 });
}
test('automatic vehicle control is not customer-selectable and disclosures are optional, complete and compact',()=>{
 const html=fs.readFileSync(path.join(root,'reservation.html'),'utf8');
 assert.match(html,/<select id="vehicle-type"[^>]*hidden[^>]*tabindex="-1"/);
 assert.match(html,/Your vehicle is automatically selected based on your group size\./);
 assert.match(html,/Large suitcases only\. Hand luggage is not included\./);
 assert.match(html,/<details class="vehicle-guidance">[\s\S]*up to 8 large suitcases[\s\S]*not every combination will fit[\s\S]*Special Requests/);
 assert.equal((html.match(/class="capacity-notice"[^>]*hidden/g)||[]).length,2);
 assert.equal((html.match(/Contact us for a quote/g)||[]).length,2);
});

for(const script of ['js/reservation-phone-v2.js','js/reservation.js']) {
 for(const [people,bags,fee,vehicle] of [[1,0,0,'Premium Sedan'],[1,2,0,'Premium Sedan'],[1,3,0,'Premium Sedan'],[1,4,5,'Luxury Van 7 seats'],[1,8,5,'Luxury Van 7 seats'],[2,2,0,'Premium Sedan'],[2,3,0,'Premium Sedan'],[2,4,5,'Luxury Van 7 seats'],[2,5,5,'Luxury Van 7 seats'],[2,8,5,'Luxury Van 7 seats'],[3,4,0,'Luxury Van 7 seats'],[6,6,0,'Luxury Van 7 seats'],[8,8,0,'Luxury Van 7 seats']])test(`${script}: fee/card/breakdown ${people}/${bags}`,()=>{
  const f=fixture({script});f.node('passengers').value=String(people);f.node('luggage').value=choices[bags];f.evaluate('autoSelectVehicle()');const result=f.evaluate('getTotalPrice()');assert.equal(result.vehicleSurcharge,fee);assert.equal(f.node('vehicle-type').value,vehicle);assert.equal(f.node('summaryLuggageVehicleFee').style.display,fee?'flex':'none');assert.equal(result.total,result.base+(fee||0));
 });
 test(script+': live transitions remove, add and never duplicate the booking fee',()=>{
  const f=fixture({script});for(const [people,bags,fee,total]of [[2,4,5,85],[2,3,0,80],[2,4,5,85],[3,4,0,90],[2,4,5,85]]){f.node('passengers').value=String(people);f.node('luggage').value=choices[bags];f.evaluate('autoSelectVehicle()');assert.equal(f.evaluate('getTotalPrice().vehicleSurcharge'),fee);assert.equal(f.evaluate('getTotalPrice().total'),total);}
 });
 test(script+': new requests acknowledge the current server pricing contract',async()=>{const f=fixture({script});await f.initialize();f.evaluate('validateForm=()=>true;setTripMode=()=>{};');f.node('luggage').value=choices[4];f.evaluate('autoSelectVehicle()');await f.submit();const payload=JSON.parse(f.requests.find(x=>x.options.method==='POST').options.body);assert.equal(payload.pricing_version,'van-luggage-v1');assert.equal(f.evaluate('getTotalPrice().total'),85);});
}

for(const script of ['js/reservation-phone-v2.js','js/reservation.js'])test(script+': custom total stays all-inclusive and night/return fee stays once per booking',()=>{
 const f=fixture({script});f.node('luggage').value=choices[4];f.node('time').value='23:00';f.node('return-time').value='05:00';f.evaluate('state.isRoundTrip=true;autoSelectVehicle();');assert.equal(f.evaluate('getTotalPrice().total'),185);assert.equal(f.evaluate('getTotalPrice().vehicleSurcharge'),5);
 f.evaluate('state.adminMode=true;state.customPrice=150;updatePriceSummary();');assert.equal(f.evaluate('getTotalPrice().total'),150);assert.equal(f.evaluate('getTotalPrice().vehicleSurcharge'),0);assert.equal(f.node('summaryLuggageVehicleFee').style.display,'none');
});
