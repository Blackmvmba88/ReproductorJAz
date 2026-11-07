'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.JazVisualizer=api;
})(typeof window!=='undefined'?window:null,function(){
  function createScheduler({request,cancel,draw}){
    let id=null,active=false;
    function tick(t){id=null;if(!active)return;draw(t);if(active)id=request(tick);}
    return {
      start(){if(active)return;active=true;id=request(tick);},
      stop(){active=false;if(id!==null){cancel(id);id=null;}},
      get running(){return active;}
    };
  }
  return {createScheduler};
});
