import { useState } from "react"
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Cpu,
  Database,
  ExternalLink,
  Gauge,
  HardDrive,
  MemoryStick,
  Network,
  Server,
  Shield,
  X,
  Zap,
} from "lucide-react"

const serviceMeta = {
  "auth-service": {
    label: "Authentication",
    description: "Handles user authentication and identity flows.",
    icon: Shield,
  },
  "product-service": {
    label: "Product Catalog",
    description: "Serves product catalog and product information.",
    icon: Database,
  },
  "inventory-service": {
    label: "Inventory",
    description: "Manages inventory availability and stock state.",
    icon: Server,
  },
  "payment-service": {
    label: "Payments",
    description: "Processes payment and checkout transactions.",
    icon: Zap,
  },
  "order-service": {
    label: "Orders",
    description: "Handles order creation and order processing.",
    icon: Activity,
  },
  "shipping-service": {
    label: "Shipping",
    description: "Manages shipment and delivery workflows.",
    icon: Network,
  },
  "notification-service": {
    label: "Notifications",
    description: "Handles transactional notifications and events.",
    icon: Gauge,
  },
}

function formatServiceName(name) {
  if (!name) return "Unknown Service"
  return name
    .replace(/-service$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getStatusConfig(status) {
  if (status === "healthy") {
    return {
      label: "Healthy",
      color: "text-success",
      bg: "bg-success/10",
      border: "border-success/20",
      dot: "bg-success",
      icon: CheckCircle2,
    }
  }

  if (status === "degraded") {
    return {
      label: "Degraded",
      color: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/20",
      dot: "bg-warning",
      icon: CircleAlert,
    }
  }

  return {
    label: "Offline",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    dot: "bg-destructive",
    icon: CircleAlert,
  }
}

function IntelligenceRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/50 border border-border px-3 py-2 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-accent" />
        <span>{label}</span>
      </div>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  )
}

export default function ServiceCard({ service, onInvestigate }) {
  const [open, setOpen] = useState(false)

  const serviceName = service?.name || "unknown-service"
  const meta = serviceMeta[serviceName] || {
    label: formatServiceName(serviceName),
    description: service?.description || "Sentinel registered production service.",
    icon: Server,
  }

  const Icon = meta.icon
  const status = getStatusConfig(service?.status)
  const StatusIcon = status.icon

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group relative bg-card border border-border rounded-xl p-5 hover:border-accent/50 transition-all duration-300 overflow-hidden cursor-pointer"
      >
        {/* SUBTLE CARD HOVER GLOW GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative">
          {/* TOP ROW */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors duration-300">
                <Icon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight group-hover:text-accent transition-colors duration-200">
                  {meta.label}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {serviceName}
                </p>
              </div>
            </div>

            <span
              className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${status.border} ${status.bg} ${status.color}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              <span>{status.label}</span>
            </span>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
            {meta.description}
          </p>

          {/* FOOTER STATS */}
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-accent" />
              <span>Docker Mesh</span>
            </div>
            <span className="group-hover:translate-x-0.5 group-hover:text-accent transition-all text-xs font-medium flex items-center gap-1">
              Details <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* SERVICE DETAILS MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl p-6 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight">
                    {meta.label}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">{serviceName}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Description
                </span>
                <p className="text-sm text-foreground mt-1 leading-relaxed">
                  {meta.description}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Status & Operational Signals
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <IntelligenceRow icon={Activity} label="Mesh State" value={status.label} />
                  <IntelligenceRow icon={Cpu} label="Compute Utilization" value="Normal (42%)" />
                  <IntelligenceRow icon={MemoryStick} label="Memory Load" value="Stable (48%)" />
                  <IntelligenceRow icon={Gauge} label="API Latency" value="120 ms" />
                  <IntelligenceRow icon={HardDrive} label="Storage Health" value="Optimal" />
                  <IntelligenceRow icon={Network} label="Topology Link" value="Connected" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
              >
                Close
              </button>
              {onInvestigate && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onInvestigate(serviceName)
                  }}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Investigate with AI
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}