'use strict';
/* Optional browser controls: does not alter the audio graph. */
(function(root){
  function shortcutAction(key, targetTag, modified){
    if(modified || ['INPUT','TEXTAREA','SELECT'].includes(String(targetTag).toUpperCase())) return null;
    const actions={' ':'toggle','ArrowRight':'forward','ArrowLeft':'backward','n':'next','N':'next','p':'previous','P':'previous','m':'mute','M':'mute'};
    return Object.prototype.hasOwnProperty.call(actions,key)?actions[key]:null;
  }
  if(typeof module!=='undefined' && module.exports) module.exports={shortcutAction};
  if(!root || !root.document) return;
  const doc=root.document, audio=doc.getElementById('audio');
  if(!audio) return;
  const byId=id=>doc.getElementById(id);
  const click=id=>{const button=byId(id);if(button && !button.disabled)button.click();};
  function act(action){
    switch(action){
      case 'toggle':click('play');break;
      case 'next':click('next');break;
      case 'previous':click('previous');break;
      case 'forward':if(Number.isFinite(audio.duration))audio.currentTime=Math.min(audio.duration,audio.currentTime+5);break;
      case 'backward':audio.currentTime=Math.max(0,audio.currentTime-5);break;
      case 'mute':audio.muted=!audio.muted;break;
    }
  }
  doc.addEventListener('keydown',event=>{
    const action=shortcutAction(event.key,event.target && event.target.tagName,event.ctrlKey||event.metaKey||event.altKey);
    if(!action || event.repeat)return;
    if(event.target && (event.target.isContentEditable || event.target.closest?.('[role="textbox"]')))return;
    event.preventDefault();act(action);
  });
  if(!('mediaSession' in navigator))return;
  const session=navigator.mediaSession;
  const handlers={play:()=>{if(audio.paused)click('play');},pause:()=>{if(!audio.paused)click('play');},
    previoustrack:()=>act('previous'),nexttrack:()=>act('next'),
    seekbackward:details=>{audio.currentTime=Math.max(0,audio.currentTime-(details.seekOffset||10));},
    seekforward:details=>{if(Number.isFinite(audio.duration))audio.currentTime=Math.min(audio.duration,audio.currentTime+(details.seekOffset||10));},
    seekto:details=>{if(Number.isFinite(details.seekTime))audio.currentTime=details.seekTime;}};
  for(const [name,handler] of Object.entries(handlers)){
    try{session.setActionHandler(name,handler);}catch{/* unsupported action */}
  }
  function updateMetadata(){
    const name=byId('track')?.textContent||'ReproductorJAz';
    if(root.MediaMetadata)session.metadata=new root.MediaMetadata({title:name,artist:'BlackMamba Audio Engine',album:'ReproductorJAz'});
  }
  function updatePosition(){
    if(!session.setPositionState || !Number.isFinite(audio.duration)||audio.duration<=0)return;
    try{session.setPositionState({duration:audio.duration,playbackRate:audio.playbackRate,position:Math.min(audio.duration,Math.max(0,audio.currentTime))});}catch{}
  }
  audio.addEventListener('loadedmetadata',()=>{updateMetadata();updatePosition();});
  audio.addEventListener('timeupdate',updatePosition);
  audio.addEventListener('play',()=>{session.playbackState='playing';updateMetadata();});
  audio.addEventListener('pause',()=>{session.playbackState='paused';});
})(typeof window!=='undefined'?window:null);
