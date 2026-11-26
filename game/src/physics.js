// AeroStrike X-35 Valkyrie - 6-DOF Aerodynamic Flight Dynamics Model
import { AIRCRAFT, WORLD } from './config.js';

/* global THREE */

export class FlightPhysics {
  constructor() {
    this.position = new THREE.Vector3(0, 500, 0);
    this.velocity = new THREE.Vector3(0, 0, -180);
    this.quaternion = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3(0, 0, 0); // pitch, yaw, roll rates
    
    // Pilot Control Inputs
    this.elevator = 0;     // -1 (pitch down) to +1 (pitch up)
    this.aileron = 0;      // -1 (roll left) to +1 (roll right)
    this.rudder = 0;       // -1 (yaw left) to +1 (yaw right)
    this.throttle = 0.65;  // 0.0 to 1.0
    this.afterburner = false;
    this.flaps = false;
    this.gear = false;
    this.airbrake = false;
    
    // Status & Telemetry Readouts
    this.airspeed = 180;   // m/s
    this.mach = 0.53;
    this.altitude = 500;   // meters MSL
    this.agl = 500;        // meters AGL
    this.gForce = 1.0;     // Gs
    this.aoaDeg = 2.0;     // Angle of attack (degrees)
    this.sideslipDeg = 0.0;// Sideslip angle (degrees)
    this.isStalling = false;
    this.fuelKg = AIRCRAFT.fuelMaxKg;
    this.fuelPercent = 100.0;
    this.isLanded = false;
    this.isCrashed = false;
    this.maxGRecorded = 1.0;
  }

  reset(startPos, startHeadingDeg, startSpeed) {
    this.position.set(startPos.x, startPos.y, startPos.z);
    const headingRad = (startHeadingDeg * Math.PI) / 180;
    this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -headingRad);
    
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    this.velocity.copy(forward).multiplyScalar(startSpeed);
    this.angularVelocity.set(0, 0, 0);
    
