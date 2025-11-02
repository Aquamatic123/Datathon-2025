import { NextApiRequest, NextApiResponse } from 'next';
import {
  getAllLaws,
  calculateAnalytics,
  getAllSectors,
  getStocksBySector,
  getHistory
} from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;

  try {
    if (method === 'GET') {
      if (query.analytics === 'true') {
        const analytics = await calculateAnalytics();
        return res.status(200).json(analytics);
      } else if (query.sectors === 'true') {
        const sectors = await getAllSectors();
        return res.status(200).json(sectors);
      } else if (query.history === 'true') {
        const history = await getHistory();
        return res.status(200).json(history);
      } else if (query.sector) {
        const stocks = await getStocksBySector(query.sector as string);
        return res.status(200).json(stocks);
      } else {
        const db = await getAllLaws();
        return res.status(200).json(db);
      }
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${method} not allowed` });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

