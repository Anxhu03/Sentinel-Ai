import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Database,
  Gauge,
  RotateCcw,
  Server,
  Shield,
  Zap,
  Cpu,
  MemoryStick,
  Clock3,
  TrendingUp,
  Network,
  Target,
  GitBranch,
  TriangleAlert,
  Sparkles,
  ShieldAlert,
  FlaskConical,
  ArrowUpRight,
  Clock,
  Scale,
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

function App() {
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

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/services/`)

      if (!response.ok) {
        throw new Error("Failed to fetch services")
      }

      const data = await response.json()

      setServices(Array.isArray(data) ? data : [])
      setBackendOnline(true)
    } catch (error) {
      console.error("Backend connection error:", error)
      setBackendOnline(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/metrics/`)

      if (!response.ok) {
        throw new Error("Failed to fetch metrics")
      }

      const data = await response.json()

      setMetrics(data)
      setBackendOnline(true)
    } catch (error) {
      console.error("Metrics connection error:", error)
    }
  }

  const fetchDependencyGraph = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dependencies/`)

      if (!response.ok) {
        throw new Error("Failed to fetch dependency graph")
      }

      const data = await response.json()

      setDependencyGraph(data)
    } catch (error) {
      console.error("Dependency graph error:", error)
    }
  }

  const fetchPrediction = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/prediction/`)

      if (!response.ok) {
        throw new Error("Failed to fetch prediction")
      }

      const data = await response.json()

      setPrediction(data)
    } catch (error) {
      console.error("Prediction engine error:", error)
    }
  }

  const runSimulation = async () => {
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
        throw new Error("Simulation request failed")
      }

      const data = await response.json()

      setSimulation(data)
      setBackendOnline(true)

      console.log("What-If simulation:", data)
    } catch (error) {
      console.error("Simulation error:", error)

      setSimulation({
        status: "error",
        message:
          "Unable to run simulation. Make sure the Sentinel backend is running.",
      })
    } finally {
      setSimulationLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
    fetchMetrics()
    fetchDependencyGraph()
    fetchPrediction()

    const servicesInterval = setInterval(fetchServices, 3000)
    const metricsInterval = setInterval(fetchMetrics, 2000)
    const predictionInterval = setInterval(fetchPrediction, 3000)

    return () => {
      clearInterval(servicesInterval)
      clearInterval(metricsInterval)
      clearInterval(predictionInterval)
    }
  }, [])

  const simulateIncident = async (incidentType) => {
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
        throw new Error("Failed to simulate incident")
      }

      const data = await response.json()

      console.log("Incident response:", data)

      setLastIncident(data)

      if (data.affected_service) {
        setSimulationService(data.affected_service)
      }

      if (data.incident_type) {
        setSimulationIncident(data.incident_type)
      }

      await fetchServices()
      await fetchMetrics()
      await fetchDependencyGraph()
      await fetchPrediction()
    } catch (error) {
      console.error("Incident simulation error:", error)

      setLastIncident({
        status: "error",
        incident_type: incidentType,
        message: "Failed to trigger incident.",
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
        throw new Error("Recovery request failed")
      }

      const data = await response.json()

      console.log("Recovery response:", data)

      setRecoveryMessage(
        data.message || "All affected services have been restored."
      )

      setLastIncident(null)
      setSimulation(null)

      await fetchServices()
      await fetchMetrics()
      await fetchDependencyGraph()
      await fetchPrediction()
    } catch (error) {
      console.error("Recovery error:", error)

      setRecoveryMessage(
        "Recovery failed. Please make sure the Sentinel backend is running."
      )
    } finally {
      setRecovering(false)
    }
  }

  const healthyServices = useMemo(
    () => services.filter((service) => service.status === "healthy"),
    [services]
  )

  const degradedServices = useMemo(
    () => services.filter((service) => service.status !== "healthy"),
    [services]
  )

  const activeIncidents = degradedServices.length
  const totalServices = services.length

  const healthPercentage =
    totalServices > 0
      ? Math.round((healthyServices.length / totalServices) * 100)
      : 0

  const cpuValue = metrics?.cpu_usage
  const memoryValue = metrics?.memory_usage
  const latencyValue = metrics?.api_latency
  const errorValue = metrics?.error_rate

  const cpuUsage =
    cpuValue !== undefined ? `${cpuValue}%` : "--"

  const memoryUsage =
    memoryValue !== undefined ? `${memoryValue}%` : "--"

  const apiLatency =
    latencyValue !== undefined ? `${latencyValue} ms` : "--"

  const errorRate =
    errorValue !== undefined ? `${errorValue}%` : "--"

  const requestsPerMinute =
    metrics?.requests_per_minute !== undefined
      ? metrics.requests_per_minute.toLocaleString()
      : "--"

  const telemetryState = getTelemetryState(metrics)

  return (
    <div className="min-h-screen bg-[#0B120E] text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <Topbar />

          <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-8">

            {/* HEADER */}

            <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#75E063] shadow-[0_0_10px_#75E063]" />

                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#75E063]">
                    Sentinel AI Operations Center
                  </span>
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                  Enterprise Operations Dashboard
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
                  Monitor production infrastructure, investigate incidents,
                  and let Sentinel AI identify root causes automatically.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
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
                      ? "Live infrastructure monitoring"
                      : "Waiting for API connection"}
                  </p>
                </div>
              </div>
            </div>

            {/* TOP METRICS */}

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

            {/* LIVE TELEMETRY */}

            <section className="mt-8">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        telemetryState === "critical"
                          ? "bg-red-500 shadow-[0_0_8px_#ef4444]"
                          : telemetryState === "elevated"
                          ? "bg-yellow-400 shadow-[0_0_8px_#facc15]"
                          : "bg-[#75E063] shadow-[0_0_8px_#75E063]"
                      }`}
                    />

                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#75E063]">
                      Live Telemetry
                    </p>
                  </div>

                  <h2 className="mt-1 text-lg font-semibold text-white">
                    Infrastructure Metrics
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  <Activity className="h-3 w-3 text-[#75E063]" />
                  Updating every 2 seconds
                </div>
              </div>

              {metrics?.incident_active && (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[0.04] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-red-400">
                        Active Telemetry Anomaly
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {formatValue(metrics.incident_type)}
                        {" • "}
                        Production metrics are outside normal operating range.
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[9px] font-medium uppercase tracking-wider text-red-400">
                    Incident Active
                  </span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <TelemetryCard
                  title="CPU Usage"
                  value={cpuUsage}
                  subtitle="Current compute utilization"
                  icon={Cpu}
                  state={getMetricSeverity("cpu", cpuValue)}
                />

                <TelemetryCard
                  title="Memory"
                  value={memoryUsage}
                  subtitle="Current memory utilization"
                  icon={MemoryStick}
                  state={getMetricSeverity("memory", memoryValue)}
                />

                <TelemetryCard
                  title="API Latency"
                  value={apiLatency}
                  subtitle="Average request latency"
                  icon={Clock3}
                  state={getMetricSeverity("latency", latencyValue)}
                />

                <TelemetryCard
                  title="Error Rate"
                  value={errorRate}
                  subtitle="Current application errors"
                  icon={AlertTriangle}
                  state={getMetricSeverity("error", errorValue)}
                />

                <TelemetryCard
                  title="Requests / Min"
                  value={requestsPerMinute}
                  subtitle="Current traffic volume"
                  icon={TrendingUp}
                  state={
                    metrics?.incident_active
                      ? "elevated"
                      : "normal"
                  }
                />
              </div>
            </section>

            {/* PREDICTIVE INTELLIGENCE */}

            <section className="mt-8">
              <PredictionPanel
                prediction={prediction}
                services={services}
                metrics={metrics}
              />
            </section>

            {/* WHAT-IF SIMULATOR */}

            <section className="mt-8">
              <WhatIfSimulationPanel
                simulation={simulation}
                simulationLoading={simulationLoading}
                canSimulate={services.length > 0}
                onSimulate={runSimulation}
              />
            </section>

            {/* SERVICE DEPENDENCY GRAPH */}

            <section className="mt-8">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-[#75E063]" />

                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#75E063]">
                      Architecture Intelligence
                    </p>
                  </div>

                  <h2 className="mt-1 text-lg font-semibold text-white">
                    Service Dependency Graph
                  </h2>

                  <p className="mt-1 text-xs text-gray-600">
                    Sentinel understands how production services depend on each other.
                  </p>
                </div>

                <div className="text-xs text-gray-600">
                  {dependencyGraph?.dependencies?.length || 0} relationships
                </div>
              </div>

              <DependencyGraphPanel
                graph={dependencyGraph}
                services={services}
              />
            </section>

            {/* INCIDENT SIMULATOR */}

            <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#75E063]/20 bg-[#75E063]/10">
                      <Zap className="h-5 w-5 text-[#75E063]" />
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[#75E063]">
                        Controlled Failure Environment
                      </p>

                      <h2 className="mt-1 text-lg font-semibold text-white">
                        Incident Simulator
                      </h2>
                    </div>
                  </div>

                  <p className="mt-3 max-w-2xl text-xs leading-5 text-gray-600">
                    Inject controlled production failures and observe
                    Sentinel AI detect, investigate, and explain the incident.
                  </p>
                </div>

                <button
                  onClick={recoverIncident}
                  disabled={
                    recovering ||
                    loadingIncident ||
                    degradedServices.length === 0
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#75E063]/30 bg-[#75E063]/10 px-5 py-3 text-sm font-medium text-[#75E063] transition hover:bg-[#75E063]/15 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <RotateCcw
                    className={`h-4 w-4 ${
                      recovering ? "animate-spin" : ""
                    }`}
                  />

                  {recovering
                    ? "Recovering..."
                    : "Recover Incident"}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                  icon={Activity}
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
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#75E063]/20 bg-[#75E063]/5 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#75E063]" />

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
            </section>

            {/* INCIDENT RESULT */}

            {lastIncident && (
              <section className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/[0.025] p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-red-400">
                        Incident Triggered
                      </p>

                      <h2 className="mt-1 text-lg font-semibold text-white">
                        {formatValue(
                          lastIncident.incident_type ||
                            "Production Incident"
                        )}
                      </h2>

                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        {formatValue(
                          lastIncident.message ||
                            "A controlled production failure has been injected."
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-red-400">
                    Triggered
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <IncidentDetail
                    label="Incident Type"
                    value={lastIncident.incident_type}
                  />

                  <IncidentDetail
                    label="Affected Service"
                    value={
                      lastIncident.affected_service ||
                      "Service under investigation"
                    }
                  />

                  <IncidentDetail
                    label="Status"
                    value={lastIncident.status}
                  />

                  <IncidentDetail
                    label="Detection"
                    value="Sentinel AI"
                  />
                </div>

                {lastIncident.impact_analysis && (
                  <ImpactPropagation
                    impact={lastIncident.impact_analysis}
                  />
                )}
              </section>
            )}

            {/* AI INVESTIGATION */}

            {lastIncident && (
              <section className="mt-8">
                <AIInvestigation incident={lastIncident} />
              </section>
            )}

            {/* ROOT CAUSE */}

            {lastIncident?.root_cause_analysis && (
              <RootCauseAnalysis
                analysis={lastIncident.root_cause_analysis}
              />
            )}

            {/* SERVICE HEALTH */}

            <section className="mt-8">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#75E063]">
                    Infrastructure
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-white">
                    Service Health
                  </h2>
                </div>

                <div className="text-xs text-gray-600">
                  {healthyServices.length}/{totalServices} healthy
                </div>
              </div>

              {services.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-10 text-center">
                  <Server className="mx-auto h-8 w-8 text-gray-700" />

                  <p className="mt-4 text-sm text-gray-500">
                    No services found.
                  </p>

                  <p className="mt-1 text-xs text-gray-700">
                    Make sure the Sentinel backend is running.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* CHART + FEED */}

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <MetricChart />
              <ExecutionFeed />
            </section>

            {/* FOOTER */}

            <footer className="mt-10 border-t border-white/10 py-6">
              <div className="flex flex-col gap-2 text-[10px] text-gray-700 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  SENTINEL AI • Enterprise AI Operations Copilot
                </span>

                <span>
                  Monitoring {totalServices} production services
                </span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}


/* =========================================================
   WHAT-IF SIMULATOR
========================================================= */

function WhatIfSimulator({
  simulation,
  simulationLoading,
  simulationService,
  simulationIncident,
  setSimulationService,
  setSimulationIncident,
  runSimulation,
  services,
}) {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.02] p-6">

      {/* HEADER */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
            <FlaskConical className="h-5 w-5 text-violet-400" />
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-violet-400">
              Decision Intelligence
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Production What-If Simulator
            </h2>

            <p className="mt-1 text-xs text-gray-600">
              Compare remediation strategies before touching production.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />

          <span className="text-[10px] font-medium uppercase tracking-wider text-violet-400">
            Digital Twin Mode
          </span>
        </div>
      </div>

      {/* CONTROLS */}

      <div className="mt-6 rounded-xl border border-white/10 bg-black/10 p-5">

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">

          <div>
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-gray-600">
              Target Service
            </label>

            <select
              value={simulationService}
              onChange={(event) =>
                setSimulationService(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#0B120E] px-4 py-3 text-sm text-gray-300 outline-none transition focus:border-violet-500/40"
            >
              {services.length > 0 ? (
                services.map((service) => (
                  <option
                    key={service.id}
                    value={service.name}
                  >
                    {service.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="payment-service">
                    payment-service
                  </option>
                  <option value="order-service">
                    order-service
                  </option>
                  <option value="product-service">
                    product-service
                  </option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-gray-600">
              Incident Scenario
            </label>

            <select
              value={simulationIncident}
              onChange={(event) =>
                setSimulationIncident(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-[#0B120E] px-4 py-3 text-sm text-gray-300 outline-none transition focus:border-violet-500/40"
            >
              <option value="payment_failure">
                Payment Failure
              </option>

              <option value="db_down">
                Database Down
              </option>

              <option value="cpu_spike">
                CPU Spike
              </option>

              <option value="memory_leak">
                Memory Leak
              </option>

              <option value="order_crash">
                Order Crash
              </option>

              <option value="api_failure">
                API Failure
              </option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={runSimulation}
              disabled={simulationLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-6 py-3 text-sm font-medium text-violet-300 transition hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
            >
              <FlaskConical
                className={`h-4 w-4 ${
                  simulationLoading ? "animate-pulse" : ""
                }`}
              />

              {simulationLoading
                ? "Simulating..."
                : "Run What-If"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
          <Shield className="h-3.5 w-3.5 text-violet-400" />

          <p className="text-[10px] text-gray-600">
            Simulation only. No real production action is executed.
          </p>
        </div>
      </div>

      {/* RESULTS */}

      {simulation?.status === "error" ? (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.03] p-5">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-400" />

            <p className="text-sm text-red-400">
              {simulation.message}
            </p>
          </div>
        </div>
      ) : simulation ? (
        <SimulationResults simulation={simulation} />
      ) : (
        <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-8 text-center">
          <Target className="mx-auto h-7 w-7 text-gray-700" />

          <p className="mt-3 text-sm text-gray-500">
            No simulation has been run yet.
          </p>

          <p className="mt-1 text-xs text-gray-700">
            Sentinel will compare multiple remediation strategies here.
          </p>
        </div>
      )}
    </div>
  )
}


/* =========================================================
   SIMULATION RESULTS
========================================================= */

function SimulationResults({ simulation }) {
  const scenarios = Array.isArray(simulation.scenarios)
    ? simulation.scenarios
    : []

  const recommended = simulation.recommended_action

  return (
    <div className="mt-5">

      {/* RECOMMENDATION */}

      {recommended && (
        <div className="rounded-xl border border-[#75E063]/25 bg-[#75E063]/[0.035] p-5">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#75E063]/20 bg-[#75E063]/10">
                <CheckCircle2 className="h-5 w-5 text-[#75E063]" />
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#75E063]">
                  Sentinel Recommendation
                </p>

                <h3 className="mt-1 text-lg font-semibold text-white">
                  {formatValue(recommended.name)}
                </h3>

                <p className="mt-1 text-xs text-gray-600">
                  Best recovery-to-risk balance for this scenario.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <SimulationMiniStat
                label="Recovery"
                value={`${recommended.recovery_probability}%`}
              />

              <SimulationMiniStat
                label="Risk"
                value={recommended.risk}
              />

              <SimulationMiniStat
                label="Impact"
                value={recommended.impact}
              />
            </div>
          </div>
        </div>
      )}

      {/* SCENARIO COMPARISON */}

      <div className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
              Scenario Comparison
            </p>

            <p className="mt-1 text-xs text-gray-700">
              {simulation.scenario_count || scenarios.length} possible remediation strategies evaluated
            </p>
          </div>

          <Scale className="h-4 w-4 text-violet-400" />
        </div>

        <div className="space-y-3">
          {scenarios.map((scenario, index) => (
            <ScenarioCard
              key={scenario.action}
              scenario={scenario}
              rank={index + 1}
              recommended={scenario.action === recommended?.action}
            />
          ))}
        </div>
      </div>

      {/* DECISION */}

      {simulation.decision && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-black/10 p-4">
          <Brain className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />

          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-violet-400">
              AI Decision
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              {formatValue(simulation.decision)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}


/* =========================================================
   SCENARIO CARD
========================================================= */

function ScenarioCard({
  scenario,
  rank,
  recommended,
}) {
  const riskStyle = {
    Low: {
      text: "text-[#75E063]",
      border: "border-[#75E063]/20",
      background: "bg-[#75E063]/5",
    },
    Medium: {
      text: "text-yellow-400",
      border: "border-yellow-400/20",
      background: "bg-yellow-400/5",
    },
    High: {
      text: "text-red-400",
      border: "border-red-500/20",
      background: "bg-red-500/5",
    },
  }

  const style = riskStyle[scenario.risk] || riskStyle.Medium

  return (
    <div
      className={`rounded-xl border p-5 transition ${
        recommended
          ? "border-[#75E063]/30 bg-[#75E063]/[0.035]"
          : "border-white/10 bg-black/10"
      }`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">

        <div className="flex min-w-0 items-center gap-3 xl:w-[30%]">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
              recommended
                ? "border-[#75E063]/20 bg-[#75E063]/10"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <span
              className={`text-xs font-semibold ${
                recommended
                  ? "text-[#75E063]"
                  : "text-gray-600"
              }`}
            >
              #{rank}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-white">
                {formatValue(scenario.action_name)}
              </p>

              {recommended && (
                <span className="shrink-0 rounded-full border border-[#75E063]/20 bg-[#75E063]/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#75E063]">
                  AI Pick
                </span>
              )}
            </div>

            <p className="mt-1 line-clamp-1 text-[10px] text-gray-600">
              {formatValue(scenario.description)}
            </p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">

          <ScenarioMetric
            label="Recovery"
            value={`${scenario.recovery_probability}%`}
            icon={TrendingUp}
            highlight={scenario.recovery_probability >= 90}
          />

          <ScenarioMetric
            label="Risk"
            value={scenario.risk}
            icon={ShieldAlert}
            className={`${style.text}`}
          />

          <ScenarioMetric
            label="Impact"
            value={scenario.impact}
            icon={Network}
          />

          <ScenarioMetric
            label="Recovery Time"
            value={`${scenario.estimated_recovery_seconds}s`}
            icon={Clock}
          />

        </div>

        <div className="xl:w-24">
          <div className="text-right">
            <p className="text-[8px] uppercase tracking-wider text-gray-700">
              Decision Score
            </p>

            <p
              className={`mt-1 text-lg font-semibold ${
                recommended
                  ? "text-[#75E063]"
                  : "text-gray-400"
              }`}
            >
              {scenario.decision_score}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full ${
            recommended
              ? "bg-[#75E063]"
              : style.background.replace("bg-", "bg-")
          }`}
          style={{
            width: `${Math.min(
              100,
              Math.max(5, scenario.recovery_probability)
            )}%`,
          }}
        />
      </div>
    </div>
  )
}