    this.elevator = 0;
    this.aileron = 0;
    this.rudder = 0;
    this.throttle = 0.70;
    this.afterburner = false;
    this.flaps = false;
    this.gear = false;
    this.airbrake = false;
    this.fuelKg = AIRCRAFT.fuelMaxKg;
    this.isLanded = false;
    this.isCrashed = false;
    this.maxGRecorded = 1.0;
  }

  update(dt, terrainHeightAt) {
    if (this.isCrashed) return;

    // 1. Local Axes in World Coordinates
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.quaternion);

    // 2. Airspeed & Altitude Telemetry
    this.airspeed = this.velocity.length();
    this.altitude = Math.max(0, this.position.y);
    const groundAlt = terrainHeightAt(this.position.x, this.position.z);
    this.agl = Math.max(0, this.position.y - groundAlt);

    // Barometric air density lapse: rho = rho0 * exp(-h / H)
    const rho = WORLD.airDensitySeaLevel * Math.exp(-this.altitude / WORLD.airDensityScaleHeight);
    // Speed of sound at altitude (~340 m/s at sea level)
    const speedOfSound = 340.0 * Math.sqrt(Math.max(0.6, 1.0 - (0.0065 * this.altitude) / 288.15));
    this.mach = this.airspeed / speedOfSound;

    // Dynamic pressure q = 0.5 * rho * v^2
    const q = 0.5 * rho * (this.airspeed * this.airspeed);

    // 3. Angle of Attack (AoA) and Sideslip (Beta)
    let aoaRad = 0;
    let betaRad = 0;
    if (this.airspeed > 5.0) {
      const velLocal = this.velocity.clone().applyQuaternion(this.quaternion.clone().invert());
      // Local -Z is forward, +Y is up, +X is right
      aoaRad = Math.atan2(-velLocal.y, -velLocal.z);
      betaRad = Math.atan2(velLocal.x, -velLocal.z);
    }
    this.aoaDeg = (aoaRad * 180) / Math.PI;
    this.sideslipDeg = (betaRad * 180) / Math.PI;

    // 4. Aerodynamic Lift & Stall
    let cl = AIRCRAFT.cl0 + AIRCRAFT.clAlpha * aoaRad;
    if (this.flaps) cl += 0.35; // Flaps increase lift coefficient

    const stallAngleRad = (AIRCRAFT.stallAngleDeg * Math.PI) / 180;
    if (Math.abs(aoaRad) > stallAngleRad) {
      this.isStalling = true;
      // Post-stall lift decay & buffeting
      const excess = Math.abs(aoaRad) - stallAngleRad;
      cl = Math.sign(aoaRad) * Math.max(0.3, AIRCRAFT.clMax - excess * 2.8);
    } else {
      this.isStalling = false;
      cl = Math.max(-1.0, Math.min(AIRCRAFT.clMax, cl));
    }

    const liftMag = q * AIRCRAFT.wingArea * cl;
    // Lift acts perpendicular to velocity, in plane of aircraft's up vector
    const liftDir = up.clone();
    const liftForce = liftDir.multiplyScalar(liftMag);

    // 5. Aerodynamic Drag
    let cd = AIRCRAFT.cd0 + AIRCRAFT.inducedDragK * (cl * cl);
    if (this.gear) cd += AIRCRAFT.cdGear;
    if (this.flaps) cd += AIRCRAFT.cdFlaps;
    if (this.airbrake) cd += AIRCRAFT.cdAirbrake;
    // Transonic drag rise (wave drag near Mach 0.9 - 1.2)
    if (this.mach > 0.88 && this.mach < 1.3) {
      const waveFactor = 1.0 - Math.abs(this.mach - 1.05) / 0.25;
      cd += Math.max(0, waveFactor) * 0.045;
    }

    const dragMag = q * AIRCRAFT.wingArea * cd;
    const dragDir = this.velocity.clone().normalize().negate();
    const dragForce = dragDir.multiplyScalar(dragMag);

    // 6. Engine Propulsion Thrust & Fuel Burn
    let currentThrust = 0;
    if (this.fuelKg > 0) {
      const burnRate = this.afterburner ? AIRCRAFT.fuelRateAB : AIRCRAFT.fuelRateMil;
      this.fuelKg = Math.max(0, this.fuelKg - burnRate * this.throttle * dt);
      this.fuelPercent = (this.fuelKg / AIRCRAFT.fuelMaxKg) * 100.0;

      const baseMax = this.afterburner ? AIRCRAFT.maxThrustAB : AIRCRAFT.maxThrustMil;
      currentThrust = this.throttle * baseMax;
    } else {
      this.throttle = 0;
      this.afterburner = false;
    }
    const thrustForce = forward.clone().multiplyScalar(currentThrust);

    // 7. Gravity Force
    const gravityForce = new THREE.Vector3(0, -WORLD.gravity * AIRCRAFT.mass, 0);

    // 8. Total Force & Linear Acceleration
    const totalForce = new THREE.Vector3()
      .add(liftForce)
      .add(dragForce)
      .add(thrustForce)
      .add(gravityForce);

    const accel = totalForce.clone().divideScalar(AIRCRAFT.mass);
    this.velocity.addScaledVector(accel, dt);
    this.position.addScaledVector(this.velocity, dt);

    // G-Force readout (normal load factor = Lift / Weight)
    this.gForce = liftMag / (AIRCRAFT.mass * WORLD.gravity);
    if (Math.abs(this.gForce) > this.maxGRecorded) {
      this.maxGRecorded = Math.abs(this.gForce);
    }

    // 9. Angular Moments & Rotational Integration
    // Control surface authority scales with dynamic pressure
    const controlDynamicFactor = Math.min(1.4, Math.max(0.15, q / 12000.0));
    
    const targetPitchRate = this.elevator * AIRCRAFT.pitchRateMax * controlDynamicFactor;
    const targetRollRate = this.aileron * AIRCRAFT.rollRateMax * controlDynamicFactor;
    const targetYawRate = this.rudder * AIRCRAFT.yawRateMax * controlDynamicFactor;

    // Aerodynamic damping
    this.angularVelocity.x = THREE.MathUtils.lerp(this.angularVelocity.x, targetPitchRate, 10.0 * dt);
    this.angularVelocity.y = THREE.MathUtils.lerp(this.angularVelocity.y, targetYawRate, 8.0 * dt);
    this.angularVelocity.z = THREE.MathUtils.lerp(this.angularVelocity.z, targetRollRate, 14.0 * dt);

    // Apply stall buffeting to attitude
    if (this.isStalling) {
      this.angularVelocity.x += (Math.random() - 0.5) * 0.4;
      this.angularVelocity.z += (Math.random() - 0.5) * 0.6;
    }

    // Integrate quaternion by angular velocity (body frame)
    const rotDelta = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        this.angularVelocity.x * dt,
        this.angularVelocity.y * dt,
        this.angularVelocity.z * dt,
        'YXZ'
      )
    );
    this.quaternion.multiply(rotDelta).normalize();

    // 10. Ground Collision & Landing Detection
    if (this.position.y <= groundAlt + 2.5) {
      // Touchdown or Crash
      const verticalSpeed = Math.abs(this.velocity.y);
      const isRunway = Math.abs(this.position.x) < 1800 && Math.abs(this.position.z) < 120 && groundAlt < 5;

      if (this.gear && verticalSpeed < 6.5 && this.airspeed < 130 && isRunway) {
        // Safe Landing Touchdown
        this.position.y = groundAlt + 2.5;
        this.velocity.y = 0;
        this.velocity.multiplyScalar(0.96); // Ground friction & wheel braking
        this.isLanded = true;
      } else {
        // High speed or gear-up impact -> Crash
        this.isCrashed = true;
        this.velocity.set(0, 0, 0);
      }
    }
  }
}
