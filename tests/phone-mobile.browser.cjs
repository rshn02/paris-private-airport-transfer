const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.resolve(__dirname,'..',process.env.PHONE_TEST_DIST?'dist':'.');
const output=process.env.PHONE_MOBILE_REPORT;

for(const engine of (process.env.PHONE_TEST_ENGINES||'chromium,webkit').split(',')){
 test(`${engine}: touch country selection in contact and booking forms`,async t=>{
  const server=http.createServer((req,res)=>{
   const url=new URL(req.url,'http://localhost');
   const file=path.resolve(root,'.'+url.pathname);
   if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
   try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
    const body=fs.readFileSync(file);
    res.end(file.endsWith('.html')&&url.searchParams.get('lang')==='fr'?body.toString().replace('<html lang="en">','<html lang="fr">'):body);}
   catch{res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const browser=await ({chromium,webkit})[engine].launch({headless:true,...(engine==='chromium'&&process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
  t.after(()=>browser.close());
  const origin='http://127.0.0.1:'+server.address().port;
  const results=[];
  t.after(()=>{if(output)fs.writeFileSync(output+'-'+engine+'.json',JSON.stringify(results,null,2)+'\n');});
  for(const form of ['contact','reservation']){
   const page=await browser.newPage({...devices[engine==='webkit'?'iPhone 13':'Pixel 7']});
   const errors=[],posts=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',route=>{
    if(route.request().url().startsWith(origin+'/'))return route.continue();
    if(route.request().method()==='POST')posts.push(route.request().url());
    return route.abort();
   });
   await page.goto(origin+'/'+form+'.html');
   if(await page.getByRole('button',{name:'Reject all',exact:true}).isVisible())await page.getByRole('button',{name:'Reject all',exact:true}).tap();
   await page.evaluate(()=>{
    window.phoneTouchEvents=[];
    for(const type of ['pointerdown','pointerup','pointercancel','touchstart','touchend','mousedown','focusout','focusin','click'])document.addEventListener(type,event=>{
     if(event.target.closest('.country-select-wrapper'))window.phoneTouchEvents.push({type,target:event.target.id||event.target.className,related:event.relatedTarget?.id||event.relatedTarget?.tagName||null,open:!!document.querySelector('.country-dropdown.open')});
    },true);
   });
   const contact=form==='contact',input=page.locator(contact?'#contact-phone':'#phone-number'),hidden=page.locator(contact?'#contact-phone-full':'#phone-full');
   const trigger=page.locator('.country-flag-display'),search=page.locator('.phone-country-search'),dropdown=page.locator('.country-dropdown');
   const name=page.getByRole('textbox',{name:'Full Name *',exact:true});
   const result={form};results.push(result);
   assert.match(await trigger.getAttribute('aria-label'),/United States \(\+1\)/);
   try{
    await trigger.tap();assert.equal(await search.isVisible(),true);
    // Reduce the available viewport while search has focus, as with a software keyboard.
    const viewport=page.viewportSize();await page.setViewportSize({width:viewport.width,height:450});
    await search.tap();await search.pressSequentially('United Kingdom');
    await page.locator('[data-country="GB"]').tap();
    result.firstSelection=await trigger.getAttribute('aria-label');
    result.events=await page.evaluate(()=>window.phoneTouchEvents);
    assert.equal(result.firstSelection,'United Kingdom (+44)',JSON.stringify(result));
    assert.equal(await trigger.getAttribute('aria-expanded'),'false');
    assert.equal(await dropdown.isVisible(),false);
    assert.equal(await input.evaluate(el=>el===document.activeElement),true);
    await page.setViewportSize(viewport);
    await input.pressSequentially('07400 123456');await name.tap();
    assert.equal(await hidden.inputValue(),'+447400123456');
    assert.equal(await input.getAttribute('aria-invalid'),'false');
    for(const [query,code,label,number,normalized]of [
     ['France','FR','France (+33)','06 12 34 56 78','+33612345678'],
     ['Canada','CA','Canada (+1)','416 555 0123','+14165550123'],
     ['United States','US','United States (+1)','202 555 0123','+12025550123']
    ]){
     await input.fill('');await trigger.tap();await search.tap();await search.pressSequentially(query);
     await page.locator(`[data-country="${code}"]`).tap();
     assert.equal(await trigger.getAttribute('aria-label'),label);
     assert.equal(await dropdown.isVisible(),false);
     await input.pressSequentially(number);await name.tap();
     assert.equal(await trigger.getAttribute('aria-label'),label);
     assert.equal(await hidden.inputValue(),normalized);
     await trigger.tap();assert.equal(await page.locator(`[data-country="${code}"]`).getAttribute('aria-pressed'),'true');
     await name.tap();assert.equal(await dropdown.isVisible(),false);
     assert.equal(await trigger.getAttribute('aria-label'),label);
    }
    // Scrolling and cancelled touch gestures must never select a country.
    await trigger.tap();
    const list=page.locator('.country-list');
    await list.evaluate(el=>el.scrollTop=250);
    assert.equal(await trigger.getAttribute('aria-label'),'United States (+1)');
    await search.fill('France');
    await page.locator('[data-country="FR"]').dispatchEvent('pointerdown',{pointerType:'touch',pointerId:41,isPrimary:true});
    await page.locator('[data-country="FR"]').dispatchEvent('pointercancel',{pointerType:'touch',pointerId:41,isPrimary:true});
    await search.blur();
    assert.equal(await dropdown.isVisible(),true,'ambiguous mobile blur must leave the menu available for click');
    assert.equal(await trigger.getAttribute('aria-label'),'United States (+1)');
    await page.locator('[data-country="FR"]').tap();
    assert.equal(await trigger.getAttribute('aria-label'),'France (+33)');
    // Known keyboard destinations outside the control still close the menu.
    await trigger.tap();await search.press('Escape');assert.equal(await dropdown.isVisible(),false);
    await trigger.tap();await name.focus();assert.equal(await dropdown.isVisible(),false);
    await trigger.tap();await search.fill('United Kingdom');await search.press('Enter');
    assert.equal(await trigger.getAttribute('aria-label'),'United Kingdom (+44)');
    assert.equal(await input.getAttribute('placeholder'),'Phone number');
    await page.locator('form').filter({has:input}).evaluate(form=>form.reset());
    assert.equal(await trigger.getAttribute('aria-label'),'United States (+1)');
    assert.equal(await input.getAttribute('placeholder'),'Phone number');
    assert.equal(await hidden.inputValue(),'');
    assert.equal(await input.getAttribute('aria-invalid'),'false');
    if(output){await trigger.tap();await search.fill('United Kingdom');await page.screenshot({path:output+'-'+engine+'-'+form+'.png'});}
    // The shared component also keeps a generic placeholder on French-language pages.
    await page.goto(origin+'/'+form+'.html?lang=fr');
    assert.equal(await input.getAttribute('placeholder'),'Numéro de téléphone');
    await trigger.tap();await search.fill('France');await page.locator('[data-country="FR"]').tap();
    assert.equal(await input.getAttribute('placeholder'),'Numéro de téléphone');
    assert.equal(await trigger.getAttribute('aria-label'),'France (+33)');
    assert.deepEqual(posts,[]);assert.deepEqual(errors,[]);
    result.passed=true;
   }finally{result.events=(await page.evaluate(()=>window.phoneTouchEvents))||result.events;await page.close();}
  }
 });
}
