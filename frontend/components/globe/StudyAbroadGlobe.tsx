'use client';

import { useEffect, useRef } from 'react';

// ─── Origin ────────────────────────────────────────────────────────────────────
const DHAKA = { lat: 23.8103, lng: 90.4125 };

// ─── Destinations ──────────────────────────────────────────────────────────────
// speed is progress per frame (~60fps) — 0.004 ≈ 4s per arc loop
const ROUTES = [
  { name: 'London',    lat: 51.5074,  lng: -0.1278,  color: '#e67e00', speed: 0.0040, offset: 0.00 },
  { name: 'Toronto',   lat: 43.6532,  lng: -79.3832, color: '#0891b2', speed: 0.0035, offset: 0.15 },
  { name: 'Sydney',    lat: -33.8688, lng: 151.2093, color: '#7c3aed', speed: 0.0038, offset: 0.29 },
  { name: 'New York',  lat: 40.7128,  lng: -74.0060, color: '#dc2626', speed: 0.0033, offset: 0.43 },
  { name: 'Berlin',    lat: 52.5200,  lng: 13.4050,  color: '#059669', speed: 0.0037, offset: 0.57 },
  { name: 'Tokyo',     lat: 35.6762,  lng: 139.6503, color: '#db2777', speed: 0.0042, offset: 0.71 },
  { name: 'Singapore', lat: 1.3521,   lng: 103.8198, color: '#2563eb', speed: 0.0045, offset: 0.85 },
] as const;

// ─── Approximate continental land dots ────────────────────────────────────────
const LAND_DOTS: [number, number][] = (() => {
  const seed = 42;
  let s = seed;
  function rand() { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }
  const dots: [number, number][] = [];
  const regions: [number, number, number, number][] = [
    [25, 70, -130, -55],   // North America
    [-55, 12, -82, -34],   // South America
    [35, 70, -12, 42],     // Europe
    [-35, 38, -18, 52],    // Africa
    [5, 72, 26, 95],       // West/Central Asia
    [20, 55, 95, 142],     // East Asia
    [-42, -10, 113, 155],  // Australia
    [1, 22, 95, 125],      // SE Asia
  ];
  regions.forEach(([minLat, maxLat, minLng, maxLng]) => {
    for (let la = minLat; la <= maxLat; la += 7) {
      for (let lo = minLng; lo <= maxLng; lo += 7) {
        const jLa = (rand() - 0.5) * 4;
        const jLo = (rand() - 0.5) * 4;
        dots.push([la + jLa, lo + jLo]);
      }
    }
  });
  return dots;
})();

// ─── Math ──────────────────────────────────────────────────────────────────────
function rad(deg: number) { return (deg * Math.PI) / 180; }

function project(lat: number, lng: number, phi: number, cx: number, cy: number, R: number) {
  const φ = rad(lat);
  const λ = rad(lng) + phi;
  const x = Math.cos(φ) * Math.sin(λ);
  const y = Math.sin(φ);
  const z = Math.cos(φ) * Math.cos(λ);
  return { sx: cx + R * x, sy: cy - R * y, z };
}

