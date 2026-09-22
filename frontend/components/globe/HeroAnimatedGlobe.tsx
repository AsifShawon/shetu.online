"use client";

import createGlobe from "cobe";
import { useEffect, useMemo, useRef, useState } from "react";

type GlobeInstance = ReturnType<typeof createGlobe>;
type GlobeOptions = Parameters<typeof createGlobe>[1];
type GlobeOptionsWithRender = GlobeOptions & {
    onRender?: (state: Record<string, number>) => void;
};
type Rgb = [number, number, number];
type LatLng = [number, number];

type Destination = {
    id: string;
    label: string;
    location: LatLng;
    markerSize: number;
    color?: Rgb;
    labelClassName?: string;
};

const ORIGIN: Destination = {
    id: "bd",
    label: "BD",
    location: [23.8103, 90.4125],
    markerSize: 0.034,
    color: [0.95, 0.18, 0.18],
};

const DESTINATIONS: Destination[] = [
    { id: "uk", label: "UK", location: [51.5072, -0.1276], markerSize: 0.026, labelClassName: "labelNorthWest" },
    { id: "usa", label: "USA", location: [40.7128, -74.006], markerSize: 0.026, labelClassName: "labelWest" },
    { id: "canada", label: "Canada", location: [43.6532, -79.3832], markerSize: 0.026, labelClassName: "labelFarWest" },
    { id: "eu", label: "EU", location: [52.52, 13.405], markerSize: 0.026, labelClassName: "labelCenter" },
    { id: "aus", label: "AUS", location: [-33.8688, 151.2093], markerSize: 0.027, labelClassName: "labelSouthEast" },
    { id: "japan", label: "Japan", location: [35.6762, 139.6503], markerSize: 0.026, labelClassName: "labelEast" },
];

const PLANE_ROUTES = [
    {
        id: "route-left-to-eu",
        d: "M 355 420 C 510 250 720 205 985 268",
        duration: "10.5s",
        delay: "-0.8s",
    },
    {
        id: "route-uk-to-east",
        d: "M 515 310 C 680 185 930 178 1225 315",
        duration: "11.5s",
        delay: "-3.5s",
    },
    {
        id: "route-east-to-west",
        d: "M 1235 410 C 1030 300 760 310 545 455",
        duration: "12.4s",
        delay: "-6.3s",
    },
    {
        id: "route-low-sweep",
        d: "M 455 515 C 680 390 970 398 1190 505",
        duration: "13.2s",
        delay: "-8.9s",
    },
];

function useReducedMotion() {
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const syncPreference = () => setReducedMotion(mediaQuery.matches);

        syncPreference();
        mediaQuery.addEventListener("change", syncPreference);

        return () => mediaQuery.removeEventListener("change", syncPreference);
    }, []);

    return reducedMotion;
}

