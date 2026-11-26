'use strict';

if ('serviceWorker' in navigator) {
  const status = document.getElementById('offline-status');
  const say = message => {
    status.textContent = message;
    status.hidden = false;
  };

  say('Preparing offline play…');
  navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then(registration => {
    const watchInstall = () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'redundant' && !registration.active) say('Offline setup incomplete. Reopen while online to retry.');
      });
    };
    watchInstall();
    registration.addEventListener('updatefound', watchInstall);
    return navigator.serviceWorker.ready;
  }).then(() => say('Offline ready')).catch(() => say('Offline setup unavailable'));
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
  if (!event.target.closest('#screen-mode')) requestScreen();
}, { capture: true, once: true });
document.addEventListener('fullscreenchange', syncScreenButton);
document.addEventListener('webkitfullscreenchange', syncScreenButton);
nativeFullscreen.addEventListener?.('change', syncScreenButton);
syncScreenButton();

function placeTouchControls(frame, canvas, width, height) {
  const aspect = canvas.width / canvas.height;
  const side = Math.max(0, (width - height * aspect) / 2);
  const vertical = Math.max(0, (height - width / aspect) / 2);
  const layout = side >= 150 && height >= 200 ? 'wide-sides' :
    side >= 56 && height >= 200 ? 'compact-sides' : vertical >= 100 ? 'letterbox' : 'overlay';
  frame.dataset.touchLayout = layout;
  frame.style.setProperty('--side-gutter', side + 'px');
  frame.style.setProperty('--vertical-gutter', vertical + 'px');
}

const playfield = document.querySelector('.frame');
const gameCanvas = playfield.querySelector('canvas');
const resizeControls = () => placeTouchControls(playfield, gameCanvas, playfield.clientWidth, playfield.clientHeight);
if ('ResizeObserver' in window) new ResizeObserver(resizeControls).observe(playfield);
else window.addEventListener('resize', resizeControls);
resizeControls();
