import { useEffect, useMemo, useRef, useState } from "react"
import {
  Bell,
  Search,
  ArrowRight,
  X,
  Settings,
  Activity,
  Brain,
  Server,
  GitBranch,
  Wrench,
  History,
  ShieldCheck,
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  User,
  ChevronDown,
  ExternalLink,
  Shield,
  Zap,
  KeyRound,
  Sparkles,
  LogOut,
} from "lucide-react"

const API_BASE = "http://127.0.0.1:8000"

const NAVIGATION = [
  {
    label: "Overview",
    description: "Enterprise operations dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Monitoring",
    description: "Live telemetry and infrastructure metrics",
    icon: Activity,
  },
  {
    label: "AI Investigation",
    description: "Investigate incidents with Sentinel AI",
    icon: Brain,
  },
  {
    label: "Services",
    description: "Production service health",
    icon: Server,
  },
  {
    label: "Dependencies",
    description: "Service dependency intelligence",
    icon: GitBranch,
  },
  {
    label: "Remediation",
    description: "Incident recovery and remediation",
    icon: Wrench,
  },
  {
    label: "Incident Memory",
    description: "Historical incident intelligence",
    icon: History,
  },
  {
    label: "System Health",
    description: "Sentinel system health",
    icon: ShieldCheck,
  },
  {
    label: "Settings",
    description: "Sentinel configuration",
    icon: Settings,
  },
]

function navigateTo(label) {
  const nextHash = encodeURIComponent(label)
  if (window.location.hash === `#${nextHash}`) {
    window.dispatchEvent(new HashChangeEvent("hashchange"))
    return
  }
  window.location.hash = nextHash
}

