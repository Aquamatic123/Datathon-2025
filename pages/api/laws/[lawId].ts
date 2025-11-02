import { NextApiRequest, NextApiResponse } from 'next';
import {
  getLawById,
  createLaw,
  updateLaw,
  deleteLaw,
  addStockToLaw,
  updateStockInLaw,
  removeStockFromLaw
} from '@/lib/database';
import { Law, StockImpacted } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query, body } = req;
  const { lawId } = query;
  const { ticker } = query;

  if (!lawId || typeof lawId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid lawId parameter' });
  }

  try {
    switch (method) {
      case 'GET':
        // Get specific law
        const fetchedLaw = await getLawById(lawId);
        if (!fetchedLaw) {
          return res.status(404).json({ error: 'Law not found' });
        }
        return res.status(200).json(fetchedLaw);

      case 'POST':
        if (ticker && typeof ticker === 'string') {
          // Add stock to law
          const stock = body as StockImpacted;
          const updatedLaw = await addStockToLaw(lawId, stock);
          if (!updatedLaw) {
            return res.status(404).json({ error: 'Law not found' });
          }
          return res.status(200).json(updatedLaw);
        }
        // Create new law
        const newLawData = body as Law;
        const createdLaw = await createLaw(lawId, newLawData);
        return res.status(201).json(createdLaw);

      case 'PUT':
        if (ticker && typeof ticker === 'string') {
          // Update stock in law
          const updates = body as Partial<StockImpacted>;
          const updatedLaw = await updateStockInLaw(lawId, ticker, updates);
          if (!updatedLaw) {
            return res.status(404).json({ error: 'Law or stock not found' });
          }
          return res.status(200).json(updatedLaw);
        } else {
          // Update law
          const updates = body as Partial<Law>;
          const updatedLaw = await updateLaw(lawId, updates);
          if (!updatedLaw) {
            return res.status(404).json({ error: 'Law not found' });
          }
          return res.status(200).json(updatedLaw);
        }

      case 'DELETE':
        if (ticker && typeof ticker === 'string') {
          // Remove stock from law
          const updatedLaw = await removeStockFromLaw(lawId, ticker);
          if (!updatedLaw) {
            return res.status(404).json({ error: 'Law or stock not found' });
          }
          return res.status(200).json(updatedLaw);
        } else {
          // Delete law
          const deleted = await deleteLaw(lawId);
          if (!deleted) {
            return res.status(404).json({ error: 'Law not found' });
          }
          return res.status(200).json({ success: true });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

