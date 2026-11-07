'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.JazPlaylist=api;
})(typeof window!=='undefined'?window:null,function(){
  function nextIndex(current,length,direction,shuffle=false,repeat=false,random=Math.random){
    if(!Number.isInteger(length)||length<=0)return -1;
    if(shuffle&&length>1){
      const pick=Math.min(length-2,Math.max(0,Math.floor(random()*(length-1))));
      return pick>=current?pick+1:pick;
    }
    const candidate=current+direction;
    if(candidate>=0&&candidate<length)return candidate;
    return repeat?(candidate+length)%length:-1;
  }
  return {nextIndex};
});
