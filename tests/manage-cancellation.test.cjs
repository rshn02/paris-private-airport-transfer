const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
for(const service of ['cdg-paris','other'])test('Manage Booking finds and cancels '+service+' without sending a price or using modify',async()=>{
 const booking={booking_number:'TEST-1',customer_email:'client@example.com',customer_name:'Test Client',status:'confirmed',service_type:service,price:185,discount_amount:25,passengers:2};
 const nodes=new Map(),requests=[];let ready;
 function node(id){if(!nodes.has(id)){
  let value='';const listeners={};nodes.set(id,{get value(){return value},set value(next){value=id==='modService'&&next==='other'?'':next;},hidden:true,disabled:false,textContent:'',innerHTML:'',style:{},classList:{toggle(){},add(){},remove(){}},scrollIntoView(){},addEventListener:(event,fn)=>listeners[event]=fn,listeners});
 }return nodes.get(id);}
 const context=vm.createContext({console:{error(){}},document:{getElementById:node,addEventListener:(event,fn)=>ready=fn},window:{PPATEmailOperations:{headers:async()=>({}),complete(){}}},alert:()=>assert.fail('Unexpected alert'),fetch:async(url,options)=>{
  requests.push({url,body:JSON.parse(options.body)});
  assert.ok(url.endsWith('/find')||url.endsWith('/cancel'));
  return{ok:true,json:async()=>({success:true,booking:{...booking,...(url.endsWith('/cancel')?{status:'cancelled'}:{})}})};
 }});
 for(const file of ['js/pricing.js','js/manage-booking.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
 ready();node('refInput').value='TEST-1';node('emailInput').value='client@example.com';
 await node('searchForm').listeners.submit({preventDefault(){}});
 assert.equal(node('searchError').textContent,'Reservation found successfully.');assert.equal(node('cancelBtn').disabled,false);
 node('cancelBtn').listeners.click();assert.equal(node('cancelModal').hidden,false);
 await node('modalConfirmBtn').listeners.click();
 assert.equal(requests.length,2);assert.deepEqual(requests[1].body,{booking_number:'TEST-1',customer_email:'client@example.com'});assert.equal(node('cancelBtn').disabled,true);assert.equal(node('cancelModal').hidden,true);
 assert.equal(vm.runInContext('currentBooking.price',context),185);
});
