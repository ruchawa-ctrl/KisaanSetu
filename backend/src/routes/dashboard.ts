import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

type GovernmentPriceRecord = Record<string, unknown>;
const dataGovResource = process.env.DATA_GOV_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070';
const valueFrom = (record: GovernmentPriceRecord, keys: string[]) => keys.map((key) => record[key] ?? record[key.toUpperCase()]).find((value) => value !== undefined && value !== null && value !== '');
const numberFrom = (record: GovernmentPriceRecord, keys: string[]) => Number(String(valueFrom(record, keys) ?? '0').replace(/,/g, '')) || 0;
const dateFrom = (value: unknown) => {
  const raw = String(value || '');
  const match = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  return match ? new Date(`${match[3]}-${match[2]}-${match[1]}T00:00:00.000Z`) : new Date(raw || Date.now());
};
const fetchLivePrices = async () => {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) return null;
  const url = new URL(`https://api.data.gov.in/resource/${dataGovResource}`);
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '60');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`data.gov.in returned ${response.status}`);
  const payload = await response.json() as { records?: GovernmentPriceRecord[] };
  const prices = (payload.records || []).map((record) => {
    const state = String(valueFrom(record, ['state', 'State']) || 'India');
    const market = String(valueFrom(record, ['market', 'Market']) || 'Unknown market');
    return {
      mandiName: `${market}, ${state}`,
      cropName: String(valueFrom(record, ['commodity', 'Commodity']) || 'Unknown crop'),
      modalPrice: numberFrom(record, ['modal_price', 'Modal Price', 'modal']),
      minPrice: numberFrom(record, ['min_price', 'Min Price', 'min']),
      maxPrice: numberFrom(record, ['max_price', 'Max Price', 'max']),
      arrivalVolumeTonnes: numberFrom(record, ['arrival_volume_tonnes', 'arrival_volume', 'arrivals']),
      recordedDate: dateFrom(valueFrom(record, ['arrival_date', 'Arrival Date', 'reported_date'])),
    };
  }).filter((price) => price.modalPrice > 0 && price.minPrice > 0 && price.maxPrice > 0);
  return prices.length ? prices : null;
};

router.get('/prices', requireAuth, async (_req, res, next) => {
  try {
    try {
      const livePrices = await fetchLivePrices();
      if (livePrices) {
        res.setHeader('X-Price-Source', 'data.gov.in');
        return res.json(livePrices);
      }
    } catch (error) {
      console.warn('Live mandi price feed unavailable:', error instanceof Error ? error.message : error);
    }
    const prices = await prisma.mandiPriceHistory.findMany({
      orderBy: { recordedDate: 'desc' },
      take: 60,
    });
    res.setHeader('X-Price-Source', 'local-seed-fallback');
    res.json(prices);
  } catch (error) {
    next(error);
  }
});

router.get('/activity', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [lots, demands, transactions, offers, openDemands] = await Promise.all([
      prisma.cropLot.findMany({
        where: { farmerId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 25,
        select: { id: true, cropName: true, variety: true, weightKg: true, qualityGrade: true, status: true, basePrice: true, createdAt: true },
      }),
      prisma.buyerDemand.findMany({
        where: { buyerId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 25,
        select: { id: true, cropName: true, requiredQuantityKg: true, maxPrice: true, status: true, createdAt: true },
      }),
      prisma.transaction.findMany({
        where: { OR: [{ buyerId: req.user!.id }, { lot: { farmerId: req.user!.id } }] },
        orderBy: { createdAt: 'desc' },
        take: 25,
        select: { id: true, agreedPrice: true, totalAmount: true, escrowStatus: true, createdAt: true, lot: { select: { cropName: true, weightKg: true } } },
      }),
      prisma.demandOffer.findMany({
        where: req.user!.role === 'BUYER' ? { demand: { buyerId: req.user!.id } } : { farmerId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: { demand: { select: { id: true, cropName: true, requiredQuantityKg: true, maxPrice: true, status: true, destinationPincode: true } }, farmer: { select: { name: true, phone: true, verificationStatus: true, rating: true } }, lot: { select: { id: true, cropName: true, variety: true, weightKg: true, basePrice: true, qualityGrade: true, status: true } } },
      }),
      req.user!.role === 'FARMER' || req.user!.role === 'FPO_LEADER' ? prisma.buyerDemand.findMany({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' }, take: 25, select: { id: true, cropName: true, targetGrade: true, requiredQuantityKg: true, maxPrice: true, destinationPincode: true, createdAt: true, buyer: { select: { name: true, verificationStatus: true } } } }) : Promise.resolve([]),
    ]);
    res.json({ lots, demands, transactions, offers, openDemands });
  } catch (error) {
    next(error);
  }
});

export default router;
