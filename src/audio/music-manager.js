'use strict';

const castleThemes = ['mechanics_exterior','mechanics_interior','challenge_room','overworld'];
const observatoryThemes = ['observatory_lobby','observatory_challenge','observatory_study','observatory_signal'];

function chapterTheme(index, castleComplete) {
 if (index === observatory.lobby) return 'observatory_lobby';
 if (index === observatory.secret) return 'observatory_signal';
 const floor = observatory.floorFor(index);
 if (floor) return floor.room === index ? 'observatory_challenge' : 'observatory_study';
 if ((index >= 10 && index < 16) || index === observatory.offworld) return 'overworld';
 if (index === 0 || index === 9) return castleComplete ? 'overworld' : 'mechanics_exterior';
 if (index >= 1 && index <= 6) return 'challenge_room';
 return 'mechanics_interior';
}

class BackgroundMusic {
 static settingsKey = 'physics-quest-music-v1';
 static fadeSeconds = 1.5;

 constructor() {
  this.volume = 10;
  this.muted = false;
  this.duck = 1;
  this.context = null;
  this.master = null;
  this.target = null;
  this.current = null;
  this.retiring = null;
  this.pending = new Map();
  this.positions = new Map();
  this.active = true;
  this.request = 0;
  this.warmPass = 0;
  try {
   const preferences = JSON.parse(localStorage.getItem(BackgroundMusic.settingsKey));
   if (Number.isFinite(preferences?.volume)) this.volume = Math.max(0, Math.min(100, preferences.volume));
   this.muted = preferences?.muted === true;
  } catch {}
 }

 setPreferences(volume, muted) {
  this.volume = Math.max(0, Math.min(100, Math.round(volume)));
  this.muted = muted;
  this.updateMaster();
  try { localStorage.setItem(BackgroundMusic.settingsKey, JSON.stringify({volume:this.volume, muted:this.muted})); } catch {}
 }

 // Reserved for a future fanfare bus. This never changes the saved preference.
 setDucking(multiplier = 1) {
  this.duck = Math.max(0, Math.min(1, multiplier));
  this.updateMaster();
 }

