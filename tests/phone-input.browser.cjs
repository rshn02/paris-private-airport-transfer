const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.resolve(__dirname,'..');

test('real contact and booking forms: international phones, accessibility, submissions and mobile layout',async t=>{
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/contact.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if(!/\.(?:html|js|css)$/.test(file)){res.writeHead(404).end();return;}
  try {res.setHeader('Content-Type',({'html':'text/html','js':'text/javascript','css':'text/css','svg':'image/svg+xml'})[file.split('.').pop()]||'application/octet-stream');res.end(fs.readFileSync(file));}
  catch {res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 t.after(async()=>{await browser.close();await new Promise(resolve=>server.close(resolve));});
 for(const mobile of [false,true])for(const contact of [true,false]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000}});
  const errors=[],posts=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
   const url=route.request().url();
   if(url.startsWith(origin))return route.continue();
   if(url.includes('/api/contact')||url.includes('/api/bookings')){posts.push(JSON.parse(route.request().postData()));return route.fulfill({contentType:'application/json',body:JSON.stringify({success:true,booking_number:'TEST-PHONE'})});}
   return route.abort();
  });
  console.log('Checking',contact?'contact':'booking',mobile?'mobile':'desktop');
  await page.goto(origin+(contact?'/contact.html':'/reservation.html'));
  if(await page.getByRole('button',{name:'Reject all',exact:true}).isVisible()) await page.getByRole('button',{name:'Reject all',exact:true}).click();
  const ids=contact?{input:'contact-phone',hidden:'contact-phone-full',trigger:'contactCountryFlagDisplay',dropdown:'contactCountryDropdown',list:'contactCountryList',error:'contactPhoneError',form:'contactForm'}:{input:'phone-number',hidden:'phone-full',trigger:'countryFlagDisplay',dropdown:'countryDropdown',list:'countryList',error:'phoneError',form:'bookingForm'};
  const input=page.locator('#'+ids.input),trigger=page.locator('#'+ids.trigger),search=page.locator('#'+ids.dropdown+' input');
  const hidden=()=>page.locator('#'+ids.hidden).inputValue();
  async function select(country){await trigger.click();await search.fill(country);await page.locator('#'+ids.list+' [data-country="'+country+'"]').click();}
  assert.match(await trigger.getAttribute('aria-label'),/United States/);
  await trigger.click();assert.equal(await search.evaluate(el=>el===document.activeElement),true);
  await search.fill('+1');assert.ok(await page.locator('#'+ids.list+' [data-country="US"]').count());assert.ok(await page.locator('#'+ids.list+' [data-country="CA"]').count());
  await search.press('Escape');assert.equal(await trigger.getAttribute('aria-expanded'),'false');
  await trigger.press('ArrowDown');await search.press('ArrowDown');assert.equal(await page.locator('#'+ids.list+' button').first().evaluate(el=>el===document.activeElement),true);
  await page.keyboard.press('Escape');
  await trigger.click();await search.fill('France');await search.press('Enter');assert.match(await trigger.getAttribute('aria-label'),/France/);assert.equal(posts.length,0);
  for(const [country,number,e164]of [['US','(202) 555-0123','+12025550123'],['CA','416-555-0123','+14165550123'],['FR','06 12 34 56 78','+33612345678'],['GB','07400 123456','+447400123456']]){
   await input.fill('');await select(country);await input.fill(number);await input.blur();assert.equal(await hidden(),e164);assert.equal(await input.getAttribute('aria-invalid'),'false');
  }
  for(const [country,number]of [['FR','061234567890'],['US','202555'],['FR','07400123456']]){
   await input.fill('');await select(country);await input.fill(number);await input.blur();assert.equal(await hidden(),'');assert.equal(await input.getAttribute('aria-invalid'),'true');
   await page.evaluate(id=>document.getElementById(id).requestSubmit(),ids.form);assert.equal(posts.length,0);
  }
  // Input events after a paste/autofill detect the complete international number.
  await input.fill('+1 (416) 555-0123');assert.match(await trigger.getAttribute('aria-label'),/Canada/);assert.equal(await hidden(),'+14165550123');
  await input.fill('+33 6 12 34 56 78');assert.match(await trigger.getAttribute('aria-label'),/France/);assert.equal(await hidden(),'+33612345678');
  await input.fill('06 12 34 56 78');await select('US');assert.equal(await input.inputValue(),'06 12 34 56 78');assert.equal(await hidden(),'');
  await input.fill('+44 7400 123456');await select('FR');assert.equal(await hidden(),'');assert.equal(await input.inputValue(),'7400123456');
  await input.fill('+12025550123');
  if(contact){
   await page.locator('#contact-name').fill('Test Customer');await page.locator('#contact-email').fill('client@example.com');await page.locator('#contact-subject').selectOption('quote');await page.locator('#contact-message').fill('Test message');
   await input.fill('123');await page.locator('#contactSubmitBtn').click();assert.equal(posts.length,0);assert.equal(await page.locator('#contact-name').inputValue(),'Test Customer');
   await input.fill('+14165550123');await page.locator('#contactSubmitBtn').click();
  }else{
   for(const [id,value]of [['name','Test Customer'],['email','client@example.com'],['pickup','CDG'],['destination','Paris'],['date','2027-12-01'],['time','12:00']])await page.locator('#'+id).fill(value);
   await page.locator('#service').selectOption('cdg-paris');await page.locator('#passengers').selectOption('2');await page.locator('#luggage').selectOption({index:1});await page.locator('#vehicle-type').selectOption({index:1});await page.locator('#cgv').check();
   await input.fill('123');await page.locator('#submitBtn').click();assert.equal(posts.length,0);assert.equal(await page.locator('#name').inputValue(),'Test Customer');
   await input.fill('+14165550123');await page.locator('#submitBtn').click();
  }
  await page.waitForFunction(()=>document.querySelector('#contactSelectedDial, #selectedDial')?.textContent==='+1');
  assert.equal(posts.length,1,JSON.stringify({contact,mobile,errors}));
  assert.equal(posts[0][contact?'phone':'customer_phone'],'+14165550123');assert.equal(posts[0].phone_country,'CA');
  await page.waitForFunction(id=>!document.getElementById(id).value,ids.input);
  assert.match(await trigger.getAttribute('aria-label'),/United States/);
  await trigger.click();const box=await page.locator('#'+ids.dropdown).boundingBox();assert.ok(box.x>=0&&box.x+box.width<=(mobile?390:1440));
  await page.screenshot({path:path.join(process.env.PHONE_SCREENSHOTS||'/tmp',`phone-${contact?'contact':'booking'}-${mobile?'mobile':'desktop'}.png`),fullPage:false});
  assert.deepEqual(errors,[]);
  await page.close();
 }
});
