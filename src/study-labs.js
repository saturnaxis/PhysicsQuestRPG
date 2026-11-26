'use strict';

const studyLabs=(()=>{
 const width=480,height=260;
 const ink='#f5e7c9',gold='#f4cb7a',teal='#9ae8d8',copper='#c38d63';
 const cols=29,rows=17,cell=13,left=58,top=28;
 const xAt=x=>left+x*cell, yAt=y=>top+y*cell;
 const layouts={
  bars:(x,y)=>y>=2&&y<=14?(x===4?10:x===24?0:null):null,
  dots:(x,y)=>(x-6)**2+(y-8)**2<=2?10:(x-22)**2+(y-8)**2<=2?0:null
 };
 const maps=new Map();
 function paperMap(layout){
  if(maps.has(layout))return maps.get(layout);
  const electrode=layouts[layout];
  const grid=Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>electrode(x,y)??5));
  // Zero normal current at the paper edge uses a reflected neighboring sample.
  let change;
  do{
   change=0;
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    if(electrode(x,y)!==null)continue;
    const a=grid[y][x===0?1:x-1],b=grid[y][x===cols-1?cols-2:x+1];
    const c=grid[y===0?1:y-1][x],d=grid[y===rows-1?rows-2:y+1][x];
    const delta=1.65*((a+b+c+d)/4-grid[y][x]);
    grid[y][x]+=delta;
    change=Math.max(change,Math.abs(delta));
   }
  }while(change>0.00002);
  maps.set(layout,grid);
  return grid;
 }
 function paperReading(layout,x,y){
  const grid=paperMap(layout),value=grid[y][x];
  if(layouts[layout](x,y)!==null)return {value,field:null};
  const ex=x===0||x===cols-1?0:(grid[y][x-1]-grid[y][x+1])/.02;
  const ey=y===0||y===rows-1?0:(grid[y+1][x]-grid[y-1][x])/.02;
  return {value,field:{ex,ey,magnitude:Math.hypot(ex,ey)}};
 }
 function line(ctx,points,color,thickness=2){
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for(const point of points.slice(1))ctx.lineTo(...point);
  ctx.strokeStyle=color;ctx.lineWidth=thickness;ctx.stroke();
 }
 function text(ctx,value,x,y,color=ink,size=16){
  ctx.fillStyle=color;ctx.font='bold '+size+'px system-ui';ctx.textAlign='center';ctx.fillText(value,x,y);
 }
 function box(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
 function dot(ctx,x,y,r,color){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
 }
 function arrow(ctx,x,y,dx,dy,color){
  const angle=Math.atan2(dy,dx);
  line(ctx,[[x,y],[x+dx,y+dy]],color,3);
  line(ctx,[[x+dx-8*Math.cos(angle-.54),y+dy-8*Math.sin(angle-.54)],[x+dx,y+dy],[x+dx-8*Math.cos(angle+.54),y+dy-8*Math.sin(angle+.54)]],color,2);
 }
 function paper(ctx,layout,x,y,reading){
  const grid=paperMap(layout),electrode=layouts[layout];
  box(ctx,51,21,378,222,'#645b51');
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
   const volts=grid[j][i];
   const pole=electrode(i,j);
   const shade=pole===10?'#ffcf7c':pole===0?'#8ddbd6':'rgb('+Math.round(30+volts*9)+','+Math.round(67+volts*5)+','+Math.round(78+volts*2)+')';
   box(ctx,xAt(i)-cell/2,yAt(j)-cell/2,cell+1,cell+1,shade);
  }
  const contourLabels=new Map();
  for(const level of [2,4,6,8]){
   for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){
    const corners=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]];
    const crossings=[];
    for(let edge=0;edge<4;edge++){
     const [ax,ay]=corners[edge],[bx,by]=corners[(edge+1)%4];
     const a=grid[ay][ax],b=grid[by][bx];
     if((a>=level)===(b>=level))continue;
     const f=(level-a)/(b-a);
     crossings.push([xAt(ax+f*(bx-ax)),yAt(ay+f*(by-ay))]);
    }
    for(let n=0;n<crossings.length;n+=2)line(ctx,crossings.slice(n,n+2),'#d5f2e085',1.3);
    if(crossings.length===2){
     const point=crossings[0];
     const targetY=level%4===0?yAt(4):yAt(12);
     const prior=contourLabels.get(level);
     if(!prior||Math.abs(point[1]-targetY)<Math.abs(prior[1]-targetY))contourLabels.set(level,point);
    }
   }
  }
  for(const [level,[x,y]] of contourLabels){
   box(ctx,x-13,y-9,26,14,'#203740');
   text(ctx,level+' V',x,y+2,ink,11);
  }
  text(ctx,'10 V',25,133,gold,15);text(ctx,'0 V',453,133,teal,15);
  for(const [i,[pinX,pinY]] of (reading.pins||[]).entries()){
   dot(ctx,xAt(pinX),yAt(pinY),9,'#edcc82');
   text(ctx,i+1,xAt(pinX),yAt(pinY)+4,'#233847',12);
  }
  const px=xAt(x),py=yAt(y);
  line(ctx,[[px,py],[px,Math.min(py+30,244)],[px+12,248],[432,248]],'#25232c',3);
  dot(ctx,px,py,5,'#142431');dot(ctx,px,py,2,'#ffffff');
  const field=reading.field;
  if(field?.magnitude>.1){
   const length=Math.min(46,12+field.magnitude*.35);
   arrow(ctx,px,py,length*field.ex/field.magnitude,-length*field.ey/field.magnitude,'#ffffff');
  }
 }
 function circuit(ctx,{resistor,on},amps){
  line(ctx,[[92,109],[92,62],[203,62]],copper,5);
  line(ctx,[[277,62],[388,62],[388,111]],copper,5);
  line(ctx,[[388,169],[388,206],[272,206]],copper,5);
  line(ctx,[[210,206],[92,206],[92,145]],copper,5);
  line(ctx,[[77,112],[107,112]],gold,5);line(ctx,[[83,141],[101,141]],teal,5);
  text(ctx,'+',61,118,gold);text(ctx,'−',61,148,teal);text(ctx,'12 V',92,241);
  box(ctx,203,48,74,28,'#775140');text(ctx,resistor+' Ω',240,68);
  dot(ctx,388,140,29,'#315862');text(ctx,'A',388,134);text(ctx,amps+' A',388,154,teal);
  dot(ctx,210,206,5,gold);dot(ctx,272,206,5,gold);
  line(ctx,[[210,206],[272,on?206:178]],gold,4);
  text(ctx,on?'CLOSED':'OPEN',240,241);
  if(amps){
   arrow(ctx,236,106,45,0,teal);arrow(ctx,280,169,-45,0,teal);
   text(ctx,'Conventional current',240,142,teal,15);
  }else text(ctx,'No current',240,142);
 }
 function induction(ctx,{bank,gear,direction},reading,progress){
  const west=60,east=420;
  const travel=direction>0?progress:1-progress;
  const x=west+(east-west)*travel;
  line(ctx,[[west,104],[east,104]],'#797567',4);
  for(const gate of [174,306]){
   line(ctx,[[gate,50],[gate,111]],gold,3);
   dot(ctx,gate,48,5,gold);
  }
  for(let i=0;i<bank/2;i++){
   const at=207+i*66/(bank/2-1);
   line(ctx,[[at-8,102],[at+8,68]],copper,4);
  }
  box(ctx,x-21,76,21,19,'#a75350');box(ctx,x,76,21,19,'#426a93');
  text(ctx,'N',x-10,91,ink,13);text(ctx,'S',x+10,91,ink,13);
  text(ctx,bank+' turns · '+gear,240,30);
  line(ctx,[[88,126],[88,236],[435,236]],'#879a9f');
  line(ctx,[[88,180],[435,180]],'#586f76',1);
  text(ctx,'Avg. voltage between gates',243,128,ink,13);
  text(ctx,'+6 V',61,142,ink,12);text(ctx,'0',73,184,ink,12);text(ctx,'−6 V',61,226,ink,12);
  text(ctx,'Model time (s)',417,251,ink,12);
  if(!reading)return;
  const scale=gear==='slow'?347:173.5;
  const end=88+scale*progress;
  const gateStart=88+scale*(174-west)/(east-west);
  const gateEnd=88+scale*(306-west)/(east-west);
  const gateTime=(at)=>((at-88)/347*(.40*(east-west)/(306-174))).toFixed(2);
  for(const gate of [gateStart,gateEnd]){
   line(ctx,[[gate,142],[gate,237]],'#667a88',1);
   text(ctx,gateTime(gate),gate-8,251,gold,12);
  }
  const pulse=180-reading.voltage*7;
  const trace=[[88,180],[Math.min(end,gateStart),180]];
  if(end>gateStart)trace.push([gateStart,pulse],[Math.min(gateEnd,end),pulse]);
  if(end>=gateEnd)trace.push([gateEnd,180],[end,180]);
  line(ctx,trace,teal,3);
 }
 function magnetics(ctx,polarity){
  const east=polarity>0;
  box(ctx,75,71,206,75,'#253f4d');
  for(let x=89;x<=265;x+=22){
   line(ctx,[[x,60],[x+7,70],[x+9,92],[x+6,135],[x,155],[x-6,145],[x-8,122],[x-5,84],[x,60]],copper,3);
  }
  for(const x of [118,162,206,250]){
   arrow(ctx,x,east?74:95,east?-3:3,east?20:-20,gold);
  }
  arrow(ctx,east?108:249,108,east?140:-140,0,teal);
  text(ctx,east?'Current A':'Current B',178,38);
  dot(ctx,367,108,61,'#667a83');dot(ctx,367,108,55,'#202f3d');
  const tip=east?1:-1;
  text(ctx,'W',288,113,ink,14);text(ctx,'E',445,113,ink,14);
  line(ctx,[[367-tip*33,108],[367,108]],'#91a9d8',6);
  arrow(ctx,367,108,tip*35,0,'#f58f79');
  text(ctx,'N',367+tip*32,94,'#ffc6a8',14);
  text(ctx,'Gold: conventional current',166,174,gold,13);text(ctx,'Teal: field inside coil',166,195,teal,13);text(ctx,'Compass',367,187,ink);
  text(ctx,'North-seeking tip: '+(east?'east':'west'),240,233);
 }
 function draw(canvas,topic,settings,result=null,progress=0){
  const ctx=canvas.getContext('2d');
  box(ctx,0,0,width,height,'#142731');
  if(topic===0)paper(ctx,settings.layout,settings.x,settings.y,result);
  if(topic===1)circuit(ctx,settings,result.amps);
  if(topic===2)induction(ctx,settings,result,progress);
  if(topic===3)magnetics(ctx,settings.polarity);
 }
 function pick(event,canvas){
  const bounds=canvas.getBoundingClientRect();
  return {
   x:Math.max(0,Math.min(cols-1,Math.round(((event.clientX-bounds.left)/bounds.width*width-left)/cell))),
   y:Math.max(0,Math.min(rows-1,Math.round(((event.clientY-bounds.top)/bounds.height*height-top)/cell)))
  };
 }
 return {width,height,cols,rows,paperReading,draw,pick};
})();
