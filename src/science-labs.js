'use strict';

const scienceLabs = (() => {
 const gravity=9.8;
 const launchSpeed=4;
 const masses=[2,4,6,8];
 const surfaces=[
  {name:'Smooth',coefficient:.16,color:'#6595a0'},
  {name:'Stone',coefficient:.27,color:'#819584'},
  {name:'Rough',coefficient:.48,color:'#9c785e'}
 ];
 const sledTrack={start:189,pixelsPerMetre:62};
 const frictionZone=[2.6,3.6], momentumZone=[1.7,2.3];
 const momentumTrack={start:170,contact:355,gap:35,pixelsPerMetre:62};
 const inRange=(value,[low,high])=>value>=low&&value<=high;
 const number=value=>Number(value.toFixed(2));
 const rack=masses.map((mass,index)=>({mass,x:165+index*65,y:229}));
 const plate={x:535,y:248};
 const resetConsole=room=>room===9
  ?{x:348,y:296,width:66,height:24}
  :{x:360,y:room===6?296:292,width:76,height:20};
 const equipment={
  liftRack:[{x:175,y:232,weight:400},{x:243,y:232,weight:680},{x:209,y:232,weight:520}],
  liftHook:{x:500,y:241},liftLever:{x:322,y:224},
  pistons:[{x:238,y:224,area:200},{x:475,y:224,area:80}],pump:{x:353,y:224},
  carts:[{x:222,y:224,mass:2,speed:3},{x:300,y:224,mass:5,speed:2}],
  launchers:[{x:139,y:269,side:1},{x:575,y:269,side:-1}],
  crank:{x:436,y:211}
 };
 const storedWeights={0:equipment.liftRack,2:rack};
 const title={0:'Counterweight lift',5:'Hydraulic gate',6:'Flywheel brake',9:'Drawbridge winch',1:'Friction lanes',2:'Force calibration',3:'Momentum transfer',4:'Bridge balance'};
 const goals={
  0:'Carry a test counterweight to the hook, then pull the lift lever.',
  5:'Route the pump to one piston, then set and test the pressure at the pump dial.',
  6:'Read the Guardian’s momentum, couple a matching cart, and launch opposite its motion when the gate reads LAUNCH.',
  9:'Slide the grip along the crank, then turn it to test the setting.',
  1:'Launch the same sled on each surface. Find the lane that stops it in the gold zone.',
  2:'Carry a test mass to the gold scale. Use the accelerator’s readings to calibrate it.',
  3:'Set the incoming cart’s speed, then launch it. Stop the coupled carts in the gold zone.',
  4:'Move the counterweight along the beam. Hold it near balance to lock the bridge.'
 };
 const hints={
  lift:['The heavier side of the pulley starts moving down. The other side rises.','Choose a counterweight heavier than the occupied 520 N platform.','Compare each rack weight with 520 N. Choose one that will pull downward harder than the platform.'],
  hydraulic:['At the same pressure, more piston area produces more force.','The larger piston gains 20 N for every kPa of pressure. The gate needs 600 N.','Route to the 200 cm² piston and set the pump to at least 30 kPa.'],
  brake:['Read the Guardian’s signed momentum before launching.','Choose a cart with equal momentum magnitude and launch opposite the Guardian’s motion.','The 5 kg cart carries 10 kg·m/s. The 2 kg cart carries 6 kg·m/s. Match the current phase.'],
  crank:['Moving the grip farther out increases torque at the same push.','Multiply 50 N by the grip distance in metres. You need at least 18 N·m.','A grip distance of 40 cm produces 20 N·m and lowers the bridge.'],
  friction:['A rougher surface brings the sled to a stop sooner.','If it went too far, try a lane with more friction. If it stopped short, try less.','Compare the rough and smooth runs. The middle-friction lane stops between them.'],
  mass:['At the same force, a lighter mass accelerates faster.','Divide 12 N by the target acceleration of 3 m/s².','Rearrange F = ma for the unknown mass. Use the same force and target acceleration when comparing the blocks.'],
  force:['Compare the arrows. The stronger side determines the direction of the net force.','Adjust the left pull toward the fixed 12 N pull on the right.','Set the left pull to 12 N, then hold the setting with Interact.'],
  momentum:['Increasing the launch speed makes the coupled carts roll farther.','The carts stick, so the combined speed is two-thirds of the launch speed.','A 3 m/s launch gives a 2 m/s coupled speed. The brake then stops the carts in 2 m.'],
  torque:['A weight farther from the pivot has more turning effect.','Compare 4 kg × 1 m with 2 kg × the distance you set.','Place the 2 kg mass 2 m from the center.']
 };
 const controls={
  hydraulic:{label:'Pump pressure',units:'kPa',minimum:0,maximum:40,step:5,start:15},
  crank:{label:'Crank grip',units:'cm from axle',minimum:15,maximum:45,step:5,start:15},
  force:{label:'Left pull',units:'N',minimum:0,maximum:20,step:.5,start:6},
  momentum:{label:'Launch speed',units:'m/s',minimum:1,maximum:4,step:.5,start:1.5},
  torque:{label:'Counterweight',units:'m from pivot',minimum:.5,maximum:3.5,step:.1,start:1}
 };
 function make(room,completed=false,now=0){
  const lab= {room,carry:null,load:null,calibrated:false,adjust:null,trial:null,attempts:{},piston:null,cartIndex:null,brakes:0,heading:1,
   values:Object.fromEntries(Object.entries(controls).map(([name,config])=>[name,config.start]))};
  if(completed){
   lab.load=4;lab.calibrated=true;
   Object.assign(lab.values,{force:12,momentum:3,torque:2});
   if(room===0)lab.load=680;
   if(room===5){lab.piston=0;lab.values.hydraulic=40;}
   if(room===6){lab.cartIndex=1;lab.brakes=2;}
   if(room===9)lab.values.crank=40;
   if(room===1)lab.trial={...friction(1),index:1,key:'friction',started:now-8};
   if(room===3)lab.trial={...collision(3),key:'momentum',started:now-8};
  }
  return lab;
 }
 function snapshot(lab){
  const {carry,load,calibrated,values,piston,cartIndex,brakes,heading,attempts,lastTrial}=lab;
  return {carry,load,calibrated,values:{...values},piston,cartIndex,brakes,heading,attempts:{...attempts},lastTrial};
 }
 function restore(room,data,now){
  const lab=make(room);
  const weights=storedWeights[room]?.map(item=>item.weight??item.mass)||[];
  if(weights.includes(data.load))lab.load=data.load;
  if(weights.includes(data.carry)&&data.carry!==lab.load)lab.carry=data.carry;
  lab.calibrated=room===2&&lab.load===4&&data.calibrated===true;
  if(room===5&&[0,1].includes(data.piston))lab.piston=data.piston;
  if(room===6){
   if([0,1].includes(data.cartIndex))lab.cartIndex=data.cartIndex;
   if(data.brakes===1){lab.brakes=1;lab.heading=-1;}
  }
  for(const [key,{minimum,maximum,step}] of Object.entries(controls)){
   const value=data.values?.[key];
   if(Number.isFinite(value)&&value>=minimum&&value<=maximum)lab.values[key]=number(minimum+Math.round((value-minimum)/step)*step);
  }
  for(const key of Object.keys(hints)){
   if(Number.isInteger(data.attempts?.[key])&&data.attempts[key]>0)lab.attempts[key]=Math.min(1000,data.attempts[key]);
  }
  const trial=data.lastTrial;
  if(room===1&&Number.isInteger(trial?.index)&&surfaces[trial.index]){
   lab.lastTrial={index:trial.index};
   lab.trial={...friction(trial.index),index:trial.index,key:'friction',started:now-10};
  }
  if(room===3&&Number.isFinite(trial?.speed)&&trial.speed>=1&&trial.speed<=4){
   lab.lastTrial={speed:trial.speed};
   lab.trial={...collision(trial.speed),key:'momentum',started:now-10};
  }
  return lab;
 }
 function pistonForce(kPa,index){return kPa*equipment.pistons[index].area/10;}
 function liftDifference(weight){return weight-520;}
 function guardianMomentum(heading,brakes){return heading*(brakes===0?10:6);}
 function guardianCycle(now,brakes,relaxed=false){
  const period=brakes===0?2.4:1.9;
  const position=(now%period+period)%period/period;
  return {position,open:relaxed||position>=.20&&position<=.76};
 }
 function brakeMomenta(cartIndex,side,heading,brakes=0){
  const {mass,speed}=equipment.carts[cartIndex];
  const cart=mass*speed*side, guardian=guardianMomentum(heading,brakes);
  return {cart,guardian,total:cart+guardian};
 }
 function crankTorque(cm){return 50*cm/100;}
 function acceleration(mass){return 12/mass;}
 function stoppingDistance(speed,deceleration){return speed**2/(2*deceleration);}
 function friction(index){
  const surface=surfaces[index], deceleration=surface.coefficient*gravity;
  const distance=stoppingDistance(launchSpeed,deceleration);
  return {win:inRange(distance,frictionZone),distance,deceleration,speed:launchSpeed};
 }
 function collision(speed){
  const {start,contact,gap,pixelsPerMetre}=momentumTrack;
  const approachTime=(contact-gap-start)/(speed*pixelsPerMetre);
  const momentum=4*speed, coupledSpeed=momentum/6, distance=stoppingDistance(coupledSpeed,1);
  return {speed,approachTime,momentum,coupledSpeed,distance,win:inRange(distance,momentumZone)};
 }
 function force(value){return 12-value;}
 function netForceLabel(net){return number(Math.abs(net))+' N'+(net>0?' right':net<0?' left':' (balanced)');}
 function torque(value){return (2*value-4)*gravity;}
 function result(lab,key,message,win){
  if(win)return message;
  const count=(lab.attempts[key]||0)+1;
  lab.attempts[key]=count;
  return message+' '+hints[key][Math.min(count-1,hints[key].length-1)];
 }
 const instruments={
  'Spring scale':'Checks gravitational loads and compares their weights in newtons.',
  'Motion tracker':'Records launch speeds, stopping distances, and direction of travel.',
  'Lever-arm gauge':'Measures the distance between the pivot and the point where a force acts.',
  'Pressure gauge':'Reads the pump pressure and identifies the connected piston.'
 };
 const instrumentByRoom={
  0:'Spring scale',1:'Motion tracker',2:'Spring scale',3:'Motion tracker',
  4:'Lever-arm gauge',5:'Pressure gauge',6:'Motion tracker',9:'Lever-arm gauge'
 };
 const requiredReadings=[0,1,4];
 function measurements(lab,control){
  const values=lab.values;
  switch(lab.room){
   case 0:{
    const weight=control?.id.startsWith('weight-')?control.detail:lab.carry||lab.load;
    return ['Occupied platform · 520 N',weight?'Selected counterweight · '+weight+' N':'The hook is empty. Bring a marked counterweight to it.'];
   }
   case 1:return ['Launch speed · '+launchSpeed+' m/s on every lane','Gold band · '+frictionZone.join('–')+' m',
    ...(lab.trial?['Last run on '+surfaces[lab.trial.index].name.toLowerCase()+' · '+number(lab.trial.distance)+' m']:[])];
   case 2:{
    const mass=control?.id.startsWith('mass-')?control.detail:lab.carry||lab.load;
    return ['Reference pull · 12 N right',mass?'Test mass weight · '+number(mass*gravity)+' N ('+mass+' kg)':'Pick up a marked mass to compare its weight with the others.'];
   }
   case 3:return ['Incoming cart setting · '+values.momentum+' m/s','Gold band · '+momentumZone.join('–')+' m',
    ...(lab.trial?['Last run after contact · '+number(lab.trial.coupledSpeed)+' m/s and '+number(lab.trial.distance)+' m']:[])];
   case 4:return ['Fixed load · 1 m left of the pivot','Movable load · '+values.torque.toFixed(1)+' m right of the pivot'];
   case 5:return ['Pump setting · '+values.hydraulic+' kPa',lab.piston===null?'Connect one of the piston ports to check its area.':'Connected piston · '+equipment.pistons[lab.piston].area+' cm²'];
   case 6:return [lab.brakes===2?'Guardian stopped':'Phase '+(lab.brakes+1)+' · Guardian momentum '+guardianMomentum(lab.heading,lab.brakes)+' kg·m/s (right is positive)',
    ...(lab.cartIndex===null?['Couple a cart to check its launch speed.']:['Coupled cart launch speed · '+equipment.carts[lab.cartIndex].speed+' m/s'])];
   case 9:return ['Grip distance · '+values.crank+' cm from the axle'];
   default:return [];
  }
 }
 function goal(lab){
  if(lab.room===2&&lab.calibrated)return 'The test mass is calibrated. Balance the 12 N rightward pull at the force dial.';
  if(lab.room===6&&lab.brakes===1)return 'Phase 2 · The Guardian is moving left at 6 kg·m/s. Match the new momentum and wait for LAUNCH.';
  return goals[lab.room];
 }
 function rackWeights(lab,complete=false){
  if(complete&&lab.room===0)return [];
  return (storedWeights[lab.room]||[]).filter(item=>{
   const value=item.weight??item.mass;
   return value!==lab.carry&&value!==lab.load;
  });
 }
 function targets(lab){
  const add=(id,point,label,detail)=>({id,point,label,detail});
  const list=[add('reset',resetConsole(lab.room),'Reset experiment')];
  if(lab.room===0){
   list.push(add('lift-hook',equipment.liftHook,lab.carry?'Hang '+lab.carry+' N counterweight':lab.load?'Unhook '+lab.load+' N counterweight':'Inspect lift hook'));
   list.push(add('lift-lever',equipment.liftLever,'Pull lift lever'));
   return list.concat(rackWeights(lab)
    .map(item=>add('weight-'+item.weight,item,'Lift '+item.weight+' N counterweight',item.weight)));
  }
  if(lab.room===5){
   list.push(add('hydraulic',equipment.pump,'Adjust pump pressure'));
   return list.concat(equipment.pistons.map((piston,index)=>add('piston-'+index,piston,'Route to '+piston.area+' cm² piston',index)));
  }
  if(lab.room===6){
   list.push(...equipment.carts.map((cart,index)=>add('cart-'+index,cart,'Couple '+cart.mass+' kg cart',index)));
   return list.concat(equipment.launchers.map(launcher=>add('launcher-'+launcher.side,launcher,launcher.side===1?'Launch from left':'Launch from right',launcher.side)));
  }
  if(lab.room===9)return list.concat(add('crank',equipment.crank,'Move crank grip'));
  if(lab.room===1)return list.concat(surfaces.map((surface,i)=>add('lane-'+i,{x:165+i*150,y:223},'Launch on '+surface.name.toLowerCase(),i)));
  if(lab.room===3)return list.concat(add('momentum',{x:323,y:223},'Adjust launch speed'));
  if(lab.room===4)return list.concat(add('torque',{x:323,y:223},'Move counterweight'));
  list.push(add('force',{x:537,y:223},'Adjust the left pull'));
  if(lab.calibrated)return list;
  list.push(add('plate',plate,lab.carry?'Place '+lab.carry+' kg on plate':lab.load?'Lift the test mass':'Inspect pressure plate'));
  return list.concat(rackWeights(lab)
   .map(block=>add('mass-'+block.mass,block,'Lift '+block.mass+' kg',block.mass)));
 }
 function adjust(lab,delta){
  const key=lab.adjust, config=controls[key];
  lab.values[key]=number(Math.max(config.minimum,Math.min(config.maximum,lab.values[key]+delta*config.step)));
 }
 function readout(lab){
  const key=lab.adjust, config=controls[key], value=lab.values[key];
  return config.label+' · '+value+' '+config.units;
 }
 function overlayName(id){
  return ({0:'Force arrows',1:'Motion dots',3:'Motion dots',4:'Lever arm',5:'Force arrows',9:'Lever arm'})[id];
 }
 function drawOverlay(lab,now,{rect,line,label}){
  const room=lab.room, gold='#ffdf93', teal='#91f3e2', shade='#182334';
  const name=overlayName(room);
  if(!name)return;
  const caption=(text,x,y)=>{
   rect(x-text.length*3.6-6,y-13,text.length*7.2+12,17,shade);
   label(text,x,y,gold,12);
  };
  const vertical=(x,y,value,color)=>{
   const tip=y-Math.sign(value)*Math.min(62,Math.abs(value)*.074);
   if(Math.abs(tip-y)<3)return;
   const tail=tip+Math.sign(value)*7;
   line(x,y,x,tip,color,3);
   line(x,tip,x-5,tail,color,2);
   line(x,tip,x+5,tail,color,2);
  };
  if(room===0&&lab.load){
   vertical(301,154,-520,gold);
   vertical(529,118,-lab.load,teal);
   caption('Platform · 520 N',245,69);
   caption('Counterweight · '+lab.load+' N',506,69);
   return;
  }else if(room===5&&lab.piston!==null){
   const force=pistonForce(lab.values.hydraulic,lab.piston);
   const x=equipment.pistons[lab.piston].x;
   vertical(x-24,146,force,teal);
   vertical(x+24,146,-600,gold);
   caption(force+' N up · 600 N required',360,69);
   return;
  }else if(room===1||room===3){
   const run=lab.trial;
   if(run){
    const elapsed=Math.max(0,now-run.started);
    const duration=room===1?run.speed/run.deceleration:run.approachTime+run.coupledSpeed;
    for(let t=0;t<=Math.min(duration,elapsed);t+=.2){
     let x,y;
     if(room===1){
      x=sledTrack.start+(run.speed*t-.5*run.deceleration*t*t)*sledTrack.pixelsPerMetre;
      y=111+run.index*40;
     }else{
      const {start,contact,gap,pixelsPerMetre}=momentumTrack;
      const after=t-run.approachTime;
      x=after<0?start+run.speed*t*pixelsPerMetre:contact-gap+(run.coupledSpeed*after-.5*after*after)*pixelsPerMetre;
      y=158;
     }
     rect(x-2,y-2,5,5,shade);rect(x-1,y-1,3,3,teal);
    }
   }
   caption(run?'Motion dots · every 0.2 s':'Motion dots · launch to measure',359,69);
   return;
  }else if(room===4||room===9){
   const x=room===4?300:436, y=room===4?108:188;
   const distance=room===4?lab.values.torque:lab.values.crank;
   const end=room===4?x+63*distance:443+distance/2;
   line(x,y,end,y,teal,2);
   for(const mark of [x,end])line(mark,y-4,mark,y+4,teal,2);
   caption((room===4?distance.toFixed(1)+' m':distance+' cm')+' from pivot',360,69);
   return;
  }
  caption(room===0&&!lab.load?'Hang a counterweight':room===5&&lab.piston===null?'Connect a piston':name,359,69);
 }

 // Shared machine fittings for the Castle rigs and Observatory workbenches.
 function fittings({rect,line,label,shadow}){
  const ink='#202735', metal='#637a80', brass='#d1a66f';
  function foot(x,y,width=42){
   shadow?.(x,y+8,width*.55,4);
   rect(x-width/2,y-4,width,13,ink);
   rect(x-width/2+2,y-5,width-4,4,metal);
   rect(x-width/2+4,y+1,3,3,brass);
   rect(x+width/2-7,y+1,3,3,brass);
  }
  function lever(x,y,engaged=false){
   foot(x,y);
   rect(x-9,y-4,18,5,'#a38562');
   const direction=engaged?1:-1;
   line(x,y-4,x+direction*10,y-19,ink,7);
   line(x,y-5,x+direction*10,y-19,brass,4);
   rect(x+direction*10-5,y-22,10,6,engaged?'#8ac9b1':'#ba624e');
   rect(x+direction*10-4,y-22,8,2,'#f2ce8b');
  }
  function socket(x,y,filled=false){
   foot(x,y,32);
   rect(x-10,y-11,20,13,brass);
   rect(x-8,y-9,16,9,ink);
   if(filled)rect(x-6,y-7,12,5,'#82bca8');
  }
  function rack(x,y,width=46){
   shadow?.(x,y+9,width*.54,4);
   rect(x-width/2+3,y-2,5,12,ink);rect(x+width/2-8,y-2,5,12,ink);
   rect(x-width/2,y-4,width,8,'#6a4b3f');
   rect(x-width/2+1,y-5,width-2,3,'#ac825a');
   for(const dx of [-1,1])rect(x+dx*(width/2-6)-1,y-2,3,2,'#ebca8e');
  }
  function dial(x,y,fraction,readout){
   foot(x,y,54);
   rect(x-15,y-25,30,22,ink);
   rect(x-13,y-27,26,24,'#a17c59');
   rect(x-10,y-24,20,19,'#ebd3a4');
   for(const dx of [-7,0,7])rect(x+dx,y-22,1,4,'#705b4c');
   const angle=Math.PI*(1.14+.72*Math.max(0,Math.min(1,fraction)));
   line(x,y-10,x+9*Math.cos(angle),y-10+9*Math.sin(angle),'#743d46',2);
   rect(x-2,y-11,4,4,ink);
   if(readout)label(readout,x,y+19,'#fae7ba',10);
  }
  function lamp(x,y,state){
   const [symbol,color]=({
    locked:['×','#f2aa81'],ready:['○','#f2ce82'],working:['…','#b3dce3'],complete:['✓','#b4e7ba']
   })[state];
   rect(x-8,y-8,16,15,ink);
   rect(x-6,y-7,12,2,brass);
   label(symbol,x,y+4,color,14);
  }
  return {foot,lever,socket,rack,dial,lamp};
 }

 function repairMarker(lab){
  const points={
   0:{x:equipment.liftLever.x+28,y:equipment.liftLever.y-8},
   1:{x:193+(lab.trial?.index??1)*150,y:215},
   2:{x:566,y:215},
   3:{x:353,y:215},
   4:{x:353,y:215},
   5:{x:equipment.pump.x+32,y:equipment.pump.y-8},
   6:{x:611,y:261},
   9:{x:equipment.crank.x+31,y:equipment.crank.y}
  };
  return points[lab.room];
 }
 function draw(lab,now,paint,complete=false,state=complete?'complete':'ready',paintedBay=false){
  const {rect,line,label,cartArt,prop,shadow}=paint;
  const dark='#243638', edge='#56706d', light='#f6dfac', gold='#eec879', green='#a4da95';
  const block=(x,y,mass)=>{
   if(!prop?.('massBlock',x-17,y-14))rect(x-17,y-14,34,27,'#715743');
   label(mass+' kg',x,y+6,light,12);
  };
  const art=fittings(paint);
  const arrow=(x,y,direction,length,color)=>{
   if(length<2)return;
   const end=x+direction*length;
   line(x,y,end,y,color,4);line(end,y,end-direction*7,y-5,color,2);line(end,y,end-direction*7,y+5,color,2);
  };
 if(lab.room===0){
  for(const item of equipment.liftRack){
   art.rack(item.x,item.y,32);
   if(!rackWeights(lab).includes(item))continue;
   rect(item.x-16,item.y-18,32,16,'#272f3a');
   rect(item.x-14,item.y-16,28,13,'#65767c');
   rect(item.x-9,item.y-20,18,4,'#a3b0ad');
   label(item.weight+' N',item.x,item.y-6,light,10);
  }
  art.socket(equipment.liftHook.x,equipment.liftHook.y,Boolean(lab.load));
  line(500,229,500,238,light,2);line(500,238,506,238,light,2);
  art.lever(equipment.liftLever.x,equipment.liftLever.y,state==='working'||complete);
 }else if(lab.room===5){
  for(const [i,piston] of equipment.pistons.entries()){
   const routed=lab.piston===i;
   line(piston.x,204,piston.x,219,routed?'#75c6b3':edge,5);
   art.lever(piston.x,piston.y,routed);
  }
  art.dial(equipment.pump.x,equipment.pump.y,lab.values.hydraulic/40,lab.values.hydraulic+' kPa');
 }else if(lab.room===6){
  for(const [i,cart] of equipment.carts.entries()){
   art.rack(cart.x,cart.y);
   if(i===lab.cartIndex)rect(cart.x-17,cart.y-19,34,2,'#8fc3a9');
   if(!cartArt?.('cart',cart.x,cart.y-3,i===1?32:26)){
    rect(cart.x-16,cart.y-16,32,10,'#aa8158');
    for(const dx of [-11,9])rect(cart.x+dx,cart.y-6,5,4,dark);
   }
   rect(cart.x-16,cart.y+4,32,12,'#303536');
   label(cart.mass+' kg',cart.x,cart.y+13,light,10);
  }
  for(const launcher of equipment.launchers)art.lever(launcher.x,launcher.y,state==='working');
 }else if(lab.room===9){
  const point=equipment.crank, grip=443+lab.values.crank/2;
  line(436,207,468,194,edge,4);
  rect(grip-3,201-(grip-443)/3,6,7,gold);
  if(!complete)label(lab.values.crank+' cm',point.x,237,light,11);
 }else{
  if(!paintedBay){
   rect(104,68,512,140,'#403932');
   rect(109,71,502,132,'#79624b');
   rect(120,79,480,115,'#30403c');
   rect(120,191,480,3,'#6a6554');
  }
  if(lab.room===1){
   const {pixelsPerMetre:travel,start}=sledTrack;
   for(const [i,surface] of surfaces.entries()){
    const y=101+i*40;
    if(!prop?.(['smooth','stone','rough'][i],start-21,y-13,385,26))rect(start-21,y-13,385,26,surface.color);
    for(let step=0;step<=6;step++)rect(start+step*travel,y+10,1,5,'#243638');
    const bandX=start+frictionZone[0]*travel, bandWidth=(frictionZone[1]-frictionZone[0])*travel;
    if(!prop?.('scoreBand',bandX,y-12,bandWidth,24))rect(bandX,y-12,bandWidth,24,'#c0a36c');
    const run=lab.trial?.key==='friction'&&lab.trial.index===i?lab.trial:null;
    const t=run?Math.min(Math.max(0,now-run.started),run.speed/run.deceleration):0;
    const x=start+(run?run.speed*t-.5*run.deceleration*t*t:0)*travel;
    shadow?.(x,y+7,12,3);
    if(!prop?.('frictionSled',x-11,y-10))rect(x-9,y-6,18,12,'#384340');
    if(run?.win&&t>=run.speed/run.deceleration)rect(x-6,y-8,12,2,green);
    if(run&&t>=run.speed/run.deceleration)label(number(run.distance)+' m',548,y+5,light,11);
    art.lever(165+i*150,223,state==='working'&&Boolean(run));
    label(surface.name,165+i*150,244,light,10);
   }
  }else if(lab.room===2){
   const fixed=12,value=lab.values.force,net=force(value);
   const netColor=net?'#ffe0a0':green;
   label('Net force: '+netForceLabel(net),360,96,netColor,14);
   arrow(360,112,Math.sign(net),Math.abs(net)*6,netColor);
   if(!net)rect(358,110,4,4,netColor);
   if(!prop?.('testBlock',332,129))rect(332,129,56,30,'#817360');
   arrow(390,144,1,fixed*6,gold);
   arrow(330,144,-1,value*6,net===0?green:'#8ec7c2');
   label(value+' N left',243,173,light,12);label(fixed+' N right',474,173,light,12);
   for(const item of rackWeights(lab)){art.rack(item.x,item.y);block(item.x,item.y,item.mass);}
   shadow?.(plate.x,plate.y+13,27,5);
   if(!prop?.(lab.calibrated?'forcePlateLive':'forcePlate',plate.x-26,plate.y-14)){
    rect(plate.x-26,plate.y-14,52,27,lab.calibrated?'#5d845f':'#ad925b');
   }
   if(lab.load)block(plate.x,plate.y,lab.load);
   art.dial(537,223,value/20);
  }else if(lab.room===3){
   const {start,contact,gap,pixelsPerMetre}=momentumTrack;
   const run=lab.trial?.key==='momentum'?lab.trial:null;
   const e=run?Math.max(0,now-run.started):0;
   const coupled=run&&e>=run.approachTime;
   const t=coupled?Math.min(e-run.approachTime,run.coupledSpeed):0;
   const rolled=coupled?(run.coupledSpeed*t-.5*t*t)*pixelsPerMetre:0;
   const incoming=coupled?contact-gap+rolled:start+(run?run.speed*e*pixelsPerMetre:0);
   if(!prop?.('rail',141,150,454,8))rect(141,151,454,6,edge);
   const scoreX=contact+momentumZone[0]*pixelsPerMetre, scoreWidth=(momentumZone[1]-momentumZone[0])*pixelsPerMetre;
   if(!prop?.('scoreBand',scoreX,146,scoreWidth,19))rect(scoreX,146,scoreWidth,19,'#bc9c60');
   const wagon=(kind,x,text)=>{
    shadow?.(x,154,21,3);
    if(!cartArt?.(kind,x,153,40)){
     rect(x-17,123,34,20,'#ac875f');rect(x-12,144,6,9,'#182825');rect(x+6,144,6,9,'#182825');
    }
    label(text,x,129,light,11);
   };
   wagon('cart',incoming,'4 kg');wagon('receiver',contact+rolled,'2 kg');
   label('Launch '+lab.values.momentum+' m/s',205,180,light,12);
   if(coupled)label('Coupled '+number(run.coupledSpeed)+' m/s',464,180,light,12);
   art.dial(323,223,(lab.values.momentum-1)/3);
  }else{
   const value=lab.values.torque,imbalance=torque(value);
   const pivot=300,y=145,scale=63,tilt=Math.max(-.16,Math.min(.16,imbalance/170));
   const height=x=>y+(x-pivot)*tilt;
   shadow?.(pivot,180,23,4);
   if(!prop?.('fulcrum',pivot-24,y-10)){
    line(pivot,y,pivot,179,'#a9aa8a',9);
    line(180,height(180),550,height(550),gold,6);
   }else{
    for(let x=180;x<550;x+=12){
     const width=Math.min(12,550-x);
     prop('beam',x,height(x+width/2)-5,width);
    }
   }
   for(let n=-1;n<=3;n++){
    const x=pivot+n*scale;
    line(x,height(x)-5,x,height(x)+7,edge,2);
    label(n===0?'pivot':Math.abs(n)+' m',x,188,light,11);
   }
   const weightX=pivot+scale*value;
   const middle=(pivot+weightX)/2;
   block(pivot-scale,height(pivot-scale)-16,4);
   block(weightX,height(weightX)-16,2);
   line(pivot,99,weightX,99,gold,1);
   for(const x of [pivot,weightX])line(x,95,x,103,gold,1);
   rect(middle-29,77,58,17,'#18282a');
   label(value.toFixed(1)+' m',middle,90,light,13);
   art.dial(323,223,(value-.5)/3);
  }
  }
  const marker=repairMarker(lab);
  art.lamp(marker.x,marker.y,lab.room===2&&!lab.calibrated?'locked':state);
  if(!complete){
   const {x,y,width,height}=resetConsole(lab.room);
   if(lab.room===9){
    const left=x-width/2, top=y-height/2;
    rect(left,top,width,height,'#464539');
    rect(left+2,top,width-4,4,'#b39159');
    rect(left+8,y-3,6,7,'#eeb76e');
    label('Reset',x+5,y+4,light,11);
   }else{
    art.lever(x-14,y,false);
    label('Reset',x+16,y+4,light,10);
   }
  }
 }

 return {snapshot,restore,title,goals,equipment,instruments,instrumentByRoom,requiredReadings,measurements,make,goal,targets,rackWeights,resetConsole,adjust,readout,result,number,acceleration,friction,collision,force,netForceLabel,torque,pistonForce,liftDifference,guardianMomentum,guardianCycle,brakeMomenta,crankTorque,draw,repairMarker,overlayName,drawOverlay,fittings};
})();
