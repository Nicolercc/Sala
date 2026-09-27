"use client";

import { useEffect, useRef, useState } from "react";

export function IdleBlur({ children }: { children: React.ReactNode }) {
  const [idle, setIdle] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let timeoutId = window.setTimeout(() => setIdle(true), 60_000);
    const reset = () => {
      setIdle(false);
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setIdle(true), 60_000);
    };

    window.addEventListener("keydown", reset);
    window.addEventListener("pointerdown", reset);
    window.addEventListener("touchstart", reset);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("touchstart", reset);
    };
  }, []);

  useEffect(() => {
    const element = contentRef.current as (HTMLDivElement & { inert?: boolean }) | null;
    if (element) {
      element.inert = idle;
    }
    if (idle) {
      resumeRef.current?.focus();
    }
  }, [idle]);

  return (
    <div className="relative">
      <div aria-hidden={idle ? "true" : undefined} className={idle ? "blur-sm select-none" : ""} ref={contentRef}>
        {children}
      </div>
      {idle ? (
        <div className="absolute inset-0 grid place-items-center bg-surface-base/80 p-6">
          <button className="button-primary" onClick={() => setIdle(false)} ref={resumeRef} type="button">
            Resume
          </button>
        </div>
      ) : null}
    </div>
  );
}
