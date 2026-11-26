// AeroStrike X-35 Valkyrie - Tactical Sortie Mission Engine & Radiant Golden Waypoint Rings
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

    // High-visibility Radiant Golden Torus Geometries
    // Inner primary ring: Radius 28m, Tube 2.4m
    const innerRingGeo = new THREE.TorusGeometry(28, 2.4, 16, 40);
    // Outer halo ring: Radius 34m, Tube 1.0m
    const outerRingGeo = new THREE.TorusGeometry(34, 1.0, 16, 40);
    // Directional chevron indicator (Diamond)
    const chevronGeo = new THREE.ConeGeometry(2.5, 6.0, 4);
    chevronGeo.rotateX(Math.PI / 2);

    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const nextWp = waypoints[i + 1] ?? wp;

      const singleRingGroup = new THREE.Group();

      // Look direction along flight path
      const dir = new THREE.Vector3().subVectors(nextWp.pos, wp.pos).normalize();
      if (dir.lengthSq() < 0.001) dir.set(0, 0, -1);

      // Inner Ring (Brilliant Luminous Gold #FFD700)
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.95,
      });
      const innerMesh = new THREE.Mesh(innerRingGeo, innerMat);
      singleRingGroup.add(innerMesh);

      // Outer Halo Ring (Warm Amber Gold #FFAA00)
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.75,
      });
      const outerMesh = new THREE.Mesh(outerRingGeo, outerMat);
      singleRingGroup.add(outerMesh);

      // 4 Cardinal Directional Chevrons
      const chevronMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      angles.forEach((ang) => {
        const chev = new THREE.Mesh(chevronGeo, chevronMat);
        chev.position.set(Math.cos(ang) * 31, Math.sin(ang) * 31, 0);
        chev.rotation.z = ang - Math.PI / 2;
        singleRingGroup.add(chev);
      });

      singleRingGroup.position.copy(wp.pos);

      // Align ring normal with flight path direction
      singleRingGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

      this.ringsGroup.add(singleRingGroup);
      this.rings.push({
        id: i,
        name: wp.name || `Waypoint 0${i + 1}`,
        position: wp.pos,
        direction: dir,
        group: singleRingGroup,
        innerMesh,
        outerMesh,
        radius: 36.0,
        passed: false,
      });
    }
  }

  getWaypointsForMission(id) {
    if (id === 1) {
      // Mission 1: Nordic Archipelago 8-Ring Golden Slalom
      return [
        { name: "Fjord Ingress", pos: new THREE.Vector3(-2800, 280, 2500) },
        { name: "Alpine Fjord Lake", pos: new THREE.Vector3(-2200, 220, 2250) },
        { name: "Pine Ridge Crest", pos: new THREE.Vector3(-1600, 180, 2050) },
        { name: "Devil's Gorge Gate", pos: new THREE.Vector3(-1000, 150, 1850) },
        { name: "Canyon S-Curve", pos: new THREE.Vector3(-400, 135, 1650) },
        { name: "Chasm Waterfall", pos: new THREE.Vector3(300, 160, 1450) },
        { name: "Harbor Seaport", pos: new THREE.Vector3(1100, 200, 1200) },
        { name: "Airbase Final Ingress", pos: new THREE.Vector3(1900, 240, 800) },
      ];
    } else if (id === 2) {
      // Mission 2: Archipelago Recon Patrol
      return [
        { name: "Island High Patrol", pos: new THREE.Vector3(-800, 1100, 3500) },
        { name: "North Cape Peak", pos: new THREE.Vector3(-1800, 950, 2200) },
        { name: "Archipelago Straits", pos: new THREE.Vector3(-2800, 800, 800) },
        { name: "Seaport Overlook", pos: new THREE.Vector3(-3200, 700, -800) },
        { name: "South Fjord Pass", pos: new THREE.Vector3(-2200, 600, -2200) },
        { name: "Deep Bay Waypoint", pos: new THREE.Vector3(-600, 500, -2800) },
        { name: "East Peninsula", pos: new THREE.Vector3(1200, 550, -1800) },
        { name: "Base Transition", pos: new THREE.Vector3(2200, 650, 0) },
      ];
    } else {
      // Mission 3: Airbase Runway 09 Approach (Descends on 3-degree glide slope)
      return [
        { name: "Approach Initial", pos: new THREE.Vector3(-3500, 300, 0) },
        { name: "Glide Slope Intercept", pos: new THREE.Vector3(-2600, 200, 0) },
        { name: "Short Final Decision", pos: new THREE.Vector3(-1800, 100, 0) },
        { name: "Touchdown Threshold 09R", pos: new THREE.Vector3(-1500, 25, 0) },
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

    // Pulse current active ring with brilliant gold sparkle
    const nowSec = performance.now() * 0.006;
    const pulseScale = 1.0 + Math.sin(nowSec) * 0.08;
    currentRing.group.scale.setScalar(pulseScale);

    // Active ring glowing radiant electric gold
    currentRing.innerMesh.material.color.setHex(0xffea00);
    currentRing.outerMesh.material.color.setHex(0xffaa00);

    // Check if aircraft crossed through ring plane
    const dist = physics.position.distanceTo(currentRing.position);
    if (dist <= currentRing.radius) {
      // Pass confirmed!
      currentRing.passed = true;
      currentRing.innerMesh.material.color.setHex(0x10b981); // Turn emerald green
      currentRing.outerMesh.material.color.setHex(0x34d399);
      currentRing.group.scale.setScalar(1.0);

      if (this.audio && typeof this.audio.playRingPass === 'function') {
        this.audio.playRingPass();
      }

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
    return `${this.activeMission.name.toUpperCase()} · RING ${current + 1}/${total}`;
  }
}
