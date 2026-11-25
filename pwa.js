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
