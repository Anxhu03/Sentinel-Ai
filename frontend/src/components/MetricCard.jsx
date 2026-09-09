import { Activity } from "lucide-react"

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon = Activity,
  status,
}) {
  return (
    <div className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#75E063]/20 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-600">
            {title}
          </p>

          <h3 className="mt-3 text-2xl font-semibold text-white">
            {value}
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            {subtitle}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#75E063]/20 bg-[#75E063]/5">
          <Icon className="h-5 w-5 text-[#75E063]" />
        </div>
      </div>

      {status && (
        <div className="mt-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#75E063]" />

          <span className="text-[11px] text-[#75E063]">
            {status}
          </span>
        </div>
      )}
    </div>
  )
}

export default MetricCard