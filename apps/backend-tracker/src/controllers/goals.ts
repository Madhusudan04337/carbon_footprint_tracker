import { Request, Response } from 'express';
import { Database } from '../db';

export class GoalsController {
  public static create(req: Request, res: Response) {
    try {
      const { category, targetReductionPercent, targetEmissionsLimit, startDate, endDate } = req.body;

      if (!category || !targetReductionPercent || !targetEmissionsLimit || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required fields for goal' });
      }

      const percent = Number(targetReductionPercent);
      const limit = Number(targetEmissionsLimit);

      if (isNaN(percent) || percent < 0 || percent > 100 || isNaN(limit) || limit < 0) {
        return res.status(400).json({ error: 'Invalid numeric fields for goal' });
      }

      const newGoal = Database.addGoal({
        category,
        targetReductionPercent: percent,
        targetEmissionsLimit: limit,
        startDate,
        endDate
      });

      return res.status(201).json(newGoal);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  public static list(req: Request, res: Response) {
    try {
      const goals = Database.getGoals();
      return res.json(goals);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  public static updateCompletion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { completed } = req.body;

      if (completed === undefined) {
        return res.status(400).json({ error: 'Missing completed field in body' });
      }

      const updated = Database.updateGoalStatus(id, Boolean(completed));
      if (!updated) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      return res.json(updated);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
}
