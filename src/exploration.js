'use strict';

const exploration=(()=>{
 const start=180, seam=320, plate=528, end=606, rail=218;
 const rack={x:126,y:157}, reset={x:206,y:157}, interlock={x:527,y:135};
 const home={x:153,y:105,facing:'south',walking:false};
 const clue='Nacre relay · sector 07, bearing 042°. The archive margin reads “Stargate II · far-side relay.”';
 const fresh=()=>({x:start,mass:3,joined:false,held:false,complete:false,boots:true,goggles:true,hidden:[],mira:{...home},motion:null});
 function restore(saved,inside){
  const state=fresh();
  if(!saved)return state;
  if(Number.isInteger(saved.x)&&saved.x>=start&&saved.x<=end)state.x=saved.x;
  state.mass=saved.mass===6?6:3;
  state.joined=saved.joined===true;
  state.held=inside&&state.joined&&saved.held===true;
  if(state.held)Object.assign(state.mira,interlock);
  state.complete=saved.complete===true;
  state.boots=saved.boots!==false;
  state.goggles=saved.goggles!==false;
  state.hidden=Array.isArray(saved.hidden)?saved.hidden.filter(id=>Number.isInteger(id)&&id>=0):[];
  return state;
 }
 function snapshot({x,mass,joined,held,complete,boots,goggles,hidden}){
  return {x,mass,joined,held,complete,boots,goggles,hidden};
 }
 function leave(state){
  state.held=false;
  Object.assign(state.mira,home);
  state.motion=null;
 }
 function badges(survey,reports,complete,curiosities){
  return {
   field:[
    ['East Garden survey',survey],
    ['Alder Orchard irrigation',reports.has(14)],
    ['Service Gulch turntable',reports.has(15)],
    ['Garden Calibration Shed',complete]
   ],
   curiosities
  };
 }
 function rewards(badges){
  const field=badges.field.filter(([,earned])=>earned).length;
  const curiosities=badges.curiosities.length;
  return {boots:field>=2,goggles:curiosities>=2,clue:field+curiosities>=5};
 }
 function position(state){
  if(!state.motion)return state.x;
  const {to,t}=state.motion;
  return to+(state.x-to)*(1-t)**2;
 }
 function blocks(state,x,y){
  return Math.abs(x-position(state))<20&&Math.abs(y-rail)<10;
 }
 function controls(state,player){
  const points=[
   {...reset,id:'reset',label:'Reset apparatus'},
   {...rack,id:'ballast',label:state.mass===3?'Add ballast · 6 kg':'Remove ballast · 3 kg'},
   {...interlock,id:'hold',label:state.held?'Rejoin me, Mira':'Hold position, Mira'}
  ];
  if(!state.joined)points.push({...state.mira,id:'join',label:'Ask Mira to join'});
  if(!state.motion){
   if(player.x<state.x&&state.x<end)points.push({x:state.x-24,y:rail,id:'east',label:'Push sled east'});
   if(player.x>state.x&&state.x>start)points.push({x:state.x+24,y:rail,id:'west',label:'Push sled west'});
  }
  return points;
 }
 function check(state){
  if(state.x!==plate)return '';
  if(state.mass<5)return 'Plate reading: 3 kg. It trips at 5 kg. The ballast rack adjusts the sled load.';
  if(!state.held)return 'Plate reading: 6 kg. Ask Mira to hold the safety interlock.';
  if(state.complete)return 'The plate and interlock are engaged.';
  state.complete=true;
  return 'Calibration Badge earned. The 6 kg load tripped the plate while Mira held the interlock.';
 }
 function use(state,id){
  if(id==='join'){
   state.joined=true;
   return 'Mira joins you. At the safety interlock, ask her to hold position while you move the sled.';
  }
  if(id==='hold'){
   if(!state.joined)return 'Ask Mira to join you first. She’s by the west wall.';
   if(!state.held&&Math.hypot(state.mira.x-interlock.x,state.mira.y-interlock.y)>84){
    return 'Wait for Mira to reach the interlock.';
   }
   state.held=!state.held;
   if(!state.held)return 'Mira rejoins you.';
   Object.assign(state.mira,interlock,{walking:false,facing:'south'});
   return check(state)||'Mira holds the interlock. Move a load of at least 5 kg onto the plate.';
  }
  if(id==='reset'){
   Object.assign(state,{x:start,mass:3,motion:null,held:false});
   Object.assign(state.mira,home);
   return 'Sled reset to the start at 3 kg. Mira is free to follow.';
  }
  if(id==='ballast'){
   if(state.x!==start||state.motion)return 'Return the sled to the start or use the reset lever before adjusting the ballast.';
   state.mass=state.mass===3?6:3;
   return 'Sled loaded to '+state.mass+' kg. The plate trips at 5 kg.';
  }
  const direction=id==='east'?1:-1;
  const onMat=direction>0?state.x>=seam:state.x>seam;
  const distance=onMat?(state.mass===6?32:40):(state.mass===6?60:70);
  const boundary=direction>0?(state.x<seam?seam:state.x<plate?plate:end):
   (state.x>plate?plate:state.x>seam?seam:start);
  const to=direction>0?Math.min(boundary,state.x+distance):Math.max(boundary,state.x-distance);
  state.motion={to,t:0,onMat};
  return '';
 }
 function update(state,player,dt,instant){
  const {mira,motion}=state;
  mira.walking=false;
  if(state.joined&&!state.held){
   const x=player.x-mira.x,y=player.y-mira.y;
   const distance=Math.hypot(x,y);
   if(distance>49)adventure.move(mira,adventure.movement(x,y),Math.min(distance-49,220*dt),()=>true);
  }
  if(!motion)return null;
  motion.t=instant?1:Math.min(1,motion.t+dt/.28);
  if(motion.t<1)return null;
  const distance=Math.abs(state.x-motion.to);
  state.x=motion.to;
  state.motion=null;
  const surface=motion.onMat?'rough mat':'oiled boards';
  return check(state)||'Sled traveled '+distance+' cm on the '+surface+'.';
 }
 function draw(state,{rect,line,label,prop,shadow,motion=false},painted=false){
  if(!painted){
   rect(0,0,720,360,'#2f292b');
   rect(38,45,644,270,'#6c4a39');
   for(let y=174;y<315;y+=16){
    rect(40,y,640,15,y%32===14?'#856040':'#906c48');
    for(let x=y%32===14?72:109;x<676;x+=78)rect(x,y,2,15,'#775235');
   }
   rect(40,45,640,52,'#503d36');
   for(let x=47;x<675;x+=43)rect(x,50,39,36,'#674b3d');
   rect(36,92,648,7,'#ad7952');
   drawBackdropDetails(null,{rect,line},'shed');
  }
  wallBaseShadow({rect},99,38,644);
  shadow?.(rack.x,153,25,4);
  prop?.('ballast',104,134);
  label('Ballast',rack.x,127,'#f1d7a0',10);
  const art=scienceLabs.fittings({rect,line,label,shadow});
  art.lever(reset.x,reset.y-4);
  label('Reset',reset.x,122,'#f1d7a0',10);
  shadow?.(interlock.x,143,29,4);
  prop?.(state.held?'interlockLive':'interlock',interlock.x-28,125);
  label('Interlock',interlock.x,111,state.held?'#aee2a0':'#f1d7a0',10);
  shadow?.(393,rail+18,232,5);
  rect(162,rail-13,462,31,'#473732');
  if(!prop?.('oiled',163,rail-10,seam-163,24))rect(163,rail-10,seam-163,24,'#c18f54');
  if(!prop?.('mat',seam,rail-10,302,24))rect(seam,rail-10,302,24,'#6e7860');
  const pressed=state.x===plate&&state.mass>=5;
  prop?.(pressed?'shedPlateLive':'shedPlate',plate-21,rail-15);
  label('5 kg',plate,rail+34,'#f1d7a0',10);
  const x=Math.round(position(state));
  shadow?.(x,rail+12,24,4);
  if(motion&&state.motion){
   const direction=Math.sign(state.motion.to-state.x);
   dustPuff({rect},x-direction*15,rail+10,state.motion.t,-direction);
  }
  if(!prop?.('ballastSled',x-23,rail-20))rect(x-21,rail-13,42,26,'#755740');
  label(state.mass+' kg',x,rail,'#fff1cc',11);
  art.lamp(plate+31,rail+20,state.complete?'complete':'ready');
 }
 function plateReading(state){
  return state.x===plate&&!state.motion?state.mass+' kg · trips at 5 kg':'';
 }
 return {fresh,restore,snapshot,leave,badges,rewards,clue,blocks,controls,use,update,draw,plateReading};
})();
