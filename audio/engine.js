'use strict';
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.JazAudioEngine=api;
})(typeof window!=='undefined'?window:null,function(){
 function createAudioEngine(audio,env=typeof window!=='undefined'?window:{}){
  let context=null,analysers=null,waveform=null,spectrumData=null,mediaTap=null,toneTap=null,oscillator=null,oscGain=null;
  function ensure(){
   if(context)return context;
   const API=env.AudioContext||env.webkitAudioContext;
   if(!API)throw new Error('Web Audio API no disponible');
   const ctx=new API();
   const source=ctx.createMediaElementSource(audio),splitter=ctx.createChannelSplitter(2);
   const channels=[ctx.createAnalyser(),ctx.createAnalyser()];
   channels.forEach(a=>{a.fftSize=2048;a.smoothingTimeConstant=.75;});
   const media=ctx.createGain(),tone=ctx.createGain();
   media.gain.value=1;tone.gain.value=0;
   source.connect(ctx.destination);
   source.connect(media);media.connect(splitter);tone.connect(splitter);
   splitter.connect(channels[0],0);splitter.connect(channels[1],1);
   context=ctx;analysers=channels;mediaTap=media;toneTap=tone;
   waveform=channels.map(a=>new Float32Array(a.fftSize));
   spectrumData=new Uint8Array(channels[0].frequencyBinCount);
   return ctx;
  }
  async function resume(){const ctx=ensure();if(ctx.state!=='running')await ctx.resume();return ctx;}
  function stopTone(){
   if(oscillator){try{oscillator.stop();}catch{}oscillator.disconnect();oscillator=null;}
   if(oscGain){oscGain.disconnect();oscGain=null;}
   if(toneTap)toneTap.gain.value=0;
   if(mediaTap)mediaTap.gain.value=1;
  }
  async function startTone(volume=.75){
   await resume();stopTone();
   const osc=context.createOscillator(),gain=context.createGain();
   osc.type='sine';osc.frequency.value=440;
   gain.gain.value=.2*Math.max(0,Math.min(1,Number(volume)||0));
   osc.connect(gain);gain.connect(context.destination);gain.connect(toneTap);
   mediaTap.gain.value=0;toneTap.gain.value=1;
   oscillator=osc;oscGain=gain;
   try{osc.start();}catch(err){stopTone();throw err;}
  }
  function setToneVolume(volume){if(oscGain)oscGain.gain.value=.2*Math.max(0,Math.min(1,Number(volume)||0));}
  function snapshot(){return {context,analysers,waveform,spectrumData,toneActive:!!oscillator};}
  function latencyMs(){if(!context)return null;const n=1000*((context.baseLatency||0)+(context.outputLatency||0));return Number.isFinite(n)?Math.round(n):null;}
  async function close(){stopTone();if(context&&context.state!=='closed')await context.close();}
  return {ensure,resume,startTone,stopTone,setToneVolume,snapshot,latencyMs,close};
 }
 return {createAudioEngine};
});
