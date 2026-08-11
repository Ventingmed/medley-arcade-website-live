'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=__dirname,DATA=path.resolve(process.env.DATA_DIR||path.join(ROOT,'data'));
const CONFIG=JSON.parse(fs.readFileSync(path.join(ROOT,'config.json'),'utf8'));
fs.mkdirSync(DATA,{recursive:true});
const PORT=Number(process.env.PORT)||10000;
const SCORE_FILE=path.join(DATA,'scores.jsonl');
const scores=[]; const seenRuns=new Set();
try{if(fs.existsSync(SCORE_FILE)){for(const line of fs.readFileSync(SCORE_FILE,'utf8').split(/\r?\n/)){if(!line.trim())continue;try{const r=JSON.parse(line);scores.push(r);if(r.runId)seenRuns.add(r.runId)}catch{}}}}catch{}
const clients=new Map(); const duelQueue=[]; let revision=1;
function cleanName(v){return String(v||'PLAYER').replace(/<[^>]*>/g,'').replace(/[^a-zA-Z0-9 ._\-'’]/g,'').replace(/\s+/g,' ').trim().slice(0,20)||'PLAYER'}
function cleanId(v){return String(v||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80)}
function now(){return Date.now()} function id(prefix){return prefix+'_'+crypto.randomBytes(8).toString('hex')}
function leaderboard(){const map=new Map();for(const r of scores){const key=(r.playerId||r.name.toLowerCase());const prev=map.get(key);if(!prev||r.score>prev.score)map.set(key,r)}return [...map.values()].sort((a,b)=>b.score-a.score||new Date(a.createdAt)-new Date(b.createdAt)).slice(0,100)}
function recentScores(){return scores.slice(-12).reverse().map(r=>({name:r.name,score:r.score,createdAt:r.createdAt}))}
function prune(){const t=now();for(let i=duelQueue.length-1;i>=0;i--)if(t-duelQueue[i].lastSeen>CONFIG.duelWaitTtlSeconds*1000)duelQueue.splice(i,1);for(const [k,c] of clients)if(c.closed||t-c.lastSeen>CONFIG.presenceTtlSeconds*1000){try{c.res.end()}catch{}clients.delete(k)}}
function publicState(){prune();return{build:CONFIG.build,revision,online:clients.size,leaderboard:leaderboard().slice(0,10),recent:recentScores(),duel:{waiting:duelQueue.length,names:duelQueue.slice(0,5).map(x=>x.name)}}}
function json(res,status,obj,origin='*'){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':origin,'access-control-allow-headers':'content-type','access-control-allow-methods':'GET,POST,OPTIONS'});res.end(JSON.stringify(obj))}
function allowedOrigin(req){const o=req.headers.origin||'';if(!o)return '*';const env=process.env.PUBLIC_SITE_URL;if(env&&o===env)return o;return CONFIG.allowedOrigins.includes(o)?o:'null'}
function sse(c,payload){if(c.closed)return;try{c.res.write(`data: ${JSON.stringify(payload)}\n\n`)}catch{c.closed=true}}
function broadcast(){revision++;const state=publicState();for(const c of clients.values())sse(c,{type:'state',state})}
async function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',d=>{s+=d;if(s.length>100000){reject(Error('Too large'));req.destroy()}});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch{reject(Error('Bad JSON'))}})})}
function saveScore(r){scores.push(r);seenRuns.add(r.runId);while(scores.length>CONFIG.maxScores)scores.shift();fs.appendFileSync(SCORE_FILE,JSON.stringify(r)+'\n')}
function queueJoin(playerId,name){const existing=duelQueue.find(x=>x.playerId===playerId);if(existing){existing.name=name;existing.lastSeen=now();return existing}const row={id:id('duel'),playerId,name,joinedAt:now(),lastSeen:now()};duelQueue.push(row);return row}
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');const origin=allowedOrigin(req);if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':origin,'access-control-allow-headers':'content-type','access-control-allow-methods':'GET,POST,OPTIONS'});return res.end()}
 if(url.pathname==='/health')return json(res,200,{ok:true,service:'Medley Arcade Website Live Authority',build:CONFIG.build,state:publicState()},origin);
 if(url.pathname==='/api/state'&&req.method==='GET')return json(res,200,publicState(),origin);
 if(url.pathname==='/live'&&req.method==='GET'){
   const playerId=cleanId(url.searchParams.get('playerId'))||id('anon'),name=cleanName(url.searchParams.get('name'));
   res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache, no-transform','connection':'keep-alive','access-control-allow-origin':origin,'x-accel-buffering':'no'});res.write(': connected\n\n');
   const c={id:id('presence'),playerId,name,res,lastSeen:now(),closed:false};clients.set(c.id,c);sse(c,{type:'state',state:publicState()});broadcast();
   const timer=setInterval(()=>{c.lastSeen=now();sse(c,{type:'ping',at:now()})},15000);res.on('close',()=>{clearInterval(timer);c.closed=true;clients.delete(c.id);broadcast()});return;
 }
 if(url.pathname==='/api/score'&&req.method==='POST')try{const b=await body(req),playerId=cleanId(b.playerId),name=cleanName(b.name),runId=cleanId(b.runId)||id('run'),score=Math.max(0,Math.min(CONFIG.maxScore,Math.floor(Number(b.score)||0)));if(!playerId)return json(res,400,{ok:false,error:'playerId required'},origin);if(seenRuns.has(runId))return json(res,200,{ok:true,duplicate:true,state:publicState()},origin);const r={id:id('score'),playerId,name,score,game:'shooting-gallery',runId,createdAt:new Date().toISOString(),stats:b.stats&&typeof b.stats==='object'?b.stats:{}};saveScore(r);broadcast();return json(res,200,{ok:true,result:r,state:publicState()},origin)}catch(e){return json(res,400,{ok:false,error:e.message},origin)}
 if(url.pathname==='/api/duel/join'&&req.method==='POST')try{const b=await body(req),playerId=cleanId(b.playerId),name=cleanName(b.name);if(!playerId)return json(res,400,{ok:false,error:'playerId required'},origin);const row=queueJoin(playerId,name);broadcast();return json(res,200,{ok:true,entry:row,position:duelQueue.findIndex(x=>x.playerId===playerId)+1,state:publicState()},origin)}catch(e){return json(res,400,{ok:false,error:e.message},origin)}
 if(url.pathname==='/api/duel/heartbeat'&&req.method==='POST')try{const b=await body(req),playerId=cleanId(b.playerId),q=duelQueue.find(x=>x.playerId===playerId);if(q)q.lastSeen=now();return json(res,200,{ok:true,position:q?duelQueue.indexOf(q)+1:0,state:publicState()},origin)}catch(e){return json(res,400,{ok:false,error:e.message},origin)}
 if(url.pathname==='/api/duel/leave'&&req.method==='POST')try{const b=await body(req),playerId=cleanId(b.playerId),i=duelQueue.findIndex(x=>x.playerId===playerId);if(i>=0)duelQueue.splice(i,1);broadcast();return json(res,200,{ok:true,state:publicState()},origin)}catch(e){return json(res,400,{ok:false,error:e.message},origin)}
 if(url.pathname==='/'){return json(res,200,{ok:true,service:'Medley Arcade Website Live Authority',build:CONFIG.build,health:'/health'},origin)}
 res.writeHead(404,{'content-type':'text/plain; charset=utf-8','access-control-allow-origin':origin});res.end('Not found');
});
setInterval(()=>{prune();broadcast()},30000);
server.listen(PORT,'0.0.0.0',()=>console.log(`Medley_Arcade_Website_Live_081 Authority listening on ${PORT}`));
