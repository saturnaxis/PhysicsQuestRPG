'use strict';

// Each row gives the atlas x, y, width and height, then the room x, y and base y. A final true draws a freestanding sprite.
// Coordinates use the room art's native resolution (360 by 180).
const foregroundRegions={
 0:[
  [0,97,34,40,12,29,69],
  [34,97,34,40,52,40,80],
  [68,97,34,40,243,9,49],
  [68,97,34,40,326,64,104,true],
  [68,97,34,40,320,123,163],
  [34,97,34,40,11,125,165],
 ],
 9:[
  [102,0,17,13,20,29,69],
  [119,0,30,32,319,10,50],
  [68,0,34,40,320,123,163],
  [68,0,34,40,11,125,165],
 ],
 10:[
  [0,0,34,40,12,29,69],
  [34,0,34,40,52,40,80],
  [0,0,34,40,81,14,54],
  [34,0,34,40,106,120,160],
  [68,0,34,40,146,32,72],
  [0,0,34,40,171,128,168],
  [34,0,34,40,205,27,67],
  [34,0,34,40,232,56,96],
  [68,0,34,40,267,10,50,true],
  [68,0,34,40,326,61,101,true],
  [149,0,34,40,320,123,163],
  [68,0,34,40,11,125,165],
 ],
 11:[
  [0,0,34,40,12,29,69],
  [34,0,34,40,52,40,80],
  [0,0,34,40,81,14,54],
  [34,0,34,40,106,120,160],
  [34,0,34,40,205,27,67],
  [34,0,34,40,232,56,96],
  [68,0,34,40,281,30,70],
  [68,0,34,40,317,10,50],
  [68,0,34,40,320,123,163],
  [68,0,34,40,11,125,165],
 ],
 12:[
  [0,40,46,25,74,24,49],
  [46,40,48,25,116,37,62],
  [0,40,46,25,181,58,83],
  [0,40,46,25,240,31,56],
  [0,40,46,25,294,50,75],
 ],
 13:[
  [94,40,55,57,244,29,86],
 ],
 14:[
  [0,0,34,40,12,29,69],
  [183,0,32,40,53,40,80],
  [215,0,34,40,81,14,54],
  [34,0,34,40,106,120,160],
  [249,0,34,40,146,32,72],
  [0,0,34,40,171,128,168],
  [283,0,34,40,205,27,67],
  [317,0,32,40,234,56,96],
  [349,0,31,40,284,30,70],
  [68,0,34,40,317,10,50],
  [68,0,34,40,320,123,163],
  [68,0,34,40,11,125,165],
  [149,40,23,25,46,32,51],
  [149,40,23,25,80,32,51],
  [149,40,23,25,114,32,51],
  [149,40,23,25,148,32,51],
  [149,40,23,25,182,32,51],
  [149,40,23,25,216,32,51],
  [172,40,23,26,46,54,74],
  [172,40,23,26,80,54,74],
  [172,40,23,26,114,54,74],
  [172,40,23,26,148,54,74],
  [172,40,23,26,182,54,74],
  [172,40,23,26,216,54,74],
  [195,40,23,24,46,77,97],
  [195,40,23,24,80,77,97],
  [195,40,23,24,114,77,97],
  [195,40,23,24,148,77,97],
  [195,40,23,24,182,77,97],
  [195,40,23,24,216,77,97],
  [218,40,45,38,251,47,85],
 ],
 16:[
  [263,40,24,26,59,115,141],
 ],
};

// The trunk, rather than the full canopy, occupies ground the player cannot walk on.
const northTrail={0:{left:594,right:658,start:52,end:223},10:{left:594,right:658,start:0,end:160}};
const treeCounts={0:6,9:4,10:12,11:10,14:12};
const treeTrunks=Object.fromEntries(Object.entries(treeCounts).map(([id,count])=>[
 id,foregroundRegions[id].slice(id==='9'?1:0,count).map(([, ,width, ,left, ,base])=>[left*2+width,base*2-8])
]));
function clearTrail(room,x,y){
 const trail=northTrail[room];
 if(trail&&y<=trail.end&&x>=trail.left&&x<=trail.right)return true;
 return Math.abs(y-245)<=19&&(x<=91||x>=650);
}
function treeCollision(room,x,y){
 if(!treeTrunks[room]||clearTrail(room,x,y))return false;
 return treeTrunks[room].some(([tx,ty])=>(x-tx)**2/100+(y-ty)**2/64<1);
}

