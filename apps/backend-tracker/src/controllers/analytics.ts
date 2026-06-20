import { Request, Response } from 'express';
import { Database } from '../db';

export class AnalyticsController {
  public static getSummary(req: Request, res: Response) {
    try {
      const logs = Database.getLogs();

      let totalEmissions = 0;
      let transportEmissions = 0;
      let dietEmissions = 0;
      let energyEmissions = 0;

      logs.forEach(log => {
        totalEmissions += log.emissions;
        if (log.category === 'transport') {
          transportEmissions += log.emissions;
        } else if (log.category === 'diet') {
          dietEmissions += log.emissions;
        } else if (log.category === 'energy') {
          energyEmissions += log.emissions;
        }
      });

      // Simple baseline standard comparison: US average is ~16 metric tons/year = ~1333 kg/month
      const benchmarkComparison = {
        userMonthlyAverage: Number((totalEmissions).toFixed(2)),
        nationalMonthlyAverage: 1333.33,
        percentDifference: Number((((totalEmissions - 1333.33) / 1333.33) * 100).toFixed(1))
      };

      return res.json({
        totalEmissions: Number(totalEmissions.toFixed(2)),
        categoryBreakdown: {
          transport: Number(transportEmissions.toFixed(2)),
          diet: Number(dietEmissions.toFixed(2)),
          energy: Number(energyEmissions.toFixed(2))
        },
        benchmarks: benchmarkComparison,
        logsCount: logs.length
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
}
