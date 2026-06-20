import fs from 'fs';
import path from 'path';

export interface ActivityLog {
  id: string;
  category: 'transport' | 'diet' | 'energy';
  subCategory: string; // e.g. 'gasoline_car', 'vegan', 'electricity'
  value: number;       // e.g. distance in km, days, or kWh
  emissions: number;   // calculated kg CO2e
  date: string;        // YYYY-MM-DD
  createdAt: string;
}

export interface CarbonGoal {
  id: string;
  category: 'transport' | 'diet' | 'energy' | 'overall';
  targetReductionPercent: number; // e.g. 20
  targetEmissionsLimit: number;   // e.g. 200 kg CO2e
  startDate: string;
  endDate: string;
  completed: boolean;
  createdAt: string;
}

interface DatabaseSchema {
  logs: ActivityLog[];
  goals: CarbonGoal[];
}

const DB_FILE = path.join(__dirname, 'db.json');

const defaultData: DatabaseSchema = {
  logs: [
    // Pre-populate with some historical logs for initial charts visualization
    {
      id: 'log-1',
      category: 'transport',
      subCategory: 'gasoline_car',
      value: 120,
      emissions: 20.4, // 120 * 0.170
      date: '2026-06-15',
      createdAt: new Date().toISOString()
    },
    {
      id: 'log-2',
      category: 'diet',
      subCategory: 'low_meat',
      value: 7,
      emissions: 39.2, // 7 * 5.6
      date: '2026-06-16',
      createdAt: new Date().toISOString()
    },
    {
      id: 'log-3',
      category: 'energy',
      subCategory: 'us_average',
      value: 150,
      emissions: 55.65, // 150 * 0.371
      date: '2026-06-18',
      createdAt: new Date().toISOString()
    }
  ],
  goals: [
    {
      id: 'goal-1',
      category: 'transport',
      targetReductionPercent: 15,
      targetEmissionsLimit: 50,
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      completed: false,
      createdAt: new Date().toISOString()
    }
  ]
};

export class Database {
  private static read(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_FILE)) {
        this.write(defaultData);
        return defaultData;
      }
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading JSON DB, using default data', e);
      return defaultData;
    }
  }

  private static write(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing to JSON DB', e);
    }
  }

  public static getLogs(): ActivityLog[] {
    return this.read().logs;
  }

  public static addLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): ActivityLog {
    const db = this.read();
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    db.logs.push(newLog);
    this.write(db);
    return newLog;
  }

  public static getGoals(): CarbonGoal[] {
    return this.read().goals;
  }

  public static addGoal(goal: Omit<CarbonGoal, 'id' | 'completed' | 'createdAt'>): CarbonGoal {
    const db = this.read();
    const newGoal: CarbonGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      completed: false,
      createdAt: new Date().toISOString()
    };
    db.goals.push(newGoal);
    this.write(db);
    return newGoal;
  }

  public static updateGoalStatus(id: string, completed: boolean): CarbonGoal | null {
    const db = this.read();
    const goalIndex = db.goals.findIndex(g => g.id === id);
    if (goalIndex === -1) return null;
    db.goals[goalIndex].completed = completed;
    this.write(db);
    return db.goals[goalIndex];
  }
}
