import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle2, Network, RefreshCw } from "lucide-react"

const API_URL = "http://localhost:8000"

function formatServiceName(name) {
  if (!name) return "Unknown"
  return name
    .replace(/-service$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function DependencyGraph() {
  const [graph, setGraph] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchDependencies = () => {
    setLoading(true)
    fetch(`${API_URL}/api/dependencies/`)
      .then((res) => res.json())
      .then((data) => setGraph(data))
      .catch((err) => console.error("Dependency graph error:", err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDependencies()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">
        <RefreshCw className="mr-2.5 h-4 w-4 animate-spin text-accent" />
        Mapping service dependency graph...
      </div>
    )
  }

  if (!graph) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-400">
        Unable to load live dependency graph from Sentinel backend.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 shadow-sm">
            <Network className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Service Dependency Architecture
            </h2>
            <p className="text-xs text-muted-foreground">
              Live dependency topology detected and verified across distributed microservices
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchDependencies}
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 px-3.5 py-2 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:bg-secondary hover:text-foreground active:scale-[0.98]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Topology
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {graph.services.map((service) => {
          const dependencies = graph.dependencies
            .filter((item) => item.service === service)
            .map((item) => item.depends_on)

          return (
            <div
              key={service}
              className="group rounded-xl border border-border/70 bg-secondary/30 p-5 transition-all duration-200 hover:border-accent/40 hover:bg-secondary/50 hover:shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {formatServiceName(service)}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">{service}</p>
                  </div>
                </div>

                <span className="rounded-full border border-border/80 bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {dependencies.length} dep{dependencies.length === 1 ? "" : "s"}
                </span>
              </div>

              {dependencies.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Downstream Calls
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {dependencies.map((dependency) => (
                      <div
                        key={dependency}
                        className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-xs font-medium text-foreground/90 transition-colors group-hover:border-border"
                      >
                        <ArrowRight className="h-3.5 w-3.5 text-accent" />
                        <span className="truncate">{dependency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/70" />
                  Independent root service
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DependencyGraph
