// AeroStrike X-35 Valkyrie - Automated Scene Staging for Smoke Tests & Screenshots
/* global THREE */

export function stageScreenshotScene(shotName, gameEngine) {
  const { physics, camera, missionManager } = gameEngine;

  if (shotName === 'chase' || shotName === 'start') {
    // 1. Dramatic 3D Chase Camera View over Sunlit Island & Mountains
    missionManager.loadMission(1);
    physics.reset({ x: -2600, y: 260, z: 2400 }, 38, 220);
    physics.throttle = 1.0;
    physics.afterburner = true;
    physics.aileron = 0.45; // Banking turn 35 degrees
    physics.elevator = 0.25; // Pulling Gs into turn
    physics.gForce = 3.8;
    physics.gear = false;
    physics.flaps = false;

    // Position chase camera behind and to side of aircraft
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(physics.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(physics.quaternion);

    camera.position.copy(physics.position)
      .addScaledVector(forward, -24.0)
      .addScaledVector(up, 5.5)
      .addScaledVector(right, 7.5);

    camera.lookAt(physics.position.clone().addScaledVector(forward, 15.0));
    gameEngine.isCockpitView = false;

  } else if (shotName === 'cockpit') {
    // 2. First-Person Pilot Cockpit Perspective through HUD
    missionManager.loadMission(1);
    physics.reset({ x: -2000, y: 200, z: 2180 }, 35, 240);
    physics.throttle = 0.85;
    physics.afterburner = false;
    physics.elevator = 0.05;
    physics.gear = false;
    physics.flaps = false;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(physics.quaternion);

    // Position camera right inside pilot's helmet looking forward through HUD glass
    camera.position.copy(physics.position)
      .addScaledVector(forward, -1.8)
      .addScaledVector(up, 0.72);

    camera.quaternion.copy(physics.quaternion);
    gameEngine.isCockpitView = true;

  } else if (shotName === 'canyon' || shotName === 'play') {
    // 3. Low-Altitude High-G Canyon Pass through Devil's Gorge
    missionManager.loadMission(1);
    physics.reset({ x: -1400, y: 165, z: 1950 }, 40, 260);
    physics.throttle = 1.0;
    physics.afterburner = true;
    physics.aileron = -0.55; // Steep knife-edge bank
    physics.elevator = 0.45;
    physics.gForce = 5.2;
    physics.gear = false;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(physics.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(physics.quaternion);

    camera.position.copy(physics.position)
      .addScaledVector(forward, -22.0)
      .addScaledVector(up, 4.2)
      .addScaledVector(right, -6.5);

    camera.lookAt(physics.position.clone().addScaledVector(forward, 25.0));
    gameEngine.isCockpitView = false;

  } else if (shotName === 'landing' || shotName === 'end') {
    // 4. Final Approach to Airbase Runway 09
    missionManager.loadMission(3);
    physics.reset({ x: -2200, y: 140, z: 0 }, 90, 115); // Aligned with Runway 09
    physics.throttle = 0.42;
    physics.afterburner = false;
    physics.gear = true; // Landing gear deployed
    physics.flaps = true; // Flaps deployed
    physics.airbrake = false;
    physics.gForce = 1.0;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(physics.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(physics.quaternion);

    camera.position.copy(physics.position)
      .addScaledVector(forward, -28.0)
      .addScaledVector(up, 7.0);

    camera.lookAt(physics.position.clone().addScaledVector(forward, 40.0));
    gameEngine.isCockpitView = false;
  }
}
