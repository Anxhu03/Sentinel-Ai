import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  FileSearch,
  ShieldAlert,
} from "lucide-react"

function AIInvestigation({ incident }) {
  if (!incident) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#75E063]/20 bg-[#75E063]/10">
            <Brain className="h-5 w-5 text-[#75E063]" />
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#75E063]">
              AI Investigation
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Sentinel AI Analysis
            </h2>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/10 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#75E063]" />

            <div>
              <p className="text-sm font-medium text-gray-300">
                No active investigation
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Sentinel AI is monitoring the production environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const analysis = incident.ai_analysis || incident.result || {}

  const severity =
    analysis.severity ||
    incident.severity ||
    "unknown"

  const detectionStatus =
    analysis.status ||
    incident.detection_status ||
    "issues_detected"

  const issues =
    Array.isArray(analysis.issues)
      ? analysis.issues
      : []

  const summary =
    analysis.summary ||
    incident.summary ||
    "Sentinel AI completed its initial investigation."

  const evidenceLogs =
    incident.evidence_logs ||
    incident.logs ||
    incident.evidence ||
    ""

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#75E063]/20 bg-[#75E063]/10">
            <Brain className="h-5 w-5 text-[#75E063]" />
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#75E063]">
              AI Investigation
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Sentinel Log Agent Analysis
            </h2>

            <p className="mt-2 text-xs text-gray-600">
              Automated analysis of the simulated production incident.
            </p>
          </div>
        </div>

        {/* SEVERITY */}

        <div
          className={`flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider ${
            severity === "critical"
              ? "border-red-500/20 bg-red-500/10 text-red-400"
              : severity === "high"
              ? "border-orange-500/20 bg-orange-500/10 text-orange-400"
              : severity === "medium"
              ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
              : "border-[#75E063]/20 bg-[#75E063]/10 text-[#75E063]"
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />

          Severity: {severity}
        </div>
      </div>

      {/* METRICS */}

      <div className="grid gap-4 sm:grid-cols-3">
        <InvestigationMetric
          label="Severity"
          value={severity}
          icon={AlertTriangle}
        />

        <InvestigationMetric
          label="Detection Status"
          value={formatText(detectionStatus)}
          icon={CheckCircle2}
        />

        <InvestigationMetric
          label="Issues Detected"
          value={issues.length}
          icon={FileSearch}
        />
      </div>

      {/* SUMMARY */}

      <div className="mt-6 rounded-xl border border-white/10 bg-black/10 p-5">
        <div className="flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-[#75E063]" />

          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
            Investigation Summary
          </p>
        </div>

        <p className="mt-3 text-sm leading-6 text-gray-400">
          {summary}
        </p>
      </div>

      {/* ISSUES */}

      {issues.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-gray-600">
            Detected Issues
          </p>

          <div className="space-y-3">
            {issues.map((issue, index) => {
              const issueType =
                typeof issue === "string"
                  ? issue
                  : issue.type || "unknown_issue"

              const issueMessage =
                typeof issue === "string"
                  ? issue
                  : issue.message || "Potential production issue detected."

              return (
                <div
                  key={`${issueType}-${index}`}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/10 p-4"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-300">
                      {formatText(issueType)}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      {issueMessage}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* EVIDENCE */}

      {evidenceLogs && (
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-gray-600">
            Evidence Logs
          </p>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#070B08] p-5">
            <pre className="whitespace-pre-wrap font-mono text-xs leading-6 text-gray-500">
              {typeof evidenceLogs === "string"
                ? evidenceLogs
                : JSON.stringify(evidenceLogs, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function InvestigationMetric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-600">
          {label}
        </p>

        <Icon className="h-4 w-4 text-gray-700" />
      </div>

      <p className="mt-3 text-lg font-semibold capitalize text-gray-300">
        {value}
      </p>
    </div>
  )
}

function formatText(value) {
  if (!value) {
    return "Unknown"
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default AIInvestigation