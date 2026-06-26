import { useState } from 'react';
import { useLogs } from '../hooks/useTracking.ts';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Analytics() {
  const { data: logs, isLoading: logsLoading } = useLogs();

  const [timeframe, setTimeframe] = useState<'7' | '30' | '365'>('30');
  const [showTableFallback, setShowTableFallback] = useState<boolean>(false);

  if (logsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4" role="status" aria-live="polite">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400">Compiling carbon telemetry and rendering charts...</p>
      </div>
    );
  }

  // Filter logs based on selected timeframe
  const getFilteredLogs = () => {
    if (!logs) return [];
    const limitDate = new Date();
    limitDate.setHours(0, 0, 0, 0);
    limitDate.setDate(limitDate.getDate() - Number(timeframe));
    
    return logs.filter(log => {
      const [year, month, day] = log.date.split('-').map(Number);
      const logDate = new Date(year, month - 1, day);
      return logDate >= limitDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const filteredLogs = getFilteredLogs();

  // 1. Line Chart: Trend emissions
  const lineChartData = {
    labels: filteredLogs.map(log => log.date),
    datasets: [
      {
        label: 'Emissions (kg CO2e)',
        data: filteredLogs.map(log => log.emissions_co2e),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.2,
        fill: true,
        pointStyle: 'circle',
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y} kg CO2e`
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(16, 185, 129, 0.05)'
        },
        ticks: {
          color: '#8B9A93'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#8B9A93'
        }
      }
    }
  };

  // 2. Doughnut Chart: Category distribution
  const transportSum = filteredLogs.filter(l => l.category === 'transport').reduce((a, b) => a + b.emissions_co2e, 0);
  const energySum = filteredLogs.filter(l => l.category === 'energy').reduce((a, b) => a + b.emissions_co2e, 0);
  const dietSum = filteredLogs.filter(l => l.category === 'diet').reduce((a, b) => a + b.emissions_co2e, 0);
  const wasteSum = filteredLogs.filter(l => l.category === 'waste').reduce((a, b) => a + b.emissions_co2e, 0);

  const doughnutChartData = {
    labels: ['Transportation', 'Home Energy', 'Diet & Food', 'Waste & Recycling'],
    datasets: [
      {
        data: [transportSum, energySum, dietSum, wasteSum],
        backgroundColor: ['#0D9488', '#F59E0B', '#EF4444', '#0EA5E9'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#8B9A93',
          font: {
            family: 'Plus Jakarta Sans'
          }
        }
      }
    }
  };

  // 3. CSV Exporter function using Backend
  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/logs/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ecotrace_full_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to export data.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headings text-gray-900 dark:text-white">Carbon Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Deeper historical trends, distribution charts, and exports.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-forest-surface border border-emerald-500/10 p-1.5 rounded-xl flex gap-1 text-sm font-medium" role="group" aria-label="Timeframe filter">
            <button 
              onClick={() => setTimeframe('7')} 
              className={`px-3 py-1.5 rounded-lg transition-colors ${timeframe === '7' ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'}`}
            >
              7 Days
            </button>
            <button 
              onClick={() => setTimeframe('30')} 
              className={`px-3 py-1.5 rounded-lg transition-colors ${timeframe === '30' ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'}`}
            >
              30 Days
            </button>
            <button 
              onClick={() => setTimeframe('365')} 
              className={`px-3 py-1.5 rounded-lg transition-colors ${timeframe === '365' ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'}`}
            >
              Year
            </button>
          </div>

          <button 
            onClick={handleExportCSV}
            className="px-4 py-3 bg-emerald-800 text-white font-bold rounded-xl hover:bg-emerald-800/90 flex items-center gap-2 transition-all"
            aria-label="Export logged data to CSV file"
          >
            📥 Export Data
          </button>
        </div>
      </div>

      {/* Main Charts Row Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Visual Analytics Charts">
        
        {/* Trend line Chart */}
        <div className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 h-96 flex flex-col justify-between">
          <h3 className="text-lg font-headings">Emissions History Trend Line</h3>
          <div className="flex-1 relative mt-4">
            {filteredLogs.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">No activity recorded in this window</div>
            ) : (
              <Line data={lineChartData} options={lineChartOptions} />
            )}
          </div>
        </div>

        {/* Doughnut breakdown chart */}
        <div className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10 h-96 flex flex-col justify-between">
          <h3 className="text-lg font-headings">Sector Footprint Allocation</h3>
          <div className="flex-1 relative mt-4 max-h-64">
            {filteredLogs.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">No category breakdown available</div>
            ) : (
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            )}
          </div>
        </div>

      </section>

      {/* Accessibility Fallback Option */}
      <section className="space-y-4" aria-labelledby="a11y-heading">
        <div className="flex items-center justify-between">
          <h3 id="a11y-heading" className="text-lg font-headings">Accessibility Equivalents</h3>
          <button 
            onClick={() => setShowTableFallback(!showTableFallback)}
            className="text-emerald-600 dark:text-emerald-400 hover:underline text-sm font-semibold focus:outline-none"
            aria-expanded={showTableFallback}
            aria-controls="a11y-data-table"
          >
            {showTableFallback ? 'Hide Tabular Data Table' : 'Show Screen-Reader Tabular Data Table'}
          </button>
        </div>

        {showTableFallback && (
          <div id="a11y-data-table" className="overflow-x-auto bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10">
            <table className="w-full text-left border-collapse text-sm">
              <caption>Summary Table of Carbon Activity Outputs mapped to the active graphs.</caption>
              <thead>
                <tr className="border-b border-emerald-500/10 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="py-2 px-4">Date</th>
                  <th className="py-2 px-4">Category</th>
                  <th className="py-2 px-4 text-right">Value</th>
                  <th className="py-2 px-4 text-right">Emissions (kg CO2e)</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-emerald-500/5 hover:bg-emerald-500/5">
                    <td className="py-2 px-4">{log.date}</td>
                    <td className="py-2 px-4 capitalize">{log.category}</td>
                    <td className="py-2 px-4 text-right">{log.value}</td>
                    <td className="py-2 px-4 text-right font-bold">{log.emissions_co2e} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Carbon Reduction Achievements Grid */}
      <section className="bg-white dark:bg-forest-surface p-6 rounded-2xl border border-emerald-500/10" aria-labelledby="achievements-heading">
        <h3 id="achievements-heading" className="text-lg font-headings mb-6">Carbon Reduction Achievements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] flex items-center gap-4">
            <span className="text-3xl" role="img" aria-label="Fire emoji">🔥</span>
            <div>
              <h4 className="font-bold text-sm">3 Week Streak</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Logged habits consecutive days</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] flex items-center gap-4">
            <span className="text-3xl" role="img" aria-label="Bicycle emoji">🚲</span>
            <div>
              <h4 className="font-bold text-sm">Transit Master</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Diverted 5 trips to clean rail/bus</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] flex items-center gap-4">
            <span className="text-3xl" role="img" aria-label="Seedling emoji">🌱</span>
            <div>
              <h4 className="font-bold text-sm">Carbon-Neutral Hero</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Footprint below Paris 1.5C target</p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
