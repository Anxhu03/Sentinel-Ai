import { Bell, Search, Zap } from "lucide-react"

function Topbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#0B120E]/90 px-8 backdrop-blur-xl">
      
      {/* Left */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-600">
          Operations Center
        </p>

        <h2 className="mt-1 text-xl font-semibold text-white">
          System Overview
        </h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        
        {/* Search */}
        <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-gray-600" />
          <span className="text-xs text-gray-600">
            Search incidents...
          </span>
        </div>

        {/* AI Status */}
        <div className="flex items-center gap-2 rounded-lg border border-[#75E063]/20 bg-[#75E063]/5 px-3 py-2">
          <Zap className="h-4 w-4 text-[#75E063]" />
          <span className="text-xs font-medium text-[#75E063]">
            AI Engine Online
          </span>
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-gray-400 transition hover:bg-white/5 hover:text-white">
          <Bell className="h-4 w-4" />

          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#75E063]" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3 border-l border-white/10 pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#75E063]/10 text-sm font-semibold text-[#75E063]">
            S
          </div>

          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white">
              Sentinel Operator
            </p>
            <p className="text-[10px] text-gray-600">
              Administrator
            </p>
          </div>
        </div>

      </div>
    </header>
  )
}

export default Topbar