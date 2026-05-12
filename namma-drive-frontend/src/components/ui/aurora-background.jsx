"use client";
import { cn } from "@/lib/utils";
import React from "react";

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}) => {
  return (
    <main className="w-full h-full dark">
      <div
        className={cn(
          "transition-bg relative flex h-full w-full flex-col items-center justify-center bg-[#0f0305] text-slate-950 dark:text-slate-50",
          className
        )}
        {...props}>
        <div
          className="absolute inset-0 overflow-hidden"
          style={
            {
              "--red-base": "#ce1126",
              "--yellow-gold": "#f9d616",
              "--orange-glow": "#e65100",
              "--red-dark": "#8b0000",
              "--amber-light": "#ffca28",

              "--aurora":
                "repeating-linear-gradient(100deg,var(--red-base)_10%,var(--yellow-gold)_15%,var(--orange-glow)_20%,var(--red-dark)_25%,var(--amber-light)_30%)",

              "--dark-gradient":
                "repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)",

              "--white-gradient":
                "repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)",

              "--black": "#000",
              "--white": "#fff",
              "--transparent": "transparent"
            }
          }>
          <div
            //   I'm sorry but this is what peak developer performance looks like // trigger warning
            className={cn(
              `after:animate-aurora pointer-events-none absolute -inset-[10px] [background-image:var(--white-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] opacity-60 blur-[10px] invert filter will-change-transform [--aurora:repeating-linear-gradient(100deg,var(--red-base)_10%,var(--yellow-gold)_15%,var(--orange-glow)_20%,var(--red-dark)_25%,var(--amber-light)_30%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)] [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] after:[background-size:200%,_100%] after:[background-attachment:fixed] after:mix-blend-difference after:content-[""] dark:[background-image:var(--dark-gradient),var(--aurora)] dark:invert-0 after:dark:[background-image:var(--dark-gradient),var(--aurora)]`,
              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
            )}></div>
        </div>
        {children}
      </div>
    </main>
  );
};
