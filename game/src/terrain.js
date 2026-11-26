// AeroStrike X-35 Valkyrie - Procedural Terrain, Island Airbase & Runway Architecture
/* global THREE */

export class IslandTerrain {
  constructor(scene) {
    this.scene = scene;
    this.gridSize = 256;
    this.worldSize = 14000; // 14km x 14km theater of operations
    this.terrainMesh = null;
    this.heightData = new Float32Array(this.gridSize * this.gridSize);
    
    this.buildTerrain();
    this.buildAirbase();
    this.buildCarrier();
    this.buildOcean();
  }

  // Multi-octave smooth procedural elevation noise
  simplexNoise2D(x, y) {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  }

  noise(x, z) {
    // Layered harmonic sinusoidal octaves for continuous organic mountains
    const o1 = Math.sin(x * 0.00042) * Math.cos(z * 0.00038) * 420;
    const o2 = Math.sin(x * 0.00095 + 1.2) * Math.sin(z * 0.00088 + 0.7) * 220;
    const o3 = Math.cos(x * 0.0022 - 0.5) * Math.sin(z * 0.0019 + 2.1) * 85;
    const o4 = Math.sin(x * 0.0055) * Math.cos(z * 0.0051) * 28;
    
    // Island radial falloff (ocean at edges)
    const dist = Math.sqrt(x * x + z * z);
    const islandMask = Math.max(0, 1.0 - Math.pow(dist / 5600, 2.2));
    
    let rawHeight = (o1 + o2 + o3 + o4) * islandMask;
    
    // Flat runway zone: x in [-1800, 1800], z in [-250, 250]
    const runwayDistX = Math.max(0, Math.abs(x) - 1500) / 400;
    const runwayDistZ = Math.max(0, Math.abs(z) - 200) / 250;
    const runwayFlatten = Math.min(1.0, Math.sqrt(runwayDistX * runwayDistX + runwayDistZ * runwayDistZ));
    
    if (runwayFlatten < 1.0) {
      rawHeight = rawHeight * runwayFlatten + 3.0 * (1.0 - runwayFlatten);
    }
    
    // Devil's Gorge Canyon Cut: carve deep pass from (-3200, 2800) to (1200, 1200)
    const canyonT = (x + 3200) / 4400;
    if (canyonT >= 0 && canyonT <= 1) {
      const canyonZCenter = 2800 - canyonT * 1600;
      const canyonDistZ = Math.abs(z - canyonZCenter);
      if (canyonDistZ < 350) {
        const canyonFactor = Math.pow(canyonDistZ / 350, 1.8);
        rawHeight = Math.min(rawHeight, rawHeight * canyonFactor + 60.0 * (1.0 - canyonFactor));
      }
    }

    return Math.max(0, rawHeight);
  }