const meadowDetails={
 0:[[72,165],[112,194],[201,61],[367,59],[522,59],[676,168],[164,294],[383,285],[549,303]],
 9:[[88,78],[212,77],[494,65],[597,147],[149,203],[535,188],[203,291],[385,302],[604,296]],
 10:[[147,157],[268,210],[317,128],[407,188],[514,222],[676,195],[107,285],[377,278],[484,304]],
 11:[[117,168],[252,173],[286,203],[409,206],[454,161],[569,229],[238,285],[427,309],[597,307]],
 14:[[147,216],[270,218],[335,205],[457,213],[604,199],[113,280],[286,296],[435,302],[538,293]]
};
const desertDetails={
 12:[[81,153],[151,191],[241,175],[303,202],[428,219],[541,178],[663,199],[231,278],[443,307]],
 13:[[83,184],[157,218],[273,162],[374,205],[450,173],[633,154],[200,284],[416,297],[544,282]],
 15:[[96,158],[200,161],[282,205],[387,183],[492,179],[574,160],[128,293],[344,298],[468,276]]
};

function drawTrailClearance(room,{rect}){
 const trail=northTrail[room];
 if(trail){
  const {left,right,start,end}=trail;
  rect(left,start,right-left,end-start,'#766d56');
  rect(left+4,start,right-left-8,end-start,'#9a8b6b');
  for(let y=71;y<end-5;y+=23){
   rect(604+y%11,y,12,2,'#ac9a76');
   rect(640-y%8,y+11,6,2,'#857a60');
  }
 }
 if(room===11){
  rect(325,225,68,42,'#674f3d');
  rect(326,228,66,36,'#be9868');
  for(let x=332;x<391;x+=8)rect(x,228,2,36,'#8d684c');
  rect(322,225,73,3,'#d6ae7b');rect(322,264,73,3,'#927155');
 }
}

function drawBackdropDetails(room,{rect,line},style,tint){
 if(style==='outdoor'){
  const desert=desertDetails[room];
  for(const [i,[x,y]] of (desert||meadowDetails[room]||[]).entries()){
   if(desert){
    rect(x-4,y+2,15,3,'#9a7657');rect(x,y-1,7,4,'#bd9871');
    rect(x+1,y-2,4,2,'#d2ae83');rect(x+13,y+3,3,2,'#d2ae83');
    if(i%3===0){line(x+19,y+4,x+16,y-3,'#776747',2);line(x+19,y+4,x+23,y-2,'#8f7852',2);}
   }else{
    rect(x-8,y+1,18,3,'#344b3e');
    for(const dx of [-7,0,7]){
     line(x+dx,y+2,x+dx-2,y-4-(i+dx)%3,'#779275',1);
     rect(x+dx-2,y-5,3,2,i%3===0?'#dbbc85':i%3===1?'#9faf84':'#b78d82');
    }
   }
  }
  return;
 }

 // Wall hangings and fittings sit above the walkable floor and behind the apparatus.
 const x=style==='shed'?370:style==='observatory'?102:style==='nacre'?92:285+room%3*42;
 const y=style==='shed'?60:style==='observatory'||style==='nacre'?20:17;
 const color=tint||(style==='nacre'?'#6e627c':'#85704e');
 if(style==='shed'){
  for(const left of [x,466,561]){
   rect(left,y,49,19,'#443630');rect(left+2,y-2,45,3,'#a27550');
   for(let peg=0;peg<3;peg++){
    const px=left+9+peg*13;
    rect(px,y+4,3,10,'#c2a180');rect(px-2,y+3,7,3,'#7a8381');
   }
  }
 }else if(style==='observatory'||style==='nacre'){
  for(const left of [x,608]){
   rect(left-22,y-8,44,26,'#26333e');
   rect(left-20,y-6,40,2,color);
   for(let row=0;row<3;row++)rect(left-14,y+row*4,28-row*4,1,'#6b8792');
   rect(left+11,y+3,4,3,color);
  }
 }else{
  for(const left of [x,x+52]){
   rect(left-10,y-4,20,25,'#293132');rect(left-9,y-5,18,3,'#ac8d62');
   rect(left-7,y,14,16,color);
   line(left-4,y+12,left+4,y+3,'#c5ab7e',1);
   rect(left-1,y+4,2,8,'#d9c297');
  }
 }
}

