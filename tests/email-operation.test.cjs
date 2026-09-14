const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '../js/email-operation.js'), 'utf8');
function load(storage = new Map(), blocked = false) {
  const context = vm.createContext({window:{}, crypto:webcrypto,TextEncoder,Uint8Array,
    sessionStorage:{getItem:k=>storage.get(k)||null,setItem(k,v){if(blocked)throw Error();storage.set(k,v)},removeItem:k=>storage.delete(k)}});
  vm.runInContext(source, context);
  return context.window.PPATEmailOperations;
}
test('retry and concurrent clicks keep the same operation identifier',async()=>{
 const api=load();const [a,b]=await Promise.all([api.headers('booking',{name:'Test'}),api.headers('booking',{name:'Test'})]);
 assert.equal(a['Idempotency-Key'],b['Idempotency-Key']);assert.equal((await api.headers('booking',{name:'Test'}))['Idempotency-Key'],a['Idempotency-Key']);
});
test('successful action followed by an identical legitimate booking gets a new identifier',async()=>{
 const api=load();const a=await api.headers('booking',{name:'Test'});api.complete('booking');const b=await api.headers('booking',{name:'Test'});assert.notEqual(a['Idempotency-Key'],b['Idempotency-Key']);
});
test('A to B to A generates distinct modification operations',async()=>{
 const api=load();const ids=[];for(const notes of ['A','B','A'])ids.push((await api.headers('modify',{notes}))['Idempotency-Key']);assert.equal(new Set(ids).size,3);
});
test('pending operation survives reload without storing submitted contents',async()=>{
 const storage=new Map();const first=load(storage);const body={name:'PRIVATE TEST NAME',notes:'PRIVATE TEST CONTENT'};
 const a=await first.headers('contact',body);const second=load(storage);assert.equal((await second.headers('contact',body))['Idempotency-Key'],a['Idempotency-Key']);
 assert.ok(!JSON.stringify([...storage]).includes('PRIVATE TEST'));
});
test('storage unavailable still supports same-page retries',async()=>{
 const api=load(new Map(),true);assert.equal((await api.headers('contact',{}))['Idempotency-Key'],(await api.headers('contact',{}))['Idempotency-Key']);
});
