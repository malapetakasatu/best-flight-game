// AeroStrike X-35 Valkyrie - Tactical Glass Cockpit Avionics & HUD Overlay
/* global THREE */

export class FighterHUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  draw(physics, camera, missionManager, isCockpit) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    // Aircraft Euler Angles from Quaternion
    const euler = new THREE.Euler().setFromQuaternion(physics.quaternion, 'YXZ');
    const pitchDeg = (euler.x * 180) / Math.PI;
    const rollRad = euler.z;
    const yawDeg = ((euler.y * 180) / Math.PI + 360) % 360;

    // Tactical HUD Colors
    const hudGreen = '#00ff66';
    const hudCyan = '#00e5ff';
    const hudAmber = '#ffb700';
    const hudRed = '#ff3344';

    ctx.save();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = hudGreen;
    ctx.fillStyle = hudGreen;
    ctx.font = '12px "SFMono-Regular", Consolas, monospace';

    // 1. Center Waterline / Boresight Crosshair
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy);
    ctx.lineTo(cx - 8, cy);
    ctx.lineTo(cx, cy - 6);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx + 24, cy);
    ctx.stroke();

    // 2. Rotating Artificial Horizon & Pitch Ladder
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rollRad);

    const pixelsPerDegree = 8.5;

    // Artificial Horizon Line & Roll Pointer Arc
    const horizonOffset = pitchDeg * pixelsPerDegree;
    ctx.beginPath();
    ctx.lineWidth = 2.0;
    ctx.moveTo(-160, horizonOffset);
    ctx.lineTo(-40, horizonOffset);
    ctx.moveTo(40, horizonOffset);
    ctx.lineTo(160, horizonOffset);
    ctx.stroke();

    // Bank angle sky pointer triangle at horizon center
    ctx.beginPath();
    ctx.moveTo(0, horizonOffset - 8);
    ctx.lineTo(-6, horizonOffset);
    ctx.lineTo(6, horizonOffset);
    ctx.closePath();
    ctx.fillStyle = hudGreen;
    ctx.fill();

    // Pitch Ladder Rungs (-80 to +80 in 10-degree increments)
    ctx.lineWidth = 1.4;
    for (let deg = -80; deg <= 80; deg += 10) {
      if (deg === 0) continue;
      const rungY = (pitchDeg - deg) * pixelsPerDegree;
      if (Math.abs(rungY) > 240) continue; // Clip off-screen rungs

      const isPositive = deg > 0;
      const halfWidth = isPositive ? 45 : 35;

      ctx.beginPath();
      if (!isPositive) {
        ctx.setLineDash([4, 4]); // Dashed for negative pitch (dive)
      } else {
        ctx.setLineDash([]); // Solid for positive pitch (climb)
      }

      // Left rung with vertical tab
      ctx.moveTo(-halfWidth, rungY);
      ctx.lineTo(-20, rungY);
      ctx.lineTo(-20, rungY + (isPositive ? 6 : -6));

      // Right rung with vertical tab
      ctx.moveTo(20, rungY);
      ctx.lineTo(halfWidth, rungY);
      ctx.lineTo(halfWidth, rungY + (isPositive ? 6 : -6));
      ctx.stroke();

      // Pitch angle numerical labels
      ctx.setLineDash([]);
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.abs(deg)), -halfWidth - 6, rungY + 4);
      ctx.textAlign = 'left';
      ctx.fillText(String(Math.abs(deg)), halfWidth + 6, rungY + 4);
    }
    ctx.restore();

    // 3. Flight Path Marker (Velocity Vector)
    if (physics.airspeed > 15) {
      // Project velocity vector onto screen plane
      const velDir = physics.velocity.clone().normalize();
      const lookAt = camera.position.clone().add(velDir.clone().multiplyScalar(100));
      const projected = lookAt.project(camera);

      const fpmX = (projected.x * 0.5 + 0.5) * this.width;
      const fpmY = (-(projected.y * 0.5) + 0.5) * this.height;

      // Only draw if inside screen bounds
      if (fpmX > 40 && fpmX < this.width - 40 && fpmY > 40 && fpmY < this.height - 40) {
        ctx.save();
        ctx.strokeStyle = hudCyan;
        ctx.lineWidth = 2.0;

        // FPM Circle with horizontal wings and top fin
        ctx.beginPath();
        ctx.arc(fpmX, fpmY, 8, 0, Math.PI * 2);
        ctx.moveTo(fpmX - 8, fpmY);
        ctx.lineTo(fpmX - 20, fpmY);
        ctx.moveTo(fpmX + 8, fpmY);
        ctx.lineTo(fpmX + 20, fpmY);
        ctx.moveTo(fpmX, fpmY - 8);
        ctx.lineTo(fpmX, fpmY - 18);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4. Airspeed Tape (Left side, in Knots)
    const speedKts = Math.round(physics.airspeed * 1.94384);
    const tapeLeft = cx - 240;
    ctx.beginPath();
    ctx.moveTo(tapeLeft, cy - 140);
    ctx.lineTo(tapeLeft, cy + 140);
    ctx.stroke();

    for (let k = Math.floor(speedKts / 20) * 20 - 60; k <= speedKts + 60; k += 20) {
      if (k < 0) continue;
      const tickY = cy + (speedKts - k) * 2.2;
      if (tickY < cy - 140 || tickY > cy + 140) continue;

      ctx.beginPath();
      ctx.moveTo(tapeLeft, tickY);
      ctx.lineTo(tapeLeft - (k % 40 === 0 ? 12 : 6), tickY);
      ctx.stroke();

      if (k % 40 === 0) {
        ctx.textAlign = 'right';
        ctx.fillText(String(k), tapeLeft - 16, tickY + 4);
      }
    }

    // Current Airspeed Box
    ctx.strokeStyle = hudGreen;
    ctx.strokeRect(tapeLeft - 60, cy - 14, 55, 26);
    ctx.fillStyle = hudGreen;
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px "SFMono-Regular", Consolas, monospace';
    ctx.fillText(String(speedKts), tapeLeft - 32, cy + 4);

    // 5. Altitude Tape (Right side, in Feet MSL)
    const altFt = Math.round(physics.altitude * 3.28084);
    const tapeRight = cx + 240;
    ctx.beginPath();
    ctx.moveTo(tapeRight, cy - 140);
    ctx.lineTo(tapeRight, cy + 140);
    ctx.stroke();

    for (let a = Math.floor(altFt / 200) * 200 - 600; a <= altFt + 600; a += 200) {
      if (a < 0) continue;
      const tickY = cy + (altFt - a) * 0.22;
      if (tickY < cy - 140 || tickY > cy + 140) continue;

      ctx.beginPath();
      ctx.moveTo(tapeRight, tickY);
      ctx.lineTo(tapeRight + (a % 400 === 0 ? 12 : 6), tickY);
      ctx.stroke();

      if (a % 400 === 0) {
        ctx.textAlign = 'left';
        ctx.fillText(String(a), tapeRight + 16, tickY + 4);
      }
    }

    // Current Altitude Box
    ctx.strokeRect(tapeRight + 5, cy - 14, 65, 26);
    ctx.textAlign = 'center';
    ctx.fillText(String(altFt), tapeRight + 37, cy + 4);

    // 6. Heading Compass Tape (Top, 000° to 359°)
    const compassY = cy - 200;
    ctx.beginPath();
    ctx.moveTo(cx - 180, compassY);
    ctx.lineTo(cx + 180, compassY);
    ctx.stroke();

    const heading = Math.round(yawDeg);
    for (let h = heading - 30; h <= heading + 30; h += 5) {
      const normH = ((h % 360) + 360) % 360;
      const tickX = cx + (h - heading) * 6.0;
      if (tickX < cx - 180 || tickX > cx + 180) continue;

      ctx.beginPath();
      ctx.moveTo(tickX, compassY);
      ctx.lineTo(tickX, compassY - (normH % 10 === 0 ? 10 : 5));
      ctx.stroke();

      if (normH % 10 === 0) {
        let label = String(normH / 10).padStart(2, '0');
        if (normH === 0) label = 'N';
        else if (normH === 90) label = 'E';
        else if (normH === 180) label = 'S';
        else if (normH === 270) label = 'W';

        ctx.textAlign = 'center';
        ctx.fillText(label, tickX, compassY - 14);
      }
    }

    // Heading Pointer
    ctx.beginPath();
    ctx.moveTo(cx, compassY + 8);
    ctx.lineTo(cx - 5, compassY + 2);
    ctx.lineTo(cx + 5, compassY + 2);
    ctx.closePath();
    ctx.fill();

    // 7. G-Meter & G-Load Warning
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = physics.gForce > 6.0 ? hudRed : hudGreen;
    ctx.fillText(`G: ${physics.gForce.toFixed(1)}`, cx - 235, cy + 175);
    ctx.fillText(`AoA: ${physics.aoaDeg.toFixed(1)}°`, cx - 235, cy + 195);
    ctx.fillText(`MACH: ${physics.mach.toFixed(2)}`, cx - 235, cy + 215);

    // 8. Radar Waypoint Diamond Bug (Project next mission ring)
    const nextRing = missionManager.getNextRing();
    if (nextRing) {
      const ringPos = nextRing.position.clone();
      const projected = ringPos.project(camera);
      if (projected.z < 1.0) {
        const ringX = (projected.x * 0.5 + 0.5) * this.width;
        const ringY = (-(projected.y * 0.5) + 0.5) * this.height;

        ctx.save();
        ctx.strokeStyle = hudAmber;
        ctx.lineWidth = 2.0;

        // Waypoint Diamond
        ctx.beginPath();
        ctx.moveTo(ringX, ringY - 14);
        ctx.lineTo(ringX + 14, ringY);
        ctx.lineTo(ringX, ringY + 14);
        ctx.lineTo(ringX - 14, ringY);
        ctx.closePath();
        ctx.stroke();

        const distM = Math.round(physics.position.distanceTo(ringPos));
        ctx.fillStyle = hudAmber;
        ctx.textAlign = 'center';
        ctx.fillText(`${distM}m`, ringX, ringY + 28);
        ctx.restore();
      }
    }

    // 9. Stall Warning Alert
    if (physics.isStalling) {
      ctx.save();
      ctx.fillStyle = hudRed;
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px "SFMono-Regular", Consolas, monospace';
      ctx.fillText('STALL WARNING', cx, cy - 80);
      ctx.restore();
    }

    ctx.restore();
  }
}
