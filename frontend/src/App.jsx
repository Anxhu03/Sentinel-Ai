import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Brain,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Gauge,
  GitBranch,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  MemoryStick,
  Network,
  Play,
  Radio,
  RefreshCw,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Terminal,
  TrendingDown,
  TrendingUp,
  User,
  Wrench,
  X,
  Zap,
} from "lucide-react"

import Sidebar from "./components/Sidebar"
import Topbar from "./components/Topbar"
import ServiceCard from "./components/ServiceCard"
import MetricCard from "./components/MetricCard"
import AIInvestigation from "./components/AIInvestigation"
import MetricChart from "./components/MetricChart"
import WhatIfSimulationPanel from "./components/WhatIfSimulationPanel"
import LandingPage from "./pages/LandingPage"
import AuthPage from "./pages/AuthPage"
import { ThemeToggle } from "./context/ThemeContext"

const API_BASE = "http://127.0.0.1:8000"

const ROUTE_ALIASES = {
  "/": "Landing",
  "landing": "Landing",
  "/landing": "Landing",
  "/login": "Login",
  "login": "Login",
  "/signup": "Signup",
  "signup": "Signup",
  "/app": "Overview",
  "app": "Overview",
  "overview": "Overview",
  "/app/overview": "Overview",
  "/app/monitoring": "Monitoring",
  "monitoring": "Monitoring",
  "/app/ai-investigation": "AI Investigation",
  "ai investigation": "AI Investigation",
  "ai-investigation": "AI Investigation",
  "/app/services": "Services",
  "services": "Services",
  "/app/dependencies": "Dependencies",
  "dependencies": "Dependencies",
  "/app/remediation": "Remediation",
  "remediation": "Remediation",
  "/app/memory": "Incident Memory",
  "/app/incident-memory": "Incident Memory",
  "incident memory": "Incident Memory",
  "incident-memory": "Incident Memory",
  "/app/system-health": "System Health",
  "system health": "System Health",
  "system-health": "System Health",
  "/app/settings": "Settings",
  "settings": "Settings",
}

