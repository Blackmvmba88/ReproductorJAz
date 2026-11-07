const assert=require('node:assert/strict');const test=require('node:test');
const rms=x=>Math.sqrt(x.reduce((s,v)=>s+v*v,0)/x.length);
const peak=x=>Math.max(...x.map(Math.abs));
const db=x=>x>0?20*Math.log10(x):-Infinity;
test('peak unit sine',()=>{assert.equal(peak([0,1,0,-1]),1);});
test('RMS full-cycle sine',()=>{const arr=Array.from({length:48000},(_,n)=>Math.sin(2*Math.PI*440*n/48000));assert.ok(Math.abs(rms(arr)-Math.SQRT1_2)<1e-12);});
test('silence dBFS',()=>{assert.equal(db(0),-Infinity);});
test('half amplitude dBFS',()=>{assert.ok(Math.abs(db(.5)+6.020599913)<1e-6);});
