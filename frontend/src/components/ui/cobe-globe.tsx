"use client";

import createGlobe, { type COBEOptions, type Globe, type Marker } from "cobe";
import { useEffect, useMemo, useRef } from "react";

import type { FootballRegion } from "@/types/competition";

type CobeGlobeProps = {
  regions: FootballRegion[];
  selectedRegionId: string;
};

type RenderOptions = COBEOptions & {
  onRender: (state: Partial<COBEOptions>) => void;
};

const navy: [number, number, number] = [0.118, 0.161, 0.231];
const slate: [number, number, number] = [0.25, 0.32, 0.42];
const green: [number, number, number] = [0.133, 0.773, 0.369];

export function CobeGlobe({ regions, selectedRegionId }: CobeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<Globe | null>(null);
  const phiRef = useRef(0.4);
  const dragStartRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const selectedRegionRef = useRef(selectedRegionId);
  const markers = useMemo(
    () => toMarkers(regions, selectedRegionId),
    [regions, selectedRegionId],
  );

  useEffect(() => {
    selectedRegionRef.current = selectedRegionId;
    globeRef.current?.update({ markers });
  }, [markers, selectedRegionId]);

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

    const create = () => {
      if (globeRef.current) {
        return;
      }

      const size = Math.max(canvas.clientWidth, 1);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const options: RenderOptions = {
        width: size * dpr,
        height: size * dpr,
        devicePixelRatio: dpr,
        phi: phiRef.current,
        theta: 0.18,
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
        markers: toMarkers(regions, selectedRegionRef.current),
        onRender: (state) => {
          if (dragStartRef.current === null && !reducedMotionRef.current) {
            phiRef.current += 0.0022;
          }

          state.phi = phiRef.current;
        },
      };

      globeRef.current = createGlobe(canvas, options);
    };

    const destroy = () => {
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
        width: nextSize * nextDpr,
        height: nextSize * nextDpr,
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
  }, [regions]);

  function startDrag(clientX: number, pointerId: number) {
    dragStartRef.current = clientX;
    canvasRef.current?.setPointerCapture(pointerId);
  }

  function moveDrag(clientX: number) {
    const previous = dragStartRef.current;

    if (previous === null) {
      return;
    }

    phiRef.current += (clientX - previous) / 180;
    dragStartRef.current = clientX;
  }

  function finishDrag(pointerId: number) {
    dragStartRef.current = null;

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
  return regions.map((region) => ({
    location: [region.latitude, region.longitude],
    size: region.id === selectedRegionId ? 0.095 : 0.045,
    color: region.id === selectedRegionId ? green : slate,
  }));
}
