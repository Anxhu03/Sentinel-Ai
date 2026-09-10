import { Activity, CheckCircle2, Clock3, Shield } from "lucide-react"

function ExecutionFeed() {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 shadow-sm">
            <Activity className="h-5 w-5 text-accent" />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
              Live Operations
            </p>

            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
              Execution Feed
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-medium text-foreground/80">Monitoring</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-secondary/30 p-4 transition-colors hover:border-border hover:bg-secondary/50">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground/90">
              Sentinel AI monitoring engine initialized & listening.
            </p>

            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Clock3 className="h-3 w-3" />
              Real-time telemetry streaming active
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-secondary/20 p-4 transition-colors hover:border-border hover:bg-secondary/40">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              Autonomous remediation guardrails enabled.
            </p>

            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
              Automated rollback, restart, and scaling actions will be logged here in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExecutionFeed