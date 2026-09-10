import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Database,
  GitBranch,
  Gauge,
  History,
  Network,
  RefreshCw,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Siren,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react"

import Sidebar from "./components/Sidebar"
import Topbar from "./components/Topbar"
import ServiceCard from "./components/ServiceCard"
import MetricCard from "./components/MetricCard"
import AIInvestigation from "./components/AIInvestigation"
import ExecutionFeed from "./components/ExecutionFeed"
import MetricChart from "./components/MetricChart"
import WhatIfSimulationPanel from "./components/WhatIfSimulationPanel"

const API_BASE = "http://127.0.0.1:8000"

const NAV_ITEMS = [
  "Overview",
  "Monitoring",
  "AI Investigation",
  "Services",
  "Dependencies",
  "Remediation",
  "Incident Memory",
  "System Health",
  "Settings",
]

function getPageFromHash() {
  const raw = window.location.hash.replace(/^#/, "")

  if (!raw) {
    return "Overview"
  }

  try {
    const decoded = decodeURIComponent(raw)

    return NAV_ITEMS.includes(decoded)
      ? decoded
      : "Overview"
  } catch {
    return "Overview"
  }
}

function navigateTo(page) {
  const nextHash = encodeURIComponent(page)

  if (window.location.hash.replace(/^#/, "") === nextHash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"))
    return
  }

  window.location.hash = nextHash
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "Unknown"
  }

  if (typeof value === "string") {
    return value.replace(/_/g, " ")
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value.map(formatValue).join(", ")
  }

  if (typeof value === "object") {
    if (value.message) {
      return String(value.message)
    }

    return JSON.stringify(value)
  }

  return String(value)
}

function getSeverity(metric, value) {
  if (value === undefined || value === null) {
    return "normal"
  }

  if (metric === "cpu" || metric === "memory") {
    if (value >= 85) return "critical"
    if (value >= 70) return "elevated"
  }

  if (metric === "latency") {
    if (value >= 1000) return "critical"
    if (value >= 400) return "elevated"
  }

  if (metric === "error") {
    if (value >= 10) return "critical"
    if (value >= 3) return "elevated"
  }

  return "normal"
}

function getSeverityText(state) {
  if (state === "critical") return "Critical"
  if (state === "elevated") return "Elevated"
  return "Normal"
}

function App() {
  const [page, setPage] = useState(getPageFromHash)

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

  const [simulationService, setSimulationService] =
    useState("payment-service")

  const [simulationIncident, setSimulationIncident] =
    useState("payment_failure")

  const [memory, setMemory] = useState([])
  const [memoryLoading, setMemoryLoading] = useState(false)

  useEffect(() => {
    const handleNavigation = () => {
      setPage(getPageFromHash())
    }

    window.addEventListener("hashchange", handleNavigation)

    handleNavigation()

    if (!window.location.hash) {
      window.location.hash = encodeURIComponent("Overview")
    }

    return () => {
      window.removeEventListener(
        "hashchange",
        handleNavigation
      )
    }
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/services/`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch services")
      }

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
      const response = await fetch(
        `${API_BASE}/api/metrics/`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch metrics")
      }

      const data = await response.json()

      setMetrics(data)
      setBackendOnline(true)
    } catch (error) {
      console.error("Metrics error:", error)
    }
  }

  const fetchDependencies = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/dependencies/`
      )

      if (!response.ok) {
        throw new Error(
          "Failed to fetch dependencies"
        )
      }

      const data = await response.json()

      setDependencyGraph(data)
    } catch (error) {
      console.error(
        "Dependency graph error:",
        error
      )
    }
  }

  const fetchPrediction = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/prediction/`
      )

      if (!response.ok) {
        throw new Error(
          "Failed to fetch prediction"
        )
      }

      const data = await response.json()

      setPrediction(data)
    } catch (error) {
      console.error(
        "Prediction error:",
        error
      )
    }
  }

  const fetchMemory = async () => {
    try {
      setMemoryLoading(true)

      const response = await fetch(
        `${API_BASE}/api/memory/?limit=50`
      )

      if (!response.ok) {
        throw new Error(
          "Failed to fetch incident memory"
        )
      }

      const data = await response.json()

      setMemory(
        Array.isArray(data.memories)
          ? data.memories
          : []
      )
    } catch (error) {
      console.error(
        "Memory error:",
        error
      )
    } finally {
      setMemoryLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
    fetchMetrics()
    fetchDependencies()
    fetchPrediction()
    fetchMemory()

    const serviceInterval = setInterval(
      fetchServices,
      3000
    )

    const metricInterval = setInterval(
      fetchMetrics,
      2000
    )

    const predictionInterval = setInterval(
      fetchPrediction,
      3000
    )

    const memoryInterval = setInterval(
      fetchMemory,
      10000
    )

    return () => {
      clearInterval(serviceInterval)
      clearInterval(metricInterval)
      clearInterval(predictionInterval)
      clearInterval(memoryInterval)
    }
  }, [])

  const runWhatIfSimulation = async () => {
    try {
      setSimulationLoading(true)

      const response = await fetch(
        `${API_BASE}/api/simulation/compare`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service_name: simulationService,
            incident_type: simulationIncident,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(
          "Simulation request failed"
        )
      }

      const data = await response.json()

      setSimulation(data)
      setBackendOnline(true)
    } catch (error) {
      console.error(
        "Simulation error:",
        error
      )

      setSimulation({
        status: "error",
        message:
          "Unable to run simulation. Make sure the Sentinel backend is running.",
      })
    } finally {
      setSimulationLoading(false)
    }
  }

  const simulateIncident = async (
    incidentType
  ) => {
    try {
      setLoadingIncident(true)
      setRecoveryMessage("")

      const response = await fetch(
        `${API_BASE}/api/incidents/simulate/${incidentType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          "Failed to simulate incident"
        )
      }

      const data = await response.json()

      setLastIncident(data)

      if (data.affected_service) {
        setSimulationService(
          data.affected_service
        )
      }

      if (data.incident_type) {
        setSimulationIncident(
          data.incident_type
        )
      }

      await fetchServices()
      await fetchMetrics()
      await fetchDependencies()
      await fetchPrediction()
      await fetchMemory()

      navigateTo("AI Investigation")
    } catch (error) {
      console.error(
        "Incident simulation error:",
        error
      )

      setLastIncident({
        status: "error",
        incident_type: incidentType,
        message:
          "Failed to trigger incident.",
        error: error.message,
      })
    } finally {
      setLoadingIncident(false)
    }
  }

  const recoverIncident = async () => {
    try {
      setRecovering(true)
      setRecoveryMessage("")

      const response = await fetch(
        `${API_BASE}/api/incidents/recover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          "Recovery request failed"
        )
      }

      const data = await response.json()

      setRecoveryMessage(
        data.message ||
          "All affected services have been restored."
      )

      setLastIncident(null)
      setSimulation(null)

      await fetchServices()
      await fetchMetrics()
      await fetchDependencies()
      await fetchPrediction()
      await fetchMemory()
    } catch (error) {
      console.error(
        "Recovery error:",
        error
      )

      setRecoveryMessage(
        "Recovery failed. Make sure the Sentinel backend is running."
      )
    } finally {
      setRecovering(false)
    }
  }

  const healthyServices = useMemo(
    () =>
      services.filter(
        (service) =>
          service.status === "healthy"
      ),
    [services]
  )

  const degradedServices = useMemo(
    () =>
      services.filter(
        (service) =>
          service.status !== "healthy"
      ),
    [services]
  )

  const totalServices = services.length

  const activeIncidents =
    degradedServices.length

  const healthPercentage =
    totalServices > 0
      ? Math.round(
          (healthyServices.length /
            totalServices) *
            100
        )
      : 0

  const cpu = metrics?.cpu_usage
  const memoryUsage = metrics?.memory_usage
  const latency = metrics?.api_latency
  const errorRate = metrics?.error_rate

  return (
    <div className="min-h-screen bg-[#08090D] text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <Topbar />

          <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-8">
            {page === "Overview" && (
              <OverviewPage
                backendOnline={backendOnline}
                services={services}
                healthyServices={healthyServices}
                degradedServices={degradedServices}
                totalServices={totalServices}
                activeIncidents={
                  activeIncidents
                }
                healthPercentage={
                  healthPercentage
                }
                metrics={metrics}
                prediction={prediction}
                dependencyGraph={
                  dependencyGraph
                }
                simulation={simulation}
                simulationLoading={
                  simulationLoading
                }
                setSimulationService={
                  setSimulationService
                }
                setSimulationIncident={
                  setSimulationIncident
                }
                simulationService={
                  simulationService
                }
                simulationIncident={
                  simulationIncident
                }
                runSimulation={
                  runWhatIfSimulation
                }
                lastIncident={
                  lastIncident
                }
                loadingIncident={
                  loadingIncident
                }
                simulateIncident={
                  simulateIncident
                }
                recoverIncident={
                  recoverIncident
                }
                recovering={recovering}
                recoveryMessage={
                  recoveryMessage
                }
              />
            )}

            {page === "Monitoring" && (
              <MonitoringPage
                metrics={metrics}
                prediction={prediction}
                services={services}
                backendOnline={
                  backendOnline
                }
              />
            )}

            {page === "AI Investigation" && (
              <AIInvestigationPage
                incident={
                  lastIncident
                }
                services={services}
                onTrigger={
                  simulateIncident
                }
                loading={
                  loadingIncident
                }
              />
            )}

            {page === "Services" && (
              <ServicesPage
                services={services}
                backendOnline={
                  backendOnline
                }
                healthPercentage={
                  healthPercentage
                }
              />
            )}

            {page === "Dependencies" && (
              <DependenciesPage
                graph={dependencyGraph}
                services={services}
              />
            )}

            {page === "Remediation" && (
              <RemediationPage
                incident={
                  lastIncident
                }
                recoveryMessage={
                  recoveryMessage
                }
                recovering={recovering}
                degradedServices={
                  degradedServices
                }
                onRecover={
                  recoverIncident
                }
              />
            )}

            {page === "Incident Memory" && (
              <IncidentMemoryPage
                memory={memory}
                loading={
                  memoryLoading
                }
                onRefresh={
                  fetchMemory
                }
              />
            )}

            {page === "System Health" && (
              <SystemHealthPage
                services={services}
                metrics={metrics}
                backendOnline={
                  backendOnline
                }
                healthPercentage={
                  healthPercentage
                }
              />
            )}

            {page === "Settings" && (
              <SettingsPage
                backendOnline={
                  backendOnline
                }
                apiBase={
                  API_BASE
                }
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

/* =========================================================
   PAGE HEADER
========================================================= */

function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-4 w-4 text-violet-300" />
        )}

        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-violet-300">
          {eyebrow}
        </p>
      </div>

      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {title}
      </h1>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
        {description}
      </p>
    </div>
  )
}

/* =========================================================
   OVERVIEW
========================================================= */

function OverviewPage(props) {
  const {
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
    setSimulationService,
    setSimulationIncident,
    simulationService,
    simulationIncident,
    runSimulation,
    lastIncident,
    loadingIncident,
    simulateIncident,
    recoverIncident,
    recovering,
    recoveryMessage,
  } = props

  return (
    <>
      <PageHeader
        eyebrow="Sentinel AI Operations Center"
        title="Enterprise Operations Dashboard"
        description="Monitor production infrastructure, investigate incidents, understand dependencies, and evaluate remediation strategies through Sentinel AI."
        icon={Activity}
      />

      <div className="mb-8 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            backendOnline
              ? "bg-[#75E063] shadow-[0_0_10px_#75E063]"
              : "bg-red-500 shadow-[0_0_10px_#ef4444]"
          }`}
        />

        <div>
          <p className="text-xs font-medium text-white">
            {backendOnline
              ? "Backend Connected"
              : "Backend Offline"}
          </p>

          <p className="mt-0.5 text-[10px] text-gray-600">
            {backendOnline
              ? "Live infrastructure monitoring active"
              : "Waiting for Sentinel API"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Services"
          value={totalServices}
          subtitle="Registered production services"
          icon={Server}
          status={
            backendOnline
              ? "Infrastructure connected"
              : "Connection unavailable"
          }
        />

        <MetricCard
          title="Healthy"
          value={healthyServices.length}
          subtitle="Services operating normally"
          icon={CheckCircle2}
          status={`${healthPercentage}% infrastructure health`}
        />

        <MetricCard
          title="Active Incidents"
          value={activeIncidents}
          subtitle="Currently degraded services"
          icon={AlertTriangle}
          status={
            activeIncidents > 0
              ? "Investigation required"
              : "No active incidents"
          }
        />

        <MetricCard
          title="AI Engine"
          value="ONLINE"
          subtitle="Sentinel reasoning engine"
          icon={Brain}
          status="Ready for investigation"
        />
      </div>

      <TelemetryStrip metrics={metrics} />

      <div className="mt-8">
        <PredictionSummary
          prediction={prediction}
          metrics={metrics}
        />
      </div>

      <div className="mt-8">
        <WhatIfSimulationPanel
          simulation={simulation}
          simulationLoading={
            simulationLoading
          }
          canSimulate={
            services.length > 0
          }
          onSimulate={
            runSimulation
          }
        />
      </div>

      <div className="mt-8">
        <SectionHeading
          eyebrow="Architecture Intelligence"
          title="Service Dependency Graph"
          icon={Network}
        />

        <DependencyGraph
          graph={dependencyGraph}
          services={services}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#75E063]">
              Controlled Failure Environment
            </p>

            <h2 className="mt-2 text-lg font-semibold text-white">
              Incident Simulator
            </h2>
          </div>

          <button
            type="button"
            onClick={recoverIncident}
            disabled={
              recovering ||
              loadingIncident ||
              degradedServices.length === 0
            }
            className="flex items-center justify-center gap-2 rounded-xl border border-[#75E063]/30 bg-[#75E063]/10 px-5 py-3 text-sm font-medium text-[#75E063] transition hover:bg-[#75E063]/15 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                recovering
                  ? "animate-spin"
                  : ""
              }`}
            />

            {recovering
              ? "Recovering..."
              : "Recover Incident"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <IncidentButton
            label="Database Down"
            type="db_down"
            icon={Database}
            onClick={simulateIncident}
            loading={loadingIncident}
          />

          <IncidentButton
            label="Payment Failure"
            type="payment_failure"
            icon={Activity}
            onClick={simulateIncident}
            loading={loadingIncident}
          />

          <IncidentButton
            label="Order Crash"
            type="order_crash"
            icon={Server}
            onClick={simulateIncident}
            loading={loadingIncident}
          />

          <IncidentButton
            label="API Failure"
            type="api_failure"
            icon={Zap}
            onClick={simulateIncident}
            loading={loadingIncident}
          />

          <IncidentButton
            label="CPU Spike"
            type="cpu_spike"
            icon={Gauge}
            onClick={simulateIncident}
            loading={loadingIncident}
          />

          <IncidentButton
            label="Memory Leak"
            type="memory_leak"
            icon={Activity}
            onClick={simulateIncident}
            loading={loadingIncident}
          />
        </div>

        {recoveryMessage && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#75E063]/20 bg-[#75E063]/[0.04] p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#75E063]" />

            <div>
              <p className="text-sm font-medium text-[#75E063]">
                Recovery Complete
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                {recoveryMessage}
              </p>
            </div>
          </div>
        )}
      </div>

      {lastIncident && (
        <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/[0.025] p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-red-400">
                Latest Incident
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                {formatValue(
                  lastIncident.incident_type
                )}
              </h2>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                {formatValue(
                  lastIncident.message
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <MetricChart />
        <ExecutionFeed />
      </div>
    </>
  )
}

/* =========================================================
   TELEMETRY
========================================================= */

function TelemetryStrip({ metrics }) {
  const cards = [
    {
      title: "CPU Usage",
      value:
        metrics?.cpu_usage !== undefined
          ? `${metrics.cpu_usage}%`
          : "--",
      subtitle: "Compute utilization",
      icon: Gauge,
      metric: "cpu",
      raw: metrics?.cpu_usage,
    },
    {
      title: "Memory",
      value:
        metrics?.memory_usage !== undefined
          ? `${metrics.memory_usage}%`
          : "--",
      subtitle: "Memory utilization",
      icon: Activity,
      metric: "memory",
      raw: metrics?.memory_usage,
    },
    {
      title: "API Latency",
      value:
        metrics?.api_latency !== undefined
          ? `${metrics.api_latency} ms`
          : "--",
      subtitle: "Average request latency",
      icon: Clock,
      metric: "latency",
      raw: metrics?.api_latency,
    },
    {
      title: "Error Rate",
      value:
        metrics?.error_rate !== undefined
          ? `${metrics.error_rate}%`
          : "--",
      subtitle: "Application error rate",
      icon: AlertTriangle,
      metric: "error",
      raw: metrics?.error_rate,
    },
  ]

  return (
    <section className="mt-8">
      <SectionHeading
        eyebrow="Live Telemetry"
        title="Infrastructure Metrics"
        icon={Activity}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const severity = getSeverity(
            card.metric,
            card.raw
          )

          return (
            <div
              key={card.title}
              className={`rounded-xl border bg-white/[0.025] p-5 ${
                severity === "critical"
                  ? "border-red-500/30"
                  : severity === "elevated"
                  ? "border-yellow-400/20"
                  : "border-white/[0.07]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
                    {card.title}
                  </p>

                  <p className="mt-3 text-2xl font-semibold text-white">
                    {card.value}
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
                    {card.subtitle}
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025]">
                  <card.icon className="h-4 w-4 text-violet-300" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    severity === "critical"
                      ? "bg-red-500"
                      : severity === "elevated"
                      ? "bg-yellow-400"
                      : "bg-[#75E063]"
                  }`}
                />

                <span className="text-[10px] text-gray-500">
                  {getSeverityText(severity)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* =========================================================
   PREDICTION
========================================================= */

function PredictionSummary({
  prediction,
  metrics,
}) {
  const data = prediction?.prediction

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
        <div className="flex items-center gap-3">
          <SparkIcon />

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-violet-300">
              Predictive Intelligence
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Sentinel Predictive Engine
            </h2>
          </div>
        </div>

        <p className="mt-5 text-sm text-gray-600">
          Waiting for predictive telemetry...
        </p>
      </div>
    )
  }

  const risk = Number(data.risk_score || 0)
  const confidence = Number(
    data.confidence || 0
  )

  const severity =
    risk >= 70
      ? "critical"
      : risk >= 40
      ? "elevated"
      : "normal"

  const riskColor =
    severity === "critical"
      ? "text-red-400"
      : severity === "elevated"
      ? "text-yellow-400"
      : "text-[#75E063]"

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <SparkIcon />

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-violet-300">
              Predictive Intelligence
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Failure Risk Assessment
            </h2>
          </div>
        </div>

        <span
          className={`rounded-full border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider ${
            severity === "critical"
              ? "border-red-500/20 bg-red-500/10 text-red-400"
              : severity === "elevated"
              ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-400"
              : "border-[#75E063]/20 bg-[#75E063]/10 text-[#75E063]"
          }`}
        >
          {data.warning_level ||
            "LOW FAILURE RISK"}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <PredictionBox
          label="Risk Score"
          value={`${risk}/100`}
          highlight
          className={riskColor}
        />

        <PredictionBox
          label="Predicted Incident"
          value={formatValue(
            data.predicted_incident
          )}
        />

        <PredictionBox
          label="Model Confidence"
          value={`${confidence}%`}
        />

        <PredictionBox
          label="At-Risk Service"
          value={formatValue(
            data.predicted_incident ===
              "cpu_saturation"
              ? "order-service"
              : metrics?.incident_type ||
                  "Infrastructure"
          )}
        />
      </div>
    </div>
  )
}

function PredictionBox({
  label,
  value,
  highlight = false,
  className = "",
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
      <p className="text-[9px] font-medium uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p
        className={`mt-3 text-sm font-medium ${
          highlight
            ? className || "text-[#75E063]"
            : "text-gray-300"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function SparkIcon() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/[0.06]">
      <Brain className="h-5 w-5 text-violet-300" />
    </div>
  )
}

