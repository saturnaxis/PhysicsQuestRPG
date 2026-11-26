# PhysicsQuest soundtrack

The original MP3s are in the source tree under `audio/originals/`. The game loads separate lossless FLAC files from `dist/audio/music/`. Times in the source columns are measured from the start of each decoded MP3. Each processed track loops from frame 0 to its frame count, exclusive, at 32,000 stereo frames per second.

| Theme | Source in–out (s) | Approx. BPM | Loop length (s) | Frames | Static gain (dB) | Integrated LUFS | True peak (dBTP) |
|---|---:|---:|---:|---:|---:|---:|---:|
| The Road to Mechanics Castle | 0.514–88.504 | 120 | 87.990 | 2,815,680 | −6.8 | −18.0 | −6.8 |
| Halls of Mechanics | 10.401–77.070 | 81 | 66.669 | 2,133,408 | −7.2 | −18.0 | −7.2 |
| Trials of Knowledge | 6.770–78.756 | 120 | 71.986 | 2,303,552 | −5.9 | −18.0 | −5.6 |
| A World of Discovery | 11.668–83.056 | 107.5 | 71.388 | 2,284,416 | −6.4 | −18.0 | −6.4 |

## Audio processing

Loop points were chosen using waveform energy, onset periodicity, and locally matching pitch-class and rhythmic features. This excludes the concluding tails and, where a later phrase gave a better match, the opening lead-in. The final 75 ms blends into the original lead-in immediately before the selected start. Playback wraps on the next sample at that start. Loudness matching used a single measured gain adjustment per track, preserving the dynamics.

## Playback

The exterior theme covers Castle Approach and East Garden before castle completion. The interior theme covers halls, landings, and research rooms. The challenge theme covers the six enclosed challenge rooms, including the guardian chamber. The overworld theme covers Castle Ridge through the observatory entrance and applies to the castle grounds on a post-clear return. Unlocked starts use the same mapping.

Tracks loop as decoded Web Audio buffers. Same-theme movement and modal interactions keep the current source. Theme changes use a 1.5-second equal-power crossfade. The player remembers playback offsets and finishes an in-flight fade before switching to the latest requested theme, keeping at most two live sources. The title screen is silent. The title and pause menus offer persistent volume and mute, with a 10% default. The music manager has a separate ducking control for future cues.

## Verification

- FFmpeg decoded all four exports. Sample counts matched the intended ranges, and each boundary step was within the local waveform’s range. The files were measured at −18.0 LUFS.
- Chrome rendered three identical cycles for every file with an offline Web Audio context. Real-time Web Audio initialized at 10% after interaction. The live game exposed settings on the title and pause screens and restored volume and mute when reloaded.
- `node audio/test-music-manager.cjs` checks room and progression routing, playback position, crossfade timing, rapid room changes, volume and mute, and page lifecycle with simulated audio nodes.
- Subjective listening checks for musical phrasing, seam audibility, and in-game crossfade balance were not performed. Physical gamepad and browser-specific behavior outside Chrome were not checked.
