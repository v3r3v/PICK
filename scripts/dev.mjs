import {spawn} from 'node:child_process';
import {networkInterfaces} from 'node:os';
import {createServer} from 'node:net';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {toQR} from 'toqr';
const require=createRequire(import.meta.url);
const lan=process.argv.includes('--lan');
const apiPort=Number(process.env.PICK_API_PORT||4100),metroPort=Number(process.env.PICK_METRO_PORT||8081);
if(![apiPort,metroPort].every(p=>Number.isInteger(p)&&p>=1024&&p<=65535))throw new Error('Invalid preview port.');
const candidates=Object.entries(networkInterfaces()).flatMap(([name,addresses])=>(addresses||[]).filter(a=>a.family==='IPv4'&&!a.internal).map(a=>({name,address:a.address})));
const physical=candidates.filter(c=>!/(virtual|vbox|vmware|vethernet|loopback)/i.test(c.name));
const wireless=physical.find(c=>/wi-?fi|wireless|wlan/i.test(c.name));
const host=lan?(process.env.PICK_LAN_HOST||wireless?.address||physical[0]?.address||candidates[0]?.address):'127.0.0.1';
if(!host) throw new Error('No LAN IPv4 address found. Connect to Wi-Fi or set PICK_LAN_HOST.');
async function free(port){return new Promise((resolve,reject)=>{const server=createServer();server.once('error',()=>reject(new Error(`Port ${port} is already in use. Stop only the existing PICK process or use its preview; no unrelated service was stopped.`)));server.listen(port,lan?'0.0.0.0':port===metroPort?'localhost':'127.0.0.1',()=>server.close(resolve));});}
await free(apiPort);await free(metroPort);
mkdirSync('.local',{recursive:true});
const apiUrl=`http://${host}:${apiPort}`,webUrl=`http://${lan?host:'localhost'}:${metroPort}`,expoUrl=`exp://${lan?host:'localhost'}:${metroPort}`;
const env={...process.env,PICK_API_HOST:lan?'0.0.0.0':'127.0.0.1',PICK_LAN_HOST:lan?host:'',EXPO_PUBLIC_API_URL:apiUrl,REACT_NATIVE_PACKAGER_HOSTNAME:host};
writeFileSync(metroPort===8081?'.local/preview.json':`.local/preview-${metroPort}.json`,JSON.stringify({mode:lan?'lan':'loopback',apiUrl,webUrl,expoUrl,startedAt:new Date().toISOString()},null,2));
console.log(`\nPICK synthetic demo (${lan?'LAN — same trusted network':'loopback only'})\nWeb: ${webUrl}\nAPI: ${apiUrl}\nExpo Go: ${expoUrl}\n`);
if(lan)console.log('Phone must share this network. Physical iPhone: sign in to Expo CLI and Expo Go with the same Expo account. No firewall rules are changed.');
if(lan){
  const qr=toQR(expoUrl),size=Math.sqrt(qr.length),border=4;
  const dark=(x,y)=>x>=0&&y>=0&&x<size&&y<size&&qr[y*size+x]===1;
  let svg='';
  for(let y=-border;y<size+border;y++){
    let line='';
    for(let x=-border;x<size+border;x++){
      const on=dark(x,y);line+=on?'██':'  ';
      if(on)svg+=`<rect x="${x+border}" y="${y+border}" width="1" height="1"/>`;
    }
    console.log(line);
  }
  writeFileSync('.local/expo-qr.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="330" height="330" viewBox="0 0 ${size+border*2} ${size+border*2}"><rect width="100%" height="100%" fill="white"/><g fill="black">${svg}</g></svg>`);
}
const api=spawn(process.execPath,['--import','tsx','apps/api/src/main.ts'],{cwd:process.cwd(),env,stdio:'inherit',windowsHide:true});
const expoCli=resolve(require.resolve('expo/package.json'),'..','bin','cli');
const metro=spawn(process.execPath,[expoCli,'start','--go','--web',lan?'--lan':'--localhost','--port',String(metroPort)],{cwd:resolve('apps/mobile'),env,stdio:'inherit',windowsHide:true});
let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;api.kill();metro.kill();process.exitCode=code;}
api.on('exit',code=>stop(code||0));metro.on('exit',code=>stop(code||0));
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
