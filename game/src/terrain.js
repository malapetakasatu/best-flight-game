// AeroStrike X-35 Valkyrie - Island Terrain, Pine Forest & Archipelago Seaport
// Hand-crafted procedural topography: lush coastal meadows, pine forests, alpine lake, harbour town, and airbase
/* global THREE */

export class IslandTerrain {
  constructor(scene) {
    this.scene = scene;
    this.gridSize = 256;
    this.worldSize = 12000; // 12km x 12km archipelago theater
    this.terrainMesh = null;
    this.heightData = new Float32Array(this.gridSize * this.gridSize);

    this.buildTerrain();
    this.buildAirbase();
    this.buildMountainLake();
    this.buildPineForest();
    this.buildHarbourTown();
    this.buildCarrier();
    this.buildOcean();
  }

  // Pure procedural height model driving both visual terrain & 6-DOF physics collisions
  noise(x, z) {
    // 1. Layered sinusoidal harmonic octaves for continuous organic mountains & rolling hills
    const o1 = Math.sin(x * 0.00045) * Math.cos(z * 0.00041) * 380;
    const o2 = Math.sin(x * 0.00105 + 1.1) * Math.sin(z * 0.00095 + 0.8) * 190;
    const o3 = Math.cos(x * 0.0024 - 0.4) * Math.sin(z * 0.0021 + 1.9) * 75;
    const o4 = Math.sin(x * 0.0058) * Math.cos(z * 0.0053) * 24;

    // 2. Island radial falloff (gentle shores fading into coastal waters)
    const dist = Math.sqrt(x * x + z * z);
    const islandMask = Math.max(0, 1.0 - Math.pow(dist / 5200, 2.4));

    let h = (o1 + o2 + o3 + o4) * islandMask;

    // 3. High Mountain Ridge to the North / Northwest (peaks up to 480m)
    const ridgeDist = Math.hypot(x - (-1800), z - 2600);
    h += 240 * Math.exp(-(ridgeDist * ridgeDist) / (1200 * 1200)) * islandMask;

    // 4. Freshwater Mountain Lake ("Emerald Tarn") at (-800, 1400)
    const lakeDist = Math.hypot(x - (-800), z - 1400);
    if (lakeDist < 350) {
      const lakeDepression = Math.cos((lakeDist / 350) * Math.PI) * 0.5 + 0.5;
      h -= 45 * lakeDepression;
    }

    // 5. Airbase Runway Shelf: perfectly flattened ground at 3.0m MSL
    const runwayDistX = Math.max(0, Math.abs(x) - 1400) / 350;
    const runwayDistZ = Math.max(0, Math.abs(z) - 180) / 220;
    const runwayFlatten = Math.min(1.0, Math.sqrt(runwayDistX * runwayDistX + runwayDistZ * runwayDistZ));
    if (runwayFlatten < 1.0) {
      h = h * runwayFlatten + 3.0 * (1.0 - runwayFlatten);
    }

    // 6. Devil's Gorge Canyon Cut: carve deep supersonic flight pass
    const canyonT = (x + 3200) / 4400;
    if (canyonT >= 0 && canyonT <= 1) {
      const canyonZCenter = 2800 - canyonT * 1600;
      const canyonDistZ = Math.abs(z - canyonZCenter);
      if (canyonDistZ < 380) {
        const canyonFactor = Math.pow(canyonDistZ / 380, 1.7);
        h = Math.min(h, h * canyonFactor + 55.0 * (1.0 - canyonFactor));
      }
    }

    // 7. Coastal Harbour Town Shelf: gently levelled coastal terrace at (1600, 700)
    const townDist = Math.hypot(x - 1600, z - 700);
    if (townDist < 450) {
      const townFactor = Math.cos((townDist / 450) * Math.PI) * 0.5 + 0.5;
      h = h * (1.0 - townFactor * 0.75) + 6.5 * (townFactor * 0.75);
    }

    return Math.max(0, h);
  }

