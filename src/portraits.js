'use strict';

const portraits = (() => {
 const names = [
  'Rowan','Sage','Mira','Inez','Teo','Sol','Fen','Lin',
  'Pax','Uma','Dev','Kit','Ada','Ren','Jo','Bea','Neri',
  'Ellis','June','Rory','Lena','Alex','Priya','Finn','Nia','Sam','Tess',
  'Ari','Eli','Leah','Owen','Joss','Mina','Tali','Noah','Zoe',
  'Vega','Orin','Tamsin','Elio','Suri','Kez','Sana','Niko','Vela'
 ];
 const expressive = new Set(['Rowan','Sage','Inez','Sol']);
 const miraExpressions = ['happy','explaining','thinking','surprised','concerned','celebratory','relieved','determined'];
 const registry = new Map(names.map(name => [name,'art/portraits/'+name.toLowerCase()+'.webp']));
 const get = (speaker, mood) => {
  const name = speaker.split(' ').at(-1);
  if (expressive.has(name)) {
   const expression = {thinking:'thinking',explaining:'thinking',happy:'happy',celebratory:'happy',concerned:'concerned'}[mood];
   if (expression) return 'art/portraits/'+name.toLowerCase()+'-'+expression+'.webp';
  }
  if (name === 'Mira' && miraExpressions.includes(mood)) return 'art/portraits/mira-'+mood+'.webp';
  if (name === 'Vega' && mood === 'explaining') return 'art/portraits/vega-explaining.webp';
  if (name === 'Vela' && mood === 'happy') return 'art/portraits/vela-happy.webp';
  return registry.get(name);
 };
 return {get};
})();
