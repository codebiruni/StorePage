"use client";
// Scroll-triggered reveal: fades + translates children into view when they
// enter the viewport. All themes use this so the page has a unified sense
// of "things appearing as you scroll". Motion respects prefers-reduced-motion.
import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type RevealProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Vertical travel distance in pixels. */
  y?: number;
  /** Animation delay in seconds. */
  delay?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Trigger only once (default) or every time the element re-enters. */
  once?: boolean;
  as?: "div" | "span" | "section" | "article" | "li" | "ul";
};

export function Reveal({
  y = 24,
  delay = 0,
  duration = 0.7,
  once = true,
  as = "div",
  className,
  children,
  ...rest
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-10% 0px -10% 0px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
      {...(rest as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Stagger: render children with a per-item delay. Combine with <Reveal>
 * inside each child for a sequenced list reveal.
 */
export function Stagger({
  children,
  step = 0.08,
  start = 0,
  className,
}: {
  children: React.ReactNode;
  step?: number;
  start?: number;
  className?: string;
}) {
  return (
    <div className={className} style={{ display: "contents" }}>
      {React.Children.map(children, (child, i) => (
        <Reveal key={i} delay={start + i * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}