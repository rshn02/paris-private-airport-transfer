const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const base='https://www.parisprivateairporttransfer.com';
const aliases={'/':'index.html','/airport':'airport-transfer.html','/disneyland':'disneyland-transfer.html','/long-distance':'long-distance-transfer.html','/hourly':'hourly-service.html'};
const files=[...fs.readdirSync(root).filter(f=>f.endsWith('.html')),...fs.readdirSync(path.join(root,'pages')).filter(f=>f.endsWith('.html')).map(f=>'pages/'+f)];
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1],m[2]]));
const meta=(html,key)=>[...html.matchAll(/<meta\b[^>]*>/g)].map(m=>attrs(m[0])).find(a=>a.name===key||a.property===key)?.content;
const canonical=html=>[...html.matchAll(/<link\b[^>]*>/g)].map(m=>attrs(m[0])).filter(a=>a.rel==='canonical').map(a=>a.href);
const sitemap=[...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
const resolve=url=>{const p=new URL(url,base).pathname;return aliases[p]||(p.endsWith('.html')?p.slice(1):p.slice(1)+'.html');};
const plain=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
test('sitemap has 19 unique, canonical, indexable English pages with complete unique metadata',()=>{
 assert.equal(sitemap.length,19);assert.equal(new Set(sitemap).size,19);const titles=new Set(),descriptions=new Set();
 for(const url of sitemap){assert.ok(url.startsWith(base+'/'));assert.ok(!url.endsWith('.html'));const html=read(resolve(url));assert.deepEqual(canonical(html),[url]);assert.ok(!/noindex/i.test(meta(html,'robots')||''));assert.match(html,/<html lang="en">/);assert.equal((html.match(/<h1\b/g)||[]).length,1);
 const title=plain(html.match(/<title>([\s\S]*?)<\/title>/)[1]);const desc=meta(html,'description');assert.ok(title.length>=20&&title.length<=70,title);assert.ok(desc?.length>=80&&desc.length<=175,desc);assert.ok(!titles.has(title));assert.ok(!descriptions.has(desc));titles.add(title);descriptions.add(desc);
 assert.equal(meta(html,'og:url'),url);for(const field of ['og:title','og:description','og:image','og:type','twitter:card','twitter:title','twitter:description','twitter:image'])assert.ok(meta(html,field),url+' '+field);
 }
});
test('all local navigation links and fragments resolve to existing files',()=>{
 for(const file of files){const html=read(file);for(const match of html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>/g)){
  const href=match[1].replace(/&amp;/g,'&');if(!href||href==='#')continue;
  const url=new URL(href,base+'/'+file);if(!['www.parisprivateairporttransfer.com','parisprivateairporttransfer.com'].includes(url.hostname))continue;
  const target=resolve(url.href);assert.ok(fs.existsSync(path.join(root,target)),file+' -> '+href);
  if(url.hash){const id=decodeURIComponent(url.hash.slice(1));assert.ok(read(target).includes('id="'+id+'"'),file+' missing fragment '+href);}
 }}
});
test('JSON-LD parses, FAQ text is visible, business IDs agree and no ratings are fabricated',()=>{
 let questions=0;
 for(const file of files){const html=read(file);const visible=plain(html);const compact=x=>x.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
 function walk(x){if(Array.isArray(x)){x.forEach(walk);return;}if(!x||typeof x!=='object')return;
 if(x['@type']==='LocalBusiness')assert.equal(x['@id'],base+'/#business');
 assert.notEqual(x['@type'],'AggregateRating');assert.notEqual(x['@type'],'Review');
 if(x['@type']==='Question'){questions++;assert.ok(compact(visible).includes(compact(x.name)),file+' question');assert.ok(compact(visible).includes(compact(x.acceptedAnswer.text)),file+' answer');}
 Object.values(x).forEach(walk);}
 for(const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))walk(JSON.parse(match[1]));
 }assert.equal(questions,112);
});
test('home targets airport transfers and links contextually to every main route',()=>{
 const html=read('index.html');const main=html.split('<main>')[1].split('</main>')[0];assert.match(plain(main.match(/<h1>([\s\S]*?)<\/h1>/)[1]),/Paris Airport Transfer/);
 for(const route of ['cdg-to-paris','orly-to-paris','beauvais-to-paris','cdg-to-disneyland','orly-to-disneyland','beauvais-to-disneyland','paris-to-disneyland','paris-to-normandy','paris-to-champagne','paris-to-loire-valley'])assert.ok(main.includes('href="/'+route+'"'),route);
 assert.ok(main.includes('href="/hourly"'));assert.ok(!/\b(?:5-star|thousands of|10 years)\b/i.test(main));
});
test('utility noindex is retained and robots permits crawling CSS, JS and noindex pages',()=>{
 for(const file of ['admin.html','manage-booking.html','confirm.html','links.html','preview.html','signature.html','pages/cgv.html','pages/confidentialite.html']){assert.match(meta(read(file),'robots'),/noindex/);assert.ok(!sitemap.includes(base+'/'+file.replace(/\.html$/,'')));}
 assert.ok(!/noindex/.test(meta(read('reservation.html'),'robots')));assert.match(read('robots.txt'),/User-agent: \*/);assert.ok(!/^Disallow:\s*\S/m.test(read('robots.txt')));assert.ok(read('robots.txt').includes('Sitemap: '+base+'/sitemap.xml'));
});
test('existing alias redirects remain permanent and terminate at their canonical hubs',()=>{
 const config=JSON.parse(read('vercel.json'));assert.equal(config.cleanUrls,true);
 for(const r of config.redirects){assert.equal(r.permanent,true);assert.ok(!config.redirects.some(next=>next.source===r.destination));assert.ok(fs.existsSync(path.join(root,resolve(base+r.destination))));}
 for(const r of config.rewrites){assert.ok(!r.destination.endsWith('.html'));assert.ok(fs.existsSync(path.join(root,r.destination.slice(1)+'.html')));}
});
test('commercial navigation includes airport route links in source HTML',()=>{
 for(const url of sitemap){if(url.endsWith('/reservation'))continue;const html=read(resolve(url));const nav=html.match(/<nav\b[\s\S]*?<\/nav>/)?.[0];assert.ok(nav,url);for(const route of ['cdg-to-paris','orly-to-paris','beauvais-to-paris'])assert.ok(nav.includes('href="/'+route+'"'),url+' '+route);}
});