function slerp(lat1: number, lng1: number, lat2: number, lng2: number, t: number) {
  const φ1 = rad(lat1), λ1 = rad(lng1);
  const φ2 = rad(lat2), λ2 = rad(lng2);
  const ax = Math.cos(φ1) * Math.cos(λ1), ay = Math.cos(φ1) * Math.sin(λ1), az = Math.sin(φ1);
  const bx = Math.cos(φ2) * Math.cos(λ2), by = Math.cos(φ2) * Math.sin(λ2), bz = Math.sin(φ2);
  const dot = Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz));
  const Ω = Math.acos(dot);
  if (Ω < 1e-4) return { lat: lat1, lng: lng1 };
  const sinΩ = Math.sin(Ω);
  const a = Math.sin((1 - t) * Ω) / sinΩ;
  const b = Math.sin(t * Ω) / sinΩ;
  const cx2 = a * ax + b * bx, cy2 = a * ay + b * by, cz2 = a * az + b * bz;
  return {
    lat: (Math.asin(Math.max(-1, Math.min(1, cz2))) * 180) / Math.PI,
    lng: (Math.atan2(cy2, cx2) * 180) / Math.PI,
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function StudyAbroadGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const stateRef = useRef({
    phi: rad(-90.4125),
    progress: ROUTES.map((r) => r.offset) as number[],
    reducedMotion: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    stateRef.current.reducedMotion = mq.matches;
    const onMQ = (e: MediaQueryListEvent) => { stateRef.current.reducedMotion = e.matches; };
    mq.addEventListener('change', onMQ);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = Math.round(rect.width * dpr);
      canvas!.height = Math.round(rect.height * dpr);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.46;
      const { phi, progress, reducedMotion } = stateRef.current;
      const now = Date.now();

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      // ── Sphere clip ─────────────────────────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // ── Light sphere gradient (matches hero white→lightblue palette) ─────────
      const bgGrad = ctx.createRadialGradient(cx - R * 0.18, cy - R * 0.22, 0, cx, cy, R);
      bgGrad.addColorStop(0.00, '#e4eeff');   // almost white center
      bgGrad.addColorStop(0.32, '#cddcf9');   // light sky blue
      bgGrad.addColorStop(0.65, '#b3caf4');   // medium sky blue
      bgGrad.addColorStop(1.00, '#8fb0e6');   // deeper blue at rim
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // ── Subtle inner rim shadow (depth) ──────────────────────────────────────
      const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
      rimGrad.addColorStop(0, 'transparent');
      rimGrad.addColorStop(1, 'rgba(30, 70, 160, 0.18)');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(0, 0, W, H);

      // ── Latitude grid ────────────────────────────────────────────────────────
      ctx.strokeStyle = 'rgba(30, 80, 190, 0.15)';
      ctx.lineWidth = 0.7;
      for (let latDeg = -75; latDeg <= 75; latDeg += 25) {
        const φ = rad(latDeg);
        ctx.beginPath();
        let pen = false;
        for (let lngDeg = -180; lngDeg <= 180; lngDeg += 2) {
          const λ = rad(lngDeg) + phi;
          const x = Math.cos(φ) * Math.sin(λ);
          const y = Math.sin(φ);
          const z = Math.cos(φ) * Math.cos(λ);
          const sx = cx + R * x, sy = cy - R * y;
          if (z > 0) { pen ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); pen = true; }
          else pen = false;
        }
        ctx.stroke();
      }

      // ── Longitude grid ───────────────────────────────────────────────────────
      for (let lngDeg = 0; lngDeg < 360; lngDeg += 30) {
        ctx.beginPath();
        let pen = false;
        for (let latDeg = -90; latDeg <= 90; latDeg += 2) {
          const φ = rad(latDeg);
          const λ = rad(lngDeg) + phi;
          const x = Math.cos(φ) * Math.sin(λ);
          const y = Math.sin(φ);
          const z = Math.cos(φ) * Math.cos(λ);
          const sx = cx + R * x, sy = cy - R * y;
          if (z > 0) { pen ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); pen = true; }
          else pen = false;
        }
        ctx.stroke();
      }

      // ── Land dots ────────────────────────────────────────────────────────────
      LAND_DOTS.forEach(([la, lo]) => {
        const { sx, sy, z } = project(la, lo, phi, cx, cy, R);
        if (z > 0.05) {
          const brightness = Math.max(0, (z - 0.05) / 0.95);
          ctx.globalAlpha = brightness * 0.5;
          ctx.fillStyle = 'rgba(30, 90, 200, 0.6)';
          ctx.beginPath();
          ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      // ── Route arcs + plane particles ─────────────────────────────────────────
      const STEPS = 80;
      ROUTES.forEach((route, i) => {
        const prog = progress[i];
        const color = route.color;
        const drawnSteps = Math.floor(prog * STEPS);

        // Arc trail
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = color;
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        let pen = false;
        for (let s = 0; s <= drawnSteps; s++) {
          const t = s / STEPS;
          const pt = slerp(DHAKA.lat, DHAKA.lng, route.lat, route.lng, t);
          const { sx, sy, z } = project(pt.lat, pt.lng, phi, cx, cy, R);
          if (z > -0.1) { pen ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); pen = true; }
          else pen = false;
        }
        ctx.stroke();
        ctx.restore();

        // Plane head + comet tail (always draw entire visible arc, plane moves along it)
        if (prog > 0.02 && prog < 1) {
          const TAIL = 12;
          for (let j = TAIL; j >= 0; j--) {
            const t = Math.max(0, prog - j * 0.009);
            const pt = slerp(DHAKA.lat, DHAKA.lng, route.lat, route.lng, t);
            const { sx, sy, z } = project(pt.lat, pt.lng, phi, cx, cy, R);
            if (z > 0) {
              const isHead = j === 0;
              ctx.save();
              if (isHead) {
                ctx.shadowBlur = 18;
                ctx.shadowColor = color;
              }
              ctx.globalAlpha = isHead ? 1 : (1 - j / TAIL) * 0.45;
              // Head: white circle with colored border. Tail: colored fade.
              if (isHead) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(sx, sy, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(sx, sy, 6, 0, Math.PI * 2);
                ctx.stroke();
              } else {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(sx, sy, 2 + (1 - j / TAIL) * 2, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            }
          }
        }

        // Destination marker: pulsing ring + solid dot
        const destPt = project(route.lat, route.lng, phi, cx, cy, R);
        if (destPt.z > 0) {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.0028 + i * 1.1);
          ctx.save();
          ctx.shadowBlur = 14;
          ctx.shadowColor = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.35 + 0.4 * pulse;
          ctx.beginPath();
          ctx.arc(destPt.sx, destPt.sy, 7 + pulse * 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(destPt.sx, destPt.sy, 4, 0, Math.PI * 2);
          ctx.fill();
          // White center dot
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(destPt.sx, destPt.sy, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Advance progress
        if (!reducedMotion) {
          stateRef.current.progress[i] = prog + route.speed;
          if (stateRef.current.progress[i] >= 1) stateRef.current.progress[i] = 0;
        }
      });

      // ── Sphere highlight sheen (top-left specular) ───────────────────────────
      const sheenGrad = ctx.createRadialGradient(
        cx - R * 0.32, cy - R * 0.38, 0,
        cx - R * 0.16, cy - R * 0.22, R * 0.5,
      );
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
      sheenGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.restore(); // end sphere clip

      // ── Dhaka golden origin glow ─────────────────────────────────────────────
      const dk = project(DHAKA.lat, DHAKA.lng, phi, cx, cy, R);
      if (dk.z > 0) {
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.003);
        const glowR = 20 + pulse * 8;
        const oGrad = ctx.createRadialGradient(dk.sx, dk.sy, 0, dk.sx, dk.sy, glowR);
        oGrad.addColorStop(0, 'rgba(245, 158, 11, 0.95)');
        oGrad.addColorStop(0.45, 'rgba(245, 158, 11, 0.4)');
        oGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = oGrad;
        ctx.beginPath();
        ctx.arc(dk.sx, dk.sy, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#f59e0b';
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(dk.sx, dk.sy, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dk.sx, dk.sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Soft atmosphere ring ─────────────────────────────────────────────────
      const atmosGrad = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.10);
      atmosGrad.addColorStop(0, 'transparent');
      atmosGrad.addColorStop(0.5, 'rgba(100, 150, 240, 0.12)');
      atmosGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = atmosGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.10, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // end dpr scale

      // ── Rotate ───────────────────────────────────────────────────────────────
      if (!reducedMotion) stateRef.current.phi += 0.0022;

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      mq.removeEventListener('change', onMQ);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
