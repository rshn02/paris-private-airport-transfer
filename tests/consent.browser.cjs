// Run after build with PLAYWRIGHT_PATH pointing to an installed Playwright module.
// Only local artifact requests and public font/style libraries are permitted.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'), manifest=require('../scripts/public-files.json').files;
const config=require('../vercel.json'),key='ppat_consent_v1',legacy='ppat_marketing_attribution_v1';
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');let p=u.pathname;const red=config.redirects.find(x=>x.source===p);if(red){res.writeHead(308,{Location:red.destination+u.search});return res.end();}p=config.rewrites.find(x=>x.source===p)?.destination||p;p=p==='/'?'index.html':p.slice(1).replace(/\/$/,'');if(!path.extname(p))p+='.html';if(!manifest.includes(p)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(path.join(root,'dist',p)));});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let browser;const stats={layouts:0,choices:0,googleRequests:[],mutations:[],sensitiveReferrers:[],errors:[],missing:[]};
try{browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
async function context(width){const c=await browser.newContext({viewport:{width,height:900}});await c.route('**/*',async r=>{const q=r.request(),u=new URL(q.url());if(u.origin!==base&&(q.headers().referer||'').includes('SYNTHETIC_ONLY'))stats.sensitiveReferrers.push(u.hostname);if(/google-analytics|googletagmanager|googleadservices|doubleclick|googlesyndication/.test(u.hostname)){stats.googleRequests.push(u.hostname);assert.equal(u.hostname,'www.googletagmanager.com');assert.equal(q.headers().referer,undefined);return r.fulfill({contentType:'application/javascript',body:'window.__mockGoogleLoaded=true;'});}if(!['GET','HEAD'].includes(q.method())){stats.mutations.push(u.pathname);return r.abort();}if(u.origin===base)return r.continue();if(['fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com','cdn.jsdelivr.net'].includes(u.hostname))return r.continue();return r.abort();});c.on('page',p=>{p.on('pageerror',e=>stats.errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)stats.missing.push(r.url());});});return c;}
for(const width of [320,390,768,1440]){const c=await context(width),p=await c.newPage();
await c.addCookies([{name:'_ga',value:'legacy',url:base},{name:'_gcl_aw',value:'legacy',url:base},{name:'booking-essential',value:'keep',url:base}]);await p.goto(base+'/confirm?token=SYNTHETIC_ONLY');assert.ok(!(await c.cookies()).some(x=>['_ga','_gcl_aw'].includes(x.name)));assert.ok((await c.cookies()).some(x=>x.name==='booking-essential'));await p.locator('[data-action="reject"]').click();
for(const [aud,ad,action] of [[false,false,'reject'],[true,true,'accept'],[true,false,'save'],[false,true,'save']]){
 await p.goto(base+'/');await p.evaluate(()=>localStorage.clear());await p.evaluate(k=>localStorage.setItem(k,'{"legacy":true}'),legacy);await p.goto(base+'/?utm_source=google&utm_medium=cpc');
 assert.ok(await p.locator('dialog').isVisible());assert.equal(await p.locator('#consent-audience').isChecked(),false);assert.equal(await p.locator('#consent-advertising').isChecked(),false);
 assert.equal(await p.evaluate(k=>localStorage.getItem(k),legacy),null);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const box=await p.locator('dialog').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);
 if(action==='save'){await p.locator('[data-action="customize"]').click();await p.locator('#consent-audience').setChecked(aud);await p.locator('#consent-advertising').setChecked(ad);}
 if(width===390&&action==='reject'&&process.env.QA_SCREENSHOT_DIR)await p.screenshot({path:path.join(process.env.QA_SCREENSHOT_DIR,'consent-mobile.png')});
 await p.locator('[data-action="'+action+'"]').click();let stored=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(stored.audience,aud);assert.equal(stored.advertising,ad);assert.equal(await p.evaluate(()=>!!PPATMarketing.getAttribution()),ad);
 await p.reload();assert.equal(await p.locator('dialog').isVisible(),false);
 if(aud){await p.waitForFunction(()=>window.__mockGoogleLoaded && (window.dataLayer||[]).some(x=>x[0]==='event'));assert.equal(await p.evaluate(()=>dataLayer.filter(x=>x[0]==='event'&&x[1]==='page_view').length),1);}else assert.equal(await p.evaluate(()=>!!window.__mockGoogleLoaded),false);
 await p.locator('.ppat-consent-manage').click();await p.locator('[data-action="reject"]').click();assert.equal(await p.evaluate(k=>localStorage.getItem(k),legacy),null);assert.equal(await p.evaluate(()=>PPATMarketing.getAttribution()),null);stats.choices++;
}
// Refusal must leave every public page usable.
for(const file of manifest.filter(f=>f.endsWith('.html'))){await p.goto(base+'/'+file);assert.ok(await p.locator('.ppat-consent-manage').isVisible());assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,file+' overflow '+width);stats.layouts++;}
await p.goto(base+'/reservation?route=cdg-paris');await p.waitForFunction(()=>document.querySelector('#service').value==='cdg-paris');assert.equal(await p.locator('#pickup').inputValue(),'Charles de Gaulle Airport (CDG)');await p.locator('#calc-service').selectOption('beauvais-paris');await p.locator('#calc-passengers').selectOption('4');assert.match(await p.locator('#calcPrice').textContent(),/180/);assert.equal(await p.locator('#bookingForm').evaluate(f=>f.checkValidity()),false);
await p.goto(base+'/reservation?route=beauvais-paris');await p.waitForFunction(()=>document.querySelector('#service').value==='beauvais-paris');assert.equal(await p.locator('#pickup').inputValue(),'Beauvais Airport (BVA)');
for(const service of ['normandy','champagne']){await p.goto(base+'/contact?service='+service);assert.equal(await p.locator('#contact-subject').inputValue(),'quote');assert.match(await p.locator('#contact-message').inputValue(),new RegExp(service,'i'));}
// Contact uses a page-level mock: requests never reach the booking service.
await p.goto(base+'/contact?service=normandy');await p.locator('.ppat-consent-manage').click();await p.locator('[data-action="accept"]').click();
for(const outcome of ['success','api','network','validation']) {
 await p.goto(base+'/contact?service=normandy');
 await p.waitForFunction(()=>(window.dataLayer||[]).some(x=>x[1]==='page_view'));
 assert.equal(await p.evaluate(()=>dataLayer.filter(x=>x[1]==='contact_form_start').length),0);
 await p.locator('#contact-name').focus();assert.equal(await p.evaluate(()=>dataLayer.filter(x=>x[1]==='contact_form_start').length),0);
 let requests=0;
 await p.route('**/api/contact',async r=>{requests++;if(outcome==='network')return r.abort();return r.fulfill({status:outcome==='api'?500:200,contentType:'application/json',body:JSON.stringify({success:outcome==='success'})});});
 await p.locator('#contact-name').fill('SYNTHETIC_PERSON');await p.locator('#contact-email').fill(outcome==='validation'?'invalid':'synthetic@example.test');await p.locator('#contact-phone').fill('07700900123');
 assert.equal(await p.evaluate(()=>dataLayer.filter(x=>x[1]==='contact_form_start').length),1);
 // Expected failure handlers log errors; they must still render the normal error UI.
 await p.locator('#contactSubmitBtn').click();
 if(outcome==='validation')await p.waitForFunction(()=>document.querySelector('#contact-email').getAttribute('aria-invalid')==='true');
 else await p.waitForFunction(()=>document.querySelector('#contactSubmitBtn').disabled===false && (document.querySelector('#contactSuccess').style.display==='block'||document.querySelector('#contactError').style.display==='block'));
 assert.equal(requests,outcome==='validation'?0:1);
 assert.equal(await p.evaluate(()=>dataLayer.filter(x=>x[1]==='contact_submit_success').length),outcome==='success'?1:0);
 assert.equal(await p.evaluate(()=>/SYNTHETIC_PERSON|synthetic@|07700900123/.test(JSON.stringify(dataLayer))),false);
 await p.unroute('**/api/contact');
}
// Trusted interaction, not focus or query-prefill, starts booking measurement.
await p.goto(base+'/reservation?route=cdg-paris');await p.locator('.ppat-consent-manage').click();await p.locator('[data-action="accept"]').click();
await p.waitForFunction(()=>(window.dataLayer||[]).some(x=>x[1]==='page_view'));
assert.equal(await p.evaluate(()=>dataLayer.filter(x=>x[1]==='booking_form_start').length),0);
await p.locator('#name').focus();assert.equal(await p.evaluate(()=>dataLayer.filter(x=>x[1]==='booking_form_start').length),0);
await p.locator('#name').fill('SYNTHETIC_ONLY');await p.locator('#name').fill('SYNTHETIC_ONLY_TWO');
assert.equal(await p.evaluate(()=>dataLayer.filter(x=>x[1]==='booking_form_start').length),1);
assert.equal(await p.evaluate(()=>JSON.stringify(dataLayer).includes('SYNTHETIC_ONLY')),false);
await p.locator('.ppat-consent-manage').click();await p.locator('[data-action="reject"]').click();
assert.equal(await p.evaluate(()=>window['ga-disable-G-83LVJPDG1N']),true);
await p.goto(base+'/confirm?token=SYNTHETIC_ONLY');assert.ok(await p.locator('#statePending').isVisible());assert.equal(await p.evaluate(()=>PPATConsent.sensitive),true);assert.equal(await p.evaluate(()=>typeof gtag),'undefined');
await p.locator('.ppat-consent-manage').click();await p.locator('[data-action="accept"]').click();assert.equal(await p.evaluate(()=>PPATMarketing.getAttribution()),null);
await p.goto(base+'/manage-booking');assert.ok(await p.locator('#emailInput').isVisible());await p.goto(base+'/admin');assert.ok(await p.locator('form').count());
await p.goto(base+'/');await p.locator('.ppat-consent-manage').click();await p.locator('[data-action="customize"]').click();await p.keyboard.press('Escape');assert.equal(await p.locator('.ppat-consent-manage').evaluate(e=>e===document.activeElement),true);
if(width===1440&&process.env.QA_SCREENSHOT_DIR){await p.locator('.ppat-consent-manage').click();await p.screenshot({path:path.join(process.env.QA_SCREENSHOT_DIR,'consent-desktop.png')});}
if(await p.locator('dialog').isVisible())await p.locator('[data-action="close"]').click();await p.locator('.ppat-consent-manage').click();await p.locator('[data-action="accept"]').click();const other=await c.newPage();await other.goto(base+'/');assert.ok(await other.evaluate(()=>PPATMarketing.getAttribution()));await p.locator('.ppat-consent-manage').click();await p.locator('[data-action="reject"]').click();await other.waitForFunction(()=>PPATMarketing.getAttribution()===null&&PPATMarketing.attribution===null);await c.close();console.log('PASS viewport',width);
}
assert.deepEqual(stats.sensitiveReferrers,[]);assert.ok(stats.googleRequests.length>0);assert.ok(stats.googleRequests.every(h=>h==='www.googletagmanager.com')); assert.deepEqual(stats.mutations,[]);assert.deepEqual(stats.errors,[]);assert.deepEqual(stats.missing,[]);console.log(JSON.stringify(stats));
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
