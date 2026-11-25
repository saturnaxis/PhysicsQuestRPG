# Physics Quest · Mechanics Castle

This is the static, installable edition of Mechanics Castle, including the optional Alder Orchard irrigation arm and Service Gulch survey turntable. Keep the files and folders together.

## Publish on GitHub Pages

1. Extract the ZIP and commit its contents to the publishing location in your repository. Make sure `index.html` and `.nojekyll` are at the top of that location.
2. Open **Settings → Pages**. Choose **Deploy from a branch**, then choose your branch and **/(root)**. If you put the files in `docs/`, choose **/docs** instead.
3. Open the published HTTPS URL. Wait for **Offline ready** before disconnecting. The first visit downloads the game, art, and music. Install the app from your browser to launch fullscreen on supported devices. In a regular browser tab, the first game interaction requests fullscreen where available. The Fullscreen button can also enter or exit fullscreen. Touchscreen controls stay below the game in portrait and landscape.

Progress and settings are saved in the browser. A new GitHub Pages origin starts with a fresh save. This package uses the same game save format as the hosted version.

## Update the offline files

When you edit the game or its assets, run `python3 tools/refresh-pwa-cache.py` (Python 3.11+) and commit the updated `sw.js` with your files. Add any new asset types or locations to the script so they are available offline. After an update, close all open copies of the game and reopen it online to let the new worker take over.

[GitHub Pages publishing source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