function resolveCurrentRoute(hasAuth) {
  const hashRaw = window.location.hash.replace(/^#\/?/, "").toLowerCase()
  const pathRaw = window.location.pathname.toLowerCase().replace(/\/$/, "") || "/"

  let candidate = "Landing"

  if (hashRaw) {
    if (hashRaw === "login" || hashRaw.includes("login")) candidate = "Login"
    else if (hashRaw === "signup" || hashRaw.includes("signup")) candidate = "Signup"
    else if (hashRaw === "landing" || hashRaw === "") candidate = "Landing"
    else if (hashRaw.startsWith("app")) {
      const sub = hashRaw.replace(/^app\/?/, "")
      candidate = ROUTE_ALIASES[sub] || ROUTE_ALIASES[`/app/${sub}`] || "Overview"
    } else {
      candidate = ROUTE_ALIASES[hashRaw] || "Overview"
    }
  } else {
    if (pathRaw === "" || pathRaw === "/") candidate = "Landing"
    else if (pathRaw === "/login") candidate = "Login"
    else if (pathRaw === "/signup") candidate = "Signup"
    else if (pathRaw.startsWith("/app")) candidate = ROUTE_ALIASES[pathRaw] || "Overview"
    else candidate = ROUTE_ALIASES[pathRaw] || (hasAuth ? "Overview" : "Landing")
  }

  const isPublic = candidate === "Landing" || candidate === "Login" || candidate === "Signup"

  // Protected route enforcement: require authentication for /app
  if (!hasAuth && !isPublic) {
    return {
      page: "Login",
      notice: "Authentication required. You must sign in to access the Sentinel AI console.",
      shouldSyncUrl: true,
      targetUrl: "/login",
    }
  }

  // Redirect authenticated user away from login/signup to dashboard
  if (hasAuth && (candidate === "Login" || candidate === "Signup")) {
    return {
      page: "Overview",
      notice: null,
      shouldSyncUrl: true,
      targetUrl: "/app",
    }
  }

  return {
    page: candidate,
    notice: null,
    shouldSyncUrl: false,
    targetUrl: null,
  }
}

function navigateTo(target) {
  const isPath = target.startsWith("/")
  let path = target
  let pageName = target

  if (isPath) {
    pageName = ROUTE_ALIASES[target.toLowerCase()] || (target.startsWith("/app") ? "Overview" : "Landing")
    path = target
  } else {
    pageName = target
    if (target === "Landing") path = "/"
    else if (target === "Login") path = "/login"
    else if (target === "Signup") path = "/signup"
    else if (target === "Overview") path = "/app"
    else {
      const slug = target.toLowerCase().replace(/\s+/g, "-")
      path = `/app/${slug}`
    }
  }

  try {
    window.history.pushState(null, "", path)
  } catch {}
  window.location.hash = path === "/" ? "" : encodeURIComponent(path)
  window.dispatchEvent(new Event("popstate"))
}

function formatValue(value) {
  if (value === null || value === undefined) return "Unknown"
  if (typeof value === "string") return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.map(formatValue).join(", ")
  if (typeof value === "object") {
    if (value.message) return String(value.message)
    return JSON.stringify(value)
  }
  return String(value)
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("sentinel_user")
      const token = localStorage.getItem("sentinel_token")
      return (stored && token) ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [authNotice, setAuthNotice] = useState(null)

  const [page, setPage] = useState(() => {
    const hasAuth = Boolean(localStorage.getItem("sentinel_token"))
    const resolved = resolveCurrentRoute(hasAuth)
    return resolved.page
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [services, setServices] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [dependencyGraph, setDependencyGraph] = useState(null)
  const [prediction, setPrediction] = useState(null)

  const [lastIncident, setLastIncident] = useState(null)
  const [loadingIncident, setLoadingIncident] = useState(false)

  const [recovering, setRecovering] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState("")

  const [backendOnline, setBackendOnline] = useState(false)

  const [simulation, setSimulation] = useState(null)
  const [simulationLoading, setSimulationLoading] = useState(false)
  const [simulationService, setSimulationService] = useState("payment-service")
  const [simulationIncident, setSimulationIncident] = useState("payment_failure")

  const [memory, setMemory] = useState([])
  const [memoryLoading, setMemoryLoading] = useState(false)

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData)
    setAuthNotice(null)
    navigateTo("/app")
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("sentinel_token")
      if (token) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("sentinel_token")
      localStorage.removeItem("sentinel_user")
      setCurrentUser(null)
      setAuthNotice(null)
      navigateTo("/")
    }
  }

  useEffect(() => {
    const handleRouteSync = () => {
      const hasAuth = Boolean(currentUser)
      const resolved = resolveCurrentRoute(hasAuth)
      setPage(resolved.page)
      if (resolved.notice) {
        setAuthNotice(resolved.notice)
      } else if (resolved.page !== "Login" && resolved.page !== "Signup") {
        setAuthNotice(null)
      }

      if (resolved.shouldSyncUrl && resolved.targetUrl) {
        try {
          window.history.replaceState(null, "", resolved.targetUrl)
        } catch {}
      }
    }

    window.addEventListener("hashchange", handleRouteSync)
    window.addEventListener("popstate", handleRouteSync)

    handleRouteSync()

    return () => {
      window.removeEventListener("hashchange", handleRouteSync)
      window.removeEventListener("popstate", handleRouteSync)
    }
  }, [currentUser])

  // Active session restoration from backend
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem("sentinel_token")
      if (!token) {
        setCurrentUser(null)
        return
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const freshUser = await res.json()
          setCurrentUser(freshUser)
          localStorage.setItem("sentinel_user", JSON.stringify(freshUser))
        } else {
          console.warn("Session expired. Clearing credentials.")
          localStorage.removeItem("sentinel_token")
          localStorage.removeItem("sentinel_user")
          setCurrentUser(null)
          navigateTo("/login")
        }
      } catch (err) {
        console.warn("Session check note:", err)
      }
    }

    validateSession()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/services/`)
      if (!response.ok) throw new Error("Failed to fetch services")
      const data = await response.json()
      setServices(Array.isArray(data) ? data : [])
      setBackendOnline(true)
    } catch (error) {
      console.error("Services error:", error)
      setBackendOnline(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/metrics/`)
      if (!response.ok) throw new Error("Failed to fetch metrics")
      const data = await response.json()
      setMetrics(data)
      setBackendOnline(true)
    } catch (error) {
      console.error("Metrics error:", error)
    }
  }

  const fetchDependencies = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dependencies/`)
      if (!response.ok) throw new Error("Failed to fetch dependencies")
      const data = await response.json()
      setDependencyGraph(data)
    } catch (error) {
      console.error("Dependency graph error:", error)
    }
  }

  const fetchPrediction = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/prediction/`)
      if (!response.ok) throw new Error("Failed to fetch prediction")
      const data = await response.json()
      setPrediction(data)
    } catch (error) {
      console.error("Prediction error:", error)
    }
  }

  const fetchMemory = async () => {
    try {
      setMemoryLoading(true)
      const response = await fetch(`${API_BASE}/api/memory/?limit=50`)
      if (!response.ok) throw new Error("Failed to fetch incident memory")
      const data = await response.json()
      setMemory(Array.isArray(data.memories) ? data.memories : [])
    } catch (error) {
      console.error("Memory error:", error)
    } finally {
      setMemoryLoading(false)
    }
  }

  const simulateIncident = async (incidentType) => {
    try {
      setLoadingIncident(true)
      setRecoveryMessage("")
      const response = await fetch(`${API_BASE}/api/incidents/simulate/${incidentType}`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Incident simulation failed")
      const data = await response.json()
      setLastIncident(data)
      await fetchServices()
      await fetchMetrics()
      await fetchPrediction()
      await fetchMemory()
    } catch (error) {
      console.error("Simulation error:", error)
    } finally {
      setLoadingIncident(false)
    }
  }

  const recoverIncident = async (action = "restart_service") => {
    try {
      setRecovering(true)
      const response = await fetch(`${API_BASE}/api/incidents/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!response.ok) throw new Error("Recovery failed")
      const data = await response.json()
      setRecoveryMessage(
        data.status === "no_degraded_services"
          ? "All services are currently healthy."
          : `Recovered ${data.services?.length || 0} service(s) successfully.`
      )
      setLastIncident(null)
      await fetchServices()
      await fetchMetrics()
      await fetchPrediction()
      await fetchMemory()
    } catch (error) {
      console.error("Recovery error:", error)
      setRecoveryMessage("Failed to execute recovery.")
    } finally {
      setRecovering(false)
    }
  }

  const runWhatIfSimulation = async () => {
    try {
      setSimulationLoading(true)
      const targetService =
        services.find((s) => s.status !== "healthy")?.name ||
        simulationService ||
        "payment-service"

      const response = await fetch(`${API_BASE}/api/simulation/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_name: targetService,
          incident_type: simulationIncident || "payment_failure",
        }),
      })

      if (!response.ok) throw new Error("What-If simulation failed")
      const data = await response.json()
      setSimulation(data)
    } catch (error) {
      console.error("What-If simulation error:", error)
      setSimulation({
        status: "error",
        message: "Failed to execute What-If simulation.",
      })
    } finally {
      setSimulationLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
    fetchMetrics()
    fetchDependencies()
    fetchPrediction()
    fetchMemory()

    const interval = setInterval(() => {
      fetchServices()
      fetchMetrics()
      fetchPrediction()
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  const healthyServices = useMemo(
    () => services.filter((s) => s.status === "healthy"),
    [services]
  )

  const degradedServices = useMemo(
    () => services.filter((s) => s.status !== "healthy"),
    [services]
  )

  const totalServices = services.length
  const activeIncidents = degradedServices.length
  const healthPercentage =
    totalServices > 0
      ? Math.round((healthyServices.length / totalServices) * 100)
      : 100

  if (page === "Landing") {
    return (
      <LandingPage
        onNavigate={navigateTo}
        backendOnline={backendOnline}
        currentUser={currentUser}
      />
    )
  }

  // Strictly enforce sign-in for using the Sentinel AI console
  if (!currentUser || page === "Login" || page === "Signup") {
    return (
      <AuthPage
        onNavigate={navigateTo}
        onLoginSuccess={handleLoginSuccess}
        initialMode={page === "Signup" ? "signup" : "signin"}
        initialNotice={authNotice}
      />
    )
  }

  // If authenticated and on Login/Signup, normalize to Overview
  const activeConsolePage = (page === "Login" || page === "Signup") ? "Overview" : page

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-accent/30 selection:text-white transition-colors duration-300">
      {/* COLLAPSIBLE SIDEBAR */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      {/* MAIN LAYOUT WRAPPER (SMOOTH MARGIN SHIFT MATCHING REFERENCE) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-out ${
          sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
        }`}
      >
        <Topbar
          onTriggerIncident={simulateIncident}
          user={currentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-6 lg:p-8 overflow-auto animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] w-full mx-auto space-y-6">
          {activeConsolePage === "Overview" && (
            <OverviewPage
              backendOnline={backendOnline}
              services={services}
              healthyServices={healthyServices}
              degradedServices={degradedServices}
              totalServices={totalServices}
              activeIncidents={activeIncidents}
              healthPercentage={healthPercentage}
              metrics={metrics}
              prediction={prediction}
              dependencyGraph={dependencyGraph}
              simulation={simulation}
              simulationLoading={simulationLoading}
              runSimulation={runWhatIfSimulation}
              lastIncident={lastIncident}
              loadingIncident={loadingIncident}
              simulateIncident={simulateIncident}
              recoverIncident={recoverIncident}
              recovering={recovering}
              recoveryMessage={recoveryMessage}
              memory={memory}
            />
          )}

          {activeConsolePage === "Monitoring" && (
            <MonitoringPage
              metrics={metrics}
              prediction={prediction}
              services={services}
              backendOnline={backendOnline}
            />
          )}

          {activeConsolePage === "AI Investigation" && (
            <AIInvestigationPage
              incident={lastIncident}
              services={services}
              onTrigger={simulateIncident}
              loading={loadingIncident}
            />
          )}

          {activeConsolePage === "Services" && (
            <ServicesPage
              services={services}
              backendOnline={backendOnline}
              healthPercentage={healthPercentage}
              onInvestigate={() => navigateTo("AI Investigation")}
            />
          )}

          {activeConsolePage === "Dependencies" && (
            <DependenciesPage
              graph={dependencyGraph}
              services={services}
            />
          )}

          {activeConsolePage === "Remediation" && (
            <RemediationPage
              incident={lastIncident}
              recoveryMessage={recoveryMessage}
              recovering={recovering}
              degradedServices={degradedServices}
              onRecover={recoverIncident}
              simulation={simulation}
              runSimulation={runWhatIfSimulation}
              simulationLoading={simulationLoading}
            />
          )}

          {activeConsolePage === "Incident Memory" && (
            <IncidentMemoryPage
              memory={memory}
              loading={memoryLoading}
              onRefresh={fetchMemory}
            />
          )}

          {activeConsolePage === "System Health" && (
            <SystemHealthPage
              services={services}
              metrics={metrics}
              backendOnline={backendOnline}
              healthPercentage={healthPercentage}
            />
          )}

          {activeConsolePage === "Settings" && (
            <SettingsPage
              backendOnline={backendOnline}
              apiBase={API_BASE}
              user={currentUser}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    </div>
  )
}

/* =========================================================
   OVERVIEW PAGE (MATCHING V0 SALESOPS DASHBOARD LAYOUT)
   ========================================================= */

function OverviewPage({
  backendOnline,
  services,
  healthyServices,
  degradedServices,
  totalServices,
  activeIncidents,
  healthPercentage,
  metrics,
  prediction,
  dependencyGraph,
  simulation,
  simulationLoading,
  runSimulation,
  lastIncident,
  loadingIncident,
  simulateIncident,
  recoverIncident,
  recovering,
  recoveryMessage,
  memory,
}) {
  // Chart historical telemetry stream
  const telemetryData = useMemo(() => {
    const baseCpu = metrics?.cpu_usage || 45
    const baseLat = metrics?.api_latency || 120
    const times = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"]

    return times.map((t, idx) => ({
      time: t,
      primary: Math.max(10, Math.round(baseCpu + (idx - 3) * 3 + (idx % 2 === 0 ? 5 : -4))),
      secondary: Math.max(50, Math.round(baseLat / 10 + (idx % 2 === 0 ? 12 : -8))),
    }))
  }, [metrics])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ROW 1: 4-COLUMN KPI CARDS (MATCHING REFERENCE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Services"
          value={totalServices || 7}
          trend="Mesh Online"
          trendType="up"
          subtitle="Microservices under management"
          icon={Server}
          delay={0}
        />

        <MetricCard
          title="Fleet Health Score"
          value={`${healthPercentage}%`}
          trend={healthPercentage >= 85 ? "+3.2%" : "-12.5%"}
          trendType={healthPercentage >= 85 ? "up" : "down"}
          subtitle="Infrastructure operational ratio"
          icon={CheckCircle2}
          delay={100}
        />

        <MetricCard
          title="Active Outages"
          value={activeIncidents}
          trend={activeIncidents === 0 ? "Normal" : `-${activeIncidents}`}
          trendType={activeIncidents === 0 ? "up" : "down"}
          subtitle={activeIncidents === 0 ? "Zero service degradation" : "Degraded container detected"}
          icon={AlertTriangle}
          delay={200}
        />

        <MetricCard
          title="AI Copilot Engine"
          value={backendOnline ? "99.8%" : "OFFLINE"}
          trend="+18.3%"
          trendType="up"
          subtitle="Multi-agent reasoning active"
          icon={Brain}
          delay={300}
        />
      </div>

      {/* ROW 2: 2/3 + 1/3 GRID (MATCHING REVENUE TREND & PIPELINE STAGES IN REFERENCE) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT (2 COLS): TELEMETRY TRENDS AREA CHART */}
        <div className="lg:col-span-2">
          <MetricChart
            title="Telemetry & Latency Trends"
            subtitle="Real-time CPU compute load vs API response latency"
            data={telemetryData}
            primaryKey="primary"
            secondaryKey="secondary"
            primaryLabel="CPU Load (%)"
            secondaryLabel="Latency (ms/10)"
            height={280}
          />
        </div>

        {/* RIGHT (1 COL): FLEET HEALTH BREAKDOWN STAGES */}
        <div className="bg-card border border-border rounded-xl p-5 h-[380px] flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div>
            <div className="mb-5">
              <h3 className="text-base font-semibold text-foreground tracking-tight">
                Service Health Stages
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Distribution across 7 production microservices
              </p>
            </div>

            <div className="space-y-4">
              {/* STAGE 1: HEALTHY */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    Healthy
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{healthyServices.length} services</span>
                    <span className="font-semibold text-foreground">{healthPercentage}%</span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${healthPercentage}%` }}
                  />
                </div>
              </div>

              {/* STAGE 2: MONITORED */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-chart-2" />
                    Active Telemetry
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">7 services</span>
                    <span className="font-semibold text-foreground">100%</span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-chart-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* STAGE 3: DEGRADED */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    Degraded / Pressure
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{degradedServices.length} services</span>
                    <span className="font-semibold text-foreground">
                      {totalServices ? Math.round((degradedServices.length / totalServices) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${totalServices ? Math.round((degradedServices.length / totalServices) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* STAGE 4: AUTONOMOUS RECOVERY */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Self-Healing Ready
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Orchestrator</span>
                    <span className="font-semibold text-foreground">95%</span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: "95%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Mesh Operational State</span>
            <span className="text-base font-bold text-foreground">
              {activeIncidents === 0 ? "100% Operational" : `${activeIncidents} Degraded`}
            </span>
          </div>
        </div>
      </div>

      {/* ROW 3: 2-COLUMN GRID (MATCHING RECENT DEALS & TOP PERFORMERS IN REFERENCE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: RECENT INCIDENTS & FAULT LOGS (MATCHING RECENT DEALS) */}
        <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground tracking-tight">
                Recent Incidents & Resolution
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest operational signals & autonomous recovery events
              </p>
            </div>
            <button
              onClick={() => navigateTo("Incident Memory")}
              className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium transition-colors group cursor-pointer"
            >
              View all
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {memory.length > 0 ? (
              memory.slice(0, 5).map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => navigateTo("Incident Memory")}
                  className="group flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-all duration-200">
                      {item.affected_service?.charAt(0).toUpperCase() || "S"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                        {formatValue(item.affected_service)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                        {item.root_cause || formatValue(item.incident_type)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground hidden sm:inline-block">
                      {item.recovery_time_seconds ? `${item.recovery_time_seconds}s` : "Auto"}
                    </span>
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                        item.recovery_success
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {item.recovery_success ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Resolved
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" /> Degraded
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              // Default illustrative list if fresh database
              [
                { name: "payment-service", cause: "Payment timeout • Rollback deployment", status: "Resolved", time: "2m ago", ok: true },
                { name: "order-service", cause: "CrashLoop • Container restart", status: "Resolved", time: "18m ago", ok: true },
                { name: "inventory-service", cause: "Database connection refused", status: "Degraded", time: "1h ago", ok: false },
                { name: "product-service", cause: "HTTP 500 API spike • Scaled instances", status: "Resolved", time: "3h ago", ok: true },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-all duration-200">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.cause}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground hidden sm:inline-block">{item.time}</span>
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                        item.ok
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {item.ok ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: CHAOS FAULT INJECTION & SELF-HEALING (MATCHING TOP PERFORMERS) */}
        <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground tracking-tight">
                Chaos Fault Injection
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Simulate real Docker container failures to test AI RCA and self-healing
              </p>
            </div>
            <button
              onClick={() => recoverIncident("restart_service")}
              disabled={recovering || degradedServices.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success hover:bg-success/20 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recovering ? "animate-spin" : ""}`} />
              {recovering ? "Recovering..." : "Heal Fleet"}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <ChaosButton
              label="Database Down"
              type="db_down"
              icon={Database}
              onClick={simulateIncident}
              loading={loadingIncident}
            />
            <ChaosButton
              label="Payment Drop"
              type="payment_failure"
              icon={Zap}
              onClick={simulateIncident}
              loading={loadingIncident}
            />
            <ChaosButton
              label="Order Crash"
              type="order_crash"
              icon={Server}
              onClick={simulateIncident}
              loading={loadingIncident}
            />
            <ChaosButton
              label="API 500 Error"
              type="api_failure"
              icon={AlertTriangle}
              onClick={simulateIncident}
              loading={loadingIncident}
            />
            <ChaosButton
              label="CPU Spike"
              type="cpu_spike"
              icon={Cpu}
              onClick={simulateIncident}
              loading={loadingIncident}
            />
            <ChaosButton
              label="Memory Leak"
              type="memory_leak"
              icon={MemoryStick}
              onClick={simulateIncident}
              loading={loadingIncident}
            />
          </div>

          {recoveryMessage && (
            <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20 text-xs text-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{recoveryMessage}</span>
            </div>
          )}

          {lastIncident && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Siren className="w-4 h-4 shrink-0 animate-pulse" />
                <span className="truncate">
                  Active Failure: <b>{formatValue(lastIncident.incident?.type || lastIncident.service?.name)}</b>
                </span>
              </div>
              <button
                onClick={() => navigateTo("AI Investigation")}
                className="text-xs underline font-semibold shrink-0 cursor-pointer"
              >
                Inspect RCA →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ROW 4: WHAT-IF DECISION ENGINE */}
      <WhatIfSimulationPanel
        simulation={simulation}
        simulationLoading={simulationLoading}
        canSimulate={services.length > 0}
        onSimulate={runSimulation}
      />
    </div>
  )
}

function ChaosButton({ label, type, icon: Icon, onClick, loading }) {
  return (
    <button
      type="button"
      onClick={() => onClick(type)}
      disabled={loading}
      className="flex flex-col items-start p-3 rounded-lg bg-secondary/40 hover:bg-secondary border border-border/70 hover:border-accent/40 text-left transition-all duration-200 cursor-pointer group disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-accent group-hover:bg-accent/10 transition-colors mb-2">
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors">
        {label}
      </p>
      <span className="text-[10px] text-muted-foreground mt-0.5">Inject fault</span>
    </button>
  )
}

/* =========================================================
   MONITORING PAGE
   ========================================================= */

function MonitoringPage({ metrics, prediction, services, backendOnline }) {
  const chartData1 = useMemo(() => {
    const val = metrics?.cpu_usage || 45
    return ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30"].map((t, i) => ({
      time: t,
      primary: Math.round(val + (i % 2 === 0 ? 5 : -4)),
    }))
  }, [metrics])

  const chartData2 = useMemo(() => {
    const val = metrics?.api_latency || 130
    return ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30"].map((t, i) => ({
      time: t,
      primary: Math.round(val + (i % 2 === 0 ? 30 : -20)),
    }))
  }, [metrics])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Fleet Observability</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time infrastructure telemetry and anomaly tracking</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span>Polling interval: 6s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CPU Utilization"
          value={metrics?.cpu_usage !== undefined ? `${metrics.cpu_usage}%` : "42%"}
          trend={metrics?.cpu_usage >= 80 ? "Critical" : "Normal"}
          trendType={metrics?.cpu_usage >= 80 ? "down" : "up"}
          icon={Cpu}
        />
        <MetricCard
          title="Memory Load"
          value={metrics?.memory_usage !== undefined ? `${metrics.memory_usage}%` : "48%"}
          trend="Stable"
          trendType="up"
          icon={MemoryStick}
        />
        <MetricCard
          title="API Latency"
          value={metrics?.api_latency !== undefined ? `${metrics.api_latency}ms` : "110ms"}
          trend={metrics?.api_latency >= 400 ? "Elevated" : "Optimal"}
          trendType={metrics?.api_latency >= 400 ? "down" : "up"}
          icon={Gauge}
        />
        <MetricCard
          title="Error Rate"
          value={metrics?.error_rate !== undefined ? `${metrics.error_rate}%` : "0.2%"}
          trend={metrics?.error_rate >= 5 ? "Alert" : "Low"}
          trendType={metrics?.error_rate >= 5 ? "down" : "up"}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricChart
          title="Compute Load (CPU %)"
          subtitle="Real-time processor pressure across mesh containers"
          data={chartData1}
          primaryKey="primary"
          primaryLabel="CPU %"
          height={240}
        />
        <MetricChart
          title="API Request Latency (ms)"
          subtitle="Response time metrics from edge router"
          data={chartData2}
          primaryKey="primary"
          primaryLabel="Latency (ms)"
          height={240}
        />
      </div>
    </div>
  )
}

