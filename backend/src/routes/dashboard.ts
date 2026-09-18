import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/prices', requireAuth, async (_req, res, next) => {
  try {
    const prices = await prisma.mandiPriceHistory.findMany({
      orderBy: { recordedDate: 'desc' },
      take: 60,
    });
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
