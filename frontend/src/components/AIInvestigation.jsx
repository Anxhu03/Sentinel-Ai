import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock3,
  Database,
  GitBranch,
  History,
  Loader2,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  TriangleAlert,
  Wrench,
  Zap,
} from "lucide-react"
import { getApiBaseUrl, safeParseResponse } from "../utils/api"

const API_BASE = getApiBaseUrl()
const MEMORY_API_BASE = API_BASE

function formatValue(value) {
  if (value === null || value === undefined) {
    return "Unknown"
  }

  if (typeof value === "string") {
    return value.replace(/_/g, " ")
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item)).join(", ")
  }

  if (typeof value === "object") {
    if (value.message) return String(value.message)
    if (value.type) return String(value.type).replace(/_/g, " ")

    return JSON.stringify(value)
  }

  return String(value)
}

function formatIncidentType(type) {
  if (!type) return "Production Incident"

  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatServiceName(service) {
  if (!service) return "Unknown Service"

  return service
    .replace(/-service$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getRiskLevel(incident) {
  const risk =
    incident?.risk_score ??
    incident?.prediction?.risk_score ??
    incident?.impact_analysis?.risk_score ??
    0

  if (risk >= 70) {
    return {
      label: "Critical",
      color: "text-rose-400",
      border: "border-rose-500/30",
      bg: "bg-rose-500/10",
      bar: "bg-rose-500",
    }
  }

  if (risk >= 40) {
    return {
      label: "Elevated",
      color: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      bar: "bg-amber-500",
    }
  }

  return {
    label: "Normal",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-500",
  }
}

function getConfidence(incident) {
  return (
    incident?.root_cause_analysis?.confidence ??
    incident?.confidence ??
    incident?.prediction?.confidence ??
    0
  )
}

function getRootCause(incident) {
  return (
    incident?.root_cause_analysis?.root_cause ||
    incident?.root_cause ||
    "Sentinel is correlating telemetry and incident evidence."
  )
}

function getRecommendation(incident) {
  return (
    incident?.root_cause_analysis?.recommendation ||
    incident?.recommendation ||
    "Review the incident and apply the safest available recovery action."
  )
}

function getEvidence(incident) {
  const evidence =
    incident?.root_cause_analysis?.evidence ||
    incident?.evidence ||
    []

  if (!Array.isArray(evidence)) {
    return []
  }

  return evidence
}

function Metric({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 p-4 transition-all duration-200 hover:border-border">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />

        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>

      <p
        className={`mt-2.5 text-lg font-semibold tracking-tight ${
          accent ? "text-emerald-400" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function InvestigationStep({
  number,
  label,
  description,
  status = "complete",
  active = false,
}) {
  const isComplete = status === "complete"

  return (
    <div className="relative flex gap-3">
      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background transition-colors duration-200">
        {isComplete ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : active ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
        ) : (
          <span className="text-[10px] font-medium text-muted-foreground">{number}</span>
        )}
      </div>

      <div className="pb-5">
        <p
          className={`text-xs font-medium transition-colors duration-200 ${
            isComplete
              ? "text-foreground/90"
              : active
                ? "text-accent"
                : "text-muted-foreground"
          }`}
        >
          {label}
        </p>

        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function HistoricalIntelligence({ memory, loading }) {
  if (loading) {
    return (
      <div className="border-t border-white/[0.07] p-6">
        <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.025] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-400/15 bg-violet-400/[0.06]">
              <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-300">
                Historical Intelligence
              </p>

              <p className="mt-1 text-[10px] text-gray-600">
                Searching Sentinel incident memory...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const insight = memory?.memory_insight

  if (!insight?.available) {
    return (
      <div className="border-t border-white/[0.07] p-6">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025]">
              <History className="h-4 w-4 text-gray-500" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-300">
                Historical Intelligence
              </p>

              <p className="mt-1 text-[10px] leading-4 text-gray-600">
                No matching historical incidents were found in Sentinel
                Memory.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const successfulRecoveries = insight.successful_recoveries ?? 0
  const totalMatches = insight.total_matches ?? 0
  const historicalConfidence = insight.historical_confidence ?? 0
  const recommendedAction = insight.recommended_action

  const previousCauses = Array.isArray(insight.previous_root_causes)
    ? insight.previous_root_causes
    : []

  const previousLessons = Array.isArray(insight.previous_lessons)
    ? insight.previous_lessons
    : []

  return (
    <div className="border-t border-white/[0.07] p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-violet-300" />

          <div>
            <p className="text-xs font-medium text-gray-300">
              Historical Intelligence
            </p>

            <p className="mt-1 text-[10px] text-gray-600">
              Sentinel Memory · Previous production incidents
            </p>
          </div>
        </div>

        <span className="rounded-full border border-violet-400/15 bg-violet-400/[0.05] px-2.5 py-1 text-[8px] font-medium uppercase tracking-wider text-violet-300">
          Memory active
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <p className="text-[9px] uppercase tracking-[0.14em] text-gray-600">
            Similar incidents
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {totalMatches}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-all duration-200">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Successful recoveries
          </p>

          <p className="mt-2 text-lg font-semibold text-emerald-400">
            {successfulRecoveries}
          </p>
        </div>

        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 transition-all duration-200">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Historical confidence
          </p>

          <p className="mt-2 text-lg font-semibold text-accent">
            {historicalConfidence}%
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
          Historical insight
        </p>

        <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">
          {insight.insight}
        </p>

        {recommendedAction && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Previously successful action
              </p>

              <p className="mt-1 text-sm font-medium text-foreground">
                {formatValue(recommendedAction)}
              </p>
            </div>
          </div>
        )}
      </div>

      {(previousCauses.length > 0 || previousLessons.length > 0) && (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {previousCauses.length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
              <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-gray-600">
                Previous root cause
              </p>

              <p className="mt-2 text-xs leading-5 text-gray-400">
                {formatValue(previousCauses[0])}
              </p>
            </div>
          )}

          {previousLessons.length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
              <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-gray-600">
                Operational lesson
              </p>

              <p className="mt-2 text-xs leading-5 text-gray-400">
                {formatValue(previousLessons[0])}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AIInvestigation({ incident }) {
  const [expanded, setExpanded] = useState(false)
  const [remediating, setRemediating] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState("")
  const [recoveryError, setRecoveryError] = useState("")

  const [memory, setMemory] = useState(null)
  const [memoryLoading, setMemoryLoading] = useState(false)

  const riskLevel = useMemo(
    () => getRiskLevel(incident),
    [incident]
  )

  const confidence = getConfidence(incident)
  const rootCause = getRootCause(incident)
  const recommendation = getRecommendation(incident)
  const evidence = getEvidence(incident)

  const riskScore =
    incident?.risk_score ??
    incident?.prediction?.risk_score ??
    incident?.impact_analysis?.risk_score ??
    0

  const affectedService = formatServiceName(
    incident?.affected_service
  )

  const incidentType = formatIncidentType(
    incident?.incident_type
  )

  useEffect(() => {
    let cancelled = false

    async function loadHistoricalMemory() {
      if (!incident?.incident_type) {
        setMemory(null)
        return
      }

      try {
        setMemoryLoading(true)

        const params = new URLSearchParams()

        params.set(
          "incident_type",
          incident.incident_type
        )

        if (incident.affected_service) {
          params.set(
            "affected_service",
            incident.affected_service
          )
        }

        params.set("limit", "5")

        const response = await fetch(
          `${MEMORY_API_BASE}/api/memory/similar?${params.toString()}`,
          { headers: { Accept: "application/json" } }
        )

        const parsed = await safeParseResponse(response)
        if (!parsed.ok) {
          throw new Error(parsed.errorMessage || "Historical memory request failed")
        }

        const data = parsed.data

        if (cancelled) return

        const memories = Array.isArray(data.memories)
          ? data.memories
          : []

        const successful = memories.filter(
          (item) => item.recovery_success === true
        )

        const actions = successful
          .map((item) => item.recovery_action)
          .filter(Boolean)

        const causes = successful
          .map((item) => item.root_cause)
          .filter(Boolean)

        const lessons = successful
          .map((item) => item.lesson)
          .filter(Boolean)

        const confidenceValues = successful
          .map((item) => item.confidence)
          .filter(
            (value) =>
              typeof value === "number"
          )

        const historicalConfidence =
          confidenceValues.length > 0
            ? Math.round(
                (confidenceValues.reduce(
                  (sum, value) => sum + value,
                  0
                ) /
                  confidenceValues.length) *
                  100
              ) / 100
            : 0

        const memoryInsight = memories.length
          ? {
              available: true,
              total_matches: memories.length,
              successful_recoveries: successful.length,
              previous_root_causes: causes,
              previous_recovery_actions: actions,
              previous_lessons: lessons,
              historical_confidence:
                historicalConfidence,
              insight: `Sentinel found ${memories.length} similar historical incident(s), including ${successful.length} successful recovery case(s).`,
              recommended_action:
                actions[0] || null,
            }
          : {
              available: false,
              insight:
                "No matching historical incidents were found.",
              recommended_action: null,
              historical_confidence: 0,
            }

        setMemory({
          historical_memory: data,
          memory_insight: memoryInsight,
        })
      } catch (error) {
        console.error(
          "Historical memory error:",
          error
        )

        if (!cancelled) {
          setMemory({
            historical_memory: {
              status: "memory_unavailable",
              memories: [],
            },
            memory_insight: {
              available: false,
              insight:
                "Incident Memory is currently unavailable.",
              recommended_action: null,
              historical_confidence: 0,
            },
          })
        }
      } finally {
        if (!cancelled) {
          setMemoryLoading(false)
        }
      }
    }

    loadHistoricalMemory()

    return () => {
      cancelled = true
    }
  }, [
    incident?.incident_type,
    incident?.affected_service,
  ])

  const handleRemediate = async () => {
    try {
      setRemediating(true)
      setRecoveryMessage("")
      setRecoveryError("")

      const response = await fetch(
        `${API_BASE}/api/incidents/recover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )

      const parsed = await safeParseResponse(response)
      if (!parsed.ok) {
        throw new Error(parsed.errorMessage || "Recovery request failed")
      }

      const data = parsed.data

      setRecoveryMessage(
        data.message ||
          "Affected services have been successfully restored."
      )

      setTimeout(() => {
        window.location.reload()
      }, 1800)
    } catch (error) {
      console.error("Remediation error:", error)

      setRecoveryError(
        "Recovery failed. Make sure the Sentinel backend is running."
      )
    } finally {
      setRemediating(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-all duration-300">
      {/* HEADER */}
      <div className="relative overflow-hidden border-b border-border/70 p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 shadow-sm">
              <BrainCircuit className="h-5 w-5 text-accent" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-violet-300">
                  Sentinel Intelligence
                </p>

                <span className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.06] px-2 py-1 text-[8px] font-medium uppercase tracking-wider text-red-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                  Incident active
                </span>
              </div>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                AI Investigation
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {incidentType} · {affectedService}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border ${riskLevel.border} ${riskLevel.bg} px-3 py-1.5 text-[9px] font-medium uppercase tracking-wider ${riskLevel.color}`}
            >
              {riskLevel.label} risk
            </span>
          </div>
        </div>
      </div>

      {/* RISK + METRICS */}
      <div className="border-b border-white/[0.07] p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            icon={TriangleAlert}
            label="Risk score"
            value={`${riskScore}%`}
            accent
          />

          <Metric
            icon={Target}
            label="AI confidence"
            value={`${confidence}%`}
            accent
          />

          <Metric
            icon={Network}
            label="Affected service"
            value={affectedService}
          />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.14em] text-gray-600">
              Incident severity
            </span>

            <span className={`text-[10px] font-medium ${riskLevel.color}`}>
              {riskLevel.label}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${riskLevel.bar}`}
              style={{
                width: `${Math.min(100, Math.max(0, riskScore))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* INVESTIGATION FLOW */}
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1.35fr]">
        <div>
          <div className="mb-5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-violet-300" />

            <p className="text-xs font-medium text-gray-300">
              Investigation pipeline
            </p>
          </div>

          <div className="relative pl-1">
            <div className="absolute left-[14px] top-7 h-[calc(100%-40px)] w-px bg-white/[0.07]" />

            <InvestigationStep
              number="1"
              label="Telemetry collected"
              description="CPU, memory, latency and error signals correlated."
            />

            <InvestigationStep
              number="2"
              label="Logs analyzed"
              description="Sentinel Log Agent identified incident signals."
            />

            <InvestigationStep
              number="3"
              label="Dependencies checked"
              description="Service relationships and potential blast radius evaluated."
            />

            <InvestigationStep
              number="4"
              label="Root cause identified"
              description="Evidence correlated into a probable failure explanation."
            />
          </div>
        </div>

        {/* ROOT CAUSE */}
        <div>
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Root cause assessment
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 transition-all duration-200">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              Probable root cause
            </p>

            <p className="mt-2.5 text-sm font-medium leading-relaxed text-foreground">
              {formatValue(rootCause)}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-secondary/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Confidence
                </p>

                <p className="mt-1 text-sm font-semibold text-emerald-400">
                  {confidence}%
                </p>
              </div>

              <div className="rounded-lg border border-border/70 bg-secondary/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Detection
                </p>

                <p className="mt-1 text-sm font-semibold text-foreground">
                  Sentinel AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORICAL INTELLIGENCE */}
      <HistoricalIntelligence
        memory={memory}
        loading={memoryLoading}
      />

      {/* EVIDENCE */}
      <div className="border-t border-white/[0.07] p-6">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-left transition hover:border-white/[0.12] hover:bg-white/[0.035]"
        >
          <div className="flex items-center gap-3">
            <Terminal className="h-4 w-4 text-gray-500" />

            <div>
              <p className="text-xs font-medium text-gray-300">
                Evidence collected
              </p>

              <p className="mt-1 text-[10px] text-gray-600">
                {evidence.length > 0
                  ? `${evidence.length} evidence signals`
                  : "Telemetry and incident context available"}
              </p>
            </div>
          </div>

          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {expanded && (
          <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/10 p-4">
            {evidence.length > 0 ? (
              <div className="space-y-3">
                {evidence.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />

                    <p className="text-xs leading-5 text-gray-400">
                      {formatValue(item)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs leading-5 text-gray-600">
                Sentinel did not return structured evidence for this
                incident. The incident telemetry and RCA context remain
                available.
              </p>
            )}
          </div>
        )}
      </div>

      {/* DECISION */}
      <div className="border-t border-white/[0.07] bg-white/[0.012] p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/15 bg-cyan-400/[0.05]">
              <Wrench className="h-4 w-4 text-cyan-300" />
            </div>

            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-cyan-300">
                Recommended action
              </p>

              <p className="mt-2 text-sm font-medium text-gray-200">
                {formatValue(recommendation)}
              </p>

              <p className="mt-1 text-[10px] leading-4 text-gray-600">
                Sentinel recommends reviewing the action before applying
                recovery to production.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:bg-secondary hover:text-foreground active:scale-[0.98]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Review
            </button>

            <button
              type="button"
              onClick={handleRemediate}
              disabled={remediating}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-400 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {remediating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Remediating
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  Remediate
                </>
              )}
            </button>
          </div>
        </div>

        {recoveryMessage && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 animate-in fade-in duration-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

            <div>
              <p className="text-xs font-medium text-emerald-400">
                Recovery initiated
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {recoveryMessage}
              </p>
            </div>
          </div>
        )}

        {recoveryError && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

            <p className="text-[10px] leading-4 text-red-300">
              {recoveryError}
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex items-center gap-2 border-t border-white/[0.06] px-6 py-3">
        <Clock3 className="h-3 w-3 text-gray-700" />

        <span className="text-[9px] text-gray-700">
          Investigation generated from live Sentinel incident context
        </span>

        <span className="ml-auto flex items-center gap-1.5 text-[9px] text-gray-700">
          <Database className="h-3 w-3" />
          Incident memory
        </span>

        <span className="flex items-center gap-1.5 text-[9px] text-gray-700">
          <GitBranch className="h-3 w-3" />
          Dependency graph
        </span>
      </div>
    </section>
  )
}