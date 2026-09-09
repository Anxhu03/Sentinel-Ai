import { useEffect, useState } from "react";
import { Network } from "lucide-react";

const API_URL = "http://localhost:8000";

function DependencyGraph() {
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/dependencies/`)
      .then((response) => response.json())
      .then((data) => setGraph(data))
      .catch((error) => console.error("Dependency graph error:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#101712] p-6 text-gray-400">
        Loading service dependency graph...
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-red-400">
        Unable to load dependency graph.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101712] p-6 shadow-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-[#75E063]/10 p-2">
          <Network className="h-5 w-5 text-[#75E063]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">
            Service Dependency Graph
          </h2>
          <p className="text-sm text-gray-500">
            Live architecture relationships detected by Sentinel
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {graph.services.map((service) => {
          const dependencies = graph.dependencies
            .filter((item) => item.service === service)
            .map((item) => item.depends_on);

          return (
            <div
              key={service}
              className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-[#75E063]/40"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#75E063] shadow-[0_0_8px_#75E063]" />
                <span className="font-medium text-white">{service}</span>
              </div>

              {dependencies.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Depends on
                  </p>
                  {dependencies.map((dependency) => (
                    <div
                      key={dependency}
                      className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-gray-300"
                    >
                      → {dependency}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  No upstream dependencies
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DependencyGraph;
