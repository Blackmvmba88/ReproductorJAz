'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createAudioEngine}=require('../audio/engine');
function fake(){
 const counts={contexts:0,sources:0,oscillators:0,stops:0,closes:0};
 const node=()=>({connect(){},disconnect(){},gain:{value:0},frequency:{value:0},fftSize:2048,frequencyBinCount:1024});
 class Context{
  constructor(){counts.contexts++;this.state='suspended';this.destination=node();this.baseLatency=.01;this.outputLatency=.005;}
  createMediaElementSource(){counts.sources++;return node();}
  createChannelSplitter(){return node();}
  createAnalyser(){return node();}
  createGain(){return node();}
  createOscillator(){counts.oscillators++;return {...node(),start(){},stop(){counts.stops++;}};}
  async resume(){this.state='running';}
  async close(){counts.closes++;this.state='closed';}
 }
 return {counts,Context};
}
test('context and media source are reused',async()=>{
 const f=fake(),engine=createAudioEngine({}, {AudioContext:f.Context});
 await engine.resume();await engine.resume();
 assert.equal(f.counts.contexts,1);assert.equal(f.counts.sources,1);
 assert.equal(engine.snapshot().waveform.length,2);assert.equal(engine.latencyMs(),15);
 await engine.close();assert.equal(f.counts.closes,1);
});
test('tone restarts and stops safely',async()=>{
 const f=fake(),engine=createAudioEngine({}, {AudioContext:f.Context});
 await engine.startTone(.5);assert.equal(engine.snapshot().toneActive,true);
 await engine.startTone(.8);assert.equal(f.counts.stops,1);
 engine.setToneVolume(.2);engine.stopTone();engine.stopTone();
 assert.equal(f.counts.stops,2);assert.equal(engine.snapshot().toneActive,false);
 await engine.close();
});
test('unsupported Web Audio throws',()=>assert.throws(()=>createAudioEngine({},{}).ensure(),/Web Audio API/));
