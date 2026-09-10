import {
  Activity,
  Brain,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Database,
  GitBranch,
  History,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Siren,
  Wrench,
} from "lucide-react"
import { useEffect, useState } from "react"

const primaryNavigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Monitoring", icon: Activity },
  { label: "AI Investigation", icon: Brain, badge: "AI" },
  { label: "Services", icon: Database },
  { label: "Dependencies", icon: GitBranch },
  { label: "Remediation", icon: Wrench },
  { label: "Incident Memory", icon: History },
]

const systemNavigation = [
  { label: "System Health", icon: ShieldCheck },
  { label: "Settings", icon: Settings },
]

const getCurrentPage = () => {
  const hash = window.location.hash.replace(/^#/, "")

  if (!hash) {
    return "Overview"
  }

  try {
    return decodeURIComponent(hash)
  } catch {
    return "Overview"
  }
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [active, setActive] = useState(getCurrentPage)

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sentinel-sidebar-width",
      collapsed ? "76px" : "252px"
    )

    return () => {
      document.documentElement.style.removeProperty(
        "--sentinel-sidebar-width"
      )
    }
  }, [collapsed])

  useEffect(() => {
    const handleNavigation = () => {
      setActive(getCurrentPage())
    }

    window.addEventListener("hashchange", handleNavigation)

    return () => {
      window.removeEventListener("hashchange", handleNavigation)
    }
  }, [])

  const navigate = (label) => {
    setActive(label)

    const newHash = encodeURIComponent(label)

    if (window.location.hash.replace("#", "") === newHash) {
      window.dispatchEvent(new HashChangeEvent("hashchange"))
      return
    }

    window.location.hash = newHash
  }

  return (
    <aside
      className={`sentinel-sidebar sticky top-0 z-50 flex h-dvh min-h-0 shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#08090D] transition-[width] duration-300 ${
        collapsed ? "w-[76px]" : "w-[252px]"
      }`}
    >
      {/* AMBIENT GLOW */}
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-full overflow-hidden">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-600/[0.08] blur-3xl" />
        <div className="absolute right-0 top-16 h-40 w-40 rounded-full bg-indigo-500/[0.05] blur-3xl" />
      </div>

      {/* BRAND */}
      <div className="relative flex h-[76px] shrink-0 items-center border-b border-white/[0.07] px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 via-indigo-500/10 to-[#75E063]/10 shadow-[0_0_25px_rgba(139,92,246,0.08)]">
            <CircleGauge className="h-[18px] w-[18px] text-violet-300" />

            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#75E063] shadow-[0_0_8px_#75E063]" />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold tracking-tight text-white">
                Sentinel AI
              </p>

              <p className="mt-0.5 truncate text-[8px] font-medium uppercase tracking-[0.24em] text-violet-300/50">
                Operations Core
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WORKSPACE */}
      {!collapsed && (
        <div className="relative shrink-0 px-4 pt-5">
          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br from-violet-500/[0.055] via-white/[0.018] to-[#75E063]/[0.025] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#75E063] shadow-[0_0_9px_#75E063]" />

                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-gray-300">
                    Production
                  </p>

                  <p className="mt-0.5 text-[8px] text-gray-600">
                    Live environment
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-md border border-[#75E063]/15 bg-[#75E063]/[0.05] px-2 py-1 text-[7px] font-semibold uppercase tracking-wider text-[#75E063]">
                Live
              </span>
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION */}
      <nav className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 [scrollbar-width:thin]">
        {!collapsed && (
          <p className="mb-3 px-3 text-[8px] font-semibold uppercase tracking-[0.2em] text-gray-700">
            Workspace
          </p>
        )}

        <div className="space-y-1">
          {primaryNavigation.map((item) => {
            const Icon = item.icon
            const isActive = active === item.label

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.label)}
                title={collapsed ? item.label : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                  isActive
                    ? "border border-violet-400/15 bg-gradient-to-r from-violet-500/[0.13] via-indigo-500/[0.07] to-transparent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]"
                    : "border border-transparent text-gray-600 hover:border-white/[0.05] hover:bg-white/[0.025] hover:text-gray-300"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />
                )}

                <Icon
                  className={`h-[17px] w-[17px] shrink-0 transition-colors ${
                    isActive
                      ? "text-violet-300"
                      : "text-gray-700 group-hover:text-gray-400"
                  }`}
                />

                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                      {item.label}
                    </span>

                    {item.badge && (
                      <span className="shrink-0 rounded-md border border-violet-400/15 bg-violet-400/[0.06] px-1.5 py-0.5 text-[7px] font-semibold text-violet-300">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

        <div className="my-6 h-px shrink-0 bg-white/[0.06]" />

        {!collapsed && (
          <p className="mb-3 px-3 text-[8px] font-semibold uppercase tracking-[0.2em] text-gray-700">
            System
          </p>
        )}

        <div className="space-y-1">
          {systemNavigation.map((item) => {
            const Icon = item.icon
            const isActive = active === item.label

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.label)}
                title={collapsed ? item.label : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                  isActive
                    ? "border-violet-400/15 bg-violet-500/[0.08] text-white"
                    : "border-transparent text-gray-600 hover:border-white/[0.05] hover:bg-white/[0.025] hover:text-gray-300"
                }`}
              >
                <Icon
                  className={`h-[17px] w-[17px] shrink-0 ${
                    isActive
                      ? "text-violet-300"
                      : "text-gray-700 group-hover:text-gray-400"
                  }`}
                />

                {!collapsed && (
                  <span className="truncate text-[11px] font-medium">
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* ENGINE STATUS */}
      {!collapsed && (
        <div className="relative mx-3 mb-3 shrink-0 overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-br from-[#75E063]/[0.045] via-white/[0.018] to-violet-500/[0.04] p-3.5">
          <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-[#75E063]/[0.04] blur-2xl" />

          <div className="relative flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#75E063]/15 bg-[#75E063]/[0.05]">
              <Siren className="h-3.5 w-3.5 text-[#75E063]" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[9px] font-medium text-gray-300">
                Sentinel Engine
              </p>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#75E063] shadow-[0_0_7px_#75E063]" />

                <span className="text-[8px] text-[#75E063]">
                  Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COLLAPSE */}
      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <button
          type="button"
          onClick={() =>
            setCollapsed((value) => !value)
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] py-2 text-gray-600 transition hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-gray-300"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />

              <span className="text-[9px] font-medium">
                Collapse
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}