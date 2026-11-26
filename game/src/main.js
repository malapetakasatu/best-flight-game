// AeroStrike X-35 Valkyrie - Main Simulation Engine & Game Loop
import { CONTROLS, MISSIONS } from './config.js';
import { FlightAudio } from './audio.js';
import { FlightPhysics } from './physics.js';
import { AircraftMesh } from './aircraft.js';
import { IslandTerrain } from './terrain.js';
import { AtmosphericSky } from './sky.js';
import { FighterHUD } from './hud.js';
import { MissionManager } from './missions.js';
import { stageScreenshotScene } from './shots.js';

/* global THREE */

class AeroStrikeGame {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.gameCanvas = document.getElementById('game-canvas');
    this.hudCanvas = document.getElementById('hud-canvas');

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.physics = null;
    this.aircraft = null;
    this.terrain = null;
    this.sky = null;
    this.hud = null;
    this.audio = null;
    this.missionManager = null;

    this.isCockpitView = false;
    this.keys = {};
    this.lastTime = performance.now();
    this.isPaused = false;
    this.isShotMode = false;

    // DOM Elements
    this.domMissionName = document.getElementById('hud-mission-name');
    this.domObjective = document.getElementById('hud-objective');
    this.domTimer = document.getElementById('hud-timer');
    this.domScore = document.getElementById('hud-score');
    this.domSpeed = document.getElementById('telem-speed');
    this.domMach = document.getElementById('telem-mach');
    this.domAlt = document.getElementById('telem-alt');
    this.domAgl = document.getElementById('telem-agl');
    this.domThr = document.getElementById('telem-thr');
    this.domAb = document.getElementById('telem-ab');
    this.domG = document.getElementById('telem-g');
    this.domAoa = document.getElementById('telem-aoa');
    this.domFuel = document.getElementById('telem-fuel');
    this.domStatus = document.getElementById('telem-status');
    this.domFlagGear = document.getElementById('flag-gear');
    this.domFlagFlaps = document.getElementById('flag-flaps');
    this.domFlagBrake = document.getElementById('flag-brake');
    this.domWarning = document.getElementById('master-warning');
    this.domWarningText = document.getElementById('warning-text');

    this.briefingModal = document.getElementById('briefing-modal');
    this.debriefModal = document.getElementById('debrief-modal');
    this.btnLaunch = document.getElementById('btn-launch-mission');
    this.btnRestart = document.getElementById('btn-restart-mission');

