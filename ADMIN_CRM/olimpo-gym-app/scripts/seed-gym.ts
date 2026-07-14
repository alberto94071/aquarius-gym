import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const SEDES = [
  {
    name: 'Aquarius Gym - Tacaná',
    codePrefix: 'AGTC',
    address: 'Tacaná, San Marcos',
    pricingMonthly: '150.00',
    pricingQuarterly: '400.00',
    pricingAnnual: '1500.00',
    pricingGroupDefault: '100.00',
  },
  {
    name: 'Aquarius Gym - Cuilco',
    codePrefix: 'AGCU',
    address: 'Cuilco, Huehuetenango',
    pricingMonthly: '150.00',
    pricingQuarterly: '400.00',
    pricingAnnual: '1500.00',
    pricingGroupDefault: '100.00',
  },
  {
    name: 'Aquarius Gym - San Marcos',
    codePrefix: 'AGSM',
    address: 'San Marcos, San Marcos',
    pricingMonthly: '150.00',
    pricingQuarterly: '400.00',
    pricingAnnual: '1500.00',
    pricingGroupDefault: '100.00',
  },
];

async function seed() {
  try {
    for (const sede of SEDES) {
      const existing = await db
        .select()
        .from(schema.gyms)
        .where(eq(schema.gyms.codePrefix, sede.codePrefix));

      if (existing.length === 0) {
        const [gym] = await db.insert(schema.gyms).values(sede).returning();
        console.log('Sede creada:', gym.name, `(${gym.codePrefix})`);
      } else {
        console.log(`La sede ${sede.name} ya existe.`);
      }
    }
  } catch (error) {
    console.error('Error insertando sedes:', error);
  } finally {
    process.exit(0);
  }
}

seed();
