'use strict';

const fieldEvents = (() => {
 function create(events) {
  const milestones = new Set(events.flatMap(event => event.once ? [event.once] : []));
  function restore(saved) {
   return Array.isArray(saved) ? [...new Set(saved.filter(id => milestones.has(id)))] : [];
  }
  function dispatch(trigger, context, progress, actions) {
   for (const event of events) {
    if (event.trigger !== trigger || !event.when(context)) continue;
    if (event.once && progress.includes(event.once)) continue;
    // A milestone records an event that has started. Interactive choices dispatch separately.
    if (event.once) progress.push(event.once);
    for (const action of event.steps) actions[action](context);
    return true;
   }
   return false;
  }
  return {restore, dispatch};
 }
 return {create};
})();
