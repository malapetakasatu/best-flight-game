// AeroStrike X-35 Valkyrie - Realistic 3D Supersonic Jet Model & Visual FX
/* global THREE */

export class AircraftMesh {
  constructor() {
    this.group = new THREE.Group();
    
    // Sub-components for animation
    this.leftAileron = null;
    this.rightAileron = null;
    this.leftRudder = null;
    this.rightRudder = null;
    this.canopy = null;
    this.exhaustFlames = [];
    this.wingtipTrails = [];
    this.landingGearGroup = null;
    
    this.buildAirframe();
    this.buildAfterburner();
  }

  buildAirframe() {
    // Military Matte Dark Navy / Gunmetal Grey Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.35,
      metalness: 0.65,
    });
    
    const darkAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.4,
      metalness: 0.7,
    });
    
    const leadingEdgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x374151,
      roughness: 0.25,
      metalness: 0.8,
    });
    
    const canopyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0f3460,
      roughness: 0.05,
      metalness: 0.9,
      transmission: 0.6,
      transparent: true,
      opacity: 0.85,
    });

    // 1. Sleek Streamlined Fuselage (Non-blocky, smooth lathe / cone geometry)
    const noseGeo = new THREE.ConeGeometry(0.85, 4.2, 32);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, leadingEdgeMaterial);
    nose.position.set(0, 0, -5.6);
    this.group.add(nose);

    const midBodyGeo = new THREE.CylinderGeometry(1.2, 0.85, 6.0, 32);
    midBodyGeo.rotateX(Math.PI / 2);
    midBodyGeo.scale(1.4, 0.75, 1.0); // Flattened stealth chine cross-section
    const midBody = new THREE.Mesh(midBodyGeo, bodyMaterial);
    midBody.position.set(0, 0, -1.0);
    this.group.add(midBody);

    const aftBodyGeo = new THREE.CylinderGeometry(0.9, 1.2, 4.5, 32);
    aftBodyGeo.rotateX(Math.PI / 2);
    aftBodyGeo.scale(1.35, 0.7, 1.0);
    const aftBody = new THREE.Mesh(aftBodyGeo, darkAccentMaterial);
    aftBody.position.set(0, 0, 4.0);
    this.group.add(aftBody);

    // 2. Tinted Bubble Glass Canopy & Pilot Silhouette
    const canopyGeo = new THREE.SphereGeometry(0.7, 32, 16);
    canopyGeo.scale(0.8, 0.6, 2.5);
    const canopy = new THREE.Mesh(canopyGeo, canopyMaterial);
    canopy.position.set(0, 0.65, -2.4);
    this.group.add(canopy);

    const helmetGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const helmet = new THREE.Mesh(helmetGeo, new THREE.MeshStandardMaterial({ color: 0x10b981 }));
    helmet.position.set(0, 0.55, -2.2);
    this.group.add(helmet);

    // 3. Swept Delta Wings (Smooth aerodynamic tapered prisms)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, -1.5);
    wingShape.lineTo(6.2, 2.4);
    wingShape.lineTo(5.8, 3.6);
    wingShape.lineTo(0, 3.0);
    wingShape.closePath();

    const extrudeSettings = { depth: 0.14, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeo.rotateX(Math.PI / 2);

    // Right Wing
    const rightWing = new THREE.Mesh(wingGeo, bodyMaterial);
    rightWing.position.set(0.6, 0.05, 0);
    this.group.add(rightWing);

    // Left Wing (Mirrored)
    const leftWing = new THREE.Mesh(wingGeo, bodyMaterial);
    leftWing.position.set(-0.6, 0.05, 0);
    leftWing.scale.set(-1, 1, 1);
    this.group.add(leftWing);

    // 4. Twin Canted Vertical Stabilizers (V-Tail)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.7, 2.4);
    finShape.lineTo(1.6, 2.4);
    finShape.lineTo(2.0, 0);
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
    finGeo.rotateY(Math.PI / 2);

    // Right Fin (Canted 20 degrees outwards)
    const rightFin = new THREE.Mesh(finGeo, leadingEdgeMaterial);
    rightFin.position.set(1.1, 0.35, 3.2);
    rightFin.rotation.z = -0.32;
    this.group.add(rightFin);

    // Left Fin (Canted 20 degrees outwards)
    const leftFin = new THREE.Mesh(finGeo, leadingEdgeMaterial);
    leftFin.position.set(-1.1, 0.35, 3.2);
    leftFin.rotation.z = 0.32;
    leftFin.scale.set(1, 1, -1);
    this.group.add(leftFin);

    // 5. Twin Turbofan Exhaust Nozzles
    const nozzleGeo = new THREE.CylinderGeometry(0.5, 0.58, 1.2, 24);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzleMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.2,
      metalness: 0.95,
    });

    const leftNozzle = new THREE.Mesh(nozzleGeo, nozzleMaterial);
    leftNozzle.position.set(-0.7, 0.02, 6.2);
    this.group.add(leftNozzle);

    const rightNozzle = new THREE.Mesh(nozzleGeo, nozzleMaterial);
    rightNozzle.position.set(0.7, 0.02, 6.2);
    this.group.add(rightNozzle);

    // 6. Retractable Tricycle Landing Gear
    this.landingGearGroup = new THREE.Group();
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.9 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    // Nose gear
    const noseStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4), strutMat);
    noseStrut.position.set(0, -0.9, -3.8);
    const noseWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16), tireMat);
    noseWheel.rotateZ(Math.PI / 2);
    noseWheel.position.set(0, -1.5, -3.8);
    this.landingGearGroup.add(noseStrut, noseWheel);

    // Main left gear
    const leftStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5), strutMat);
    leftStrut.position.set(-1.2, -0.95, 1.8);
    const leftWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16), tireMat);
    leftWheel.rotateZ(Math.PI / 2);
    leftWheel.position.set(-1.2, -1.65, 1.8);
    this.landingGearGroup.add(leftStrut, leftWheel);

    // Main right gear
    const rightStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5), strutMat);
    rightStrut.position.set(1.2, -0.95, 1.8);
    const rightWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16), tireMat);
    rightWheel.rotateZ(Math.PI / 2);
    rightWheel.position.set(1.2, -1.65, 1.8);
    this.landingGearGroup.add(rightStrut, rightWheel);

    this.group.add(this.landingGearGroup);
  }

  buildAfterburner() {
    // Glowing Twin Afterburner Cones
    const flameGeo = new THREE.ConeGeometry(0.42, 3.8, 16);
    flameGeo.rotateX(-Math.PI / 2);
    flameGeo.translate(0, 0, 1.9);

    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });

    const innerFlameGeo = new THREE.ConeGeometry(0.24, 2.6, 16);
    innerFlameGeo.rotateX(-Math.PI / 2);
    innerFlameGeo.translate(0, 0, 1.3);

    const innerFlameMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });

    // Left Afterburner
    const leftFlame = new THREE.Mesh(flameGeo, flameMaterial);
    leftFlame.position.set(-0.7, 0.02, 6.7);
    const leftInner = new THREE.Mesh(innerFlameGeo, innerFlameMaterial);
    leftFlame.add(leftInner);
    this.group.add(leftFlame);

    // Right Afterburner
    const rightFlame = new THREE.Mesh(flameGeo, flameMaterial.clone());
    rightFlame.position.set(0.7, 0.02, 6.7);
    const rightInner = new THREE.Mesh(innerFlameGeo, innerFlameMaterial.clone());
    rightFlame.add(rightInner);
    this.group.add(rightFlame);

    this.exhaustFlames = [leftFlame, rightFlame];
  }

  update(physics, dt) {
    // 1. Sync Mesh Position and Rotation from 6-DOF Physics
    this.group.position.copy(physics.position);
    this.group.quaternion.copy(physics.quaternion);

    // 2. Landing Gear Animation
    if (this.landingGearGroup) {
      this.landingGearGroup.visible = physics.gear;
    }

    // 3. Afterburner Jet Flame Glow & Flicker
    const abActive = physics.afterburner && physics.throttle > 0.8;
    const flicker = 0.85 + Math.random() * 0.3;
    
    for (const flame of this.exhaustFlames) {
      if (abActive) {
        flame.material.opacity = 0.9 * flicker;
        flame.material.color.setHex(0x00b4d8);
        flame.scale.set(1.0, 1.0, 1.0 + flicker * 0.35);
        if (flame.children[0]) {
          flame.children[0].material.opacity = 0.95;
        }
      } else if (physics.throttle > 0.2) {
        // Normal cruise military heat glow
        flame.material.opacity = physics.throttle * 0.35;
        flame.material.color.setHex(0xff7700);
        flame.scale.set(0.7, 0.7, physics.throttle * 0.6);
        if (flame.children[0]) flame.children[0].material.opacity = 0.1;
      } else {
        flame.material.opacity = 0.0;
        if (flame.children[0]) flame.children[0].material.opacity = 0.0;
      }
    }
  }
}
