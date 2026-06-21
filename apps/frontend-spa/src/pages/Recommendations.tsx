
import { useRecommendations } from '../hooks/useTracking.ts';

export default function Recommendations() {
  const { data: recommendations, isLoading, error } = useRecommendations();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4" role="status" aria-live="polite">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400">Consulting AI sustainability templates...</p>
      </div>
    );
  }

  if (error) {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    return (
      <div className="p-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md" role="alert">
        <h3 className="font-bold">Backend Connection Error</h3>
        <p>Could not reach the API at <code>{apiUrl}</code>. Please check your network or try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-headings text-gray-900 dark:text-white">AI Sustainability Advice</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Tailored actions based on your highest emission drivers.</p>
      </div>

      {/* Overview Potential Savings Card */}
      <div className="bg-emerald-500 text-white p-6 rounded-2xl shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-xl font-headings font-bold">Estimated Savings Potential</h2>
          <p className="text-emerald-100 text-sm mt-1">Total weekly offsets if top recommendations are completed.</p>
        </div>
        <span className="text-3xl font-bold bg-white/20 px-4 py-2 rounded-xl">
          -{recommendations?.potential_weekly_savings_co2e_kg} kg CO2e
        </span>
      </div>

      {/* Prioritized Recommendations Cards */}
      <section className="space-y-6" aria-label="Prioritized Suggestions List">
        <h3 className="text-lg font-headings">High-Impact Recommendations</h3>
        <div className="grid grid-cols-1 gap-6">
          {recommendations?.prioritized_recommendations.map((rec: any) => (
            <div 
              key={rec.id} 
              className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {rec.category}
                  </span>
                  <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    {rec.difficulty} Difficulty
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-800 dark:text-white">{rec.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{rec.description}</p>
                <p className="text-xs text-gray-400 italic">Why: {rec.explanation}</p>
              </div>

              <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl font-bold text-center w-full md:w-auto">
                -{rec.potential_saving_co2e_kg} kg
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly Action Schedule */}
      <section className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10" aria-labelledby="schedule-heading">
        <h3 id="schedule-heading" className="text-lg font-headings mb-6">Weekly Carbon Reduction Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {recommendations && Object.entries(recommendations.weekly_action_plan).map(([day, task]: any) => (
            <div key={day} className="p-4 rounded-xl border border-emerald-500/5 bg-emerald-500/[0.02]">
              <strong className="text-emerald-600 dark:text-emerald-400 font-headings block mb-1">{day}</strong>
              <p className="text-gray-600 dark:text-gray-300">{task}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
