// Synthetic local-only submissions. Never contact the live booking API.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),files=require('../scripts/public-files.json').files;
const artifact=process.env.PUBLIC_TEST_ROOT||path.join(root,'dist');
const config=require('../vercel.json');
test('commercial capacity, form payloads, prefills and all public pages at six widths',async t=>{
 const server=http.createServer((req,res)=>{
  let p=new URL(req.url,'http://localhost').pathname;
  const rewrite=config.rewrites.find(x=>x.source===p);p=rewrite?rewrite.destination:p;
  p=p==='/'?'index.html':p.slice(1);if(!path.extname(p))p+='.html';
  if(!files.includes(p)){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(p)]||'application/octet-stream');
  res.end(fs.readFileSync(path.join(artifact,p)));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 t.after(async()=>{await browser.close();await new Promise(r=>server.close(r));});
 const c=await browser.newContext(),posts=[],errors=[];
 const booking={booking_number:'SYNTHETIC',customer_name:'Synthetic',customer_email:'synthetic@example.test',service_type:'cdg-paris',booking_date:'2027-12-01',booking_time:'12:00',pickup_location:'CDG',destination:'Paris',passengers:8,children:0,luggage:5,baby_seats:0,child_seats:0,vehicle_type:'Luxury Van 7 seats',status:'confirmed',price:130};
 await c.route('**/*',r=>{
  const q=r.request(),u=new URL(q.url());
  if(q.method()==='POST'){
   assert.ok(u.pathname.startsWith('/api/'));
   posts.push({url:u.pathname,body:JSON.parse(q.postData())});
   return r.fulfill({contentType:'application/json',body:JSON.stringify({success:true,booking_number:'SYNTHETIC',booking})});
  }
  if(u.origin===base)return r.continue();
  if(['fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com','cdn.jsdelivr.net'].includes(u.hostname))return r.continue();
  return r.abort();
 });
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());
 await p.goto(base+'/reservation?route=cdg-paris');await p.locator('[data-action="reject"]').click();
 async function prepare(adults,kids,suitcases=5){
  await p.goto(base+'/reservation?route=cdg-paris');
  assert.equal(await p.locator('#pickup').inputValue(),'Charles de Gaulle Airport (CDG)');
  for(const [id,v] of [['name','Synthetic Customer'],['email','synthetic@example.test'],['destination','Paris test address'],['date','2027-12-01'],['time','12:00'],['phone-number','+14165550123']])await p.locator('#'+id).fill(v);
  await p.locator('#passengers').selectOption(String(adults));await p.locator('#child').selectOption(String(kids));
  await p.locator('#luggage').selectOption(['No bags','1 bag','2 bags','3 bags','4 bags','5+ bags','6','7','8'][suitcases]);await p.locator('#cgv').check();
 }
 for(const [adults,kids,suitcases] of [[8,0,5],[6,2,5],[2,0,2],[2,0,5]]){
  await prepare(adults,kids,suitcases);const before=posts.length;
  if(kids){await p.evaluate(()=>{changeSeat('baby',1);changeSeat('child-seat',1);});}
  assert.equal(await p.locator('#vehicle-type').inputValue(),adults+kids>2||suitcases>2?'Luxury Van 7 seats':'Premium Sedan');
  await p.locator('#submitBtn').click();await p.waitForFunction(()=>!document.querySelector('#submitBtn').disabled);
  assert.equal(posts.length,before+1);const data=posts.at(-1).body;
  assert.equal(data.passengers+data.children,adults+kids);assert.equal(data.luggage,suitcases);
  assert.equal(data.baby_seats,kids?1:0);assert.equal(data.child_seats,kids?1:0);
 }
 for(const kids of [1,8]){
  await prepare(8,kids);const before=posts.length;
  await p.evaluate(()=>setTripMode(true));await p.locator('#return-date').fill('2027-12-02');await p.locator('#return-time').fill('23:00');
  assert.equal(await p.locator('#summaryRoundtrip').isVisible(),false);assert.equal(await p.locator('#summaryNight').isVisible(),false);
  assert.match(await p.locator('#summaryTotal').textContent(),/Contact us/);
  await p.locator('#submitBtn').click();assert.equal(posts.length,before);
  assert.match(await p.locator('#fg-passengers .field-error').innerText(),/two vehicles/);
  assert.equal(await p.locator('#fg-passengers .field-error a').getAttribute('href'),'/contact');
 }
 await prepare(3,0);await p.locator('#vehicle-type').selectOption('Premium Sedan');const before=posts.length;
 await p.locator('#submitBtn').click();assert.equal(posts.length,before);assert.match(await p.locator('#fg-vehicle .field-error').innerText(),/up to 2/);
 // Exact suitcase counts, contact-only sentinel and manual vehicle override safety.
 for(let bags=0;bags<=8;bags++){
  await prepare(1,0,bags);const count=posts.length;
  assert.equal(await p.locator('#vehicle-type').inputValue(),bags<=2?'Premium Sedan':'Luxury Van 7 seats');
  assert.equal(await p.locator('#summarySuitcasesVal').textContent(),String(bags));
  assert.match(await p.locator('#summaryTotal').textContent(),/80/);
  await p.locator('#notes').fill('Two cabin bags and a stroller; please check configuration.');
  await p.locator('#submitBtn').click();await p.waitForFunction(()=>!document.querySelector('#submitBtn').disabled);
  assert.equal(posts.length,count+1);assert.equal(posts.at(-1).body.luggage,bags);
  assert.match(posts.at(-1).body.notes,/Two cabin bags/);
 }
 await prepare(8,0,8);let suitcaseCount=posts.length;await p.locator('#submitBtn').click();await p.waitForFunction(()=>!document.querySelector('#submitBtn').disabled);assert.equal(posts.length,suitcaseCount+1);assert.equal(posts.at(-1).body.luggage,8);
 await prepare(2,0,2);await p.locator('#luggage').selectOption('more-than-8');
 assert.equal(await p.locator('#luggageContactHint').isVisible(),true);assert.equal(await p.locator('#luggageContactHint a').getAttribute('href'),'/contact');
 assert.match(await p.locator('#luggageContactHint').innerText(),/Travelling with more than 8 suitcases.*suitable vehicle solution/s);
 await p.locator('#vehicle-type').selectOption('Luxury Van 7 seats');
 suitcaseCount=posts.length;await p.locator('#submitBtn').click();assert.equal(posts.length,suitcaseCount);assert.equal(await p.locator('#summaryTotal').textContent(),'Contact us');assert.match(await p.locator('#fg-luggage .field-error').innerText(),/contact us/);
 await prepare(2,0,3);await p.locator('#vehicle-type').selectOption('Premium Sedan');await p.locator('#submitBtn').click();assert.equal(posts.length,suitcaseCount);assert.match(await p.locator('#fg-vehicle .field-error').innerText(),/2 large suitcases/);
 // Existing booking modifications use the same capacity guard and retained API identifier.
 await p.goto(base+'/manage-booking');await p.locator('#refInput').fill('SYNTHETIC');await p.locator('#emailInput').fill('synthetic@example.test');
 await p.locator('#searchForm').evaluate(f=>f.requestSubmit());await p.waitForFunction(()=>currentBooking!==null);await p.locator('#modifyBtn').click();
 for(const kids of [1,0]){
  await p.locator('#modPassengers').selectOption('8');await p.locator('#modChildren').selectOption(String(kids));
  const count=posts.filter(x=>x.url.endsWith('/modify')).length;
  await p.locator('#modifyForm').evaluate(f=>f.requestSubmit());
  if(kids){assert.equal(posts.filter(x=>x.url.endsWith('/modify')).length,count);assert.match(await p.locator('#searchError').textContent(),/two vehicles/);}
  else {await p.waitForFunction(()=>document.querySelector('#searchError').textContent.includes('success'));assert.equal(posts.filter(x=>x.url.endsWith('/modify')).length,count+1);assert.equal(posts.at(-1).body.vehicle_type,'Luxury Van 7 seats');}
 }
 assert.equal(await p.locator('#legacyLuggageNote').isVisible(),false); // Editing section closed after save.
 for(let bags=0;bags<=8;bags++){
  if(!await p.locator('#modLuggage').isVisible())await p.locator('#modifyBtn').click();
  await p.locator('#modPassengers').selectOption('8');await p.locator('#modChildren').selectOption('0');await p.locator('#modLuggage').selectOption(String(bags));
  assert.equal(await p.locator('#manageSummarySuitcases').textContent(),String(bags));
  const count=posts.filter(x=>x.url.endsWith('/modify')).length;
  await p.locator('#modifyForm').evaluate(f=>f.requestSubmit());await p.waitForFunction(()=>document.querySelector('#modifySection').hidden);
  assert.equal(posts.filter(x=>x.url.endsWith('/modify')).length,count+1);assert.equal(posts.at(-1).body.luggage,bags);
 }
 await p.locator('#modifyBtn').click();assert.equal(await p.locator('#legacyLuggageNote').isVisible(),true);
 await p.locator('#modLuggage').selectOption('more-than-8');await p.locator('#modVehicle').selectOption('Luxury Van 7 seats');
 suitcaseCount=posts.length;await p.locator('#modifyForm').evaluate(f=>f.requestSubmit());assert.equal(posts.length,suitcaseCount);assert.equal(await p.locator('#manageLuggageContactHint').isVisible(),true);assert.equal(await p.locator('#manageLuggageContactHint a').getAttribute('href'),'/contact');
 // Stored zero remains selected; no empty/zero coercion on modification prefill.
 booking.luggage=0;await p.goto(base+'/manage-booking');await p.locator('#refInput').fill('SYNTHETIC');await p.locator('#emailInput').fill('synthetic@example.test');await p.locator('#searchForm').evaluate(f=>f.requestSubmit());await p.waitForFunction(()=>currentBooking!==null);await p.locator('#modifyBtn').click();assert.equal(await p.locator('#modLuggage').inputValue(),'0');assert.equal(await p.locator('#legacyLuggageNote').isVisible(),false);
 for(const service of ['normandy','champagne']){await p.goto(base+'/contact?service='+service);assert.match(await p.locator('#contact-message').inputValue(),new RegExp(service,'i'));}
 await p.goto(base+'/reservation');for(const hours of [4,8,10])await p.locator('#service').selectOption('dispo-'+hours+'h');
 const layouts=[];console.log('PASS synthetic booking, modification and prefill checks');
 for(const width of [320,360,375,390,768,1440]){
  await p.setViewportSize({width,height:900});
  console.log('Checking layouts at',width);
  for(const file of files.filter(x=>x.endsWith('.html'))){
   await p.goto(base+'/'+file);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(file==='index.html'?1800:500);
   const scroll=await p.evaluate(()=>({document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
   // Document width detects user-scrollable overflow; record body width as a diagnostic.
   // Explicit edited-text bounds below also catch new clipping under existing CSS.
   assert.ok(scroll.document<=width+1,JSON.stringify({file,width,...scroll}));
   const editedTextOverflow=await p.locator('p, li, option').evaluateAll(nodes=>nodes.filter(e=>e.tagName!=='OPTION'&&/Baby seats and child seats are available free|Private vans accommodate|Travelling with more than 8 passengers|Our private van can accommodate|Travelling with more than 8 suitcases|1–8 passengers/.test(e.textContent)).map(e=>e.getBoundingClientRect()).filter(r=>r.width&&(r.left< -1||r.right>innerWidth+1)).map(r=>({left:r.left,right:r.right})));
   assert.deepEqual(editedTextOverflow,[],file+' new text overflow '+width);
   layouts.push({file,width,...scroll});
   if(process.env.COMMERCIAL_SCREENSHOTS&&[320,1440].includes(width)){
    const selector={'flotte.html':'.fleet-specs','services.html':'.page-header','hourly-service.html':'.hourly-service-package-grid','reservation.html':'#fg-vehicle'}[file];
    if(selector)await p.locator(selector).last().screenshot({path:path.join(process.env.COMMERCIAL_SCREENSHOTS,file+'-section-'+width+'.png')});
   }
  }
 }
 for(const file of ['/seo-audit/17-phase2-commercial-consistency-implementation.md','/tests/commercial-consistency.test.cjs','/.env','/scripts/public-files.json'])assert.equal((await p.request.get(base+file)).status(),404);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({layouts:layouts.length,mockedPosts:posts.length,pageErrors:errors}));
 if(process.env.COMMERCIAL_LAYOUT_REPORT)fs.writeFileSync(process.env.COMMERCIAL_LAYOUT_REPORT,JSON.stringify(layouts,null,2));
});
