const sharp=require('sharp');
const fs=require('node:fs');
const path=require('node:path');
const input=path.join(__dirname,'../web/public/jasvith-icon.svg');
const output=path.join(__dirname,'assets/icon.png');
fs.mkdirSync(path.dirname(output),{recursive:true});
sharp(input).resize(1024,1024).png().toFile(output).then(()=>console.log(output)).catch(e=>{console.error(e);process.exitCode=1});
