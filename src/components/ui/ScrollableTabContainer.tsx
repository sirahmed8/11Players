"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/components/ui/ThemeProvider";

interface Props {
  children: React.ReactNode;
  className?: string;
  showButtons?: boolean;
}

export default function ScrollableTabContainer({
  children,
  className = "",
  showButtons = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isRTL } = useLocale();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mouse drag state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasDragged = useRef(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;

    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 1) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const currentScroll = Math.abs(scrollLeft);
    setCanScrollLeft(currentScroll > 4 || (isRTL && currentScroll < maxScroll - 4));
    setCanScrollRight(currentScroll < maxScroll - 4 || (isRTL && currentScroll > 4));
  }, [isRTL]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    // Mouse wheel horizontal scroll on PC
    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          const scrollDelta = isRTL ? -e.deltaY : e.deltaY;
          el.scrollBy({
            left: scrollDelta,
            behavior: "auto",
          });
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      el.removeEventListener("wheel", handleWheel);
    };
  }, [checkScroll, isRTL]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftStart.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const el = containerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasDragged.current = true;
    }
    el.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
      hasDragged.current = false;
    }
  };

  const scrollByAmount = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.6;
    const targetLeft =
      direction === "left"
        ? isRTL ? distance : -distance
        : isRTL ? -distance : distance;
    el.scrollBy({ left: targetLeft, behavior: "smooth" });
  };

  return (
    <div className={`relative group/scroll-container flex items-center w-full ${className}`}>
      {/* Scroll Left Button (PC / Desktop) */}
      {showButtons && (
        <button
          type="button"
          onClick={() => scrollByAmount("left")}
          aria-label="Scroll Left"
          className={`
            absolute left-1 z-30 p-1.5 rounded-full
            bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80
            text-slate-300 hover:text-white shadow-xl backdrop-blur-md
            transition-all duration-200
            hidden md:flex items-center justify-center
            ${canScrollLeft ? "opacity-90 hover:opacity-100 scale-100" : "opacity-0 pointer-events-none scale-90"}
          `}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Main Scrollable Content Track */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onClickCapture={handleClickCapture}
        className="
          w-full flex items-center overflow-x-auto no-scrollbar scroll-smooth
          touch-pan-x select-none cursor-grab active:cursor-grabbing
          py-0.5 px-0.5
        "
      >
        {children}
      </div>

      {/* Scroll Right Button (PC / Desktop) */}
      {showButtons && (
        <button
          type="button"
          onClick={() => scrollByAmount("right")}
          aria-label="Scroll Right"
          className={`
            absolute right-1 z-30 p-1.5 rounded-full
            bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80
            text-slate-300 hover:text-white shadow-xl backdrop-blur-md
            transition-all duration-200
            hidden md:flex items-center justify-center
            ${canScrollRight ? "opacity-90 hover:opacity-100 scale-100" : "opacity-0 pointer-events-none scale-90"}
          `}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
