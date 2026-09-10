import { useState, useEffect } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  Flame,
  Gauge,
  GitBranch,
  KeyRound,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  Zap,
} from "lucide-react"

export default function LandingPage({ onNavigate, backendOnline, currentUser }) {
  const [activeIncidentPreset, setActiveIncidentPreset] = useState("payment")
  const [simState, setSimState] = useState("idle") // "idle" | "analyzing" | "degraded" | "remediating" | "resolved"
  const [terminalLogs, setTerminalLogs] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleGoToConsole = () => {
    if (currentUser) {
      onNavigate("Overview")
    } else {
      onNavigate("Login")
    }
  }

  const PRESETS = {
    payment: {
      name: "Payment Gateway 504 Timeout",
      service: "payment-service",
      type: "payment_failure",
      latency: "1,640 ms",
      cpu: "88%",
      errorRate: "14.2%",
      blastRadius: 3,
      rootCause: "Downstream payment provider circuit breaker trip & worker thread pool exhaustion",
      recommendedAction: "Restart Service & Drain Queue",
    },
    cpu: {
      name: "CPU Saturation Spike",
      service: "order-service",
      type: "cpu_spike",
      latency: "920 ms",
      cpu: "98%",
      errorRate: "6.8%",
      blastRadius: 4,
      rootCause: "Spike in unindexed SQL query executions causing database lock contention",
      recommendedAction: "Scale Replicas & Restart Dependency",
    },
    database: {
      name: "PostgreSQL Connection Drop",
      service: "inventory-service",
      type: "db_down",
      latency: "2,400 ms",
      cpu: "72%",
      errorRate: "28.5%",
      blastRadius: 5,
      rootCause: "Max client connections exceeded in primary PostgreSQL pool",
      recommendedAction: "Restart Dependency (Database Pool)",
    },
  }

  const currentPreset = PRESETS[activeIncidentPreset]

  const runPresetSimulation = (presetKey) => {
    setActiveIncidentPreset(presetKey)
    setSimState("analyzing")
    setTerminalLogs([
      `[TELEMETRY] Anomalous latency spike detected on ${PRESETS[presetKey].service}`,
      `[LOG_AGENT] Ingesting container log stream (14,200 events/sec)...`,
    ])

    setTimeout(() => {
      setTerminalLogs((prev) => [
        ...prev,
        `[RCA_AGENT] Root cause identified: ${PRESETS[presetKey].rootCause}`,
        `[BLAST_RADIUS] Cascading impact computed: ${PRESETS[presetKey].blastRadius} downstream services degraded`,
        `[POLICY_GUARD] Evaluated safety rules: ALLOWED (Risk score: 74/100)`,
      ])
      setSimState("degraded")
    }, 1200)
  }

  const handleSimulatedRemediation = () => {
    setSimState("remediating")
    setTerminalLogs((prev) => [
      ...prev,
      `[ORCHESTRATOR] Dispatching autonomous remediation: ${currentPreset.recommendedAction}`,
      `[DOCKER] Signal sent to container engine: rolling replacement initiated...`,
    ])

    setTimeout(() => {
      setTerminalLogs((prev) => [
        ...prev,
        `[HEALTH_VERIFY] Container ping returned HTTP 200 (Latency: 42ms)`,
        `[INCIDENT_MEMORY] Vector embedding saved to memory database (Success confidence: 99.4%)`,
        `[STATUS] All microservices restored to HEALTHY. Zero manual intervention.`,
      ])
      setSimState("resolved")
    }, 1800)
  }

  useEffect(() => {
    runPresetSimulation("payment")
  }, [])

  return (
    <div className="min-h-screen bg-[#090a0f] text-foreground selection:bg-indigo-500/30 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* =========================================================
          AMBIENT GLOWS & BACKGROUND GRID
          ========================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="absolute top-[20%] right-[-10%] w-[650px] h-[650px] rounded-full bg-purple-600/15 blur-[160px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
      </div>

      {/* =========================================================
          STICKY GLASS NAVBAR
          ========================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#090a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* LOGO */}
          <div
            onClick={() => onNavigate("Landing")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
              <div className="w-full h-full bg-[#0c0d14] rounded-[11px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                Sentinel <span className="text-indigo-400 font-medium">AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                v2.4
              </span>
            </div>
          </div>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/65">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#interactive-demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          {/* RIGHT ACTION BUTTONS */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <button
                onClick={() => onNavigate("Overview")}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Console ({currentUser.username})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate("Login")}
                  className="px-4 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  Sign In
                </button>

                <button
                  onClick={() => onNavigate("Login")}
                  className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all cursor-pointer flex items-center gap-2"
                >
                  Sign In to Console
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white/70 hover:text-white p-2"
          >
            <Layers className="w-6 h-6" />
          </button>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/[0.08] bg-[#0c0d14] px-6 py-4 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-white/70 hover:text-white"
            >
              Features
            </a>
            <a
              href="#interactive-demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-white/70 hover:text-white"
            >
              Interactive Demo
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-white/70 hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-white/70 hover:text-white"
            >
              Pricing
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onNavigate("Login")
                }}
                className="w-full py-2 text-xs font-semibold text-white/80 bg-white/[0.05] rounded-lg text-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onNavigate("Overview")
                }}
                className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg text-center"
              >
                Launch Console
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================
          HERO SECTION
          ========================================================= */}
      <section className="relative z-10 pt-36 pb-20 md:pt-44 md:pb-32 max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* ENGINE STATUS PILL BADGE */}
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Sentinel AI Operations Engine v2.4 Live</span>
            <span className="text-indigo-400/40">•</span>
            <span className="text-white/60">
              {backendOnline ? "Control Plane Connected" : "Local Cluster Ready"}
            </span>
          </div>

          {/* MAIN HEADLINE */}
          <h1 className="text-balance text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
            Autonomous SRE Operations in{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              seconds
            </span>
            , not days
          </h1>

          {/* SUBTITLE */}
          <p className="mt-6 text-lg sm:text-xl text-white/55 max-w-2xl leading-relaxed">
            Eliminate 3 AM incident fatigue. Sentinel monitors microservices telemetry, pinpoints root causes with agentic reasoning, simulates What-If scenarios, and executes policy-governed self-healing.
          </p>

          {/* ACTION BUTTONS */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleGoToConsole}
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-indigo-200" />
              {currentUser ? "Launch Operations Console" : "Sign In to Operations Console"}
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#interactive-demo"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/90 font-medium text-sm transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 text-indigo-400 fill-indigo-400" />
              Try Live Interactive Demo
            </a>

            <button
              onClick={() => onNavigate("Login")}
              className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              Sign In
            </button>
          </div>

          {/* SOCIAL PROOF & METRICS RIBBON */}
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-6 pt-8 border-t border-white/[0.06] w-full justify-center">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=64&h=64&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&fit=crop&crop=faces",
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Engineer"
                    className="w-8 h-8 rounded-full border-2 border-[#090a0f] object-cover ring-1 ring-white/20"
                  />
                ))}
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold text-white">500+ Microservice Clusters</p>
                <p className="text-white/45">Guarded 24/7 with zero downtime</p>
              </div>
            </div>

            <div className="hidden sm:block h-8 w-[1px] bg-white/[0.08]" />

            <div className="flex items-center gap-6 text-xs text-white/60">
              <div>
                <span className="font-bold text-white text-sm">99.99%</span> Uptime SLA
              </div>
              <div>
                <span className="font-bold text-emerald-400 text-sm">&lt; 25s</span> MTTR Recovery
              </div>
              <div>
                <span className="font-bold text-indigo-400 text-sm">100%</span> Policy Governed
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            INTERACTIVE LIVE INCIDENT PLAYGROUND / TERMINAL
            ========================================================= */}
        <div id="interactive-demo" className="mt-16 md:mt-24 max-w-5xl mx-auto scroll-mt-24">
          <div className="relative rounded-2xl border border-white/[0.12] bg-[#0c0e17] p-2 md:p-3 shadow-2xl shadow-indigo-950/40">
            {/* AMBIENT CORNER GLOW */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/20 blur-3xl pointer-events-none" />

            {/* TERMINAL WINDOW HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.08] bg-[#0f111e] rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-white/40">
                  sentinel-ai-engine :: interactive sandbox
                </span>
              </div>

              {/* INCIDENT PRESET SELECTOR TABS */}
              <div className="flex items-center gap-1 bg-[#161826] p-1 rounded-lg border border-white/[0.06]">
                <span className="text-[10px] uppercase font-bold text-white/40 px-2">Trigger Failure:</span>
                {Object.keys(PRESETS).map((key) => (
                  <button
                    key={key}
                    onClick={() => runPresetSimulation(key)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize ${
                      activeIncidentPreset === key
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* TERMINAL CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] bg-[#0a0b12] rounded-b-xl overflow-hidden">
              {/* LEFT: LIVE LOGS STREAM */}
              <div className="lg:col-span-7 p-5 font-mono text-xs space-y-2.5 min-h-[300px] flex flex-col justify-between">
                <div className="space-y-2 overflow-y-auto max-h-[260px]">
                  <div className="flex items-center gap-2 text-white/40 pb-1 border-b border-white/[0.05]">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Real-time Sentinel AI Analysis Stream</span>
                  </div>

                  {terminalLogs.map((log, index) => {
                    const isAlert = log.includes("[RCA_AGENT]") || log.includes("[BLAST_RADIUS]")
                    const isSuccess = log.includes("[HEALTH_VERIFY]") || log.includes("[STATUS]")
                    const isOrchestrator = log.includes("[ORCHESTRATOR]") || log.includes("[POLICY_GUARD]")

                    let colorClass = "text-white/70"
                    if (isAlert) colorClass = "text-amber-300"
                    if (isSuccess) colorClass = "text-emerald-400 font-semibold"
                    if (isOrchestrator) colorClass = "text-indigo-300"

                    return (
                      <div key={index} className={`leading-relaxed ${colorClass} animate-in fade-in duration-300`}>
                        <span className="text-white/20 select-none mr-2">{String(index + 1).padStart(2, "0")}</span>
                        {log}
                      </div>
                    )
                  })}

                  {simState === "remediating" && (
                    <div className="flex items-center gap-2 text-indigo-400 animate-pulse pt-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing autonomous remediation container restart...</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-white/40">
                  <span>Target: {currentPreset.service}</span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Agents Listening
                  </span>
                </div>
              </div>

              {/* RIGHT: INTELLIGENCE PANEL & ACTION TRIGGER */}
              <div className="lg:col-span-5 p-5 bg-[#0e101a] flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      Target Condition
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      {currentPreset.name}
                    </h4>
                    <p className="text-xs text-white/50 mt-1 leading-normal">
                      Service: <span className="font-mono text-white/80">{currentPreset.service}</span>
                    </p>
                  </div>

                  {/* TELEMETRY GAUGES */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-[#141624] border border-white/[0.06] text-center">
                      <p className="text-[10px] text-white/40 uppercase">Latency</p>
                      <p className={`text-xs font-bold font-mono mt-0.5 ${simState === "resolved" ? "text-emerald-400" : "text-amber-400"}`}>
                        {simState === "resolved" ? "42 ms" : currentPreset.latency}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#141624] border border-white/[0.06] text-center">
                      <p className="text-[10px] text-white/40 uppercase">CPU Usage</p>
                      <p className={`text-xs font-bold font-mono mt-0.5 ${simState === "resolved" ? "24%" : currentPreset.cpu}`}>
                        {simState === "resolved" ? "24%" : currentPreset.cpu}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#141624] border border-white/[0.06] text-center">
                      <p className="text-[10px] text-white/40 uppercase">Blast Radius</p>
                      <p className={`text-xs font-bold font-mono mt-0.5 ${simState === "resolved" ? "0 svc" : `${currentPreset.blastRadius} svcs`}`}>
                        {simState === "resolved" ? "0 svc" : `${currentPreset.blastRadius} svcs`}
                      </p>
                    </div>
                  </div>

                  {/* AI RECOMMENDATION BOX */}
                  <div className="p-3 rounded-xl border border-indigo-500/25 bg-indigo-500/10">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mb-1">
                      <Brain className="w-3.5 h-3.5" />
                      Recommended AI Action
                    </div>
                    <p className="text-xs font-medium text-white/90">
                      {currentPreset.recommendedAction}
                    </p>
                    <p className="text-[11px] text-white/50 mt-1">
                      Risk Score: 20/100 (Low) • Expected Recovery: ~25 seconds
                    </p>
                  </div>
                </div>

                {/* ACTION TRIGGER BUTTON */}
                <div className="space-y-2">
                  {simState === "resolved" ? (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Autonomous Recovery Successful
                      </div>
                      <p className="text-[11px] text-emerald-300/70 mt-0.5">
                        Post-action verification verified 100% container availability.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleSimulatedRemediation}
                      disabled={simState === "remediating"}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {simState === "remediating" ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Executing Self-Healing...
                        </>
                      ) : (
                        <>
                          <Wrench className="w-3.5 h-3.5" />
                          Trigger Autonomous Self-Healing
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => onNavigate("Overview")}
                    className="w-full py-2 text-center text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Open in Full SRE Console
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURES BENTO GRID
          ========================================================= */}
      <section id="features" className="relative z-10 py-24 border-t border-white/[0.08] bg-[#0a0a10]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1 text-xs font-semibold text-indigo-300 mb-3">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Engineered for Enterprise{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Microservices Resilience
              </span>
            </h2>
            <p className="mt-4 text-base text-white/55">
              Comprehensive telemetry, automated reasoning, and closed-loop self-healing to protect mission-critical operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* FEATURE 1 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Autonomous Self-Healing</h3>
              <p className="text-sm text-white/55 leading-relaxed">
                Automatically restart failed containers, rollback broken releases, or scale replicas according to SRE safety policies with zero human intervention required.
              </p>
            </div>

            {/* FEATURE 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Agentic Root Cause Analysis</h3>
              <p className="text-sm text-white/55 leading-relaxed">
                Dedicated LLM reasoning agents parse thousands of raw log lines and error traces, pinpointing exact code and database failure vectors in milliseconds.
              </p>
            </div>

            {/* FEATURE 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <GitBranch className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-Hop Blast Radius</h3>
              <p className="text-sm text-white/55 leading-relaxed">
                Map directional dependency graphs across upstream clients and downstream providers. Calculate recursive blast radius before cascading outages propagate.
              </p>
            </div>

            {/* FEATURE 4 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">What-If Decision Simulation</h3>
              <p className="text-sm text-white/55 leading-relaxed">
                Simulate candidate remediation scenarios in a sandbox model. Compare recovery probabilities and risk scores to pick the optimal action deterministically.
              </p>
            </div>

            {/* FEATURE 5 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Vector Incident Memory</h3>
              <p className="text-sm text-white/55 leading-relaxed">
                Every incident, resolution duration, and recovery outcome is stored into persistent memory. Sentinel gets smarter with every production event.
              </p>
            </div>

            {/* FEATURE 6 */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">SRE Safety Policy Guardrails</h3>
              <p className="text-sm text-white/55 leading-relaxed">
                Immutable audit logging, rate-limit cooldown windows, and maximum blast-radius gates ensure automated actions never perform destructive operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS (4-STEP PROGRESSION)
          ========================================================= */}
      <section id="how-it-works" className="relative z-10 py-24 border-t border-white/[0.08] bg-[#090a0f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="inline-block rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1 text-xs font-semibold text-indigo-300 mb-3">
              Workflow Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              From Telemetry Anomaly to Recovery in{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Four Steps
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {[
              {
                step: "01",
                title: "Telemetry Ingestion",
                desc: "Real-time polling of container status, CPU/memory pressure, latency, and HTTP error rates across the mesh.",
                icon: Activity,
              },
              {
                step: "02",
                title: "Agentic Analysis",
                desc: "Multi-agent LLM reasoning correlates telemetry drops with log exceptions to synthesize clear root cause summaries.",
                icon: Brain,
              },
              {
                step: "03",
                title: "What-If Simulation",
                desc: "Evaluates recovery action candidates against historical precedent and verifies compliance with SRE guardrails.",
                icon: Gauge,
              },
              {
                step: "04",
                title: "Closed-Loop Remediation",
                desc: "Executes the optimal action, verifies recovery via container health-checks, and writes post-mortem to memory.",
                icon: CheckCircle2,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <item.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          MICROSERVICES ARCHITECTURE VISUALIZER
          ========================================================= */}
      <section id="architecture" className="relative z-10 py-24 border-t border-white/[0.08] bg-[#0a0b12]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1 text-xs font-semibold text-indigo-300 mb-3">
              Production Mesh
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Guarding the Complete Service Topology
            </h2>
            <p className="mt-3 text-sm text-white/55">
              Live Docker microservices connected via Sentinel AI's autonomous orchestrator.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { name: "auth-service", port: "8001", role: "Identity & JWT" },
              { name: "product-service", port: "8002", role: "Catalog API" },
              { name: "inventory-service", port: "8003", role: "Stock Ledger" },
              { name: "payment-service", port: "8004", role: "Gateway Stripe" },
              { name: "order-service", port: "8005", role: "Checkout Flow" },
              { name: "shipping-service", port: "8006", role: "Logistics API" },
              { name: "notification-service", port: "8007", role: "Email & Webhooks" },
            ].map((svc, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-white/[0.08] bg-[#0e101c] flex flex-col justify-between text-center hover:border-indigo-500/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 mx-auto flex items-center justify-center mb-3">
                  <Server className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white truncate">{svc.name}</h4>
                <p className="text-[10px] text-white/40 mt-1">{svc.role}</p>
                <span className="mt-3 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-0.5 rounded">
                  PORT {svc.port}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          SRE TESTIMONIALS
          ========================================================= */}
      <section id="testimonials" className="relative z-10 py-24 border-t border-white/[0.08] bg-[#090a0f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1 text-xs font-semibold text-indigo-300 mb-3">
              Verified Feedback
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Trusted by SRE Leaders
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Sentinel completely transformed our incident response. Instead of waking engineers for dependency restarts, Sentinel resolves 80% of our alerts autonomously within 30 seconds.",
                author: "Sarah Chen",
                role: "Staff Infrastructure Engineer",
                company: "CloudScale Inc.",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
              },
              {
                quote:
                  "The What-If Simulation Engine gives us 100% confidence. Being able to see risk reduction before an automated rollback is triggered makes our platform leads sleep soundly.",
                author: "Marcus Vance",
                role: "Director of Reliability Engineering",
                company: "Nexis Financial",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
              },
              {
                quote:
                  "Having vector memory for every production incident means we never make the same operational mistake twice. The multi-hop blast radius mapping alone saved us from cascading outages.",
                author: "Elena Rostova",
                role: "Principal Platform Architect",
                company: "DataMesh Systems",
                avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces",
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between space-y-6"
              >
                <p className="text-sm text-white/70 leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="w-10 h-10 rounded-full object-cover border border-white/20"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.author}</h4>
                    <p className="text-[11px] text-white/45">{t.role} • {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          PRICING & EDITIONS
          ========================================================= */}
      <section id="pricing" className="relative z-10 py-24 border-t border-white/[0.08] bg-[#0a0a10]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1 text-xs font-semibold text-indigo-300 mb-3">
              Transparent Licensing
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Plans for Every Scale
            </h2>
            <p className="mt-3 text-sm text-white/55">
              Deploy Sentinel AI locally or scale across enterprise Kubernetes clusters.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* COMMUNITY */}
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Community</h3>
                <p className="text-xs text-white/50 mt-1">Open source microservices monitoring</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-xs text-white/40">/ forever free</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-white/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Up to 10 Microservices
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Local Docker Telemetry Polling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Basic AI Root Cause Analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Manual Remediation Console
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onNavigate("Overview")}
                className="mt-8 w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Launch Community Edition
              </button>
            </div>

            {/* SRE PRO (FEATURED) */}
            <div className="relative p-8 rounded-2xl border-2 border-indigo-500/60 bg-gradient-to-b from-indigo-500/10 via-white/[0.02] to-transparent flex flex-col justify-between shadow-2xl shadow-indigo-950/60">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                Most Popular
              </div>

              <div>
                <h3 className="text-base font-bold text-white">SRE Professional</h3>
                <p className="text-xs text-white/50 mt-1">Full autonomous operations suite</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$49</span>
                  <span className="text-xs text-white/40">/ node / month</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-white/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Unlimited Microservices & Pods
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Autonomous Self-Healing Actions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Memory-Augmented What-If Engine
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Multi-Hop Blast Radius Calculations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Vector Memory Knowledge Base
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> SRE Safety Cooldown Guardrails
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onNavigate("Login")}
                className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
              >
                Get Started with Pro
              </button>
            </div>

            {/* ENTERPRISE */}
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Enterprise Cluster</h3>
                <p className="text-xs text-white/50 mt-1">Dedicated VPC & custom policy controls</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">Custom</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-white/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Multi-Cluster Kubernetes Mesh
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> SAML / Okta SSO & Role RBAC
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Air-Gapped & On-Premise Support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Dedicated 24/7 SRE Support & SLA
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onNavigate("Login")}
                className="mt-8 w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Contact Enterprise Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CALL TO ACTION BANNER
          ========================================================= */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto rounded-3xl border border-white/15 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-900/40 p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to eliminate outage downtime forever?
            </h2>
            <p className="mt-4 text-sm text-white/60">
              Join progressive platform teams who protect microservices with Sentinel AI's autonomous self-healing.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleGoToConsole}
                className="px-8 py-3.5 rounded-xl bg-white text-[#090a0f] hover:bg-white/90 text-sm font-bold shadow-xl transition-all cursor-pointer flex items-center gap-2"
              >
                {currentUser ? "Launch Operations Console" : "Sign In to Operations Console"}
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </button>
              {!currentUser && (
                <button
                  onClick={() => onNavigate("Login")}
                  className="px-6 py-3.5 rounded-xl border border-white/20 bg-white/[0.08] hover:bg-white/[0.15] text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  Operator Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
          ========================================================= */}
      <footer className="border-t border-white/[0.08] bg-[#07080d] py-12 px-6 text-xs text-white/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white text-sm">
              Sentinel <span className="text-indigo-400 font-medium">AI</span>
            </span>
            <span className="text-white/20">|</span>
            <span>Autonomous Enterprise Operations & SRE Resilience</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Architecture</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <button onClick={() => onNavigate("Login")} className="hover:text-white transition-colors cursor-pointer">
              Sign In
            </button>
            <button onClick={() => onNavigate("Overview")} className="hover:text-white transition-colors cursor-pointer">
              Console
            </button>
          </div>

          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operational (99.99%)</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
