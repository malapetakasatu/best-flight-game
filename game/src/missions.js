// AeroStrike X-35 Valkyrie - Tactical Sortie Mission Engine & 3D Waypoint Rings
import { MISSIONS } from './config.js';

/* global THREE */

export class MissionManager {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;
    this.activeMission = MISSIONS[0];
    this.rings = [];
    this.currentRingIndex = 0;
    this.score = 0;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.isCompleted = false;
    this.ringsGroup = new THREE.Group();
    this.scene.add(this.ringsGroup);
  }

  loadMission(missionId) {
    this.activeMission = MISSIONS.find((m) => m.id === missionId) ?? MISSIONS[0];
    this.currentRingIndex = 0;
    this.score = 0;
    this.elapsedTime = 0;
    this.isCompleted = false;
    this.startTime = performance.now();

    // Clear previous rings
    while (this.ringsGroup.children.length > 0) {
      this.ringsGroup.remove(this.ringsGroup.children[0]);
    }
    this.rings = [];

    // Generate waypoints for selected mission
    const waypoints = this.getWaypointsForMission(this.activeMission.id);
    
    // Glowing Torus Ring Geometry (Radius: 28m, Tube: 1.8m)
    const ringGeo = new THREE.TorusGeometry(28, 1.8, 16, 32);

    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const nextWp = waypoints[i + 1] ?? wp;

      // Look direction along flight path
      const dir = new THREE.Vector3().subVectors(nextWp.pos, wp.pos).normalize();

      const mat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x00e5ff : 0x00b4d8,
        transparent: true,
        opacity: 0.85,
        wireframe: false,
      });

      const ringMesh = new THREE.Mesh(ringGeo, mat);
      ringMesh.position.copy(wp.pos);

      // Align ring normal with flight path direction
      if (dir.lengthSq() > 0.01) {
        ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      }

      this.ringsGroup.add(ringMesh);
      this.rings.push({
        id: i,
        position: wp.pos,
        direction: dir,
        mesh: ringMesh,
        radius: 35.0,
        passed: false,
      });
    }
  }

  getWaypointsForMission(id) {
    if (id === 1) {
      // Mission 1: Top Gun Canyon Run (Devil's Gorge)
      return [
        { pos: new THREE.Vector3(-3000, 280, 2600) },
        { pos: new THREE.Vector3(-2400, 220, 2300) },
        { pos: new THREE.Vector3(-1800, 180, 2100) },
        { pos: new THREE.Vector3(-1200, 150, 1900) },
        { pos: new THREE.Vector3(-600, 140, 1750) },
        { pos: new THREE.Vector3(0, 150, 1600) },
        { pos: new THREE.Vector3(600, 180, 1450) },
        { pos: new THREE.Vector3(1200, 220, 1300) },
        { pos: new THREE.Vector3(1800, 260, 1100) },
        { pos: new THREE.Vector3(2400, 320, 800) },
      ];
    } else if (id === 2) {
      // Mission 2: Archipelago Recon Patrol
      return [
        { pos: new THREE.Vector3(-800, 1100, 3500) },
        { pos: new THREE.Vector3(-1800, 950, 2200) },
        { pos: new THREE.Vector3(-2800, 800, 800) },
        { pos: new THREE.Vector3(-3200, 700, -800) },
        { pos: new THREE.Vector3(-2200, 600, -2200) },
        { pos: new THREE.Vector3(-600, 500, -2800) },
        { pos: new THREE.Vector3(1200, 550, -1800) },
        { pos: new THREE.Vector3(2200, 650, 0) },
      ];
    } else {
      // Mission 3: Airbase Runway 09 Approach (Descends on 3-degree glide slope)
      return [
        { pos: new THREE.Vector3(-3500, 300, 0) },
        { pos: new THREE.Vector3(-2600, 200, 0) },
        { pos: new THREE.Vector3(-1800, 100, 0) },
        { pos: new THREE.Vector3(-1500, 25, 0) }, // Touchdown threshold
      ];
    }
  }

  getNextRing() {
    return this.rings[this.currentRingIndex] ?? null;
  }

  update(physics, dt) {
    if (this.isCompleted) return;

    this.elapsedTime += dt;
    const currentRing = this.getNextRing();
    if (!currentRing) return;

    // Pulse current active ring
    const nowSec = performance.now() * 0.005;
    currentRing.mesh.scale.setScalar(1.0 + Math.sin(nowSec) * 0.08);
    currentRing.mesh.material.color.setHex(0x00ff66); // Active ring glowing neon green

    // Check if aircraft crossed through ring plane
    const dist = physics.position.distanceTo(currentRing.position);
    if (dist <= currentRing.radius) {
      // Pass confirmed!
      currentRing.passed = true;
      currentRing.mesh.material.color.setHex(0x38bdf8); // Turn cool cyan
      currentRing.mesh.material.opacity = 0.35;
      
      this.audio.playRingPass();
      
      // Calculate score based on airspeed
      const speedKts = physics.airspeed * 1.94384;
      const ringScore = 1000 + Math.round(speedKts * 5);
      this.score += ringScore;

      this.currentRingIndex++;
      if (this.currentRingIndex >= this.rings.length) {
        this.isCompleted = true;
      }
    }
  }

  getMissionStatusText() {
    if (this.isCompleted) return 'MISSION OBJECTIVE COMPLETE - RETURN TO BASE';
    const total = this.rings.length;
    const current = this.currentRingIndex;
    return `${this.activeMission.name.toUpperCase()} (${current}/${total} RINGS)`;
  }
}
