import React, { useState, useEffect } from 'react';
import Head from 'next/head';

interface ActivityLog {
  id: string;
  category: 'transport' | 'diet' | 'energy';
  subCategory: string;
  value: number;
  emissions: number;
  date: string;
}

interface CarbonGoal {
  id: string;
  category: string;
  targetReductionPercent: number;
  targetEmissionsLimit: number;
  startDate: string;
  endDate: string;
  completed: boolean;
}

interface AnalyticsSummary {
  totalEmissions: number;
  categoryBreakdown: {
    transport: number;
    diet: number;
    energy: number;
  };
  benchmarks: {
    userMonthlyAverage: number;
    nationalMonthlyAverage: number;
    percentDifference: number;
  };
  logsCount: number;
}

export default function Dashboard() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [goals, setGoals] = useState<CarbonGoal[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Input states
  const [category, setCategory] = useState<'transport' | 'diet' | 'energy'>('transport');
  const [subCategory, setSubCategory] = useState<string>('gasoline_car');
  const [value, setValue] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Loading & error state
  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsRes, goalsRes, analyticsRes] = await Promise.all([
        fetch('http://localhost:4000/api/logs'),
        fetch('http://localhost:4000/api/goals'),
        fetch('http://localhost:4000/api/analytics')
      ]);

      if (!logsRes.ok || !goalsRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to fetch data from backend tracker API');
      }

      const logsData = await logsRes.json();
      const goalsData = await goalsRes.json();
      const analyticsData = await analyticsRes.json();

      setLogs(logsData.reverse()); // latest first
      setGoals(goalsData);
      setAnalytics(analyticsData);
    } catch (e: any) {
      console.error(e);
      setError('Could not connect to tracking server. Please make sure the tracker service is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || isNaN(Number(value))) return;

    setSubmitLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subCategory, value: Number(value), date })
      });

      if (!res.ok) throw new Error('Failed to log activity');

      setValue('');
      await fetchData(); // refresh analytics, logs and goals
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleGoal = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:4000/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus })
      });
      if (!res.ok) throw new Error('Failed to update goal');
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      if (nextTheme === 'dark') {
        root.style.setProperty('--color-bg-base', '#0B130E');
        root.style.setProperty('--color-bg-surface', '#13221B');
        root.style.setProperty('--color-primary', '#10B981');
        root.style.setProperty('--color-text-main', '#F3F4F6');
        root.style.setProperty('--color-text-muted', '#8B9A93');
      } else {
        root.style.setProperty('--color-bg-base', '#F4F7F5');
        root.style.setProperty('--color-bg-surface', '#FFFFFF');
        root.style.setProperty('--color-primary', '#065F46');
        root.style.setProperty('--color-text-main', '#1F2937');
        root.style.setProperty('--color-text-muted', '#4B5563');
      }
    }
  };

  // Adjust subcategories when category changes
  useEffect(() => {
    if (category === 'transport') {
      setSubCategory('gasoline_car');
    } else if (category === 'diet') {
      setSubCategory('low_meat');
    } else if (category === 'energy') {
      setSubCategory('us_average');
    }
  }, [category]);

  const maxCategory = () => {
    if (!analytics) return 'none';
    const { transport, diet, energy } = analytics.categoryBreakdown;
    if (transport >= diet && transport >= energy) return 'transport';
    if (diet >= transport && diet >= energy) return 'diet';
    return 'energy';
  };

  const highestSector = maxCategory();

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      <Head>
        <title>Dashboard - EcoTrace Carbon Platform</title>
      </Head>

      {/* Navigation Header */}
      <header style={{
        borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--color-bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)' }}>🌿 EcoTrace</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={toggleTheme} className="btn btn-secondary" style={{ minWidth: '44px', padding: '8px' }} aria-label="Toggle Theme">
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Welcome back, Eco Guardian</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Level 4 Tracker</span>
          </div>
        </div>
      </header>

      {error && (
        <div style={{ maxWidth: '1200px', margin: '24px auto', padding: '16px', backgroundColor: 'var(--color-error)', color: 'white', borderRadius: '8px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'var(--color-text-muted)' }}>Analyzing telemetry and calculating carbon balances...</span>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <main className="dashboard-grid" style={{ marginTop: '24px' }}>
          
          {/* Dashboard Left Side: Metrics & Analytics Chart */}
          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Top Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="glass-card">
                <span className="badge badge-green">Total Balance</span>
                <h2 style={{ fontSize: '32px', marginTop: '12px' }}>{analytics?.totalEmissions} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>kg CO2e</span></h2>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>Total carbon footprint logged this period</p>
              </div>

              <div className="glass-card">
                <span className="badge badge-amber">Benchmarking</span>
                <h2 style={{ fontSize: '32px', marginTop: '12px' }}>
                  {analytics && analytics.benchmarks.percentDifference > 0 ? '+' : ''}
                  {analytics ? ((analytics.totalEmissions / 1333.33) * 100).toFixed(1) : 0}%
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>Relative to US Average monthly allowance</p>
              </div>

              <div className="glass-card">
                <span className="badge badge-green">Activities Logged</span>
                <h2 style={{ fontSize: '32px', marginTop: '12px' }}>{analytics?.logsCount}</h2>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>Distinct habits tracked successfully</p>
              </div>
            </div>

            {/* Emissions Breakdown Chart Display */}
            <div className="glass-card">
              <h3>Emission Category Breakdowns (kg CO2e)</h3>
              <div style={{ display: 'flex', gap: '24px', marginTop: '24px', alignItems: 'center' }}>
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>🚗 Transportation</span>
                      <span style={{ fontWeight: 'bold' }}>{analytics?.categoryBreakdown.transport} kg</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '4px' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, ((analytics?.categoryBreakdown.transport || 0) / (analytics?.totalEmissions || 1)) * 100)}%`, backgroundColor: 'var(--color-primary)', borderRadius: '4px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>⚡ Home Energy</span>
                      <span style={{ fontWeight: 'bold' }}>{analytics?.categoryBreakdown.energy} kg</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '4px' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, ((analytics?.categoryBreakdown.energy || 0) / (analytics?.totalEmissions || 1)) * 100)}%`, backgroundColor: '#F59E0B', borderRadius: '4px' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span>🍔 Diet & Consumption</span>
                      <span style={{ fontWeight: 'bold' }}>{analytics?.categoryBreakdown.diet} kg</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '4px' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, ((analytics?.categoryBreakdown.diet || 0) / (analytics?.totalEmissions || 1)) * 100)}%`, backgroundColor: '#EF4444', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Recommendations Nudge Panel */}
            <div className="glass-card" style={{ borderLeft: '5px solid var(--color-primary)' }}>
              <span className="badge badge-green">AI recommendation nudge</span>
              <h3 style={{ marginTop: '12px' }}>Personalized Carbon Mitigation Suggestion</h3>
              {highestSector === 'transport' && (
                <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                  Your transportation emissions constitute the largest share of your carbon footprint.
                  <strong> Tip:</strong> Switching to public transport or mapping hybrid journeys this week can save up to 45% of your carbon emissions.
                </p>
              )}
              {highestSector === 'diet' && (
                <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                  Your diet emissions are your highest contributor.
                  <strong> Tip:</strong> Committing to vegan/vegetarian meals for just three days this week can decrease your diet footprint by 32%.
                </p>
              )}
              {highestSector === 'energy' && (
                <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                  Home electrical usage is driving your emissions.
                  <strong> Tip:</strong> Unplugging vampire appliances (stands, consoles) and adjusting thermostats by 1 degree offsets heating footprint by 10%.
                </p>
              )}
            </div>

            {/* Activity History Logs */}
            <div className="glass-card">
              <h3>Recent Tracking Log</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(16,185,129,0.1)', color: 'var(--color-text-muted)', fontSize: '12px', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px' }}>Date</th>
                    <th style={{ padding: '12px 8px' }}>Category</th>
                    <th style={{ padding: '12px 8px' }}>Sub-Category</th>
                    <th style={{ padding: '12px 8px' }}>Logged Value</th>
                    <th style={{ padding: '12px 8px' }}>Calculated CO2e</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 5).map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(16,185,129,0.05)', fontSize: '14px' }}>
                      <td style={{ padding: '12px 8px' }}>{log.date}</td>
                      <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{log.category}</td>
                      <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{log.subCategory.replace('_', ' ')}</td>
                      <td style={{ padding: '12px 8px' }}>{log.value}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{log.emissions} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Dashboard Right Side: Logging Form & Goal Tracker */}
          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Quick Logging Card */}
            <div className="glass-card">
              <h3>Quick-Log Activity</h3>
              <form onSubmit={handleAddLog} style={{ marginTop: '20px' }}>
                
                <div className="form-group">
                  <label htmlFor="category-select">Emissions Sector</label>
                  <select 
                    id="category-select"
                    className="form-input" 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value as any)}
                  >
                    <option value="transport">🚗 Transport & Logistics</option>
                    <option value="diet">🍔 Diet & Food Intake</option>
                    <option value="energy">⚡ Home Energy Utility</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="sub-category-select">Subcategory / Activity Type</label>
                  <select 
                    id="sub-category-select"
                    className="form-input" 
                    value={subCategory} 
                    onChange={(e) => setSubCategory(e.target.value)}
                  >
                    {category === 'transport' && (
                      <>
                        <option value="gasoline_car">Gasoline Car (km)</option>
                        <option value="diesel_car">Diesel Car (km)</option>
                        <option value="electric_car">Electric Car (km)</option>
                        <option value="bus">Public Bus (km)</option>
                        <option value="train">Train Transit (km)</option>
                        <option value="flight_short">Short Haul Flight (km)</option>
                      </>
                    )}
                    {category === 'diet' && (
                      <>
                        <option value="vegan">Vegan Diet (days)</option>
                        <option value="vegetarian">Vegetarian Diet (days)</option>
                        <option value="pescatarian">Pescatarian Diet (days)</option>
                        <option value="low_meat">Low Meat Diet (days)</option>
                        <option value="high_meat">High Meat Diet (days)</option>
                      </>
                    )}
                    {category === 'energy' && (
                      <>
                        <option value="us_average">US Grid Average (kWh)</option>
                        <option value="clean_mix">Renewable Energy Mix (kWh)</option>
                        <option value="coal_heavy">Coal Dominated Power (kWh)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="value-input">
                    {category === 'transport' && 'Distance Traveled (Kilometers)'}
                    {category === 'diet' && 'Duration (Days logged)'}
                    {category === 'energy' && 'Electricity Consumed (kWh)'}
                  </label>
                  <input 
                    id="value-input"
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 24" 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)}
                    required 
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date-input">Date of Activity</label>
                  <input 
                    id="date-input"
                    type="date" 
                    className="form-input" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    required 
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Calculating footprint...' : 'Log & Calculate Carbon'}
                </button>
              </form>
            </div>

            {/* Carbon Reduction Goals */}
            <div className="glass-card">
              <h3>My Reduction Goals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                {goals.map((goal) => (
                  <div key={goal.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.1)', backgroundColor: 'rgba(16,185,129,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', textTransform: 'capitalize', fontSize: '14px' }}>{goal.category} Target</span>
                      <span className="badge badge-amber">-{goal.targetReductionPercent}% Goal</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                      Limit emissions below <strong>{goal.targetEmissionsLimit} kg CO2e</strong> by {goal.endDate}
                    </p>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={goal.completed} 
                        onChange={() => handleToggleGoal(goal.id, goal.completed)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      I met this reduction target
                    </label>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </main>
      )}
    </div>
  );
}
