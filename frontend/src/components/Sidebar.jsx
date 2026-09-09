import {
  Activity,
  Brain,
  Boxes,
  LayoutDashboard,
  Settings,
  Shield,
  Terminal,
} from "lucide-react"

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/10 bg-[#0B120E] lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#75E063]/30 bg-[#75E063]/10">
          <Shield className="h-5 w-5 text-[#75E063]" />
        </div>

        <div>
          <h1 className="text-sm font-semibold tracking-wide text-white">
            SENTINEL AI
          </h1>

          <p className="mt-0.5 text-[10px] uppercase tracking-widest text-gray-600">
            Operations Copilot
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-widest text-gray-700">
          Workspace
        </p>

        <div className="space-y-1">
          <NavItem
            icon={LayoutDashboard}
            label="Dashboard"
            active
          />

          <NavItem
            icon={Activity}
            label="Monitoring"
          />

          <NavItem
            icon={Brain}
            label="AI Investigations"
          />

          <NavItem
            icon={Boxes}
            label="Services"
          />

          <NavItem
            icon={Terminal}
            label="Execution"
          />
        </div>

        <p className="mb-3 mt-8 px-3 text-[10px] font-medium uppercase tracking-widest text-gray-700">
          System
        </p>

        <NavItem
          icon={Settings}
          label="Settings"
        />
      </nav>

      {/* Engine Status */}
      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl border border-[#75E063]/10 bg-[#75E063]/[0.03] p-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#75E063] shadow-[0_0_8px_#75E063]" />

            <span className="text-xs font-medium text-[#75E063]">
              AI Engine Online
            </span>
          </div>

          <p className="mt-2 text-[10px] leading-5 text-gray-600">
            Monitoring production infrastructure and waiting for incidents.
          </p>
        </div>
      </div>
    </aside>
  )
}

function NavItem({ icon: Icon, label, active = false }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
        active
          ? "border border-[#75E063]/15 bg-[#75E063]/10 text-[#75E063]"
          : "border border-transparent text-gray-500 hover:bg-white/[0.03] hover:text-gray-300"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />

      <span>{label}</span>
    </button>
  )
}

export default Sidebar