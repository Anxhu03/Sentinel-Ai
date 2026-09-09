import {
  Activity,
  Database,
  CreditCard,
  Package,
  ShoppingCart,
  Truck,
  Bell,
  UserRound,
} from "lucide-react"

const serviceIcons = {
  "auth-service": UserRound,
  "product-service": Package,
  "inventory-service": Database,
  "payment-service": CreditCard,
  "order-service": ShoppingCart,
  "shipping-service": Truck,
  "notification-service": Bell,
}

function ServiceCard({ name, status = "healthy", description }) {
  const Icon = serviceIcons[name] || Activity

  const isHealthy = status === "healthy"

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#75E063]/20 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>

          <div>
            <h3 className="text-sm font-medium text-white">
              {name}
            </h3>

            <p className="mt-1 text-[11px] text-gray-600">
              {description || "Production service"}
            </p>
          </div>
        </div>

        <span
          className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] ${
            isHealthy
              ? "bg-[#75E063]/10 text-[#75E063]"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isHealthy ? "bg-[#75E063]" : "bg-red-400"
            }`}
          />

          {status}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-600">
            Requests
          </p>

          <p className="mt-1 text-xs text-gray-400">
            1.2k/min
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-600">
            Latency
          </p>

          <p className="mt-1 text-xs text-gray-400">
            42ms
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-600">
            Errors
          </p>

          <p className="mt-1 text-xs text-[#75E063]">
            0.02%
          </p>
        </div>
      </div>
    </div>
  )
}

export default ServiceCard