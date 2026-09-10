import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const defaultData = [
  { time: "00:00", primary: 38, secondary: 28 },
  { time: "04:00", primary: 42, secondary: 32 },
  { time: "08:00", primary: 68, secondary: 45 },
  { time: "12:00", primary: 74, secondary: 56 },
  { time: "16:00", primary: 62, secondary: 48 },
  { time: "20:00", primary: 54, secondary: 40 },
  { time: "24:00", primary: 46, secondary: 35 },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-card/95 border border-border rounded-lg px-3 py-2 shadow-xl backdrop-blur-md text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: item.color || item.stroke }}
          />
          <span className="capitalize">{item.name}:</span>
          <span className="font-semibold text-foreground">
            {item.value}
            {item.unit || "%"}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MetricChart({
  title = "Telemetry & Latency Trends",
  subtitle = "Infrastructure resource utilization over time",
  data = defaultData,
  primaryKey = "primary",
  secondaryKey = "secondary",
  primaryLabel = "Current",
  secondaryLabel = "Baseline",
  unit = "%",
  height = 280,
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER WITH TITLE & CUSTOM LEGEND */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
            <span className="text-muted-foreground font-medium">
              {primaryLabel}
            </span>
          </div>
          {secondaryKey && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
              <span className="text-muted-foreground font-medium">
                {secondaryLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CHART CONTAINER */}
      <div style={{ height: `${height}px`, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="chartSecondary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.20} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255, 255, 255, 0.05)"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(240 5% 65%)", fontSize: 11 }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(240 5% 65%)", fontSize: 11 }}
              dx={-8}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey={primaryKey}
              name={primaryLabel}
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#chartPrimary)"
              activeDot={{ r: 5, fill: "#6366f1", stroke: "#090a0f", strokeWidth: 2 }}
            />

            {secondaryKey && (
              <Area
                type="monotone"
                dataKey={secondaryKey}
                name={secondaryLabel}
                stroke="#06b6d4"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="url(#chartSecondary)"
                activeDot={{ r: 4, fill: "#06b6d4", stroke: "#090a0f", strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}