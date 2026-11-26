// AeroStrike X-35 Valkyrie - Atmospheric Sky, Volumetric Clouds & Lighting
/* global THREE */

export class AtmosphericSky {
  constructor(scene) {
    this.scene = scene;
    this.sunLight = null;
    this.ambientLight = null;
    this.cloudsGroup = null;
    
    this.setupLighting();
    this.buildSkyDome();
    this.buildClouds();
  }

  setupLighting() {
    // 1. Warm Directional Sunlight
    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    this.sunLight.position.set(4000, 5000, -3000);
    this.scene.add(this.sunLight);

    // 2. Soft Ambient Skylight
    this.ambientLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 0.75);
    this.scene.add(this.ambientLight);

    // 3. Atmospheric Distance Fog
    this.scene.fog = new THREE.FogExp2(0xa5c9e1, 0.00014);
  }

  buildSkyDome() {
    // Atmospheric Sky Gradient Dome
    const domeGeo = new THREE.SphereGeometry(9000, 32, 24);
    
    // Custom Shader for Rayleigh Atmospheric Scattering
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
        float h = point.y;
        
        // Colors: Zenith Deep Azure, Horizon Golden Haze, Ground Mist
        vec3 zenithColor = vec3(0.04, 0.22, 0.48);
        vec3 horizonColor = vec3(0.72, 0.84, 0.94);
        vec3 sunGlow = vec3(1.0, 0.92, 0.75);
        
        vec3 skyColor = mix(horizonColor, zenithColor, max(0.0, pow(h, 0.65)));
        
        // Sun glare disk
        vec3 sunDir = normalize(vec3(0.6, 0.7, -0.45));
        float sunDot = max(0.0, dot(point, sunDir));
        skyColor += sunGlow * pow(sunDot, 128.0) * 1.5;
        skyColor += sunGlow * pow(sunDot, 16.0) * 0.35;
        
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
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
    });

    // Scatter 40 natural cumulus cloud clusters floating between 1400m and 2200m altitude
    for (let c = 0; c < 40; c++) {
      const cx = (Math.random() - 0.5) * 11000;
      const cy = 1400 + Math.random() * 800;
      const cz = (Math.random() - 0.5) * 11000;

      // Group of 4-6 intersecting spheres per cloud
      const cluster = new THREE.Group();
      cluster.position.set(cx, cy, cz);
      const puffCount = 5 + Math.floor(Math.random() * 4);

      for (let p = 0; p < puffCount; p++) {
        const radius = 90 + Math.random() * 110;
        const puffGeo = new THREE.SphereGeometry(radius, 12, 10);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 180,
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 180
        );
        puff.scale.y = 0.55; // Flattened base
        cluster.add(puff);
      }

      this.cloudsGroup.add(cluster);
    }

    this.scene.add(this.cloudsGroup);
  }

  update(dt, playerPosition) {
    // Slowly drift clouds across the theater
    if (this.cloudsGroup) {
      for (const cloud of this.cloudsGroup.children) {
        cloud.position.x += 12 * dt;
        if (cloud.position.x > 6000) cloud.position.x = -6000;
      }
    }
  }
}
