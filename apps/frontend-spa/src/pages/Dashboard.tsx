
import { useAnalytics, useLogs } from '../hooks/useTracking.ts';

export default function Dashboard() {
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useAnalytics();
  const { data: logs, isLoading: logsLoading } = useLogs();

  if (analyticsLoading || logsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4" role="status" aria-live="polite">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400">Syncing database logs and compiling metrics...</p>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className="p-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md" role="alert">
        <h3 className="font-bold">Database Connection Deficit</h3>
        <p>Ensure the Python FastAPI backend is running on http://localhost:8000 and you are authenticated.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div>
        <h1 className="text-3xl font-headings text-gray-900 dark:text-white">EcoTrace Carbon Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Track, analyze, and offset your personal environmental impact.</p>
      </div>

      {/* Numerical Stats Widgets */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Footprint Metrics Overview">
        <div className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-500">Gross Carbon Output</span>
          <h2 className="text-4xl mt-2 font-bold">{analytics?.total_emissions_co2e} <span className="text-sm font-normal text-gray-400">kg CO2e</span></h2>
          <p className="text-xs text-gray-400 mt-2">Aggregated emissions recorded this billing period</p>
        </div>

        <div className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-500">Global Benchmark</span>
          <h2 className="text-4xl mt-2 font-bold">
            {analytics && analytics.benchmarks.percent_difference > 0 ? '+' : ''}
            {analytics?.benchmarks.percent_difference}%
          </h2>
          <p className="text-xs text-gray-400 mt-2">Relative comparison to national averages</p>
        </div>

        <div className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-500">Log Submissions</span>
          <h2 className="text-4xl mt-2 font-bold">{analytics?.logs_count}</h2>
          <p className="text-xs text-gray-400 mt-2">Total distinct habits registered and calculated</p>
        </div>
      </section>

      {/* Charts & Histograms Breakdown */}
      <section className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10" aria-labelledby="breakdown-heading">
        <h3 id="breakdown-heading" className="text-lg font-headings mb-6">Emissions Sector Distribution</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center gap-2">🚗 Transportation</span>
              <span className="font-bold">{analytics?.category_breakdown.transport} kg CO2e</span>
            </div>
            <div className="h-3 bg-emerald-500/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, ((analytics?.category_breakdown.transport || 0) / (analytics?.total_emissions_co2e || 1)) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center gap-2">⚡ Home Energy</span>
              <span className="font-bold">{analytics?.category_breakdown.energy} kg CO2e</span>
            </div>
            <div className="h-3 bg-emerald-500/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, ((analytics?.category_breakdown.energy || 0) / (analytics?.total_emissions_co2e || 1)) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center gap-2">🍔 Diet & Nutrition</span>
              <span className="font-bold">{analytics?.category_breakdown.diet} kg CO2e</span>
            </div>
            <div className="h-3 bg-emerald-500/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, ((analytics?.category_breakdown.diet || 0) / (analytics?.total_emissions_co2e || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recent History Table */}
      <section className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10" aria-labelledby="history-heading">
        <h3 id="history-heading" className="text-lg font-headings mb-6">Telemetry History Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-emerald-500/10 text-xs uppercase text-gray-400">
                <th className="py-3 px-4">Logged Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Activity Name</th>
                <th className="py-3 px-4 text-right">Activity Level</th>
                <th className="py-3 px-4 text-right">Footprint</th>
              </tr>
            </thead>
            <tbody>
              {logs?.slice(0, 5).map((log) => (
                <tr key={log.id} className="border-b border-emerald-500/5 text-sm hover:bg-emerald-500/5 transition-colors">
                  <td className="py-3 px-4">{log.date}</td>
                  <td className="py-3 px-4 capitalize">{log.category}</td>
                  <td className="py-3 px-4 capitalize">{log.sub_category.replace('_', ' ')}</td>
                  <td className="py-3 px-4 text-right">{log.value}</td>
                  <td className="py-3 px-4 text-right font-bold">{log.emissions_co2e} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
