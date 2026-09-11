import {
  Activity,
  Brain,
  ChevronLeft,
  ChevronRight,
  Database,
  GitBranch,
  History,
  LayoutDashboard,
  Radio,
  Settings,
  Shield,
  ShieldCheck,
  Wrench,
  Sparkles,
} from "lucide-react"
import { useEffect, useState } from "react"
import SentinelLogo from "./SentinelLogo"

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
  { label: "Public Site", icon: Sparkles, page: "Landing" },
  { label: "System Health", icon: ShieldCheck, page: "System Health" },
  { label: "Settings", icon: Settings, page: "Settings" },
]

const getCurrentPage = () => {
  const hash = window.location.hash.replace(/^#/, "")
  const path = window.location.pathname.replace(/^\/+/, "").replace(/^app\//, "")
  const target = hash || path
  if (!target) return "Overview"
  try {
    const decoded = decodeURIComponent(target).replace(/^\/+/, "").replace(/^app\//, "")
    const lower = decoded.toLowerCase().trim()
    if (lower === "services") return "Services"
    if (lower === "dependencies") return "Dependencies"
    if (lower === "monitoring") return "Monitoring"
    if (lower === "ai-investigation" || lower === "ai investigation") return "AI Investigation"
    if (lower === "remediation") return "Remediation"
    if (lower === "memory" || lower === "incident memory" || lower === "incident-memory") return "Incident Memory"
    if (lower === "system health" || lower === "system-health") return "System Health"
    if (lower === "settings") return "Settings"
    return decoded
  } catch {
    return "Overview"
  }
}

export default function Sidebar({ collapsed, onToggleCollapse, activePage, onNavigate }) {
  const [active, setActive] = useState(getCurrentPage)

  useEffect(() => {
    const handleNavigation = () => {
      setActive(getCurrentPage())
    }

    window.addEventListener("hashchange", handleNavigation)
    window.addEventListener("popstate", handleNavigation)
    return () => {
      window.removeEventListener("hashchange", handleNavigation)
      window.removeEventListener("popstate", handleNavigation)
    }
  }, [])

  const currentActive = activePage || active

  const navigate = (label) => {
    setActive(label)
    if (onNavigate) {
      onNavigate(label)
    } else {
      const newHash = encodeURIComponent(label)
      if (window.location.hash.replace("#", "") === newHash) {
        window.dispatchEvent(new HashChangeEvent("hashchange"))
        return
      }
      window.location.hash = newHash
    }
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out flex flex-col ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* BRAND HEADER */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 overflow-hidden px-1">
          <SentinelLogo
            size={32}
            withText={!collapsed}
            subtitle={!collapsed ? "Operations Core" : null}
          />
        </div>
      </div>

      {/* NAVIGATION ITEMS */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <div className="px-3 py-1 mb-1">
            <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              Operations
            </span>
          </div>
        )}

        {primaryNavigation.map((item) => {
          const Icon = item.icon
          const isActive = currentActive === item.label

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.label)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              {/* ACTIVE LEFT PILL */}
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-accent transition-all duration-300 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              />

              <Icon
                className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                  isActive
                    ? "text-accent"
                    : "text-muted-foreground group-hover:text-sidebar-foreground group-hover:scale-110"
                }`}
              />

              <span
                className={`whitespace-nowrap transition-all duration-300 truncate text-left flex-1 ${
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}
              >
                {item.label}
              </span>

              {!collapsed && item.badge && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent/15 text-accent border border-accent/20">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}

        <div className="pt-4 pb-2">
          <div className="h-px bg-sidebar-border/80 my-1 mx-2" />
        </div>

        {!collapsed && (
          <div className="px-3 py-1 mb-1">
            <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              System
            </span>
          </div>
        )}

        {systemNavigation.map((item) => {
          const Icon = item.icon
          const targetPage = item.page || item.label
          const isActive = currentActive === targetPage

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(targetPage)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-accent transition-all duration-300 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              />

              <Icon
                className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                  isActive
                    ? "text-accent"
                    : "text-muted-foreground group-hover:text-sidebar-foreground group-hover:scale-110"
                }`}
              />

              <span
                className={`whitespace-nowrap transition-all duration-300 truncate text-left flex-1 ${
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* SYSTEM STATUS PILL (WHEN EXPANDED) */}
      {!collapsed && (
        <div className="p-3 mx-3 mb-2 rounded-xl bg-secondary/50 border border-border/60 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <div className="truncate">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  Mesh Connected
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  7 Services Active
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-success/10 text-success border border-success/20">
              Live
            </span>
          </div>
        </div>
      )}

      {/* COLLAPSE TOGGLE FOOTER */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 transition-transform duration-200" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 transition-transform duration-200" />
              <span className="whitespace-nowrap text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}