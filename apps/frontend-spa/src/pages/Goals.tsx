
import { useGoals, useToggleGoal } from '../hooks/useTracking.ts';

export default function Goals() {
  const { data: goals, isLoading, error } = useGoals();
  const toggleGoalMutation = useToggleGoal();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4" role="status" aria-live="polite">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading goals telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md" role="alert">
        <h3 className="font-bold">Database Connection Deficit</h3>
        <p>Ensure the Python FastAPI backend is running on http://localhost:8000.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-headings text-gray-900 dark:text-white">Reduction Goals</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your carbon limits and commit to sustainable changes.</p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-label="Reduction Goals List">
        {goals?.map((goal) => (
          <div 
            key={goal.id} 
            className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 shadow-sm flex flex-col justify-between space-y-6"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-500">{goal.category} sector</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500">
                  -{goal.target_reduction_percent}% reduction
                </span>
              </div>
              <h2 className="text-xl font-headings text-gray-800 dark:text-white">{goal.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Keep emissions below <strong>{goal.target_emissions_limit} kg CO2e</strong> by {goal.end_date}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-emerald-500/5">
              <label className="flex items-center space-x-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-gray-300 dark:border-emerald-500/20 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                  checked={goal.completed}
                  onChange={() => toggleGoalMutation.mutate({ goalId: goal.id, completed: !goal.completed })}
                  disabled={toggleGoalMutation.isPending}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {goal.completed ? 'Goal Achieved!' : 'Mark goal as completed'}
                </span>
              </label>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
