'use strict';

const observatory = (() => {
 const lobby = 24;
 const entrance = {x:542,y:175};
 const exteriorSpawn = {x:542,y:203,facing:'south'};
 const exit = {x:625,y:307};
 const entry = {x:625,y:268,facing:'north'};
 const station = {x:359,y:184};
 const telescopeSpawn = {x:359,y:213,facing:'north'};
 const technician = {name:'Technician Vega',x:499,y:216,coat:'#617e91',hair:'#463648'};
 const gold='#f1ce81', teal='#8ee0ca', warm='#ec9c7d';
 const rail={west:164,east:553,start:233,end:484,y:247};
 const gears={slow:{seconds:.40,travel:2.8},fast:{seconds:.20,travel:1.4}};
 const turns=[10,20];
 const chargeSlots=['west','east'];
 const ends=['east','west'];
 const sectors=[{name:'East ridge',strength:18},{name:'Archive coordinates',strength:68},{name:'South rim',strength:27}];
 const bands=[{name:'Low',strength:64},{name:'Center',strength:96},{name:'High',strength:73}];
 const sources=['Study','Repair','Practice'];
 const floors = [
  {
   name:'Charge Laboratory', study:'Field Study', topic:'Charges and electric fields', device:'Field steering bench', system:'Dust shield', tint:'#547b78',
   task:'Test one eastward contribution, then combine two to steer positive test particles into the collector.',
   notes:'At the midpoint, the electric field points away from positive charges and toward negative charges. Equal arrows pointing in opposite directions cancel.',
   evidence:'The positive charge on the west and the negative charge on the east both contribute an eastward field at the probe.',
   debrief:{
    question:'Why did adding a second cell send the particles farther east?',
    labels:['One eastward contribution','Two eastward contributions'],
    explanation:'At the probe, the field points away from the west positive cell and toward the east negative cell. Both contributions point east and add.',
    misconception:'The west positive cell and east negative cell make equal fields that cancel because their charges have opposite signs.',
    alternative:'Only the west cell contributes. The east cell changes the starting position of the particles.',
    hint:'Compare where the particles landed. The short mark and the collector are in the same direction from the source. Which way did each cell’s field point?'
   }
  },
  {
   name:'Circuit Workshop', study:'Circuit Records', topic:'Basic circuits and Ohm’s law', device:'Power supply bench', system:'Instrument supply', tint:'#858354',
   task:'Supply 2 A to the 12 V instrument circuit.',
   notes:'An open switch breaks the loop, so current is zero. With the switch closed, divide voltage by resistance to find the current in the series loop. At fixed voltage, more resistance means less current.',
   evidence:'Bridging the wiring gap and closing the breaker through a 6 Ω resistor gives 2 A at 12 V, following I = V/R.',
   debrief:{
    question:'Why did the current change when you completed the 6 Ω circuit?',
    labels:['Breaker open','Breaker closed'],
    explanation:'The bridge and breaker completed the loop. Dividing the fixed 12 V by 6 Ω gives 2 A.',
    misconception:'The resistor set the current to 2 A on its own, even if the breaker was open.',
    alternative:'Closing the breaker increased the battery voltage while the resistance stayed fixed.',
    hint:'Look at the breaker and bridge settings. An open loop gives the charge no path around the circuit. For a complete loop, compare the meter to I = V/R.'
   }
  },
  {
   name:'Induction Lab', study:'Coil Archive', topic:'Faraday’s law and coils', device:'Induction bench', system:'Generator', tint:'#9e6d57',
   task:'Compare both gears with the same coil, then deliver a 6 V pulse to the generator.',
   notes:'The two coil banks have 10 and 20 turns. The flux per turn changes by 0.06 Wb between the sensors. Multiply that change by the number of turns and divide by the measured transit time to find the average induced voltage magnitude. The meter displays model time. The generator rectifies the pulse, so either sign works at the required magnitude.',
   evidence:'The fast gear crosses the sensors in 0.20 s. A change of 0.06 Wb per turn across 20 turns induces a voltage with magnitude 6 V.',
   debrief:{
    question:'For the same coil, why did the faster pass produce a larger voltage magnitude?',
    labels:['Slow pass','Fast pass'],
    explanation:'The fast pass made the same flux change per turn in less time. Halving the transit time doubled the voltage magnitude.',
    misconception:'The fast gear increased the flux change between the same two markers. The transit time had no effect on the voltage.',
    alternative:'The fast gear added turns to the selected coil bank while the carriage was moving.',
    hint:'Compare the transit times and the sizes of the voltages. The sign shows travel direction. The same coil and markers give the same flux change.'
   }
  },
  {
   name:'Magnetic Dome', study:'Magnetics Study', topic:'Magnetic fields', device:'Compass relay', system:'Telescope tracking', tint:'#777aa9',
   task:'Compare both current directions at the reference dock. Bring the compass to the relay dock and lock the relay with a westward field.',
   notes:'Curl the fingers of your right hand with the conventional current around the coil. Your thumb points along the field inside. At the compass dock on the coil axis, the north-seeking tip aligns with the local field. Reversing the current reverses the field.',
   evidence:'Reversing the coil current reverses the field at the compass dock. West is the tracking relay’s target.',
   debrief:{
    question:'How did reversing the current change the compass reading, and why did the relay lock?',
    labels:['Reference dock · Current A','Reference dock · Current B'],
    explanation:'Reversing the current reversed the coil field. The compass’s north-seeking tip pointed west at the relay dock, matching its target.',
    misconception:'The current reversal made the field stronger without changing its direction. The compass still pointed east.',
    alternative:'The heading changed because the compass was carried to a different dock, regardless of the current.',
    hint:'Compare east and west at the same reference dock. Then check which heading at the relay dock matched its target.'
   }
  }
 ].map((floor,i)=>({...floor,index:i,room:lobby+1+i,side:lobby+5+i,studyDoor:i%2?'east':'west'}));
 const secret=lobby+9, offworld=secret+1;
 const rooms=[{name:'Observatory Lobby',floor:'Ground floor'},
  ...floors.map((f,i)=>({name:f.name,floor:'E&M Observatory · Floor '+(i+1)})),
  ...floors.map((f,i)=>({name:f.study,floor:'E&M Observatory · Floor '+(i+1)})),
  {name:'Signal Chamber',floor:'Hidden chamber'},
  {name:'Nacre Landing',floor:'Nacre · Archive world'}];
 const studies=[
  {
   prediction:'Before you move the probe, where do you expect the field to be stronger?',
   question:'Where was the local field stronger on the conductive paper?',
   choices:['Where equal-voltage lines were closer together.','Where the voltage was highest.','Where the voltage was closest to zero.'],
   answer:0,
   feedback:'Closer lines mean the voltage changes more over the same distance. Try comparing the spacing and field strength on the same sheet.'
  },
  {
   prediction:'Predict what the ammeter will show if you open the breaker and keep the same resistor.',
   question:'What happens to current when the breaker opens?',
   choices:['It stays the same because the resistor is still connected.','It drops to zero because the loop is broken.','It reverses direction through the resistor.'],
   answer:1,
   feedback:'The open switch breaks the current path. Compare both breaker settings with the same resistor.'
  },
  {
   prediction:'Try the same coil bank at both speeds. Which pass do you expect to make the larger voltage pulse?',
   question:'What changes when the magnet crosses the same two gates faster?',
   choices:['The voltage pulse gets larger in magnitude.','The voltage pulse stays the same.','The voltage pulse gets smaller in magnitude.'],
   answer:0,
   feedback:'The same change in magnetic flux takes less time. Hold the coil bank and travel direction fixed to compare the two speeds.'
  },
  {
   prediction:'Watch the compass’s north tip. Where do you expect it to point after you reverse the current?',
   question:'What does reversing the coil current do to the compass?',
   choices:['The north tip keeps pointing the same way.','The north tip swings to the opposite side.','The needle points at right angles to its previous heading.'],
   answer:1,
   feedback:'Reversing the current reverses the coil field. Watch the north tip turn to follow it.'
  }
 ];
 // Milestones are optional study progress. Repair gates still use the lab reports.
 const events=fieldEvents.create([
  ...floors.flatMap(({index,side})=>[
   {trigger:'enter',once:'study-visit-'+index,when:({room})=>room===side,steps:['invite']},
   {trigger:'reading',once:'study-reading-'+index,when:({room})=>room===side,steps:['save']},
   {trigger:'answer',once:'study-prediction-'+index,when:({room,evidence})=>room===side&&!evidence,steps:['save','studyReply']},
   {trigger:'answer',once:'study-followup-'+index,when:({room,choice,evidence})=>room===side&&evidence&&choice===studies[index].answer,steps:['save','studyReply']}
  ]),
  ...floors.map(({index,room})=>({trigger:'repair',once:'repair-scene-'+index,when:context=>context.room===room,steps:['repairScene']})),
  {trigger:'answer',when:({floor,room})=>floor?.side===room,steps:['save','studyReply']},
  {trigger:'talk',when:({room,person})=>floorFor(room)?.side===room&&person?.studyGuide,steps:['study']},
  {trigger:'talk',when:({room,person,state})=>{
   const floor=floorFor(room);
   return floor?.room===room&&person?.name===residents[room][0].name&&awaitingReport(state,floor.index);
  },steps:['debrief']}
 ]);
 function dispatch(trigger,room,state,actions,details={}){
  const floor=floorFor(room);
  const evidence=floor&&state.observations[floor.index].some(row=>row.source==='Study');
  if(trigger==='answer'&&floor?.side===room&&!evidence)state.predictions[floor.index]=details.choice;
  return events.dispatch(trigger,{...details,room,state,floor,evidence},state.eventProgress,actions);
 }
 function studyAnswered(id,state){
  const floor=floorFor(id);
  return floor?.side===id&&state.eventProgress.includes('study-followup-'+floor.index);
 }
 const passages=[...floors.flatMap(floor=>[
  [floor.room-1,'north',floor.room,[]],
  [floor.room,floor.studyDoor,floor.side,[]]
 ]),[lobby,'east',secret,[]],[secret,'north',offworld,[]]];
 const inside=id=>id>=lobby&&id<lobby+rooms.length;
 const floorFor=id=>floors.find(f=>f.room===id||f.side===id);
 const studyDefaults=[
  {layout:'bars',x:14,y:8},
  {resistor:12,linked:true,on:true},
  {bank:10,gear:'slow',direction:1},
  {polarity:1}
 ];
 const fresh=()=>({intro:false,notes:[],reports:{},aligned:false,sector:null,contact:false,arrived:false,archived:false,carry:null,observations:[[],[],[],[]],eventProgress:[],predictions:{},studySettings:studyDefaults.map(settings=>({...settings})),signals:{sectors:[],bands:[]},
  charge:{west:null,east:null,held:false,single:false},circuit:{resistor:null,linked:false,on:false},
  induction:{gear:'slow',turns:10,end:'west',trials:{},last:null,targetReading:null},
  coil:{polarity:1,seen:0,compass:false,dock:null}});
 const done=(state,index)=>Boolean(state.reports[index]);
 const powered=state=>floors.every(f=>done(state,f.index));
 const confirmed=(state,index)=>state.reports[index]?.confirmed===true;
 const awaitingReport=(state,index)=>done(state,index)&&!confirmed(state,index);
 const nextFloor=state=>floors.find(f=>!confirmed(state,f.index));
 const ready=state=>!nextFloor(state);
 function restore(data){
  const state=fresh();
  state.intro=data?.intro===true;
  const progress=Array.isArray(data?.eventProgress)?data.eventProgress.map(id=>
   typeof id==='string'?id.replace(/^study-answer-/,'study-prediction-'):id):[];
  state.eventProgress=events.restore(progress);
  for(const [index,study] of studies.entries()){
   const prediction=data?.predictions?.[index];
   if(Number.isInteger(prediction)&&study.choices[prediction])state.predictions[index]=prediction;
  }
  const knownSettings=[
   {layout:['bars','dots'],x:Array.from({length:29},(_,i)=>i),y:Array.from({length:17},(_,i)=>i)},
   {resistor:[4,6,12],on:[true,false]},
   {bank:turns,gear:Object.keys(gears),direction:[1,-1]},
   {polarity:[1,-1]}
  ];
  for(const [index,allowed] of knownSettings.entries()){
   for(const [key,values] of Object.entries(allowed)){
    const value=data?.studySettings?.[index]?.[key];
    if(values.includes(value))state.studySettings[index][key]=value;
   }
  }
  for(const floor of floors){
   if(Array.isArray(data?.notes)&&data.notes.includes(floor.index))state.notes.push(floor.index);
   const observations=data?.observations?.[floor.index];
   if(Array.isArray(observations)){
    for(const row of observations){
     if(sources.includes(row?.source)&&typeof row.settings==='string'&&row.settings.length<=140&&
      typeof row.reading==='string'&&row.reading.length<=140)record(state,floor.index,row.source,row);
    }
   }
   const report=data?.reports?.[floor.index];
   if(report?.complete===true||(Number.isInteger(report?.prediction)&&report.prediction>=0&&report.prediction<(floor.index===3?2:3))){
    // Older saves unlocked stairs as soon as a repair passed.
    state.reports[floor.index]={complete:true,confirmed:report.confirmed!==false,reading:typeof report.reading==='string'?report.reading:null};
   }
  }
  if(ready(state)&&Number.isInteger(data?.sector)&&sectors[data.sector])state.sector=data.sector;
  if(ready(state)){
   for(const [kind,options] of Object.entries({sectors,bands})){
    const samples=data?.signals?.[kind];
    if(Array.isArray(samples))state.signals[kind]=[...new Set(samples.filter(i=>Number.isInteger(i)&&options[i]))];
   }
   if(state.sector!==null&&!state.signals.sectors.includes(state.sector))state.signals.sectors.push(state.sector);
  }
  state.aligned=ready(state)&&data?.aligned===true;
  if(state.aligned&&!state.signals.bands.includes(1))state.signals.bands.push(1);
  state.contact=state.aligned&&data?.contact===true;
  state.arrived=state.contact&&data?.arrived===true;
  state.archived=state.arrived&&data?.archived===true;
  for(const slot of chargeSlots){
   if(['+','−'].includes(data?.charge?.[slot]))state.charge[slot]=data.charge[slot];
  }
  state.charge.held=data?.charge?.held===true;
  state.charge.single=data?.charge?.single===true;
  if([4,6,12].includes(data?.circuit?.resistor))state.circuit.resistor=data.circuit.resistor;
  state.circuit.linked=data?.circuit?.linked===true;
  state.circuit.on=data?.circuit?.on===true;
  const induction=data?.induction;
  if(Object.hasOwn(gears,induction?.gear))state.induction.gear=induction.gear;
  if(turns.includes(induction?.turns))state.induction.turns=induction.turns;
  if(ends.includes(induction?.end))state.induction.end=induction.end;
  for(const bank of turns){
   const mask=induction?.trials?.[bank];
   if([1,2,3].includes(mask))state.induction.trials[bank]=mask;
  }
  if(typeof induction?.last==='string')state.induction.last=induction.last;
  if(state.induction.trials[20]&2){
   const prior=state.observations[2].findLast(row=>row.source==='Repair'&&row.settings.startsWith('20 turns · fast'));
   const saved=induction?.targetReading;
   const reading=typeof saved==='string'&&/^[+−-]?6[.]0 V in 0[.]20 s$/.test(saved)?saved:prior?.reading;
   state.induction.targetReading=reading||'6.0 V in 0.20 s';
  }
  if(data?.coil?.polarity===-1)state.coil.polarity=-1;
  if([0,1,2,3].includes(data?.coil?.seen))state.coil.seen=data.coil.seen;
  state.coil.compass=data?.coil?.compass===true;
  if(data?.coil?.dock===state.coil.polarity)state.coil.dock=state.coil.polarity;
  if(done(state,0))state.charge={west:'+',east:'−',held:false,single:true};
  if(done(state,1))state.circuit={resistor:6,linked:true,on:true};
  if(done(state,3))state.coil={polarity:-1,seen:3,compass:true,dock:-1};
  const item=data?.carry;
  if(['+','−'].includes(item)&&!done(state,0)&&!chargeSlots.some(slot=>state.charge[slot]===item))state.carry=item;
  if(!done(state,1)&&([4,6,12].includes(item)&&item!==state.circuit.resistor||item==='link'&&!state.circuit.linked))state.carry=item;
  return state;
 }
 function locked(from,to,state){
  if(from===lobby&&to===secret&&!state.aligned)return 'The stonework is fitted flush with the wall.';
  if(from===secret&&to===offworld&&!state.contact)return 'Use the signal console to establish contact and power the stargate.';
  const floor=floorFor(from);
  if(!floor||from!==floor.room||to!==floor.room+1||!floors.some(f=>f.room===to))return '';
  if(confirmed(state,floor.index))return '';
  if(awaitingReport(state,floor.index))return 'Explain the repair to '+leadName(floor)+' to unlock the north stairs.';
  return 'Restore the '+floor.system.toLowerCase()+' to unlock the north stairs.';
 }
 const field=({west,east})=>(west==='+'?1:west==='−'?-1:0)+(east==='−'?1:east==='+'?-1:0);
 const fieldName=value=>value>0?'east':value<0?'west':'zero';
 const current=({linked,on,resistor})=>linked&&on&&resistor?12/resistor:0;
 const compared=({trials})=>turns.some(bank=>trials[bank]===3);
 const partLabel=item=>typeof item==='number'?item+' Ω resistor':item==='link'?'bridge link':item+' charge cell';
 const carryLabel=item=>typeof item==='number'?item+' Ω':item==='link'?'LINK':item;
 function labStep(id,state){
  if(done(state,floorFor(id)?.index)||practice?.room===id)return null;
  if(id===inductionLab){
   const {gear,turns:bank,trials,end}=state.induction;
   const launch=end+'-launch', mask=trials[bank]||0;
   if(pass)return {text:'Watch the magnet pass through the coil.'};
   if(!compared(state.induction)){
    if(mask&(gear==='slow'?1:2))return {control:'gear',text:'Switch speed. Keep the same coil.'};
    return {control:launch,text:'Run a '+gear+' pass from the '+end+' end.'};
   }
   if(voltage(bank,gear)===6)return {control:launch,text:'Run a pass from the '+end+' end to test for 6 V.'};
   return gear==='slow'?{control:'gear',text:'Aim for 6 V. Try a faster pass.'}:
    {control:'bank',text:'Aim for 6 V. Try a coil with more turns.'};
  }
  if(id===magneticLab){
   const {compass,polarity,seen,dock}=state.coil;
   if(!compass)return {control:'compass',text:'Pick up the compass on the west side.'};
   if(seen!==3){
    if(seen&(polarity>0?1:2))return {control:'polarity',text:'Reverse the current at the west switch.'};
    return {control:'reference',text:'Read the compass at the west reference dock.'};
   }
   if(dock===-1)return {control:'align',text:'Lock the relay beside the east dock.'};
   if(polarity>0)return {control:'polarity',text:'Set current B so the compass points west.'};
   return {control:'dock',text:'Read the compass at the east relay dock.'};
  }
  return null;
 }
 function reportLead(id,state){
  const floor=floorFor(id);
  return floor?.room===id&&awaitingReport(state,floor.index)?residents[id][0]:null;
 }
 function objective(id,state){
  if(id===13)return 'Enter the observatory and inspect the telescope.';
  if(id===lobby){
   if(state.archived)return 'Expedition complete. Return through the east Signal Chamber to revisit Nacre.';
   if(state.aligned)return 'Follow the lit cable east into the hidden Signal Chamber.';
   if(ready(state))return 'All four repairs are confirmed. Use the lobby telescope to acquire the beacon.';
   const next=nextFloor(state);
   if(awaitingReport(state,next.index))return 'Return to '+next.name+' on Floor '+(next.index+1)+' to explain the repair to '+leadName(next)+'.';
   if(next.index===0)return 'Take the north stairs to the Charge Laboratory.';
   return 'Go upstairs to '+next.name+' on Floor '+(next.index+1)+' to restore the '+next.system.toLowerCase()+'.';
  }
  if(id===secret)return state.archived?'The expedition report is filed. Return to the lobby or revisit Nacre.':state.contact?'Step into the north stargate to travel to Nacre.':'Use the console to answer the incoming signal.';
  if(id===offworld)return state.archived?'Expedition complete. Explore the archive or return through the south stargate.':'Share your field report with Archivist Vela.';
  const floor=floorFor(id);
  if(id===floor.side)return 'Try the demonstration. Return to the lab through the '+(floor.studyDoor==='west'?'east':'west')+' door.';
  if(practice?.room===id)return 'Practice mode. Experiment freely, or use the practice station to restore the operating setup.';
  if(awaitingReport(state,floor.index))return 'Explain the repair to '+leadName(floor)+' to '+(floor.index===3?'clear the telescope for beacon acquisition.':'unlock the north stairs.');
  if(confirmed(state,floor.index))return (floor.index===3?'Return downstairs to the lobby telescope to acquire the beacon.':
   'Take the north stairs to Floor '+(floor.index+2)+'.');
  switch(floor.index){
   case 0:
    if(!state.charge.held)return 'Ask Mira to hold the safety plate.';
    return state.charge.single?'Combine two eastward contributions and fire the particle pulse again.':'Install one cell. Fire a pulse that moves east to the short mark.';
   case 1:
    return state.circuit.linked?'Seat a resistor, close the breaker, and read the nearby meter. The load needs 2 A.':
     'With the breaker open, carry the bridge link to the break in the wiring.';
   case 2:
   case 3:
    return labStep(id,state).text;
  }
 }
 const rig=(id,x,y,label)=>({id,x,y,label});
 const positions={
  charge:{west:207,east:511,check:[359,207],rack:359,plate:[582,257]},
  circuit:{rack:558,link:[174,272],bridge:[180,202],socket:[345,240],breaker:[510,228],meter:[565,200]},
  induction:{gear:[283,202],bank:[435,202]},
  coil:{compass:[103,281],switch:[112,218],reference:[222,243],dock:[497,243],align:[570,230]}
 };
 const [chargeLab,circuitLab,inductionLab,magneticLab]=floors.map(floor=>floor.room);
 const {charge,circuit,induction,coil}=positions;
 const studyBenches=[
  {name:'Conductive paper',left:259,right:460,top:194},
  {name:'Circuit board',left:242,right:477,top:177},
  {name:'Timing-gate rail',left:218,right:492,top:197},
  {name:'Coil and compass',left:276,right:443,top:168}
 ];
 const archiveDesk={x:583,y:216};
 const stations={
  [lobby]:[rig('telescope',359,184,'Inspect the telescope')],
  [secret]:[rig('signal',359,184,'Use the signal console')],
  [offworld]:[rig('archive',archiveDesk.x,archiveDesk.y,'Compare the telescope spectrum')],
  [chargeLab]:[rig('check',...charge.check,'Fire a test pulse'),rig('west',charge.west,227,'Use west socket'),
   rig('east',charge.east,227,'Use east socket'),rig('rack',charge.rack,292,'Return charge cell'),
   rig('+',275,281,'Pick up positive cell'),rig('−',446,281,'Pick up negative cell')],
  [circuitLab]:[rig('check',...circuit.meter,'Read ammeter'),rig('bridge',...circuit.bridge,'Bridge the wiring gap'),
   rig('resistor',...circuit.socket,'Use resistor socket'),rig('breaker',...circuit.breaker,'Toggle breaker'),
   rig('rack',circuit.rack,306,'Return carried part'),rig('link',...circuit.link,'Pick up bridge link'),
   ...[4,6,12].map((n,i)=>rig(n,259+i*81,286,'Pick up '+n+' Ω resistor'))],
  [inductionLab]:[rig('west-launch',rail.west,rail.y,'Launch east'),rig('east-launch',rail.east,rail.y,'Launch west'),
   rig('west-reset',rail.west,298,'Reset carriage here'),rig('east-reset',rail.east,298,'Reset carriage here'),
   rig('gear',...induction.gear,'Change carriage gear'),rig('bank',...induction.bank,'Change coil bank')],
  [magneticLab]:[rig('compass',...coil.compass,'Pick up portable compass'),rig('polarity',...coil.switch,'Reverse coil current'),
   rig('reference',...coil.reference,'Record reference heading'),rig('dock',...coil.dock,'Read relay dock'),
   rig('align',...coil.align,'Lock the tracking relay')]
 };
 for(const floor of floors)stations[floor.side]=[rig('demo',359,247,'Use '+studyBenches[floor.index].name.toLowerCase())];
 const practiceStation=rig('practice',230,177,'Practice on repaired equipment');
 let practice=null;
 function trialState(id,state){return practice?.room===id?practice.state:state;}
 function togglePractice(id,state){
  if(practice?.room===id){cancelTrials();return false;}
  const floor=floorFor(id);
  cancelTrials();
  const setup=restore(state);
  setup.reports={};
  if(floor.index===2){
   setup.induction.trials={};
   setup.induction.targetReading=null;
   setup.induction.last=null;
  }
  if(floor.index===0)setup.charge.held=true;
  setup.carry=null;
  practice={room:id,state:setup};
  return true;
 }
 function controls(id,state){
  const floor=floorFor(id);
  const repaired=floor?.room===id&&done(state,floor.index);
  if(repaired&&practice?.room!==id){
   const available=id===circuitLab?[stations[id][0]]:[];
   if(confirmed(state,floor.index))available.unshift(practiceStation);
   return available;
  }
  const active=trialState(id,state);
  const available=(stations[id]||[]).filter(({id:control})=>{
   if(id===chargeLab){
    if(control==='rack')return active.carry!==null;
    if(['+','−'].includes(control))return ![active.charge.west,active.charge.east].includes(control);
   }
   if(id===circuitLab){
    if(control==='rack')return active.carry!==null;
    if(control==='link')return !active.circuit.linked;
    if(typeof control==='number')return active.circuit.resistor!==control;
   }
   if(id===magneticLab&&control==='compass')return !active.coil.compass;
   return true;
  });
  if(repaired)available.push({...practiceStation,label:'Finish practice'});
  return available;
 }
 const npc=(name,x,y,coat,hair,greeting,topics=[],mood)=>({name,x,y,coat,hair,greeting,topics,mood});
 const residents={
  [lobby+1]:[npc('Mira',567,274,'#9b759a','#382e40','Remember the lift at the castle? This time I can help. Can you steer the dust away from the lens while I hold the safety plate?',
   [['What is the probe measuring?','It shows which way a positive test charge would be pushed. The east sensor needs both arrows to point east.'],
    ['What if the probe shows zero?','Check whether the arrows are the same length and point in opposite directions.']], 'relieved')],
  [lobby+5]:[{...npc('Electrostatics apprentice Orin',504,208,'#8f6651','#352b3c','How could two charged cells produce zero field at the midpoint?',
   [['Can I see the contributions separately?','Yes. Each socket gets its own arrow at the probe, even when their sum is zero.']]),studyGuide:true}],
  [lobby+2]:[npc('Instrument maker Tamsin',506,278,'#ab7952','#3a2833','If the ammeter reads too high, which resistor would you try next?',
   [['Why does it read zero?','Check that the resistor is seated and the breaker is closed. Both are needed to complete the loop.']])],
  [lobby+6]:[{...npc('Circuit apprentice Elio',495,210,'#5b9394','#5d3a2e','What would happen to the current if you doubled the resistance at the same voltage?',
   [['What does the loom need?','The instrument supply needs 2 A. The breaker allows you to test each resistor on the same 12 V supply.']]),studyGuide:true}],
  [lobby+3]:[npc('Generator engineer Suri',516,200,'#b76b64','#2d3540','What changes when you move the same magnet through the coil twice as fast?',
   [['How should I start?','Launch from either end. Compare slow and fast using the same coil bank. The panel holds both readings.'],
    ['What if I leave the rail?','Use the reset lever at either end to bring the carriage there and keep completed readings.']])],
  [lobby+7]:[{...npc('Archive student Kez',510,212,'#8469a2','#312b35','If the magnet sits inside the coil, what voltage should the meter show after it stops moving?',
   [['How is the average measured?','The two markers define the same flux change on every pass. The meter divides by the measured transit time.']]),studyGuide:true}],
  [lobby+4]:[npc('Dome keeper Sana',562,274,'#6888af','#352f47','If you reverse the current, which way will the north tip swing?',
   [['Where should I measure?','Both docks lie on the coil axis. Compare the two current directions at the reference dock, then check for west at the relay dock and lock it.']])],
  [lobby+8]:[{...npc('Magnetics apprentice Niko',506,209,'#b29358','#342d45','What does the thumb on your right hand tell you when your fingers follow the current?',
   [['What if both readings look the same?','Check the switch and return to the dock. The reference dock records a heading only when you take a new reading.']]),studyGuide:true}],
  [offworld]:[npc('Archivist Vela',359,177,'#4daba0','#2d314f','Welcome to Nacre. Your telescope picked up our beacon. Your reply gave us a destination we could hold open. What did your Observatory uncover?',
   [['What is the Offworld Archive?','A record of how worlds repair their failing machines. The data you recovered at Mechanics Castle belongs here too.'],
    ['Can I return to the Observatory?','Yes. The south stargate will take you back to the Signal Chamber.']])]
 };
 const studyCrews=[
  [[132,159,'#537d81','#362d41','probe'],[590,163,'#9a795b','#352d34','notes']],
  [[145,161,'#846955','#342e38','meter'],[577,162,'#64776b','#3d3431','notes']],
  [[139,162,'#99664f','#302b3e','coil'],[581,160,'#747899','#3f3331','notes']],
  [[144,161,'#72769d','#362e37','coil'],[576,163,'#738b69','#3d312d','meter']]
 ].map(crew=>crew.map(([x,y,coat,hair,task])=>({x,y,coat,hair,task,facing:'north'})));
 function backgroundPeople(id){
  const floor=floorFor(id);
  return floor?.side===id ? studyCrews[floor.index] : [];
 }
 function drawStudyWork({x,y,task},t,{rect}){
  const hand=x+8, height=y-23, active=t&&Math.floor(t*2+x)%2;
  if(task==='notes'){
   rect(hand,height,8,6,'#d9c397');rect(hand+1,height+2,5,1,'#8a765f');
   rect(hand+(active?4:2),height-1,1,5,'#e2ba72');
  }else if(task==='coil'){
   for(let i=0;i<8;i+=2)rect(hand+i,height,1,6,i===4&&active?'#f4cc86':'#bf8c66');
  }else{
   rect(hand,height,7,5,'#2c4352');rect(hand+1,height+1,4,2,active?'#dcce91':'#92c3b0');
   if(task==='probe')rect(hand+3,height+4,1,5,'#d3a875');
  }
 }
 const afterRepair=[
  ['Clear glass at last. I’ll keep watch on the collector.','Anything worth checking in the valley?',
   'At Alder Orchard, try both tracks on the irrigation arm. Then look around the southwest side of the orchard for a very round cow.'],
  ['The supply lights are steady. I can read the instruments from across the room again.','Where else can I compare two readings?',
   'Try the survey turntable in Service Gulch. Bring the weights inward and see what happens to its spin.'],
  ['The receiver trace is back. The generator can carry the load now.','What else can those instruments tell us?',
   'When the lobby telescope locks on, inspect the hidden spectrum. The dark lines have a story of their own.'],
  ['The mount holds west. Vega can take it from here.','Any clues in the study room?',
   'Look near the west side of Magnetics Study for a glove. Its thumb might remind you of something.']
 ];
 function followUp(id){
  const [greeting,question,clue]=afterRepair[floorFor(id).index];
  return {greeting,topic:[question,clue]};
 }
 const leadName=floor=>residents[floor.room][0].name.split(' ').at(-1);
 function people(id,state){
  if(id===lobby)return [technician];
  if(id===lobby+1&&state.charge.held&&!done(state,0))return [{...residents[id][0],x:charge.plate[0],y:charge.plate[1]}];
  return residents[id]||[];
 }
 const blocks=(id,x,y,state)=>{
  const floor=floorFor(id);
  if(floor?.side===id){
   const {left,right,top}=studyBenches[floor.index];
   return x>=left&&x<=right&&y>=top&&y<=235||
    y>=126&&y<=146&&(x>=66&&x<=198||x>=519&&x<=651);
  }
  if(id===offworld)return Math.abs(x-archiveDesk.x)<=26&&y>=184&&y<=204;
  if(id!==offworld&&x>=270&&x<=448&&y>=116&&y<=177)return true;
  return id===chargeLab&&!done(state,0)&&x>=590&&x<=659&&y>=94&&y<=110;
 };
 function arrow(line,x,y,dx,color){
  if(!dx)return;
  line(x,y,x+dx,y,color);
  line(x+dx,y,x+dx-Math.sign(dx)*7,y-5,color,2);
  line(x+dx,y,x+dx-Math.sign(dx)*7,y+5,color,2);
 }
 function gateArt({rect,line},x,y,active,t){
  const edge='#806579',trim=active?'#b6abda':'#927e72';
  if(active){
   rect(x-54,y-28,108,29,'#67cdd42a');
   rect(x-44,y-14,88,17,'#8ce4e63b');
   rect(x-32,y-5,64,6,'#d1fff16b');
  }
  for(let i=-3;i<=3;i++){
   const pos=x+i*9,w=i===0?54:52-8*Math.abs(i);
   rect(pos-5,y-w,10,w+4,edge);
   rect(pos-3,y-w,4,7,trim);
  }
  for(let i=-2;i<=2;i++){
   const pos=x+i*8,h=40-Math.abs(i)*6;
   rect(pos-5,y-h,10,h,'#172531');
   if(active){
    rect(pos-5,y-h,10,h,'#3e6a88');
    for(let j=0;j<3;j++){
     const shift=(t*22+j*13+i*i*5)%h;
     line(pos-4,y-h+shift,pos+4,y-h+shift-2,j===0?'#c3e9dc':'#79b7bc',2);
    }
   }
  }
  for(const dx of [-33,27]){rect(x+dx,y-12,7,15,trim);rect(x+dx+2,y-11,3,5,active?teal:warm);}
 }
 function sceneryOffworld({rect,line,label}){
  rect(0,0,720,360,'#15213b');
  for(let i=0;i<68;i++){
   const x=(61+i*97)%720,y=(19+i*71)%169;
   rect(x,y,i%5===0?3:2,2,i%5===0?'#edcfb3':'#7895aa');
  }
  for(let y=-29;y<31;y+=3){
   const w=Math.sqrt(32*32-y*y);
   rect(532-w,72+y,2*w,3,y<-3?'#d8a5aa':'#865f90');
  }
  for(let i=0;i<22;i++){
   const x=i*37,y=126+(i*47)%26;
   line(x-37,187,x,y,'#4d537f',5);line(x,y,x+36,187,'#4d537f',5);
  }
  for(const [x,y,h] of [[400,171,36],[428,169,58],[451,168,39],[470,172,26]]){
   rect(x-8,y-h,17,h,'#635d81');rect(x-5,y-h-4,11,6,'#bda3b8');
   rect(x-2,y-h+6,5,10,'#ead0b5');rect(x-3,y-h+21,7,12,'#a599b9');
  }
  for(const x of [386,410,434,458,482])line(x,171,x+12,159,'#a595b8',3);
  rect(0,175,720,185,'#465377');
  for(let y=184;y<360;y+=30)for(let x=4;x<720;x+=39){
   rect(x+(y%8)*2,y,34,24,(x+y)%4?'#4d5c7b':'#586885');
  }
  rect(37,124,646,47,'#424c67');
  rect(40,125,640,4,'#797795');
  rect(268,128,179,4,'#b89db4');
  label('NACRE LANDING',359,152,'#efe0dc',14);
  for(const [x,y] of [[88,153],[174,288],[555,144],[673,279],[51,280]]){
   line(x,y,x-8,y-28,'#7eaac0',5);
   line(x,y,x+7,y-20,'#c29fb9',4);
   rect(x-9,y-30,5,8,'#b9dad2');
  }
  line(359,207,625,285,'#a999b2',3);
  rect(346,193,26,4,'#a999b2');
  const {x,y}=archiveDesk;
  rect(x-28,y-15,56,11,'#2d344e');rect(x-24,y-33,48,20,'#56527b');
  rect(x-20,y-34,40,4,'#e5c88b');
  for(const dx of [-15,0,15]){
   rect(x+dx-3,y-58,6,23,'#75c9ca');
   rect(x+dx-1,y-63,2,26,'#c4efe4');
  }
  label('SPECTRAL ARCHIVE',x,y+17,'#f0dbb8',12);
 }
 function equipment(id,{rect,line,label},state,t,repairPhase){
  state=trialState(id,state);
  const floor=floorFor(id);
  const {index}=floor;
  const screen=(text,color=teal)=>label(text,359,151,color,13);
  const hardware=scienceLabs.fittings({rect,line,label});
  const mount=(kind,x,y,text,engaged=false)=>{
   if(kind==='rack')hardware.rack(x,y);
   else hardware[kind](x,y,engaged);
   if(text)label(text,x,y+20,'#e5d4a9',9);
  };
  if(index===0){
   const {west,east,held,single}=state.charge;
   const strength=field(state.charge);
   const open=held||done(state,0);
   const [plateX,plateY]=charge.plate;
   screen(strength?'NET FIELD '+fieldName(strength).toUpperCase():'NET FIELD ZERO');
   arrow(line,359,160,strength*16,gold);
   rect(249,175,223,18,'#1b2b34');
   for(const x of [258,460])rect(x,174,4,20,'#8f8575');
   rect(410,174,2,20,'#b99c67');
   rect(467,172,10,23,done(state,0)?teal:'#7b8382');
   if(!open)rect(251,174,219,21,'#59606a');
   else{
    arrow(line,348,179,west==='+'?27:west==='−'?-27:0,warm);
    arrow(line,348,189,east==='−'?27:east==='+'?-27:0,teal);
    if(pulse){
     const fraction=Math.min(1,pulse.elapsed/.9);
     for(const offset of [0,.08,.16]){
      const progress=Math.max(0,fraction-offset);
      const x=359+pulse.strength*55*progress**2;
      rect(x-2,181+offset*30,5,5,gold);
     }
    }else if(practice?.room===id){
     if(chargeLanding!==null)rect(357+chargeLanding*55,181,5,5,gold);
    }else if(done(state,0)||single)rect(done(state,0)?465:411,181,5,5,gold);
   }
   label('SHORT MARK',434,166,'#e5d4a9',9);
   label('COLLECTOR',470,202,'#e5d4a9',9);
   mount('lever',...charge.check,'',Boolean(pulse));
   for(const [x,value,name] of [[charge.west,west,'WEST SOCKET'],[charge.east,east,'EAST SOCKET']]){
    mount('socket',x,227,name,Boolean(value));
    label(value||'·',x,227,value==='−'?teal:warm,18);
   }
   for(const [x,value] of [[275,'+'],[446,'−']]){
    mount('rack',x,281,'');
    if(![west,east,state.carry].includes(value))label(value,x,281,gold,18);
   }
   if(state.carry!==null)mount('rack',charge.rack,292,'RETURN');
   hardware.foot(plateX,plateY,54);
   hardware.lamp(plateX,plateY-4,open?'ready':'locked');

  }else if(index===1){
   const {resistor,linked,on}=state.circuit;
   const amps=current(state.circuit);
   const color=amps===2?teal:amps?warm:'#8b8f79';
   const [bridgeX,bridgeY]=circuit.bridge;
   const [switchX,switchY]=circuit.breaker;
   const [meterX,meterY]=circuit.meter;
   line(bridgeX,173,bridgeX,bridgeY-9,color,3);
   line(bridgeX,bridgeY+7,bridgeX,240,color,3);
   line(bridgeX,240,switchX-18,240,color,3);
   line(switchX+19,240,594,240,color,3);
   line(594,240,594,173,color,3);line(594,173,bridgeX,173,color,3);
   if(amps){
    const phase=(t*55)%155;
    rect(bridgeX+24+phase,238,7,4,color);
    rect(594-24-phase,171,7,4,color);
   }
   mount('socket',...circuit.bridge,'',linked);
   line(bridgeX,bridgeY-11,bridgeX,linked?bridgeY+7:bridgeY-3,linked?color:gold,3);
   if(!linked)rect(bridgeX-2,bridgeY+4,5,5,gold);
   mount('socket',...circuit.socket,'',Boolean(resistor));
   label(resistor?resistor+' Ω':'·',...circuit.socket,gold,12);
   mount('lever',...circuit.breaker,'',on);
   line(switchX-17,switchY+8,switchX+18,switchY+(on?8:-5),color,3);
   hardware.dial(...circuit.meter,amps/3,amps+' A');
   hardware.lamp(meterX+25,meterY-6,amps===2?'complete':amps?'working':'locked');
   screen(amps===2?'SUPPLY READY':'TARGET 2 A',color);
   label('12 V · '+(resistor?resistor+' Ω':'NO RESISTOR'),359,166,'#f4d5a5',10);
   mount('rack',...circuit.link,'');
   if(!linked&&state.carry!=='link')rect(circuit.link[0]-8,circuit.link[1]-4,16,6,gold);
   for(const [i,n] of [4,6,12].entries()){
    const x=259+i*81;
    mount('rack',x,286,n+' Ω');
    if(![state.carry,resistor].includes(n))label('▰',x,286,warm,15);
   }
   if(state.carry!==null)mount('rack',circuit.rack,306,'RETURN');
  }else if(index===2){
   const {gear,turns:bank,end,trials}=state.induction;
   rect(rail.west-14,231,rail.east-rail.west+28,32,'#262e3d');
   for(let x=rail.west;x<rail.east;x+=14)rect(x,233,5,27,'#5e504d');
   for(const y of [236,258])line(rail.west-10,y,rail.east+10,y,'#b09473',3);
   for(const x of [rail.start,rail.end]){
    rect(x-2,230,4,34,gold);
    rect(x-6,231,12,6,teal);
   }
   for(let i=0;i<bank/2;i++)rect(359+i*8-(bank/2-1)*4,237,4,24,'#d1a683');
   const x=pass?.x??rail[end];
   rect(x-13,240,27,15,'#b26763');rect(x+1,240,13,15,'#6576a1');
   label('N',x-7,251,'#fff0cf',9);label('S',x+8,251,'#fff0cf',9);
   mount('lever',...induction.gear,gear.toUpperCase(),gear==='fast');
   mount('lever',...induction.bank,bank+' TURNS',bank===20);
   for(const side of ends){
    mount('lever',rail[side],298,'',!pass&&side===end);
    if(!pass&&side===end)label('RUN',rail[side],272,gold,11);
   }
   const reading=pass?.voltage??0;
   screen(pass?'LIVE '+signed(reading)+' V':done(state,2)?'GENERATOR ONLINE':'TARGET 6 V');
   const mask=trials[bank]||0;
   const result=(speed,bit)=>mask&bit?voltage(bank,speed).toFixed(1)+' V':'—';
   label('SLOW '+result('slow',1)+'  ·  FAST '+result('fast',2),359,167,gold,10);
   drawVoltageTrace(line);
  }else{
   const {polarity,compass,seen,dock}=state.coil;
   mount('lever',...coil.switch,'CURRENT '+(polarity>0?'A':'B'),polarity<0);
   line(coil.reference[0],coil.reference[1],coil.dock[0],coil.dock[1],'#8493ad',2);
   for(let x=312;x<406;x+=12){
    line(x-4,248,x+5,223,'#a986a6',4);
    const tipX=x+(polarity>0?3:-3),tipY=235-polarity*8;
    line(tipX,tipY,tipX-5,tipY+polarity*5,'#e2c5db',2);
    line(tipX,tipY,tipX+4,tipY+polarity*7,'#e2c5db',2);
   }
   screen(done(state,3)?'TRACKING RELAY LOCKED':'COIL CURRENT '+(polarity>0?'A':'B'));
   if(!compass)mount('rack',...coil.compass,'');
   if(!compass)label('N',...coil.compass,gold,12);
   mount('socket',...coil.reference,'REFERENCE',seen===3);
   mount('socket',...coil.dock,'RELAY',dock===-1);
   mount('lever',...coil.align,'',dock===-1);
   label('A '+(seen&1?'EAST':'—')+'  /  B '+(seen&2?'WEST':'—'),359,168,gold,10);
   if(dock!==null){
    arrow(line,coil.dock[0],coil.dock[1]-5,dock*19,gold);
    label('N',coil.dock[0]+dock*24,coil.dock[1]-6,gold,10);
   }
   drawRelayMount({rect,line,label},state,repairPhase);
  }
 }

 function drawRelayMount({rect,line,label},state,repairPhase){
  const active=done(state,3);
  const fraction=active?repairPhase:0;
  const angle=-Math.PI/5-fraction*Math.PI*.7;
  rect(567,143,68,13,'#26333b');
  line(601,144,601,126,'#af9273',6);
  line(601,126,601+35*Math.cos(angle),126+35*Math.sin(angle),active?teal:'#a7b6b5',9);
  label(active?'WEST LOCK':'TRACKING MOUNT',601,169,active?teal:gold,10);
 }
 function repairedScenery({rect,line,label},index,active,phase){
  if(index===0){
   rect(587,92,76,30,'#182d39');
   for(let i=0;i<7;i++)rect(591+i*10,100+i%2*8,3,2,'#92c4be');
   const curtain=active?Math.round(30*(1-phase)):30;
   if(curtain>0)rect(587,92,76,curtain,'#615251');
   if(curtain>1)for(let x=591;x<=653;x+=8)rect(x,93,3,curtain-1,'#a18171');
   rect(583,89,84,6,'#9d947c');
   label(active?'SHIELD CLEAR':'DUST CURTAIN',625,136,active?teal:gold,10);
  }else if(index===1){
   for(const [i,x] of [101,147,565,611].entries()){
    const lit=active&&phase>i/4;
    rect(x-14,94,28,18,'#222f38');
    rect(x-10,97,20,8,lit?'#f8df9a':'#67594f');
    if(lit)line(x,108,x,121,'#b49e77',2);
   }
   if(active)label('SUPPLY LIGHTS ON',588,136,teal,10);
  }else if(index===2){
   rect(536,92,123,30,'#20323b');
   const columns=active?Math.floor(35*phase):0;
   for(let i=0;i<columns;i++)rect(545+i*3,105+Math.round(7*Math.sin(i*.45)),2,2,teal);
   label(active?'RECEIVER POWERED':'RECEIVER OFF',598,136,active?teal:gold,10);
  }
 }
 function scope({rect,line}, x,y,online,sweep=0){
  rect(x-59,y+18,118,15,'#26333b');
  line(x,y-8,x-24,y+21,'#af9273',7);
  line(x,y-8,x+23,y+21,'#af9273',7);
  line(x-37,y+2,x+36,y-29+sweep,'#202c37',34);
  line(x-39,y-4,x+35,y-34+sweep,'#a7b6b5',23);
  line(x-39,y-5,x+35,y-35+sweep,'#6c858f',13);
  line(x+31,y-39+sweep,x+40,y-23+sweep,online?teal:'#d4a168',10);
  rect(x-14,y+8,29,8,online?teal:warm);
 }
 const systemEffects=['Dust curtain clears','Supply lights steady','Receiver powered','Mount tracks'];
 function lobbySystems({rect,line,label},state,t){
  const [dust,supply,generator,tracking]=floors.map(({index})=>done(state,index));
  if(!dust)for(let i=0;i<32;i++){
   const x=175+(i*51+t*38)%360,y=25+i*19%49;
   rect(x,y,3,2,'#ad8e70');
  }
  for(const x of [109,608]){
   rect(x-11,111,22,13,'#1f2b32');
   rect(x-7,114,14,7,supply?'#f4daa1':'#67594f');
   if(supply)line(x,124,x,142,'#b49e77',2);
  }
  rect(471,121,59,24,'#1c303b');
  if(generator)for(let i=0;i<26;i++){
   const y=133+Math.sin(i*.55+t*3)*(state.sector===null?4:7);
   rect(474+i*2,y,2,2,teal);
  }
  if(tracking){
   line(378,127,422,94,state.aligned?teal:'#a6bcb8',2);
   rect(421,91,4,5,state.aligned?teal:gold);
  }
  floors.forEach(({system,index})=>{
   const x=98+index*152,active=done(state,index);
   rect(x-64,262,128,31,'#263441');
   rect(x-64,262,128,2,active?teal:warm);
   label(system.toUpperCase(),x,275,gold,10);
   label(active?systemEffects[index]:'Offline',x,287,active?teal:warm,10);
  });
 }
 function labArchitecture({rect,line,label},floor,side){
  const {index,tint}=floor;
  const backdrop='#1d2b36',metal='#9d947c',glint='#d3c9ad';
  rect(168,18,374,65,backdrop);
  if(index===0){
   for(const x of [208,260,460,512]){
    rect(x-4,22,8,55,tint);rect(x-9,74,18,4,metal);
    rect(x-7,34,14,4,glint);
   }
   for(const y of [28,67])line(197,y,523,y,metal,3);
   label('＋',300,57,'#e5aa8e',22);label('−',420,57,'#a5d9cd',22);
   for(const x of [323,348,373])arrow(line,x,47,18,'#96bdb5');
  }else if(index===1){
   for(const y of [30,66])line(198,y,522,y,'#be886a',5);
   for(const x of [220,310,405,500]){
    rect(x-5,28,10,40,metal);rect(x-12,38,24,20,tint);
    rect(x-8,42,16,3,glint);
   }
   label('SUPPLY BUS',360,57,'#ffdfaa',11);
  }else if(index===2){
   for(const y of [44,60])line(182,y,530,y,metal,3);
   for(let x=187;x<530;x+=14)rect(x,42,4,20,tint);
   for(const x of [232,485]){
    rect(x-2,22,4,53,glint);rect(x-9,22,18,7,'#94d1c7');
   }
   for(let x=330;x<=390;x+=8)line(x-5,61,x+5,43,'#d4a781',4);
  }else{
   for(let i=0;i<32;i++){
    const angle=i*Math.PI/16,next=(i+1)*Math.PI/16;
    line(360+65*Math.cos(angle),50+27*Math.sin(angle),360+65*Math.cos(next),50+27*Math.sin(next),i%4?metal:glint,2);
   }
   line(266,50,454,50,tint,3);
   label('W',251,55,glint,13);label('E',469,55,glint,13);
   arrow(line,344,50,32,'#c4b1e4');
  }
  if(side){
   rect(178,16,15,65,'#584d47');rect(526,16,15,65,'#584d47');
   for(const x of [180,528])for(const y of [26,42,58,74])rect(x,y,11,3,'#bd9867');
  }
 }
 function studyEquipment({rect,line,label},floor){
  const metal='#798c96',body='#273442',wood='#8f725a';
  const rack=(x)=>{
   rect(x,125,132,23,'#24313c');
   rect(x+5,130,122,15,'#4d5355');
   rect(x,119,132,8,wood);
   rect(x+6,144,8,8,'#232e39');rect(x+118,144,8,8,'#232e39');
  };
  rack(66);rack(519);
  const meter=(x,y,signal)=>{
   rect(x,y,37,28,body);rect(x+4,y+4,29,12,'#648f81');
   label(signal,x+18,y+14,'#d5efcf',10);
   rect(x+8,y+20,5,4,'#c77f62');rect(x+23,y+20,5,4,metal);
  };
  if(floor.index===0){
   rect(77,99,77,21,'#1e303a');
   rect(80,101,71,15,'#566260');
   for(let x=82;x<147;x+=8)rect(x,104,1,9,'#738080');
   rect(87,102,5,12,gold);rect(137,102,5,12,teal);
   meter(537,91,'V');meter(585,91,'10 V');
   line(545,113,524,118,'#c77f62',2);line(598,114,634,118,teal,2);
   line(160,115,184,105,metal,3);
  }else if(floor.index===1){
   meter(79,91,'A');meter(133,91,'12 V');
   line(97,112,128,116,'#c77f62',2);
   rect(531,95,91,24,'#728570');
   for(const x of [546,570,594]){
    line(x-6,107,x+7,107,'#bdd0c6',2);
    rect(x-3,104,9,6,'#c48c60');
    rect(x,104,2,6,'#eed695');
   }
  }else if(floor.index===2){
   rect(76,114,113,5,metal);
   for(const x of [94,161]){rect(x,94,5,23,gold);rect(x-4,95,13,4,teal);}
   for(let x=118;x<146;x+=5)line(x,114,x+7,101,'#cc966f',3);
   meter(538,91,'V');
   rect(588,102,36,12,'#426487');rect(588,102,18,12,'#a65d59');
   label('N',596,112, '#f1dec0',9);label('S',616,112, '#f1dec0',9);
  }else{
   rect(82,110,101,8,'#5b6e77');
   for(let x=101;x<164;x+=9)line(x,113,x+9,94,'#c88e6f',4);
   for(const x of [547,582,617]){
    rect(x-10,99,20,20,'#a4a78d');rect(x-7,102,14,14,'#293c48');
    line(x-4,112,x+4,105,'#ea9a7d',3);
   }
  }
 }
 function studyFixture({rect,line,label},floor,settings,t){
  const {left,right,top,name}=studyBenches[floor.index];
  const width=right-left;
  rect(left,231,width,9,'#263441');
  rect(left,top,width,235-top,'#465d62');
  rect(left,top,width,5,'#ab8a69');
  if(floor.index===0){
   rect(left+18,top+11,width-75,26,'#2b5056');
   if(settings.layout==='bars'){
    rect(left+36,top+14,5,20,gold);rect(right-74,top+14,5,20,teal);
   }else{
    rect(left+36,top+21,8,8,gold);rect(right-77,top+21,8,8,teal);
   }
   const probe=left+23+settings.x*3;
   line(probe,top+15+settings.y,probe+8,top+10,'#f7e4b4',2);
   rect(right-49,top+10,37,25,'#22373e');label('V',right-30,top+28,teal,13);
  }else if(floor.index===1){
   const y=top+14;
   line(left+27,y,right-27,y,'#c69767',3);line(right-27,y,right-27,y+33,'#c69767',3);
   line(right-27,y+33,382,y+33,'#c69767',3);line(335,y+33,left+27,y+33,'#c69767',3);
   line(left+27,y+33,left+27,y,'#c69767',3);
   line(335,y+33,382,settings.on?y+33:y+21,gold,3);
   rect(325,y-7,69,14,'#35505a');label(settings.resistor+' Ω',359,y+4,'#f1d29b',12);
   label(current(settings)+' A',right-43,y+24,teal,12);
  }else if(floor.index===2){
   line(left+11,218,right-11,218,'#a2acac',4);
   for(const x of [294,425]){
    rect(x-4,top-17,8,40,gold);rect(x-8,top-19,16,5,teal);
    if(t&&Math.sin(t*4+x)>0)rect(x-2,top-18,4,4,'#dbfff5');
   }
   for(let x=320;x<400;x+=settings.bank===20?8:15)line(x,222,x+14,top+4,'#d19b6e',4);
   const x=settings.direction>0?left+30:right-54;
   rect(x,206,13,10,'#ab625d');rect(x+13,206,13,10,'#648ca5');
  }else{
   line(left+13,200,right-13,200,'#6a9fa9',3);
   for(let x=left+18;x<right-43;x+=15){
    line(x,top+11,x,225,'#d49c73',4);line(x,top+11,x+8,top+11,'#d49c73',4);
    line(x,225,x+8,225,'#a96555',4);
   }
   rect(right-41,187,32,26,'#28334c');
   arrow(line,right-25,200,settings.polarity*10,'#eea88a');
  }
  label(name.toUpperCase(),359,270,gold,12);
 }
 function drawRoom(id,art,state,doors,t,repairPhase=1){
  const {rect,line,label}=art;
  const floor=floorFor(id);
  const side=floor?.side===id;
  const online=floor?done(state,floor.index):id===secret?state.contact:powered(state);
  rect(0,0,720,360,'#17232c');
  rect(29,46,662,284,'#364853');
  for(let y=52;y<329;y+=23)for(let x=34;x<682;x+=34){
   rect(x,y,29,20,(x+y)%3?'#3b4d58':'#425562');
   if((x+y)%5===0)rect(x+6,y+4,9,2,'#546673');
  }
  rect(0,0,720,53,'#293743');
  rect(0,43,720,9,floor?.tint||'#66808a');
  rect(0,331,720,29,'#24353d');
  rect(30,50,8,282,'#6b8188');rect(683,50,8,282,'#6b8188');
  rect(161,10,390,78,'#112630');
  rect(168,17,376,64,'#213e50');
  for(let i=0;i<24;i++)rect(178+i*71%350,25+i*i*13%45,i%4?2:3,2,'#92abb7');
  for(const x of [168,293,419,540])rect(x,14,4,70,'#81949a');
  rect(160,79,391,10,floor?.tint||'#748386');
  if(floor)labArchitecture(art,floor,side);
  if(id===lobby)drawObservatoryLobbyBackdrop(art,online);
  if(id!==offworld)drawBackdropDetails(id,art,'observatory',floor?.tint);

  if(id===offworld){
   sceneryOffworld(art);
   drawBackdropDetails(id,art,'nacre');
   for(let i=0;i<8;i++){
    const drift=(t*.15+i*.19)%1;
    rect((99+i*87+drift*24)%700,118+i*11%41-drift*11,2,2,'#d4b7d799');
   }
  }
  else if(side){studyEquipment(art,floor);studyFixture(art,floor,state.studySettings[floor.index],t);}
  else{
   rect(268,118,180,60,'#222f38');
   rect(276,118,164,51,floor?.tint||'#726e59');
   rect(277,119,162,4,'#ae9a7d');
   if(id===lobby)scope({rect,line},356,145,done(state,3),done(state,3)?Math.sin(t*1.7)*(state.aligned?0:5):0);
   else if(id===secret){
    rect(294,127,130,30,'#152a3a');
    for(let i=0;i<31;i++){
     const h=3+Math.abs(Math.sin(i*.7+t*3))*Math.abs(Math.cos(i*.21))*17;
     rect(310+i*3,144-h/2,2,h,state.contact?teal:gold);
    }
    line(448,144,624,144,'#617e94',4);line(624,144,624,50,state.contact?teal:'#617e94',4);
   }
   else{
    rect(307,129,103,32,'#203641');
    equipment(id,art,state,t,repairPhase);
    repairedScenery(art,floor.index,online,repairPhase);
    if(online){
     const control=[charge.check,circuit.breaker,induction.bank,coil.align][floor.index];
     scienceLabs.fittings(art).lamp(control[0]+28,control[1]-10,'complete');
    }
   }
   rect(417,123,14,11,'#182930');
   rect(419,125,10,7,online?teal:gold);
   rect(420,126,8,2,online?'#e0fff2':'#ffdfaa');
   for(const x of [125,590]){
    rect(x-17,36,34,10,'#19252b');
    rect(x-12,40,24,3,online?'#79aba5':'#8b7967');
    if(online)rect(x-12+((t*30)%20),40,4,3,teal);
   }
   if(!floor)label(id===secret?'RECEIVER':'TELESCOPE',359,195,'#e3d6b8',11);
   if(id===lobby){
    if(state.aligned){
     const cable=[[448,158,649,158],[649,158,649,245],[649,245,675,245]];
     for(const segment of cable){line(...segment,'#64d3c247',11);line(...segment,'#b7f5df',3);}
     for(let x=460;x<649;x+=23)rect(x,156,5,5,'#d1fff4');
    }
    lobbySystems(art,state,t);
   }else if(floor&&!side&&confirmed(state,floor.index)){
    const practicing=practice?.room===id;
    rect(practiceStation.x-45,practiceStation.y-12,90,21,'#263441');
    label(practicing?'END PRACTICE':'PRACTICE',practiceStation.x,practiceStation.y+2,practicing?teal:gold,10);
   }
  }
  for(const door of doors){
   const {x,y}=door.point;
   const vertical=door.dir==='north'||door.dir==='south';
   const left=vertical?x-31:door.dir==='west'?0:674;
   const top=vertical?(door.dir==='north'?0:307):y-24;
   if(door.gate)gateArt(art,x,door.dir==='north'?54:339,door.open,t);
   else{
    rect(left,top,vertical?62:46,vertical?53:48,'#88999d');
    rect(left+5,top+4,vertical?52:36,vertical?49:40,door.open?'#263743':'#644a46');
    rect(left+9,top+8,5,6,door.open?teal:warm);
    if(door.open)rect(left+9,top+15,5,2,'#95cab3');
    else{
     rect(left+17,top+15,16,2,'#927068');
     rect(left+17,top+23,16,2,'#927068');
    }
   }
   label(door.label,vertical?x:door.dir==='west'?61:658,vertical?(door.dir==='north'?84:298):y-32,'#e3d6b8',10);
  }
 }

 const openingScenes=['observatory-night.webp','observatory-failure.webp','nacre-arrival.webp'];
 const openingArt=[];
 let openingCanvas=null, openingBeat=0, reveal=null, revealStart=0;
 function frame(now){
  if(!openingCanvas?.isConnected||$('modal').hidden)return;
  const ctx=openingCanvas.getContext('2d');
  const t=reducedMotion()?0:now/1000;
  ctx.fillStyle='#142330';ctx.fillRect(0,0,480,164);
  ctx.fillStyle='#283e4e';ctx.fillRect(0,116,480,48);
  const sceneIndex=reveal==='gate'?2:reveal?1:openingBeat===0?0:1;
  const scene=openingArt[sceneIndex]||=loadArt(openingScenes[sceneIndex]);
  if(scene.complete&&scene.naturalWidth){
   ctx.drawImage(scene,0,0,480,164);
   ctx.fillStyle='#0f223242';ctx.fillRect(0,0,480,164);
  }
  for(let i=0;i<30;i++){
   const glow=.55+.22*Math.sin(t*2+i);
   ctx.fillStyle='rgba(209,225,228,'+glow+')';
   ctx.fillRect(10+i*79%458,9+i*i*29%95,2,2);
  }
  if(reveal){
   const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
   const line=(x,y,u,v,c,w)=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(u,v);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();};
   const progress=reducedMotion()?1:Math.min(1,Math.max(0,(now-revealStart)/750));
   if(reveal==='gate'){
    const painted=scene.complete&&scene.naturalWidth;
    const x=painted?76:240;
    if(!painted)gateArt({rect,line},x,133,false,0);
    ctx.save();ctx.globalAlpha=progress*(painted?.7:1);
    gateArt({rect,line},x,133,true,t);
    ctx.restore();
   }
   else{
    scope({rect,line},211,107,true);
    line(248,68,248+122*progress,68-38*progress,teal,3);
    if(progress===1)rect(370,28,6,6,gold);
    line(380,118,430,118,teal,3);line(430,118,430,76,teal,3);
   }
   return;
  }
  ctx.save();
  const wobble=openingBeat===1?Math.sin(t*28)*3:0;
  ctx.translate(240+wobble,116);
  ctx.scale(.72,.72);
  if(openingBeat===0)ctx.rotate(Math.sin(t*1.6)*.12);
  ctx.translate(-240,-107);
  scope({
   rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);},
   line(x,y,u,v,c,w){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(u,v);ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();}
  },240,107,openingBeat===0);
  ctx.restore();
  if(openingBeat===1){
   for(let i=0;i<6;i++){
    const age=(t*2+i*.17)%1;
    ctx.fillStyle='rgba(247,185,106,'+(1-age)+')';
    ctx.fillRect(243+(i-3)*age*18,115-age*44,4,3);
   }
  }
 }
 function showIntro(finish){
  const beats=[
   ['The telescope turns','The castle’s records have led you to the observatory. Its telescope swings toward the beacon in the offworld archive.'],
   ['Tracking fails','The mount shudders and stops. The archive signal drops as four systems go dark.'],
   ['Vega’s repair plan','Start upstairs with the dust shield. Then restore the instrument supply, generator, and tracking system, one floor at a time. Use the study rooms if you need help. Report each repair to its lab lead.']
  ];
  openingBeat=0;
  reveal=null;
  function show(){
   const [title,story]=beats[openingBeat];
   const last=openingBeat===beats.length-1;
   panel(title,story,[[last?'Begin the repairs':'Next scene',last?finish:()=>{openingBeat++;show();}]],finish,'Skip opening',
    '<canvas id="observatory-opening" width="480" height="164" aria-hidden="true"></canvas>',last?technician.name:null);
   openingCanvas=$('observatory-opening');
   frame(performance.now());
  }
  show();
 }
 function showReveal(type,finish,signalStrength){
  reveal=type;
  revealStart=performance.now();
  const gate=type==='gate';
  panel(gate?'The stargate opens':'The telescope locks on',
   gate?'Vela replies with coordinates. The ring fills with light and a landing terrace appears on the other side. The gate will stay open in both directions.':
    'The receiver locks at '+signalStrength+'%. A pulse from the receiver runs along a cable to the east wall. The stone panel slides aside, revealing a hidden chamber.',
   [],finish,gate?'Approach the stargate':'Find the hidden chamber','<canvas id="observatory-opening" width="480" height="164" aria-hidden="true"></canvas>');
  openingCanvas=$('observatory-opening');
  frame(performance.now());
 }
 function panel(title,text,actions,leave=close,leaveLabel='Back to the room',extra='',speaker=null,footer='',scroll=true){
  const caption='<h2>'+title+'</h2><p>'+text+'</p>';
  const header=speaker?'<div class="speaker-turn">'+portraitMarkup(speaker,'explaining')+'<div>'+caption+'</div></div>':caption;
  dialog(header+extra+'<div class="choices field-actions" id="observatory-choices"></div>'+footer,{focus:false});
  $('sheet').classList.add('relay-sheet');
  actions.forEach(([label,run],i)=>button($('observatory-choices'),label,run,i===0?'gold':''));
  button($('observatory-choices'),leaveLabel,leave).id='dismiss';
  setChoice(0,{scroll});
 }
 let pass=null,pulse=null,chargeLanding=null;
 let voltageTrace=[];
 const signed=value=>value>0?'+'+value.toFixed(1):value.toFixed(1);
 const voltage=(bank,gear)=>bank*.06/gears[gear].seconds;
 const escape=text=>text.replace(/[&<>]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[char]));
 function chargeReading(settings){
  const {west,east}=settings;
  const strength=field(settings);
  const landing=({[-2]:'far west',[-1]:'west',[0]:'at the source',[1]:'at the short mark',[2]:'in the collector'})[strength];
  return {settings:'West '+(west??'empty')+' · East '+(east??'empty'),
   reading:'Field '+fieldName(strength)+' · particles land '+landing+'.'};
 }
 function circuitReading(trial){
  return {settings:'12 V · '+(trial.resistor?trial.resistor+' Ω':'socket empty')+
   ' · breaker '+(trial.on?'closed':'open')+' · bridge '+(trial.linked?'seated':'open'),
   reading:current(trial)+' A'};
 }
 function inductionReading(bank,gear,direction){
  return {settings:bank+' turns · '+gear+' gear · '+(direction>0?'eastbound':'westbound'),
   reading:signed(voltage(bank,gear)*direction)+' V in '+gears[gear].seconds.toFixed(2)+' s'};
 }
 function magneticReading(polarity,dock){
  return {settings:dock+' · current '+(polarity>0?'A':'B'),
   reading:'Compass north tip points '+(polarity>0?'east':'west')+'.'};
 }
 function record(state,index,source,{settings,reading}){
  const rows=state.observations[index];
  const prior=rows.findIndex(row=>row.source===source&&row.settings===settings);
  if(prior>=0)rows.splice(prior,1);
  rows.push({source,settings,reading});
  const sameSource=rows.filter(row=>row.source===source);
  if(sameSource.length>60)rows.splice(rows.indexOf(sameSource[0]),1);
 }
 function reportEvidence(state,index){
  const rows=state.observations[index].filter(row=>row.source==='Repair');
  const find=({settings})=>rows.findLast(row=>row.settings===settings);
  if(index===0)return [
   rows.findLast(row=>row.reading.includes('at the short mark')),
   find(chargeReading({west:'+',east:'−'}))
  ];
  if(index===1){
   const setup={resistor:6,linked:true};
   return [find(circuitReading({...setup,on:false})),find(circuitReading({...setup,on:true}))];
  }
  if(index===2){
   let mixedDirection;
   for(const bank of [...turns].reverse()){
    const slow=[1,-1].map(direction=>find(inductionReading(bank,'slow',direction)));
    const fast=[1,-1].map(direction=>find(inductionReading(bank,'fast',direction)));
    for(const i of [0,1]){
     if(slow[i]&&fast[i])return [slow[i],fast[i]];
     if(slow[i]&&fast[1-i])mixedDirection??=[slow[i],fast[1-i]];
    }
   }
   return mixedDirection||[undefined,rows.findLast(row=>row.settings.startsWith('20 turns · fast gear'))];
  }
  return [find(magneticReading(1,'Reference dock')),find(magneticReading(-1,'Reference dock')),
   find(magneticReading(-1,'Relay dock'))];
 }
 function instrument(id,control,saved){
  const state=trialState(id,saved);
  if(id===circuitLab&&control==='check')return {measure:true};
  if(id===magneticLab&&['reference','dock'].includes(control))return {measure:true};
  if(id===chargeLab&&control==='check'){
   const {settings,reading}=chargeReading(state.charge);
   return {title:'Field probe',text:settings+'. '+reading+' This preview leaves the particle source idle.'};
  }
  if(id===inductionLab&&['west-launch','east-launch','gear','bank'].includes(control)){
   const {turns:bank,trials,last}=state.induction;
   const mask=trials[bank]||0;
   const read=(gear,bit)=>mask&bit?voltage(bank,gear).toFixed(1)+' V magnitude in '+gears[gear].seconds.toFixed(2)+' s model time':'not yet tested';
   return {title:'Induction meter',text:bank+' turns · Slow: '+read('slow',1)+' · Fast: '+read('fast',2)+'.'+(last?' Last pass: '+escape(last)+'.':'')};
  }
  return null;
 }
 function observationsHTML(state,activeIndex){
  const ordered=floors.slice();
  if(Number.isInteger(activeIndex))ordered.unshift(...ordered.splice(activeIndex,1));
  const tables=ordered.map(({index,name})=>{
   const rows=state.observations[index];
   if(!rows.length)return '';
   return '<h3>'+name+'</h3><table class="observatory-readings" aria-label="'+name+' observations">'+
    '<thead><tr><th scope="col">Station</th><th scope="col">Settings</th><th scope="col">Reading</th></tr></thead><tbody>'+
    rows.slice().reverse().map(row=>'<tr><td>'+row.source+'</td><td>'+escape(row.settings)+'</td><td>'+escape(row.reading)+'</td></tr>').join('')+
    '</tbody></table>';
  }).join('');
  return tables||'<p>Run a study demonstration or take a lab reading to start your record.</p>';
 }
 function reaction(id,state){
  const floor=floorFor(id);
  if(!floor)return '';
  const rows=state.observations[floor.index];
  const last=floor.side===id?(rows.findLast(row=>row.source==='Study')||rows.at(-1)):rows.at(-1);
  if(!last)return '';
  const questions=[
   'Which way did each cell push the positive test particles?',
   'Try keeping the voltage fixed when comparing resistors.',
   'Compare the pulse magnitudes at the same number of turns.',
   'What happens to the north tip if you reverse the current?'
  ];
  return 'Your '+last.source.toLowerCase()+' reading was “'+escape(last.reading)+'” ('+escape(last.settings)+'). '+questions[floor.index];
 }
 const studyCanvasId='study-apparatus';
 let probeControl=null;
 const probeDirections={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
 function moveStudyProbe(direction){
  if($('modal').hidden||!probeControl?.canvas.isConnected||!probeControl.enabled)return false;
  if(!Object.hasOwn(probeDirections,direction))return false;
  probeControl.move(...probeDirections[direction]);
  return true;
 }
 function demonstration(index,state,log,save){
  const initial=studyDefaults[index];
  const settings=state.studySettings[index];
  let probeMode=false;
  const cycle=(key,values)=>()=>{settings[key]=values[(values.indexOf(settings[key])+1)%values.length];};
  const variants=[
   [['Change electrode shape',cycle('layout',['bars','dots'])]],
   [['Resistance',cycle('resistor',[4,6,12])],['Breaker',cycle('on',[true,false])]],
   [['Coil bank',cycle('bank',turns)],['Gear',cycle('gear',['slow','fast'])],['Travel direction',cycle('direction',[1,-1])]],
   [['Reverse current',cycle('polarity',[1,-1])]]
  ][index];
  const titles=['Conductive paper','12 V circuit','Induction carriage','Coil and compass'];
  const instructions=[
   'Tap or drag the probe. Select Move probe to use the directional controls.',
   'Change the resistor or open the breaker. Watch the ammeter and current arrows.',
   'Change one setting and run the carriage. Compare the signed average voltage between the gates.',
   'Reverse the current. Watch the compass’s north-seeking tip.'
  ];
  const descriptions=[
   'Conductive paper with 10 volt and zero volt electrodes, equipotential lines and a movable field probe.',
   'Series circuit with a battery, resistor, ammeter and breaker.',
   'Magnet carriage, coil between two timing gates and a signed voltage trace.',
   'Solenoid and compass with a needle that reverses when the current changes.'
  ];
  function show(selected=0,measured=null){
   const priorScroll=$('sheet').scrollTop;
   const wasOpen=$('sheet').querySelector('#'+studyCanvasId);
   const run=()=>{
    const result=[
     ()=>null,
     ()=>circuitReading(settings),
     ()=>inductionReading(settings.bank,settings.gear,settings.direction),
     ()=>magneticReading(settings.polarity,'Study compass')
    ][index]();
    log(result);
    show(0,result);
   };
   const actions=index===0?[
    [probeMode?'Finish moving':'Move probe',()=>{probeMode=!probeMode;show();}],
    ['Record reading',()=>{
     const {value,field}=studyLabs.paperReading(settings.layout,settings.x,settings.y);
     log({settings:settings.layout+' · x '+settings.x+' cm · y '+(studyLabs.rows-1-settings.y)+' cm',
      reading:value.toFixed(2)+' V · '+(field?field.magnitude.toFixed(1)+' V/m':'electrode surface')});
     show(1,{reading:'Reading recorded.'});
    }]
   ]:[[['','Read ammeter','Run carriage','Read compass'][index],run]];
   actions.push(...variants.map(([name,change])=>[name,()=>{change();save();show(actions.findIndex(action=>action[0]===name));}]));
   actions.push(['Reset setup',()=>{Object.assign(settings,initial);save();probeMode=false;show();}]);
   const group=index===0?settings.layout+' · ':index===1?'12 V · '+settings.resistor+' Ω · ':
    index===2?settings.bank+' turns · ':'Study compass · ';
   const comparison=new Map();
   for(const row of state.observations[index]){
    if(row.source!=='Study'||!row.settings.startsWith(group))continue;
    if(index===2&&!row.settings.endsWith(settings.direction>0?'eastbound':'westbound'))continue;
    const key=index===2?row.settings.split(' · ')[1]:row.settings;
    comparison.delete(key);
    comparison.set(key,row);
   }
   const pair=[...comparison.values()].slice(-2);
   const compares=['Record two probe locations on this sheet.','Record both breaker positions at this resistance.',
    'Record both gears with the same coil and travel direction.','Record both current directions.'];
   const pinned='<div class="study-comparison"><strong>Pinned readings</strong>'+
    (pair.length?'<ul>'+pair.map(row=>'<li>'+escape(row.settings)+' <strong>'+escape(row.reading)+'</strong></li>').join('')+'</ul>':'')+
    (pair.length<2?'<p>'+compares[index]+'</p>':'')+'</div>';
   const key=index===0?'<p class="muted study-legend">Lines: equal voltage · Arrow: local electric field</p>':'';
   panel(titles[index],instructions[index],actions,()=>{save();close();},'Back to the study room',
    '<canvas id="'+studyCanvasId+'" class="study-apparatus" width="'+studyLabs.width+'" height="'+studyLabs.height+'" role="img" aria-label="'+descriptions[index]+'"></canvas>'+
    key+'<p id="study-live" class="study-reading" role="status"></p>'+
    (measured?'<p role="status">'+measured.reading+'</p>':''),null,
    pinned+'<details class="study-notes"><summary>Research notes</summary><p>'+
     (index===0?'A voltmeter measures potential relative to the 0 V electrode. This 2D model estimates the local field from the negative voltage gradient on a uniform sheet. '+floors[index].notes:floors[index].notes)+'</p></details>',false);
   $('sheet').classList.add('study-sheet');
   const canvas=$(studyCanvasId),live=$('study-live');
   if(index===0){
    const refresh=()=>{
     const {x,y,layout}=settings;
     const reading=studyLabs.paperReading(layout,x,y);
     const field=reading.field;
     const pins=pair.map(row=>row.settings.match(/x (\d+) cm · y (\d+) cm$/)).filter(Boolean)
      .map(([,px,py])=>[Number(px),studyLabs.rows-1-Number(py)]);
     studyLabs.draw(canvas,0,settings,{...reading,pins});
     live.textContent='x '+x+' cm, y '+(studyLabs.rows-1-y)+' cm · '+reading.value.toFixed(2)+' V · '+
      (field?'|E| '+field.magnitude.toFixed(1)+' V/m (Eₓ '+field.ex.toFixed(1)+', Eᵧ '+field.ey.toFixed(1)+')':'Electrode surface');
    };
    const place=event=>{Object.assign(settings,studyLabs.pick(event,canvas));refresh();};
    canvas.onpointerdown=event=>{canvas.setPointerCapture(event.pointerId);place(event);};
    canvas.onpointermove=event=>{if(canvas.hasPointerCapture(event.pointerId))place(event);};
    canvas.onlostpointercapture=save;
    probeControl={canvas,enabled:probeMode,move(dx,dy){
     settings.x=Math.max(0,Math.min(studyLabs.cols-1,settings.x+dx));
     settings.y=Math.max(0,Math.min(studyLabs.rows-1,settings.y+dy));
     refresh();
     save();
    }};
    refresh();
   }else if(index===1){
    const reading=circuitReading(settings);
    studyLabs.draw(canvas,index,settings,{amps:current(settings)});
    live.textContent=reading.settings+' · '+reading.reading;
   }else if(index===2){
    const {bank,gear,direction}=settings;
    const pulse=measured?{voltage:voltage(bank,gear)*direction}:null;
    const start=performance.now();
    const animate=now=>{
     const duration=gear==='slow'?1600:800;
     const progress=pulse?(reducedMotion()?1:Math.max(0,Math.min(1,(now-start)/duration))):0;
     studyLabs.draw(canvas,index,settings,pulse,progress);
     if(pulse&&progress<1)requestAnimationFrame(time=>{if(canvas.isConnected&&!$('modal').hidden)animate(time);});
    };
    animate(start);
    live.textContent=bank+' turns · '+gear+' · '+(direction>0?'eastbound':'westbound');
   }else{
    studyLabs.draw(canvas,index,settings);
    live.textContent=magneticReading(settings.polarity,'Study compass').reading;
   }
   setChoice(selected,{scroll:false});
   if(wasOpen)$('sheet').scrollTop=priorScroll;
  }
  show();
 }
 function beacon(state,save,complete){
  const sample=(kind,index)=>{
   if(!state.signals[kind].includes(index))state.signals[kind].push(index);
   save();
  };
  const label=(kind,{name,strength},index)=>name+
   (state.signals[kind].includes(index)?' · '+strength+'%':' · unmeasured');
  let feedback='';
  const status=()=>feedback?'<p role="status">'+feedback+'</p>':'';
  const scan=()=>{
   panel('Find the beacon','The receiver needs at least 60% signal. Sample an unmeasured sector, or tune one that meets the threshold.',
    sectors.map((sector,index)=>[label('sectors',sector,index),()=>{
     sample('sectors',index);
     if(sector.strength>=60){
      state.sector=index;
      save();
      feedback=sector.name+' · '+sector.strength+'% signal. Fine tune the receiver.';
      tune();
     }else{
      feedback=sector.name+' · '+sector.strength+'%. Sample an unmeasured sector.';
      scan();
      setChoice(index);
     }
    }]),close,'Back to the lobby',status());
  };
  const tune=()=>{
   panel('Fine tune the receiver','The telescope locks at 90% or higher. Compare the sampled bands and try an unmeasured band.',
    [...bands.map((band,index)=>[label('bands',{...band,name:band.name+' band'},index),()=>{
      sample('bands',index);
      if(band.strength>=90){complete(band.strength);return;}
      feedback=band.name+' band · '+band.strength+'%. Try an unmeasured band.';
      tune();
      setChoice(index);
     }]),['Scan sky sectors',()=>{state.sector=null;save();feedback='';scan();}]],close,'Back to the lobby',status());
  };
  if(state.sector===null)scan();else tune();
 }
 function drawVoltageTrace(line){
  const x=474,y=136;
  line(x,y,x+87,y,'#8c9696',1);
  line(x,y-17,x,y+17,'#8c9696',1);
  for(let i=1;i<voltageTrace.length;i++){
   line(x+(i-1)*3,y-voltageTrace[i-1]*2.5,x+i*3,y-voltageTrace[i]*2.5,teal,2);
  }
 }
 function cancelTrials(){
  pulse=null;
  chargeLanding=null;
  pass=null;
  practice=null;
  voltageTrace=[];
 }
 function updateTrial(id,dt,saved){
  const state=trialState(id,saved);
  if(id===chargeLab&&pulse){
   pulse.elapsed+=dt;
   if(pulse.elapsed<1.05)return null;
   const {strength,settings}=pulse;
   chargeLanding=strength;
   pulse=null;
   const reading='Midpoint field '+(strength?'points '+fieldName(strength):'is zero')+'.';
   const observation=chargeReading(settings);
   if(practice?.room===id)return {index:0,text:observation.reading,observation};
   if(strength===1){
    state.charge.single=true;
    return {index:0,text:'The particles reached the short mark. Add a second eastward contribution to reach the collector.',observation};
   }
   if(strength===2&&state.charge.single)return {index:0,text:'Particles reached the collector. The dust curtain lifts.',reading,solved:true,observation};
   if(strength===2)return {index:0,text:'The pulse reached the collector. Isolate one contributing cell and run a short-mark calibration before powering the shield.',observation};
   return {index:0,text:reading+(strength<0?' The positive test particles moved west. Reverse a cell contribution.':' The positive test particles stayed at the source.'),observation};
  }
  if(id!==inductionLab||!pass)return null;
  const trial=state.induction;
  const {start,end,direction,bank,gear}=pass;
  const speed=(rail.end-rail.start)/gears[gear].travel;
  pass.elapsed+=dt;
  const distance=Math.min(Math.abs(rail[end]-rail[start]),pass.elapsed*speed);
  pass.x=rail[start]+direction*distance;
  pass.voltage=pass.x>=rail.start&&pass.x<=rail.end?direction*voltage(bank,gear):0;
  if(pass.elapsed>=voltageTrace.length*.14&&voltageTrace.length<29)voltageTrace.push(pass.voltage);
  if(distance<Math.abs(rail[end]-rail[start]))return null;
  pass=null;
  const alreadyCompared=compared(trial);
  const magnitude=voltage(bank,gear);
  const seconds=gears[gear].seconds;
  const reading=signed(magnitude*direction)+' V in '+seconds.toFixed(2)+' s';
  trial.end=end;
  trial.last=bank+' turns · '+reading;
  trial.trials[bank]=(trial.trials[bank]||0)|(gear==='slow'?1:2);
  if(Math.abs(magnitude-6)<=.5)trial.targetReading=reading;
  const qualified=compared(trial);
  const solved=qualified&&Boolean(trial.targetReading);
  const feedback=solved?' Generator online. Qualifying pass: '+trial.targetReading+'.':
   !alreadyCompared&&qualified?' Speed comparison recorded.':'';
  const observation=inductionReading(bank,gear,direction);
  const reportReading=solved?'20 turns · '+trial.targetReading:trial.last;
  return {index:2,text:reading+' (model time).'+(practice?.room===id?' Try another setting or reset at either end.':feedback),solved,reading:reportReading,observation};
 }
 function useCharge(control,state){
  const trial=state.charge;
  if(pulse)return {text:'The test pulse is in flight.'};
  if(control==='check'){
   if(!trial.held)return {text:'Ask Mira to hold the plate and open the test shutter.'};
   const strength=field(trial);
   pulse={strength,elapsed:0,settings:{west:trial.west,east:trial.east}};
   return {text:'Test pulse released. Watch the positive particles.'};
  }
  if(chargeSlots.includes(control))return swapPart(trial,control,state);
  return pickUp(control,state);
 }
 function useCircuit(control,state){
  const trial=state.circuit;
  if(control==='check'){
   const amps=current(trial);
   const reading='Ammeter: '+amps+' A at 12 V.';
   const detail=!trial.linked?' The bridge gap is open.':!trial.on?' The breaker is open.':
    !trial.resistor?' The resistor socket is empty.':amps<2?' The load is underpowered.':amps>2?' The load is drawing too much current.':' Instrument supply online.';
   return {text:reading+detail,solved:amps===2,reading,observation:circuitReading(trial)};
  }
  if(control==='breaker'){
   trial.on=!trial.on;
   const amps=current(trial);
   // The live ammeter displays zero on the open side of every breaker test.
   const observation=trial.linked&&trial.resistor?circuitReading({...trial,on:false}):null;
   return {text:trial.on?'Breaker closed. The meter reads '+amps+' A.':'Breaker open. The current is zero.',observation};
  }
  if(control==='bridge'){
   if(trial.linked)return {text:'The bridge link is seated. Check the resistor and breaker next.'};
   if(trial.on)return {text:'Open the breaker before bridging the wiring gap.'};
   if(state.carry!=='link')return {text:'Bring the brass bridge link from its rack to close this gap.'};
   trial.linked=true;
   state.carry=null;
   return {text:'Bridge seated. The loop still needs a resistor and a closed breaker.'};
  }
  if(control==='resistor'){
   if(trial.on)return {text:'Open the breaker before swapping resistors.'};
   if(state.carry==='link')return {text:'Take the bridge link to the wiring gap on the west side.'};
   return swapPart(trial,control,state);
  }
  return pickUp(control,state);
 }
 function useInduction(control,trial){
  if(control.endsWith('-reset')){
   pass=null;
   voltageTrace=[];
   trial.end=control.split('-')[0];
   return {text:'Carriage reset to the '+trial.end+' end. Completed readings are kept.'};
  }
  if(pass)return {text:'The carriage is moving. Wait for the reading or reset it at either end.'};
  if(control==='gear'){
   trial.gear=trial.gear==='slow'?'fast':'slow';
   return {text:'Carriage set to '+trial.gear+' gear.'};
  }
  if(control==='bank'){
   trial.turns=trial.turns===10?20:10;
   return {text:trial.turns+'-turn coil bank connected.'};
  }
  const start=control.split('-')[0];
  if(start!==trial.end)return {text:'The carriage is parked at the '+trial.end+' end. Use the nearby reset to bring it here.'};
  const end=start==='west'?'east':'west';
  voltageTrace=[0];
  pass={start,end,direction:start==='west'?1:-1,bank:trial.turns,gear:trial.gear,elapsed:0,x:rail[start],voltage:0};
  return {text:'Carriage running in '+trial.gear+' gear.'};
 }
 function compassOverlay(id,saved,player,art){
  const {compass,polarity}=trialState(id,saved).coil;
  if(id!==magneticLab||!compass)return;
  const {rect,line,label}=art;
  const onAxis=Math.abs(player.y-coil.reference[1])<=22&&player.x>=coil.reference[0]-32&&player.x<=coil.dock[0]+32;
  const x=player.x,y=Math.max(72,player.y-46);
  rect(x-38,y-12,76,22,'#182334');
  if(!onAxis){label('FIND AXIS',x,y+3,gold,10);return;}
  arrow(line,x,y,polarity*21,teal);
  label('N',x+polarity*30,y+3,gold,11);
 }

 function useMagnetic(control,trial){
  if(control==='compass'){
   trial.compass=true;
   return {text:'Compass picked up. Open it with Research away from the docks to show the live needle.'};
  }
  if(control==='polarity'){
   trial.polarity*=-1;
   trial.dock=null;
   return {text:'Current reversed.'};
  }
  if(!trial.compass)return {text:'Pick up the portable compass at the west rack first.'};
  const direction=trial.polarity>0?'east':'west';
  if(control==='reference'){
   trial.seen|=trial.polarity>0?1:2;
   return {text:'Reference: '+direction+'.',observation:magneticReading(trial.polarity,'Reference dock')};
  }
  if(control==='dock'){
   if(trial.seen!==3)return {text:'Compare both current directions at the reference dock first.'};
   trial.dock=trial.polarity;
   return {text:'Relay dock: '+direction+'.',observation:magneticReading(trial.polarity,'Relay dock')};
  }
  if(trial.dock!==-1)return {text:'Take a westward reading at the relay dock first.'};
  return {text:'Tracking relay locked west. The mount slews into position.',solved:true,
   reading:'Reference: east with current A, west with current B. Relay dock verified west.'};
 }
 function swapPart(trial,slot,state){
  const previous=trial[slot];
  if(previous===null&&state.carry===null)return {text:'The socket is empty. Pick up a part first.'};
  trial[slot]=state.carry;
  state.carry=previous;
  return {text:trial[slot]===null?'Removed the '+partLabel(previous)+'.':
   'Seated '+partLabel(trial[slot])+'.'+(previous===null?'':' Now carrying the '+partLabel(previous)+'.')};
 }
 function pickUp(item,state){
  if(state.carry!==null){
   if(state.carry===item){
    state.carry=null;
    return {text:'Returned the '+partLabel(item)+' to its rack.'};
   }
   return {text:'Return the '+partLabel(state.carry)+' at the return rack or seat it in a socket.'};
  }
  state.carry=item;
  return {text:'Carrying the '+partLabel(item)+'.'};
 }
 function returnPart(id,saved){
  const state=trialState(id,saved);
  if(state.carry===null||![0,1].includes(floorFor(id)?.index))return false;
  state.carry=null;
  return true;
 }
 function useControl(id,control,saved){
  const state=trialState(id,saved);
  const index=floorFor(id)?.index;
  if(control==='rack'){
   return {text:returnPart(id,state)?'Part returned to its rack.':'You are not carrying a part.'};
  }
  if(index===0)return useCharge(control,state);
  if(index===1)return useCircuit(control,state);
  if(index===2)return useInduction(control,state.induction);
  return useMagnetic(control,state.coil);
 }
 return {lobby,secret,offworld,entrance,entry,telescopeSpawn,exit,exteriorSpawn,technician,floors,rooms,passages,inside,floorFor,fresh,restore,done,confirmed,awaitingReport,ready,nextFloor,leadName,locked,objective,blocks,instrument,labStep,reportLead,moveStudyProbe,
  controls,people,backgroundPeople,drawStudyWork,dispatch,studies,studyAnswered,useControl,togglePractice,trialState,record,reportEvidence,followUp,observationsHTML,reaction,escape,demonstration,beacon,returnPart,cancelTrials,updateTrial,carryLabel,drawRoom,frame,showIntro,showReveal,panel,compassOverlay};
})();
