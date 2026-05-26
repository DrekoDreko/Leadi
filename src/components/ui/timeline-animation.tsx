"use client";

import { motion, type Variants } from "motion/react";
import { ReactNode, RefObject, ElementType } from "react";

interface TimelineContentProps {
  children: ReactNode;
  animationNum: number;
  timelineRef?: RefObject<HTMLDivElement | null>;
  customVariants?: Variants;
  className?: string;
  as?: ElementType;
}

export function TimelineContent({
  children,
  animationNum,
  customVariants,
  className,
  as = "div",
}: TimelineContentProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = motion[as as keyof typeof motion] as any;
  const canObserveViewport = typeof IntersectionObserver !== "undefined";

  return (
    <Component
      initial="hidden"
      animate={canObserveViewport ? undefined : "visible"}
      viewport={canObserveViewport ? { once: true, margin: "-100px" } : undefined}
      whileInView={canObserveViewport ? "visible" : undefined}
      variants={customVariants}
      custom={animationNum}
      className={className}
    >
      {children}
    </Component>
  );
}
