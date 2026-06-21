import React, { useState, useEffect } from 'react';
import { useAddLog } from '../hooks/useTracking.ts';

export default function Calculator() {
  const addLogMutation = useAddLog();

  const [category, setCategory] = useState<'transport' | 'diet' | 'energy' | 'waste'>('transport');
  const [subCategory, setSubCategory] = useState<string>('car');
  const [value, setValue] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [success, setSuccess] = useState<boolean>(false);

  // Sync subcategories on category shifts
  useEffect(() => {
    if (category === 'transport') {
      setSubCategory('car');
    } else if (category === 'diet') {
      setSubCategory('vegan');
    } else if (category === 'energy') {
      setSubCategory('electricity');
    } else if (category === 'waste') {
      setSubCategory('landfill');
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || isNaN(Number(value))) return;

    addLogMutation.mutate(
      {
        category,
        sub_category: subCategory,
        value: Number(value),
        date
      },
      {
        onSuccess: () => {
          setValue('');
          setSuccess(true);
          setTimeout(() => setSuccess(false), 4000);
        }
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-headings text-gray-900 dark:text-white">Calculate Footprint</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Log your transit, utility bills, and food habits to compute impact.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-600 rounded-md" role="alert">
          Activity logged successfully. Emissions calculation updated on Dashboard!
        </div>
      )}

      {addLogMutation.isError && (
        <div className="p-4 bg-red-500/10 border-l-4 border-red-500 text-red-600 rounded-md" role="alert">
          Error: {addLogMutation.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-forest-surface p-8 rounded-2xl border border-emerald-500/10 shadow-sm space-y-6">
        
        <div>
          <label htmlFor="category" className="block text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">Emissions Sector</label>
          <select 
            id="category"
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-emerald-500/20 bg-transparent text-sm focus:border-emerald-500 focus:outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
          >
            <option value="transport" className="dark:bg-forest-surface">🚗 Transportation</option>
            <option value="diet" className="dark:bg-forest-surface">🍔 Food & Diet</option>
            <option value="energy" className="dark:bg-forest-surface">⚡ Home Utility Energy</option>
            <option value="waste" className="dark:bg-forest-surface">🗑️ Waste & Recycling</option>
          </select>
        </div>

        <div>
          <label htmlFor="subcategory" className="block text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">Subcategory / Activity Type</label>
          <select 
            id="subcategory"
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-emerald-500/20 bg-transparent text-sm focus:border-emerald-500 focus:outline-none"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
          >
            {category === 'transport' && (
              <>
                <option value="car" className="dark:bg-forest-surface">Car Travel (km)</option>
                <option value="bike" className="dark:bg-forest-surface">Bicycle Travel (km)</option>
                <option value="bus" className="dark:bg-forest-surface">Transit Bus (km)</option>
                <option value="train" className="dark:bg-forest-surface">Train Transit (km)</option>
                <option value="flight" className="dark:bg-forest-surface">Commercial Flight (km)</option>
              </>
            )}
            {category === 'diet' && (
              <>
                <option value="vegan" className="dark:bg-forest-surface">Vegan Diet (days)</option>
                <option value="vegetarian" className="dark:bg-forest-surface">Vegetarian Diet (days)</option>
                <option value="mixed_diet" className="dark:bg-forest-surface">Mixed Diet (days)</option>
                <option value="meat_heavy" className="dark:bg-forest-surface">Meat-Heavy Diet (days)</option>
              </>
            )}
            {category === 'energy' && (
              <>
                <option value="electricity" className="dark:bg-forest-surface">Grid Electricity (kWh)</option>
                <option value="lpg" className="dark:bg-forest-surface">Liquefied Petroleum Gas (Liters)</option>
                <option value="natural_gas" className="dark:bg-forest-surface">Natural Gas (m³)</option>
              </>
            )}
            {category === 'waste' && (
              <>
                <option value="recycling" className="dark:bg-forest-surface">Recycling (kg)</option>
                <option value="landfill" className="dark:bg-forest-surface">Landfill Waste (kg)</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label htmlFor="value" className="block text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">
            {category === 'transport' && 'Distance Traveled (km)'}
            {category === 'diet' && 'Logging Interval (days)'}
            {category === 'energy' && 'Consumption Metric'}
            {category === 'waste' && 'Waste Amount (kg)'}
          </label>
          <input 
            id="value"
            type="number"
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-emerald-500/20 bg-transparent text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="e.g. 50"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            min="0"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">Logging Date</label>
          <input 
            id="date"
            type="date"
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-emerald-500/20 bg-transparent text-sm focus:border-emerald-500 focus:outline-none"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit"
          className="w-full p-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all disabled:opacity-50"
          disabled={addLogMutation.isPending}
        >
          {addLogMutation.isPending ? 'Logging activity...' : 'Log & Calculate Carbon Footprint'}
        </button>

      </form>
    </div>
  );
}
