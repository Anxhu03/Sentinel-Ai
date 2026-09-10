export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  status,
}) {
  const isIncident =
    title?.toLowerCase().includes("incident")

  const isHealthy =
    title?.toLowerCase().includes("healthy")

  const isAI =
    title?.toLowerCase().includes("ai")

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.045] via-[#11131A]/80 to-violet-500/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.13] hover:shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      {/* COLOR ATMOSPHERE */}
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100 ${
          isIncident
            ? "bg-red-500/[0.07]"
            : isAI
              ? "bg-violet-500/[0.09]"
              : isHealthy
                ? "bg-[#75E063]/[0.07]"
                : "bg-indigo-500/[0.07]"
        } opacity-70`}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-gray-600">
              {title}
            </p>

            <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
              {value}
            </p>

            <p className="mt-2 text-[10px] leading-4 text-gray-600">
              {subtitle}
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.025] to-violet-500/[0.04]">
            {Icon && (
              <Icon className="h-[18px] w-[18px] text-[#75E063]" />
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4">
          <span className="h-1.5 w-1.5 rounded-full bg-[#75E063] shadow-[0_0_7px_#75E063]" />

          <span className="text-[9px] font-medium text-[#75E063]/80">
            {status}
          </span>
        </div>
      </div>
    </div>
  )
}