'use strict';

const questExtras=(()=>{
 const entries={
  cow:{name:'Spherical Cow',place:'Alder Orchard',x:96,y:251,room:()=>14,
   note:'An idealized model keeps the features needed for a calculation. This model keeps the cow’s size and leaves out its shape and legs.'},
  sled:{name:'Frictionless Sled',place:'Track booth',x:199,y:246,room:()=>plans[1].room,
   note:'With zero net horizontal force, the sled keeps its velocity. The frictionless track is an idealization.'},
  glove:{name:'Right-Hand Glove',place:'Magnetics Study',x:145,y:198,room:()=>observatory.floors[3].side,
   note:'Curl the fingers of your right hand in the direction of conventional current around the coil. Your thumb points along the field inside.'},
  spectrum:{name:'Hidden Spectral Signature',place:'Observatory telescope',room:()=>observatory.lobby,
   note:'The signal dips at 486 and 656 nm. Both wavelengths match lines in the hydrogen reference.'},
  'archive-spectrum':{name:'Nacre Spectrum Match',place:'Nacre Landing',
   note:'Nacre’s reference and the telescope both show dips at 486 and 656 nm, consistent with hydrogen absorption.'},
  crate:{name:'Schrödinger’s Shipping Crate',place:'Nacre Landing',x:524,y:243,room:()=>observatory.offworld,
   note:'Schrödinger used a cat in a thought experiment about how quantum outcomes become definite when measured. The archive has supplied a plush cat.'}
 };
 const telescopeDips=[486,656];
 const references=[['Helium',[447,588]],['Hydrogen',[486,656]],['Sodium',[589.0,589.6]]];
 const known=id=>Object.hasOwn(entries,id);
 function fixture(room){
  return Object.entries(entries).find(([id,entry])=>entry.room?.()===room&&Number.isFinite(entry.x));
 }
 function point(room){
  const found=fixture(room);
  if(!found)return null;
  const [id,{x,y}]=found;
  return {id,x,y};
 }
 function draw(room,found,{rect,label}){
  const target=point(room);
  if(!target)return;
  const {id,x,y}=target;
  rect(x-13,y-5,26,8,'#172633');
  rect(x-10,y-16,20,13,id==='crate'?'#9e775a':id==='sled'?'#7b8295':id==='glove'?'#ab8b5d':'#5e6a4c');
  rect(x-8,y-15,16,2,'#e7ca85');
  label(found.has(id)?'✓':'✦',x,y-20,'#efce83',11);
 }
 function log(id){
  if(curiosities.has(id))return;
  curiosities.add(id);
  saveProgress();
  music.playDiscoveryCue();
 }
 function list(found){
  return '<ul class="journal-checks">'+Object.entries(entries).filter(([id])=>found.has(id)).map(([,entry])=>
   '<li><strong>'+entry.name+'</strong> · '+entry.place+'<br>'+entry.note+'</li>').join('')+'</ul>';
 }
 function show(id,leave=close){
  const entry=entries[id];
  let changed=false;
  let feedback='';
  function panel(text,visual,actions=[]){
   dialog('<h2>'+entry.name+'</h2><p>'+text+'</p>'+visual+
    '<div class="choices" id="curiosity-actions"></div><hr><button id="dismiss">Back</button>',{focus:false});
   $('sheet').classList.add('curiosity-sheet');
   actions.forEach(([label,action],i)=>button($('curiosity-actions'),label,action,i===0?'gold':''));
   $('dismiss').onclick=leave;
   setChoice(0);
  }
  function render(){
   if(id==='cow'){
    panel('An orchard survey tag reads “Assumption 1: neglect the legs.”',
     '<div class="curiosity-track" role="img" aria-label="A spherical cow rolling from the orchard"><span class="rolling-cow"></span></div><p>'+entry.note+'</p>',
     [['Watch it roll again',render]]);
   }else if(id==='sled'){
    panel(changed?'Still waiting for it to stop. The model sled coasts at constant speed.':'A spare sled has a test label marked μ = 0.',
     '<div class="curiosity-track" role="img" aria-label="A sled on a horizontal track"><span class="model-sled'+(changed?' coasting':'')+'">μ = 0</span></div>',
     [[changed?'Reset the sled':'Nudge the sled',()=>{changed=!changed;render();}]]);
   }else if(id==='glove'){
    const heading=changed?'West':'East';
    const current=changed?'Clockwise':'Counterclockwise';
    panel('View from the east end of the coil. '+entry.note,
     '<div class="glove-reading"><strong>'+current+' current</strong><span aria-hidden="true">'+(changed?'↻　☚':'↺　☛')+'</span><strong>Thumb and field point '+heading.toLowerCase()+'</strong></div>',
     [['Reverse current',()=>{changed=!changed;render();}]]);
   }else if(id==='spectrum'||id==='archive-spectrum'){
    const atNacre=id==='archive-spectrum';
    const done=curiosities.has(id);
    const match=(name,lines)=>()=>{
     if(telescopeDips.every(nm=>lines.includes(nm))){log(id);feedback='Matched: '+name.toLowerCase()+'.';}
     else feedback='Those reference lines do not match both dips.';
     render();
    };
    const line=(nm)=>(nm-400)/3+'%';
    const prompt=atNacre?'The archive catalog has three reference spectra. Which one matches both dips from your telescope observation?':
     'Identify the reference with absorption lines at both measured wavelengths.';
    panel(prompt,
     '<div class="spectrum-strip" role="img" aria-label="Spectrum with absorption dips at 486 and 656 nanometres">'+
      telescopeDips.map(nm=>'<span style="left:'+line(nm)+'"></span>').join('')+'</div>'+
      '<p>Telescope dips: '+telescopeDips.join(' nm and ')+' nm.</p><p role="status">'+(feedback||(done?entry.note:''))+'</p>',
     done?[]:references.map(([name,lines])=>[name+' · '+lines.join(' and ')+' nm',match(name,lines)]));
   }else{
    panel(changed?entry.note:'Two labels on the sealed crate read “Delivered” and “In transit.”',
     '<div class="archive-crate" role="img" aria-label="'+(changed?'Sleeping plush cat in an open crate':'Sealed shipping crate')+'">'+(changed?'<span class="plush-cat"></span><span class="cat-sleep">z z z</span>':'<span class="crate-lid"></span>')+'</div>',
     changed?[]:[['Open the crate',()=>{changed=true;log(id);render();}]]);
   }
  }
  if(['cow','sled','glove'].includes(id))log(id);
  if(id==='crate')changed=curiosities.has(id);
  render();
 }
 return {known,point,draw,list,show};
})();
