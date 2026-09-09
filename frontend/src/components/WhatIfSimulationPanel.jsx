import { useState } from "react"
import {
  BrainCircuit,
  CheckCheck,
  FlaskConical,
  Play,
  RotateCcw,
  Scale,
  ShieldCheck,
  TriangleAlert,
  Zap,
} from "lucide-react"

const API_BASE = "http://127.0.0.1:8000"

const riskClass = (risk) => ({
  Low: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Medium: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  High: "text-red-300 bg-red-400/10 border-red-400/20",
}[risk] || "text-slate-300 bg-slate-400/10 border-slate-400/20")

const formatType = (value) => !value ? "Unknown" : value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
const formatService = (value) => !value ? "Infrastructure" : value.replace(/-service$/i, "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase())

export default function WhatIfSimulationPanel({ simulation, simulationLoading, canSimulate, onSimulate }) {
  const [executingAction, setExecutingAction] = useState(null)
  const [executionResult, setExecutionResult] = useState(null)
  const [executionError, setExecutionError] = useState("")

  const recommended = simulation?.recommended_action
  const scenarios = simulation?.scenarios || []

  const executeRecovery = async (action) => {
    try {
      setExecutingAction(action)
      setExecutionResult(null)
      setExecutionError("")
      const response = await fetch(`${API_BASE}/api/incidents/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!response.ok) throw new Error("Recovery request failed")
      const data = await response.json()
      if (data.status === "error") throw new Error(data.message || "Recovery failed")
      setExecutionResult(data)
    } catch (error) {
      setExecutionError(error.message || "Unable to execute recovery action.")
    } finally {
      setExecutingAction(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-400/10 bg-[#0d1511] shadow-[0_0_40px_rgba(0,0,0,0.18)]">
      <div className="border-b border-white/5 bg-gradient-to-r from-cyan-400/[0.06] to-violet-400/[0.04] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
              <FlaskConical className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Decision Intelligence</h2>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-300">What-If Engine</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">Simulate remediation strategies before touching production.</p>
            </div>
          </div>
          <button onClick={onSimulate} disabled={simulationLoading || !canSimulate} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-200 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50">
            {simulationLoading ? <><FlaskConical className="h-4 w-4 animate-pulse" />Simulating...</> : <><Play className="h-4 w-4" />Run What-If Analysis</>}
          </button>
        </div>
      </div>

      {!simulation && !simulationLoading && (
        <div className="p-6">
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
            <BrainCircuit className="mx-auto h-9 w-9 text-slate-500" />
            <h3 className="mt-3 text-sm font-medium text-slate-200">Production Decision Sandbox</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Sentinel will compare four remediation strategies and recommend the action with the best recovery-to-risk balance.</p>
          </div>
        </div>
      )}

      {simulationLoading && <div className="p-6"><div className="h-32 animate-pulse rounded-xl bg-white/[0.03]" /></div>}

      {simulation?.status === "error" && (
        <div className="p-6"><div className="flex gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4"><TriangleAlert className="h-5 w-5 text-red-300" /><div><p className="text-sm font-medium text-red-200">What-If simulation failed</p><p className="mt-1 text-sm text-red-300/70">{simulation.message || "Unable to run the simulation."}</p></div></div></div>
      )}

      {simulation?.status === "simulation_complete" && (
        <div className="p-5">
          <div className="mb-5 flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-slate-400">Service: <b className="text-slate-200">{formatService(simulation.service)}</b></span>
            <span className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-slate-400">Incident: <b className="text-slate-200">{formatType(simulation.incident_type)}</b></span>
            <span className="rounded-lg border border-emerald-400/10 bg-emerald-400/5 px-3 py-1.5 text-emerald-300">{simulation.scenario_count || scenarios.length} strategies evaluated</span>
          </div>

          {recommended && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2"><CheckCheck className="h-5 w-5 text-emerald-300" /><span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Sentinel Recommendation</span></div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Best Recovery / Risk Balance</span>
              </div>

              <div className="mt-4 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <div>
                  <h3 className="text-2xl font-semibold text-white">{recommended.name || recommended.action_name}</h3>
                  <p className="mt-2 text-sm text-slate-400">Best recovery-to-risk balance for this scenario.</p>
                  <button onClick={() => executeRecovery(recommended.action)} disabled={executingAction !== null} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-emerald-200 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50">
                    {executingAction === recommended.action ? <><RotateCcw className="h-4 w-4 animate-spin" />Executing...</> : <><Zap className="h-4 w-4" />Execute Recommended Action</>}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-black/20 p-3"><p className="text-[10px] uppercase text-slate-500">Recovery</p><p className="mt-1 text-xl font-semibold text-emerald-300">{recommended.recovery_probability}%</p></div>
                  <div className="rounded-xl border border-white/5 bg-black/20 p-3"><p className="text-[10px] uppercase text-slate-500">Risk</p><p className="mt-1 text-xl font-semibold text-slate-100">{recommended.risk}</p></div>
                  <div className="rounded-xl border border-white/5 bg-black/20 p-3"><p className="text-[10px] uppercase text-slate-500">Impact</p><p className="mt-1 text-xl font-semibold text-slate-100">{recommended.impact}</p></div>
                  <div className="rounded-xl border border-white/5 bg-black/20 p-3"><p className="text-[10px] uppercase text-slate-500">Recovery Time</p><p className="mt-1 text-xl font-semibold text-cyan-300">{recommended.estimated_recovery_seconds}s</p></div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">AI Decision</p>
                <p className="mt-1 text-sm text-slate-300">{simulation.decision || "Recommendation combines baseline recovery analysis with incident memory."}</p>
              </div>
            </div>
          )}

          {executionResult && (
            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
              <div className="flex items-start gap-3"><CheckCheck className="mt-1 h-5 w-5 text-emerald-300" /><div className="flex-1"><div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-white">Recovery Completed</h3><span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">VERIFIED</span></div><p className="mt-1 text-sm text-slate-400">Sentinel recovery procedure completed successfully.</p></div></div>
            </div>
          )}

          {executionError && <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">{executionError}</div>}

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2"><Scale className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-200">Scenario Comparison</h3></div>
            <div className="grid gap-3">
              {scenarios.map((scenario, index) => {
                const isRecommended = scenario.action === recommended?.action
                return (
                  <div key={scenario.action} className={`rounded-xl border p-4 ${isRecommended ? "border-emerald-400/20 bg-emerald-400/[0.05]" : "border-white/5 bg-white/[0.015]"}`}>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isRecommended ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.04] text-slate-500"}`}>{isRecommended ? <CheckCheck className="h-4 w-4" /> : <span className="text-xs">#{index + 1}</span>}</div>
                        <div><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-medium text-slate-100">{scenario.action_name}</h4>{isRecommended && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] text-emerald-300">AI PICK</span>}</div><p className="mt-1 text-xs text-slate-500">{scenario.description}</p></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[520px]">
                        <div><p className="text-[9px] uppercase text-slate-600">Recovery</p><p className="text-sm font-semibold text-emerald-300">{scenario.recovery_probability}%</p></div>
                        <div><p className="text-[9px] uppercase text-slate-600">Risk</p><span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] ${riskClass(scenario.risk)}`}>{scenario.risk}</span></div>
                        <div><p className="text-[9px] uppercase text-slate-600">Impact</p><p className="text-sm font-semibold text-slate-200">{scenario.impact}</p></div>
                        <div><p className="text-[9px] uppercase text-slate-600">Decision Score</p><p className="text-sm font-semibold text-cyan-300">{scenario.decision_score}</p></div>
                      </div>
                      <button onClick={() => executeRecovery(scenario.action)} disabled={executingAction !== null} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-cyan-400/15 bg-cyan-400/5 px-3 py-2 text-xs font-medium text-cyan-200 hover:bg-cyan-400/10 disabled:opacity-50">
                        {executingAction === scenario.action ? <><RotateCcw className="h-3.5 w-3.5 animate-spin" />Executing</> : <><Zap className="h-3.5 w-3.5" />Execute</>}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.03] p-3"><ShieldCheck className="h-4 w-4 text-cyan-300" /><p className="text-xs text-slate-500">Recovery actions are controlled through the Sentinel recovery API and successful recovery is recorded in incident memory.</p></div>
        </div>
      )}
    </div>
  )
}