'use strict';

if ('serviceWorker' in navigator) {
  const status = document.getElementById('offline-status');
  const say = message => {
    status.textContent = message;
    status.hidden = false;
  };

  const update = document.getElementById('game-update');
  say('Preparing offline play…');
  navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then(registration => {
    const showWaiting = () => {
      update.hidden = !registration.waiting;
      if (registration.waiting) say('Game update available');
    };
    const watchInstall = () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed') showWaiting();
        if (worker.state === 'redundant' && !registration.active) say('Offline setup incomplete. Reopen while online to retry.');
      });
    };
    showWaiting();
    watchInstall();
    registration.addEventListener('updatefound', watchInstall);
    navigator.serviceWorker.ready.then(() => {
      if (!registration.waiting) say('Offline ready');
    });
  }).catch(() => say('Offline setup unavailable'));
}

const screenMode = document.getElementById('screen-mode');
const screenRoot = document.documentElement;
const enterFullscreen = screenRoot.requestFullscreen || screenRoot.webkitRequestFullscreen;
const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
const nativeFullscreen = window.matchMedia('(display-mode: fullscreen)');
const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;

function syncScreenButton() {
  const active = Boolean(fullscreenElement());
  const allowed = document.fullscreenEnabled ?? document.webkitFullscreenEnabled ?? Boolean(enterFullscreen);
  screenMode.hidden = !(active && exitFullscreen || allowed && enterFullscreen && !nativeFullscreen.matches);
  screenMode.textContent = active ? 'Exit fullscreen' : 'Fullscreen';
}

function requestScreen() {
  if (screenMode.hidden || fullscreenElement()) return;
  try {
    Promise.resolve(enterFullscreen.call(screenRoot)).catch(() => {});
  } catch {
    // Some browsers restrict fullscreen in embedded windows.
  }
}

screenMode.addEventListener('click', () => {
  if (fullscreenElement()) {
    try {
      Promise.resolve(exitFullscreen.call(document)).catch(() => {});
    } catch {
      // The browser may have already left fullscreen.
    }
  } else requestScreen();
});
document.addEventListener('click', event => {
  if (!event.target.closest('#screen-mode, #touch-mode')) requestScreen();
}, { capture: true, once: true });
document.addEventListener('fullscreenchange', syncScreenButton);
document.addEventListener('webkitfullscreenchange', syncScreenButton);
nativeFullscreen.addEventListener?.('change', syncScreenButton);
syncScreenButton();

const playfield = document.querySelector('.frame');
const touchMode = document.getElementById('touch-mode');
let autoTouch = false;
let touchInUse = false;
try { autoTouch = localStorage.getItem('physics-quest-touch-mode') === 'auto'; } catch {}

function syncTouchMode() {
  playfield.dataset.controlsHidden = autoTouch && !touchInUse ? 'true' : 'false';
  touchMode.textContent = autoTouch ? 'Touch: auto' : 'Touch: on';
  touchMode.setAttribute('aria-label', autoTouch ? 'Touch controls automatic' : 'Touch controls always visible');
}

touchMode.addEventListener('click', () => {
  autoTouch = !autoTouch;
  touchInUse = false;
  try { localStorage.setItem('physics-quest-touch-mode', autoTouch ? 'auto' : 'on'); } catch {}
  syncTouchMode();
});
window.addEventListener('pointerdown', event => {
  if (!autoTouch || event.pointerType !== 'touch' || touchInUse) return;
  touchInUse = true;
  syncTouchMode();
}, { passive: true });
window.addEventListener('keydown', () => {
  if (!autoTouch || !touchInUse) return;
  touchInUse = false;
  syncTouchMode();
});
syncTouchMode();
