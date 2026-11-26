// AeroStrike X-35 Valkyrie - Automated Scene Staging for Smoke Tests & Screenshots
/* global THREE */

export function stageScreenshotScene(shotName, gameEngine) {
  const { physics, camera, missionManager } = gameEngine;

  if (shotName === 'chase' || shotName === 'start') {
    // 1. Dramatic 3D Chase Camera View: Banking through Nordic Archipelago Golden Ring 03
    missionManager.loadMission(1);
    missionManager.currentRingIndex = 2; // Ring 03 active ahead
    missionManager.score = 4850;
    missionManager.elapsedTime = 68.4;

    // Mark previous rings as passed (emerald green)
    if (missionManager.rings[0]) missionManager.rings[0].passed = true;
    if (missionManager.rings[1]) missionManager.rings[1].passed = true;

    // Position aircraft heading smoothly towards Ring 03 (-1600, 180, 2050)
    physics.reset({ x: -1850, y: 205, z: 2160 }, 38, 220);
    physics.throttle = 1.0;
    physics.afterburner = true;
    physics.aileron = 0.42; // Dynamic banking turn into valley
    physics.elevator = 0.22;
    physics.gForce = 3.6;
    physics.gear = false;
    physics.flaps = false;

    // Position chase camera behind and to right side of aircraft
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(physics.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(physics.quaternion);

    camera.position.copy(physics.position)
      .addScaledVector(forward, -25.0)
      .addScaledVector(up, 6.0)
      .addScaledVector(right, 8.0);

    camera.lookAt(physics.position.clone().addScaledVector(forward, 20.0));
    gameEngine.isCockpitView = false;

  } else if (shotName === 'cockpit') {
    // 2. First-Person Pilot Cockpit Perspective through HUD locked on Devil's Gorge Ring 04
    missionManager.loadMission(1);
    missionManager.currentRingIndex = 3; // Ring 04 active
    missionManager.score = 6420;
    missionManager.elapsedTime = 84.2;

    for (let i = 0; i < 3; i++) {
      if (missionManager.rings[i]) missionManager.rings[i].passed = true;
    }

    // Position aircraft approaching Ring 04 (-1000, 150, 1850)
    physics.reset({ x: -1280, y: 162, z: 1940 }, 36, 240);
    physics.throttle = 0.88;
    physics.afterburner = false;
    physics.elevator = 0.05;
    physics.gear = false;
    physics.flaps = false;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(physics.quaternion);

    // Position camera inside cockpit looking forward through HUD glass
    camera.position.copy(physics.position)
      .addScaledVector(forward, -1.8)
      .addScaledVector(up, 0.72);

    camera.quaternion.copy(physics.quaternion);
    gameEngine.isCockpitView = true;

  } else if (shotName === 'canyon' || shotName === 'play') {
    // 3. Supersonic Knife-Edge High-G Pass through Devil's Gorge Ring 05
    missionManager.loadMission(1);
    missionManager.currentRingIndex = 4; // Ring 05 active
    missionManager.score = 8250;
    missionManager.elapsedTime = 104.5;

    for (let i = 0; i < 4; i++) {
      if (missionManager.rings[i]) missionManager.rings[i].passed = true;
    }

    // Position aircraft in canyon gorge right ahead of Ring 05 (-400, 135, 1650)
    physics.reset({ x: -620, y: 142, z: 1720 }, 42, 270);
    physics.throttle = 1.0;
    physics.afterburner = true;
    physics.aileron = -0.58; // Steep 60-degree high-G knife-edge bank
    physics.elevator = 0.48;
    physics.gForce = 5.6;
    physics.gear = false;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(physics.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(physics.quaternion);

    camera.position.copy(physics.position)
      .addScaledVector(forward, -22.0)
      .addScaledVector(up, 4.5)
      .addScaledVector(right, -7.0);

    camera.lookAt(physics.position.clone().addScaledVector(forward, 30.0));
    gameEngine.isCockpitView = false;

  } else if (shotName === 'landing' || shotName === 'end') {
    // 4. Final Approach to Airbase Runway 09 with Illuminated Threshold Lights
    missionManager.loadMission(3);
    missionManager.currentRingIndex = 2;
    missionManager.score = 11400;
    missionManager.elapsedTime = 145.0;

    physics.reset({ x: -2100, y: 110, z: 0 }, 90, 115); // Runway 09 alignment
    physics.throttle = 0.38;
    physics.afterburner = false;
    physics.gear = true; // Landing gear down & locked
    physics.flaps = true; // Full flaps 30°
    physics.airbrake = false;
    physics.gForce = 1.0;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(physics.quaternion);

    camera.position.copy(physics.position)
      .addScaledVector(forward, -30.0)
      .addScaledVector(up, 7.5);

    camera.lookAt(physics.position.clone().addScaledVector(forward, 45.0));
    gameEngine.isCockpitView = false;
  }
}
