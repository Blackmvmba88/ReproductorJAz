'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.JazPreferences=api;
})(typeof window!=='undefined'?window:null,function(){
  const themes=['violet','ocean','ember','classic'];
  function normalize(input={}){
    return {theme:themes.includes(input.theme)?input.theme:'violet',glass:input.glass!==false};
  }
  function load(storage){
    try{
      const modern=JSON.parse(storage.getItem('jaz-appearance')||'{}');
      const legacyTheme=storage.getItem('jaz:theme');
      const legacyGlass=storage.getItem('jaz:glass');
      return normalize({
        theme:modern.theme??legacyTheme,
        glass:typeof modern.glass==='boolean'?modern.glass:legacyGlass!=='off'
      });
    }catch{return normalize();}
  }
  function save(storage,value){
    const safe=normalize(value);
    try{storage.setItem('jaz-appearance',JSON.stringify(safe));}catch{}
    return safe;
  }
  return {themes,normalize,load,save};
});
