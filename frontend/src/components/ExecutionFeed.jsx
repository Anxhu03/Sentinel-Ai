import { Activity, CheckCircle2, Clock3 } from "lucide-react"

function ExecutionFeed() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#75E063]/20 bg-[#75E063]/10">
            <Activity className="h-5 w-5 text-[#75E063]" />
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#75E063]">
              Live Operations
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Execution Feed
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="h-1.5 w-1.5 rounded-full bg-[#75E063]" />
          Monitoring
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/10 p-4">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#75E063]" />

          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-300">
              Sentinel AI monitoring engine initialized.
            </p>

            <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-600">
              <Clock3 className="h-3 w-3" />
              Live monitoring
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/10 p-4">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />

          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-500">
              Waiting for production events...
            </p>

            <p className="mt-1 text-[11px] text-gray-700">
              Incident executions will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExecutionFeed