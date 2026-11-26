# AeroStrike X-35 Valkyrie

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/malapetakasatu/best-flight-game/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/malapetakasatu/best-flight-game/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

> **High-Fidelity Tactical Flight Simulator** &bull; Make.fun Bounty Submission for [`best-flight-game-20261126-0057`](https://make.fun/bounty/best-flight-game-20261126-0057)

A complete, original 3D tactical flight simulator that plays offline in a desktop browser with zero external network requests. Powered by WebGL (Three.js), a custom 6-DOF aerodynamic flight dynamics model, procedural atmospheric scattering, procedural island terrain with an airbase runway and naval aircraft carrier, authentic glass cockpit HUD avionics, and a procedural Web Audio sound synthesizer.

---

## Key Features

1. **Photorealistic 3D Visuals & Atmosphere (Non-Blocky Geometry)**:
   - **Airframe**: Custom aerodynamic supersonic jet airframe ("AeroStrike X-35 Valkyrie") with swept delta wings, canted twin vertical stabilizers (V-tail), cockpit bubble canopy with pilot helmet, and twin variable-geometry turbofan nozzles.
   - **Visual FX**: Dynamic pulsating afterburner flame cones with emissive heat glow, wingtip condensation contrails during high-G turns, and retractable landing gear.
   - **Atmospheric Sky**: Rayleigh atmospheric scattering sky dome, warm directional sunlight, soft ambient skylight, and volumetric drifting cumulus clouds.
   - **Terrain Architecture**: 14km x 14km procedural island archipelago with elevation noise, sand beaches, lush valleys, rugged mountain cliffs, and snow peaks.
   - **Airbase Runway 09/27**: 3,000m asphalt runway with centerline stripes, threshold piano keys, runway numbers, illuminated green threshold lights, white edge lights, and PAPI glide slope indicator lights.
   - **Offshore Aircraft Carrier**: USS Freedom stationed offshore with angled flight deck and superstructure.

2. **6-DOF Rigid-Body Aerodynamic Flight Dynamics**:
   - True physical aerodynamic lift equation: $L = \frac{1}{2} \rho v^2 S C_L(\alpha)$
   - Total drag polar including parasitic drag, induced drag $k C_L^2$, landing gear drag, flap drag, airbrake drag, and transonic wave drag.
   - Real aerodynamic stall modeling: lift collapse and turbulent buffeting when Angle of Attack exceeds critical angle ($\alpha > 17.5^\circ$).
   - Propulsion: 145 kN military dry thrust, 220 kN afterburner boost with dynamic fuel consumption.
   - G-Force meter tracking instantaneous load factor ($+1.0\text{G}$ to $+9.0\text{G}$) with over-G warnings.

3. **Authentic Military Fighter Jet HUD Avionics**:
   - Artificial horizon with rotating pitch ladder ($-80^\circ$ to $+80^\circ$, dashed negative dive rungs, solid positive climb rungs).
   - Flight Path Marker (Velocity Vector circle with wings and vertical tail) showing true flight trajectory.
   - Airspeed tape (calibrated in Knots) with numerical readout box.
   - Altitude tape (calibrated in Feet MSL) with numerical readout and radar altimeter (AGL).
   - Heading compass tape ($000^\circ$ to $359^\circ$) with waypoint bug indicator.
   - Dynamic Waypoint Diamond: tracks mission navigation rings with distance in meters.
   - Master Caution / Stall warning visual annunciators.

4. **3 Distinct Sortie Missions**:
   - **Sortie 01: Top Gun Canyon Run**: Low-altitude supersonic precision ring navigation through Devil's Gorge with time-trial scoring.
   - **Sortie 02: Archipelago Recon Patrol**: High-altitude patrol intercepting radar waypoints across the island chain.
   - **Sortie 03: Airbase Runway 09 Recovery**: Execute a realistic 3-degree glide slope approach, gear deployment, flare, and runway touchdown.

5. **Procedural Web Audio API Sound Synthesizer**:
   - Jet engine turbine whine & low rumble scaled to throttle and airspeed.
   - Thunderous afterburner roar using resonant bandpass-filtered noise.
   - Wind rush noise proportional to dynamic pressure.
   - 820 Hz Master Caution stall warning beeper.
   - Waypoint ring capture polyphonic chime.
   - Touchdown tyre screech sound and crash explosion acoustics.

---

## Flight Controls

| Key | Action |
| :--- | :--- |
| **W / S** (or **&uarr; / &darr;**) | Elevator Pitch (Nose Down / Nose Up) |
| **A / D** (or **&larr; / &rarr;**) | Aileron Roll (Bank Left / Bank Right) |
| **Q / E** | Rudder Yaw (Turn Left / Turn Right) |
| **Shift / Ctrl** | Throttle (Increase / Decrease) |
| **Space** | Afterburner Boost (Instant 100% Thrust) |
| **G** | Toggle Landing Gear |
| **F** | Toggle Wing Flaps |
| **B** | Deploy Airbrake |
| **C** | Toggle Camera View (Chase Camera &harr; Cockpit HUD View) |
| **R** | Quick Restart Sortie |

---

## Clean Architecture & Source Structure

- `game/index.html`: WebGL canvas container and HUD overlay shell.
- `game/app.css`: Aerospace cockpit styling and glassmorphism telemetry cards.
- `game/vendor/three.min.js`: Vendored 3D graphics library.
- `game/src/config.js`: Flight physics constants, aircraft specifications, mission definitions.
- `game/src/audio.js`: Web Audio procedural synthesizer.
- `game/src/physics.js`: 6-DOF aerodynamic flight dynamics engine.
- `game/src/aircraft.js`: Procedural 3D supersonic jet mesh with animations.
- `game/src/terrain.js`: Procedural island heightmap, runway, and carrier structures.
- `game/src/sky.js`: Atmospheric Rayleigh scattering sky dome and volumetric clouds.
- `game/src/hud.js`: 2D canvas military HUD avionics and flight path marker.
- `game/src/missions.js`: Sortie waypoint rings and mission progression tracker.
- `game/src/shots.js`: Automated scene staging for smoke testing (`?shot=...`).
- `game/src/main.js`: Main simulation coordinator, input handler, and game loop.
- `main.ts`: Entrypoint generating canonical `dossier.json` with `vendor/makefun-game.ts`.

---

## License

MIT &bull; SPDX-License-Identifier: MIT
