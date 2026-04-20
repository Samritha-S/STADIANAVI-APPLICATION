import { PrismaClient } from '@prisma/client';
import { getStadiumHeightAt } from '../src/lib/stadiumUtils';

const prisma = new PrismaClient();

/**
 * SEED SCRIPT: Seat Anchor & Coordinate Mapping
 * This script populates the 'Seat' table with exact (x, y, z) coordinates.
 * These anchors act as the "Source of Truth" to prevent Hero Fans from 
 * snapping to (0,0,0) center pitch during state syncs.
 */
async function main() {
  console.log('--- Starting Wankhede Seat Anchor Seeding ---');

  // Definitions for Wankhede Seat Mapping (simplified for seeding)
  const stands = ['Garware', 'North', 'Grandstand', 'MCA', 'Vitthal', 'Divecha', 'Vijay', 'Sunil'];
  const radii = [65, 85, 105]; // Three main tiers
  const seatsPerRow = 12;

  const seatsToCreate = [];

  for (let sIdx = 0; sIdx < stands.length; sIdx++) {
    const standName = stands[sIdx];
    const thetaBase = (sIdx * Math.PI) / 4;

    for (const r of radii) {
      const tier = r === 65 ? 'Lower' : r === 85 ? 'Mezzanine' : 'Upper';
      
      for (let i = 0; i < seatsPerRow; i++) {
        // Distribute seats across a 30-degree arc per stand
        const theta = thetaBase + (i - seatsPerRow / 2) * (Math.PI / 32);
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        const y = getStadiumHeightAt(x, z);
        
        const label = `${standName}-${tier}-${i + 1}`;
        
        seatsToCreate.push({
          label,
          x: parseFloat(x.toFixed(3)),
          y: parseFloat(y.toFixed(3)),
          z: parseFloat(z.toFixed(3)),
          standName,
          reserved: false
        });
      }
    }
  }

  console.log(`Calculated ${seatsToCreate.length} anchor points. Upserting to PostgreSQL...`);

  // Batch upsert to handle high volume
  for (const seat of seatsToCreate) {
    await prisma.seat.upsert({
      where: { label: seat.label },
      update: {},
      create: seat
    });
  }

  console.log('--- Seeding Complete: Seat Anchor Table Grounded ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
