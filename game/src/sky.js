// AeroStrike X-35 Valkyrie - Atmospheric Sky, Lighting & Volumetric Clouds
// Warm golden-hour daylight, soft Rayleigh horizon haze, and multi-point aviation illumination
/* global THREE */

export class AtmosphericSky {
  constructor(scene) {
    this.scene = scene;
    this.sunLight = null;
    this.ambientLight = null;
    this.fillLight = null;
    this.cloudsGroup = null;

    this.setupLighting();
    this.buildSkyDome();
    this.buildClouds();
  }

  setupLighting() {
    // 1. Warm Directional Sunlight (Key Light casting crisp sunlit highlights)
    this.sunLight = new THREE.DirectionalLight(0xfff2d8, 1.85);
    this.sunLight.position.set(2400, 3200, 1600);
    this.scene.add(this.sunLight);

    // 2. Soft Ambient Skylight & Terrain Ground Bounce
    this.ambientLight = new THREE.HemisphereLight(0xbfd9ff, 0x5a704d, 0.9);
    this.scene.add(this.ambientLight);

    // 3. West / Northwest Fill Light (ensures shadow valleys & aircraft undersides remain clear)
    this.fillLight = new THREE.DirectionalLight(0xd4e4fa, 0.45);
    this.fillLight.position.set(-2000, 1400, -1800);
    this.scene.add(this.fillLight);

    // 4. Soft Atmospheric Distance Haze
    this.scene.fog = new THREE.FogExp2(0xa2c6df, 0.00010);
  }

  buildSkyDome() {
    // Atmospheric Sky Gradient Dome
    const domeGeo = new THREE.SphereGeometry(12000, 32, 24);

    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec3 point = normalize(vWorldPosition);
        float h = max(0.0, point.y);

        // Rich Rayleigh Scattering: Royal Cobalt Zenith -> Warm Pearl Horizon Haze
        vec3 zenithColor = vec3(0.07, 0.32, 0.62);
        vec3 midColor    = vec3(0.42, 0.68, 0.88);
        vec3 horizonColor= vec3(0.78, 0.88, 0.96);
        vec3 sunGlow     = vec3(1.0, 0.94, 0.82);

        vec3 skyColor = mix(horizonColor, midColor, smoothstep(0.0, 0.35, h));
        skyColor = mix(skyColor, zenithColor, smoothstep(0.35, 1.0, h));

        // Sun disk and atmospheric glare
        vec3 sunDir = normalize(vec3(0.55, 0.72, 0.38));
        float sunDot = max(0.0, dot(point, sunDir));
        skyColor += sunGlow * pow(sunDot, 180.0) * 1.8;
        skyColor += sunGlow * pow(sunDot, 16.0) * 0.28;

        gl_FragColor = vec4(skyColor, 1.0);
      }
    `;

    const skyMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const skyDome = new THREE.Mesh(domeGeo, skyMat);
    this.scene.add(skyDome);
  }

  buildClouds() {
    this.cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.02,
      transparent: true,
      opacity: 0.88,
    });

    // Scatter 45 natural cumulus cloud formations floating between 1500m and 2400m altitude
    for (let c = 0; c < 45; c++) {
      const cx = (Math.random() - 0.5) * 12000;
      const cy = 1500 + Math.random() * 900;
      const cz = (Math.random() - 0.5) * 12000;

      const cluster = new THREE.Group();
      cluster.position.set(cx, cy, cz);
      const puffCount = 5 + Math.floor(Math.random() * 4);

      for (let p = 0; p < puffCount; p++) {
        const radius = 95 + Math.random() * 115;
        const puffGeo = new THREE.SphereGeometry(radius, 12, 10);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 65,
          (Math.random() - 0.5) * 200
        );
        puff.scale.y = 0.52; // Natural flattened base
        cluster.add(puff);
      }

      this.cloudsGroup.add(cluster);
    }

    this.scene.add(this.cloudsGroup);
  }

  update(dt, playerPosition) {
    if (this.cloudsGroup) {
      for (const cloud of this.cloudsGroup.children) {
        cloud.position.x += 14 * dt;
        if (cloud.position.x > 7000) cloud.position.x = -7000;
      }
    }
  }
}
