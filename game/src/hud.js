// AeroStrike X-35 Valkyrie - Tactical Glass Cockpit Avionics & Combat HUD Overlay
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
    const hudGold = '#ffd700';
    const hudAmber = '#ffb700';
    const hudRed = '#ff3344';

    ctx.save();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = hudGreen;
    ctx.fillStyle = hudGreen;
    ctx.font = '12px "SFMono-Regular", Consolas, monospace';

    // ==========================================
    // TOP TACTICAL MISSION STATUS BANNER
    // ==========================================
    ctx.save();
    // Glass banner background
    ctx.fillStyle = 'rgba(10, 15, 25, 0.65)';
    ctx.fillRect(cx - 360, 16, 720, 48);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 360, 16, 720, 48);

    // Header left: Mission title
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = hudCyan;
    ctx.fillText('SORTIE: NORDIC GOLDEN SLALOM', cx - 340, 36);
    ctx.font = '10px "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ACTIVE FLIGHT PLAN · ARCHIPELAGO SECTOR 04', cx - 340, 52);

    // Header center: Rings Cleared Badge
    const nextRing = missionManager.getNextRing();
    const currentRingIdx = missionManager.currentRingIndex;
    const totalRings = missionManager.rings.length || 8;

    ctx.textAlign = 'center';
    ctx.font = 'bold 13px "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = hudGold;
    ctx.fillText(`RINGS: [ ${currentRingIdx} / ${totalRings} ]`, cx, 36);
    ctx.font = '10px "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = '#34d399';
    ctx.fillText(nextRing ? `NEXT: ${nextRing.name.toUpperCase()}` : 'ALL RINGS CLEARED', cx, 52);

    // Header right: Score & Time
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = hudGreen;
    ctx.fillText(`SCORE: ${missionManager.score.toLocaleString()} PTS`, cx + 340, 36);
    const elapsedSec = Math.floor(missionManager.elapsedTime);
    const mStr = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
    const sStr = String(elapsedSec % 60).padStart(2, '0');
    ctx.font = '10px "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`TIMER: ${mStr}:${sStr} · THREAT: NONE`, cx + 340, 52);
    ctx.restore();

    // ==========================================
    // 1. Center Waterline / Boresight Crosshair
    // ==========================================
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy);
    ctx.lineTo(cx - 8, cy);
    ctx.lineTo(cx - 8, cy);
    ctx.lineTo(cx, cy - 6);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx + 24, cy);
    ctx.stroke();

    // ==========================================
    // 2. Rotating Artificial Horizon & Pitch Ladder
    // ==========================================
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rollRad);

    const pixelsPerDegree = 8.5;

    // Artificial Horizon Line
    const horizonOffset = pitchDeg * pixelsPerDegree;
    ctx.beginPath();
    ctx.lineWidth = 2.0;
    ctx.moveTo(-160, horizonOffset);
    ctx.lineTo(-40, horizonOffset);
    ctx.moveTo(40, horizonOffset);
    ctx.lineTo(160, horizonOffset);
    ctx.stroke();

    // Bank angle sky pointer triangle
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
      if (Math.abs(rungY) > 240) continue;

      const isPositive = deg > 0;
      const halfWidth = isPositive ? 45 : 35;

      ctx.beginPath();
      if (!isPositive) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.moveTo(-halfWidth, rungY);
      ctx.lineTo(-20, rungY);
      ctx.lineTo(-20, rungY + (isPositive ? 6 : -6));

      ctx.moveTo(20, rungY);
      ctx.lineTo(halfWidth, rungY);
      ctx.lineTo(halfWidth, rungY + (isPositive ? 6 : -6));
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.abs(deg)), -halfWidth - 6, rungY + 4);
      ctx.textAlign = 'left';
      ctx.fillText(String(Math.abs(deg)), halfWidth + 6, rungY + 4);
    }
    ctx.restore();

    // ==========================================
    // 3. Flight Path Marker (Velocity Vector)
    // ==========================================
    if (physics.airspeed > 15) {
      const velDir = physics.velocity.clone().normalize();
      const lookAt = camera.position.clone().add(velDir.clone().multiplyScalar(100));
      const projected = lookAt.project(camera);

      const fpmX = (projected.x * 0.5 + 0.5) * this.width;
      const fpmY = (-(projected.y * 0.5) + 0.5) * this.height;

      if (fpmX > 40 && fpmX < this.width - 40 && fpmY > 40 && fpmY < this.height - 40) {
        ctx.save();
        ctx.strokeStyle = hudCyan;
        ctx.lineWidth = 2.0;

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

    // ==========================================
    // 4. Airspeed Tape (Left side, in Knots)
    // ==========================================
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

    // ==========================================
    // 5. Altitude Tape (Right side, in Feet MSL)
    // ==========================================
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

    // ==========================================
    // 6. Heading Compass Tape (Top)
    // ==========================================
    const compassY = cy - 180;
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

    // ==========================================
    // 7. G-Meter, AoA, Mach
    // ==========================================
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = physics.gForce > 6.0 ? hudRed : hudGreen;
    ctx.fillText(`G: ${physics.gForce.toFixed(1)}`, cx - 235, cy + 175);
    ctx.fillText(`AoA: ${physics.aoaDeg.toFixed(1)}°`, cx - 235, cy + 195);
    ctx.fillText(`MACH: ${physics.mach.toFixed(2)}`, cx - 235, cy + 215);

    // ==========================================
    // 8. Systems Status Box (Bottom Right)
    // ==========================================
    ctx.save();
    ctx.fillStyle = 'rgba(10, 15, 25, 0.65)';
    ctx.fillRect(cx + 170, cy + 155, 150, 75);
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.3)';
    ctx.strokeRect(cx + 170, cy + 155, 150, 75);

    ctx.font = '10px "SFMono-Regular", Consolas, monospace';
    ctx.fillStyle = physics.gear ? hudAmber : hudGreen;
    ctx.fillText(`GEAR:    ${physics.gear ? 'DOWN / LOCKED' : 'UP / RETRACTED'}`, cx + 180, cy + 175);
    ctx.fillStyle = physics.flaps ? hudAmber : hudGreen;
    ctx.fillText(`FLAPS:   ${physics.flaps ? 'FULL 30°' : 'CLEAN / 0°'}`, cx + 180, cy + 193);
    ctx.fillStyle = physics.afterburner ? hudGold : hudGreen;
    ctx.fillText(`ENGINE:  ${physics.afterburner ? 'STAGE 2 BURNER' : 'MIL POWER'}`, cx + 180, cy + 211);
    ctx.restore();

    // ==========================================
    // 9. Radar Waypoint Diamond Bug
    // ==========================================
    if (nextRing) {
      const ringPos = nextRing.position.clone();
      const projected = ringPos.project(camera);
      if (projected.z < 1.0) {
        const ringX = (projected.x * 0.5 + 0.5) * this.width;
        const ringY = (-(projected.y * 0.5) + 0.5) * this.height;

        ctx.save();
        ctx.strokeStyle = hudGold;
        ctx.lineWidth = 2.5;

        // Waypoint Diamond with Inner Target Dot
        ctx.beginPath();
        ctx.moveTo(ringX, ringY - 16);
        ctx.lineTo(ringX + 16, ringY);
        ctx.lineTo(ringX, ringY + 16);
        ctx.lineTo(ringX - 16, ringY);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ringX, ringY, 3, 0, Math.PI * 2);
        ctx.fillStyle = hudGold;
        ctx.fill();

        const distM = Math.round(physics.position.distanceTo(ringPos));
        ctx.fillStyle = hudGold;
        ctx.textAlign = 'center';
        ctx.font = 'bold 11px "SFMono-Regular", Consolas, monospace';
        ctx.fillText(`${distM}m`, ringX, ringY + 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px "SFMono-Regular", Consolas, monospace';
        ctx.fillText(nextRing.name.toUpperCase(), ringX, ringY + 42);
        ctx.restore();
      }
    }

    ctx.restore();
  }
}
