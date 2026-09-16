"use client";

import createGlobe, { type Globe, type Marker } from "cobe";
import { useEffect, useMemo, useRef } from "react";

import {
  getGlobeMarkerSpecs,
  locationToGlobeAngles,
  shortestAngleDelta,
} from "@/features/competitions/competition-view";
import type { FootballRegion } from "@/types/competition";

type CobeGlobeProps = {
  regions: FootballRegion[];
  selectedRegionId: string;
};

const navy: [number, number, number] = [0.118, 0.161, 0.231];
const slate: [number, number, number] = [0.25, 0.32, 0.42];
const green: [number, number, number] = [0.133, 0.773, 0.369];
const mutedMarker: [number, number, number] = [0.38, 0.46, 0.56];
const autoRotationSpeed = 0.000055;
const resumeDelay = 1_200;

export function CobeGlobe({ regions, selectedRegionId }: CobeGlobeProps) {
  const initialRegion = regions.find(
    (region) => region.id === selectedRegionId,
  );
  const initialAngles = initialRegion
    ? locationToGlobeAngles(initialRegion.latitude, initialRegion.longitude)
    : { phi: 0.4, theta: 0.18 };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<Globe | null>(null);
  const regionsRef = useRef(regions);
  const phiRef = useRef(initialAngles.phi);
  const thetaRef = useRef(initialAngles.theta);
  const targetRef = useRef<{ phi: number; theta: number } | null>(null);
  const dragRef = useRef<{ x: number; time: number } | null>(null);
  const inertiaRef = useRef(0);
  const autoSpeedRef = useRef(0);
  const resumeAtRef = useRef(0);
  const lastFrameRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const selectedRegionRef = useRef(selectedRegionId);
  const markers = useMemo(
    () => toMarkers(regions, selectedRegionId),
    [regions, selectedRegionId],
  );

  regionsRef.current = regions;

  useEffect(() => {
    selectedRegionRef.current = selectedRegionId;
    const selectedRegion = regions.find(
      (region) => region.id === selectedRegionId,
    );

    if (selectedRegion) {
      targetRef.current = locationToGlobeAngles(
        selectedRegion.latitude,
        selectedRegion.longitude,
      );
      inertiaRef.current = 0;
      autoSpeedRef.current = 0;
    }

    globeRef.current?.update({ markers });
  }, [markers, regions, selectedRegionId]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      reducedMotionRef.current = media.matches;
    };

    updateMotionPreference();
    media.addEventListener("change", updateMotionPreference);
    let animationFrame: number | null = null;

    const render = (now: number) => {
      const delta = Math.min(
        lastFrameRef.current > 0 ? now - lastFrameRef.current : 16,
        40,
      );
      lastFrameRef.current = now;
      const target = targetRef.current;

      if (target) {
        if (reducedMotionRef.current) {
          phiRef.current = target.phi;
          thetaRef.current = target.theta;
          targetRef.current = null;
        } else {
          const easing = 1 - Math.exp(-delta / 280);
          const phiDelta = shortestAngleDelta(phiRef.current, target.phi);
          const thetaDelta = target.theta - thetaRef.current;

          phiRef.current += phiDelta * easing;
          thetaRef.current += thetaDelta * easing;

          if (Math.abs(phiDelta) < 0.002 && Math.abs(thetaDelta) < 0.002) {
            phiRef.current = target.phi;
            thetaRef.current = target.theta;
            targetRef.current = null;
            resumeAtRef.current = now + resumeDelay;
          }
        }
      } else if (dragRef.current === null) {
        if (
          !reducedMotionRef.current &&
          Math.abs(inertiaRef.current) > 0.00001
        ) {
          phiRef.current += inertiaRef.current * delta;
          inertiaRef.current *= Math.exp(-delta / 420);
        } else {
          inertiaRef.current = 0;
        }

        if (!reducedMotionRef.current && now >= resumeAtRef.current) {
          const acceleration = 1 - Math.exp(-delta / 900);

          autoSpeedRef.current +=
            (autoRotationSpeed - autoSpeedRef.current) * acceleration;
          phiRef.current += autoSpeedRef.current * delta;
        }
      }

      globeRef.current?.update({
        phi: phiRef.current,
        theta: thetaRef.current,
      });
      animationFrame = window.requestAnimationFrame(render);
    };

    const create = () => {
      if (globeRef.current) {
        return;
      }

      const size = Math.max(canvas.clientWidth, 1);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      globeRef.current = createGlobe(canvas, {
        width: size,
        height: size,
        devicePixelRatio: dpr,
        phi: phiRef.current,
        theta: thetaRef.current,
        dark: 1,
        diffuse: 1.35,
        scale: 0.93,
        mapSamples: 12_000,
        mapBrightness: 7,
        mapBaseBrightness: 0.09,
        baseColor: slate,
        markerColor: green,
        glowColor: navy,
        markerElevation: 0.025,
        markers: toMarkers(regionsRef.current, selectedRegionRef.current),
      });
      lastFrameRef.current = 0;
      animationFrame = window.requestAnimationFrame(render);
    };

    const destroy = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      globeRef.current?.destroy();
      globeRef.current = null;
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          create();
        } else {
          destroy();
        }
      },
      { rootMargin: "120px" },
    );

    const resizeObserver = new ResizeObserver(([entry]) => {
      const nextSize = Math.max(entry.contentRect.width, 1);
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

      globeRef.current?.update({
        width: nextSize,
        height: nextSize,
        devicePixelRatio: nextDpr,
      });
    });

    resizeObserver.observe(canvas);
    visibilityObserver.observe(canvas);

    return () => {
      media.removeEventListener("change", updateMotionPreference);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      destroy();
    };
  }, []);

  function startDrag(clientX: number, pointerId: number) {
    dragRef.current = { x: clientX, time: performance.now() };
    targetRef.current = null;
    inertiaRef.current = 0;
    autoSpeedRef.current = 0;
    canvasRef.current?.setPointerCapture(pointerId);
  }

  function moveDrag(clientX: number) {
    const previous = dragRef.current;

    if (!previous) {
      return;
    }

    const now = performance.now();
    const deltaX = clientX - previous.x;
    const deltaTime = Math.max(now - previous.time, 1);
    const rotation = deltaX / 170;

    phiRef.current += rotation;
    inertiaRef.current = rotation / deltaTime;
    dragRef.current = { x: clientX, time: now };
  }

  function finishDrag(pointerId: number) {
    dragRef.current = null;
    resumeAtRef.current = performance.now() + resumeDelay;

    if (reducedMotionRef.current) {
      inertiaRef.current = 0;
    }

    if (canvasRef.current?.hasPointerCapture(pointerId)) {
      canvasRef.current.releasePointerCapture(pointerId);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="aspect-square w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
      aria-hidden="true"
      onPointerDown={(event) => startDrag(event.clientX, event.pointerId)}
      onPointerMove={(event) => moveDrag(event.clientX)}
      onPointerUp={(event) => finishDrag(event.pointerId)}
      onPointerCancel={(event) => finishDrag(event.pointerId)}
    />
  );
}

function toMarkers(
  regions: FootballRegion[],
  selectedRegionId: string,
): Marker[] {
  return getGlobeMarkerSpecs(regions, selectedRegionId).map((marker) => ({
    location: marker.location,
    size: marker.size,
    color: marker.active ? green : mutedMarker,
    id: `region-${marker.id}`,
  }));
}
