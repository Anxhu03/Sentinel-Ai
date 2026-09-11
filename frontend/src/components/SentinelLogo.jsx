import React, { useId } from "react"

/**
 * SentinelLogo - Next-generation geometric neural vortex brand icon.
 * Inspired by modern AI aesthetics (geometric vortex iris, radiant purple/violet gradient,
 * clean futuristic typography).
 */
export default function SentinelLogo({
  size = 32,
  withText = true,
  variant = "gradient", // 'gradient' | 'white' | 'monochrome'
  subtitle = null,
  className = "",
  textClassName = "",
  animated = true,
  onClick = null,
}) {
  const gradientId = useId()
  const filterId = useId()

  const numBlades = 12
  const bladePath = "M 50 12 C 64 12 77 24 74 38 C 71 49 60 49 50 42"

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {/* GEOMETRIC VORTEX ICON */}
      <div
        style={{ width: size, height: size }}
        className={`relative shrink-0 flex items-center justify-center ${
          animated ? "group-hover:rotate-45 transition-transform duration-700 ease-out" : ""
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Radiant violet-indigo gradient matching reference image */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e879f9" />
              <stop offset="45%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>

            {/* Subtle optical glow filter */}
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Glowing background aura */}
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="url(#"
            className="opacity-0 group-hover:opacity-20 transition-opacity duration-500"
          />

          {/* 12-Blade Geometric Neural Vortex */}
          <g filter={`url(#${filterId})`}>
            {Array.from({ length: numBlades }).map((_, i) => (
              <path
                key={i}
                d={bladePath}
                fill="none"
                stroke={variant === "white" ? "#ffffff" : `url(#${gradientId})`}
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform={`rotate(${i * (360 / numBlades)} 50 50)`}
                opacity={0.92}
              />
            ))}

            {/* Central core beacon */}
            <circle
              cx="50"
              cy="50"
              r="3.5"
              fill="#ffffff"
              filter="drop-shadow(0 0 4px rgba(255,255,255,0.9))"
            />
          </g>
        </svg>
      </div>

      {/* TYPOGRAPHIC BRAND NAME */}
      {withText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-semibold tracking-[-0.03em] text-foreground transition-colors leading-none font-sans ${textClassName || "text-lg"}`}
            >
              sentinel
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400">
                AI
              </span>
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
