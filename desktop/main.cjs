const {app,BrowserWindow,shell,protocol,net}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

protocol.registerSchemesAsPrivileged([
 {scheme:'jasvith',privileges:{standard:true,secure:true,supportFetchAPI:true}}
]);
app.whenReady().then(()=>{
 const assets=path.resolve(process.resourcesPath,'web');
 protocol.handle('jasvith',request=>{
  const pathname=decodeURIComponent(new URL(request.url).pathname);
  const target=path.resolve(assets,'.'+pathname);
  if(target!==assets&&!target.startsWith(assets+path.sep))
   return new Response('Forbidden',{status:403});
  return net.fetch(pathToFileURL(target).toString());
 });
 createWindow();
 app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
});
function createWindow(){
 const win=new BrowserWindow({
  width:1180,height:840,minWidth:360,minHeight:520,
  backgroundColor:'#071409',
  webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}
 });
 win.loadURL('jasvith://app/index.html');
 win.webContents.setWindowOpenHandler(({url})=>{
  if(/^https?:\/\//.test(url))shell.openExternal(url);
  return {action:'deny'};
 });
}
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
