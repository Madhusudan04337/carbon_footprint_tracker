import { Request, Response } from 'express';
import { Database } from '../db';
import {
  calculateTransportEmissions,
  calculateDietEmissions,
  calculateEnergyEmissions,
  TransportMode,
  DietType
} from '@ecotrace/formulas';

export class LogsController {
  public static create(req: Request, res: Response) {
    try {
      const { category, subCategory, value, date } = req.body;

      if (!category || !subCategory || value === undefined || !date) {
        return res.status(400).json({ error: 'Missing required fields: category, subCategory, value, date' });
      }

      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) {
        return res.status(400).json({ error: 'Value must be a non-negative number' });
      }

      let emissions = 0;

      switch (category) {
        case 'transport':
          emissions = calculateTransportEmissions(numValue, subCategory as TransportMode);
          break;
        case 'diet':
          emissions = calculateDietEmissions(subCategory as DietType, numValue);
          break;
        case 'energy':
          emissions = calculateEnergyEmissions(numValue);
          break;
        default:
          return res.status(400).json({ error: `Invalid category: ${category}` });
      }

      const newLog = Database.addLog({
        category,
        subCategory,
        value: numValue,
        emissions,
        date
      });

      return res.status(201).json(newLog);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  public static list(req: Request, res: Response) {
    try {
      const logs = Database.getLogs();
      return res.json(logs);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
}
