'use strict';
const el = id => document.getElementById(id);
const audio = el('audio');
let context, source, oscillator, oscGain, splitter, analysers, waveform, spectrumData, url;
let playingSine = false;
const scope = el('scope'), spectrum = el('spectrum');
const scopeCtx = scope.getContext('2d'), spectrumCtx = spectrum.getContext('2d');
const zero = '\u2212\u221e';
function db(v){return v>0 ? (20*Math.log10(v)).toFixed(1) : zero;}
function clock(v){if(!Number.isFinite(v))return '0:00';const s=Math.floor(v);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function ensureAudio(){
  if(context)return;
  const API=window.AudioContext||window.webkitAudioContext;
  if(!API)throw new Error('Web Audio API no disponible');
  context=new API();
  source=context.createMediaElementSource(audio);
  splitter=context.createChannelSplitter(2);
  analysers=[context.createAnalyser(),context.createAnalyser()];
  analysers.forEach(a=>{a.fftSize=2048;a.smoothingTimeConstant=0.75;});
  source.connect(context.destination);
  source.connect(splitter);
  splitter.connect(analysers[0],0);
  splitter.connect(analysers[1],1);
  waveform=analysers.map(a=>new Float32Array(a.fftSize));
  spectrumData=new Uint8Array(analysers[0].frequencyBinCount);
}
async function resume(){ensureAudio();if(context.state!=='running')await context.resume();}
function status(s){el('state').textContent=s;}
function stopSine(){if(oscillator){oscillator.stop();oscillator.disconnect();oscillator=null;}playingSine=false;el('sine').textContent='∿ Prueba 440 Hz';}
async function toggleSine(){
 try{
  await resume();
  if(playingSine){stopSine();status(audio.paused?'LISTO':'REPRODUCIENDO');return;}
  audio.pause();oscillator=context.createOscillator();oscGain=context.createGain();
  oscillator.type='sine';oscillator.frequency.value=440;oscGain.gain.value=.2*Number(el('volume').value)/100;
  oscillator.connect(oscGain);oscGain.connect(context.destination);
  // Route the oscillator into the analyzers independently without duplicating audio output.
  oscGain.connect(splitter);
  oscillator.start();playingSine=true;el('sine').textContent='■ Detener prueba';el('play').textContent='▶ Reproducir';status('SENOIDE 440 HZ');
 }catch(err){status('ERROR');alert(err.message);}
}
el('sine').addEventListener('click',toggleSine);
el('file').addEventListener('change',async event=>{
 const file=event.target.files?.[0];if(!file)return;
 audio.pause();stopSine();
 if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(file);
 audio.src=url;audio.load();el('track').textContent=file.name;el('play').disabled=false;el('seek').disabled=false;
 status('CARGADO');el('play').textContent='▶ Reproducir';
});
el('play').addEventListener('click',async()=>{
 try{
  await resume();
  if(!audio.paused){audio.pause();return;}
  stopSine();await audio.play();
 }catch(err){status('ERROR DE AUDIO');alert('No se pudo reproducir: '+err.message);}
});
el('volume').addEventListener('input',()=>{
 const v=Number(el('volume').value)/100;audio.volume=v;
 if(oscGain)oscGain.gain.value=.2*v;el('volvalue').textContent=Math.round(v*100)+'%';
});
audio.volume=.75;
audio.addEventListener('play',()=>{el('play').textContent='Ⅱ Pausar';status('REPRODUCIENDO');});
audio.addEventListener('pause',()=>{el('play').textContent='▶ Reproducir';if(!playingSine)status('PAUSADO');});
audio.addEventListener('ended',()=>status('FINALIZADO'));
audio.addEventListener('error',()=>status('FORMATO NO SOPORTADO'));
audio.addEventListener('loadedmetadata',()=>{el('duration').textContent=clock(audio.duration);});
audio.addEventListener('timeupdate',()=>{el('elapsed').textContent=clock(audio.currentTime);el('seek').value=Number.isFinite(audio.duration)&&audio.duration>0?Math.round(1000*audio.currentTime/audio.duration):0;});
el('seek').addEventListener('input',()=>{if(Number.isFinite(audio.duration))audio.currentTime=Number(el('seek').value)/1000*audio.duration;});
function grid(ctx,w,h,rows=4,cols=12){
 ctx.fillStyle='#080d16';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#1c2939';ctx.lineWidth=1;
 for(let i=1;i<rows;i++){let y=i*h/rows;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
 for(let i=1;i<cols;i++){let x=i*w/cols;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
}
function drawWave(ctx,data,w,h,color,baseY,amp){
 ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();
 for(let i=0;i<data.length;i++){const x=i*w/(data.length-1),y=baseY-data[i]*amp;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
 ctx.stroke();
}
function measurements(data){let max=0,sum=0;for(const v of data){const a=Math.abs(v);if(a>max)max=a;sum+=v*v;}return {peak:max,rms:Math.sqrt(sum/data.length)};}
function meter(channel,measure){
 el('db'+channel).textContent=db(measure.peak)+' dBFS';
 el('rms'+channel).textContent='RMS '+db(measure.rms)+' dBFS';
 el('meter'+channel).style.width=Math.max(0,Math.min(100,(20*Math.log10(Math.max(measure.peak,.001))+60)/60*100))+'%';
}
function render(){
 requestAnimationFrame(render);
 const w=scope.width,h=scope.height;
 grid(scopeCtx,w,h);
 grid(spectrumCtx,spectrum.width,spectrum.height);
 if(!analysers)return;
 const active=!audio.paused||playingSine;
 for(let i=0;i<2;i++){
  analysers[i].getFloatTimeDomainData(waveform[i]);
  const measure=active?measurements(waveform[i]):{peak:0,rms:0};
  meter(i?'R':'L',measure);
  if(active)drawWave(scopeCtx,waveform[i],w,h,i?'#39d8c1':'#aa79ff',h*(i?0.75:0.25),h*.22);
 }
 if(!active)return;
 analysers[0].getByteFrequencyData(spectrumData);
 const ctx=spectrumCtx,W=spectrum.width,H=spectrum.height;
 const minF=20,maxF=Math.min(20000,context.sampleRate/2);
 const bars=96;
 for(let i=0;i<bars;i++){
  const f=minF*Math.pow(maxF/minF,i/(bars-1));
  const bin=Math.max(0,Math.min(spectrumData.length-1,Math.round(f*analysers[0].fftSize/context.sampleRate)));
  const magnitude=spectrumData[bin]/255,barH=magnitude*(H-20);
  const x=i*W/bars;ctx.fillStyle='hsl('+(265-i*1.75)+' 85% 65%)';
  ctx.fillRect(x,H-barH,Math.max(1,W/bars-2),barH);
 }
}
render();
window.addEventListener('pagehide',()=>{if(url)URL.revokeObjectURL(url);});
