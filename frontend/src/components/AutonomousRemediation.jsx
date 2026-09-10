import React, { useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

const ACTIONS = [
  {
    value: "restart_service",
    label: "Restart Service",
    description: "Restart the affected Docker service.",
  },
  {
    value: "rollback_deployment",
    label: "Rollback Deployment",
    description: "Recreate the service to recover from a bad deployment.",
  },
  {
    value: "restart_dependency",
    label: "Restart Dependency",
    description: "Restart the dependency linked to the affected service.",
  },
  {
    value: "scale_service",
    label: "Scale Service",
    description: "Scale the affected service to two replicas.",
  },
];

const DEFAULT_ACTIONS = {
  payment_failure: "restart_service",
  order_crash: "restart_service",
  api_failure: "restart_service",
  db_down: "restart_dependency",
  cpu_spike: "scale_service",
  memory_leak: "restart_service",
};

function getRecommendedAction(incidentType) {
  return DEFAULT_ACTIONS[incidentType] || "restart_service";
}

export default function AutonomousRemediation({
  incident,
  service,
  incidentType,
  onComplete,
}) {
  const [selectedAction, setSelectedAction] = useState(
    getRecommendedAction(incidentType)
  );
  const [isRunning, setIsRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const recommendedAction = useMemo(
    () => getRecommendedAction(incidentType),
    [incidentType]
  );

  const selectedActionMeta =
    ACTIONS.find((action) => action.value === selectedAction) || ACTIONS[0];

  async function executeRemediation() {
    setIsRunning(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/incidents/autonomous-remediate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: selectedAction,
            service,
            incident_type: incidentType,
            approved: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Autonomous remediation request failed."
        );
      }

      setResult(data);
      setShowConfirm(false);

      if (onComplete) {
        onComplete(data);
      }
    } catch (err) {
      setError(err.message || "Unable to execute remediation.");
    } finally {
      setIsRunning(false);
    }
  }

  const verificationSuccess =
    result?.verification?.success === true ||
    result?.status === "remediation_completed";

  return (
    <section className="rounded-xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(129,140,248,0.6)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
              Autonomous Remediation
            </span>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Fix this incident automatically
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Sentinel can execute a controlled recovery action, verify the
            result, and update incident memory.
          </p>
        </div>

        <div className="rounded-xl border border-accent/25 bg-accent/5 px-4 py-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Recommended
          </div>
          <div className="mt-1 text-sm font-semibold text-accent">
            {ACTIONS.find((action) => action.value === recommendedAction)
              ?.label || "Restart Service"}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        {ACTIONS.map((action) => {
          const active = selectedAction === action.value;
          const recommended = recommendedAction === action.value;

          return (
            <button
              key={action.value}
              type="button"
              onClick={() => setSelectedAction(action.value)}
              disabled={isRunning}
              className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                active
                  ? "border-accent/50 bg-accent/10 shadow-sm"
                  : "border-border/70 bg-secondary/30 hover:border-border hover:bg-secondary/60"
              } ${isRunning ? "cursor-not-allowed opacity-60" : "active:scale-[0.99]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                        active ? "bg-accent shadow-[0_0_8px_rgba(129,140,248,0.8)]" : "bg-muted-foreground/40"
                      }`}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {action.label}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {action.description}
                  </p>
                </div>

                {recommended && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
                    AI Pick
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-5 rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">
              Incident
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              {incidentType || incident?.type || "Unknown"}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">
              Service
            </div>
            <div className="mt-1 text-sm font-medium text-white">
              {service || "Unknown"}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">
              Selected Action
            </div>
            <div className="mt-1 text-sm font-medium text-violet-300">
              {selectedActionMeta.label}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
          <div className="text-sm font-medium text-red-300">
            Remediation Failed
          </div>
          <div className="mt-1 text-xs leading-5 text-red-200/70">
            {error}
          </div>
        </div>
      )}

      {result && (
        <div
          className={`mb-4 rounded-xl border p-4 ${
            verificationSuccess
              ? "border-emerald-400/20 bg-emerald-400/5"
              : "border-amber-400/20 bg-amber-400/5"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div
                className={`text-sm font-semibold ${
                  verificationSuccess
                    ? "text-emerald-300"
                    : "text-amber-300"
                }`}
              >
                {verificationSuccess
                  ? "Incident Recovered"
                  : "Remediation Completed With Warning"}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {result.recovery_time_seconds != null
                  ? `Recovery time: ${Number(
                      result.recovery_time_seconds
                    ).toFixed(2)}s`
                  : "Recovery completed."}
              </div>
            </div>

            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
                result.incident_memory?.updated
                  ? "border-violet-400/20 bg-violet-400/5 text-violet-300"
                  : "border-white/10 bg-white/[0.02] text-slate-400"
              }`}
            >
              {result.incident_memory?.updated
                ? "Memory Updated"
                : "Memory Unchanged"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Verification
              </div>
              <div className="mt-1 text-sm text-white">
                {result.verification?.service_status || "Unknown"}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Target
              </div>
              <div className="mt-1 text-sm text-white">
                {result.remediation_target || service || "Unknown"}
              </div>
            </div>
          </div>
        </div>
      )}

      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={isRunning}
          className="w-full rounded-xl border border-accent/40 bg-accent/10 px-5 py-3 text-sm font-semibold text-accent transition-all duration-200 hover:border-accent/60 hover:bg-accent/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Fix Incident
        </button>
      ) : (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 animate-in fade-in duration-200">
          <div className="text-sm font-semibold text-foreground">
            Confirm autonomous action
          </div>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Sentinel will execute{" "}
            <span className="font-semibold text-accent">
              {selectedActionMeta.label}
            </span>{" "}
            on{" "}
            <span className="font-semibold text-foreground">
              {service || "the affected service"}
            </span>{" "}
            and then verify the recovery.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={executeRemediation}
              disabled={isRunning}
              className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-accent/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRunning ? "Executing..." : "Approve & Execute"}
            </button>

            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={isRunning}
              className="flex-1 rounded-xl border border-border/80 bg-secondary/40 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:bg-secondary hover:text-foreground active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
