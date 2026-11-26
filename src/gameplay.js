'use strict';

const adventure = (() => {
 const bounds = {left:40,right:678,top:61,bottom:307};
 const foot = [[0,0],[-4,0],[4,0],[0,-3],[0,3]];
 const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

 function movement(x,y) {
  const length = Math.hypot(x,y);
  return length ? {x:x/length,y:y/length} : {x:0,y:0};
 }

 function face(previous,x,y) {
  if (!x && !y) return previous;
  if (x && y && ((previous==='east'&&x>0)||(previous==='west'&&x<0)||
     (previous==='north'&&y<0)||(previous==='south'&&y>0))) return previous;
  return x ? (x>0?'east':'west') : (y>0?'south':'north');
 }

 function walkable(x,y,blocked,people=[]) {
  return foot.every(([dx,dy])=>!blocked(x+dx,y+dy)) &&
   people.every(person=>((x-person.x)/15)**2+((y-person.y)/11)**2>=1);
 }

 function move(player,direction,distance,canStand) {
  const segments=Math.max(1,Math.ceil(distance/3));
  const dx=direction.x*distance/segments,dy=direction.y*distance/segments;
  const startX=player.x,startY=player.y;
  player.facing=face(player.facing,direction.x,direction.y);
  for(let i=0;i<segments;i++){
   const x=clamp(player.x+dx,bounds.left,bounds.right),y=clamp(player.y+dy,bounds.top,bounds.bottom);
   if(dx&&canStand(x,player.y))player.x=x;
   if(dy&&canStand(player.x,y))player.y=y;
  }
  player.walking=Math.hypot(player.x-startX,player.y-startY)>.05;
 }

 function entry(point,canStand) {
  for(let step=0;step<=48;step+=6){
   const offsets=step?[0,step,-step]:[0];
   for(const offset of offsets){
    const inward=34+step;
    const x=point.x-point.dx*inward+point.dy*offset;
    const y=point.y-point.dy*inward+point.dx*offset;
    if(x>=bounds.left&&x<=bounds.right&&y>=bounds.top&&y<=bounds.bottom&&canStand(x,y))return {x,y};
   }
  }
  return null;
 }

 function interaction(player,targets) {
  const directions={east:[1,0],west:[-1,0],north:[0,-1],south:[0,1]};
  const [fx,fy]=directions[player.facing]||directions.south;
  let best=null, score=Infinity;
  for(const target of targets){
   if(!target.point)continue;
   const dx=target.point.x-player.x,dy=target.point.y-player.y;
   const distance=Math.hypot(dx,dy);
   if(distance>target.radius)continue;
   const alignment=distance?(dx*fx+dy*fy)/distance:1;
   if(distance>23&&alignment<-.12)continue;
   const rank=distance-11*alignment-(target.priority||0);
   if(rank<score){best=target;score=rank;}
  }
  return best;
 }

 function state({onTitle,modal,choosing,busy,avatar,transitioning}) {
  if(modal)return 'overlay';
  if(onTitle||!avatar)return 'title';
  if(transitioning)return 'transition';
  if(busy)return 'experiment';
  return choosing?'apparatus':'exploration';
 }

 return {movement,face,walkable,move,entry,interaction,state};
})();
