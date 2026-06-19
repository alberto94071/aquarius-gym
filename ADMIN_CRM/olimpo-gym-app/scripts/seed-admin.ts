import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../src/db/schema';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admins = [
      { email: 'admin@aquariusgym.com', name: 'Administrador Aquarius' },
      { email: 'alberto.94071@gmail.com', name: 'Alberto Admin' }
    ];

    for (const admin of admins) {
      const existing = await db.query.systemUsers.findFirst({
        where: eq(schema.systemUsers.email, admin.email)
      });

      if (existing) {
        await db.update(schema.systemUsers)
          .set({ password: hashedPassword })
          .where(eq(schema.systemUsers.email, admin.email));
        console.log(`Admin ${admin.email} password updated!`);
      } else {
        await db.insert(schema.systemUsers).values({
          email: admin.email,
          name: admin.name,
          role: 'admin',
          active: true,
          password: hashedPassword,
        });
        console.log(`Admin ${admin.email} inserted!`);
      }
    }
  } catch (error) {
    console.error('Error inserting admin user:', error);
  } finally {
    process.exit(0);
  }
}

seed();
