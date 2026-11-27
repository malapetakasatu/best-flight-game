// AeroStrike X-35 Valkyrie - Tactical Glass Cockpit Avionics & Collimated Military HUD
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

    // Tactical Collimated Green Phosphor Color Palette
    const hudGreen = '#00ff66';
    const hudBright = '#4ade80';
    const hudGold = '#fbbf24';
    const hudCyan = '#38bdf8';
    const hudAmber = '#f59e0b';
    const hudRed = '#ef4444';

    ctx.save();
    ctx.shadowColor = 'rgba(0, 255, 102, 0.45)';
    ctx.shadowBlur = 4;
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = hudGreen;
    ctx.fillStyle = hudGreen;
    ctx.font = 'bold 12px "SFMono-Regular", Consolas, monospace';

    // ==========================================
    // 1. CENTER WATERLINE BORESIGHT SYMBOL
    // ==========================================
    ctx.beginPath();
    // Inverted T / W crosshair
    ctx.moveTo(cx - 24, cy);
    ctx.lineTo(cx - 8, cy);
    ctx.lineTo(cx - 4, cy - 4);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + 4, cy - 4);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx + 24, cy);
    ctx.stroke();

    // ==========================================
    // 2. FLIGHT PATH VECTOR (FPV / VELOCITY VECTOR BIRD)
    // ==========================================
    const fpvX = cx + (physics.velocity.x || 0) * 0.18;
    const fpvY = cy - (physics.velocity.y || 0) * 0.22;
    ctx.beginPath();
    ctx.arc(fpvX, fpvY, 5.5, 0, Math.PI * 2);
    // FPV Wings
    ctx.moveTo(fpvX - 14, fpvY);
    ctx.lineTo(fpvX - 5.5, fpvY);
    ctx.moveTo(fpvX + 5.5, fpvY);
    ctx.lineTo(fpvX + 14, fpvY);
    // FPV Fin
    ctx.moveTo(fpvX, fpvY - 5.5);
    ctx.lineTo(fpvX, fpvY - 11);
    ctx.stroke();

    // ==========================================
    // 3. COLLIMATED PITCH LADDER & ARTIFICIAL HORIZON
    // ==========================================
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-rollRad);

    const pitchPxPerDeg = 8.5;
    const pitchOffset = pitchDeg * pitchPxPerDeg;

    // Horizon Line (Center Gap for Boresight)
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-160, pitchOffset);
    ctx.lineTo(-45, pitchOffset);
    ctx.moveTo(45, pitchOffset);
    ctx.lineTo(160, pitchOffset);
    ctx.stroke();
    ctx.lineWidth = 1.6;

    // Pitch Rungs (-30° to +30° in 5° steps)
    for (let p = -30; p <= 30; p += 5) {
      if (p === 0) continue;
      const y = pitchOffset - p * pitchPxPerDeg;
      if (Math.abs(y) > 220) continue;

      const isPositive = p > 0;
      const rungWidth = 60 + Math.abs(p) * 1.2;

      ctx.save();
      if (!isPositive) {
        ctx.setLineDash([5, 4]); // Dashed negative pitch ladder
      }

      ctx.beginPath();
      // Left Rung
      ctx.moveTo(-rungWidth, y);
      ctx.lineTo(-25, y);
      ctx.lineTo(-25, isPositive ? y + 7 : y - 7);
      // Right Rung
      ctx.moveTo(rungWidth, y);
      ctx.lineTo(25, y);
      ctx.lineTo(25, isPositive ? y + 7 : y - 7);
      ctx.stroke();
      ctx.restore();

      // Pitch Angle Labels
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.abs(p).toString(), -rungWidth - 4, y + 3);
      ctx.textAlign = 'left';
      ctx.fillText(Math.abs(p).toString(), rungWidth + 4, y + 3);
    }
    ctx.restore();

    // ==========================================
    // 4. AIRSPEED VERTICAL LADDER TAPE (LEFT)
    // ==========================================
    const tapeXLeft = cx - 240;
    const tapeYTop = cy - 140;
    const tapeHeight = 280;

    ctx.save();
    // Glass tape background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(tapeXLeft - 52, tapeYTop, 52, tapeHeight);
    ctx.strokeRect(tapeXLeft - 52, tapeYTop, 52, tapeHeight);

    // Speed Ticks
    const speedKnots = Math.round(physics.speed * 1.94384); // m/s to Knots
    const spdPxPerKt = 1.6;
    const speedMin = Math.floor((speedKnots - 60) / 10) * 10;
    const speedMax = Math.ceil((speedKnots + 60) / 10) * 10;

    for (let s = speedMin; s <= speedMax; s += 10) {
      const y = cy - (s - speedKnots) * spdPxPerKt;
      if (y < tapeYTop + 8 || y > tapeYTop + tapeHeight - 8) continue;

      const isMajor = s % 20 === 0;
      ctx.beginPath();
      ctx.moveTo(tapeXLeft - (isMajor ? 14 : 7), y);
      ctx.lineTo(tapeXLeft, y);
      ctx.stroke();

      if (isMajor) {
        ctx.textAlign = 'right';
        ctx.font = '10px monospace';
        ctx.fillText(s.toString(), tapeXLeft - 18, y + 3.5);
      }
    }

    // Boxed Current Airspeed Readout
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tapeXLeft - 60, cy - 13, 62, 26);
    ctx.strokeStyle = hudBright;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(tapeXLeft - 60, cy - 13, 62, 26);

    ctx.fillStyle = hudBright;
    ctx.textAlign = 'right';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(speedKnots.toString(), tapeXLeft - 8, cy + 5);

    // Speed Label & Mach
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = hudCyan;
    ctx.fillText('CAS KTS', tapeXLeft - 26, tapeYTop - 8);
    const mach = (speedKnots / 661.47).toFixed(2);
    ctx.fillText(`M ${mach}`, tapeXLeft - 26, tapeYTop + tapeHeight + 16);
    ctx.restore();

    // ==========================================
    // 5. BAROMETRIC & RADAR ALTITUDE TAPE (RIGHT)
    // ==========================================
    const tapeXRight = cx + 240;

    ctx.save();
    // Glass tape background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(tapeXRight, tapeYTop, 56, tapeHeight);
    ctx.strokeRect(tapeXRight, tapeYTop, 56, tapeHeight);

    const altFeet = Math.round(physics.position.y * 3.28084);
    const altPxPerFt = 0.28;
    const altMin = Math.floor((altFeet - 350) / 100) * 100;
    const altMax = Math.ceil((altFeet + 350) / 100) * 100;

    for (let a = altMin; a <= altMax; a += 50) {
      const y = cy - (a - altFeet) * altPxPerFt;
      if (y < tapeYTop + 8 || y > tapeYTop + tapeHeight - 8) continue;

      const isMajor = a % 100 === 0;
      ctx.beginPath();
      ctx.moveTo(tapeXRight, y);
      ctx.lineTo(tapeXRight + (isMajor ? 14 : 7), y);
      ctx.stroke();

      if (isMajor) {
        ctx.textAlign = 'left';
        ctx.font = '10px monospace';
        ctx.fillText(a.toString(), tapeXRight + 18, y + 3.5);
      }
    }

    // Boxed Current Altitude Readout
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tapeXRight - 2, cy - 13, 66, 26);
    ctx.strokeStyle = hudBright;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(tapeXRight - 2, cy - 13, 66, 26);

    ctx.fillStyle = hudBright;
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(altFeet.toString(), tapeXRight + 6, cy + 5);

    // Altitude Label & Radar Altitude
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = hudCyan;
    ctx.fillText('BARO FT', tapeXRight + 28, tapeYTop - 8);
    const rAlt = Math.max(0, altFeet - 15);
    ctx.fillText(`RALT ${rAlt}`, tapeXRight + 28, tapeYTop + tapeHeight + 16);
    ctx.restore();

    // ==========================================
    // 6. COMPASS HEADING RIBBON (TOP)
    // ==========================================
    const headingY = 64;
    const headingWidth = 340;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(cx - headingWidth / 2, headingY - 22, headingWidth, 34);
    ctx.strokeRect(cx - headingWidth / 2, headingY - 22, headingWidth, 34);

    const hdgPxPerDeg = 3.2;
    const hdgMin = Math.floor((yawDeg - 45) / 5) * 5;
    const hdgMax = Math.ceil((yawDeg + 45) / 5) * 5;

    for (let h = hdgMin; h <= hdgMax; h += 5) {
      const hNorm = (h % 360 + 360) % 360;
      const x = cx + (h - yawDeg) * hdgPxPerDeg;
      if (x < cx - headingWidth / 2 + 10 || x > cx + headingWidth / 2 - 10) continue;

      const isMajor = hNorm % 10 === 0;
      ctx.beginPath();
      ctx.moveTo(x, headingY - 14);
      ctx.lineTo(x, headingY - (isMajor ? 4 : 9));
      ctx.stroke();

      if (isMajor) {
        let label = (hNorm / 10).toString().padStart(2, '0');
        if (hNorm === 0) label = 'N';
        else if (hNorm === 90) label = 'E';
        else if (hNorm === 180) label = 'S';
        else if (hNorm === 270) label = 'W';

        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = (hNorm % 90 === 0) ? hudGold : hudGreen;
        ctx.fillText(label, x, headingY + 8);
      }
    }

    // Current Heading Lubber Box & Pointer
    ctx.beginPath();
    ctx.moveTo(cx - 5, headingY - 22);
    ctx.lineTo(cx + 5, headingY - 22);
    ctx.lineTo(cx, headingY - 16);
    ctx.closePath();
    ctx.fillStyle = hudGold;
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 26, headingY - 44, 52, 20);
    ctx.strokeStyle = hudGold;
    ctx.strokeRect(cx - 26, headingY - 44, 52, 20);

    ctx.fillStyle = hudGold;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(yawDeg).toString().padStart(3, '0')}°`, cx, headingY - 30);
    ctx.restore();

    // ==========================================
    // 7. WAYPOINT TARGET DIRECTOR & SLALOM RING DATA
    // ==========================================
    const nextRing = missionManager.getNextRing();
    if (nextRing) {
      ctx.save();
      const ringPos = nextRing.position;
      const distM = physics.position.distanceTo(ringPos);
      const distNM = (distM / 1852).toFixed(1);

      // Target Waypoint Diamond in World Space
      const ringScreen = ringPos.clone().project(camera);
      if (ringScreen.z < 1.0) {
        const sx = (ringScreen.x * 0.5 + 0.5) * this.width;
        const sy = (-ringScreen.y * 0.5 + 0.5) * this.height;

        ctx.strokeStyle = hudGold;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 14);
        ctx.lineTo(sx + 14, sy);
        ctx.lineTo(sx, sy + 14);
        ctx.lineTo(sx - 14, sy);
        ctx.closePath();
        ctx.stroke();

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = hudGold;
        ctx.textAlign = 'center';
        ctx.fillText(nextRing.name.toUpperCase(), sx, sy - 18);
        ctx.font = '10px monospace';
        ctx.fillStyle = hudCyan;
        ctx.fillText(`${distNM} NM`, sx, sy + 26);
      }
      ctx.restore();
    }

    // ==========================================
    // 8. TACTICAL FLIGHT TELEMETRY & WEAPON CUES (CORNERS)
    // ==========================================
    // Bottom-Left Avionics Status
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = hudBright;
    ctx.fillText(`G-FORCE : ${physics.gForce.toFixed(1)} G`, 36, this.height - 75);
    ctx.fillText(`THROTTLE: ${Math.round(physics.throttle * 100)}% ${physics.afterburner ? 'AB-MAX' : 'MIL'}`, 36, this.height - 56);
    ctx.fillStyle = hudCyan;
    ctx.fillText(`AOA     : 5.6°`, 36, this.height - 37);
    ctx.fillText(`MISSION : SORTIE 01 · SLALOM [${missionManager.currentRingIndex}/8]`, 36, this.height - 18);

    // Bottom-Right Stores & Systems Status
    ctx.textAlign = 'right';
    ctx.fillStyle = hudBright;
    ctx.fillText(`RADAR   : NAV / AIR-TO-GROUND`, this.width - 36, this.height - 75);
    ctx.fillText(`STORES  : 2x AIM-9X · 20MM VULCAN`, this.width - 36, this.height - 56);
    ctx.fillStyle = physics.gear ? hudAmber : hudBright;
    ctx.fillText(`GEAR    : ${physics.gear ? 'DOWN / LOCKED' : 'UP / SECURED'}`, this.width - 36, this.height - 37);
    ctx.fillStyle = hudGold;
    ctx.fillText(`SCORE   : ${missionManager.score.toLocaleString()} PTS`, this.width - 36, this.height - 18);
    ctx.restore();

    ctx.restore();
  }
}
