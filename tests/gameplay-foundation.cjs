const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync('docs/index.html','utf8');
const elements = new Map(), timers = [], events = new Map(), frames = [], saved = new Map();
const directionButtons=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].map(key=>({dataset:{key},setPointerCapture(){}}));
const pads = [], canvasLabels = [], motionPreference = {matches:false};
const canvasImages = [];
let focusedElement;
function element(){
 return {
  hidden:true, isConnected:true, style:{}, children:[], lastChild:{}, classList:{add(){},remove(){},toggle(){}},
  addEventListener(name,fn){if(name==='click')this.onclick=fn;},
  focus(){focusedElement=this;}, setAttribute(){}, getBoundingClientRect(){return {top:20,bottom:100};},
  append(child){this.children.push(child);},replaceChildren(){this.children=[];},
  querySelector(){return this.children[0];},click(){this.onclick?.();},getContext(){return ctx;}
 };
}
function lookup(id){
 if(!elements.has(id))elements.set(id,element());
 return elements.get(id);
}
const sheet=lookup('sheet');
Object.defineProperty(sheet,'innerHTML',{get(){return this.markup;},set(markup){
 this.markup=markup;
 for(const id of ['avatars','resume','title-choices','topics','crank-choices','music-buttons','journal-cards','observatory-choices','curiosity-actions'])
  if(markup.includes('id="'+id+'"'))lookup(id).replaceChildren();
}});
sheet.querySelectorAll=()=>{
 const choices=[];
 for(const match of (sheet.markup||'').matchAll(/<(?:button|div)[^>]*id="([^"]+)"/g)){
  if(match[0].startsWith('<button'))choices.push(lookup(match[1]));
  else choices.push(...lookup(match[1]).children);
 }
 return choices;
};
sheet.querySelector=selector=>sheet.querySelectorAll().find(choice=>choice.id&&selector.includes('#'+choice.id))||
 ['dismiss','comic-skip'].map(id=>({id,el:lookup(id)})).find(({id})=>selector.includes('#'+id)&&sheet.markup.includes('id="'+id+'"'))?.el;
const ctx=new Proxy({fillText(text){canvasLabels.push(text);},drawImage(image){canvasImages.push(image.src);}}, {get:(value,key)=>value[key]||(key==='createRadialGradient'?()=>({addColorStop(){}}):()=>{})});
const scope=vm.createContext({
 URLSearchParams,assert,pads,directionButtons,canvasLabels,canvasImages,motionPreference,performance,hasPortrait:path=>Boolean(path)&&fs.existsSync('docs/'+path),focused:()=>focusedElement,navigator:{getGamepads:()=>pads},
 Image:class {complete=true;naturalWidth=360;},
 document:{createElement:element,hidden:false,getElementById:lookup,querySelector:()=>({getContext:()=>ctx}),querySelectorAll:selector=>selector==='[data-key]'?directionButtons:[],addEventListener(){}},
 window:{matchMedia:()=>motionPreference,addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn);}},
 localStorage:{getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)},
 requestAnimationFrame:fn=>frames.push(fn),setTimeout:fn=>timers.push(fn),
 key:(key,repeat=false,type='keydown')=>events.get(type).forEach(fn=>fn({key,repeat,preventDefault(){}})),
 flush:()=>timers.shift()()
});
for(const script of ['docs/audio/music-manager.js','docs/gameplay.js','docs/science-labs.js','docs/portraits.js','docs/scenery.js','docs/valley-investigations.js','docs/study-labs.js','docs/field-events.js','docs/observatory.js','docs/quest-extras.js'])
 vm.runInContext(fs.readFileSync(script,'utf8'),scope);
