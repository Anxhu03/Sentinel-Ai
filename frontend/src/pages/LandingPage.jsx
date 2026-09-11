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
import { ThemeToggle } from "../context/ThemeContext"
import SentinelLogo from "../components/SentinelLogo"

export default function LandingPage({ onNavigate, backendOnline, currentUser }) {
  const [activeIncidentPreset, setActiveIncidentPreset] = useState("payment")
  const [simState, setSimState] = useState("idle") // "idle" | "analyzing" | "degraded" | "remediating" | "resolved"
  const [terminalLogs, setTerminalLogs] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleGoToConsole = () => {
    if (currentUser) {
      onNavigate("/app")
    } else {
      onNavigate("/login")
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
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30 selection:text-indigo-950 dark:selection:text-white font-sans antialiased overflow-x-hidden transition-colors duration-300">
      {/* =========================================================
          AMBIENT GLOWS & BACKGROUND VERTICAL TECH GRID
          (Matching reference image visual aesthetic)
          ========================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Vertical subtle technical grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] transition-opacity duration-300"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, currentColor 0, currentColor 1px, transparent 1px, transparent 80px)`,
          }}
        />
        {/* Subtle dot matrix grid */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Radiant atmospheric purple-violet bloom matching reference image */}
        <div className="absolute top-[8%] right-[10%] w-[580px] h-[580px] rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-600/15 to-indigo-600/20 blur-[150px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-purple-600/10 dark:bg-purple-800/15 blur-[160px]" />
      </div>

      {/* =========================================================
          STICKY GLASS NAVBAR
          ========================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* LOGO */}
          <div
            onClick={() => onNavigate("Landing")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <SentinelLogo size={32} />
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              v2.4
            </span>
          </div>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#interactive-demo" className="hover:text-foreground transition-colors">Interactive Demo</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>

          {/* RIGHT ACTION BUTTONS */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {currentUser ? (
              <button
                onClick={() => onNavigate("/app")}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Console ({currentUser.full_name || currentUser.username})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate("/login")}
                  className="px-3.5 py-2 text-xs font-semibold text-foreground/80 hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Sign In
                </button>

                <button
                  onClick={() => onNavigate("/login")}
                  className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Launch Sentinel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE (WITH THEME TOGGLE FOR ACCESSIBILITY) */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle compact />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-muted-foreground hover:text-foreground p-2"
              aria-label="Toggle navigation menu"
            >
              <Layers className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-card px-6 py-4 space-y-3 transition-colors">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#interactive-demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground"
            >
              Interactive Demo
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </a>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onNavigate("/login")
                }}
                className="w-full py-2 text-xs font-semibold text-foreground bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onNavigate("/app")
                }}
                className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg text-center"
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
          {/* ENGINE STATUS PILL BADGE (MATCHING REFERENCE IMAGE) */}
          <div className="mb-6 sentinel-pill-badge animate-in fade-in slide-in-from-top-3 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
            </span>
            <span>Adaptive AI Routing &amp; SRE Engine v2.4 Live</span>
            <span className="text-purple-400/40">•</span>
            <span className="text-muted-foreground">
              {backendOnline ? "Control Plane Connected" : "Mesh Core Ready"}
            </span>
          </div>

          {/* MAIN HEADLINE */}
          <h1 className="text-balance text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08]">
            Autonomous SRE Operations in{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-300 dark:to-indigo-400 bg-clip-text text-transparent">
              seconds
            </span>
            , not days
          </h1>

          {/* SUBTITLE */}
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Eliminate 3 AM incident fatigue. Sentinel monitors microservices telemetry, pinpoints root causes with agentic reasoning, simulates What-If scenarios, and executes policy-governed self-healing.
          </p>

          {/* ACTION BUTTONS */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleGoToConsole}
              id="cta-launch-sentinel"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-indigo-200" />
              <span>Launch Sentinel</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#interactive-demo"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-border bg-card hover:bg-secondary text-foreground font-medium text-sm transition-all cursor-pointer shadow-xs"
            >
              <Play className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
              Try Live Interactive Demo
            </a>

            {!currentUser && (
              <button
                onClick={() => onNavigate("/signup")}
                className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-sm font-medium transition-colors cursor-pointer shadow-xs"
              >
                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Sign Up
              </button>
            )}
          </div>

          {/* SOCIAL PROOF & METRICS RIBBON */}
          <div className="mt-12 flex flex-col sm:flex-row items-center gap-6 pt-8 border-t border-border w-full justify-center">
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
                    className="w-8 h-8 rounded-full border-2 border-background object-cover ring-1 ring-border"
                  />
                ))}
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold text-foreground">500+ Microservice Clusters</p>
                <p className="text-muted-foreground">Guarded 24/7 with zero downtime</p>
              </div>
            </div>

            <div className="hidden sm:block h-8 w-[1px] bg-border" />

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <div>
                <span className="font-bold text-foreground text-sm">99.99%</span> Uptime SLA
              </div>
              <div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">&lt; 25s</span> MTTR Recovery
              </div>
              <div>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">100%</span> Policy Governed
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            INTERACTIVE LIVE INCIDENT PLAYGROUND / TERMINAL
            ========================================================= */}
        <div id="interactive-demo" className="mt-16 md:mt-24 max-w-5xl mx-auto scroll-mt-24">
          <div className="relative rounded-2xl border border-border bg-card p-2 md:p-3 shadow-2xl shadow-indigo-950/10 dark:shadow-indigo-950/40 transition-colors duration-300">
            {/* AMBIENT CORNER GLOW */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/15 blur-3xl pointer-events-none" />

            {/* TERMINAL WINDOW HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-border bg-secondary/80 dark:bg-[#0f111e] rounded-t-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-muted-foreground dark:text-white/40">
                  sentinel-ai-engine :: interactive sandbox
                </span>
              </div>

              {/* INCIDENT PRESET SELECTOR TABS */}
              <div className="flex items-center gap-1 bg-card dark:bg-[#161826] p-1 rounded-lg border border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground px-2">Trigger Failure:</span>
                {Object.keys(PRESETS).map((key) => (
                  <button
                    key={key}
                    onClick={() => runPresetSimulation(key)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize ${
                      activeIncidentPreset === key
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary dark:text-white/60 dark:hover:text-white"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* TERMINAL CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border bg-[#0a0b12] rounded-b-xl overflow-hidden">
              {/* LEFT: LIVE LOGS STREAM */}
              <div className="lg:col-span-7 p-5 font-mono text-xs space-y-2.5 min-h-[300px] flex flex-col justify-between bg-[#0a0b12] text-white">
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
              <div className="lg:col-span-5 p-5 bg-card dark:bg-[#0e101a] flex flex-col justify-between gap-4 transition-colors">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Target Condition
                    </span>
                    <h4 className="text-sm font-bold text-foreground mt-0.5">
                      {currentPreset.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-normal">
                      Service: <span className="font-mono text-foreground font-semibold">{currentPreset.service}</span>
                    </p>
                  </div>

                  {/* TELEMETRY GAUGES */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-secondary/80 dark:bg-[#141624] border border-border text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Latency</p>
                      <p className={`text-xs font-bold font-mono mt-0.5 ${simState === "resolved" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {simState === "resolved" ? "42 ms" : currentPreset.latency}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-secondary/80 dark:bg-[#141624] border border-border text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">CPU Usage</p>
                      <p className={`text-xs font-bold font-mono mt-0.5 ${simState === "resolved" ? "text-emerald-600 dark:text-emerald-400" : currentPreset.cpu}`}>
                        {simState === "resolved" ? "24%" : currentPreset.cpu}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-secondary/80 dark:bg-[#141624] border border-border text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Blast Radius</p>
                      <p className={`text-xs font-bold font-mono mt-0.5 ${simState === "resolved" ? "text-emerald-600 dark:text-emerald-400" : `${currentPreset.blastRadius} svcs`}`}>
                        {simState === "resolved" ? "0 svc" : `${currentPreset.blastRadius} svcs`}
                      </p>
                    </div>
                  </div>

                  {/* AI RECOMMENDATION BOX */}
                  <div className="p-3 rounded-xl border border-indigo-500/25 bg-indigo-500/10">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300 mb-1">
                      <Brain className="w-3.5 h-3.5" />
                      Recommended AI Action
                    </div>
                    <p className="text-xs font-medium text-foreground dark:text-white/90">
                      {currentPreset.recommendedAction}
                    </p>
                    <p className="text-[11px] text-muted-foreground dark:text-white/50 mt-1">
                      Risk Score: 20/100 (Low) • Expected Recovery: ~25 seconds
                    </p>
                  </div>
                </div>

                {/* ACTION TRIGGER BUTTON */}
                <div className="space-y-2">
                  {simState === "resolved" ? (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Autonomous Recovery Successful
                      </div>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/70 mt-0.5">
                        Post-action verification verified 100% container availability.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleSimulatedRemediation}
                      disabled={simState === "remediating"}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
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
                    onClick={() => onNavigate("/app")}
                    className="w-full py-2 text-center text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center justify-center gap-1 cursor-pointer"
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
      <section id="features" className="relative z-10 py-24 border-t border-border bg-secondary/30 dark:bg-[#0a0a10] transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 mb-3">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              Engineered for Enterprise{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Microservices Resilience
              </span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Comprehensive telemetry, automated reasoning, and closed-loop self-healing to protect mission-critical operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* SIGNATURE ADAPTIVE AI ROUTING SHOWCASE (MATCHING REFERENCE IMAGE) */}
            <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-border/80 bg-[#08080d] p-8 md:p-10 relative overflow-hidden shadow-2xl transition-all duration-300 group hover:border-purple-500/40">
              {/* Atmospheric radiant purple-violet bloom */}
              <div className="absolute top-[-20%] right-[15%] w-[450px] h-[450px] rounded-full bg-radial from-purple-600/25 via-fuchsia-600/10 to-transparent blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col justify-between h-full">
                {/* Header with Logo and Pill Badge */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <SentinelLogo size={32} />
                  <div className="sentinel-pill-badge">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_#c084fc]" />
                    <span>Adaptive AI Routing</span>
                  </div>
                </div>

                {/* Dynamic Glowing Trajectory Curve with Vertical Grid */}
                <div className="relative h-44 my-8 w-full overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 700 180" fill="none" preserveAspectRatio="none">
                    {/* Vertical subtle technical grid markers */}
                    {[70, 140, 210, 280, 350, 420, 490, 560, 630].map((x) => (
                      <line key={x} x1={x} y1="0" x2={x} y2="180" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
                    ))}

                    <defs>
                      <filter id="trajectoryGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* The rising neon curve */}
                    <path
                      d="M 40 150 C 140 145 220 115 280 110 C 350 105 400 130 450 95 C 490 65 520 25 550 35 C 575 45 610 85 660 75"
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="url(#trajectoryGlow)"
                    />

                    {/* Secondary sharp core stroke */}
                    <path
                      d="M 40 150 C 140 145 220 115 280 110 C 350 105 400 130 450 95 C 490 65 520 25 550 35 C 575 45 610 85 660 75"
                      fill="none"
                      stroke="#f5d0fe"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />

                    {/* Beacon point with concentric glow rings */}
                    <circle cx="545" cy="42" r="36" fill="rgba(192, 132, 252, 0.15)" filter="blur(8px)" />
                    <circle cx="545" cy="42" r="18" fill="rgba(216, 180, 254, 0.35)" filter="blur(3px)" />
                    <circle cx="545" cy="42" r="6.5" fill="#ffffff" filter="drop-shadow(0 0 10px #ffffff)" />
                  </svg>
                </div>

                {/* Typographic Statement matching reference image */}
                <div className="max-w-xl">
                  <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground leading-snug">
                    Automatically selects the right{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-400 font-semibold drop-shadow-[0_0_15px_rgba(192,132,252,0.4)]">
                      AI model
                    </span>{" "}
                    for every request in real time.
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Autonomous telemetry dispatching, dynamic agentic routing, and multi-model consensus across Claude, Gemini, and GPT-4 for sub-second SRE incident remediation.
                  </p>
                </div>
              </div>
            </div>

            {/* FEATURE 1 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover:border-indigo-500/40 hover:shadow-lg dark:hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Autonomous Self-Healing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Automatically restart failed containers, rollback broken releases, or scale replicas according to SRE safety policies with zero human intervention required.
              </p>
            </div>

            {/* FEATURE 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover:border-indigo-500/40 hover:shadow-lg dark:hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Agentic Root Cause Analysis</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dedicated LLM reasoning agents parse thousands of raw log lines and error traces, pinpointing exact code and database failure vectors in milliseconds.
              </p>
            </div>

            {/* FEATURE 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover:border-indigo-500/40 hover:shadow-lg dark:hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <GitBranch className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Multi-Hop Blast Radius</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Map directional dependency graphs across upstream clients and downstream providers. Calculate recursive blast radius before cascading outages propagate.
              </p>
            </div>

            {/* FEATURE 4 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover:border-indigo-500/40 hover:shadow-lg dark:hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">What-If Decision Simulation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simulate candidate remediation scenarios in a sandbox model. Compare recovery probabilities and risk scores to pick the optimal action deterministically.
              </p>
            </div>

            {/* FEATURE 5 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover:border-indigo-500/40 hover:shadow-lg dark:hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Vector Incident Memory</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every incident, resolution duration, and recovery outcome is stored into persistent memory. Sentinel gets smarter with every production event.
              </p>
            </div>

            {/* FEATURE 6 */}
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover:border-indigo-500/40 hover:shadow-lg dark:hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">SRE Safety Policy Guardrails</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Immutable audit logging, rate-limit cooldown windows, and maximum blast-radius gates ensure automated actions never perform destructive operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS (4-STEP PROGRESSION)
          ========================================================= */}
      <section id="how-it-works" className="relative z-10 py-24 border-t border-border bg-background transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 mb-3">
              Workflow Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              From Telemetry Anomaly to Recovery in{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
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
                className="relative p-6 rounded-2xl border border-border bg-card shadow-xs hover:shadow-md flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <item.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          MICROSERVICES ARCHITECTURE VISUALIZER
          ========================================================= */}
      <section id="architecture" className="relative z-10 py-24 border-t border-border bg-secondary/30 dark:bg-[#0a0b12] transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 mb-3">
              Production Mesh
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              Guarding the Complete Service Topology
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
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
                className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between text-center hover:border-indigo-500/40 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
                  <Server className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-foreground truncate">{svc.name}</h4>
                <p className="text-[10px] text-muted-foreground mt-1">{svc.role}</p>
                <span className="mt-3 text-[9px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-0.5 rounded font-semibold">
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
      <section id="testimonials" className="relative z-10 py-24 border-t border-border bg-background transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 mb-3">
              Verified Feedback
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
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
                className="p-8 rounded-2xl border border-border bg-card shadow-xs hover:shadow-md flex flex-col justify-between space-y-6 transition-all"
              >
                <p className="text-sm text-foreground/80 dark:text-white/70 leading-relaxed italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="w-10 h-10 rounded-full object-cover border border-border ring-1 ring-border"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{t.author}</h4>
                    <p className="text-[11px] text-muted-foreground">{t.role} • {t.company}</p>
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
      <section id="pricing" className="relative z-10 py-24 border-t border-border bg-secondary/30 dark:bg-[#0a0a10] transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 mb-3">
              Transparent Licensing
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              Plans for Every Scale
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Deploy Sentinel AI locally or scale across enterprise Kubernetes clusters.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* COMMUNITY */}
            <div className="p-8 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <h3 className="text-base font-bold text-foreground">Community</h3>
                <p className="text-xs text-muted-foreground mt-1">Open source microservices monitoring</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">$0</span>
                  <span className="text-xs text-muted-foreground">/ forever free</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Up to 10 Microservices
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Local Docker Telemetry Polling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Basic AI Root Cause Analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Manual Remediation Console
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onNavigate("/app")}
                className="mt-8 w-full py-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground transition-colors cursor-pointer"
              >
                Launch Community Edition
              </button>
            </div>

            {/* SRE PRO (FEATURED) */}
            <div className="relative p-8 rounded-2xl border-2 border-indigo-500/60 bg-gradient-to-b from-indigo-500/10 via-card to-card flex flex-col justify-between shadow-2xl shadow-indigo-950/20 dark:shadow-indigo-950/60">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                Most Popular
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">SRE Professional</h3>
                <p className="text-xs text-muted-foreground mt-1">Full autonomous operations suite</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">$49</span>
                  <span className="text-xs text-muted-foreground">/ node / month</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-foreground/90 dark:text-white/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Unlimited Microservices & Pods
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Autonomous Self-Healing Actions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Memory-Augmented What-If Engine
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Multi-Hop Blast Radius Calculations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Vector Memory Knowledge Base
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> SRE Safety Cooldown Guardrails
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onNavigate("/login")}
                className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
              >
                Get Started with Pro
              </button>
            </div>

            {/* ENTERPRISE */}
            <div className="p-8 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <h3 className="text-base font-bold text-foreground">Enterprise Cluster</h3>
                <p className="text-xs text-muted-foreground mt-1">Dedicated VPC & custom policy controls</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">Custom</span>
                </div>

                <ul className="mt-8 space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Multi-Cluster Kubernetes Mesh
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> SAML / Okta SSO & Role RBAC
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Air-Gapped & On-Premise Support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Dedicated 24/7 SRE Support & SLA
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onNavigate("/login")}
                className="mt-8 w-full py-2.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground transition-colors cursor-pointer"
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
        <div className="max-w-5xl mx-auto rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-12 text-center relative overflow-hidden shadow-2xl text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to eliminate outage downtime forever?
            </h2>
            <p className="mt-4 text-sm text-white/80">
              Join progressive platform teams who protect microservices with Sentinel AI's autonomous self-healing.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleGoToConsole}
                className="px-8 py-3.5 rounded-xl bg-white text-indigo-950 hover:bg-white/90 text-sm font-bold shadow-xl transition-all cursor-pointer flex items-center gap-2"
              >
                {currentUser ? "Launch Operations Console" : "Sign In to Operations Console"}
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </button>
              {!currentUser && (
                <button
                  onClick={() => onNavigate("/login")}
                  className="px-6 py-3.5 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-semibold text-white transition-colors cursor-pointer"
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
      <footer className="border-t border-border bg-card dark:bg-[#07080d] py-12 px-6 text-xs text-muted-foreground transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <SentinelLogo size={24} withText={true} />
            <span className="text-border">|</span>
            <span>Autonomous Enterprise Operations &amp; SRE Resilience</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">Architecture</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <button onClick={() => onNavigate("/login")} className="hover:text-foreground transition-colors cursor-pointer">
              Sign In
            </button>
            <button onClick={() => onNavigate("/app")} className="hover:text-foreground transition-colors cursor-pointer">
              Console
            </button>
          </div>

          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational (99.99%)</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
