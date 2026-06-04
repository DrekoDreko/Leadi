"use client";

import React, { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useAnimationFrame
} from "framer-motion";

type InfiniteGridHeroProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export const InfiniteGridHero = ({
  eyebrow,
  title,
  subtitle,
  children,
  className
}: InfiniteGridHeroProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const speedX = 0.5;
  const speedY = 0.5;

  useAnimationFrame(() => {
    const currentX = gridOffsetX.get();
    const currentY = gridOffsetY.get();
    gridOffsetX.set((currentX + speedX) % 40);
    gridOffsetY.set((currentY + speedY) % 40);
  });

  const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "surface-card relative flex min-h-[260px] flex-col items-center justify-center overflow-hidden rounded-[34px] p-8 text-center md:min-h-[300px]",
        className
      )}
    >
      <div className="absolute inset-0 z-0 opacity-[0.06]">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </div>
      <motion.div
        className="absolute inset-0 z-0 opacity-40"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute right-[-20%] top-[-30%] h-[55%] w-[40%] rounded-full bg-cobalt/30 blur-[120px]" />
        <div className="absolute right-[12%] top-[-10%] h-[30%] w-[20%] rounded-full bg-primary/30 blur-[100px]" />
        <div className="absolute bottom-[-30%] left-[-10%] h-[55%] w-[40%] rounded-full bg-signal/40 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center space-y-4">
        {eyebrow ? (
          <span className="text-cobalt inline-flex items-center gap-2 rounded-full bg-surface-elevated px-4 py-1.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-border/70">
            {eyebrow}
          </span>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground drop-shadow-sm md:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-muted-soft text-base leading-7 md:text-lg">{subtitle}</p>
          ) : null}
        </div>
        {children ? <div className="pt-1">{children}</div> : null}
      </div>
    </div>
  );
};

const GridPattern = ({
  offsetX,
  offsetY
}: {
  offsetX: ReturnType<typeof useMotionValue<number>>;
  offsetY: ReturnType<typeof useMotionValue<number>>;
}) => {
  return (
    <svg className="h-full w-full">
      <defs>
        <motion.pattern
          id="leadi-grid-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted-foreground"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#leadi-grid-pattern)" />
    </svg>
  );
};
