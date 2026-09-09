import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const data = [
  { time: "10:00", value: 42 },
  { time: "10:05", value: 48 },
  { time: "10:10", value: 45 },
  { time: "10:15", value: 52 },
  { time: "10:20", value: 49 },
  { time: "10:25", value: 57 },
  { time: "10:30", value: 54 },
]

function MetricChart({ title = "CPU Usage", value = "54%" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-600">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold text-white">
            {value}
          </p>
        </div>

        <span className="rounded-lg bg-[#75E063]/10 px-2.5 py-1 text-[10px] text-[#75E063]">
          LIVE
        </span>
      </div>

      <div className="mt-5 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id={`metricGradient-${title}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#75E063"
                  stopOpacity={0.25}
                />

                <stop
                  offset="100%"
                  stopColor="#75E063"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#4b5563",
                fontSize: 10,
              }}
            />

            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#4b5563",
                fontSize: 10,
              }}
            />

            <Tooltip
              contentStyle={{
                background: "#0B120E",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#75E063"
              strokeWidth={2}
              fill={`url(#metricGradient-${title})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default MetricChart