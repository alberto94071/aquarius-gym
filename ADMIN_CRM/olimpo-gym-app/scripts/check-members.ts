import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import * as dotenv from 'dotenv';
import { calculateMemberStatus } from '../src/lib/utils';
import { syncMembersStatus } from '../src/lib/sync';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  console.log("=== DB CONNECTION & MEMBERS CHECK ===");

  console.log("Running syncMembersStatus()...");
  await syncMembersStatus();
  console.log("Sync complete!");

  const membersList = await db.select().from(schema.members);
  console.log(`Total members found: ${membersList.length}`);
  
  for (const m of membersList) {
    const calculated = calculateMemberStatus(m.membershipEnd);
    console.log(`- Member: ${m.name} (${m.code})
      Start: ${m.membershipStart}
      End: ${m.membershipEnd}
      DB Status: ${m.status} (paid: ${m.paid})
      Calculated Status: ${calculated}
    `);
  }
}

main().catch(console.error);
