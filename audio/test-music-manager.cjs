const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const gain=()=>({value:1,setTargetAtTime(x){this.value=x},setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){}});
const sources=[], cues=[], noiseVoices=[], requests=[], storage=new Map();
class Context {
 state='suspended'; currentTime=0; sampleRate=32000; destination={};
 createGain(){return {gain:gain(),connect(){},disconnect(){}}}
 createOscillator(){
  const node={frequency:gain(),connect(){},disconnect(){this.disconnected=true},start(time){this.startTime=time},stop(time){this.stopTime=time}};
  cues.push(node);return node;
 }
 createBufferSource(){
  const node={connect(){},disconnect(){this.disconnected=true},start(time,offset){this.startTime=time;this.offset=offset;(this.buffer?.noise?noiseVoices:sources).push(this)},stop(time){this.stopTime=time}};
  return node;
 }
 createBuffer(_channels,length){return {noise:true,getChannelData:()=>new Float32Array(length)}}
 createBiquadFilter(){return {frequency:gain(),connect(){},disconnect(){}}}
 resume(){this.state='running';return Promise.resolve()}
 suspend(){this.state='suspended';return Promise.resolve()}
 decodeAudioData(bytes){return Promise.resolve({duration:bytes.duration})}
}
const sandbox={window:{AudioContext:Context,requestIdleCallback(){}},document:{hidden:false},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},fetch:async url=>{requests.push(url);return {ok:true,arrayBuffer:async()=>({duration:72})}}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('docs/field-events.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync('docs/observatory.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync('docs/audio/music-manager.js','utf8')+';this.bg=music;this.route=chapterTheme;this.make=()=>new BackgroundMusic();',sandbox);
const {bg,route,make}=sandbox;
const settle=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 assert.equal(bg.volume,10);
 assert.equal(route(0,false),'mechanics_exterior');assert.equal(route(9,false),'mechanics_exterior');
 assert.equal(route(0,true),'overworld');assert.equal(route(9,true),'overworld');
 for(const i of [7,8,16,20,23])assert.equal(route(i,false),'mechanics_interior');
 for(const i of [1,2,3,4,5,6])assert.equal(route(i,false),'challenge_room');
 assert.equal(route(24,true),'observatory_lobby');
 for(const i of [25,26,27,28])assert.equal(route(i,true),'observatory_challenge');
 for(const i of [29,30,31,32])assert.equal(route(i,true),'observatory_study');
 assert.equal(route(33,true),'observatory_signal');
 for(const i of [10,11,12,13,14,15,34])assert.equal(route(i,true),'overworld');
 bg.setTheme(route(0,false));assert.equal(sources.length,0);
 bg.playDiscoveryCue();assert.equal(cues.length,0);
 bg.unlock();await settle();assert.equal(bg.current.theme,'mechanics_exterior');
 assert.equal(bg.master.gain.value,.1);assert.equal(sources[0].loop,true);assert.equal(sources[0].loopEnd,72);
 bg.playDiscoveryCue();assert.equal(cues[0].type,'triangle');
 cues[0].onended();assert.equal(cues[0].disconnected,true);
 bg.playDoorCue();assert.equal(cues[1].type,'square');
 bg.playRepairCue();assert.equal(cues.length,6);
 assert.equal(bg.duck,.52);assert.equal(bg.effects.gain.value,.1);
 cues[5].onended();assert.equal(bg.duck,1);
 bg.playBlockCue();bg.playPlateCue();
 assert.ok(cues[7].startTime>cues[6].stopTime);
 bg.playDialCue();bg.playDialCue();assert.equal(cues.length,9);
 bg.playDialogueCue('Mira');bg.playDialogueCue('Mira');assert.equal(cues.length,10);
 bg.setDialogueBlips(false);bg.context.currentTime=1;bg.playDialogueCue('Sol');
 assert.equal(cues.length,10);assert.equal(make().dialogueBlips,false);
 bg.playHydraulicCue();bg.playHydraulicCue();assert.equal(noiseVoices.length,1);
 bg.playCouplingCue();assert.equal(cues.length,11);assert.equal(noiseVoices.length,2);
 noiseVoices[1].onended();assert.equal(noiseVoices[1].disconnected,true);
 const transition=async(theme,time)=>{
  bg.context.currentTime=time;bg.setTheme(theme);await settle();assert.equal(bg.current.theme,theme);
  const old=bg.retiring;assert.equal(old.source.stopTime,time+1.5);
  bg.context.currentTime=time+1.5;old.source.onended();await settle();assert.equal(old.source.disconnected,true);
 };
 await transition('mechanics_interior',8);
 bg.setTheme(route(16,false));await settle();assert.equal(sources.length,2);
 await transition('challenge_room',15);
 bg.setTheme(route(3,false));await settle();assert.equal(sources.length,3);
 await transition('mechanics_interior',25);
 assert.ok(bg.current.source.offset>0);
 bg.context.currentTime=30;bg.setTheme('challenge_room');await settle();
 const outgoing=bg.retiring;bg.setTheme('overworld');bg.setTheme('mechanics_exterior');bg.setTheme('overworld');
 await settle();assert.equal(bg.current.theme,'challenge_room');assert.equal(bg.retiring,outgoing);
 bg.context.currentTime=31.5;outgoing.source.onended();await settle();
 assert.equal(bg.current.theme,'overworld');assert.equal(bg.retiring.theme,'challenge_room');
 const live=bg.current.source;
 bg.setPreferences(25,true);assert.equal(bg.master.gain.value,0);assert.equal(bg.current.source,live);
 bg.playDiscoveryCue();bg.playDoorCue();bg.playRepairCue();bg.playBlockCue();bg.playPlateCue();assert.equal(cues.length,11);
 bg.playObservatoryCue(true);assert.equal(cues.length,11);
 const reloaded=make();assert.equal(reloaded.volume,25);assert.equal(reloaded.muted,true);
 bg.setPreferences(10,false);bg.setDucking(.5);assert.equal(bg.master.gain.value,.05);bg.setDucking();
 bg.retiring.source.onended();bg.setTheme(null);await settle();assert.equal(bg.current,null);
 bg.retiring.source.onended();assert.equal(bg.retiring,null);
 bg.setTheme('overworld');await settle();const latest=bg.current.source;bg.exit();assert.equal(latest.disconnected,true);
 bg.restore();await settle();assert.equal(bg.current.theme,'overworld');
 assert.equal(requests.length,4);
 const cueStart=bg.context.currentTime;
 bg.playObservatoryCue();assert.equal(cues.length,13);
 assert.ok(Math.abs(cues[12].startTime-cueStart-.11)<1e-9);
 await transition(route(24,true),40);
 assert.ok(!bg.pending.has('overworld'));
 await transition(route(25,true),45);
 const challenge=bg.current.source;
 bg.setTheme(route(26,true));await settle();assert.equal(bg.current.source,challenge);
 await transition(route(29,true),50);
 const study=bg.current.source;
 bg.setTheme(route(30,true));await settle();assert.equal(bg.current.source,study);
 await transition(route(33,true),55);
 const signal=bg.current.source;
 bg.setTheme(route(33,true));await settle();assert.equal(bg.current.source,signal);
 await transition(route(34,true),60);
 assert.ok(!bg.pending.has('observatory_signal'));
 assert.deepEqual(requests.slice(4),[
  'audio/music/observatory_lobby.flac','audio/music/observatory_challenge.flac',
  'audio/music/observatory_study.flac','audio/music/observatory_signal.flac','audio/music/overworld.flac'
 ]);
 assert.ok(requests.every(url=>fs.existsSync('docs/'+url)));
 console.log('Passed theme routing, autoplay guard, loops, cached/resumed tracks, 1.5 s fades, rapid retargeting, 10% defaults, persistent mute/volume, ducking, interaction cues, title and page lifecycle.');
})().catch(error=>{console.error(error);process.exitCode=1});
