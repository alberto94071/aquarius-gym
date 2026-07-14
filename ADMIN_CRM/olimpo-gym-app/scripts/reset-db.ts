/**
 * RESETEO TOTAL DE LA BASE DE DATOS — Aquarius Gym
 *
 * Borra TODOS los datos (miembros, grupos, pagos, anuncios, rutinas, etc.),
 * crea las 3 sedes nuevas (Tacaná, Cuilco, San Marcos) y recrea los usuarios admin.
 *
 * Uso:
 *   npm run db:reset            → pide confirmación
 *   npm run db:reset -- --yes   → sin confirmación
 *
 * Requiere DATABASE_URL en .env.local
 */
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en .env.local');
  process.exit(1);
}

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

const ADMINS = [
  { email: 'admin@aquariusgym.com', name: 'Administrador Aquarius' },
  { email: 'alberto.94071@gmail.com', name: 'Alberto Admin' },
];

// Orden respetando llaves foráneas (los hijos primero); TRUNCATE ... CASCADE
// se encarga del resto por si se agregan tablas nuevas.
const TABLES = [
  'workout_set_logs',
  'workout_sessions',
  'member_routines',
  'routine_exercises',
  'routines',
  'exercises',
  'body_measurements',
  'home_content',
  'member_notifications',
  'push_subscriptions',
  'notifications',
  'announcements',
  'payments',
  'members',
  'groups',
  'system_users',
  'gyms',
];

async function confirm(): Promise<boolean> {
  if (process.argv.includes('--yes')) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(
      '⚠️  Esto BORRA TODOS los datos de la base de datos. Escribe "BORRAR" para continuar: ',
      (answer) => {
        rl.close();
        resolve(answer.trim() === 'BORRAR');
      }
    );
  });
}

async function reset() {
  try {
    const ok = await confirm();
    if (!ok) {
      console.log('Cancelado. No se borró nada.');
      process.exit(0);
    }

    // Asegurar que el rol genérico "secretaria" exista en el enum
    // (no puede correr dentro de una transacción)
    await pool.query(`ALTER TYPE "role" ADD VALUE IF NOT EXISTS 'secretaria'`);

    console.log('Vaciando tablas...');
    await pool.query(`TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(', ')} CASCADE`);
    console.log('✓ Todas las tablas vaciadas');

    console.log('Creando sedes...');
    for (const sede of SEDES) {
      const [gym] = await db.insert(schema.gyms).values(sede).returning();
      console.log(`✓ Sede creada: ${gym.name} (${gym.codePrefix})`);
    }

    console.log('Creando usuarios admin...');
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (!initialPassword) {
      console.error('Falta ADMIN_INITIAL_PASSWORD en .env.local (contraseña inicial de los admins)');
      process.exit(1);
    }
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    for (const admin of ADMINS) {
      await db.insert(schema.systemUsers).values({
        email: admin.email,
        name: admin.name,
        role: 'admin',
        active: true,
        password: hashedPassword,
      });
      console.log(`✓ Admin creado: ${admin.email}`);
    }

    console.log('\n✅ Base de datos reseteada. Sedes: Tacaná, Cuilco y San Marcos.');
    console.log('   Recuerda cambiar la contraseña de los admins después de entrar.');
  } catch (error) {
    console.error('Error reseteando la base de datos:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

reset();