// Keep the existing walkable floor and door coordinates when repainting the hall.
function drawSandstoneHall({rect,line},lit){
 const light=lit?'#f3c586':'#b79b75';
 rect(0,0,720,360,'#302a2b');
 for(let y=61;y<328;y+=23){
  const offset=y%2===0?0:24;
  for(let x=16-offset;x<720;x+=48){
   rect(x,y,47,22,(x+y)%3?'#765b4a':'#826753');
   rect(x,y,46,2,'#9a7a5e');rect(x,y+20,46,2,'#5d463c');
  }
 }
 rect(0,0,720,45,'#a28260');rect(0,43,720,13,'#594236');
 rect(0,55,720,8,'#3f3230');
 for(const x of [33,472,688]){
  rect(x,8,24,53,'#67503f');rect(x,11,20,42,'#b0936a');
  rect(x-3,51,30,9,'#ccab7c');rect(x-3,61,30,7,'#523b33');
 }
 rect(154,103,280,91,'#523d3b');rect(160,107,268,80,'#75464b');
 for(let i=0;i<9;i++)line(178+i*29,178,183+i*29,112,'#99625b',2);
 rect(164,182,260,2,light);
 line(76,21,434,21,'#503f37',8);line(76,20,434,20,light,3);
 for(const x of [103,400]){
  rect(x-15,19,30,31,'#765458');rect(x-15,18,30,3,light);
  rect(x-8,27,16,12,'#a87659');line(x-4,34,x+4,29,light,2);
 }
 rect(0,327,720,33,'#4c3934');rect(0,327,720,5,'#937455');
}

function drawWaterGlints(room,{rect},t){
 const bright=(i)=>(Math.floor(t*2)+i)%2===0;
 const glint=(x,y,i)=>{
  rect(x,y,bright(i)?11:7,2,bright(i)?'#b7e1d7ab':'#86b0ac67');
  if(bright(i))rect(x+3,y+2,3,2,'#c0e2d662');
 };
 if(room===9){
  for(let i=0;i<9;i++){
   const x=14+i*73;
   if(x>392&&x<448)continue;
   glint(x,99+i*19%69,i);
  }
  return;
 }
 for(const x of [334,377]){
  for(let i=0;i<7;i++){
   const y=(i*54+x%11)%360;
   if(y>216&&y<278)continue;
   glint(x+i%3*3,y,i);
  }
 }
}

function drawObservatoryLobbyBackdrop({rect,line},lit,painted){
 if(!painted){
  rect(32,47,653,16,'#26334c');
  rect(39,62,638,8,'#142639');
  for(const x of [75,576]){
   rect(x,77,73,52,'#172539');rect(x+4,80,65,43,'#2f4663');
   for(const [dx,dy] of [[11,12],[26,29],[35,13],[58,24],[45,39]]){
    line(x+dx-2,77+dy,x+dx+2,77+dy,'#bfdfd5',1);
    rect(x+dx,76+dy,1,4,'#bfdfd5');
   }
   for(const [x1,y1,x2,y2] of [[11,12,35,13],[35,13,58,24],[26,29,45,39]])line(x+x1,77+y1,x+x2,77+y2,'#738eab',1);
   rect(x+4,123,65,3,'#698593');
  }
 }
 const conduit=lit?'#9de8ce':'#4d7d91';
 for(const x of [56,664]){
  line(x,58,x,139,'#14232e',6);line(x,58,x,139,conduit,2);
  rect(x-4,76,9,4,'#718b98');rect(x-4,111,9,4,'#718b98');
 }
}

function drawSteam({rect},x,y,t,clearing=0){
 for(let i=0;i<5;i++){
  const phase=(t*.65+i*.21)%1;
  if(clearing>phase)continue;
  const lift=Math.round(phase*24);
  rect(x+Math.round(Math.sin(i+phase*4)*9),y-lift,8-lift/5,3,'#cbe2db60');
 }
}

function wallBaseShadow({rect},y,left=0,width=720){
 rect(left,y,width,2,'#15121b4c');
 rect(left,y+2,width,2,'#18141c36');
 rect(left,y+4,width,3,'#18141c20');
}

function dustPuff({rect},x,y,progress,heading=1){
 if(progress<0||progress>=1)return;
 for(let i=0;i<6;i++){
  const age=progress-i*.055;
  if(age<0)continue;
  const drift=heading*(4+22*age)+((i*7)%11)-5;
  const lift=2+age*(8+i);
  const size=age<.35?4:2;
  rect(x+drift,y-lift,size,size,age>.52?'#b5996959':'#e4c49290');
 }
}

function drawHallWayfinding({rect,label},confirmed){
 for(const [x,name] of [[63,'Friction track'],[657,'Force calibration']]){
  rect(x-58,187,116,20,'#40312f');
  rect(x-56,188,112,2,'#b99866');
  label(name,x,201,'#ffe8bd',10);
 }
 rect(562,55,126,30,'#40312f');
 rect(564,56,122,2,'#b99866');
 label('Stairs · 2 repairs',625,68,'#ffe8bd',10);
 for(const [i,x] of [[1,612],[2,627]]){
  rect(x,72,11,10,'#272731');
  label(confirmed.has(i)?'✓':'○',x+5,81,confirmed.has(i)?'#bcebb3':'#e5c686',10);
 }
}
