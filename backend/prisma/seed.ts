import { PrismaClient, Role, Language, VerificationStatus, QualityGrade, LotStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  await prisma.transaction.deleteMany(); await prisma.buyerDemand.deleteMany(); await prisma.cropLot.deleteMany(); await prisma.fpoCluster.deleteMany(); await prisma.mandiPriceHistory.deleteMany(); await prisma.user.deleteMany();
  const demoPasswordHash = await bcrypt.hash('Kisaan@123', 12);
  const farmer = await prisma.user.create({ data: { name: 'Suresh Patil', phone: '9000000001', passwordHash: demoPasswordHash, role: Role.FARMER, language: Language.MARATHI, verificationStatus: VerificationStatus.VERIFIED, rating: 4.7 } });
  const fpoLeader = await prisma.user.create({ data: { name: 'Savita Agro FPO', phone: '9000000002', role: Role.FPO_LEADER, language: Language.MARATHI, verificationStatus: VerificationStatus.VERIFIED, rating: 4.9 } });
  await prisma.user.create({ data: { name: 'FreshCart Institutional Buyer', phone: '9000000003', passwordHash: demoPasswordHash, role: Role.BUYER, language: Language.ENGLISH, verificationStatus: VerificationStatus.VERIFIED, rating: 4.6 } });
  await prisma.user.create({ data: { name: 'System Admin', phone: '9000000004', role: Role.ADMIN, verificationStatus: VerificationStatus.VERIFIED } });
  const fpo = await prisma.fpoCluster.create({ data: { name: 'Nashik Valley Producers FPO', registrationNumber: 'FPO-MH-2024-019', adminId: fpoLeader.id, district: 'Nashik' } });
  await prisma.cropLot.create({ data: { farmerId: farmer.id, fpoId: fpo.id, cropName: 'Onion', variety: 'Nashik Red', weightKg: 820, basePrice: 2450, qualityGrade: QualityGrade.GRADE_A, sampleImageUrls: [], status: LotStatus.AGGREGATED, harvestDate: new Date('2026-09-05'), latitude: 20.01, longitude: 73.78 } });
  const mandis = [
    { name: 'Nashik, Maharashtra', crop: 'Onion', base: 2450 },
    { name: 'Pune, Maharashtra', crop: 'Onion', base: 2310 },
    { name: 'Latur, Maharashtra', crop: 'Soybean', base: 4720 },
    { name: 'Azadpur, Delhi', crop: 'Tomato', base: 2180 },
    { name: 'Indore, Madhya Pradesh', crop: 'Wheat', base: 2680 },
    { name: 'Bengaluru, Karnataka', crop: 'Maize', base: 2240 },
    { name: 'Guntur, Andhra Pradesh', crop: 'Chilli', base: 8950 },
    { name: 'Kolkata, West Bengal', crop: 'Rice', base: 3420 },
    { name: 'Jaipur, Rajasthan', crop: 'Mustard', base: 5680 },
    { name: 'Lucknow, Uttar Pradesh', crop: 'Potato', base: 1860 },
  ];
  for (const mandi of mandis) for (let day = 0; day < 14; day++) await prisma.mandiPriceHistory.create({ data: { mandiName: mandi.name, cropName: mandi.crop, arrivalVolumeTonnes: 120 + day * 4, minPrice: mandi.base - 250 + day * 3, maxPrice: mandi.base + 180 + day * 4, modalPrice: mandi.base + day * 5, recordedDate: new Date(Date.now() - (13 - day) * 86400000) } });
}
main().finally(() => prisma.$disconnect());
