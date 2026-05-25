"use client";

import { motion } from "motion/react";
import { ReactNode, RefObject } from "react";

interface TimelineContentProps {
  children: ReactNode;
  animationNum: number;
  timelineRef?: RefObject<HTMLDivElement | null>;
  customVariants?: any;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function TimelineContent({
  children,
  animationNum,
  customVariants,
  className,
  as = "div",
}: TimelineContentProps) {
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