  buildTerrain() {
    const geo = new THREE.PlaneGeometry(this.worldSize, this.worldSize, this.gridSize - 1, this.gridSize - 1);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const halfSize = this.worldSize / 2;
    const step = this.worldSize / (this.gridSize - 1);

    // Rich, warm cinematic Grand Canyon & Nordic Fjord Palette
    const cSand   = new THREE.Color(0xe6cf9a); // Warm sunlit beach sand
    const cGrass  = new THREE.Color(0x4a7c36); // Rich coastal pine meadow
    const cForest = new THREE.Color(0x1e4a1a); // Deep boreal conifer forest
    const cRock   = new THREE.Color(0xb26b48); // Grand Canyon red-rock sandstone crag
    const cSnow   = new THREE.Color(0xf8fafc); // Crisp alpine glacial snow
    const cRoad   = new THREE.Color(0x334155); // Coastal paved highway

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = this.noise(x, z);
      pos.setY(i, h);

      const gridX = Math.round((x + halfSize) / step);
      const gridZ = Math.round((z + halfSize) / step);
      if (gridX >= 0 && gridX < this.gridSize && gridZ >= 0 && gridZ < this.gridSize) {
        this.heightData[gridZ * this.gridSize + gridX] = h;
      }

      // Height and slope gradient color blending
      let vertexColor = new THREE.Color();
      if (h < 3.2) {
        vertexColor.copy(cSand);
      } else if (h < 85) {
        const t = (h - 3.2) / 81.8;
        vertexColor.lerpColors(cGrass, cForest, t * 0.75);
      } else if (h < 230) {
        const t = (h - 85) / 145;
        vertexColor.lerpColors(cForest, cRock, t);
      } else if (h < 380) {
        const t = (h - 230) / 150;
        vertexColor.lerpColors(cRock, cSnow, t * 0.85);
      } else {
        vertexColor.copy(cSnow);
      }

      // Coastal highway snaking from Airbase to Harbour Town
      const roadZ = 120 + 0.38 * (x - 200) + Math.sin(x * 0.004) * 45;
      const roadDist = Math.abs(z - roadZ);
      if (h > 2.5 && h < 65 && roadDist < 12 && x > -400 && x < 1650) {
        vertexColor.lerp(cRoad, 0.85);
      }

      colors[i * 3]     = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      reflectivity: 0.2,
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.terrainMesh);
  }

  buildMountainLake() {
    // Freshwater Alpine Lake ("Emerald Tarn") at (-800, 1400)
    const lakeGeo = new THREE.CircleGeometry(310, 32);
    lakeGeo.rotateX(-Math.PI / 2);
    const lakeMat = new THREE.MeshLambertMaterial({
      color: 0x1e6f7d, // Turquoise alpine glacial water
      transparent: true,
      opacity: 0.92,
    });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.position.set(-800, 92.5, 1400);
    this.scene.add(lake);
  }

  buildPineForest() {
    // Over 550 instanced 3D conifer & spruce trees across valleys and slopes
    const treeCount = 550;
    const trunkGeo = new THREE.CylinderGeometry(0.7, 1.1, 5.5, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x483627 });

    const coneGeo = new THREE.ConeGeometry(3.6, 12.5, 8);
    const coneMat = new THREE.MeshLambertMaterial({ color: 0x244c1d });

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const cones  = new THREE.InstancedMesh(coneGeo, coneMat, treeCount);

    const mTrunk = new THREE.Matrix4();
    const mCone  = new THREE.Matrix4();
    let placed = 0;
    let seed = 42;

    const pseudoRand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < treeCount * 4 && placed < treeCount; i++) {
      const x = (pseudoRand() - 0.5) * 6500;
      const z = (pseudoRand() - 0.5) * 6500;
      const h = this.noise(x, z);

      // Place trees exclusively on green slopes and forest altitude
      if (h < 5.0 || h > 165) continue;
      if (Math.abs(x) < 1650 && Math.abs(z) < 250) continue; // Keep airfield clear
      if (Math.hypot(x - (-800), z - 1400) < 360) continue; // Keep lake clear
      if (Math.hypot(x - 1600, z - 700) < 420) continue; // Keep town center clear

      const scale = 0.8 + pseudoRand() * 0.45;
      mTrunk.makeScale(scale, scale, scale);
      mTrunk.setPosition(x, h + 2.75 * scale, z);
      trunks.setMatrixAt(placed, mTrunk);

      mCone.makeScale(scale, scale, scale);
      mCone.setPosition(x, h + 9.0 * scale, z);
      cones.setMatrixAt(placed, mCone);

      placed++;
    }

    trunks.instanceMatrix.needsUpdate = true;
    cones.instanceMatrix.needsUpdate = true;
    this.scene.add(trunks, cones);
  }

  buildHarbourTown() {
    // Port Kodiak - Coastal Seaport with Nordic timber houses, church spire, quayside piers & lighthouse
    const townGroup = new THREE.Group();
    const townX = 1600;
    const townZ = 700;

    const wallGeo = new THREE.BoxGeometry(1, 1, 1);
    const roofGeo = new THREE.ConeGeometry(1, 1, 4);

    const houseColors = [
      { wall: 0xe5dfcf, roof: 0xb84a32 }, // Terracotta Red Roof
      { wall: 0xdec89e, roof: 0x8b2520 }, // Falun Crimson
      { wall: 0xd6e2ea, roof: 0x3d5a73 }, // Slate Fjord Blue
      { wall: 0xe8dfc8, roof: 0xd9a74a }, // Nordic Warm Ochre
      { wall: 0xdfe8dc, roof: 0x3b593a }, // Deep Spruce Green
    ];

    let seed = 1337;
    const pseudoRand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // 40+ Coastal buildings arranged along street blocks
    for (let gx = -4; gx <= 4; gx++) {
      for (let gz = -3; gz <= 3; gz++) {
        if (Math.abs(gx) + Math.abs(gz) > 6) continue;
        if (pseudoRand() < 0.18) continue;

        const x = townX + gx * 38 + (pseudoRand() - 0.5) * 16;
        const z = townZ + gz * 38 + (pseudoRand() - 0.5) * 16;
        const h = this.noise(x, z);

        const w = 14 + pseudoRand() * 9;
        const bHeight = 8 + pseudoRand() * 6;
        const palette = houseColors[Math.floor(pseudoRand() * houseColors.length)];

        // House Body
        const wallMat = new THREE.MeshLambertMaterial({ color: palette.wall });
        const house = new THREE.Mesh(wallGeo, wallMat);
        house.scale.set(w, bHeight, w * 0.85);
        house.position.set(x, h + bHeight / 2, z);
        house.rotation.y = (pseudoRand() - 0.5) * 0.6;

        // Pitched Roof
        const roofMat = new THREE.MeshLambertMaterial({ color: palette.roof });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.scale.set(w * 0.82, 5 + pseudoRand() * 3, w * 0.72);
        roof.position.set(x, h + bHeight + 2.4, z);
        roof.rotation.y = Math.PI / 4 + house.rotation.y;

        townGroup.add(house, roof);
      }
    }

    // Grand Church Spire marking Port Kodiak from the air
    const churchBase = new THREE.Mesh(
      new THREE.BoxGeometry(16, 28, 22),
      new THREE.MeshLambertMaterial({ color: 0xf1efe7 })
    );
    const churchH = this.noise(townX - 45, townZ - 20);
    churchBase.position.set(townX - 45, churchH + 14, townZ - 20);

    const churchSpire = new THREE.Mesh(
      new THREE.ConeGeometry(5, 24, 6),
      new THREE.MeshLambertMaterial({ color: 0x3d5a73 })
    );
    churchSpire.position.set(townX - 45, churchH + 28 + 12, townZ - 20);
    townGroup.add(churchBase, churchSpire);

    // Cape Falcon Coastal Lighthouse on the rocky promontory
    const lightX = 2200;
    const lightZ = 950;
    const lightH = this.noise(lightX, lightZ);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 7.5, 36, 12),
      new THREE.MeshLambertMaterial({ color: 0xf8fafc })
    );
    shaft.position.set(lightX, lightH + 18, lightZ);

    // Red bands on lighthouse
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(5.6, 6.2, 8, 12),
      new THREE.MeshLambertMaterial({ color: 0xcc292b })
    );
    band.position.set(lightX, lightH + 20, lightZ);

    // Lantern Room & Glowing Amber Beacon
    const lantern = new THREE.Mesh(
      new THREE.CylinderGeometry(5.0, 5.0, 7, 10),
      new THREE.MeshBasicMaterial({ color: 0xffd166 })
    );
    lantern.position.set(lightX, lightH + 39, lightZ);

    townGroup.add(shaft, band, lantern);

    // Stone Harbour Pier & Quayside jutting into the bay
    const pierGeo = new THREE.BoxGeometry(140, 4, 18);
    const pierMat = new THREE.MeshLambertMaterial({ color: 0x737a82 });
    const pier1 = new THREE.Mesh(pierGeo, pierMat);
    pier1.position.set(townX + 80, 2.2, townZ + 140);
    pier1.rotation.y = 0.35;

    const pier2 = new THREE.Mesh(pierGeo, pierMat);
    pier2.position.set(townX + 160, 2.2, townZ + 90);
    pier2.rotation.y = -0.25;

    townGroup.add(pier1, pier2);
    this.scene.add(townGroup);
  }

  buildAirbase() {
    const airbaseGroup = new THREE.Group();

    // 1. Main Asphalt Runway 09/27 (Length: 3000m, Width: 80m)
    const runwayGeo = new THREE.PlaneGeometry(3000, 80);
    runwayGeo.rotateX(-Math.PI / 2);
    const runwayMat = new THREE.MeshStandardMaterial({
      color: 0x22272e,
      roughness: 0.72,
      metalness: 0.15,
    });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.position.set(0, 3.2, 0);
    airbaseGroup.add(runway);

    // 2. Runway Centerline Stripes
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    for (let x = -1350; x <= 1350; x += 60) {
      const stripeGeo = new THREE.PlaneGeometry(32, 2.5);
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
    const lightGeo = new THREE.SphereGeometry(0.8, 8, 8);

    // West Threshold Green Lights (Runway 09 approach)
    for (let z = -40; z <= 40; z += 10) {
      const greenLight = new THREE.Mesh(lightGeo, greenLightMat);
      greenLight.position.set(-1480, 4.0, z);
      airbaseGroup.add(greenLight);
    }

    // White Edge Lights along runway sides
    for (let x = -1450; x <= 1450; x += 90) {
      const lightNorth = new THREE.Mesh(lightGeo, whiteLightMat);
      lightNorth.position.set(x, 4.0, -42);
      const lightSouth = new THREE.Mesh(lightGeo, whiteLightMat);
      lightSouth.position.set(x, 4.0, 42);
      airbaseGroup.add(lightNorth, lightSouth);
    }

    // 4. Hangars & Airbase Control Tower
    const hangarMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    for (let x = -600; x <= 600; x += 400) {
      const hangarGeo = new THREE.CylinderGeometry(30, 30, 70, 16, 1, false, 0, Math.PI);
      hangarGeo.rotateZ(Math.PI / 2);
      const hangar = new THREE.Mesh(hangarGeo, hangarMat);
      hangar.position.set(x, 3.0, -110);
      airbaseGroup.add(hangar);
    }

    // Control Tower with tinted avionics glass cab
    const towerMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, 45, 12), towerMat);
    tower.position.set(200, 25, -120);
    const cab = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 10, 12, 12),
      new THREE.MeshLambertMaterial({ color: 0x0284c7, emissive: 0x0369a1, emissiveIntensity: 0.6 })
    );
    cab.position.set(200, 52, -120);

    // Radar Dome on Tower Top
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(6, 12, 10),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    dome.position.set(200, 62, -120);

    airbaseGroup.add(tower, cab, dome);
    this.scene.add(airbaseGroup);
  }

  buildCarrier() {
    // Offshore Aircraft Carrier (USS Freedom) stationed at (-4200, 0, 3800)
    const carrierGroup = new THREE.Group();
    carrierGroup.position.set(-4200, 8.0, 3800);
    carrierGroup.rotation.y = 0.55;

    // Flight Deck (330m x 75m)
    const deckGeo = new THREE.BoxGeometry(330, 12, 76);
    const deckMat = new THREE.MeshLambertMaterial({ color: 0x22262c });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    carrierGroup.add(deck);

    // Island Superstructure
    const superGeo = new THREE.BoxGeometry(45, 38, 18);
    const superMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
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
    // Vibrant Turquoise / Coastal Oceanic Blue
    const oceanGeo = new THREE.PlaneGeometry(this.worldSize * 1.6, this.worldSize * 1.6);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshLambertMaterial({
      color: 0x246a9a, // Crystal coastal turquoise blue
      transparent: true,
      opacity: 0.94,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.y = 0.4;
    this.scene.add(ocean);
  }

  getHeightAt(x, z) {
    return this.noise(x, z);
  }
}
