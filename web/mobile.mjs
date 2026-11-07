import os from 'node:os';
import { spawn } from 'node:child_process';
import qr from 'qrcode-terminal';

const port = Number(process.env.JAZ_PORT || 5173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('JAZ_PORT debe ser un puerto entre 1024 y 65535.');
  process.exit(1);
}

const addresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((item) => item && item.family === 'IPv4' && !item.internal)
  .map((item) => item.address);
const privateAddress = (ip) => ip.startsWith('192.168.') || ip.startsWith('10.') ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
const lanAddresses = [...new Set(addresses.filter(privateAddress))];

if (!lanAddresses.length) {
  console.error('No encontré una dirección IPv4 privada. Conéctate a Wi-Fi y vuelve a intentar.');
  process.exit(1);
}
const selected = process.env.JAZ_HOST_IP || lanAddresses[0];
if (!lanAddresses.includes(selected)) {
  console.error('JAZ_HOST_IP no corresponde a una dirección LAN detectada:', selected);
  process.exit(1);
}

const url = `http://${selected}:${port}/`;
console.log('\n🐍 ReproductorJAz · Conectar celular');
console.log('Abre este enlace en el móvil, conectado al mismo Wi-Fi:\n' + url + '\n');
qr.generate(url, { small: true }, (code) => console.log(code));
console.log('La música se selecciona desde el propio celular. Ctrl+C para detener.\n');
console.log('⚠ Red local de confianza únicamente: esta versión no tiene autenticación.\n');

const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(port), '--strictPort'],
  { stdio: 'inherit', shell: process.platform === 'win32' });
child.on('error', (error) => { console.error('No se pudo iniciar Vite:', error.message); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
