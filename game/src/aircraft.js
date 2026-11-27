// AeroStrike X-35 Valkyrie - Realistic 3D Supersonic Jet Model & Detailed Cockpit Interior
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
    this.cockpitInteriorGroup = null;
    
    this.buildAirframe();
    this.buildCockpitInterior();
    this.buildAfterburner();
  }

  buildAirframe() {
    // Military Matte Dark Navy / Gunmetal Titanium Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2633,
      roughness: 0.32,
      metalness: 0.75,
    });
    
    const darkAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.38,
      metalness: 0.8,
    });
    
    const leadingEdgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.22,
      metalness: 0.85,
    });
    
    const canopyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x092540,
      roughness: 0.04,
      metalness: 0.95,
      transmission: 0.72,
      transparent: true,
      opacity: 0.82,
    });

    // 1. Sleek Streamlined Fuselage (Chined stealth design)
    const noseGeo = new THREE.ConeGeometry(0.85, 4.2, 32);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, leadingEdgeMaterial);
    nose.position.set(0, 0, -5.6);
    this.group.add(nose);

    // Pitot probe at nose tip
    const pitotGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
    pitotGeo.rotateX(Math.PI / 2);
    const pitot = new THREE.Mesh(pitotGeo, leadingEdgeMaterial);
    pitot.position.set(0, 0, -8.2);
    this.group.add(pitot);

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

    // 2. Tinted Bubble Glass Canopy
    const canopyGeo = new THREE.SphereGeometry(0.72, 32, 16);
    canopyGeo.scale(0.82, 0.62, 2.6);
    const canopy = new THREE.Mesh(canopyGeo, canopyMaterial);
    canopy.position.set(0, 0.65, -2.4);
    this.group.add(canopy);

    // Pilot with flight helmet and visor
    const helmetGeo = new THREE.SphereGeometry(0.26, 16, 16);
    const helmet = new THREE.Mesh(helmetGeo, new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3 }));
    helmet.position.set(0, 0.56, -2.2);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.18), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 }));
    visor.position.set(0, 0.58, -2.35);
    this.group.add(helmet, visor);

    // 3. Swept Delta Wings with Leading Edge Extensions (LEX)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, -1.5);
    wingShape.lineTo(6.4, 2.4);
    wingShape.lineTo(6.0, 3.6);
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

    // Wingtip Missile Rails
    const railGeo = new THREE.BoxGeometry(0.12, 0.14, 2.2);
    const missileGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 12);
    missileGeo.rotateX(Math.PI / 2);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const missileMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(6.8, 0.05, 2.8);
    const rightMissile = new THREE.Mesh(missileGeo, missileMat);
    rightMissile.position.set(6.8, -0.05, 2.8);
    this.group.add(rightRail, rightMissile);

    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-6.8, 0.05, 2.8);
    const leftMissile = new THREE.Mesh(missileGeo, missileMat);
    leftMissile.position.set(-6.8, -0.05, 2.8);
    this.group.add(leftRail, leftMissile);

    // 4. Twin Canted Vertical Stabilizers (V-Tail)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.7, 2.5);
    finShape.lineTo(1.6, 2.5);
    finShape.lineTo(2.0, 0);
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
    finGeo.rotateY(Math.PI / 2);

    // Right Fin (Canted outwards)
    const rightFin = new THREE.Mesh(finGeo, leadingEdgeMaterial);
    rightFin.position.set(1.15, 0.35, 3.2);
    rightFin.rotation.z = -0.32;
    this.group.add(rightFin);

    // Left Fin (Canted outwards)
    const leftFin = new THREE.Mesh(finGeo, leadingEdgeMaterial);
    leftFin.position.set(-1.15, 0.35, 3.2);
    leftFin.rotation.z = 0.32;
    leftFin.scale.set(1, 1, -1);
    this.group.add(leftFin);

    // 5. Twin Turbofan Exhaust Nozzles
    const nozzleGeo = new THREE.CylinderGeometry(0.52, 0.60, 1.3, 24);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzleMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.18,
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

  buildCockpitInterior() {
    // High-fidelity 3D Cockpit Interior with Illuminated MFD Screens, HUD Combiner & Glare Shield
    this.cockpitInteriorGroup = new THREE.Group();
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });

    // 1. Dashboard Glare Shield (Angled hood over avionics)
    const glareShield = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 1.1), dashMat);
    glareShield.position.set(0, 0.52, -2.75);
    glareShield.rotation.x = -0.18;
    this.cockpitInteriorGroup.add(glareShield);

    // 2. Center HUD Glass Combiner Bracket & Lens
    const hudFrame = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.04), frameMat);
    hudFrame.position.set(0, 0.76, -2.55);
    const hudGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.28, 0.015),
      new THREE.MeshPhysicalMaterial({
        color: 0x00ff88,
        transmission: 0.85,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
      })
    );
    hudGlass.position.set(0, 0.65, -2.55);
    hudGlass.rotation.x = -0.22;
    this.cockpitInteriorGroup.add(hudFrame, hudGlass);

    // 3. Left Multifunction Display (Tactical Radar / Navigation Vector Map)
    const mfdFrameGeo = new THREE.BoxGeometry(0.32, 0.32, 0.05);
    const mfdScreenGeo = new THREE.PlaneGeometry(0.28, 0.28);

    const leftMfdFrame = new THREE.Mesh(mfdFrameGeo, frameMat);
    leftMfdFrame.position.set(-0.32, 0.38, -2.62);
    leftMfdFrame.rotation.x = -0.25;

    // Glowing Green Tactical Radar Screen
    const leftMfdScreen = new THREE.Mesh(
      mfdScreenGeo,
      new THREE.MeshBasicMaterial({
        color: 0x00ff66,
        wireframe: true,
      })
    );
    leftMfdScreen.position.set(0, 0, 0.028);
    leftMfdFrame.add(leftMfdScreen);
    this.cockpitInteriorGroup.add(leftMfdFrame);

    // 4. Right Multifunction Display (Engine Status, Stores & Horizon Ball)
    const rightMfdFrame = new THREE.Mesh(mfdFrameGeo, frameMat);
    rightMfdFrame.position.set(0.32, 0.38, -2.62);
    rightMfdFrame.rotation.x = -0.25;

    // Glowing Cyan Flight Telemetry Screen
    const rightMfdScreen = new THREE.Mesh(
      mfdScreenGeo,
      new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: true,
      })
    );
    rightMfdScreen.position.set(0, 0, 0.028);
    rightMfdFrame.add(rightMfdScreen);
    this.cockpitInteriorGroup.add(rightMfdFrame);

    // 5. Arched Canopy Structural Bow Frame (Encloses the cockpit view)
    const bowShape = new THREE.Shape();
    bowShape.absarc(0, 0, 0.62, 0, Math.PI, false);
    const bowGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.08, 24, 1, true, 0, Math.PI);
    bowGeo.rotateZ(Math.PI / 2);
    const canopyBow = new THREE.Mesh(bowGeo, frameMat);
    canopyBow.position.set(0, 0.62, -2.52);
    canopyBow.scale.set(0.9, 0.82, 1.0);
    this.cockpitInteriorGroup.add(canopyBow);

    // Center rear-view mirror on canopy bow
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.03), frameMat);
    mirror.position.set(0, 1.08, -2.52);
    mirror.rotation.x = 0.2;
    this.cockpitInteriorGroup.add(mirror);

    // 6. Pilot Flight Stick (HOTAS)
    const stickBase = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.35, 10), frameMat);
    stickBase.position.set(0, 0.15, -2.05);
    stickBase.rotation.x = -0.15;
    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    trigger.position.set(0, 0.16, -0.02);
    stickBase.add(trigger);
    this.cockpitInteriorGroup.add(stickBase);

    this.group.add(this.cockpitInteriorGroup);
  }

  buildAfterburner() {
    // Glowing Twin Afterburner Cones with Intense Shock Diamonds
    const flameGeo = new THREE.ConeGeometry(0.48, 4.6, 20);
    flameGeo.rotateX(-Math.PI / 2);
    flameGeo.translate(0, 0, 2.3);

    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });

    const innerFlameGeo = new THREE.ConeGeometry(0.28, 3.2, 16);
    innerFlameGeo.rotateX(-Math.PI / 2);
    innerFlameGeo.translate(0, 0, 1.6);

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
    const flicker = 0.88 + Math.random() * 0.24;
    
    for (const flame of this.exhaustFlames) {
      if (abActive) {
        flame.material.opacity = 0.95 * flicker;
        flame.material.color.setHex(0x00d4ff);
        flame.scale.set(1.0, 1.0, 1.0 + flicker * 0.4);
        if (flame.children[0]) {
          flame.children[0].material.opacity = 0.98;
        }
      } else if (physics.throttle > 0.2) {
        // Normal cruise military heat glow
        flame.material.opacity = physics.throttle * 0.45;
        flame.material.color.setHex(0xffaa00);
        flame.scale.set(0.75, 0.75, physics.throttle * 0.7);
        if (flame.children[0]) flame.children[0].material.opacity = 0.2;
      } else {
        flame.material.opacity = 0.0;
        if (flame.children[0]) flame.children[0].material.opacity = 0.0;
      }
    }
  }
}
