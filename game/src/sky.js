// AeroStrike X-35 Valkyrie - Cinematic Atmospheric Sky, Lighting & Volumetric Clouds
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
    // 1. Warm Golden Sunlight (Key Light casting rich golden highlights and sharp relief shadows)
    this.sunLight = new THREE.DirectionalLight(0xffe8ba, 2.35);
    this.sunLight.position.set(2800, 2600, 1800);
    this.scene.add(this.sunLight);

    // 2. Crisp Atmospheric Skylight & Earth Ground Bounce (balanced to preserve mountain shadow contrast)
    this.ambientLight = new THREE.HemisphereLight(0x7ea8d9, 0x3d4f3b, 0.42);
    this.scene.add(this.ambientLight);

    // 3. Cool Ambient Fill Light (ensures shadowed canyon walls retain clear rock detail)
    this.fillLight = new THREE.DirectionalLight(0x94b4d6, 0.45);
    this.fillLight.position.set(-2200, 1200, -1800);
    this.scene.add(this.fillLight);

    // 4. Soft Atmospheric Distance Haze (Golden Amber Horizon Tone)
    this.scene.fog = new THREE.FogExp2(0xc4a382, 0.000085);
  }

  buildSkyDome() {
    // Atmospheric Sky Gradient Dome with Rayleigh Scattering & Golden Hour Horizon
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

        // Rich Rayleigh & Mie Scattering: Deep Cobalt Zenith -> Warm Azure -> Radiant Golden Sunset Horizon
        vec3 zenithColor  = vec3(0.05, 0.18, 0.48);
        vec3 midSkyColor  = vec3(0.25, 0.52, 0.78);
        vec3 warmBandColor= vec3(0.92, 0.68, 0.45);
        vec3 horizonColor = vec3(0.98, 0.82, 0.62);
        vec3 sunGlare     = vec3(1.0, 0.92, 0.75);

        vec3 skyColor = mix(horizonColor, warmBandColor, smoothstep(0.0, 0.12, h));
        skyColor = mix(skyColor, midSkyColor, smoothstep(0.12, 0.45, h));
        skyColor = mix(skyColor, zenithColor, smoothstep(0.45, 1.0, h));

        // Sun disk and intense atmospheric forward-scatter glare
        vec3 sunDir = normalize(vec3(0.68, 0.58, 0.44));
        float sunDot = max(0.0, dot(point, sunDir));
        skyColor += sunGlare * pow(sunDot, 240.0) * 2.2;
        skyColor += sunGlare * pow(sunDot, 18.0) * 0.42;

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
      color: 0xfffcf5,
      roughness: 0.88,
      metalness: 0.02,
      transparent: true,
      opacity: 0.88,
    });

    // Scatter 48 fluffy cumulus cloud formations floating between 1400m and 2200m altitude
    for (let c = 0; c < 48; c++) {
      const cx = (Math.random() - 0.5) * 12000;
      const cy = 1400 + Math.random() * 850;
      const cz = (Math.random() - 0.5) * 12000;

      const cluster = new THREE.Group();
      const puffCount = 5 + Math.floor(Math.random() * 6);
      
      for (let p = 0; p < puffCount; p++) {
        const pr = 120 + Math.random() * 110;
        const puffGeo = new THREE.SphereGeometry(pr, 10, 8);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 260,
          (Math.random() - 0.5) * 65,
          (Math.random() - 0.5) * 260
        );
        puff.scale.set(1.4, 0.65, 1.1);
        cluster.add(puff);
      }

      cluster.position.set(cx, cy, cz);
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