    this.init();
  }

  init() {
    // 1. Three.js Renderer & 3D Scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.5, 25000);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.gameCanvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 2. Subsystems
    this.audio = new FlightAudio();
    this.physics = new FlightPhysics();
    this.aircraft = new AircraftMesh();
    this.scene.add(this.aircraft.group);

    this.terrain = new IslandTerrain(this.scene);
    this.sky = new AtmosphericSky(this.scene);
    this.hud = new FighterHUD(this.hudCanvas);
    this.missionManager = new MissionManager(this.scene, this.audio);

    // 3. Bind Event Listeners
    this.bindInput();
    this.bindUI();

    window.addEventListener('resize', () => this.onWindowResize());

    // 4. Check for URL Screenshot Smoke Test Parameters (?shot=chase|cockpit|canyon|landing)
    const urlParams = new URLSearchParams(window.location.search);
    const shotName = urlParams.get('shot');

    if (shotName) {
      this.isShotMode = true;
      this.briefingModal.classList.add('hidden');
      stageScreenshotScene(shotName, this);
      this.render();
      
      // Notify headless browser that frame is ready
      setTimeout(() => {
        window.__shotReady = true;
      }, 250);
      return;
    }

    // Default start position
    const startMission = MISSIONS[0];
    this.missionManager.loadMission(startMission.id);
    this.physics.reset(startMission.startPos, startMission.startHeading, startMission.startSpeed);

    // Start Game Loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Audio init on first keypress
      this.audio.init();

      // Camera toggle
      if (CONTROLS.toggleCamera.includes(e.code)) {
        this.isCockpitView = !this.isCockpitView;
      }

      // Gear toggle
      if (CONTROLS.toggleGear.includes(e.code)) {
        this.physics.gear = !this.physics.gear;
      }

      // Flaps toggle
      if (CONTROLS.toggleFlaps.includes(e.code)) {
        this.physics.flaps = !this.physics.flaps;
      }

      // Airbrake toggle
      if (CONTROLS.toggleAirbrake.includes(e.code)) {
        this.physics.airbrake = !this.physics.airbrake;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  bindUI() {
    // Mission Selection Buttons in Modal
    const missionBtns = document.querySelectorAll('.mission-btn');
    missionBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        missionBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const id = parseInt(btn.getAttribute('data-mission'), 10);
        this.missionManager.loadMission(id);
      });
    });

    // Launch Button
    if (this.btnLaunch) {
      this.btnLaunch.addEventListener('click', () => {
        this.audio.init();
        this.briefingModal.classList.add('hidden');
        const m = this.missionManager.activeMission;
        this.physics.reset(m.startPos, m.startHeading, m.startSpeed);
      });
    }

    // Restart Button
    if (this.btnRestart) {
      this.btnRestart.addEventListener('click', () => {
        this.debriefModal.classList.add('hidden');
        const m = this.missionManager.activeMission;
        this.missionManager.loadMission(m.id);
        this.physics.reset(m.startPos, m.startHeading, m.startSpeed);
      });
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.hud.resize();
  }

  processPilotInput(dt) {
    // Pitch (W/S)
    let elev = 0;
    if (this.isKeyActive(CONTROLS.pitchDown)) elev -= 1.0;
    if (this.isKeyActive(CONTROLS.pitchUp)) elev += 1.0;
    this.physics.elevator = elev;

    // Roll (A/D)
    let ail = 0;
    if (this.isKeyActive(CONTROLS.rollLeft)) ail -= 1.0;
    if (this.isKeyActive(CONTROLS.rollRight)) ail += 1.0;
    this.physics.aileron = ail;

    // Rudder Yaw (Q/E)
    let rud = 0;
    if (this.isKeyActive(CONTROLS.yawLeft)) rud -= 1.0;
    if (this.isKeyActive(CONTROLS.yawRight)) rud += 1.0;
    this.physics.rudder = rud;

    // Throttle (Shift / Ctrl)
    if (this.isKeyActive(CONTROLS.throttleUp)) {
      this.physics.throttle = Math.min(1.0, this.physics.throttle + 0.35 * dt);
    }
    if (this.isKeyActive(CONTROLS.throttleDown)) {
      this.physics.throttle = Math.max(0.0, this.physics.throttle - 0.35 * dt);
    }

    // Afterburner (Space)
    this.physics.afterburner = this.isKeyActive(CONTROLS.afterburner);
    if (this.physics.afterburner) {
      this.physics.throttle = 1.0;
    }
  }

  isKeyActive(codeArray) {
    return codeArray.some((code) => this.keys[code] === true);
  }

  updateCamera() {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.physics.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.physics.quaternion);

    if (this.isCockpitView) {
      // 1. Cockpit First-Person Camera (Inside Pilot Canopy looking out)
      this.camera.position.copy(this.physics.position)
        .addScaledVector(forward, -1.8)
        .addScaledVector(up, 0.72);
      this.camera.quaternion.copy(this.physics.quaternion);
    } else {
      // 2. Third-Person Dynamic Chase Camera (Spring-Follow with Banking lookahead)
      const targetPos = this.physics.position.clone()
        .addScaledVector(forward, -24.0)
        .addScaledVector(up, 5.0);

      this.camera.position.lerp(targetPos, 0.12);
      
      const lookAtPos = this.physics.position.clone()
        .addScaledVector(forward, 25.0);
      this.camera.lookAt(lookAtPos);
    }
  }

  updateUI() {
    const speedKts = Math.round(this.physics.airspeed * 1.94384);
    const altFt = Math.round(this.physics.altitude * 3.28084);
    const aglFt = Math.round(this.physics.agl * 3.28084);

    if (this.domSpeed) this.domSpeed.innerHTML = `${speedKts} <span class="telem-unit">KTS</span>`;
    if (this.domMach) this.domMach.innerText = `MACH ${this.physics.mach.toFixed(2)}`;
    if (this.domAlt) this.domAlt.innerHTML = `${altFt} <span class="telem-unit">FT</span>`;
    if (this.domAgl) this.domAgl.innerText = `AGL: ${aglFt} FT`;
    
    if (this.domThr) {
      const pct = Math.round(this.physics.throttle * 100);
      this.domThr.innerText = `${pct}%`;
    }
    if (this.domAb) {
      this.domAb.innerText = this.physics.afterburner ? 'AFTERBURNER MAX' : 'MILITARY POWER';
      this.domAb.className = this.physics.afterburner ? 'telem-sub text-cyan' : 'telem-sub';
    }

    if (this.domG) this.domG.innerText = `${this.physics.gForce >= 0 ? '+' : ''}${this.physics.gForce.toFixed(1)} G`;
    if (this.domAoa) this.domAoa.innerHTML = `AoA: ${this.physics.aoaDeg >= 0 ? '+' : ''}${this.physics.aoaDeg.toFixed(1)}&deg; &bull; PITCH: ${((this.physics.quaternion.x * 180) / Math.PI).toFixed(0)}&deg;`;
    if (this.domFuel) this.domFuel.innerText = `${Math.round(this.physics.fuelPercent)}%`;

    // Flag indicators
    if (this.domFlagGear) this.domFlagGear.className = this.physics.gear ? 'flag-pill active' : 'flag-pill';
    if (this.domFlagFlaps) this.domFlagFlaps.className = this.physics.flaps ? 'flag-pill active' : 'flag-pill';
    if (this.domFlagBrake) this.domFlagBrake.className = this.physics.airbrake ? 'flag-pill active' : 'flag-pill';

    // Mission status
    if (this.domMissionName) this.domMissionName.innerText = `MISSION: ${this.missionManager.activeMission.name.toUpperCase()}`;
    if (this.domObjective) this.domObjective.innerText = this.missionManager.getMissionStatusText();
    if (this.domScore) this.domScore.innerText = `SCORE: ${this.missionManager.score}`;

    // Timer display
    const mins = Math.floor(this.missionManager.elapsedTime / 60);
    const secs = (this.missionManager.elapsedTime % 60).toFixed(1);
    if (this.domTimer) this.domTimer.innerText = `TIME: ${String(mins).padStart(2, '0')}:${String(secs).padStart(4, '0')}`;

    // Warning Banner
    if (this.domWarning) {
      if (this.physics.isStalling) {
        this.domWarning.classList.remove('hidden');
        if (this.domWarningText) this.domWarningText.innerText = 'STALL WARNING - PUSH NOSE DOWN';
      } else if (this.physics.gForce > 7.5) {
        this.domWarning.classList.remove('hidden');
        if (this.domWarningText) this.domWarningText.innerText = 'OVER-G CAUTION - REDUCE PULL';
      } else {
        this.domWarning.classList.add('hidden');
      }
    }
  }

  showDebrief(result, title, summary) {
    if (!this.debriefModal) return;
    document.getElementById('debrief-title').innerText = title;
    document.getElementById('d-result').innerText = result;
    document.getElementById('d-result').className = result === 'SUCCESS' ? 'stat-val text-emerald' : 'stat-val text-red';
    
    const mins = Math.floor(this.missionManager.elapsedTime / 60);
    const secs = (this.missionManager.elapsedTime % 60).toFixed(1);
    document.getElementById('d-time').innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(4, '0')}`;
    document.getElementById('d-score').innerText = String(this.missionManager.score);
    document.getElementById('d-max-g').innerText = `+${this.physics.maxGRecorded.toFixed(1)} G`;
    document.getElementById('d-summary').innerText = summary;
    
    this.debriefModal.classList.remove('hidden');
  }

  gameLoop(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000.0);
    this.lastTime = now;

    if (!this.briefingModal.classList.contains('hidden') || !this.debriefModal.classList.contains('hidden')) {
      // Modals open -> render static/subtle scene
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame((t) => this.gameLoop(t));
      return;
    }

    // 1. Process Controls & Physics
    this.processPilotInput(dt);
    this.physics.update(dt, (x, z) => this.terrain.getHeightAt(x, z));

    // 2. Update Visuals & Audio
    this.aircraft.update(this.physics, dt);
    this.sky.update(dt, this.physics.position);
    this.missionManager.update(this.physics, dt);
    this.audio.updateEngine(this.physics.throttle, this.physics.airspeed, this.physics.afterburner);
    this.audio.playStallWarning(this.physics.isStalling);

    // 3. Camera & Rendering
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);

    // 4. Tactical Avionics HUD & DOM Telemetry
    this.hud.draw(this.physics, this.camera, this.missionManager, this.isCockpitView);
    this.updateUI();

    // 5. Check Completion or Crash
    if (this.physics.isLanded && !this.missionManager.isCompleted) {
      this.missionManager.isCompleted = true;
      this.audio.playTouchdown();
      this.showDebrief('SUCCESS', 'RUNWAY TOUCHDOWN CONFIRMED', 'Carrier-grade smooth touchdown on Runway 09. Airspeed and sink rate within operational limits.');
    } else if (this.physics.isCrashed) {
      this.audio.playCrash();
      this.showDebrief('FAILED', 'TERRAIN IMPACT DETECTED', 'Airframe collided with terrain or exceeded maximum impact vertical velocity.');
    } else if (this.missionManager.isCompleted && this.missionManager.activeMission.id !== 3) {
      this.showDebrief('SUCCESS', 'SORTIE OBJECTIVES COMPLETED', 'All navigation rings and tactical waypoints cleared with high energy retention.');
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  render() {
    this.aircraft.update(this.physics, 0.016);
    this.sky.update(0.016, this.physics.position);
    this.renderer.render(this.scene, this.camera);
    this.hud.draw(this.physics, this.camera, this.missionManager, this.isCockpitView);
    this.updateUI();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new AeroStrikeGame();
});
