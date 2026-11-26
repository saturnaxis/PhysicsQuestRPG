'use strict';

const valleyInvestigations=(()=>{
 const stations={
  14:{x:300,y:227,name:'Irrigation arm',site:'Alder Orchard',choices:['Tighter track','Wider track','Same on both'],correct:0},
  15:{x:350,y:198,name:'Survey turntable',site:'Service Gulch',choices:['Faster','Slower','Same speed'],correct:0}
 };
 const speed=4, trackRadii=[2,4];
 const startingRadius=2, finalRadius=1, startingRate=1.2;
 const inertia=radius=>2+2*radius**2;
 const angularMomentum=inertia(startingRadius)*startingRate;
 const rate=radius=>angularMomentum/inertia(radius);
 const gold='#f1ce81', pale='#e5e3c8', teal='#87d1c3', metal='#6a9486';
 let active=null;

 function report(room,prediction){
  if(!Number.isInteger(prediction)||!stations[room]?.choices[prediction])return null;
  if(room===14){
   return {prediction,speed,radii:[...trackRadii],accelerations:trackRadii.map(radius=>speed**2/radius)};
  }
  return {prediction,radii:[startingRadius,finalRadius],inertias:[inertia(startingRadius),inertia(finalRadius)],rates:[startingRate,rate(finalRadius)],angularMomentum};
 }

 function summary(room,result){
  if(room===14){
   const [small,large]=result.accelerations;
   return 'At '+result.speed+' m/s, the '+result.radii[0]+' m track gave '+small+' m/s² inward and the '+result.radii[1]+' m track gave '+large+' m/s² inward. Both carriages moved tangent to their circles on release.';
  }
  return 'The weights moved from '+result.radii[0]+' m to '+result.radii[1]+' m. Moment of inertia fell from '+result.inertias[0]+' to '+result.inertias[1]+' kg·m², and angular speed rose from '+result.rates[0]+' to '+result.rates[1]+' rad/s. Angular momentum stayed at '+result.angularMomentum+' kg·m²/s.';
 }

 function drawStation(room,paint,logged){
  const {x,y}=stations[room], {rect,line}=paint;
  rect(x-33,y-21,66,21,'#253b36');
  rect(x-33,y-24,66,17,'#6d7664');
  rect(x-31,y-23,62,3,'#b9a47a');
  if(room===14){
   line(x-23,y-13,x+22,y-13,'#294744',4);
   line(x-13,y-19,x-13,y-8,'#8cd2bd',3);
   line(x+15,y-19,x+15,y-8,'#8cd2bd',3);
  }else{
   rect(x-24,y-19,43,11,'#393f39');
   line(x-21,y-14,x+16,y-14,'#d3ad73',4);
   rect(x-16,y-18,6,8,'#e8c485');rect(x+8,y-18,6,8,'#e8c485');
  }
  rect(x+23,y-17,5,6,logged?teal:gold);
 }

 function circle(ctx,x,y,radius,color,fill=false){
  ctx.beginPath();ctx.arc(x,y,radius,0,2*Math.PI);
  if(fill){ctx.fillStyle=color;ctx.fill();}
  else{ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();}
 }

 function segment(ctx,x,y,toX,toY,color,width=2){
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(toX,toY);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
 }

 function arrow(ctx,x,y,angle,length,color){
  const tipX=x+length*Math.cos(angle),tipY=y+length*Math.sin(angle);
  segment(ctx,x,y,tipX,tipY,color);
  for(const side of [-1,1]){
   const edge=angle+Math.PI+side*.52;
   segment(ctx,tipX,tipY,tipX+7*Math.cos(edge),tipY+7*Math.sin(edge),color);
  }
 }

 function caption(ctx,text,x,y,color=pale){
  ctx.textAlign='center';ctx.font='bold 20px system-ui';
  ctx.fillStyle=color;ctx.fillText(text,x,y);
 }

 function trackPhase(radius,seconds){return -Math.PI/2+speed/radius*seconds;}

 function drawTracks(ctx,state,elapsed,still){
  const released=state.stage==='released';
  for(const [index,radius] of trackRadii.entries()){
   const cx=135+index*270,cy=100;
   const angle=released?state.releaseAngles[index]:trackPhase(radius,still||state.stage==='ready'?0:elapsed);
   const x=cx+16*radius*Math.cos(angle),y=cy+16*radius*Math.sin(angle);
   const heading=angle+Math.PI/2;
   circle(ctx,cx,cy,16*radius,metal);
   circle(ctx,cx,cy,4,metal,true);
   caption(ctx,radius+' m track',cx,211);
   if(released){
    const distance=16*speed*(still?.75:Math.min(.75,elapsed));
    circle(ctx,x,y,4,metal,true);
    arrow(ctx,x,y,heading,48,teal);
    circle(ctx,x+distance*Math.cos(heading),y+distance*Math.sin(heading),7,gold,true);
   }else{
    circle(ctx,x,y,7,gold,true);
    if(state.stage==='orbit')arrow(ctx,x,y,angle+Math.PI,2.8*speed**2/radius,gold);
   }
  }
 }

 function drawRotor(ctx,state,elapsed,now,still){
  const moved=state.stage==='moved';
  const fraction=moved?(still?1:Math.min(1,elapsed/.9)):0;
  const radius=startingRadius+(finalRadius-startingRadius)*fraction;
  if(state.stage!=='ready'&&!still){
   const step=Math.min(.05,Math.max(0,now-state.lastFrame));
   state.angle+=rate(radius)*step;
  }
  state.lastFrame=now;
  const cx=270,cy=103, rail=81;
  const dx=Math.cos(state.angle),dy=Math.sin(state.angle);
  circle(ctx,cx,cy,89,metal);
  segment(ctx,cx-rail*dx,cy-rail*dy,cx+rail*dx,cy+rail*dy,metal,5);
  for(const side of [-1,1]){
   const distance=side*radius*38;
   circle(ctx,cx+distance*dx,cy+distance*dy,10,gold,true);
  }
  circle(ctx,cx,cy,8,teal,true);
  caption(ctx,radius.toFixed(1)+' m from the axis',cx,214);
 }

 function frame(milliseconds){
  const state=active;
  if(!state?.context)return;
  const now=milliseconds/1000, elapsed=Math.max(0,now-state.since), still=reducedMotion();
  const ctx=state.context;
  ctx.clearRect(0,0,540,226);
  if(state.room===14)drawTracks(ctx,state,elapsed,still);
  else drawRotor(ctx,state,elapsed,now,still);
 }

 function open(room,saveReading){
  const station=stations[room];
  const leave=()=>{
   active=null;
   close();
  };
  function reset(){
   const now=performance.now()/1000;
   active={room,stage:'ready',since:now,angle:0,lastFrame:now};
   show();
  }
  function move(stage){
   active.stage=stage;
   active.since=performance.now()/1000;
   active.lastFrame=active.since;
   show();
  }
  function saveResult(){
   const result=report(room,active.prediction);
   saveReading(result);
  }
  function show(){
   const state=active;
   const actions=[];
   const readings=report(room,state.prediction);
   const observation=readings?summary(room,readings):'';
   const add=(name,label,handler)=>actions.push({name,label,handler});
   const predict=handler=>station.choices.forEach((choice,index)=>add('field-choice-'+index,choice,()=>{
    state.prediction=index;
    handler();
   }));
   const prediction=readings?(state.prediction===station.correct?'Your prediction matched the trial.':'Compare the measured values with your prediction. '):'';
   let text='';
   if(room===14){
    if(state.stage==='ready'){
     text='Both 1 kg carriages travel at 4 m/s. Which track needs the greater inward force? Choose a prediction to run the test.';
     predict(()=>move('orbit'));
    }else if(state.stage==='orbit'){
     const [tight,wide]=readings.accelerations;
     text=prediction+' The 2 m track gives '+tight+' m/s² inward ('+tight+' N). The 4 m track gives '+wide+' m/s² inward ('+wide+' N). Gold arrows point inward.';
     add('field-release','Release both carriages',()=>{
      const elapsed=reducedMotion()?0:Math.max(0,performance.now()/1000-state.since);
      state.releaseAngles=trackRadii.map(radius=>trackPhase(radius,elapsed));
      move('released');saveResult();
     });
    }else{
     text=observation+' The teal arrows trace the release directions. Results saved in the Field Notebook.';
    }
   }else if(state.stage==='ready'){
    text='Two 1 kg weights ride on a low-friction rotor. Start with both weights 2 m from its axis.';
    add('field-spin','Start the rotor',()=>move('powered'));
   }else if(state.stage==='powered'){
    text='The drive holds the rotor at '+startingRate+' rad/s. Disconnect the drive before moving the weights.';
    add('field-disconnect','Disconnect drive',()=>move('coasting'));
   }else if(state.stage==='coasting'){
    text='The rotor is coasting with negligible external torque. What happens to its angular speed when you slide both weights inward to 1 m? Choose a prediction to move them.';
    predict(()=>{move('moved');saveResult();});
   }else{
    text=prediction+' '+observation+' Results saved in the Field Notebook.';
   }
   if(['released','moved'].includes(state.stage))add('field-retry','Run another trial',reset);
   add('dismiss','Back to the trail',leave);
   const diagram=room===14?'Two circular tracks comparing motion at the same speed.':'A rotor with two equal weights opposite each other on the same rail.';
   dialog('<h2>'+station.name+'</h2><p>'+text+'</p><canvas id="field-diagram" width="540" height="226" role="img" aria-label="'+diagram+'"></canvas><div class="choices field-actions">'+actions.map(({name,label},index)=>'<button id="'+name+'"'+(index===0?' class="gold"':'')+'>'+label+'</button>').join('')+'</div>',{focus:false});
   $('sheet').classList.add('field-sheet');
   for(const {name,handler} of actions)$(name).onclick=handler;
   state.context=$('field-diagram').getContext('2d');
   frame(performance.now());
   setChoice(0);
  }
  reset();
 }

 return {stations,report,summary,drawStation,frame,open};
})();
