# Physics Quest: Mechanics Castle

A top-down physics adventure for East Texas A&M University’s planetarium lobby and Physics Day. Play as Rowan or Sage, rescue Mira from a stalled lift, and use mechanics experiments to restore the castle. This prebuilt edition runs in a browser and can be installed as a progressive web app.

## Play

| Action | Keyboard | Gamepad | Touchscreen |
|---|---|---|---|
| Move or change a selection | `W/A/S/D` or arrow keys | D-pad | Onscreen D-pad |
| Interact, select, or test a setting | `E` | A | Context button |
| Go back or cancel a setting | `C` or `Escape` in a menu | B | Back |
| Take a reading or open the Field Notebook | `N` or `X` | X | Research |
| Pause or open settings | `P` | Y | Menu |

The right-hand Interact button changes its label when you approach a person, an object, or a door. Talk to the operator, find the repair plan, then test a prediction at the apparatus. Repair the lift, compare friction lanes, balance forces, transfer momentum between carts, balance the bridge, and operate the hydraulic gate. Report each repair before moving on. The Flywheel Guardian shows the signed momentum of both carts after each attempt. Read the diagnostics after stopping it on both passes.

After the castle, follow the valley road toward the Desert Observatory. Take the optional detour to **Alder Orchard** to compare centripetal acceleration at the same speed on two tracks, then visit **Service Gulch** to see how pulling weights inward changes a turntable’s angular speed. Both investigations record their results in the Field Notebook. Open the service gate from Sandstone Pass to unlock the shortcut back through the orchard.

Music changes with the location, with separate themes for the castle approach, castle interior, challenge rooms, and overworld. The four FLAC tracks use 1.5-second crossfades. Volume starts at 10% and can be adjusted or muted from the title or pause menu. The browser may wait for the first interaction before playing audio. [Soundtrack notes](src/audio/LOOP-NOTES.md)

## Local setup

The game uses plain HTML, CSS, and JavaScript. The repository includes both the editable site in `src/` and the built site in `docs/`. No npm install is needed. Rebuilding requires Python 3.11 or later.

Run these commands from the repository root.

```bash
python tools/build-pages.py
python -m http.server 8000 --directory docs
```

Open [localhost:8000](http://localhost:8000/) and wait for **Offline ready** to test offline play. On Windows, you can substitute `py -3` for `python`.

## GitHub Pages

1. Commit `src/`, `tools/`, `docs/`, and this README to `main`. The included `docs/` is ready to publish, including `docs/.nojekyll`.
2. Open **Settings → Pages** and choose **Deploy from a branch**, then select **main** and **/docs**. [GitHub Pages publishing source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
3. Open the [published game](https://saturnaxis.github.io/PhysicsQuestRPG/). The `docs` folder serves as the site root.

For updates, edit the files under `src/`, run `python tools/build-pages.py`, and commit the source and regenerated `docs/` together. The build replaces generated `docs/` and refreshes the service worker’s offline asset list and cache key. Keep manual edits in `src/`. Add new asset types or locations to the build script so they are included in the cache. Close all open copies of the game and reopen it online to load an update.

### Verify Google Tag Manager

The deployment uses `GTM-M3294GNF`. In Tag Manager, use **Preview** and connect to the exact published HTTPS game URL in a regular browser tab. Use a fresh browser profile to avoid testing an older cached page. If the container appears but the Google Analytics tag does not, check that the container has a **Google tag** with the GA4 web stream’s `G-…` measurement ID and the **Initialization – All Pages** trigger. Test it in Preview, then publish the container. Analytics requires an internet connection.

## Architecture

- `src/index.html` — game shell, room progression, Field Notebook, and save handling
- `src/gameplay.js` — movement, collision, and interaction targeting
- `src/science-labs.js` — castle apparatus, experiment rules, and readings
- `src/valley-investigations.js` — orchard and gulch experiments
- `src/audio/music-manager.js` — soundtrack playback, crossfades, and volume settings
- `src/pwa-layout.css`, `src/pwa.js`, `src/manifest.webmanifest`, and `src/sw.js` — responsive controls, fullscreen, installation, and offline caching

## Kiosk notes

Open the published game in a Chromium-based browser or install it as a PWA. The installed game starts fullscreen on supported devices. In a regular tab, the first interaction requests fullscreen and a **Fullscreen** button is available where supported. Touch controls use the side gutters when space allows. The D-pad keeps its cross shape and sits at the lower left when the gutter is too narrow. On phones in landscape, tap **More** in the top bar to read the full room messages.

Progress and audio settings are saved in the browser. For an offline kiosk, wait for **Offline ready** while the device is online, then reload the game offline to check the installation.
