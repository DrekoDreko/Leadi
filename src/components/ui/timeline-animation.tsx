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
  
  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={customVariants}
      custom={animationNum}
      className={className}
    >
      {children}
    </Component>
  );
}