  buildTerrain() {
    const geo = new THREE.PlaneGeometry(this.worldSize, this.worldSize, this.gridSize - 1, this.gridSize - 1);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const halfSize = this.worldSize / 2;
    const step = this.worldSize / (this.gridSize - 1);

    // Color swatches: Sand, Grass, Rock, Snow
    const cSand = new THREE.Color(0xd4b483);
    const cGrass = new THREE.Color(0x2d5a27);
    const cForest = new THREE.Color(0x1e3f1a);
    const cRock = new THREE.Color(0x54595e);
    const cSnow = new THREE.Color(0xedf2f7);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = this.noise(x, z);
      pos.setY(i, h);

      // Store in height lookup grid
      const gridX = Math.round((x + halfSize) / step);
      const gridZ = Math.round((z + halfSize) / step);
      if (gridX >= 0 && gridX < this.gridSize && gridZ >= 0 && gridZ < this.gridSize) {
        this.heightData[gridZ * this.gridSize + gridX] = h;
      }

      // Vertex color splat based on altitude & slope
      let vertexColor = new THREE.Color();
      if (h < 12) {
        vertexColor.copy(cSand);
      } else if (h < 180) {
        vertexColor.lerpColors(cGrass, cForest, (h - 12) / 168);
      } else if (h < 420) {
        vertexColor.lerpColors(cForest, cRock, (h - 180) / 240);
      } else {
        vertexColor.lerpColors(cRock, cSnow, Math.min(1.0, (h - 420) / 180));
      }

      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: false,
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.terrainMesh);
  }

  buildAirbase() {
    const airbaseGroup = new THREE.Group();

    // 1. Main Asphalt Runway 09/27 (Length: 3000m, Width: 80m)
    const runwayGeo = new THREE.PlaneGeometry(3000, 80);
    runwayGeo.rotateX(-Math.PI / 2);
    const runwayMat = new THREE.MeshStandardMaterial({
      color: 0x1a1e24,
      roughness: 0.65,
      metalness: 0.2,
    });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.position.set(0, 3.2, 0);
    airbaseGroup.add(runway);

    // 2. Runway Centerline Stripes
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let x = -1350; x <= 1350; x += 60) {
      const stripeGeo = new THREE.PlaneGeometry(30, 2.5);
      stripeGeo.rotateX(-Math.PI / 2);
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(x, 3.3, 0);
      airbaseGroup.add(stripe);
    }

    // Threshold Piano Keys (Runway 09 & 27)
    for (let i = -30; i <= 30; i += 7) {
      const keyGeo = new THREE.PlaneGeometry(45, 3.5);
      keyGeo.rotateX(-Math.PI / 2);
      
      const keyWest = new THREE.Mesh(keyGeo, stripeMat);
      keyWest.position.set(-1440, 3.3, i);
      airbaseGroup.add(keyWest);

      const keyEast = new THREE.Mesh(keyGeo, stripeMat);
      keyEast.position.set(1440, 3.3, i);
      airbaseGroup.add(keyEast);
    }

    // 3. Illuminated Runway Edge Lights
    const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    const whiteLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff2233 });
    const lightGeo = new THREE.SphereGeometry(0.8, 8, 8);

    // West Threshold Green Lights (Runway 09 approach)
    for (let z = -40; z <= 40; z += 10) {
      const greenLight = new THREE.Mesh(lightGeo, greenLightMat);
      greenLight.position.set(-1480, 4.0, z);
      airbaseGroup.add(greenLight);
    }

    // White Edge Lights along runway sides
    for (let x = -1450; x <= 1450; x += 100) {
      const lightNorth = new THREE.Mesh(lightGeo, whiteLightMat);
      lightNorth.position.set(x, 4.0, -42);
      const lightSouth = new THREE.Mesh(lightGeo, whiteLightMat);
      lightSouth.position.set(x, 4.0, 42);
      airbaseGroup.add(lightNorth, lightSouth);
    }

    // 4. Hangars & Control Tower
    const hangarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    for (let x = -600; x <= 600; x += 400) {
      const hangarGeo = new THREE.CylinderGeometry(30, 30, 70, 16, 1, false, 0, Math.PI);
      hangarGeo.rotateZ(Math.PI / 2);
      const hangar = new THREE.Mesh(hangarGeo, hangarMat);
      hangar.position.set(x, 3.0, -110);
      airbaseGroup.add(hangar);
    }

    // Tower
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, 45, 12), towerMat);
    tower.position.set(200, 25, -120);
    const cab = new THREE.Mesh(new THREE.CylinderGeometry(14, 10, 12, 12), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
    cab.position.set(200, 52, -120);
    airbaseGroup.add(tower, cab);

    this.scene.add(airbaseGroup);
  }

  buildCarrier() {
    // Offshore Aircraft Carrier (USS Freedom) stationed at (-4200, 0, 3800)
    const carrierGroup = new THREE.Group();
    carrierGroup.position.set(-4200, 8.0, 3800);
    carrierGroup.rotation.y = 0.55;

    // Flight Deck (330m x 75m)
    const deckGeo = new THREE.BoxGeometry(330, 12, 76);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.7 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    carrierGroup.add(deck);

    // Island Superstructure
    const superGeo = new THREE.BoxGeometry(45, 38, 18);
    const superMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    const superstructure = new THREE.Mesh(superGeo, superMat);
    superstructure.position.set(40, 25, 28);
    carrierGroup.add(superstructure);

    // Deck Markings
    const stripeGeo = new THREE.PlaneGeometry(240, 2.5);
    stripeGeo.rotateX(-Math.PI / 2);
    const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    stripe.position.set(-20, 6.2, -10);
    carrierGroup.add(stripe);

    this.scene.add(carrierGroup);
  }

  buildOcean() {
    // Sunlit Ocean Surface with specular reflection
    const oceanGeo = new THREE.PlaneGeometry(this.worldSize * 1.5, this.worldSize * 1.5);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x082f49,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.92,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.y = 0.2;
    this.scene.add(ocean);
  }

  getHeightAt(x, z) {
    return this.noise(x, z);
  }
}