/* =========================================================
   MONITORING
========================================================= */

function MonitoringPage({
  metrics,
  prediction,
  services,
  backendOnline,
}) {
  return (
    <>
      <PageHeader
        eyebrow="Observability"
        title="Monitoring"
        description="Live infrastructure telemetry, failure risk, and production service status."
        icon={Activity}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="CPU"
          value={
            metrics?.cpu_usage !== undefined
              ? `${metrics.cpu_usage}%`
              : "--"
          }
          subtitle="Current utilization"
          icon={Gauge}
          status="Live telemetry"
        />

        <MetricCard
          title="Memory"
          value={
            metrics?.memory_usage !==
            undefined
              ? `${metrics.memory_usage}%`
              : "--"
          }
          subtitle="Current utilization"
          icon={Activity}
          status="Live telemetry"
        />

        <MetricCard
          title="Latency"
          value={
            metrics?.api_latency !==
            undefined
              ? `${metrics.api_latency} ms`
              : "--"
          }
          subtitle="Average API latency"
          icon={Clock}
          status="Live telemetry"
        />

        <MetricCard
          title="Error Rate"
          value={
            metrics?.error_rate !==
            undefined
              ? `${metrics.error_rate}%`
              : "--"
          }
          subtitle="Application failures"
          icon={AlertTriangle}
          status="Live telemetry"
        />
      </div>

      <TelemetryStrip metrics={metrics} />

      <div className="mt-8">
        <PredictionSummary
          prediction={prediction}
          metrics={metrics}
        />
      </div>

      <div className="mt-8">
        <SectionHeading
          eyebrow="Infrastructure"
          title="Service Status"
          icon={Server}
        />

        <ServicesGrid
          services={services}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <MetricChart />
        <ExecutionFeed />
      </div>

      <div className="mt-8 rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              backendOnline
                ? "bg-[#75E063]"
                : "bg-red-500"
            }`}
          />

          <p className="text-sm text-gray-300">
            {backendOnline
              ? "Monitoring backend connected"
              : "Monitoring backend unavailable"}
          </p>
        </div>
      </div>
    </>
  )
}

/* =========================================================
   AI INVESTIGATION
========================================================= */

function AIInvestigationPage({
  incident,
  services,
  onTrigger,
  loading,
}) {
  return (
    <>
      <PageHeader
        eyebrow="AI Core"
        title="AI Investigation"
        description="Let Sentinel investigate active production incidents and expose evidence, confidence, root cause, and recommended action."
        icon={Brain}
      />

      {incident ? (
        <AIInvestigation
          incident={incident}
        />
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-8">
          <div className="mx-auto max-w-xl text-center">
            <Brain className="mx-auto h-10 w-10 text-violet-300" />

            <h2 className="mt-5 text-xl font-semibold text-white">
              No active investigation
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Trigger a controlled incident to
              activate Sentinel's investigation
              pipeline.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  onTrigger(
                    "payment_failure"
                  )
                }
                className="rounded-xl border border-violet-400/20 bg-violet-400/[0.06] px-4 py-3 text-sm text-violet-200 transition hover:bg-violet-400/[0.1] disabled:opacity-40"
              >
                Simulate Payment Failure
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  onTrigger(
                    "db_down"
                  )
                }
                className="rounded-xl border border-violet-400/20 bg-violet-400/[0.06] px-4 py-3 text-sm text-violet-200 transition hover:bg-violet-400/[0.1] disabled:opacity-40"
              >
                Simulate Database Down
              </button>
            </div>
          </div>
        </div>
      )}

      {services.length > 0 && (
        <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
          <p className="text-[10px] uppercase tracking-wider text-gray-600">
            Investigation Context
          </p>

          <p className="mt-3 text-sm text-gray-400">
            Sentinel currently monitors{" "}
            <span className="text-white">
              {services.length}
            </span>{" "}
            production services.
          </p>
        </div>
      )}
    </>
  )
}

/* =========================================================
   SERVICES
========================================================= */

function ServicesPage({
  services,
  backendOnline,
  healthPercentage,
}) {
  return (
    <>
      <PageHeader
        eyebrow="Infrastructure"
        title="Services"
        description="Every registered production service monitored by Sentinel AI."
        icon={Server}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total Services"
          value={services.length}
          subtitle="Registered services"
          icon={Server}
          status={
            backendOnline
              ? "Live"
              : "Offline"
          }
        />

        <MetricCard
          title="Healthy"
          value={
            services.filter(
              (service) =>
                service.status ===
                "healthy"
            ).length
          }
          subtitle="Healthy services"
          icon={CheckCircle2}
          status={`${healthPercentage}% health`}
        />

        <MetricCard
          title="Degraded"
          value={
            services.filter(
              (service) =>
                service.status !==
                "healthy"
            ).length
          }
          subtitle="Services requiring attention"
          icon={AlertTriangle}
          status="Review required"
        />
      </div>

      <div className="mt-8">
        <ServicesGrid
          services={services}
        />
      </div>
    </>
  )
}

function ServicesGrid({ services }) {
  if (!services.length) {
    return (
      <EmptyState
        icon={Server}
        title="No services found"
        description="Make sure the Sentinel backend is running."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
        />
      ))}
    </div>
  )
}

/* =========================================================
   DEPENDENCIES
========================================================= */

function DependenciesPage({
  graph,
  services,
}) {
  return (
    <>
      <PageHeader
        eyebrow="Architecture Intelligence"
        title="Dependencies"
        description="Understand how failures propagate through the production service graph."
        icon={GitBranch}
      />

      <DependencyGraph
        graph={graph}
        services={services}
      />

      <div className="mt-8 rounded-2xl border border-violet-400/10 bg-violet-400/[0.025] p-6">
        <div className="flex items-start gap-3">
          <Network className="mt-0.5 h-5 w-5 text-violet-300" />

          <div>
            <p className="text-sm font-medium text-white">
              Dependency intelligence
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-600">
              Sentinel uses service relationships
              to reason about direct impact and
              downstream risk during incidents.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function DependencyGraph({
  graph,
  services,
}) {
  if (!graph) {
    return (
      <EmptyState
        icon={Network}
        title="Dependency graph unavailable"
        description="Waiting for dependency intelligence from the backend."
      />
    )
  }

  const dependencies =
    graph.dependencies || []

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => {
          const items =
            dependencies
              .filter(
                (item) =>
                  item.service ===
                  service.name
              )
              .map(
                (item) =>
                  item.depends_on
              )

          const degraded =
            service.status !==
            "healthy"

          return (
            <div
              key={service.id}
              className={`rounded-xl border p-5 ${
                degraded
                  ? "border-red-500/20 bg-red-500/[0.035]"
                  : "border-white/[0.06] bg-black/10"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      degraded
                        ? "bg-red-500"
                        : "bg-[#75E063]"
                    }`}
                  />

                  <span className="truncate text-sm font-medium text-white">
                    {service.name}
                  </span>
                </div>

                <span
                  className={`text-[9px] uppercase tracking-wider ${
                    degraded
                      ? "text-red-400"
                      : "text-[#75E063]"
                  }`}
                >
                  {service.status}
                </span>
              </div>

              {items.length ? (
                <div className="mt-4 space-y-2">
                  <p className="text-[9px] uppercase tracking-wider text-gray-600">
                    Depends on
                  </p>

                  {items.map((dependency) => (
                    <div
                      key={dependency}
                      className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
                    >
                      <span className="text-violet-300">
                        →
                      </span>

                      <span className="text-xs text-gray-400">
                        {dependency}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs text-gray-600">
                  Root-level service
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* =========================================================
   REMEDIATION
========================================================= */

function RemediationPage({
  incident,
  recoveryMessage,
  recovering,
  degradedServices,
  onRecover,
}) {
  return (
    <>
      <PageHeader
        eyebrow="Recovery Control"
        title="Remediation"
        description="Recover degraded infrastructure through Sentinel's controlled recovery flow."
        icon={Wrench}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#75E063]/15 bg-[#75E063]/[0.05]">
              <ShieldCheck className="h-5 w-5 text-[#75E063]" />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-600">
                Recovery Status
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                {degradedServices.length
                  ? "Attention Required"
                  : "System Stable"}
              </h2>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-gray-500">
            {degradedServices.length
              ? `${degradedServices.length} service(s) are currently degraded.`
              : "No degraded services detected."}
          </p>

          <button
            type="button"
            onClick={onRecover}
            disabled={
              recovering ||
              degradedServices.length ===
                0
            }
            className="mt-6 flex items-center gap-2 rounded-xl border border-[#75E063]/25 bg-[#75E063]/10 px-5 py-3 text-sm font-medium text-[#75E063] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                recovering
                  ? "animate-spin"
                  : ""
              }`}
            />

            {recovering
              ? "Recovering..."
              : "Recover Services"}
          </button>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
          <p className="text-[10px] uppercase tracking-wider text-gray-600">
            Current Incident
          </p>

          <h2 className="mt-2 text-lg font-semibold text-white">
            {incident
              ? formatValue(
                  incident.incident_type
                )
              : "No active incident"}
          </h2>

          {incident && (
            <div className="mt-5 space-y-3">
              <DetailRow
                label="Affected Service"
                value={
                  incident.affected_service
                }
              />

              <DetailRow
                label="Status"
                value={incident.status}
              />
            </div>
          )}
        </div>
      </div>

      {recoveryMessage && (
        <div className="mt-6 rounded-xl border border-[#75E063]/20 bg-[#75E063]/[0.04] p-5">
          <p className="text-sm font-medium text-[#75E063]">
            Recovery Result
          </p>

          <p className="mt-2 text-xs leading-5 text-gray-500">
            {recoveryMessage}
          </p>
        </div>
      )}
    </>
  )
}