 updateMaster() {
  if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume / 100 * this.duck, this.context.currentTime, .025);
 }

 playDiscoveryCue() { this.playCue(523.25, 659.25, .16); }
 playDoorCue() { this.playCue(220, 293.66, .09); }
 playRepairCue() { this.playCue(659.25, 880, .18); }
 playObservatoryCue(gate = false) {
  this.playCue(440, 659.25, .12);
  this.playCue(783.99, gate ? 1174.66 : 880, .14, .11);
 }
 playBlockCue() { this.playCue(146.83, 92.5, .08); }
 playPlateCue() { this.playCue(392, 523.25, .10, .22); }

 playCue(firstTone, secondTone, level, delay = 0) {
  const context = this.context;
  if (this.muted || !this.volume || !this.active || context?.state !== 'running' || !context.createOscillator) return;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const now = context.currentTime + delay;
  oscillator.frequency.setValueAtTime(firstTone, now);
  oscillator.frequency.setValueAtTime(secondTone, now + .09);
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(level, now + .02);
  envelope.gain.linearRampToValueAtTime(0, now + .20);
  oscillator.connect(envelope);
  envelope.connect(this.master);
  oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  oscillator.start(now);
  oscillator.stop(now + .21);
 }

 unlock() {
  if (!this.active || document.hidden) return;
  if (!this.context) {
   const Context = window.AudioContext || window.webkitAudioContext;
   if (!Context) return;
   try { this.context = new Context({sampleRate:32000}); } catch {
    try { this.context = new Context(); } catch { return; }
   }
   this.master = this.context.createGain();
   this.master.gain.value = this.muted ? 0 : this.volume / 100;
   this.master.connect(this.context.destination);
  }
  if (this.context.state === 'running') { this.reconcile(); return; }
  this.context.resume().then(() => this.reconcile()).catch(() => {});
 }

 setTheme(theme) {
  if (this.target === theme) return;
  this.target = theme;
  this.request++;
  if (theme && this.context?.state === 'running' && this.retiring) this.load(theme).catch(() => {});
  this.reconcile();
 }

 load(theme) {
  if (!this.pending.has(theme)) {
   const task = fetch('audio/music/' + theme + '.flac').then(response => {
    if (!response.ok) throw new Error('Music asset unavailable');
    return response.arrayBuffer();
   }).then(bytes => this.context.decodeAudioData(bytes));
   this.pending.set(theme, task);
   task.catch(() => {if (this.pending.get(theme) === task) this.pending.delete(theme);});
  }
  return this.pending.get(theme);
 }

 reconcile() {
  if (!this.active || this.context?.state !== 'running' || this.retiring || this.current?.theme === this.target) return;
  if (!this.target) {
   if (this.current) this.switchTo(null);
   return;
  }
  const theme = this.target, token = this.request;
  if (this.waiting === token) return;
  this.waiting = token;
  this.load(theme).then(buffer => {
   if (this.waiting === token) this.waiting = undefined;
   if (this.active && this.context.state === 'running' && this.request === token && !this.retiring && this.current?.theme !== theme) {
    this.switchTo(theme, buffer);
   }
  }).catch(() => {
   if (this.waiting === token) this.waiting = undefined;
  });
 }

 switchTo(theme, buffer) {
  const now = this.context.currentTime, outgoing = this.current;
  const fade = outgoing ? BackgroundMusic.fadeSeconds : .24;
  this.current = null;
  if (theme) {
   const source = this.context.createBufferSource(), gain = this.context.createGain();
   const offset = (this.positions.get(theme) || 0) % buffer.duration;
   source.buffer = buffer;
   source.loop = true;
   source.loopEnd = buffer.duration;
   source.connect(gain);
   gain.connect(this.master);
   this.setEnvelope(gain.gain, now, fade, 1, true);
   source.start(now, offset);
   this.current = {theme, source, gain, started:now, offset, duration:buffer.duration, fade};
   this.warmCache();
  }
  if (outgoing) {
   this.retiring = outgoing;
   const progress = Math.min(1, (now - outgoing.started) / outgoing.fade);
   this.setEnvelope(outgoing.gain.gain, now, fade, Math.sin(progress * Math.PI / 2), false);
   this.positions.set(outgoing.theme, (outgoing.offset + now + fade - outgoing.started) % outgoing.duration);
   outgoing.source.onended = () => {
    outgoing.source.disconnect();
    outgoing.gain.disconnect();
    if (this.retiring !== outgoing) return;
    this.retiring = null;
    this.reconcile();
   };
   outgoing.source.stop(now + fade);
  }
 }

 warmCache() {
  const group = observatoryThemes.includes(this.current.theme) ? observatoryThemes : castleThemes;
  if (this.warming === group) return;
  this.warming = group;
  const pass = ++this.warmPass;
  // The outgoing source already holds its buffer. Keep decoded tracks for the current chapter only.
  for (const theme of this.pending.keys()) {
   if (!group.includes(theme)) this.pending.delete(theme);
  }
  const themes = group.filter(theme => theme !== this.current.theme);
  const idle = callback => window.requestIdleCallback ? window.requestIdleCallback(callback) : setTimeout(callback, 250);
  const next = () => {
   if (this.warmPass !== pass) return;
   if (!this.active || this.context.state !== 'running') { this.warming = null; return; }
   const theme = themes.shift();
   if (theme) this.load(theme).catch(() => {}).finally(() => idle(next));
  };
  idle(next);
 }

 setEnvelope(param, start, duration, scale, rising) {
  // Cancel a just-started fade before replacing it, even during rapid navigation.
  if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(start);
  else param.cancelScheduledValues(start);
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
   const phase = i / steps * Math.PI / 2;
   const level = scale * (rising ? Math.sin(phase) : Math.cos(phase));
   if (i === 0) param.setValueAtTime(level, start);
   else param.linearRampToValueAtTime(level, start + duration * i / steps);
  }
 }

 exit() {
  this.active = false;
  this.request++;
  for (const voice of [this.current, this.retiring]) {
   if (!voice) continue;
   voice.source.onended = null;
   try { voice.source.stop(); } catch {}
   voice.source.disconnect();
   voice.gain.disconnect();
  }
  this.current = null;
  this.retiring = null;
  if (this.context) this.context.suspend().catch(() => {});
 }

 restore() {
  this.active = true;
  if (this.context) this.unlock();
 }
}

const music = new BackgroundMusic();
