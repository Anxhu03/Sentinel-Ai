import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react"

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  status,
  trend,
  trendType = "up",
  delay = 0,
}) {
  const isIncident =
    title?.toLowerCase().includes("incident") ||
    String(value).toLowerCase().includes("degraded") ||
    String(value).toLowerCase().includes("critical")

  const isHealthy =
    title?.toLowerCase().includes("healthy") ||
    String(value).toLowerCase().includes("100%")

  return (
    <div
      className="group relative bg-card border border-border rounded-xl p-5 hover:border-accent/50 transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {/* SUBTLE CARD HOVER GLOW GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative">
        {/* HEADER ROW */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm text-muted-foreground font-medium truncate">
            {title}
          </span>
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors duration-300">
            {Icon && (
              <Icon className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
            )}
          </div>
        </div>

        {/* VALUE ROW */}
        <div className="flex items-end justify-between gap-3">
          <span className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            {value}
          </span>

          {trend ? (
            <div
              className={`flex items-center gap-1 text-sm font-medium mb-1 ${
                trendType === "down"
                  ? "text-destructive"
                  : trendType === "up"
                    ? "text-success"
                    : "text-muted-foreground"
              }`}
            >
              {trendType === "down" ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              <span>{trend}</span>
            </div>
          ) : status ? (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium mb-1 ${
                isIncident
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : isHealthy
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isIncident
                    ? "bg-destructive animate-pulse"
                    : isHealthy
                      ? "bg-success"
                      : "bg-muted-foreground"
                }`}
              />
              <span className="truncate max-w-[120px]">{status}</span>
            </div>
          ) : null}
        </div>

        {/* SUBTITLE */}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}