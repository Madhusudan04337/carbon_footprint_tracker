import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { LogsController } from './controllers/logs';
import { GoalsController } from './controllers/goals';
import { AnalyticsController } from './controllers/analytics';
import { calculateTransportEmissions, TransportMode } from '@ecotrace/formulas';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/logs', LogsController.list);
app.post('/api/logs', LogsController.create);

app.post('/api/tracker/log', (req, res) => {
  const { activityType, amount } = req.body;
  if (!activityType || amount === undefined) {
    return res.status(400).json({ error: 'Missing activityType or amount' });
  }
  const emissions = calculateTransportEmissions(amount, activityType as TransportMode);
  return res.json({ success: true, emissions });
});

app.get('/api/goals', GoalsController.list);
app.post('/api/goals', GoalsController.create);
app.put('/api/goals/:id', GoalsController.updateCompletion);

app.get('/api/analytics', AnalyticsController.getSummary);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EcoTrace Carbon Tracker API!',
    documentation: 'See carbon_footprint_srs.md for specifications'
  });
});

app.listen(PORT, () => {
  console.log(`[EcoTrace Server] running on http://localhost:${PORT}`);
});
