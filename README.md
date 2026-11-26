# Physics Quest: Mechanics Castle

**Physics Quest: Mechanics Castle** is a top-down science adventure designed for East Texas A&M University’s planetarium lobby and Physics Day. Choose Rowan or Sage, rescue Mira from a stalled lift, and use mechanics experiments to restore the castle, then follow its records to the Desert Observatory. The game runs in a browser and can be installed as a progressive web app (PWA) for portrait or landscape play on a phone or tablet.

Built with HTML, CSS, and JavaScript. Canvas draws the rooms and characters using original pixel art.

## Play

Open [Mechanics Castle](https://saturnaxis.github.io/PhysicsQuestRPG/). Choose an avatar, talk to the lift operator, and find the repair plan. At each station, read the evidence, predict a setting, and test it on the apparatus. Report your findings to the operator to open the next route.

| Action | Keyboard | Gamepad | Mouse or touch |
| --- | --- | --- | --- |
| Move or browse choices | W/A/S/D or arrow keys | Left stick to move, D-pad to move or select | Hold an arrow to move or tap to select |
| Talk, adjust equipment, or confirm | E | A | **Interact** or **Use**, with the available action in the status bar |
| Go back or cancel | C or Esc in a menu | B | **Back / Card** or the dialog’s back button |
| Take a reading or open the Field Notebook | N or X | X | **Read** or **Notes** |
| Pause or open settings | P | Y | **Menu** |
| Toggle full screen | Use the page button | | **Fullscreen**, where supported |

### Repair plans, readings, and progress

- **Repair plans.** Inspect the drafting table, reference book, or computer in the research rooms for measurements and operating limits.
- **Field Notebook.** Review evidence and equipment readings. The orchard and gulch investigations record their own results.
- **Saved progress.** Continue your run from the title screen. Earned starting areas let you return to later parts of the game.
- **Valley shortcut.** The service gate opens from Sandstone Pass and links it back to Alder Orchard through Service Gulch.

## Research areas

| Area | Investigation | What you do |
| --- | --- | --- |
| Castle approach | **Counterweight lift** | Compare the rope’s upward pull with the weight of the lift and its passenger. |
| First floor | **Friction lanes** | Launch sleds at the same speed and compare stopping distances on different surfaces. |
| First floor | **Force calibration** | Choose a test mass for a target acceleration, then balance the bench’s horizontal pulls. |
| Second floor | **Momentum transfer** | Adjust the incoming cart’s speed and observe where the coupled carts stop. |
| Second floor | **Balancing bridge** | Move a counterweight and compare the torques around the pivot. |
| Second floor | **Hydraulic gate** | Choose a piston and pressure that can raise the gate. |
| Guardian chamber | **Flywheel Guardian** | Use signed momentum readings to stop the guardian on its left and right passes. |
| Castle grounds | **East Garden** | Choose a crank position that produces enough torque to lower the drawbridge. |
| Valley road | **Alder Orchard** | Compare centripetal acceleration on two tracks at the same speed. |
| Desert foothills | **Service Gulch** | Pull the turntable weights inward and observe the change in angular speed. |
| Observatory Floor 1 | **Charge Laboratory / Field Study** | Ask Mira to hold the safety plate, carry charge cells to the sockets, and use the field probe. |
| Observatory Floor 2 | **Circuit Workshop / Circuit Records** | Carry a resistor to the circuit, close the breaker, and check the ammeter for 2 A. |
| Observatory Floor 3 | **Induction Lab / Coil Archive** | Launch the magnet carriage through two timing gates. Compare both gears on the same coil and reach 6 V. |
| Observatory Floor 4 | **Magnetic Dome / Magnetics Study** | Record compass readings for both current directions and align the tracking relay west. |

East Garden, Alder Orchard, and Service Gulch are optional detours. The main valley road leads to the observatory. The observatory opens in the ground-floor telescope lobby. Take the north stairs to the first lab. Follow the prompts at each apparatus. The adjoining study rooms let you predict, test, compare, and discuss a reading. Successful repairs are recorded in the Field Notebook. Return to the telescope after all four repairs, tune to the beacon, and share your expedition report with Vela on Nacre. The lobby’s south exit returns you to the valley.

## Install on a phone or tablet

1. Open the deployed HTTPS site. In **Android Chrome**, choose **Install app** or **Add to Home screen**. In **Safari on iPhone or iPad**, choose **Share → Add to Home Screen** and enable **Open as Web App** if shown.
2. Launch from the home-screen icon. Touch controls sit below the game in portrait and beside it in landscape. Tap **Touch** to switch between always-visible and automatic controls. Tap **More** if you need to expand a room message.
3. For offline play, launch online and wait for **Offline ready**. Turn on airplane mode and relaunch to check the core game cache. Music tracks cache as they play.

When updating an installed copy, open the game online and choose **Update game** when it appears.

## Develop locally

Run these commands from the repository root with Python 3.11 or later.

```bash
python tools/build-pages.py
python -m http.server 8000 --directory docs
```

Open [localhost:8000](http://localhost:8000/). Edit files in `src/` and rerun the build before previewing. The build generates `docs/` and refreshes the service worker’s asset list and cache version.

Run the regression tests with Node.js 22 or later after building.

```bash
node tests/gameplay-foundation.cjs
node audio/test-music-manager.cjs
node tests/pwa-launch.cjs
```

## Deploy to GitHub Pages

| Method | Steps |
| --- | --- |
| **Build with GitHub Actions** | Under **Settings → Pages**, set **Source** to **GitHub Actions**. Push the repository to `main` or select **Run workflow** under **Actions → Deploy Mechanics Castle**. The workflow builds `docs/` and publishes it to GitHub Pages. |

Merge the package’s `src/`, `tools/`, `tests/`, `.github/`, and README into the existing checkout. The included `docs/` is ready for local preview. The Actions workflow rebuilds it from source, and the repository ignores it by default. If the checkout instead publishes from a branch’s `/docs` folder, commit the included `docs/` to keep that publishing method.

v41 applies the second quality pass to the supplied v40 source. It retains the repair animations, measurement comparisons, and follow-up dialogue from v40.

## Kiosk and audio

For the planetarium lobby, open the deployed game in a Chromium-based browser or install it as a PWA. The installed app requests fullscreen where supported. In a regular tab, the first interaction requests fullscreen. Progress and audio preferences are saved in the current browser. The game requires no account.

Music starts at 10% volume and can be adjusted or muted from the title and pause menus. Browsers may wait for a click, tap, or keypress before playing audio. The FLAC loops are matched to −18 LUFS before the volume setting and use 1.5-second crossfades between themes.

| Area | Track |
| --- | --- |
| Castle approach and East Garden before completion | The Road to Mechanics Castle |
| Castle halls, landings, and research rooms | Halls of Mechanics |
| Challenge rooms and guardian chamber | Trials of Knowledge |
| Valley and castle grounds after completion | A World of Discovery |
| Observatory lobby | The Brass Observatory |
| Observatory challenge floors | Current Under Glass |
| Observatory study rooms | Notes by Lamplight |
| Signal Chamber and stargate activation | Signal from Nacre |
| Nacre Landing | A World of Discovery |

## Code map

| File | Responsibility |
| --- | --- |
| `src/index.html` | Game shell, room progression, dialogue, Field Notebook, and save handling |
| `src/gameplay.js`, `src/scenery.js`, `src/portraits.js` | Movement, collision, interaction targeting, scenery, and portraits |
| `src/science-labs.js`, `src/valley-investigations.js` | Apparatus, experiment rules, and readings |
| `src/observatory.js`, `src/study-labs.js`, `src/field-events.js` | Observatory rooms, experiments, study instruments, and optional study progress |
| `src/audio/music-manager.js` | Soundtrack routing, crossfades, and audio settings |
| `src/pwa-layout.css`, `src/pwa.js` | Responsive controls and fullscreen |
| `src/manifest.webmanifest`, `src/sw.js`, `tools/build-pages.py` | PWA metadata and generation of the versioned offline cache |
| `.github/workflows/pages.yml` | Build and deployment on GitHub Pages |

### Recent versions

- **v08–v09** moved contextual actions onto the existing Interact button and improved the landscape D-pad and room messages.
- **v10–v11** removed repeated instructions from room objectives and interaction feedback.
- **v12–v13** added the Pages build script and the GitHub Actions deployment workflow.
- **v14** consolidated the repository around one source tree and removed the analytics snippet.
- **v15** opened Signal Hall and added the compass relay investigation at the Desert Observatory.
- **v16** expanded the observatory into a telescope lobby and four laboratory floors with study rooms. It also widened portraitless dialogue.
- **v17** moved the four Observatory repairs into the rooms, added Mira and the Observatory crew, and opened the Signal Chamber and Nacre stargate.
- **v41** keeps study predictions and follow-up answers separate, supports both induction run orders, pins study readings, improves touch and gamepad controls, and adds the Nacre spectrum match.
