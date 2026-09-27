import type { GlyphId } from "@/types/patient";

type GlyphProps = {
  glyph: GlyphId;
  size?: number;
  className?: string;
};

export function Glyph({ glyph, size = 32, className = "" }: GlyphProps) {
  const common = { fill: "currentColor" };

  return (
    <svg
      aria-hidden="true"
      className={className}
      height={size}
      viewBox="0 0 64 64"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {glyph === "circle" && <circle cx="32" cy="32" r="23" {...common} />}
      {glyph === "triangle" && <path d="M32 9 58 55H6L32 9Z" {...common} />}
      {glyph === "square" && <rect height="42" rx="5" width="42" x="11" y="11" {...common} />}
      {glyph === "diamond" && <path d="M32 6 58 32 32 58 6 32 32 6Z" {...common} />}
      {glyph === "hexagon" && <path d="M20 8h24l14 24-14 24H20L6 32 20 8Z" {...common} />}
      {glyph === "star" && <path d="m32 6 7 17 18 1-14 12 5 18-16-10-16 10 5-18L7 24l18-1 7-17Z" {...common} />}
      {glyph === "crescent" && <path d="M45 55A25 25 0 1 1 45 9 19 19 0 1 0 45 55Z" {...common} />}
      {glyph === "leaf" && <path d="M54 10C33 9 14 20 11 39c-2 13 9 21 20 14 12-7 20-22 23-43ZM17 48c10-8 19-15 30-29" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="6" />}
    </svg>
  );
}
