import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  try {
    // 1. Insert or Update Rio Blanco
    const existingOGRB = await db.select().from(schema.gyms).where(eq(schema.gyms.codePrefix, 'OGRB'));
    if (existingOGRB.length === 0) {
      const existingRB = await db.select().from(schema.gyms).where(eq(schema.gyms.codePrefix, 'RB'));
      if (existingRB.length > 0) {
        await db.update(schema.gyms).set({ codePrefix: 'OGRB' }).where(eq(schema.gyms.id, existingRB[0].id));
        console.log('Actualizado prefijo de Río Blanco a OGRB');
      } else {
        const [gym] = await db.insert(schema.gyms).values({
          name: 'Aquarius Gym - Río Blanco',
          codePrefix: 'OGRB',
          address: 'Río Blanco',
          pricingMonthly: '150.00',
          pricingQuarterly: '400.00',
          pricingAnnual: '1500.00',
          pricingGroupDefault: '100.00',
        }).returning();
        console.log('Sede creada:', gym.name);
      }
    } else {
      console.log('La sede Río Blanco ya existe.');
    }

    // 2. Insert Sibilia if not exists
    const existingSB = await db.select().from(schema.gyms).where(eq(schema.gyms.codePrefix, 'OGSB'));
    if (existingSB.length === 0) {
      const [gym] = await db.insert(schema.gyms).values({
        name: 'Aquarius Gym - Sibilia',
        codePrefix: 'OGSB',
        address: 'Sibilia, Quetzaltenango',
        pricingMonthly: '150.00',
        pricingQuarterly: '400.00',
        pricingAnnual: '1500.00',
        pricingGroupDefault: '100.00',
      }).returning();
      console.log('Sede creada:', gym.name);
    } else {
      console.log('La sede Sibilia ya existe.');
    }

  } catch (error) {
    console.error('Error insertando sedes:', error);
  } finally {
    process.exit(0);
  }
}

seed();