/* =========================================================
   AI INVESTIGATION PAGE
   ========================================================= */

function AIInvestigationPage({ incident, services, onTrigger, loading }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">AI Root Cause Analysis</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Deterministic signal extraction & multi-agent investigation</p>
        </div>
      </div>

      {incident ? (
        <AIInvestigation incident={incident} />
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-accent">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">No active incident under investigation</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Simulate a failure below or wait for a production anomaly. Sentinel AI will parse logs, query incident memory, and diagnose the root cause.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onTrigger("payment_failure")}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              Simulate Payment Failure
            </button>
            <button
              onClick={() => onTrigger("db_down")}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors border border-border cursor-pointer disabled:opacity-50"
            >
              Simulate Database Drop
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================
   SERVICES PAGE
   ========================================================= */

function ServicesPage({ services, backendOnline, healthPercentage, onInvestigate }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Microservices Fleet</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Managed production microservices & container states</p>
        </div>
        <div className="text-xs font-medium text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border">
          Fleet Health: <b className="text-success">{healthPercentage}%</b>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} onInvestigate={onInvestigate} />
        ))}
      </div>
    </div>
  )
}

/* =========================================================
   DEPENDENCIES PAGE
   ========================================================= */

function DependenciesPage({ graph, services }) {
  const dependencies = graph?.dependencies || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Service Dependency Topology</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Directed service graphs & cascading blast radius intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const directDeps = dependencies
            .filter((d) => d.service === service.name)
            .map((d) => d.depends_on)
          const isDegraded = service.status !== "healthy"

          return (
            <div
              key={service.id}
              className={`bg-card border rounded-xl p-5 transition-all ${
                isDegraded ? "border-destructive/40 bg-destructive/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isDegraded ? "bg-destructive animate-pulse" : "bg-success"}`} />
                  <h4 className="text-sm font-semibold text-foreground">{service.name}</h4>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    isDegraded ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                  }`}
                >
                  {service.status}
                </span>
              </div>

              {directDeps.length > 0 ? (
                <div className="space-y-1.5 mt-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Upstream Dependencies ({directDeps.length})
                  </p>
                  {directDeps.map((dep) => (
                    <div
                      key={dep}
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border/50 text-xs font-mono text-muted-foreground"
                    >
                      <ArrowRight className="w-3 h-3 text-accent" />
                      <span>{dep}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground mt-3">
                  Root-level microservice (no upstream dependencies).
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* =========================================================
   REMEDIATION PAGE
   ========================================================= */

function RemediationPage({
  incident,
  recoveryMessage,
  recovering,
  degradedServices,
  onRecover,
  simulation,
  runSimulation,
  simulationLoading,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Autonomous Remediation Console</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Self-healing actions with human-in-the-loop safety verification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Remediation Trigger</h3>
              <p className="text-xs text-muted-foreground">
                {degradedServices.length > 0
                  ? `${degradedServices.length} service(s) currently require remediation.`
                  : "All production services are running healthy."}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Execute Recovery Action
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["restart_service", "rollback_deployment", "restart_dependency", "scale_service"].map((action) => (
                <button
                  key={action}
                  onClick={() => onRecover(action)}
                  disabled={recovering || degradedServices.length === 0}
                  className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-border text-xs font-semibold text-foreground text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <p className="capitalize">{action.replace(/_/g, " ")}</p>
                  <span className="text-[10px] text-muted-foreground">Direct container trigger</span>
                </button>
              ))}
            </div>
          </div>

          {recoveryMessage && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-xs text-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{recoveryMessage}</span>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Target Mesh Status</h3>
          <p className="text-xs text-muted-foreground mb-4">Current health indicators for degraded containers</p>

          {degradedServices.length > 0 ? (
            <div className="space-y-2">
              {degradedServices.map((service) => (
                <div key={service.id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-semibold text-foreground">{service.name}</span>
                  </div>
                  <span className="text-xs font-semibold uppercase text-destructive">Degraded</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 text-success/60 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Zero Degraded Services</p>
              <p className="text-xs text-muted-foreground mt-0.5">Infrastructure is completely healthy.</p>
            </div>
          )}
        </div>
      </div>

      {/* WHAT-IF SIMULATION ENGINE IN REMEDIATION CONSOLE */}
      <WhatIfSimulationPanel
        simulation={simulation}
        simulationLoading={simulationLoading}
        canSimulate={true}
        onSimulate={runSimulation}
      />
    </div>
  )
}

/* =========================================================
   INCIDENT MEMORY PAGE
   ========================================================= */

function IncidentMemoryPage({ memory, loading, onRefresh }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Incident Memory Log</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Historical incident repository & learned remediation knowledge</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Memory
        </button>
      </div>

      {memory.length > 0 ? (
        <div className="space-y-3">
          {memory.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-5 hover:border-accent/40 transition-all">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs text-muted-foreground">
                    #{item.id}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-foreground">{formatValue(item.incident_type)}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{item.affected_service}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                    item.recovery_success
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  {item.recovery_success ? "Recovered" : "Unresolved"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-3 border-t border-border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Root Cause:</span>
                  <p className="font-medium text-foreground mt-0.5">{item.root_cause || "Analyzing"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Action Taken:</span>
                  <p className="font-medium text-foreground mt-0.5">{item.recovery_action || "Manual Review"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Confidence:</span>
                  <p className="font-medium text-foreground mt-0.5">{item.confidence ? `${item.confidence}%` : "--"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Recovery Time:</span>
                  <p className="font-medium text-foreground mt-0.5">{item.recovery_time_seconds ? `${item.recovery_time_seconds}s` : "--"}</p>
                </div>
              </div>

              {item.lesson && (
                <div className="mt-3 p-3 rounded-lg bg-secondary/40 border border-border/50 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Post-Mortem Lesson: </span>
                  {item.lesson}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
          <History className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
          <h4 className="text-sm font-semibold text-foreground">No Historical Incident Memory</h4>
          <p className="text-xs mt-1">Run a simulated incident to begin recording resolution intelligence.</p>
        </div>
      )}
    </div>
  )
}

/* =========================================================
   SYSTEM HEALTH PAGE
   ========================================================= */

function SystemHealthPage({ services, metrics, backendOnline, healthPercentage }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">System Infrastructure Health</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Control plane connection and engine diagnostics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Backend API"
          value={backendOnline ? "CONNECTED" : "OFFLINE"}
          trend={backendOnline ? "HTTP 200" : "Unreachable"}
          trendType={backendOnline ? "up" : "down"}
          icon={Server}
        />
        <MetricCard
          title="Mesh Health"
          value={`${healthPercentage}%`}
          trend={healthPercentage >= 85 ? "Optimal" : "Degraded"}
          trendType={healthPercentage >= 85 ? "up" : "down"}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Telemetry Poller"
          value={metrics ? "ACTIVE" : "WAITING"}
          trend="Realtime"
          trendType="up"
          icon={Activity}
        />
        <MetricCard
          title="Control Plane"
          value="PORT 8000"
          trend="FastAPI"
          trendType="up"
          icon={ShieldCheck}
        />
      </div>
    </div>
  )
}

/* =========================================================
   SETTINGS PAGE
   ========================================================= */

function SettingsPage({ backendOnline, apiBase, user, onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleTriggerLogout = async () => {
    setIsLoggingOut(true)
    if (onLogout) {
      await onLogout()
    }
  }

  const initials = useMemo(() => {
    const name = user?.full_name || user?.username || "Admin"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }, [user])

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">System Settings & Security</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your operator identity, active session credentials, platform parameters, and interface preferences.
        </p>
      </div>

      {/* SECTION 1: OPERATOR IDENTITY & ACTIVE SESSION CARD */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-accent/15 border-2 border-accent/40 text-accent flex items-center justify-center font-bold text-xl shadow-inner select-none">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-card" title="Active Session" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  {user?.full_name || user?.username || "Authenticated Operator"}
                </h3>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                  {user?.role || "SR. RELIABILITY ENGINEER"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">
                {user?.email || "operator@sentinel-ai.internal"}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1.5 text-success font-medium">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Authenticated Session Active
                </span>
                <span>•</span>
                <span>Workspace: <strong className="text-foreground">{user?.organization || "Global Autonomous SRE Fleet"}</strong></span>
              </div>
            </div>
          </div>

          {/* LOGOUT ACTION ZONE */}
          <div className="flex flex-col items-start sm:items-end gap-2">
            {!confirmLogout ? (
              <button
                id="settings-logout-btn"
                onClick={() => setConfirmLogout(true)}
                className="px-4 py-2 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm group hover:scale-[1.02]"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Sign Out of Console</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 p-1.5 bg-destructive/10 border border-destructive/30 rounded-xl animate-in fade-in zoom-in-95 duration-150">
                <span className="text-xs text-destructive font-medium px-2">End session?</span>
                <button
                  id="settings-logout-cancel-btn"
                  onClick={() => setConfirmLogout(false)}
                  disabled={isLoggingOut}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="settings-logout-confirm-btn"
                  onClick={handleTriggerLogout}
                  disabled={isLoggingOut}
                  className="px-3.5 py-1.5 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Signing Out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Confirm & Go to Public Site</span>
                    </>
                  )}
                </button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Revokes JWT session and returns you to public homepage.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>Secure SHA-256 JWT Token Session • Client storage encrypted</span>
          </div>
          <button
            id="settings-public-showcase-link"
            onClick={() => navigateTo("/")}
            className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>View Public Showcase without signing out</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* SECTION 2: PLATFORM CONFIGURATION & RUNTIME */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
        <div className="p-4 bg-secondary/30">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Platform Control Plane</h3>
          <p className="text-xs text-muted-foreground">Runtime infrastructure and microservices endpoints</p>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Backend Control Plane</p>
            <p className="text-xs text-muted-foreground">FastAPI REST control plane address</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${
              backendOnline
                ? "bg-success/10 text-success border-success/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? "bg-success" : "bg-destructive"}`} />
              {backendOnline ? "ONLINE" : "DISCONNECTED"}
            </span>
            <span className="font-mono text-xs bg-secondary px-2.5 py-1 rounded border border-border text-foreground">
              {apiBase}
            </span>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Telemetry Polling Rate</p>
            <p className="text-xs text-muted-foreground">Real-time metrics query frequency</p>
          </div>
          <span className="text-xs bg-secondary px-2.5 py-1 rounded border border-border text-foreground font-semibold">
            6 seconds (Adaptive Streaming)
          </span>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Interface Theme Mode</p>
            <p className="text-xs text-muted-foreground">Toggle between Obsidian Dark and Enterprise Light mode (persists across sessions)</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App