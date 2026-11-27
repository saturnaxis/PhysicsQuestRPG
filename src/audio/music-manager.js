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
  this.dialogueBlips = true;
  this.lastCue = new Map();
  this.fanfare = null;
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
   this.dialogueBlips = preferences?.dialogueBlips !== false;
  } catch {}
 }

 setPreferences(volume, muted) {
  this.volume = Math.max(0, Math.min(100, Math.round(volume)));
  this.muted = muted;
  this.updateMaster();
  this.savePreferences();
 }

 setDialogueBlips(enabled) {
  this.dialogueBlips = enabled;
  this.savePreferences();
 }

 savePreferences() {
  const {volume, muted, dialogueBlips} = this;
  try { localStorage.setItem(BackgroundMusic.settingsKey, JSON.stringify({volume, muted, dialogueBlips})); } catch {}
 }

 // Duck the soundtrack without changing the effect level or saved preference.
 setDucking(multiplier = 1) {
  this.duck = Math.max(0, Math.min(1, multiplier));
  this.updateMaster();
 }

 updateMaster() {
  if (!this.master) return;
  const level = this.muted ? 0 : this.volume / 100;
  this.master.gain.setTargetAtTime(level * this.duck, this.context.currentTime, .025);
  this.effects.gain.setTargetAtTime(level, this.context.currentTime, .025);
 }

 get canPlayEffects() {
  return !this.muted && this.volume > 0 && this.active && this.context?.state === 'running';
 }

 allowCue(name, interval) {
  if (!this.canPlayEffects) return false;
  const now = this.context.currentTime;
  if (now - (this.lastCue.get(name) ?? -Infinity) < interval) return false;
  this.lastCue.set(name, now);
  return true;
 }

 playDiscoveryCue() { this.tone('triangle', 523, 784, .16, .16); }
 playDoorCue() {
  if (this.allowCue('latch', .11)) this.tone('square', 210, 112, .065, .07);
 }
 playDialCue() {
  if (this.allowCue('dial', .055)) this.tone('square', 410, 260, .033, .035);
 }
 playDialogueCue(name) {
  if (!this.dialogueBlips || !this.allowCue('dialogue', .095)) return;
  const pitch = 260 + (name.codePointAt(0) || 0) % 9 * 22;
  this.tone('triangle', pitch, pitch * .92, .034, .035);
 }
 playRepairCue() {
  if (!this.allowCue('repair', .55)) return;
  this.setDucking(.52);
  [523, 659, 784, 1047].forEach((pitch, index) => {
   const voice = this.tone('triangle', pitch, pitch, .19, index===3?.24:.1, index*.09);
   if (index===3 && voice) this.fanfare = voice;
  });
  if (!this.fanfare) this.setDucking();
 }
 playObservatoryCue(gate = false) {
  this.tone('triangle', 440, 659.25, .12, .18);
  this.tone('triangle', 783.99, gate ? 1174.66 : 880, .14, .23, .11);
 }
 playBlockCue() { this.tone('triangle', 147, 74, .08, .09); }
 playPlateCue() { this.tone('triangle', 392, 523.25, .1, .12, .13); }
 playCouplingCue() {
  if (!this.allowCue('cart', .08)) return;
  this.tone('triangle', 154, 57, .16, .11);
  this.noise(.075,.07,870);
 }
 playHydraulicCue() {
  if (this.allowCue('hydraulic', .22)) this.noise(.36,.20,1550);
 }

 tone(type, first, second, level, duration, delay = 0) {
  if (!this.canPlayEffects || !this.context.createOscillator) return null;
  const voice = this.context.createOscillator();
  const start = this.context.currentTime + delay;
  voice.type = type;
  voice.frequency.setValueAtTime(first,start);
  voice.frequency.linearRampToValueAtTime(second,start+duration*.72);
  this.playVoice(voice,start,level,duration);
  return voice;
 }

 noise(duration, level, frequency) {
  const context = this.context;
  const voice = context.createBufferSource();
  if (!this.noiseBuffer) {
   this.noiseBuffer = context.createBuffer(1, Math.ceil(.4 * context.sampleRate), context.sampleRate);
   const samples = this.noiseBuffer.getChannelData(0);
   for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }
  voice.buffer = this.noiseBuffer;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = frequency;
  voice.connect(filter);
  this.playVoice(voice,context.currentTime,level,duration,filter);
 }

 playVoice(voice, start, level, duration, filter) {
  const envelope = this.context.createGain();
  const release = start+duration;
  envelope.gain.setValueAtTime(0,start);
  envelope.gain.linearRampToValueAtTime(level,start+Math.min(.016,duration/3));
  envelope.gain.linearRampToValueAtTime(0,release);
  (filter || voice).connect(envelope);
  envelope.connect(this.effects);
  voice.onended = () => {
   voice.disconnect();
   filter?.disconnect();
   envelope.disconnect();
   if (this.fanfare === voice) {
    this.fanfare = null;
    this.setDucking();
   }
  };
  voice.start(start);
  voice.stop(release);
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
   this.effects = this.context.createGain();
   const level = this.muted ? 0 : this.volume / 100;
   this.master.gain.value = level * this.duck;
   this.effects.gain.value = level;
   this.master.connect(this.context.destination);
   this.effects.connect(this.context.destination);
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
  this.fanfare = null;
  this.setDucking();
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
