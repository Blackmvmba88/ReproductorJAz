'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {nextIndex}=require('../audio/playlist');
const prefs=require('../audio/preferences');
const {createScheduler}=require('../audio/visualizer');
test('queue handles boundaries, repeat and shuffle without infinite loops',()=>{
  assert.equal(nextIndex(0,0,1),-1);
  assert.equal(nextIndex(2,3,1,false,false),-1);
  assert.equal(nextIndex(2,3,1,false,true),0);
  assert.equal(nextIndex(0,3,1,true,false,()=>0),1);
  assert.equal(nextIndex(1,3,1,true,false,()=>.999),2);
  assert.equal(nextIndex(0,1,1,true,false),-1);
});
test('preferences normalize invalid settings',()=>{
  assert.deepEqual(prefs.normalize({theme:'unknown',glass:false}),{theme:'violet',glass:false});
  const store=new Map([['jaz:theme','ocean'],['jaz:glass','off']]);
  const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
  assert.deepEqual(prefs.load(storage),{theme:'ocean',glass:false});
  prefs.save(storage,{theme:'ember',glass:true});
  assert.deepEqual(prefs.load(storage),{theme:'ember',glass:true});
});
test('visualizer starts once and cancels on stop',()=>{
  let seq=0;const pending=new Map();let drawings=0;
  const schedule=createScheduler({request:cb=>{pending.set(++seq,cb);return seq},cancel:id=>pending.delete(id),draw:()=>drawings++});
  schedule.start();schedule.start();assert.equal(pending.size,1);
  const [id,cb]=pending.entries().next().value;pending.delete(id);cb(1);
  assert.equal(drawings,1);assert.equal(pending.size,1);
  schedule.stop();assert.equal(pending.size,0);assert.equal(schedule.running,false);
});
