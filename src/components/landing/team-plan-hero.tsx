"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

function GeometricShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient,
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -100, rotate: rotate - 10 }}
      animate={{ opacity: 1, y: 0, rotate: rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute pointer-events-none", className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{
          duration: 12 + delay * 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[8px] border border-black/[0.05] dark:border-white/[0.08]",
            "shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.03)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02),transparent_70%)] dark:after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

export function TeamPlanHero({
  badge,
  title,
  subtitle,
  actions,
}: {
  badge: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.2 + i * 0.15,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    }),
  };

  return (
    <section className="relative min-h-[60vh] md:min-h-[75vh] w-full flex items-center justify-center overflow-hidden bg-transparent">
      <div className="absolute inset-0 bg-transparent dark:bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Shapes for Light & Dark Theme */}
      <div className="absolute inset-0 overflow-hidden">
        <GeometricShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-[#3462ee]/10 dark:from-[#6B46C1]/20"
          className="left-[-10%] top-[15%] md:left-[-5%] md:top-[20%]"
        />
        <GeometricShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-[#4a91a8]/10 dark:from-[#3462ee]/20"
          className="right-[-5%] top-[70%] md:right-[10%] md:top-[75%]"
        />
        <GeometricShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-[#eaf0dc]/40 dark:from-[#eab308]/15"
          className="left-[5%] top-[75%] md:left-[15%] md:top-[80%]"
        />
        <GeometricShape
          delay={0.6}
          width={400}
          height={100}
          rotate={20}
          gradient="from-transparent via-[#3462ee]/5 to-transparent dark:via-[#ec4899]/15"
          className="right-[15%] top-[10%] md:right-[20%] md:top-[15%]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <span className="inline-flex items-center rounded-full border border-black/5 bg-black/5 px-4 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
              {badge}
            </span>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
              {title}
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-muted-soft md:text-xl dark:text-muted-foreground">
              {subtitle}
            </p>
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {actions}
          </motion.div>
        </div>
      </div>

      {/* Decorative Gradient Blur Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(52,98,238,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(107,70,193,0.1)_0%,transparent_60%)] blur-[100px]" />
    </section>
  );
}
