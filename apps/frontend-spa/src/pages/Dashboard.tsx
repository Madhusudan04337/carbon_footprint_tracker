import { useAnalytics, useLogs } from '../hooks/useTracking.ts';

function calculateStreak(logs: { date: string }[]) {
  if (!logs || logs.length === 0) return 0;
  
  // Extract unique dates sorted descending
  const dates = Array.from(new Set(logs.map(l => l.date))).sort((a, b) => b.localeCompare(a));
  
  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let currentDate = today;

  // Check if first date is today or yesterday
  const firstLogDate = new Date(dates[0]);
  firstLogDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - firstLogDate.getTime()) / (1000 * 3600 * 24));
  
  if (diffDays > 1) return 0;

  for (let i = 0; i < dates.length; i++) {
    const logDate = new Date(dates[i]);
    logDate.setHours(0, 0, 0, 0);
    
    // Check if the difference between current expected date and logDate is 0 or 1
    const expectedDiff = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 3600 * 24));
    if (expectedDiff === 0 || expectedDiff === 1) {
      if (expectedDiff === 1 || i === 0) {
        currentStreak++;
      }
      currentDate = logDate;
    } else {
      break;
    }
  }

  return currentStreak;
}

export default function Dashboard() {
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useAnalytics();
  const { data: logs, isLoading: logsLoading } = useLogs();

  if (analyticsLoading || logsLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div>
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 shadow-sm h-32">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 h-64">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (analyticsError) {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    return (
      <div className="p-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md" role="alert">
        <h3 className="font-bold">Backend Connection Error</h3>
        <p>Could not reach the API at <code>{apiUrl}</code>. Please check your network or try again.</p>
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
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Footprint Metrics Overview">
        <div className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">Gross Carbon Output</span>
          <h2 className="text-4xl mt-2 font-bold">{analytics?.total_emissions_co2e} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">kg CO2e</span></h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Aggregated emissions recorded this billing period</p>
        </div>

        <div className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400">Global Benchmark</span>
          <h2 className="text-4xl mt-2 font-bold">
            {analytics && analytics.benchmarks.percent_difference > 0 ? '+' : ''}
            {analytics?.benchmarks.percent_difference}%
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Relative comparison to national averages</p>
        </div>

        <div className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">Log Submissions</span>
          <h2 className="text-4xl mt-2 font-bold">{analytics?.logs_count}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Total distinct habits registered and calculated</p>
        </div>

        <div className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-xs uppercase font-bold tracking-wider text-orange-600 dark:text-orange-400">Current Streak</span>
          <h2 className="text-4xl mt-2 font-bold flex items-center gap-2">
            🔥 {calculateStreak(logs || [])} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">days</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Consecutive days of logging activity</p>
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

          {analytics?.category_breakdown?.waste !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-2">🗑️ Waste & Recycling</span>
                <span className="font-bold">{analytics.category_breakdown.waste} kg CO2e</span>
              </div>
              <div className="h-3 bg-emerald-500/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(0, Math.min(100, (analytics.category_breakdown.waste / (analytics.total_emissions_co2e || 1)) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent History Table */}
      <section className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10" aria-labelledby="history-heading">
        <h3 id="history-heading" className="text-lg font-headings mb-6">Telemetry History Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-emerald-500/10 text-xs uppercase text-gray-500 dark:text-gray-400">
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