export default function HeroAnimatedGlobe() {
    const shellRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const globeRef = useRef<GlobeInstance | null>(null);
    const frameRef = useRef<number | null>(null);
    const reducedMotion = useReducedMotion();
    const reducedMotionRef = useRef(reducedMotion);
    const sizeRef = useRef(1120);
    const dprRef = useRef(1);
    const phiRef = useRef(4.58);
    const [canvasSize, setCanvasSize] = useState(1120);

    const allMarkers = useMemo(() => [ORIGIN, ...DESTINATIONS], []);

    const markers = useMemo(
        () =>
            allMarkers.map((marker) => ({
                id: marker.id,
                location: marker.location,
                size: marker.markerSize,
                color: marker.color ?? ([0.12, 0.43, 1] as Rgb),
            })),
        [allMarkers],
    );

    const arcs = useMemo(
        () =>
            DESTINATIONS.map((destination) => ({
                id: `bd-${destination.id}`,
                from: ORIGIN.location,
                to: destination.location,
                color: [0.14, 0.43, 1] as Rgb,
            })),
        [],
    );

    useEffect(() => {
        reducedMotionRef.current = reducedMotion;
    }, [reducedMotion]);

    useEffect(() => {
        const shell = shellRef.current;
        if (!shell) return;

        const syncSize = () => {
            const bounds = shell.getBoundingClientRect();
            const nextSize = Math.round(
                Math.min(
                    Math.max(
                        bounds.width * (bounds.width < 900 ? 0.8 : 0.7),
                        bounds.height * 2.58,
                        980,
                    ),
                    1360,
                ),
            );
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            sizeRef.current = nextSize;
            dprRef.current = dpr;
            setCanvasSize(nextSize);

            globeRef.current?.update({
                width: Math.floor(nextSize * dpr),
                height: Math.floor(nextSize * dpr),
            });
        };

        syncSize();
        const observer = new ResizeObserver(syncSize);
        observer.observe(shell);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let isDisposed = false;
        phiRef.current = 4.58;

        const globe = createGlobe(canvas, {
            devicePixelRatio: dprRef.current,
            width: Math.floor(sizeRef.current * dprRef.current),
            height: Math.floor(sizeRef.current * dprRef.current),
            phi: phiRef.current,
            theta: 0.25,
            dark: 0,
            diffuse: 1.18,
            mapSamples: 18500,
            mapBrightness: 4.25,
            mapBaseBrightness: 0.075,
            baseColor: [0.96, 0.985, 1],
            markerColor: [0.12, 0.43, 1],
            glowColor: [0.86, 0.94, 1],
            opacity: 0.98,
            scale: 1.02,
            offset: [0, 22],
            markers: markers as any,
            arcs: arcs as any,
            arcColor: [0.14, 0.43, 1],
            arcWidth: 0.14,
            arcHeight: 0.22,
            markerElevation: 0.016,
            onRender: (state) => {
                state.width = Math.floor(sizeRef.current * dprRef.current);
                state.height = Math.floor(sizeRef.current * dprRef.current);
                state.phi = phiRef.current;
                state.theta = 0.25;
            },
        } as GlobeOptionsWithRender);

        globeRef.current = globe;
        canvas.style.opacity = "1";

        const animate = () => {
            if (isDisposed) return;

            if (!reducedMotionRef.current) {
                phiRef.current += 0.0031;
                globe.update({
                    phi: phiRef.current,
                    theta: 0.25,
                    width: Math.floor(sizeRef.current * dprRef.current),
                    height: Math.floor(sizeRef.current * dprRef.current),
                });
            }

            frameRef.current = window.requestAnimationFrame(animate);
        };

        frameRef.current = window.requestAnimationFrame(animate);

        return () => {
            isDisposed = true;
            if (frameRef.current !== null) {
                window.cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
            globe.destroy();
            globeRef.current = null;
        };
    }, [arcs, markers]);

    return (
        <div ref={shellRef} className="heroCobeGlobe" aria-hidden="true">
            <div
                className="heroCobeGlow heroCobeGlowOuter"
                style={{ width: `${Math.round(canvasSize * 1.14)}px`, height: `${Math.round(canvasSize * 1.14)}px` }}
            />
            <div
                className="heroCobeGlow heroCobeGlowInner"
                style={{ width: `${Math.round(canvasSize * 1.04)}px`, height: `${Math.round(canvasSize * 1.04)}px` }}
            />
            <canvas
                ref={canvasRef}
                className="heroCobeCanvas"
                style={{ width: `${canvasSize}px`, height: `${canvasSize}px` }}
            />

            <div className="heroGlobeLabels">
                {DESTINATIONS.map((destination) => (
                    <span
                        key={destination.id}
                        className={`heroGlobeLabel ${destination.labelClassName ?? ""}`}
                    >
                        {destination.label}
                    </span>
                ))}
            </div>

            <svg
                className="heroPlaneLayer"
                viewBox="0 0 1600 620"
                preserveAspectRatio="none"
                role="presentation"
                focusable="false"
            >
                <defs>
                    <clipPath id="planeDomeClip">
                        <path d="M 235 620 C 270 326 482 160 800 160 C 1118 160 1330 326 1365 620 Z" />
                    </clipPath>

                    <filter id="planeSoftShadow" x="-80%" y="-80%" width="260%" height="260%">
                        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="rgba(15, 23, 42, 0.15)" />
                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(37, 99, 235, 0.18)" />
                    </filter>

                    <linearGradient id="planeRouteGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
                        <stop offset="22%" stopColor="rgba(59, 130, 246, 0.22)" />
                        <stop offset="72%" stopColor="rgba(37, 99, 235, 0.42)" />
                        <stop offset="100%" stopColor="rgba(37, 99, 235, 0)" />
                    </linearGradient>

                    <g id="eduPlaneIcon">
                        <path
                            d="M 34 0 L 3.5 -8.2 L -7.5 -27.5 C -8.5 -29.2 -10.6 -29.8 -12.2 -28.8 L -16.8 -25.9 L -9.5 -6.2 L -31.4 -3.2 C -34.2 -2.8 -35.4 -0.9 -35.4 0 C -35.4 0.9 -34.2 2.8 -31.4 3.2 L -9.5 6.2 L -16.8 25.9 L -12.2 28.8 C -10.6 29.8 -8.5 29.2 -7.5 27.5 L 3.5 8.2 Z"
                            fill="#ffffff"
                            stroke="#2563eb"
                            strokeWidth="3.2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                        <path
                            d="M -6 -4.4 L 13.5 0 L -6 4.4"
                            fill="none"
                            stroke="#7fb3ff"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <circle cx="-27" cy="0" r="1.9" fill="#bfdbfe" opacity="0.95" />
                    </g>
                </defs>

                <g className="planeRoutes" clipPath="url(#planeDomeClip)">
                    {PLANE_ROUTES.map((route) => (
                        <g key={route.id}>
                            <path className="planeTrack" d={route.d} />
                            <path id={`plane-path-${route.id}`} d={route.d} fill="none" stroke="transparent" />
                            <g className="movingPlane" filter="url(#planeSoftShadow)">
                                <animateMotion dur={route.duration} begin={route.delay} repeatCount="indefinite" rotate="auto">
                                    <mpath href={`#plane-path-${route.id}`} />
                                </animateMotion>
                                <use href="#eduPlaneIcon" transform="scale(0.54)" />
                            </g>
                        </g>
                    ))}
                </g>
            </svg>

            <style>{`
        .heroCobeGlobe {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          isolation: isolate;
        }

        .heroCobeGlow {
          position: absolute;
          left: 50%;
          top: 114%;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .heroCobeGlowOuter {
          z-index: 0;
          background:
            radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.44) 0%, rgba(236, 244, 255, 0.24) 42%, rgba(186, 212, 255, 0.11) 61%, rgba(186, 212, 255, 0.03) 72%, rgba(186, 212, 255, 0) 86%);
          filter: blur(16px);
          opacity: 0.82;
        }

        .heroCobeGlowInner {
          z-index: 1;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 34%, rgba(255, 255, 255, 0.94) 0%, rgba(247, 251, 255, 0.88) 38%, rgba(229, 239, 255, 0.52) 58%, rgba(229, 239, 255, 0.1) 70%, rgba(229, 239, 255, 0) 84%);
          filter: blur(4px);
          opacity: 0.88;
        }

        .heroCobeCanvas {
          position: absolute;
          left: 50%;
          top: 114%;
          z-index: 2;
          display: block;
          max-width: none;
          aspect-ratio: 1 / 1;
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: opacity 320ms ease;
          filter:
            drop-shadow(0 -10px 22px rgba(255, 255, 255, 0.92))
            drop-shadow(0 18px 42px rgba(37, 99, 235, 0.1));
        }

        .heroPlaneLayer {
          position: absolute;
          inset: 0;
          z-index: 3;
          width: 100%;
          height: 100%;
          overflow: hidden;
          opacity: 0.22;
        }

        .planeTrack {
          fill: none;
          stroke: url(#planeRouteGradient);
          stroke-width: 1.55;
          stroke-linecap: round;
          stroke-dasharray: 10 16;
          animation: routeDash 8s linear infinite;
        }

        .movingPlane {
          transform-box: fill-box;
          transform-origin: center;
        }

        .heroGlobeLabels {
          position: absolute;
          inset: 0;
          z-index: 4;
          pointer-events: none;
          overflow: hidden;
        }

        .heroGlobeLabel {
          position: absolute;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 38px;
          height: 24px;
          padding: 0 9px;
          border-radius: 8px 8px 8px 2px;
          background: #0B1F4D;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
          white-space: nowrap;
          opacity: 0.9;
          filter: drop-shadow(0 8px 20px rgba(11, 31, 77, 0.16));
          box-shadow:
            0 8px 20px rgba(11, 31, 77, 0.16),
            0 0 0 1px rgba(255, 255, 255, 0.45) inset;
          animation: labelFloat 5.8s ease-in-out infinite;
        }

        .heroGlobeLabel::after {
          content: "";
          position: absolute;
          left: 12px;
          bottom: -5px;
          width: 10px;
          height: 10px;
          background: inherit;
          transform: rotate(45deg);
          border-radius: 2px;
        }

        .labelFarWest {
          left: 14%;
          top: 35%;
          animation-delay: -0.8s;
        }

        .labelWest {
          left: 24%;
          top: 40%;
          animation-delay: -1.8s;
        }

        .labelNorthWest {
          left: 47%;
          top: 31%;
          animation-delay: -0.2s;
        }

        .labelCenter {
          left: 58%;
          top: 34%;
          animation-delay: -2.1s;
        }

        .labelEast {
          right: 9%;
          top: 37%;
          animation-delay: -1.1s;
        }

        .labelSouthEast {
          right: 8%;
          bottom: 24%;
          animation-delay: -2.9s;
        }

        @keyframes routeDash {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -160; }
        }

        @keyframes labelFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @media (max-width: 900px) {
          .heroCobeGlow {
            top: 116%;
          }
          .heroCobeCanvas { top: 117%; }
          .heroPlaneLayer { opacity: 0.68; }
          .labelFarWest,
          .labelWest,
          .labelSouthEast {
            display: none;
          }

          .labelNorthWest {
            left: 44%;
            top: 30%;
          }

          .labelCenter {
            left: 57%;
            top: 33%;
          }

          .labelEast {
            right: 7%;
            top: 36%;
          }
        }

        @media (max-width: 680px) {
          .heroCobeGlowOuter {
            filter: blur(12px);
            opacity: 0.74;
          }

          .heroCobeGlowInner {
            filter: blur(3px);
            opacity: 0.82;
          }

          .heroCobeCanvas {
            top: 121%;
            filter:
              drop-shadow(0 -8px 18px rgba(255, 255, 255, 0.88))
              drop-shadow(0 16px 34px rgba(37, 99, 235, 0.09));
          }

          .planeTrack,
          .movingPlane {
            display: none;
          }

          .heroGlobeLabel {
            font-size: 10px;
            height: 21px;
            min-width: 30px;
            scale: 0.9;
          }

          .labelFarWest,
          .labelWest,
          .labelSouthEast,
          .labelNorthWest {
            display: none;
          }

          .labelCenter {
            left: 56%;
            top: 33%;
          }

          .labelEast {
            right: 6%;
            top: 36%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .planeTrack,
          .movingPlane {
            animation: none;
          }
        }
      `}</style>
        </div>
    );
}