/* =========================================================
   INCIDENT MEMORY
========================================================= */

function IncidentMemoryPage({
  memory,
  loading,
  onRefresh,
}) {
  return (
    <>
      <PageHeader
        eyebrow="Persistent Intelligence"
        title="Incident Memory"
        description="Historical incident knowledge stored by Sentinel and used to improve future investigations."
        icon={History}
      />

      <div className="mb-6 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
        <div>
          <p className="text-sm text-white">
            {memory.length} historical incident
            {memory.length === 1
              ? ""
              : "s"}
          </p>

          <p className="mt-1 text-[10px] text-gray-600">
            Stored in Sentinel incident memory
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-gray-400 hover:text-white disabled:opacity-40"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              loading
                ? "animate-spin"
                : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {loading ? (
        <EmptyState
          icon={History}
          title="Loading incident memory"
          description="Sentinel is retrieving historical incidents."
        />
      ) : memory.length === 0 ? (
        <EmptyState
          icon={History}
          title="No incidents stored yet"
          description="Run a controlled incident and Sentinel will record the investigation and recovery outcome."
        />
      ) : (
        <div className="space-y-4">
          {memory.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.recovery_success
                          ? "bg-[#75E063]"
                          : "bg-red-500"
                      }`}
                    />

                    <p className="text-sm font-semibold text-white">
                      {formatValue(
                        item.incident_type
                      )}
                    </p>
                  </div>

                  <p className="mt-2 text-xs text-gray-600">
                    {formatValue(
                      item.affected_service
                    )}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1.5 text-[9px] uppercase tracking-wider ${
                    item.recovery_success
                      ? "border-[#75E063]/20 bg-[#75E063]/10 text-[#75E063]"
                      : "border-red-500/20 bg-red-500/10 text-red-400"
                  }`}
                >
                  {item.recovery_success
                    ? "Recovery successful"
                    : "Recovery unresolved"}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailRow
                  label="Root Cause"
                  value={item.root_cause}
                />

                <DetailRow
                  label="Recovery Action"
                  value={
                    item.recovery_action
                  }
                />

                <DetailRow
                  label="Confidence"
                  value={
                    item.confidence !==
                    null
                      ? `${item.confidence}%`
                      : "Unknown"
                  }
                />

                <DetailRow
                  label="Recovery Time"
                  value={
                    item.recovery_time_seconds !==
                    null
                      ? `${item.recovery_time_seconds}s`
                      : "Unknown"
                  }
                />
              </div>

              {item.lesson && (
                <div className="mt-4 rounded-xl border border-violet-400/10 bg-violet-400/[0.025] p-4">
                  <p className="text-[9px] uppercase tracking-wider text-violet-300">
                    Lesson Learned
                  </p>

                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    {item.lesson}
                  </p>
                </div>
              )}

              {item.created_at && (
                <p className="mt-4 text-[9px] text-gray-700">
                  {new Date(
                    item.created_at
                  ).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* =========================================================
   SYSTEM HEALTH
========================================================= */

function SystemHealthPage({
  services,
  metrics,
  backendOnline,
  healthPercentage,
}) {
  const states = services.map(
    (service) => service.status
  )

  const degraded = states.filter(
    (state) => state !== "healthy"
  ).length

  return (
    <>
      <PageHeader
        eyebrow="System Status"
        title="System Health"
        description="A high-level view of Sentinel and the production environment it monitors."
        icon={ShieldCheck}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HealthCard
          label="Backend"
          value={
            backendOnline
              ? "Operational"
              : "Offline"
          }
          good={backendOnline}
          icon={Server}
        />

        <HealthCard
          label="Infrastructure"
          value={`${healthPercentage}%`}
          good={healthPercentage >= 90}
          icon={ShieldCheck}
        />

        <HealthCard
          label="Degraded Services"
          value={degraded}
          good={degraded === 0}
          icon={AlertTriangle}
        />

        <HealthCard
          label="Telemetry"
          value={
            metrics
              ? "Live"
              : "Waiting"
          }
          good={Boolean(metrics)}
          icon={Activity}
        />
      </div>

      <div className="mt-8">
        <SectionHeading
          eyebrow="Service Health"
          title="Current Infrastructure"
          icon={Server}
        />

        <ServicesGrid
          services={services}
        />
      </div>
    </>
  )
}

function HealthCard({
  label,
  value,
  good,
  icon: Icon,
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-gray-600">
            {label}
          </p>

          <p
            className={`mt-3 text-lg font-semibold ${
              good
                ? "text-[#75E063]"
                : "text-red-400"
            }`}
          >
            {value}
          </p>
        </div>

        <Icon
          className={`h-5 w-5 ${
            good
              ? "text-[#75E063]"
              : "text-red-400"
          }`}
        />
      </div>
    </div>
  )
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage({
  backendOnline,
  apiBase,
}) {
  return (
    <>
      <PageHeader
        eyebrow="System Configuration"
        title="Settings"
        description="Sentinel runtime and connection configuration."
        icon={Settings}
      />

      <div className="space-y-4">
        <SettingRow
          title="Permanent Dark Interface"
          description="Sentinel uses the premium dark operations interface."
          value="Enabled"
        />

        <SettingRow
          title="Backend Connection"
          description="Connection state for the Sentinel FastAPI backend."
          value={
            backendOnline
              ? "Connected"
              : "Offline"
          }
        />

        <SettingRow
          title="API Endpoint"
          description="Current frontend API connection target."
          value={apiBase}
        />

        <SettingRow
          title="Telemetry Refresh"
          description="Live metrics refresh automatically from the backend."
          value="Active"
        />
      </div>
    </>
  )
}

function SettingRow({
  title,
  description,
  value,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-600">
          {description}
        </p>
      </div>

      <span className="rounded-lg border border-white/[0.07] bg-black/10 px-3 py-2 text-xs text-gray-400">
        {value}
      </span>
    </div>
  )
}

/* =========================================================
   SHARED UI
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  icon: Icon,
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-4 w-4 text-[#75E063]" />
        )}

        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#75E063]">
          {eyebrow}
        </p>
      </div>

      <h2 className="mt-1 text-lg font-semibold text-white">
        {title}
      </h2>
    </div>
  )
}

function IncidentButton({
  label,
  type,
  icon: Icon,
  onClick,
  loading,
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onClick(type)
      }
      disabled={loading}
      className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-4 text-left transition hover:border-red-500/20 hover:bg-red-500/[0.025] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025]">
        <Icon className="h-4 w-4 text-gray-500 transition group-hover:text-red-400" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-300">
          {label}
        </p>

        <p className="mt-1 text-[9px] text-gray-700">
          Inject controlled failure
        </p>
      </div>
    </button>
  )
}

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-black/10 p-3">
      <p className="text-[8px] uppercase tracking-wider text-gray-700">
        {label}
      </p>

      <p className="mt-1 truncate text-xs text-gray-400">
        {formatValue(value)}
      </p>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-10 text-center">
      <Icon className="mx-auto h-8 w-8 text-gray-700" />

      <h3 className="mt-4 text-sm font-medium text-gray-400">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-700">
        {description}
      </p>
    </div>
  )
}

function AIInvestigationPlaceholder() {
  return null
}

function HealthStatusIcon({
  good,
}) {
  return good ? (
    <CheckCircle2 className="h-4 w-4 text-[#75E063]" />
  ) : (
    <AlertTriangle className="h-4 w-4 text-red-400" />
  )
}

export default App