function getCurrentPage() {
  const hash = window.location.hash.replace(/^#/, "")
  if (!hash) return "Overview"
  try {
    return decodeURIComponent(hash)
  } catch {
    return "Overview"
  }
}

export default function Topbar({ onTriggerIncident, user, onLogout }) {
  const [currentPage, setCurrentPage] = useState(getCurrentPage)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [query, setQuery] = useState("")

  const [metrics, setMetrics] = useState(null)
  const [services, setServices] = useState([])
  const [notificationsRead, setNotificationsRead] = useState(false)

  const searchInputRef = useRef(null)
  const profileRef = useRef(null)
  const notificationRef = useRef(null)

  useEffect(() => {
    const handleHash = () => setCurrentPage(getCurrentPage())
    window.addEventListener("hashchange", handleHash)
    return () => window.removeEventListener("hashchange", handleHash)
  }, [])

  useEffect(() => {
    if (!searchOpen) return
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [searchOpen])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
        setNotificationOpen(false)
        setProfileOpen(false)
      }
      if (event.key === "Escape") {
        setSearchOpen(false)
        setNotificationOpen(false)
        setProfileOpen(false)
        setQuery("")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  const fetchNotificationData = async () => {
    try {
      const [metricsResponse, servicesResponse] = await Promise.all([
        fetch(`${API_BASE}/api/metrics/`),
        fetch(`${API_BASE}/api/services/`),
      ])

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData)
      }

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json()
        setServices(Array.isArray(servicesData) ? servicesData : [])
      }
    } catch (error) {
      console.error("Topbar data error:", error)
    }
  }

  useEffect(() => {
    fetchNotificationData()
    const interval = setInterval(fetchNotificationData, 10000)
    return () => clearInterval(interval)
  }, [])

  const notifications = useMemo(() => {
    const items = []
    const degraded = services.filter((s) => s.status !== "healthy")

    degraded.forEach((service) => {
      items.push({
        id: `service-${service.id}`,
        title: `${service.name} is degraded`,
        message: "Production service requires remediation or restart.",
        type: "critical",
        action: "Remediation",
        time: "Active now",
      })
    })

    if (metrics?.incident_active) {
      items.push({
        id: "active-incident",
        title: "Active Outage Detected",
        message: `Incident condition: ${metrics.incident_type || "anomaly"} detected in fleet telemetry.`,
        type: "critical",
        action: "AI Investigation",
        time: "Active now",
      })
    }

    if (metrics?.error_rate >= 5) {
      items.push({
        id: "high-error-rate",
        title: "Elevated Error Rate",
        message: `Current error rate is ${metrics.error_rate}%, above threshold.`,
        type: "warning",
        action: "Monitoring",
        time: "Telemetry alert",
      })
    }

    if (metrics?.api_latency >= 400) {
      items.push({
        id: "high-latency",
        title: "API Latency Degradation",
        message: `Current API latency is ${metrics.api_latency}ms.`,
        type: "warning",
        action: "Monitoring",
        time: "Telemetry alert",
      })
    }

    return items
  }, [metrics, services])

  const unreadCount = notificationsRead ? 0 : notifications.length

  const filteredNavigation = useMemo(() => {
    if (!query.trim()) return NAVIGATION
    const q = query.toLowerCase()
    return NAVIGATION.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    )
  }, [query])

  const healthyCount = services.filter((s) => s.status === "healthy").length

  return (
    <>
      <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 transition-all duration-200">
        {/* LEFT: PAGE TITLE & CONTEXT BADGE */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {currentPage}
          </h1>

          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span>Mesh Live • 7 Microservices</span>
          </div>
        </div>

        {/* RIGHT: SEARCH, NOTIFICATIONS, PROFILE */}
        <div className="flex items-center gap-3">
          {/* SEARCH BAR INPUT */}
          <div className="relative flex items-center transition-all duration-300 w-44 sm:w-56 focus-within:w-64">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              onClick={() => setSearchOpen(true)}
              readOnly
              className="w-full h-9 pl-9 pr-9 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 cursor-pointer"
            />
            <kbd className="hidden sm:inline-block absolute right-2.5 text-[10px] font-mono text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border">
              ⌘K
            </kbd>
          </div>

          {/* NOTIFICATION BELL */}
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationOpen((prev) => !prev)
                setNotificationsRead(true)
                setProfileOpen(false)
              }}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-secondary/80 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
              )}
            </button>

            {/* NOTIFICATION POPOVER */}
            {notificationOpen && (
              <div className="absolute right-0 top-11 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-accent" />
                    <h4 className="text-sm font-semibold text-foreground">Alerts & Notifications</h4>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {notifications.length} active
                  </span>
                </div>

                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          navigateTo(n.action)
                          setNotificationOpen(false)
                        }}
                        className="p-2.5 rounded-lg bg-secondary/60 hover:bg-secondary border border-border/50 transition-all duration-150 cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-accent">
                          <span>Open {n.action}</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <CheckCircle2 className="w-8 h-8 text-success/60 mx-auto mb-2" />
                      <p className="text-xs font-medium text-foreground">All systems normal</p>
                      <p className="text-[11px] mt-0.5">No critical alerts or degraded services.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PUBLIC SITE LINK */}
          <button
            type="button"
            onClick={() => navigateTo("Landing")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg border border-border transition-colors cursor-pointer"
            title="View SaaS Landing Page"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Public Site</span>
          </button>

          {/* USER / OPERATOR AVATAR */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((prev) => !prev)
                setNotificationOpen(false)
              }}
              className="w-9 h-9 rounded-lg overflow-hidden bg-secondary border border-border ring-2 ring-transparent hover:ring-accent/40 transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              <div className="w-full h-full bg-gradient-to-br from-accent/80 to-chart-1 flex items-center justify-center text-xs font-semibold text-white uppercase">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : "SA"}
              </div>
            </button>

            {/* PROFILE POPOVER */}
            {profileOpen && (
              <div className="absolute right-0 top-11 w-64 bg-card border border-border rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-chart-1 flex items-center justify-center text-sm font-bold text-white shadow-sm uppercase">
                    {user?.username ? user.username.substring(0, 2).toUpperCase() : "SA"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {user?.username || "SRE Operator"}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.role ? `${user.role.toUpperCase()} • Active` : "Sentinel Mesh Admin"}
                    </p>
                  </div>
                </div>

                <div className="py-3 border-b border-border space-y-1 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Registered Services:</span>
                    <span className="font-semibold text-foreground">{services.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Healthy Fleet:</span>
                    <span className="font-semibold text-success">{healthyCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Degraded:</span>
                    <span className={`font-semibold ${services.length - healthyCount > 0 ? "text-destructive" : "text-foreground"}`}>
                      {services.length - healthyCount}
                    </span>
                  </div>
                </div>

                <div className="pt-3 space-y-1">
                  <button
                    onClick={() => {
                      navigateTo("Landing")
                      setProfileOpen(false)
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>View Public Showcase</span>
                  </button>
                  <button
                    onClick={() => {
                      navigateTo("Settings")
                      setProfileOpen(false)
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  >
                    System Settings
                  </button>
                  <button
                    onClick={() => {
                      navigateTo("Incident Memory")
                      setProfileOpen(false)
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  >
                    Incident Memory Log
                  </button>

                  {user ? (
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        if (onLogout) onLogout()
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2 cursor-pointer pt-2 border-t border-border mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out ({user.username})</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        navigateTo("Login")
                        setProfileOpen(false)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-accent hover:bg-accent/10 transition-colors flex items-center gap-2 cursor-pointer pt-2 border-t border-border mt-1 font-semibold"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Sign In / Register</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* SEARCH COMMAND PALETTE MODAL (CMD+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="relative flex items-center border-b border-border px-4">
              <Search className="w-4 h-4 text-muted-foreground shrink-0 mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or jump to page..."
                className="w-full h-12 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    onClick={() => {
                      navigateTo(item.label)
                      setSearchOpen(false)
                      setQuery("")
                    }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/80 text-foreground cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </div>
                )
              })}
            </div>

            <div className="p-2.5 border-t border-border bg-secondary/30 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Navigation commands</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}