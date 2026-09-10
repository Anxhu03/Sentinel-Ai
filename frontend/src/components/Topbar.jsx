import { Bell, Search } from "lucide-react"

function Topbar() {
  return (
    <header className="sticky top-0 z-40 h-[76px] border-b border-white/[0.07] bg-[#08090D]/90 backdrop-blur-2xl">
      <div className="flex h-full items-center justify-between px-6">

        <div>
          <h1 className="text-[15px] font-semibold tracking-wide text-white">
            Operations Center
          </h1>

          <p className="mt-0.5 text-[11px] text-gray-600">
            Enterprise infrastructure monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">

          <button
            type="button"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-gray-600 transition hover:border-violet-400/15 hover:bg-violet-500/[0.05] hover:text-violet-300"
          >
            <Search className="h-[16px] w-[16px]" />
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-gray-600 transition hover:border-violet-400/15 hover:bg-violet-500/[0.05] hover:text-violet-300"
          >
            <Bell className="h-[16px] w-[16px]" />

            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#75E063] shadow-[0_0_7px_#75E063]" />
          </button>

          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">

            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.14] to-indigo-500/[0.06] text-[9px] font-semibold text-violet-300">
              OP
            </div>

            <div className="hidden sm:block">
              <p className="text-[10px] font-medium text-gray-300">
                Operator
              </p>

              <p className="text-[8px] text-gray-600">
                Production
              </p>
            </div>

          </div>

        </div>
      </div>
    </header>
  )
}

export default Topbar