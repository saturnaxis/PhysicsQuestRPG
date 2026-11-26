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
 const frictionZone=[2.6,3.6], momentumZone=[1.7,2.3];
 const momentumTrack={start:170,contact:355,gap:35,pixelsPerMetre:62};
 const inRange=(value,[low,high])=>value>=low&&value<=high;
 const number=value=>Number(value.toFixed(2));
 const rack=masses.map((mass,index)=>({mass,x:165+index*65,y:229}));
 const plate={x:535,y:248};
 const resetConsole=room=>room===9
  ?{x:348,y:276,width:66,height:24}
  :{x:360,y:room===0||room===2?292:266,width:76,height:20};
 const equipment={
  liftRack:[{x:175,y:232,weight:400},{x:243,y:232,weight:680}],
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
  6:'Couple a cart, then walk to a launcher. Check the guardian’s direction before each pass.',
  9:'Slide the grip along the crank, then turn it to test the setting.',
  1:'Launch the same sled on each surface. Find the lane that stops it in the gold zone.',
  2:'Carry a test mass to the gold scale. Use the accelerator’s readings to calibrate it.',
  3:'Set the incoming cart’s speed, then launch it. Stop the coupled carts in the gold zone.',
  4:'Move the counterweight along the beam. Hold it near balance to lock the bridge.'
 };
 const hints={
  lift:['The heavier side of the pulley starts moving down. The other side rises.','Choose a counterweight heavier than the occupied 520 N platform.','Hang the 680 N counterweight on the hook and pull the lift lever.'],
  hydraulic:['At the same pressure, more piston area produces more force.','The larger piston gains 20 N for every kPa of pressure. The gate needs 600 N.','Route to the 200 cm² piston and set the pump to at least 30 kPa.'],
  brake:['Momentum has both a size and a direction. Read the guardian’s direction before launching.','Use the launcher on the opposite side of the track with a cart carrying 10 kg·m/s.','Couple the 5 kg cart. Launch from the right if the guardian moves right, or from the left if it moves left.'],
  crank:['Moving the grip farther out increases torque at the same push.','Multiply 50 N by the grip distance in metres. You need at least 18 N·m.','A grip distance of 40 cm produces 20 N·m and lowers the bridge.'],
  friction:['A rougher surface brings the sled to a stop sooner.','If it went too far, try a lane with more friction. If it stopped short, try less.','Compare the rough and smooth runs. The middle-friction lane stops between them.'],
  mass:['At the same force, a lighter mass accelerates faster.','Divide 12 N by the target acceleration of 3 m/s².','12 ÷ 3 = 4. Carry the 4 kg block to the plate.'],
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
  const {carry,load,calibrated,values,piston,cartIndex,brakes,heading,attempts,lastTrial,lastFeedback}=lab;
  return {carry,load,calibrated,values:{...values},piston,cartIndex,brakes,heading,attempts:{...attempts},lastTrial,lastFeedback};
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
  if(typeof data.lastFeedback==='string'&&data.lastFeedback.length<=600)lab.lastFeedback=data.lastFeedback;
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
 function brakeMomenta(cartIndex,side,heading){
  const {mass,speed}=equipment.carts[cartIndex];
  const cart=mass*speed*side, guardian=10*heading;
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
   case 6:return [lab.brakes===2?'Guardian stopped':'Guardian moving '+(lab.heading===1?'right':'left'),
    ...(lab.cartIndex===null?['Couple a cart to check its launch speed.']:['Coupled cart launch speed · '+equipment.carts[lab.cartIndex].speed+' m/s'])];
   case 9:return ['Grip distance · '+values.crank+' cm from the axle'];
   default:return [];
  }
 }
 function goal(lab){
  if(lab.room===2&&lab.calibrated)return 'The test mass is calibrated. Balance the 12 N rightward pull at the force dial.';
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
  if(lab.calibrated)return list.concat(add('force',{x:537,y:223},'Adjust the left pull'));
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
 function draw(lab,now,paint,complete=false){
  const {rect,line,label}=paint;
  const dark='#243638', edge='#56706d', light='#f6dfac', gold='#eec879', green='#a4da95';
  const base=(x,y,w,h)=>{rect(x,y,w,h,dark);rect(x,y,w,3,edge);};
  const block=(x,y,mass)=>{
   rect(x-17,y-14,34,27,'#715743');rect(x-15,y-12,30,5,'#ba986a');
   label(mass+' kg',x,y+6,light,12);
  };
  const button=(x,y,text,width=76,height=20)=>{
   rect(x-width/2,y-height/2,width,height,'#3a4d48');
   rect(x-width/2+1,y-height/2,width-2,2,'#849182');
   label(text,x,y+4,light,11);
  };
  const arrow=(x,y,direction,length,color)=>{
   if(length<2)return;
   const end=x+direction*length;
   line(x,y,end,y,color,4);line(end,y,end-direction*7,y-5,color,2);line(end,y,end-direction*7,y+5,color,2);
  };
  const dial=(point,text)=>button(point.x,point.y,text);
 if(lab.room===0){
  for(const item of rackWeights(lab))dial(item,item.weight+' N');
  dial(equipment.liftHook,lab.load?lab.load+' N on hook':'Lift hook');
  dial(equipment.liftLever,'Lift lever');
 }else if(lab.room===5){
  for(const [i,piston] of equipment.pistons.entries())dial(piston,lab.piston===i?'✓ Routed':'Route');
  dial(equipment.pump,lab.values.hydraulic+' kPa');
 }else if(lab.room===6){
  for(const [i,cart] of equipment.carts.entries())dial(cart,(lab.cartIndex===i?'✓ ':'')+cart.mass+' kg cart');
  for(const launcher of equipment.launchers)dial(launcher,launcher.side===1?'Left launch':'Right launch');
 }else if(lab.room===9){
  const point=equipment.crank, grip=443+lab.values.crank/2;
  line(436,207,468,194,edge,4);
  rect(grip-3,201-(grip-443)/3,6,7,gold);
  if(!complete)label(lab.values.crank+' cm',point.x,237,light,11);
 }else{
 base(112,75,493,126);
  if(lab.room===1){
   const travel=62, start=189;
   for(const [i,surface] of surfaces.entries()){
    const y=101+i*40;
    rect(start-21,y-13,385,26,surface.color);
    for(let step=0;step<=6;step++)rect(start+step*travel,y+10,1,5,'#243638');
    rect(start+frictionZone[0]*travel,y-12,(frictionZone[1]-frictionZone[0])*travel,24,'#c0a36c');
    const run=lab.trial?.key==='friction'&&lab.trial.index===i?lab.trial:null;
    const t=run?Math.min(Math.max(0,now-run.started),run.speed/run.deceleration):0;
    const x=start+(run?run.speed*t-.5*run.deceleration*t*t:0)*travel;
    rect(x-9,y-6,18,12,'#384340');rect(x-8,y-6,16,3,run?.win?green:gold);
    if(run&&t>=run.speed/run.deceleration)label(number(run.distance)+' m',548,y+5,light,11);
    button(165+i*150,223,surface.name);
   }
  }else if(lab.room===2){
   const fixed=12,value=lab.values.force,net=force(value);
   const netColor=net?'#ffe0a0':green;
   label('Net force: '+netForceLabel(net),360,96,netColor,14);
   arrow(360,112,Math.sign(net),Math.abs(net)*6,netColor);
   if(!net)rect(358,110,4,4,netColor);
   rect(332,129,56,30,'#817360');
   arrow(390,144,1,fixed*6,gold);
   arrow(330,144,-1,value*6,net===0?green:'#8ec7c2');
   label(value+' N left',243,173,light,12);label(fixed+' N right',474,173,light,12);
   for(const item of rackWeights(lab))block(item.x,item.y,item.mass);
   rect(plate.x-26,plate.y-14,52,27,lab.calibrated?'#5d845f':'#ad925b');
   label('PLATE',plate.x,plate.y+28,light,11);
   if(lab.load)block(plate.x,plate.y,lab.load);
   if(lab.calibrated)button(537,223,'Force dial');
  }else if(lab.room===3){
   const {start,contact,gap,pixelsPerMetre}=momentumTrack;
   const run=lab.trial?.key==='momentum'?lab.trial:null;
   const e=run?Math.max(0,now-run.started):0;
   const coupled=run&&e>=run.approachTime;
   const t=coupled?Math.min(e-run.approachTime,run.coupledSpeed):0;
   const rolled=coupled?(run.coupledSpeed*t-.5*t*t)*pixelsPerMetre:0;
   const incoming=coupled?contact-gap+rolled:start+(run?run.speed*e*pixelsPerMetre:0);
   rect(141,151,454,6,edge);
   rect(contact+momentumZone[0]*pixelsPerMetre,146,(momentumZone[1]-momentumZone[0])*pixelsPerMetre,19,'#bc9c60');
   const wagon=(x,text)=>{
    rect(x-17,123,34,20,'#ac875f');rect(x-12,144,6,9,'#182825');rect(x+6,144,6,9,'#182825');
    label(text,x,137,light,11);
   };
   wagon(incoming,'4 kg');wagon(contact+rolled,'2 kg');
   label('Launch '+lab.values.momentum+' m/s',205,180,light,12);
   if(coupled)label('Coupled '+number(run.coupledSpeed)+' m/s',464,180,light,12);
   button(323,223,'Launch dial');
  }else{
   const value=lab.values.torque,imbalance=torque(value);
   const pivot=300,y=145,scale=63,tilt=Math.max(-.16,Math.min(.16,imbalance/170));
   const height=x=>y+(x-pivot)*tilt;
   line(180,height(180),550,height(550),gold,6);
   line(pivot,y,pivot,179,'#a9aa8a',9);
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
   button(323,223,'Slide dial');
  }
  }
  if(!complete){
   const {x,y,width,height}=resetConsole(lab.room);
   if(lab.room===9){
    const left=x-width/2, top=y-height/2;
    rect(left,top,width,height,'#464539');
    rect(left+2,top,width-4,4,'#b39159');
    rect(left+8,y-3,6,7,'#eeb76e');
    label('Reset',x+5,y+4,light,11);
   }else button(x,y,'Reset',width,height);
  }
 }

 return {snapshot,restore,title,goals,equipment,instruments,instrumentByRoom,requiredReadings,measurements,make,goal,targets,rackWeights,resetConsole,adjust,readout,result,number,acceleration,friction,collision,force,netForceLabel,torque,pistonForce,liftDifference,brakeMomenta,crankTorque,draw};
})();
