const {app,BrowserWindow,shell}=require('electron');
const path=require('node:path');
function createWindow(){
 const win=new BrowserWindow({
  width:1180,height:840,minWidth:360,minHeight:520,
  backgroundColor:'#071409',
  webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}
 });
 win.loadFile(path.join(process.resourcesPath,'web/index.html'));
 win.webContents.setWindowOpenHandler(({url})=>{
  if(/^https?:\/\//.test(url))shell.openExternal(url);
  return {action:'deny'};
 });
}
app.whenReady().then(()=>{
 createWindow();
 app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
