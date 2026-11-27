// AeroStrike X-35 Valkyrie - Automated Scene Staging for Smoke Tests & Screenshots
/* global THREE */

export function stageScreenshotScene(shotName, gameEngine) {
  const { physics, camera, missionManager } = gameEngine;

  if (shotName === 'chase' || shotName === 'start') {
    // 1. High-Speed 3D Chase Camera: Banking through Nordic Archipelago Golden Ring 03
    missionManager.loadMission(1);
    missionManager.currentRingIndex = 2; // Ring 03 active ahead
    missionManager.score = 5400;
    missionManager.elapsedTime = 68.4;

    // Mark previous rings as passed
    if (missionManager.rings[0]) missionManager.rings[0].passed = true;
    if (missionManager.rings[1]) missionManager.rings[1].passed = true;

    // Position aircraft heading smoothly towards Ring 03 (-1600, 180, 2050)
    physics.reset({ x: -1880, y: 215, z: 2180 }, 38, 230);
    physics.throttle = 1.0;
    physics.afterburner = true;
    physics.aileron = 0.44; // Dynamic banking turn into valley
    physics.elevator = 0.24;
    physics.gForce = 3.8;
    physics.gear = false;
    physics.flaps = false;

    // Position chase camera behind and to right side of aircraft
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(physics.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(physics.quaternion);

    camera.position.copy(physics.position)
      .addScaledVector(forward, -24.0)
      .addScaledVector(up, 6.2)
      .addScaledVector(right, 7.8);

    camera.lookAt(physics.position.clone().addScaledVector(forward, 22.0));
    gameEngine.isCockpitView = false;

  } else if (shotName === 'cockpit') {
    // 2. True First-Person Cockpit View: Inside the cockpit looking through HUD glass at Ring 04
    missionManager.loadMission(1);
    missionManager.currentRingIndex = 3; // Ring 04 active
    missionManager.score = 7200;
    missionManager.elapsedTime = 86.5;

    for (let i = 0; i < 3; i++) {
      if (missionManager.rings[i]) missionManager.rings[i].passed = true;
    }

    // Position aircraft approaching Ring 04 (-1000, 150, 1850)
    physics.reset({ x: -1280, y: 165, z: 1940 }, 36, 250);
    physics.throttle = 0.88;
    physics.afterburner = false;
    physics.elevator = 0.06;
    physics.gear = false;
    physics.flaps = false;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(physics.quaternion);

    // Position camera right inside the cockpit, behind the HUD glass and canopy frame
    // In aircraft local space, pilot eye point is at (0, 0.62, -2.15)
    camera.position.copy(physics.position)
      .addScaledVector(forward, -2.15)
      .addScaledVector(up, 0.66);

    camera.quaternion.copy(physics.quaternion);
    gameEngine.isCockpitView = true;

  } else if (shotName === 'canyon' || shotName === 'play') {
    // 3. Supersonic Knife-Edge High-G Pass through Devil's Gorge Ring 05
    missionManager.loadMission(1);
    missionManager.currentRingIndex = 4; // Ring 05 active
    missionManager.score = 9600;
    missionManager.elapsedTime = 108.2;

    for (let i = 0; i < 4; i++) {
      if (missionManager.rings[i]) missionManager.rings[i].passed = true;
    }

    // Position aircraft in canyon gorge right ahead of Ring 05 (-400, 135, 1650)
    physics.reset({ x: -640, y: 145, z: 1730 }, 42, 280);
    physics.throttle = 1.0;
    physics.afterburner = true;
    physics.aileron = -0.62; // Steep 65-degree high-G knife-edge bank
    physics.elevator = 0.52;
    physics.gForce = 5.8;
    physics.gear = false;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(physics.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(physics.quaternion);

    camera.position.copy(physics.position)
      .addScaledVector(forward, -22.0)
      .addScaledVector(up, 4.8)
      .addScaledVector(right, -7.5);

    camera.lookAt(physics.position.clone().addScaledVector(forward, 32.0));
    gameEngine.isCockpitView = false;

  } else if (shotName === 'landing' || shotName === 'end') {
    // 4. Low ILS Final Approach to Airbase Runway 09 with Threshold & PAPI Lights
    missionManager.loadMission(3);
    missionManager.currentRingIndex = 2;
    missionManager.score = 12800;
    missionManager.elapsedTime = 148.0;

    physics.reset({ x: -2150, y: 95, z: 0 }, 90, 120); // Runway 09 alignment on 3° glideslope
    physics.throttle = 0.40;
    physics.afterburner = false;
    physics.gear = true; // Landing gear down & locked
    physics.flaps = true; // Full flaps 30°
    physics.airbrake = false;
    physics.gForce = 1.0;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(physics.quaternion);

    camera.position.copy(physics.position)
      .addScaledVector(forward, -28.0)
      .addScaledVector(up, 7.2);

    camera.lookAt(physics.position.clone().addScaledVector(forward, 48.0));
    gameEngine.isCockpitView = false;
  }
}