/* =========================================================
   SIMULATION MINI STAT
========================================================= */

function SimulationMiniStat({ label, value }) {
  return (
    <div className="min-w-[70px] rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-center">
      <p className="text-[8px] uppercase tracking-wider text-gray-700">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-gray-300">
        {value}
      </p>
    </div>
  )
}


/* =========================================================
   SCENARIO METRIC
========================================================= */

function ScenarioMetric({
  label,
  value,
  icon: Icon,
  highlight = false,
  className = "",
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon
        className={`h-3.5 w-3.5 ${
          highlight
            ? "text-[#75E063]"
            : className || "text-gray-600"
        }`}
      />

      <div>
        <p className="text-[8px] uppercase tracking-wider text-gray-700">
          {label}
        </p>

        <p
          className={`mt-0.5 text-xs font-medium ${
            highlight
              ? "text-[#75E063]"
              : className || "text-gray-400"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  )
}


/* =========================================================
   PREDICTIVE INTELLIGENCE
========================================================= */

function PredictionPanel({ prediction, services, metrics }) {
  if (!prediction?.prediction) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#75E063]/20 bg-[#75E063]/10">
            <Sparkles className="h-5 w-5 text-[#75E063]" />
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#75E063]">
              Predictive Intelligence
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Sentinel Predictive Engine
            </h2>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/10 p-6 text-center">
          <Activity className="mx-auto h-6 w-6 animate-pulse text-gray-600" />

          <p className="mt-3 text-sm text-gray-500">
            Waiting for predictive telemetry...
          </p>
        </div>
      </div>
    )
  }

  const data = prediction.prediction

  const riskScore = Number(data.risk_score || 0)
  const confidence = Number(data.confidence || 0)

  const signals = Array.isArray(data.signals)
    ? data.signals
    : []

  const atRiskService = getAtRiskService(
    data,
    metrics,
    services
  )

  const severity =
    riskScore >= 70
      ? "critical"
      : riskScore >= 40
      ? "elevated"
      : "normal"

  const severityStyles = {
    critical: {
      border: "border-red-500/30",
      background: "bg-red-500/[0.035]",
      icon: "border-red-500/20 bg-red-500/10",
      iconText: "text-red-400",
      text: "text-red-400",
      bar: "bg-red-500",
      label: "HIGH FAILURE RISK",
    },

    elevated: {
      border: "border-yellow-400/25",
      background: "bg-yellow-400/[0.025]",
      icon: "border-yellow-400/20 bg-yellow-400/10",
      iconText: "text-yellow-400",
      text: "text-yellow-400",
      bar: "bg-yellow-400",
      label: "ELEVATED FAILURE RISK",
    },

    normal: {
      border: "border-[#75E063]/20",
      background: "bg-[#75E063]/[0.025]",
      icon: "border-[#75E063]/20 bg-[#75E063]/10",
      iconText: "text-[#75E063]",
      text: "text-[#75E063]",
      bar: "bg-[#75E063]",
      label: "LOW FAILURE RISK",
    },
  }

  const style = severityStyles[severity]

  return (
    <div
      className={`rounded-2xl border p-6 ${style.border} ${style.background}`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl border ${style.icon}`}
          >
            <Sparkles className={`h-5 w-5 ${style.iconText}`} />
          </div>

          <div>
            <p className={`text-[11px] font-medium uppercase tracking-[0.18em] ${style.text}`}>
              Predictive Intelligence
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Sentinel Predictive Engine
            </h2>

            <p className="mt-1 text-xs text-gray-600">
              Continuous failure-risk assessment from live telemetry
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 self-start rounded-full border px-3 py-1.5 ${style.border}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${style.bar} shadow-[0_0_8px_currentColor]`}
          />

          <span className={`text-[10px] font-semibold uppercase tracking-wider ${style.text}`}>
            {data.warning_level || severity}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.5fr]">

        <div className="rounded-xl border border-white/10 bg-black/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
                Failure Risk Score
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className={`text-5xl font-semibold tracking-tight ${style.text}`}>
                  {riskScore}
                </span>

                <span className="mb-1 text-sm text-gray-600">
                  / 100
                </span>
              </div>
            </div>

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl border ${style.icon}`}
            >
              {riskScore >= 70 ? (
                <ShieldAlert className={`h-5 w-5 ${style.iconText}`} />
              ) : (
                <Gauge className={`h-5 w-5 ${style.iconText}`} />
              )}
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
              style={{
                width: `${Math.max(3, riskScore)}%`,
              }}
            />
          </div>

          <div className="mt-3 flex justify-between text-[9px] uppercase tracking-wider text-gray-700">
            <span>Normal</span>
            <span>Elevated</span>
            <span>Critical</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/10 p-6">
          <div className="grid gap-5 sm:grid-cols-2">

            <PredictionValue
              label="Predicted Incident"
              value={formatValue(data.predicted_incident)}
              icon={TriangleAlert}
              highlight={severity !== "normal"}
            />

            <PredictionValue
              label="At-Risk Service"
              value={formatValue(atRiskService)}
              icon={Server}
            />

            <PredictionValue
              label="Model Confidence"
              value={`${confidence}%`}
              icon={Target}
              highlight
            />

            <PredictionValue
              label="Engine Status"
              value="ACTIVE"
              icon={Brain}
              highlight
            />

          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">

        <div className="rounded-xl border border-white/10 bg-black/10 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
              Supporting Signals
            </p>

            <span className="text-[9px] uppercase tracking-wider text-gray-700">
              {signals.length} detected
            </span>
          </div>

          {signals.length > 0 ? (
            <div className="mt-4 space-y-2">
              {signals.map((signal, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${style.bar}`}
                  />

                  <span className="text-xs leading-5 text-gray-400">
                    {formatValue(signal)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs text-gray-600">
                No abnormal predictive signals detected.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#75E063]/15 bg-[#75E063]/[0.02] p-5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#75E063]" />

            <p className="text-[10px] font-medium uppercase tracking-wider text-[#75E063]">
              Preventive Action
            </p>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-300">
            {formatValue(data.recommendation)}
          </p>

          <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4">
            <Activity className="h-3.5 w-3.5 text-[#75E063]" />

            <p className="text-[10px] text-gray-600">
              Prediction refreshes automatically from live infrastructure telemetry.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


/* =========================================================
   PREDICTION VALUE
========================================================= */

function PredictionValue({
  label,
  value,
  icon: Icon,
  highlight = false,
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-3.5 w-3.5 ${
            highlight
              ? "text-[#75E063]"
              : "text-gray-600"
          }`}
        />

        <p className="text-[9px] font-medium uppercase tracking-wider text-gray-600">
          {label}
        </p>
      </div>

      <p
        className={`mt-3 text-sm font-medium ${
          highlight
            ? "text-[#75E063]"
            : "text-gray-300"
        }`}
      >
        {value}
      </p>
    </div>
  )
}


/* =========================================================
   AT-RISK SERVICE
========================================================= */

function getAtRiskService(data, metrics, services) {
  if (metrics?.incident_type === "payment_failure") {
    return "payment-service"
  }

  if (metrics?.incident_type === "order_crash") {
    return "order-service"
  }

  if (metrics?.incident_type === "api_failure") {
    return "product-service"
  }

  if (metrics?.incident_type === "cpu_spike") {
    return "order-service"
  }

  if (metrics?.incident_type === "memory_leak") {
    return "product-service"
  }

  if (metrics?.incident_type === "db_down") {
    return "inventory-service"
  }

  if (data.predicted_incident === "cpu_saturation") {
    return "order-service"
  }

  if (data.predicted_incident === "memory_exhaustion") {
    return "product-service"
  }

  if (data.predicted_incident === "api_degradation") {
    return "product-service"
  }

  const degraded = services.find(
    (service) => service.status !== "healthy"
  )

  return degraded?.name || "Infrastructure"
}


/* =========================================================
   IMPACT PROPAGATION
========================================================= */

function ImpactPropagation({ impact }) {
  const impactedServices = Array.isArray(impact.impacted_services)
    ? [...impact.impacted_services].sort(
        (a, b) => a.distance - b.distance
      )
    : []

  const directImpact = impactedServices.filter(
    (service) => service.distance === 1
  )

  const downstreamRisk = impactedServices.filter(
    (service) => service.distance > 1
  )

  return (
    <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/[0.025] p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
            <Target className="h-5 w-5 text-orange-400" />
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-orange-400">
              Impact Intelligence
            </p>

            <h3 className="mt-1 text-base font-semibold text-white">
              Impact Propagation
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5">
          <GitBranch className="h-3.5 w-3.5 text-orange-400" />

          <span className="text-[10px] font-medium uppercase tracking-wider text-orange-400">
            {impact.blast_radius || 0} Services at Risk
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-5">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />

          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-red-400">
              Root Failure
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {formatValue(impact.root_failure)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.025] p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wider text-orange-400">
              Direct Impact
            </p>

            <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-[9px] text-orange-400">
              Distance 1
            </span>
          </div>

          {directImpact.length > 0 ? (
            <div className="mt-4 space-y-2">
              {directImpact.map((service) => (
                <div
                  key={service.service}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/10 px-3 py-3"
                >
                  <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_7px_#fb923c]" />

                  <span className="text-xs font-medium text-gray-300">
                    {service.service}
                  </span>

                  <span className="ml-auto text-[9px] uppercase tracking-wider text-orange-400">
                    affected
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-gray-600">
              No direct downstream services detected.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.025] p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wider text-yellow-400">
              Downstream Risk
            </p>

            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-1 text-[9px] text-yellow-400">
              Distance 2+
            </span>
          </div>

          {downstreamRisk.length > 0 ? (
            <div className="mt-4 space-y-2">
              {downstreamRisk.map((service) => (
                <div
                  key={service.service}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/10 px-3 py-3"
                >
                  <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_7px_#facc15]" />

                  <span className="text-xs font-medium text-gray-300">
                    {service.service}
                  </span>

                  <span className="ml-auto text-[9px] uppercase tracking-wider text-yellow-400">
                    Risk • D{service.distance}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-gray-600">
              No additional downstream risk detected.
            </p>
          )}
        </div>
      </div>

      {impactedServices.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <FlowNode
              label={formatValue(impact.root_failure)}
              type="root"
            />

            {impactedServices.map((service) => (
              <div
                key={`${service.service}-${service.distance}`}
                className="flex items-center gap-2"
              >
                <span className="text-gray-700">
                  →
                </span>

                <FlowNode
                  label={service.service}
                  type={
                    service.distance === 1
                      ? "direct"
                      : "risk"
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
        <Network className="h-3.5 w-3.5 text-gray-600" />

        <p className="text-[10px] text-gray-600">
          Blast radius calculated from Sentinel's service dependency graph.
        </p>
      </div>
    </div>
  )
}


/* =========================================================
   FLOW NODE
========================================================= */

function FlowNode({ label, type }) {
  const styles = {
    root: {
      border: "border-red-500/30",
      background: "bg-red-500/10",
      text: "text-red-400",
    },

    direct: {
      border: "border-orange-500/20",
      background: "bg-orange-500/10",
      text: "text-orange-400",
    },

    risk: {
      border: "border-yellow-400/20",
      background: "bg-yellow-400/10",
      text: "text-yellow-400",
    },
  }

  const style = styles[type] || styles.risk

  return (
    <span
      className={`rounded-lg border px-3 py-2 text-[10px] font-medium ${style.border} ${style.background} ${style.text}`}
    >
      {label}
    </span>
  )
}


/* =========================================================
   DEPENDENCY GRAPH PANEL
========================================================= */

function DependencyGraphPanel({ graph, services }) {
  if (!graph) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center">
        <Network className="mx-auto h-8 w-8 text-gray-700" />

        <p className="mt-4 text-sm text-gray-500">
          Loading dependency intelligence...
        </p>
      </div>
    )
  }

  const dependencies = graph.dependencies || []

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => {
          const serviceDependencies = dependencies
            .filter((item) => item.service === service.name)
            .map((item) => item.depends_on)

          const isDegraded = service.status !== "healthy"

          return (
            <div
              key={service.id}
              className={`rounded-xl border p-5 transition ${
                isDegraded
                  ? "border-red-500/30 bg-red-500/[0.04]"
                  : "border-white/10 bg-black/10 hover:border-[#75E063]/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      isDegraded
                        ? "bg-red-500 shadow-[0_0_8px_#ef4444]"
                        : "bg-[#75E063] shadow-[0_0_8px_#75E063]"
                    }`}
                  />

                  <span className="truncate text-sm font-medium text-white">
                    {service.name}
                  </span>
                </div>

                <span
                  className={`text-[9px] font-medium uppercase tracking-wider ${
                    isDegraded
                      ? "text-red-400"
                      : "text-[#75E063]"
                  }`}
                >
                  {service.status}
                </span>
              </div>

              {serviceDependencies.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-gray-600">
                    Depends on
                  </p>

                  <div className="space-y-2">
                    {serviceDependencies.map((dependency) => (
                      <div
                        key={dependency}
                        className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2"
                      >
                        <span className="text-[#75E063]">
                          →
                        </span>

                        <span className="text-xs text-gray-400">
                          {dependency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                  <p className="text-xs text-gray-600">
                    Root-level service
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-[10px] text-gray-600">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#75E063]" />
          Healthy dependency
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Degraded service
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#75E063]">→</span>
          Dependency relationship
        </div>
      </div>
    </div>
  )
}


/* =========================================================
   TELEMETRY CARD
========================================================= */

function TelemetryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  state = "normal",
}) {
  const styles = {
    normal: {
      border: "border-white/10",
      icon: "border-[#75E063]/20 bg-[#75E063]/5 text-[#75E063]",
      status: "text-[#75E063]",
      dot: "bg-[#75E063]",
      label: "Normal telemetry",
    },

    elevated: {
      border: "border-yellow-400/20",
      icon: "border-yellow-400/20 bg-yellow-400/5 text-yellow-400",
      status: "text-yellow-400",
      dot: "bg-yellow-400",
      label: "Elevated utilization",
    },

    critical: {
      border: "border-red-500/30",
      icon: "border-red-500/20 bg-red-500/10 text-red-400",
      status: "text-red-400",
      dot: "bg-red-400",
      label: "Critical threshold",
    },
  }

  const style = styles[state] || styles.normal

  return (
    <div
      className={`group rounded-xl border bg-white/[0.03] p-5 transition hover:bg-white/[0.05] ${style.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-600">
            {title}
          </p>

          <h3 className="mt-3 text-2xl font-semibold text-white">
            {value}
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg border ${style.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
        />

        <span className={`text-[11px] ${style.status}`}>
          {style.label}
        </span>
      </div>
    </div>
  )
}


/* =========================================================
   TELEMETRY SEVERITY
========================================================= */

function getMetricSeverity(metric, value) {
  if (value === undefined || value === null) {
    return "normal"
  }

  if (metric === "cpu") {
    if (value >= 85) return "critical"
    if (value >= 70) return "elevated"
  }

  if (metric === "memory") {
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


function getTelemetryState(metrics) {
  if (!metrics) {
    return "normal"
  }

  const states = [
    getMetricSeverity("cpu", metrics.cpu_usage),
    getMetricSeverity("memory", metrics.memory_usage),
    getMetricSeverity("latency", metrics.api_latency),
    getMetricSeverity("error", metrics.error_rate),
  ]

  if (states.includes("critical")) {
    return "critical"
  }

  if (states.includes("elevated")) {
    return "elevated"
  }

  return "normal"
}


/* =========================================================
   INCIDENT BUTTON
========================================================= */

function IncidentButton({
  label,
  type,
  icon: Icon,
  onClick,
  loading,
}) {
  return (
    <button
      onClick={() => onClick(type)}
      disabled={loading}
      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-4 text-left transition hover:border-red-500/20 hover:bg-red-500/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] transition group-hover:border-red-500/20 group-hover:bg-red-500/10">
        <Icon className="h-4 w-4 text-gray-500 group-hover:text-red-400" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-300">
          {label}
        </p>

        <p className="mt-1 text-[10px] text-gray-700">
          Inject failure
        </p>
      </div>
    </button>
  )
}


/* =========================================================
   INCIDENT DETAIL
========================================================= */

function IncidentDetail({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-medium text-gray-300">
        {formatValue(value)}
      </p>
    </div>
  )
}


/* =========================================================
   ROOT CAUSE
========================================================= */

function RootCauseAnalysis({ analysis }) {
  const evidence = Array.isArray(analysis.evidence)
    ? analysis.evidence
    : []

  return (
    <section className="mt-8 rounded-2xl border border-[#75E063]/20 bg-[#75E063]/[0.025] p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#75E063]/20 bg-[#75E063]/10">
          <Shield className="h-5 w-5 text-[#75E063]" />
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#75E063]">
            AI Root Cause Analysis
          </p>

          <h2 className="mt-1 text-lg font-semibold text-white">
            Root Cause Identified
          </h2>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalysisBox
          label="Root Cause"
          value={analysis.root_cause}
        />

        <AnalysisBox
          label="AI Confidence"
          value={
            analysis.confidence !== undefined
              ? `${analysis.confidence}% confidence`
              : "Unknown"
          }
          highlight
        />

        <AnalysisBox
          label="Business Impact"
          value={analysis.impact}
        />

        <AnalysisBox
          label="Recommendation"
          value={analysis.recommendation}
        />
      </div>

      {evidence.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
            Evidence
          </p>

          <div className="mt-3 space-y-2">
            {evidence.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-sm text-gray-400"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#75E063]" />
                <span>{formatValue(item)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}


/* =========================================================
   ANALYSIS BOX
========================================================= */

function AnalysisBox({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p
        className={`mt-3 text-sm leading-6 ${
          highlight
            ? "text-[#75E063]"
            : "text-gray-300"
        }`}
      >
        {formatValue(value)}
      </p>
    </div>
  )
}


/* =========================================================
   SAFE VALUE FORMATTER
========================================================= */

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
    return value
      .map((item) => formatValue(item))
      .join(", ")
  }

  if (typeof value === "object") {
    if (value.message) {
      return String(value.message)
    }

    if (value.type) {
      return String(value.type).replace(/_/g, " ")
    }

    return JSON.stringify(value)
  }

  return String(value)
}


export default App