vm.runInContext(html.split('<script>')[1].split('</script>')[0],scope);
vm.runInContext(`
assert.ok(Math.abs(Math.hypot(...Object.values(adventure.movement(1,1)))-1)<1e-10);
assert.ok(adventure.walkable(100,110,()=>false,[]));
assert.equal(adventure.walkable(100,110,(x,y)=>x===104&&y===110),false);
assert.equal(adventure.walkable(100,110,()=>false,[{x:112,y:110}]),false);
const mover={x:80,y:100,facing:'east'};
adventure.move(mover,adventure.movement(1,1),50,(x,y)=>adventure.walkable(x,y,(a)=>a>104&&a<109));
assert.ok(mover.x<=101&&mover.y>130);assert.ok(mover.walking);
const areaPoint={x:40,y:245,dx:-1,dy:0};
const alternate=adventure.entry(areaPoint,(x,y)=>x>84);
assert.ok(alternate.x>84);
const closeNPC={kind:'person',point:{x:70,y:100},radius:38};
const desk={kind:'desk',point:{x:134,y:100},radius:45};
assert.equal(adventure.interaction({x:100,y:100,facing:'east'},[closeNPC,desk]).kind,'desk');
assert.equal(adventure.interaction({x:100,y:100,facing:'west'},[closeNPC,desk]).kind,'person');

function at(point,facing='south'){player.x=point.x;player.y=point.y;player.facing=facing;}
function door(dir,to){
 const lastRoom=roomIndex;
 at(threshold[dir],dir);interact();
 assert.equal(roomIndex,lastRoom);assert.equal(gameMode(),'transition');
 interact();assert.equal(roomIndex,lastRoom);
 advancePassage(time+.3);assert.equal(roomIndex,to);
 assert.ok(canStand(player.x,player.y),'door arrival is on walkable ground');
}
function meet(){at(operatorPoint());interact();assert.match($('sheet').innerHTML,/topics/);$('dismiss').onclick();}
function research(){
 const id=roomIndex, plan=plans[id];door(plan.dir,plan.room);
 at(researchSource(id));key('e');assert.match($('sheet').innerHTML,/Measurements/);
 assert.ok(acquired.has(scienceLabs.instrumentByRoom[id]));
 key('e',true);assert.equal($('modal').hidden,false);
 $('dismiss').onclick();door(opposite[plan.dir],id);
}
function report(id){
 assert.match($('operator-prompt').textContent,/Talk to .* to explain your repair/);
 assert.ok(!$('operator-prompt').hidden);
 const {x,y}=scienceLabs.resetConsole(id);
 assert.ok(canStand(x,y),rooms[id].name+' clears the reset console after the successful trial');
 assert.ok(canStand(360,251),rooms[id].name+' has no collision at the old console');
 at({x,y});assert.notEqual(activeInteraction()?.kind,'console');
 canvasLabels.length=0;draw();assert.ok(!canvasLabels.includes('Reset'),rooms[id].name+' removes the reset console artwork');
 at(operatorPoint());interact();$('topics').children[id%2].click();
 assert.ok(reported.has(id));$('dismiss').onclick();assert.ok($('operator-prompt').hidden);
}
assert.match($('sheet').innerHTML,/Choose your character/);
const speakers=[...Object.keys(avatars),...Object.values(operators).map(operator=>operator[0]),
 ...Object.values(conversations).map(person=>person.name),...Object.values(students).flat().map(student=>student.name)];
for(let id=observatory.lobby;id<=observatory.offworld;id++){
 for(const person of observatory.people(id,observatoryState))speakers.push(person.name);
}
assert.ok(hasPortrait(portraits.get('Technician Vega','explaining')));
assert.ok(hasPortrait(portraits.get('Archivist Vela','happy')));
for(const name of speakers)assert.ok(hasPortrait(portraits.get(name)),name+' has portrait artwork');
assert.ok(hasPortrait(portraits.get('Mira','relieved')));
assert.ok(hasPortrait(portraits.get('Rowan','thinking')));
assert.ok(hasPortrait(portraits.get('Lift operator Sol','concerned')));
$('avatars').children[0].click();$('comic-skip').onclick();assert.equal(music.target,'mechanics_exterior');
// A direction held while opening dialogue must not move its default selection.
const dialogPad=Array.from({length:16},()=>({pressed:false}));
pads.push({mapping:'standard',buttons:dialogPad});
at(operatorPoint());
dialogPad[13].pressed=true;updateGamepad(1);
dialogPad[0].pressed=true;updateGamepad(2);
assert.equal(focused(),$('topics').children[0]);
dialogPad[0].pressed=false;updateGamepad(700);
assert.equal(choiceIndex,0);
key('ArrowDown',true);assert.equal(choiceIndex,0);
dialogPad[13].pressed=false;updateGamepad(710);
dialogPad[13].pressed=true;updateGamepad(720);
assert.equal(choiceIndex,1);
key('ArrowDown');assert.equal(focused(),$('topics').children[2]);
$('dismiss').onclick();pads.pop();updateGamepad(730);
at(operatorPoint());key('e');assert.equal(focused(),$('topics').children[0]);
$('dismiss').onclick();


function use(id){
 const selected=scienceLabs.targets(currentLab()).find(control=>control.id===id);
 assert.ok(selected,id);at(selected.point);assert.equal(activeInteraction().control.id,id);key('e');
}
function walkStraight(from,to){
 at(from);
 adventure.move(player,adventure.movement(to.x-from.x,to.y-from.y),Math.hypot(to.x-from.x,to.y-from.y),canStand);
 assert.ok(Math.hypot(player.x-to.x,player.y-to.y)<1,rooms[roomIndex].name+' has a direct carry route');
}
function dial(id,steps){
 use(id);assert.equal(gameMode(),'apparatus');
 for(let i=0;i<steps;i++)key('ArrowRight');
 key('e');assert.equal(gameMode(),'experiment');flush();
}
assert.equal(scienceLabs.liftDifference(400),-120);
assert.equal(scienceLabs.pistonForce(30,0),600);
assert.equal(scienceLabs.pistonForce(40,1),320);
assert.deepEqual(scienceLabs.brakeMomenta(1,-1,1),{cart:-10,guardian:10,total:0});
assert.deepEqual(scienceLabs.brakeMomenta(1,1,1),{cart:10,guardian:10,total:20});
assert.deepEqual(scienceLabs.brakeMomenta(1,1,-1),{cart:10,guardian:-10,total:0});
assert.equal(scienceLabs.crankTorque(40),20);
assert.ok(scienceLabs.measurements(scienceLabs.make(9),null)[0].includes('15 cm'));
assert.ok(scienceLabs.measurements(scienceLabs.make(5,true),null).some(line=>line.includes('200 cm²')));
assert.ok(scienceLabs.measurements(scienceLabs.make(2),{id:'mass-4',detail:4}).some(line=>line.includes('39.2 N')));
assert.ok(scienceLabs.measurements(scienceLabs.make(3,true),null).some(line=>line.includes('2 m/s and 2 m')));
function incomingCartX(speed,seconds){
 const lab=scienceLabs.make(3), labels=[];
 lab.trial={...scienceLabs.collision(speed),key:'momentum',started:0};
 scienceLabs.draw(lab,seconds,{rect(){},line(){},label(text,x){if(text==='4 kg')labels.push(x);}});
 return labels[0];
}
assert.equal(incomingCartX(1,.25)-incomingCartX(1,0),15.5);
assert.equal(incomingCartX(4,.25)-incomingCartX(4,0),62);
for(const speed of [1,3,4]){
 const trial=scienceLabs.collision(speed);
 assert.ok(Math.abs(incomingCartX(speed,trial.approachTime)-320)<1e-9);
 assert.ok(Math.abs(incomingCartX(speed,trial.approachTime+trial.coupledSpeed)-320-trial.distance*62)<1e-9);
}
assert.match(researchDiagram(4),/Distance to choose/);
assert.doesNotMatch(researchDiagram(4),/>2 m</);
assert.ok(scienceLabs.measurements(scienceLabs.make(6,true),null)[0].includes('stopped'));
// June is now within interaction range while walking along the courtyard path.
walkStraight({x:545,y:245},{x:575,y:245});
assert.equal(activeInteraction()?.point.name,'June');
key('e');assert.match($('sheet').innerHTML,/<h2>June<\\/h2>/);
assert.equal(menuButtons().length,1);key('c');
meet();research();
key('n');assert.match($('sheet').innerHTML,/Current objective/);
assert.match($('sheet').innerHTML,/Use the spring scale/);
key('ArrowRight');key('e');
assert.equal(focused(),$('journal-cards').children[0]);key('e');
assert.match($('sheet').innerHTML,/Lift load sheet/);
assert.match($('sheet').innerHTML,/Back to discoveries/);
key('c');assert.match($('sheet').innerHTML,/Discovery cards · 1/);
key('c');
use('lift-lever');
assert.match($('sheet').innerHTML,/Spring scale/);
assert.match($('sheet').innerHTML,/520 N/);
assert.ok(recordedReadings.has(0));assert.equal(currentLab().attempts.lift,undefined);
key('ArrowRight');key('e');assert.match($('sheet').innerHTML,/Readings taken at Castle approach/);
key('c');
use('lift-lever');assert.match($('feedback').textContent,/Hang a counterweight/);
use('weight-400');assert.equal(currentLab().carry,400);use('lift-hook');use('lift-lever');flush();
assert.equal(solved.has(0),false);assert.match($('feedback').textContent,/120 N/);
use('lift-hook');key('c');assert.equal(currentLab().carry,null);
use('weight-680');
walkStraight({x:243,y:249},{x:500,y:249});
assert.equal(activeInteraction()?.control?.id,'lift-hook');
key('e');use('lift-lever');flush();assert.ok(solved.has(0));assert.ok(mira.walking);
assert.ok(canStand(175,232),'removed lift counterweight does not block the path');
report(0);
door('east',9);
at(threshold.west,'west');interact();
assert.equal(roomIndex,9);assert.match($('feedback').textContent,/maintenance room is still open/);
keys.add('ArrowLeft');frame(32);keys.clear();assert.equal(roomIndex,9);
meet();research();use('crank');
assert.match($('feedback').textContent,/15 cm from axle/);
assert.doesNotMatch($('feedback').textContent,/N·m/);
const labels=[];
scienceLabs.draw(currentLab(),time,{rect(){},line(){},label:text=>labels.push(text)});
assert.deepEqual(labels,['15 cm','Reset']);
key('ArrowRight');key('e');
assert.doesNotMatch($('feedback').textContent,/N·m/);
flush();
assert.equal(gardenBridge,false);assert.match($('feedback').textContent,/10 N·m/);
key('c');use('reset');assert.equal(currentLab().values.crank,15);
dial('crank',5);assert.equal(gardenBridge,true);
assert.match($('feedback').textContent,/20 N·m/);
assert.equal(isOpen(links[9].find(exit=>exit.dir==='west')),false);
assert.equal(isOpen(links[9].find(exit=>exit.dir==='south')),true);
report(9);at(surveyMarker);key('e');assert.ok(surveyRead);$('dismiss').onclick();
door('west',0);
Object.assign(mira,{x:235,y:252,walking:false});
at(mira);interact();assert.match($('sheet').innerHTML,/found the survey route/);$('dismiss').onclick();
door('north',7);assert.equal(music.target,'mechanics_interior');
assert.equal(students[7].length,3);
for(const student of students[7])assert.ok(targetReachable(student),student.name+' can be reached from the Great Hall entrance');
for(const student of students[7]){
 at({x:student.x,y:student.y-16},'south');
 assert.equal(activeInteraction()?.point.name,student.name);
 key('e');assert.ok(studentQuestions[7].includes(student.lastLine));
 assert.equal(menuButtons().length,1);key('c');
}
at(people[7]);key('e');
assert.match($('sheet').innerHTML,/<h2>Inez/);
assert.match($('sheet').innerHTML,/inez.webp/);
assert.equal(speech.complete,false);
assert.equal($('speech-hint').textContent,'E to reveal the full line');
key('Enter');assert.equal(speech.complete,true);
assert.equal($('speech-hint').hidden,true);
assert.match($('sheet').innerHTML,/<h2>Inez/);
key('e');assert.match($('sheet').innerHTML,/<h2>Rowan/);
assert.match($('sheet').innerHTML,/rowan(?:-thinking)?.webp/);
key('e');assert.match($('sheet').innerHTML,/<h2>Rowan/);
key('e');assert.match($('sheet').innerHTML,/<h2>Inez/);
advanceSpeech(speech.start+9999);assert.equal(speech.complete,true);
key('c');
motionPreference.matches=true;
at(people[7]);key('e');assert.equal(speech.complete,true);
key('c');motionPreference.matches=false;
assert.equal(scienceLabs.acceleration(6),2);
assert.equal(scienceLabs.friction(0).win,false);assert.equal(scienceLabs.friction(1).win,true);assert.equal(scienceLabs.friction(2).win,false);
assert.equal(scienceLabs.collision(3).distance,2);assert.equal(scienceLabs.torque(2),0);
door('west',1);meet();research();
at({x:165,y:223});key('n');
assert.match($('sheet').innerHTML,/Motion tracker/);
assert.match($('sheet').innerHTML,/Launch speed · 4 m\\/s/);
key('c');
use('lane-0');flush();assert.match($('feedback').textContent,/rougher surface/);
use('lane-2');flush();assert.match($('feedback').textContent,/more friction/);
use('lane-0');flush();assert.match($('feedback').textContent,/middle-friction/);
use('reset');assert.equal(currentLab().attempts.friction,undefined);
use('lane-1');flush();report(1);door('east',7);
assert.match($('feedback').textContent,/force calibration.*east/i);
assert.doesNotMatch($('feedback').textContent,/friction track/i);
door('east',2);meet();research();
const midCastle=loadProgress();
assert.equal(midCastle.version,2);
assert.equal(midCastle.run.room,2);assert.equal(midCastle.run.entry,'north');
clearSession();savedRun=midCastle.run;intro();
assert.match($('resume').children[0].textContent,/Continue as Rowan/);
$('resume').children[0].click();
assert.equal(avatar,'Rowan');assert.equal(roomIndex,2);
assert.ok(canStand(player.x,player.y));
assert.ok(solved.has(1)&&reported.has(1)&&surveyRead&&gardenBridge);
assert.ok(recovered.has(2)&&consulted.has(2)&&visited.has(23));
assert.ok(acquired.has('Spring scale'));
assert.ok(recordedReadings.has(0)&&recordedReadings.has(1));
assert.ok(discussed.has('Mira'));
assert.ok(!isOpen(links[2].find(exit=>exit.dir==='west')));
use('mass-2');assert.equal(currentLab().carry,2);
const plateCues=[];
music.playBlockCue=()=>plateCues.push('block');
music.playPlateCue=()=>plateCues.push('plate');
use('plate');assert.ok($('feedback').textContent.includes("6 m/s²"));assert.equal(currentLab().calibrated,false);
assert.deepEqual(plateCues,['block']);
use('plate');assert.equal(currentLab().carry,2);key('c');assert.equal(currentLab().carry,null);
use('mass-4');assert.equal(currentLab().carry,4);
walkStraight({x:230,y:249},{x:535,y:249});
assert.equal(activeInteraction()?.control?.id,'plate');
key('e');assert.ok(currentLab().calibrated);
assert.deepEqual(plateCues,['block','block','plate']);
const checkForceLabel=text=>{canvasLabels.length=0;draw();assert.ok(canvasLabels.includes(text),text);};
checkForceLabel('Net force: 6 N right');
dial('force',0);assert.match($('feedback').textContent,/6 N right/);
for(let i=0;i<12;i++)key('ArrowRight');
checkForceLabel('Net force: 0 N (balanced)');
key('ArrowRight');checkForceLabel('Net force: 0.5 N left');
key('e');flush();assert.equal(solved.has(2),false);
key('ArrowLeft');key('e');flush();assert.ok(solved.has(2));
savedRun=loadProgress().run;clearSession();intro();$('resume').children[0].click();
assert.ok(solved.has(2)&&!reported.has(2));
assert.match($('operator-prompt').textContent,/Talk to Workshop lead Lin/);
assert.ok(!isOpen(links[2].find(exit=>exit.dir==='west')));
report(2);door('west',7);
assert.match($('feedback').textContent,/both checks are logged/i);
at({x:625,y:61},'north');keys.add('ArrowUp');frame(100);
assert.equal(gameMode(),'transition');assert.equal(roomIndex,7);
frame(390);keys.clear();
assert.equal(roomIndex,8);assert.ok(canStand(player.x,player.y));
door('west',3);meet();research();dial('momentum',0);assert.match($('feedback').textContent,/0.5 m/);
key('c');dial('momentum',3);report(3);door('east',8);
door('east',4);meet();research();
use('torque');assert.match($('sheet').innerHTML,/Lever-arm gauge/);
assert.match($('sheet').innerHTML,/1.0 m right of the pivot/);
assert.equal(currentLab().adjust,null);key('c');
dial('torque',0);assert.match($('feedback').textContent,/counterclockwise/);
key('c');dial('torque',9);assert.ok(solved.has(4));report(4);door('west',8);
door('north',5);meet();research();
use('hydraulic');assert.match($('feedback').textContent,/Connect one/);
use('piston-1');dial('hydraulic',5);assert.match($('feedback').textContent,/320 N/);
key('c');use('reset');use('piston-0');dial('hydraulic',3);assert.ok(solved.has(5));report(5);
door('north',6);meet();research();
for(const {x} of scienceLabs.equipment.launchers){
 for(const npc of npcFeet())assert.ok(Math.abs(npc.x-x)>=54,'NPC artwork clears the launch plate');
}
use('launcher--1');assert.match($('feedback').textContent,/Couple one/);
use('cart-0');use('launcher--1');flush();assert.ok($('feedback').textContent.includes('Cart −6, guardian +10, total +4 kg·m/s'));
use('cart-1');use('launcher-1');flush();assert.ok($('feedback').textContent.includes('Cart +10, guardian +10, total +20 kg·m/s'));
use('launcher--1');flush();assert.equal(currentLab().brakes,1);assert.equal(currentLab().heading,-1);
assert.ok($('feedback').textContent.includes('Cart −10, guardian +10, total 0 kg·m/s'));
use('launcher--1');flush();assert.equal(currentLab().brakes,1);
use('launcher-1');flush();assert.equal(currentLab().brakes,2);
assert.ok($('feedback').textContent.includes('Cart +10, guardian −10, total 0 kg·m/s'));

assert.ok(solved.has(6));report(6);
assert.equal($('progress').style.width,100*6/7+'%');
showNotebook();assert.match($('sheet').innerHTML,/Read the diagnostics/);close();
at(diagnostic);interact();
assert.equal($('progress').style.width,'100%');
for(let i=0;i<3;i++)$('robot-next').onclick();
assert.equal(readCheckpoint().area,10);
door('north',10);$('dismiss').onclick();assert.equal(music.target,'overworld');
door('east',11);door('east',12);
at(threshold.south,'south');interact();
assert.ok(shortcutOpen);assert.ok(loadProgress().unlocks.shortcut);
door('south',15);door('west',14);
function openField(id){
 const station=valleyInvestigations.stations[id];
 assert.ok(targetReachable(station,29),station.site+' has a reachable field station');
 at(station,'north');assert.equal(activeInteraction()?.kind,'field');
 key('e');assert.match($('sheet').innerHTML,new RegExp(station.name));
}
openField(14);assert.match($('sheet').innerHTML,/Both 1 kg carriages/);
key('ArrowRight');key('e');
for(const label of ['8 m/s²','4 m/s²'])assert.ok($('sheet').innerHTML.includes(label));
assert.equal(fieldReports.size,0);
key('e');assert.match($('sheet').innerHTML,/tangent to their circles/);
assert.deepEqual(fieldReports.get(14).accelerations,[8,4]);
key('c');door('east',15);
openField(15);key('e');assert.match($('sheet').innerHTML,/Disconnect drive/);
key('e');assert.match($('sheet').innerHTML,/negligible external torque/);
key('e');
for(const label of ['1.2 to 3 rad/s','12 kg·m²/s'])assert.ok($('sheet').innerHTML.includes(label));
assert.deepEqual(fieldReports.get(15).inertias,[10,4]);
key('c');showNotebook();
assert.match($('sheet').innerHTML,/Irrigation arm.*Wider track.*Survey turntable.*Angular momentum stayed at 12/);
close();
assert.equal(loadProgress().run.fieldReports.length,2);
clearSession();resumeRun();
assert.equal(roomIndex,15);assert.equal(fieldReports.size,2);assert.equal(fieldReports.get(15).angularMomentum,12);
door('north',12);
door('east',13);at(observatory.entrance,'north');interact();advancePassage(time+.3);
assert.equal(roomIndex,observatory.lobby);
assert.match($('sheet').innerHTML,/The telescope turns/);$('dismiss').onclick();
assert.equal(readCheckpoint().area,13);
intro();$('avatars').children[1].click();$('title-choices').children[1].click();$('restart').onclick();
assert.equal(avatar,'Sage');assert.equal(roomIndex,10);assert.equal(music.target,'overworld');
assert.equal(readCheckpoint().area,13);assert.ok(shortcutOpen);
enter(2,'west');assert.ok(currentLab().calibrated);assert.equal(currentLab().values.force,12);enter(10,'south');

const controls=Array.from({length:16},()=>({pressed:false}));
pads.push({mapping:'standard',buttons:controls});
controls[3].pressed=true;updateGamepad(700);assert.match($('sheet').innerHTML,/Paused/);
const original=$('sheet').innerHTML;updateGamepad(900);assert.equal($('sheet').innerHTML,original);
controls[3].pressed=false;controls[1].pressed=true;updateGamepad(1000);assert.equal($('modal').hidden,true);
controls[1].pressed=false;controls[2].pressed=true;updateGamepad(1200);assert.match($('sheet').innerHTML,/Field notebook/);
close();pads.pop();updateGamepad(1210);
function targetReachable(target,radius=24){
 const queue=[[player.x,player.y]], seen=new Set();
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i], key=x+':'+y;
  if(seen.has(key)||x<40||x>678||y<61||y>307||!canStand(x,y))continue;
  seen.add(key);
  if(Math.hypot(x-target.x,y-target.y)<radius)return true;
  for(const [dx,dy] of [[6,0],[-6,0],[0,6],[0,-6]])queue.push([x+dx,y+dy]);
 }
 return false;
}
// Exercise the Observatory through its normal interactions and door gates.
function station(id,activate=interact){
 const point=observatory.controls(roomIndex,observatoryState).find(control=>control.id===id);
 assert.ok(point,'Available control: '+id);
 assert.ok(targetReachable(point,28),'Reachable control: '+id+' in '+roomIndex+' from '+player.x+','+player.y+' stand '+canStand(player.x,player.y));
 at(point,'north');
 assert.equal(activeInteraction()?.control?.id,id);
 renderActions();
 assert.equal($('interact').title,point.label);
 activate();
}
function finishTrial(){
 let result=null;
 for(let i=0;i<160&&!result;i++)result=observatory.updateTrial(roomIndex,.04,observatoryState);
 assert.ok(result);
 finishObservatoryAction(result,result.index);
 return result;
}
function tapChoice(index){$('observatory-choices').children[index].click();}
function tapDirection(key){
 const direction=directionButtons.find(button=>button.dataset.key===key);
 direction.onpointerdown({pointerId:1,preventDefault(){}});
 direction.onpointerup();
}
const observatoryPad=Array.from({length:16},()=>({pressed:false}));
let padTime=2300;
function pressPad(index){
 observatoryPad[index].pressed=true;updateGamepad(padTime+=350);
 observatoryPad[index].pressed=false;updateGamepad(padTime+=10);
}
const study=(index,exercise)=>{
 const {side,room,studyDoor}=observatory.floors[index];
 assert.equal(studyDoor,['west','east','west','east'][index]);
 if(index===1){
  const saved=loadProgress();
  saved.run.room=side;
  saved.run.entry='east';
  localStorage.setItem(progressKey,JSON.stringify(saved));
  savedRun=loadProgress().run;
  clearSession();resumeRun();
  assert.equal(roomIndex,side);
  assert.equal(roomEntry,'west');
  assert.ok(canStand(player.x,player.y));
  door('west',room);
 }
 door(studyDoor,side);
 assert.equal(music.target,'observatory_study');
 assert.deepEqual(observatory.controls(side,observatoryState).map(control=>control.id),['demo']);
 assert.match($('feedback').textContent,/optional question/);
 const crew=observatory.backgroundPeople(side);
 const guide=observatory.people(side,observatoryState)[0];
 assert.equal(crew.length,2);
 for(const {x,y} of crew){
  at({x,y:y+14},'north');
  assert.equal(activeInteraction(),null,'background crew does not intercept interactions');
 }
 assert.ok(targetReachable(guide));
 const ask=()=>{
  at({x:guide.x,y:guide.y+16},'north');
  assert.match(interactionLabel(activeInteraction()),/Discuss the demonstration/);
  key('e');
 };
 const question=observatory.studies[index];
 ask();
 assert.ok($('sheet').innerHTML.includes(question.prediction));
 $('topics').children[question.answer].click();
 assert.match($('sheet').innerHTML,/Test your prediction at the bench/);
 assert.ok(observatoryState.eventProgress.includes('study-prediction-'+index));
 assert.equal(observatory.studyAnswered(side,observatoryState),false);
 $('dismiss').onclick();
 exercise();
 assert.equal($('modal').hidden,true);
 assert.ok(!observatory.done(observatoryState,index));
 assert.equal(observatoryState.observations[index].filter(row=>row.source==='Study').length,2);
 assert.equal(observatoryState.eventProgress.filter(id=>id==='study-reading-'+index).length,1);
 ask();
 assert.ok($('sheet').innerHTML.includes(question.question));
 $('topics').children[question.answer].click();
 assert.match($('sheet').innerHTML,/Exactly/);
 assert.ok(observatory.studyAnswered(side,observatory.restore(loadProgress().run.observatory)));
 $('study-retry').onclick();
 $('topics').children[question.answer].click();
 assert.equal(observatoryState.eventProgress.filter(id=>id==='study-followup-'+index).length,1);
 $('dismiss').onclick();
 door(opposite[studyDoor],room);
 assert.equal(music.target,'observatory_challenge');
};
startCheckpoint('Sage',observatory.lobby);
key('e');key('e');key('e');
assert.ok(observatoryState.intro);
assert.deepEqual({x:player.x,y:player.y,facing:player.facing},observatory.telescopeSpawn);
assert.equal(activeInteraction().control.id,'telescope');
assert.equal(music.target,'observatory_lobby');
const [chargeRoom,circuitRoom,inductionRoom,magneticRoom]=observatory.floors.map(floor=>floor.room);
door('north',chargeRoom);
const nextStairs=()=>links[roomIndex].find(exit=>exit.dir==='north');
const repairedLabels=['SHIELD CLEAR','SUPPLY LIGHTS ON','RECEIVER POWERED','WEST LOCK'];
function checkRepairScene(index){
 const milestone='repair-scene-'+index;
 const committed=loadProgress().run.observatory;
 assert.equal(committed.eventProgress.filter(id=>id===milestone).length,1);
 assert.equal(observatoryRepair.room,roomIndex);
 assert.equal(observatory.dispatch('repair',roomIndex,observatoryState,{repairScene(){assert.fail('A repair scene must play once');}}),false);
 function scenery(state,phase){
  const strokes=[];
  const paint={rect:(...args)=>strokes.push(args),line:(...args)=>strokes.push(args),label:(...args)=>strokes.push(args)};
  observatory.drawRoom(roomIndex,paint,state,[],0,phase);
  return strokes;
 }
 const restored=observatory.restore(committed);
 const start=scenery(restored,0),middle=scenery(restored,.5),end=scenery(restored,1);
 assert.notDeepEqual(start,middle);
 assert.notDeepEqual(middle,end);
 assert.ok(end.some(stroke=>stroke[0]===repairedLabels[index]));
 assert.ok(!scenery(observatory.fresh(),1).some(stroke=>stroke[0]===repairedLabels[index]));
 if(index===0){
  observatoryRepair.start-=1000;
  draw();assert.equal(observatoryRepair,null);
 }else{
  motionPreference.matches=true;
  canvasLabels.length=0;draw();
  assert.ok(canvasLabels.includes(repairedLabels[index]));
  assert.equal(observatoryRepair,null);
  motionPreference.matches=false;
 }
}
function explainRepair(index){
 const floor=observatory.floors[index];
 const person=observatory.people(roomIndex,observatoryState)[0];
 assert.ok(observatory.awaitingReport(observatoryState,index));
 assert.equal(observatory.reportLead(roomIndex,observatoryState),person);
 assert.match($('operator-prompt').textContent,/Return to .* explain your repair/);
 canvasLabels.length=0;draw();assert.ok(canvasLabels.includes('!'));
 assert.ok(!observatory.controls(roomIndex,observatoryState).some(control=>control.id==='practice'));
 assert.match(objective(),new RegExp(observatory.leadName(floor)));
 if(index<3){
  assert.ok(!isOpen(nextStairs()));
  assert.match(observatory.locked(roomIndex,nextStairs().to,observatoryState),/Explain the repair/);
 }
 at({x:person.x,y:person.y+16},'north');
 assert.equal(activeInteraction().point,person);
 assert.match(interactionLabel(activeInteraction()),/Explain the repair/);
 key('e');
 const markup=$('sheet').innerHTML;
 assert.match(markup,/Your repair trials/);
 const evidence=observatory.reportEvidence(observatoryState,index);
 evidence.forEach(row=>{
  assert.equal(row.source,'Repair');
  assert.ok(markup.includes(observatory.escape(row.settings)));
  assert.ok(markup.includes(observatory.escape(row.reading)));
 });
 const expected=[[/short mark/,/collector/],[/^0 A$/,/^2 A$/],[/^[+]1[.]5 V in 0[.]40 s$/,/^-3[.]0 V in 0[.]20 s$/],[/east/,/west/,/west/]];
 expected[index].forEach((reading,i)=>assert.match(evidence[i].reading,reading));
 key('e');assert.ok(speech.complete);
 const correct=index%2;
 $('topics').children[1-correct].click();
 assert.match($('sheet').innerHTML,new RegExp(floor.debrief.hint.split('.')[0].replace(/[?]/g,'')));
 assert.match($('sheet').innerHTML,/report-feedback.*Try again/);
 assert.ok(observatory.awaitingReport(observatoryState,index));
 if(index<3)assert.ok(!isOpen(nextStairs()));
 $('topics').children[correct].click();
 assert.ok(observatory.confirmed(observatoryState,index));
 assert.equal(observatory.reportLead(roomIndex,observatoryState),null);
 assert.ok(loadProgress().run.observatory.reports[index].confirmed);
 assert.match($('sheet').innerHTML,/That matches the readings/);
 const {greeting,topic}=observatory.followUp(roomIndex);
 assert.ok($('sheet').innerHTML.includes(greeting));
 assert.equal($('topics').children[0].textContent,topic[0]);
 $('topics').children[0].click();
 assert.ok($('sheet').innerHTML.includes(topic[1]));
 key('c');
 talkObservatory(person);
 assert.ok($('sheet').innerHTML.includes(greeting));
 assert.equal($('topics').children[0].textContent,topic[0]);
 key('c');
}
assert.ok(!isOpen(nextStairs()));
study(0,()=>{
 station('demo',()=>key('e'));
 assert.match($('sheet').innerHTML,/Conductive paper/);
 const center=studyLabs.paperReading('bars',14,8);
 assert.ok(Math.abs(center.value-5)<.01);
 assert.ok(center.field.ex>0&&Math.abs(center.field.ey)<.01);
 assert.equal(studyLabs.paperReading('bars',4,8).value,10);
 assert.equal(studyLabs.paperReading('bars',24,8).value,0);
 assert.equal(studyLabs.paperReading('bars',4,8).field,null);
 assert.ok(Math.abs(studyLabs.paperReading('dots',14,8).field.magnitude-center.field.magnitude)>1);
 assert.ok(studyLabs.paperReading('dots',8,4).field.ey>0);
 assert.match($('study-live').textContent,/x 14 cm, y 8 cm/);
 key('e');key('ArrowRight');key('ArrowUp');
 assert.match($('study-live').textContent,/x 15 cm, y 9 cm/);
 key('e');key('ArrowDown');key('e');
 assert.match(observatoryState.observations[0][0].settings,/bars/);
 tapChoice(2);tapChoice(1);
 assert.match(observatoryState.observations[0][1].settings,/dots/);
 key('c');
});
assert.equal(observatoryState.charge.west,null);
const guide=observatory.people(roomIndex,observatoryState)[0];
at({x:guide.x,y:guide.y+16},'north');interact();$('hold-plate').onclick();
station('check');assert.match(finishTrial().text,/stayed at the source/);
station('+');assert.equal(observatoryState.carry,'+');
key('c');assert.equal(observatoryState.carry,null);
station('+');station('west');station('check');assert.match(finishTrial().text,/short mark/);
station('−');station('east');station('check');assert.ok(finishTrial().solved);
checkRepairScene(0);
clearSession();resumeRun();
assert.equal(roomIndex,chargeRoom);
assert.ok(observatory.awaitingReport(observatoryState,0));
assert.equal(observatoryRepair,null);
canvasLabels.length=0;draw();assert.ok(canvasLabels.includes('SHIELD CLEAR'));
assert.equal(observatory.dispatch('repair',roomIndex,observatoryState,observatoryEventActions),false);
assert.equal(loadProgress().run.observatory.reports[0].confirmed,false);
door('west',observatory.floors[0].side);
talkObservatory(observatory.people(roomIndex,observatoryState)[0]);
assert.doesNotMatch($('sheet').innerHTML,/Your repair trials/);
close();
door('east',chargeRoom);
explainRepair(0);
assert.ok(isOpen(nextStairs()));
const chargeReport=JSON.stringify(observatoryState.reports[0]);
station('practice',()=>key('e'));
station('east');assert.equal(observatory.trialState(roomIndex,observatoryState).carry,'−');
pads.push({mapping:'standard',buttons:observatoryPad});pressPad(1);
assert.equal(observatory.trialState(roomIndex,observatoryState).carry,null);
station('check',()=>pressPad(0));finishTrial();
assert.match(observatoryState.observations[0].at(-1).reading,/short mark/);
assert.equal(observatoryState.observations[0].at(-1).source,'Practice');
assert.equal(JSON.stringify(observatoryState.reports[0]),chargeReport);
assert.ok(isOpen(nextStairs()));
station('practice');assert.equal(observatoryState.charge.east,'−');
at({x:guide.x,y:guide.y+16},'north');interact();
$('topics').children.find(choice=>choice.textContent==='What did my last reading show?').click();
$('dialogue-next').onclick();
assert.match($('sheet').innerHTML,/practice reading.*short mark/);key('c');
enter(observatory.lobby);
assert.match(objective(),/Circuit Workshop on Floor 2/);
mapView();assert.match($('sheet').innerHTML,/Circuit Workshop.*Next stop/);close();
enter(chargeRoom);
door('north',circuitRoom);
study(1,()=>{
 station('demo',()=>pressPad(0));pressPad(0);
 assert.match($('sheet').innerHTML,/Series circuit with a battery/);
 assert.match($('study-live').textContent,/1 A$/);
 pressPad(13);pressPad(13);pressPad(0);
 pressPad(12);pressPad(12);pressPad(0);
 assert.match($('study-live').textContent,/0 A$/);
 assert.match($('sheet').innerHTML,/Pinned readings.*breaker closed.*1 A.*breaker open.*0 A/);
 pressPad(1);
 station('demo');
 assert.match($('study-live').textContent,/0 A$/);
 assert.equal(observatory.restore(loadProgress().run.observatory).studySettings[1].on,false);
 pressPad(1);
});
pads.pop();updateGamepad(padTime+=100);

station('check');assert.match($('feedback').textContent,/bridge gap is open/);
station('breaker');station('link');station('bridge');assert.match($('feedback').textContent,/open the breaker/i);
station('breaker');station('bridge');station(12);station('resistor');station('breaker');
station('check',()=>{
 assert.equal($('notes').lastChild.textContent.trim(),'Read instrument');
 key('n');
});assert.match($('feedback').textContent,/1 A.*underpowered/);
station('breaker');station(4);station('resistor');station('breaker');
station('check');assert.match($('feedback').textContent,/3 A.*too much/);
station('breaker');station('rack');station(6);station('resistor');station('breaker');station('check');
checkRepairScene(1);explainRepair(1);
assert.ok(isOpen(nextStairs()));
station('practice',()=>$('interact').click());
station('breaker',()=>$('interact').click());
station('check',()=>$('interact').click());
assert.match($('feedback').textContent,/0 A.*breaker is open/);
assert.ok(isOpen(nextStairs()));
door('north',inductionRoom);
assert.equal(observatoryState.circuit.on,true);
study(2,()=>{
 station('demo',()=>$('interact').click());$('interact').click();
 assert.match($('sheet').innerHTML,/[+]1[.]5 V in 0[.]40 s/);
 tapDirection('ArrowDown');tapDirection('ArrowDown');$('interact').click();
 tapDirection('ArrowUp');tapDirection('ArrowUp');$('interact').click();
 assert.match($('sheet').innerHTML,/[+]3[.]0 V in 0[.]20 s/);
 $('card').click();
});
assert.equal(observatory.labStep(roomIndex,observatoryState).control,'west-launch');
station('west-launch');assert.match(finishTrial().reading,/10 turns.*[+]1[.]5 V/);
assert.equal(observatory.labStep(roomIndex,observatoryState).control,'gear');
station('gear');assert.equal(observatory.labStep(roomIndex,observatoryState).control,'east-launch');
station('east-launch');assert.match(finishTrial().reading,/10 turns.*-3.0 V/);
assert.equal(observatory.labStep(roomIndex,observatoryState).control,'bank');
assert.ok(!isOpen(nextStairs()));
station('bank');station('east-reset');station('east-launch');assert.ok(finishTrial().solved);
assert.equal(observatoryState.induction.trials[10],3);
checkRepairScene(2);explainRepair(2);
station('practice');station('west-reset');station('west-launch');station('west-reset');
assert.equal(observatory.updateTrial(roomIndex,5,observatoryState),null);
station('west-launch');finishTrial();
assert.equal(observatoryState.observations[2].at(-1).source,'Practice');
door('north',magneticRoom);
study(3,()=>{
 station('demo');assert.match($('sheet').innerHTML,/<summary>Research notes/);tapChoice(0);
 assert.match($('sheet').innerHTML,/north tip points east/);
 tapChoice(1);assert.match($('study-live').textContent,/north tip points west/);tapChoice(0);
 assert.match($('sheet').innerHTML,/north tip points west/);
 tapChoice(3);
});
assert.equal(observatory.labStep(roomIndex,observatoryState).control,'compass');
station('compass');assert.equal(observatory.labStep(roomIndex,observatoryState).control,'reference');
station('reference');assert.equal(observatory.labStep(roomIndex,observatoryState).control,'polarity');
station('polarity');assert.equal(observatory.labStep(roomIndex,observatoryState).control,'reference');
station('reference');assert.equal(observatory.labStep(roomIndex,observatoryState).control,'dock');
station('polarity');assert.equal(observatory.labStep(roomIndex,observatoryState).control,'polarity');
assert.equal(observatoryState.coil.seen,3);
station('dock');station('align');assert.ok(!observatory.done(observatoryState,3));
station('polarity');station('dock');station('align');
checkRepairScene(3);
assert.ok(observatory.awaitingReport(observatoryState,3));assert.ok(!observatory.ready(observatoryState));
for(const room of [inductionRoom,circuitRoom,chargeRoom,observatory.lobby])door('south',room);
station('telescope');
assert.match($('sheet').innerHTML,/3 of 4 repairs confirmed.*Sana/);
assert.ok(!$('observatory-choices').children.some(choice=>choice.textContent==='Acquire the beacon'));
key('c');
for(const room of [chargeRoom,circuitRoom,inductionRoom,magneticRoom])door('north',room);
explainRepair(3);
assert.ok(observatory.ready(observatoryState));
station('practice');station('polarity');station('dock');station('align');
assert.match($('feedback').textContent,/westward reading/);
assert.equal(observatoryState.coil.polarity,-1);
for(const room of [inductionRoom,circuitRoom,chargeRoom,observatory.lobby])door('south',room);
canvasLabels.length=0;draw();
for(const effect of ['Dust curtain clears','Supply lights steady','Receiver powered','Mount tracks'])assert.ok(canvasLabels.includes(effect));
key('n');assert.match($('sheet').innerHTML,/Station.*Settings.*Reading/);assert.match($('sheet').innerHTML,/Study.*Repair.*Practice|Practice.*Repair.*Study/);
key('c');
station('telescope');tapChoice(0);tapChoice(0);
assert.match($('sheet').innerHTML,/18%.*unmeasured sector/);
assert.equal(observatoryState.aligned,false);
assert.ok(!isOpen(links[roomIndex].find(exit=>exit.dir==='east')));
key('ArrowDown');key('e');
assert.equal(observatoryState.sector,1);
assert.match($('sheet').innerHTML,/68% signal/);
tapChoice(0);assert.match($('sheet').innerHTML,/64%.*unmeasured band/);
assert.equal(observatoryState.aligned,false);
key('c');clearSession();resumeRun();
assert.equal(observatoryState.sector,1);
assert.deepEqual([...observatoryState.signals.sectors],[0,1]);
assert.deepEqual([...observatoryState.signals.bands],[0]);
assert.equal(observatoryState.observations[0].at(-1).source,'Practice');
station('telescope');tapChoice(0);
assert.match($('sheet').innerHTML,/Fine tune the receiver/);
pads.push({mapping:'standard',buttons:observatoryPad});
pressPad(13);pressPad(0);
assert.match($('sheet').innerHTML,/telescope locks on/);
pressPad(0);pads.pop();updateGamepad(padTime+=100);
door('east',observatory.secret);
assert.equal(music.target,'observatory_signal');
const signalRequest=music.request;
station('signal');
assert.match($('sheet').innerHTML,/vela.webp/);
pads.push({mapping:'standard',buttons:observatoryPad});
pressPad(2);
assert.equal($('speech-hint').textContent,'A to reveal the full line');
pressPad(0);assert.ok(speech.complete);assert.equal(observatoryState.contact,false);
pressPad(0);assert.ok(observatoryState.contact);
$('observatory-choices').children.at(-1).click();
pads.pop();updateGamepad(padTime+=100);
assert.equal(music.target,'observatory_signal');assert.equal(music.request,signalRequest);
door('north',observatory.offworld);
assert.ok(loadProgress().run.observatory.arrived);
station('archive');
assert.match($('sheet').innerHTML,/486 nm and 656 nm/);
$('curiosity-actions').children[0].click();assert.ok(!curiosities.has('archive-spectrum'));
$('curiosity-actions').children[1].click();assert.ok(curiosities.has('archive-spectrum'));
$('dismiss').onclick();

talkObservatory(observatory.people(roomIndex,observatoryState)[0]);
assert.match($('sheet').innerHTML,/vela-happy.webp/);
assert.match(objective(),/Share your field report/);
$('file-report').onclick();
assert.match(objective(),/Expedition complete/);
$('view-field-report').onclick();
assert.match($('sheet').innerHTML,/Measurements from your expedition.*2 A at 12 V.*6[.]0 V/);
close();
questExtras.show('crate');$('curiosity-actions').children[0].click();assert.ok(curiosities.has('crate'));close();
clearSession();resumeRun();assert.ok(observatory.ready(observatoryState));
assert.ok(observatoryState.archived);
assert.ok(curiosities.has('crate'));
assert.equal(roomIndex,observatory.offworld);
talkObservatory(observatory.people(roomIndex,observatoryState)[0]);
$('return-observatory').onclick();
advancePassage(time+.3);assert.equal(roomIndex,observatory.secret);
door('west',observatory.lobby);
station('telescope');
$('observatory-choices').children.find(choice=>choice.textContent==='Inspect the hidden spectrum').click();
$('curiosity-actions').children[0].click();assert.ok(!curiosities.has('spectrum'));
$('curiosity-actions').children[1].click();assert.ok(curiosities.has('spectrum'));
$('dismiss').onclick();close();
station('telescope');$('observatory-choices').children.find(choice=>choice.textContent==='Restart Observatory labs').click();
$('observatory-choices').children[0].click();
assert.equal(roomIndex,observatory.lobby);
assert.ok(!observatory.ready(observatoryState)&&!observatoryState.aligned);
assert.equal(reported.has(6),true);
assert.equal(readCheckpoint().area,13);
assert.equal(loadProgress().run.observatory.circuit.linked,false);
const migrated=observatory.restore({reports:{0:{complete:true},1:{complete:true},3:{complete:true}}});
assert.ok(migrated.charge.single&&migrated.circuit.linked&&migrated.coil.compass);
const legacyNacre=observatory.restore({reports:{0:{prediction:0},1:{prediction:0},2:{complete:true},3:{complete:true}},aligned:true,contact:true,arrived:true});
assert.ok(observatory.ready(legacyNacre)&&legacyNacre.aligned&&legacyNacre.contact&&legacyNacre.arrived);
assert.equal(legacyNacre.observations.flat().length,0);
assert.equal(legacyNacre.eventProgress.length,0);
const currentObservatory=observatoryState;
observatoryState=observatory.restore({reports:{1:{complete:true,confirmed:false,reading:'2 A at 12 V'}}});
assert.ok(observatory.awaitingReport(observatoryState,1));
const legacyFloor=observatory.floors[1];
const legacyLead=observatory.reportLead(legacyFloor.room,observatoryState);
explainObservatoryRepair(legacyLead,legacyFloor);
assert.match($('sheet').innerHTML,/saved repair has no trial comparison.*2 A at 12 V/);
$('topics').children[1].click();
assert.ok(observatory.confirmed(observatoryState,1));
observatoryState=currentObservatory;
assert.equal(observatory.reaction(chargeRoom,legacyNacre),'');
close();
for(const id of [0,1,2,3,4,5,6,9]){
 solved.delete(id);reported.delete(id);labSessions.delete(id);
 if(id===9)gardenBridge=false;
 const plan=plans[id];
 for(const exit of links[id].filter(exit=>exit.to!==plan.room)){
  enter(id,exit.dir);
  assert.ok(!isOpen(exit),rooms[id].name+' closes its '+exit.dir+' exit');
  assert.ok(targetReachable(threshold[plan.dir]),rooms[id].name+' research door from '+exit.dir);
 }
 const researchExit=links[id].find(exit=>exit.to===plan.room);
 assert.ok(isOpen(researchExit),rooms[id].name+' leaves research access open');
 enter(id,plan.dir);
 consulted.delete(id);renderActions();
 assert.match($('operator-prompt').textContent,/Talk to .* beside the controls/);
 assert.ok(targetReachable(operatorPoint()));
 assert.equal(students[id].length,2);
 for(const student of students[id]){
  assert.ok(targetReachable(student),student.name+' is reachable');
  assert.ok(!canStand(student.x,student.y),student.name+' blocks walking through their sprite');
  at({x:student.x,y:student.y-16},'south');
  assert.equal(activeInteraction()?.kind,'student');
  key('e');const first=student.lastLine;
  assert.ok(studentQuestions[id].includes(first));
  assert.equal(menuButtons().length,1);
  $('dismiss').onclick();
  key('e');assert.notEqual(student.lastLine,first);
  assert.ok(!consulted.has(id));
  assert.ok(!$('operator-prompt').hidden);
  $('dismiss').onclick();
 }
 enter(id,plan.dir);
 for(const {point,label} of scienceLabs.targets(currentLab()))assert.ok(targetReachable(point),label);
 const {x,y}=scienceLabs.resetConsole(id);
 assert.ok(!canStand(x,y),rooms[id].name+' blocks the visible reset console');
 canvasLabels.length=0;draw();assert.ok(canvasLabels.includes('Reset'),rooms[id].name+' draws the active reset console');
}
enter(2);currentLab().carry=4;
assert.ok(targetReachable({x:535,y:248}),'pressure plate is reachable while carrying');
// A standard pad can hold a scientific dial open, adjust it, and run a single test.
enter(4);consulted.add(4);at({x:323,y:223});
pads.push({mapping:'standard',buttons:controls});
controls[2].pressed=false;updateGamepad(padTime+50);
controls[0].pressed=true;updateGamepad(padTime+100);assert.equal(currentLab().adjust,'torque');
updateGamepad(padTime+120);assert.equal(busy,false);
controls[0].pressed=false;controls[15].pressed=true;updateGamepad(padTime+150);
assert.equal(currentLab().values.torque,1.1);
const bridgeLabels=[];
scienceLabs.draw(currentLab(),time,{rect(){},line(){},label:(label,x,y)=>bridgeLabels.push({label,x,y})});
assert.ok(bridgeLabels.some(({label,y})=>label==='1.1 m'&&y>75&&y<145));
assert.doesNotMatch($('feedback').textContent,/1.1 m/);
controls[15].pressed=false;controls[0].pressed=true;updateGamepad(padTime+210);assert.equal(busy,true);
flush();close();cancelLabControl();
const intactSave=loadProgress();
localStorage.removeItem(progressKey);localStorage.setItem(checkpointKey,JSON.stringify({area:13,survey:true}));
assert.equal(readCheckpoint().area,13);assert.equal(readCheckpoint().survey,true);
checkpoint=readCheckpoint();savedRun=intactSave.run;writeProgress();
intro();confirmResetProgress();$('dismiss').onclick();
assert.equal(readCheckpoint().area,13);
confirmResetProgress();$('erase-progress').onclick();
assert.equal(readCheckpoint(),null);assert.equal(loadProgress().run,null);
assert.equal(localStorage.getItem(checkpointKey),undefined);
$('avatars').children[0].click();$('comic-skip').onclick();assert.equal(roomIndex,0);
for(let index=0;index<rooms.length;index++){
 for(const {dir} of links[index]){enter(index,dir);assert.ok(canStand(player.x,player.y),rooms[index].name+' '+dir);}
 draw();
}
close();
enter(14);
const cow=questExtras.point(roomIndex);
assert.ok(targetReachable(cow,25));at(cow);interact();assert.match($('sheet').innerHTML,/Spherical Cow/);close();
enter(plans[1].room);
assert.ok(targetReachable(questExtras.point(roomIndex),25));at(questExtras.point(roomIndex));interact();
$('curiosity-actions').children[0].click();assert.match($('sheet').innerHTML,/constant speed/);close();
enter(observatory.floors[3].side);
assert.ok(targetReachable(questExtras.point(roomIndex),25));at(questExtras.point(roomIndex));interact();
$('curiosity-actions').children[0].click();assert.match($('sheet').innerHTML,/field point west/);close();
assert.deepEqual([...curiosities].slice(-3),['cow','sled','glove']);

solved.delete(2);labSessions.delete(2);enter(2);consulted.add(2);recovered.add(2);
const block=scienceLabs.targets(currentLab()).find(control=>control.id==='mass-4');
at(block.point);interact();
const scale=scienceLabs.targets(currentLab()).find(control=>control.id==='plate');
at(scale.point);interact();
currentLab().adjust='force';choosing=true;
for(let step=0;step<11;step++)selectDirection('ArrowRight');
assert.equal(currentLab().values.force,11.5);
runLabDial();flush();
clearSession();resumeRun();
assert.equal(roomIndex,2);
assert.equal(currentLab().values.force,11.5);
assert.equal(currentLab().calibrated,true);
assert.match($('feedback').textContent,/Last result.*Net force/);

enter(6);solved.delete(6);labSessions.delete(6);
const brake=currentLab();
brake.cartIndex=1;testBrake(brake,-1);flush();
assert.equal(brake.brakes,1);
clearSession();resumeRun();
assert.equal(currentLab().brakes,1);assert.equal(currentLab().heading,-1);assert.equal(currentLab().cartIndex,1);

enter(10);
const behindTree={x:77,y:97}, inFrontOfTree={x:77,y:141};
assert.ok(canStand(behindTree.x,behindTree.y)&&canStand(inFrontOfTree.x,inFrontOfTree.y));
assert.ok(hasPortrait('art/foreground.png'));
canvasImages.length=0;
drawFigures([{point:inFrontOfTree,look:avatars.Sage,facing:'south'},{point:behindTree,look:avatars.Rowan,facing:'south'}]);
assert.equal(canvasImages.join(','),'art/rowan-directions.png,art/foreground.png,art/sage-directions.png');

const inductionLabId=observatory.floors[2].room;
function runInduction(state,bank,gear,end){
 state.induction.turns=bank;
 state.induction.gear=gear;
 state.induction.end=end;
 assert.match(observatory.useControl(inductionLabId,end+'-launch',state).text,/Carriage running/);
 let trial;
 for(let i=0;i<160&&!trial;i++)trial=observatory.updateTrial(inductionLabId,.04,state);
 assert.ok(trial);
 return trial;
}
for(const start of ['west','east']){
 const next=start==='west'?'east':'west';
 for(const firstGear of ['slow','fast']){
  const first=observatory.fresh();
  const completed=runInduction(first,20,firstGear,start);
  assert.equal(completed.solved,false);
  observatory.record(first,2,'Repair',completed.observation);
  const resumed=observatory.restore(first);
  const second=runInduction(resumed,20,firstGear==='fast'?'slow':'fast',next);
  assert.equal(second.solved,true);
  assert.match(second.reading,/20 turns · [+-]6[.]0 V/);
  observatory.record(resumed,2,'Repair',second.observation);
  const [slow,fast]=observatory.reportEvidence(resumed,2);
  assert.match(slow.reading,/^[+-]3[.]0 V in 0[.]40 s$/);
  assert.match(fast.reading,/^[+-]6[.]0 V in 0[.]20 s$/);
 }
}
const mixedBanks=observatory.fresh();
runInduction(mixedBanks,20,'fast','west');
assert.equal(runInduction(mixedBanks,10,'slow','east').solved,false);
assert.equal(runInduction(mixedBanks,20,'slow','west').solved,true);

const notebooks=observatory.fresh();
observatory.record(notebooks,0,'Repair',{settings:'One cell',reading:'East'});
for(let i=0;i<61;i++)observatory.record(notebooks,0,'Study',{settings:'Study '+i,reading:'Trial'});
observatory.record(notebooks,2,'Practice',{settings:'Fast',reading:'6 V'});
const restoredNotebook=observatory.restore(notebooks);
assert.equal(restoredNotebook.observations[0].length,61);
assert.equal(restoredNotebook.observations[0][0].source,'Repair');
assert.match(observatory.observationsHTML(restoredNotebook,2),/^<h3>Induction Lab/);
const oldStudy=observatory.restore({eventProgress:['study-answer-0']});
assert.equal(observatory.studyAnswered(observatory.floors[0].side,oldStudy),false);
assert.ok(oldStudy.eventProgress.includes('study-prediction-0'));

enter(observatory.lobby);
at(observatory.telescopeSpawn,'north');
close();keys.clear();padKeys.clear();
assert.equal(gameMode(),"exploration");pads.length=0;updateGamepad(padTime+=100);
const stickPad={mapping:'standard',buttons:observatoryPad,axes:[.12,0]};
pads.push(stickPad);updateGamepad(padTime+=100);
assert.equal(movementDirection().x,0);
stickPad.axes=[.65,0];updateGamepad(padTime+=100);
assert.ok(movementDirection().x>0&&movementDirection().x<1);
assert.match($('active-action').textContent,/^A · /);
tapDirection('ArrowLeft');
assert.match($('active-action').textContent,/^Use · /);
stickPad.axes=[0,0];updateGamepad(padTime+=100);
key('ArrowRight');key('ArrowRight',false,'keyup');
assert.match($('active-action').textContent,/^E · /);
stickPad.axes=[1,0];updateGamepad(padTime+=100);
pads.pop();updateGamepad(padTime+=100);
assert.equal(movementDirection().x,0);
`,scope);
console.log('Passed the castle playthrough, live force labels, momentum motion, bridge discovery, pressure-plate cue triggers, scenery draw order, routes, research, saves, dialogue, controller input, and the Observatory comparisons, retries, one-time repair scenery, follow-up clues, studies, practice, beacon, legacy saves, four music themes, and restart.');
