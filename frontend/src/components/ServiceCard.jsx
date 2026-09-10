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
      color: "text-[#75E063]",
      bg: "bg-[#75E063]/[0.06]",
      border: "border-[#75E063]/20",
      dot: "bg-[#75E063]",
      icon: CheckCircle2,
    }
  }

  if (status === "degraded") {
    return {
      label: "Degraded",
      color: "text-yellow-400",
      bg: "bg-yellow-400/[0.06]",
      border: "border-yellow-400/20",
      dot: "bg-yellow-400",
      icon: CircleAlert,
    }
  }

  return {
    label: "Offline",
    color: "text-red-400",
    bg: "bg-red-500/[0.06]",
    border: "border-red-500/20",
    dot: "bg-red-400",
    icon: CircleAlert,
  }
}

function IntelligenceRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-gray-600" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>

      <span className="text-xs font-medium text-gray-200">
        {value}
      </span>
    </div>
  )
}

export default function ServiceCard({ service }) {
  const [open, setOpen] = useState(false)

  const serviceName = service?.name || "unknown-service"
  const meta = serviceMeta[serviceName] || {
    label: formatServiceName(serviceName),
    description:
      service?.description ||
      "Production service monitored by Sentinel AI.",
    icon: Server,
  }

  const Icon = meta.icon
  const status = getStatusConfig(service?.status)

  const StatusIcon = status.icon

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#75E063]/20 hover:bg-white/[0.045] focus:outline-none focus:ring-1 focus:ring-[#75E063]/30"
      >
        {/* subtle hover atmosphere */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[#75E063]/[0.035] blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${status.border} ${status.bg}`}
              >
                <Icon className={`h-4.5 w-4.5 ${status.color}`} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {meta.label}
                </p>

                <p className="mt-0.5 truncate text-[10px] text-gray-600">
                  {serviceName}
                </p>
              </div>
            </div>

            <div
              className={`flex shrink-0 items-center gap-1.5 rounded-full border ${status.border} ${status.bg} px-2.5 py-1`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
              />

              <span
                className={`text-[9px] font-medium uppercase tracking-wider ${status.color}`}
              >
                {status.label}
              </span>
            </div>
          </div>

          <p className="mt-5 min-h-[40px] text-xs leading-5 text-gray-500">
            {meta.description}
          </p>

          <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-gray-600" />

              <span className="text-[10px] text-gray-600">
                Production monitored
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 transition-colors group-hover:text-[#75E063]">
              Inspect
              <ExternalLink className="h-3 w-3" />
            </div>
          </div>
        </div>
      </button>

      {/* SERVICE INTELLIGENCE DRAWER */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false)
            }
          }}
        >
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.10] bg-[#0b0c0f] shadow-2xl shadow-black/60">
            {/* top atmosphere */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#75E063]/[0.035] to-transparent" />

            <div className="relative">
              {/* HEADER */}
              <div className="flex items-start justify-between border-b border-white/[0.07] p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border ${status.border} ${status.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${status.color}`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">
                        {meta.label}
                      </h2>

                      <span
                        className={`flex items-center gap-1.5 rounded-full border ${status.border} ${status.bg} px-2 py-1`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                        />

                        <span
                          className={`text-[9px] uppercase tracking-wider ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-600">
                      {serviceName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-gray-500 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white"
                  aria-label="Close service intelligence"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* BODY */}
              <div className="space-y-6 p-6">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#75E063]">
                    Service Intelligence
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    {meta.description}
                  </p>
                </div>

                {/* HEALTH */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-300">
                      Current state
                    </p>

                    <span className="text-[10px] text-gray-600">
                      Live infrastructure
                    </span>
                  </div>

                  <div
                    className={`rounded-xl border ${status.border} ${status.bg} p-4`}
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon
                        className={`h-5 w-5 ${status.color}`}
                      />

                      <div>
                        <p className={`text-sm font-medium ${status.color}`}>
                          {status.label}
                        </p>

                        <p className="mt-1 text-[10px] text-gray-600">
                          Sentinel is monitoring this service.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* INTELLIGENCE */}
                <div>
                  <p className="mb-3 text-xs font-medium text-gray-300">
                    Operational signals
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <IntelligenceRow
                      icon={Activity}
                      label="Service status"
                      value={status.label}
                    />

                    <IntelligenceRow
                      icon={Cpu}
                      label="Compute"
                      value="Monitoring"
                    />

                    <IntelligenceRow
                      icon={MemoryStick}
                      label="Memory"
                      value="Monitoring"
                    />

                    <IntelligenceRow
                      icon={Gauge}
                      label="Latency"
                      value="Monitoring"
                    />

                    <IntelligenceRow
                      icon={HardDrive}
                      label="Storage"
                      value="Monitoring"
                    />

                    <IntelligenceRow
                      icon={Network}
                      label="Dependencies"
                      value="Connected"
                    />
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="border-t border-white/[0.07] pt-5">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-xs font-medium text-gray-300 transition hover:border-[#75E063]/20 hover:bg-[#75E063]/[0.04] hover:text-white"
                    >
                      <Activity className="h-3.5 w-3.5" />
                      Continue monitoring
                    </button>

                    <button
                      type="button"
                      disabled
                      className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#75E063]/15 bg-[#75E063]/[0.035] px-4 py-3 text-xs font-medium text-[#75E063]/50"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      AI investigation
                    </button>
                  </div>

                  <p className="mt-3 text-center text-[9px] text-gray-700">
                    AI investigation actions will connect to Sentinel's
                    incident engine in the next layer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}