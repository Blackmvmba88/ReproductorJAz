import React, {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const THEMES=['jasvith','amethyst','ocean','ember','emerald'];
const MODES=['studio','spotify','winamp','discord'];
const fmt=s=>Number.isFinite(s)?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`:'0:00';
function App(){
  const audio=useRef(null),ctx=useRef(null),analyser=useRef(null),source=useRef(null),fileUrl=useRef(null),socket=useRef(null),animation=useRef(0);
  const [theme,setTheme]=useState(()=>localStorage.getItem('jaz:theme')||'jasvith');
  const [mode,setMode]=useState(()=>localStorage.getItem('jaz:mode')||'studio');
  const [glass,setGlass]=useState(()=>localStorage.getItem('jaz:glass')!=='off');
  const [name,setName]=useState('Sin archivo'),[playing,setPlaying]=useState(false),[loop,setLoop]=useState(false);
  const [time,setTime]=useState(0),[duration,setDuration]=useState(0),[volume,setVolume]=useState(.75);
  const [peak,setPeak]=useState(0),[insight,setInsight]=useState('Listo para analizar'),[rtt,setRtt]=useState(null),[connection,setConnection]=useState('offline');
  const [underruns,setUnderruns]=useState(0),[buffer,setBuffer]=useState(0),[latency,setLatency]=useState(null);
  const lastPlay=useRef(0),lastReport=useRef(0),lastAudioTime=useRef(0),stallStart=useRef(null);
  useEffect(()=>{document.documentElement.dataset.theme=THEMES.includes(theme)?theme:'jasvith';localStorage.setItem('jaz:theme',theme)},[theme]);
  useEffect(()=>{document.documentElement.dataset.mode=MODES.includes(mode)?mode:'studio';localStorage.setItem('jaz:mode',mode)},[mode]);
  useEffect(()=>{document.documentElement.dataset.glass=glass?'on':'off';localStorage.setItem('jaz:glass',glass?'on':'off')},[glass]);
  useEffect(()=>{
    let closed=false, timer;
    function connect(){
      if(closed)return;
      if(location.protocol==='file:' || location.protocol==='jasvith:' || location.protocol==='capacitor:')return;
      const scheme=location.protocol==='https:'?'wss':'ws';
      const ws=new WebSocket(`${scheme}://${location.host}/ws`);socket.current=ws;
      ws.onopen=()=>{setConnection('online');ws.send(JSON.stringify({type:'ping',clientTime:Date.now()}));};
      ws.onmessage=e=>{try{const p=JSON.parse(e.data);if(p.type==='pong')setRtt(Math.max(0,Date.now()-p.clientTime));}catch{/* ignore malformed frame */}};
      ws.onclose=()=>{setConnection('offline');setRtt(null);if(!closed)timer=setTimeout(connect,2000)};
      ws.onerror=()=>ws.close();
    }
    connect();return()=>{closed=true;clearTimeout(timer);socket.current?.close()};
  },[]);
  useEffect(()=>{const id=setInterval(()=>{if(socket.current?.readyState===WebSocket.OPEN)socket.current.send(JSON.stringify({type:'ping',clientTime:Date.now()}));},4000);return()=>clearInterval(id)},[]);
  useEffect(()=>()=>{cancelAnimationFrame(animation.current);if(fileUrl.current)URL.revokeObjectURL(fileUrl.current);ctx.current?.close()},[]);
  async function prepare(){
    if(!ctx.current){
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C)throw Error('Web Audio no disponible');
      ctx.current=new C({latencyHint:'playback'});
      source.current=ctx.current.createMediaElementSource(audio.current);
      analyser.current=ctx.current.createAnalyser();analyser.current.fftSize=2048;
      source.current.connect(analyser.current);analyser.current.connect(ctx.current.destination);
      setLatency(Math.round(((ctx.current.baseLatency||0)+(ctx.current.outputLatency||0))*1000));
      animation.current=requestAnimationFrame(monitor);
    }
    if(ctx.current.state!=='running')await ctx.current.resume();
  }
  function monitor(now){
    animation.current=requestAnimationFrame(monitor);
    if(!analyser.current||now-lastReport.current<250)return;
    lastReport.current=now;
    const a=new Float32Array(analyser.current.fftSize);analyser.current.getFloatTimeDomainData(a);
    let p=0,sum=0;for(const x of a){p=Math.max(p,Math.abs(x));sum+=x*x}
    const rms=Math.sqrt(sum/a.length);setPeak(p);
    setInsight(p>=.98?'Pico alto: verifica clipping':rms<.025?'Nivel bajo / silencio':'Señal activa');
    const player=audio.current;
    if(player?.buffered.length){let ahead=0;for(let i=0;i<player.buffered.length;i++)if(player.buffered.start(i)<=player.currentTime&&player.buffered.end(i)>=player.currentTime)ahead=player.buffered.end(i)-player.currentTime;setBuffer(ahead)}
    if(socket.current?.readyState===WebSocket.OPEN)socket.current.send(JSON.stringify({type:'telemetry',state:player.paused?'paused':'playing',peak:p,underruns:underrunsRef.current}));
  }
  const underrunsRef=useRef(0);
  function stalled(){if(stallStart.current===null)stallStart.current=performance.now()}
  function recovered(){if(stallStart.current!==null){underrunsRef.current++;setUnderruns(underrunsRef.current);stallStart.current=null}}
  function loadFile(e){const file=e.target.files?.[0];if(!file)return;audio.current.pause();if(fileUrl.current)URL.revokeObjectURL(fileUrl.current);fileUrl.current=URL.createObjectURL(file);audio.current.src=fileUrl.current;audio.current.load();setName(file.name);setPlaying(false);setTime(0);setBuffer(0);underrunsRef.current=0;setUnderruns(0)}
  async function toggle(){try{await prepare();if(audio.current.paused)await audio.current.play();else audio.current.pause()}catch(err){setInsight(`Error: ${err.message}`)}}
  return <main className="shell"><header className="hero"><div className="brand-icon" aria-hidden="true"><img src="/jasvith-icon.svg" alt="" /></div><div><small>BLACKMAMBA CORP · AUDIO LAB · REACT / WEBSOCKET</small><h1 className="jasvith-wordmark">Jasvith<span>✦</span></h1><p>Neon Glass Edition · ReproductorJAz · Continuidad de audio</p></div></header>
    <section className="settings"><label>Tema <select value={theme} onChange={e=>setTheme(e.target.value)}>{THEMES.map(t=><option key={t} value={t}>{t==='jasvith'?'Jasvith Neon':t}</option>)}</select></label><label>Interfaz <select value={mode} onChange={e=>setMode(e.target.value)}>{MODES.map(m=><option key={m}>{m}</option>)}</select></label><label><input type="checkbox" checked={glass} onChange={e=>setGlass(e.target.checked)}/> Cristal</label></section>
    <section className="panel"><div className="line"><strong>{name}</strong><span>{playing?'REPRODUCIENDO':'LISTO'}</span></div><div className="actions"><label className="button">＋ Abrir audio<input hidden type="file" accept="audio/*,.wav,.flac,.mp3,.ogg,.opus,.m4a,.aiff" onChange={loadFile}/></label><button disabled={name==='Sin archivo'} onClick={toggle}>{playing?'Ⅱ Pausar':'▶ Reproducir'}</button><button aria-pressed={loop} onClick={()=>{audio.current.loop=!loop;setLoop(!loop)}}>↻ {loop?'Repetir sí':'Repetir no'}</button></div><div className="line"><span>{fmt(time)}</span><input aria-label="Posición" type="range" min="0" max="1000" value={duration?Math.round(time/duration*1000):0} onChange={e=>{if(duration)audio.current.currentTime=Number(e.target.value)*duration/1000}}/><span>{fmt(duration)}</span></div><div className="line"><span>Volumen</span><input aria-label="Volumen" type="range" min="0" max="100" value={volume*100} onChange={e=>{const v=Number(e.target.value)/100;setVolume(v);audio.current.volume=v}}/><span>{Math.round(volume*100)}%</span></div></section>
    <section className="panel"><h2>JAz Sense · Audio Health</h2><p>{insight}</p><div className="meter"><div style={{width:`${peak*100}%`}}/></div><div className="stats"><article><small>WebSocket RTT</small><strong>{rtt===null?'—':`${rtt} ms`}</strong></article><article><small>Salida estimada</small><strong>{latency===null?'—':`${latency} ms`}</strong></article><article><small>Buffer disponible</small><strong>{buffer.toFixed(1)} s</strong></article><article><small>Interrupciones</small><strong>{underruns}</strong></article><article><small>Conexión</small><strong>{connection}</strong></article></div><p className="hint">Latencia estimada: baseLatency + outputLatency (si el navegador la expone). RTT no es latencia de audio. Las interrupciones cuentan eventos de espera; el archivo local no requiere WebSocket para sonar.</p></section>
    <audio ref={audio} preload="auto" onPlay={()=>{setPlaying(true);recovered()}} onPause={()=>setPlaying(false)} onLoadedMetadata={()=>setDuration(audio.current.duration||0)} onTimeUpdate={()=>{const t=audio.current.currentTime;lastAudioTime.current=t;setTime(t)}} onWaiting={stalled} onStalled={stalled} onPlaying={recovered} onCanPlay={recovered} onEnded={()=>setPlaying(false)} />
    <footer>BlackMamba Audio Engine v0.3 · Local-first</footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
