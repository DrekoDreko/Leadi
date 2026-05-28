"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type ShinyBordersButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  text: string;
};

export default function ShinyBordersButton({
  className,
  href,
  text,
  type = "button",
  ...props
}: ShinyBordersButtonProps) {
  const buttonRef = React.useRef<HTMLElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    buttonRef.current.style.setProperty("--mouse-x", `${x}px`);
    buttonRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  const content = (
    <>
      <span className="absolute inset-0 rounded-full bg-primary/40 blur-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-primary py-4 px-5 text-sm font-semibold tracking-wide text-primary-foreground shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_4px_14px_0_rgba(0,0,0,0.1)] transition-all duration-500 group-hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_8px_24px_-4px_rgba(var(--primary),0.6)]">
        <span
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-60 mix-blend-overlay"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            maskImage: "radial-gradient(130px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 0%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(130px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 0%, transparent 100%)",
          }}
        />
        <span
          className="pointer-events-none absolute inset-0 -z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: "radial-gradient(130px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.25) 0%, transparent 100%)"
          }}
        />
        
        <span className="relative z-10 flex items-center gap-2">
          {text}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </span>
    </>
  );

  const sharedClassName = cn(
    "group relative inline-flex w-full items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:-translate-y-1",
    className
  );

  if (href) {
    return (
      <Link 
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        onMouseMove={handleMouseMove}
        className={sharedClassName} 
        href={href}
      >
        {content}
      </Link>
    );
  }

  return (
    <button 
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      onMouseMove={handleMouseMove}
      className={sharedClassName} 
      type={type} 
      {...props}
    >
      {content}
    </button>
  );
}
