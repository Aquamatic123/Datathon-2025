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

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${method} not allowed` });
  }

  try {
    if (query.analytics === 'true') {
      const analytics = await calculateAnalytics();
      return res.status(200).json(analytics);
    } 
    
    if (query.sectors === 'true') {
      const sectors = await getAllSectors();
      return res.status(200).json(sectors || []);
    } 
    
    if (query.history === 'true') {
      const history = await getHistory();
      return res.status(200).json(history || []);
    } 
    
    if (query.sector) {
      const stocks = await getStocksBySector(query.sector as string);
      return res.status(200).json(stocks || []);
    } 
    
    const db = await getAllLaws();
    return res.status(200).json({ DATA: db || {} });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
