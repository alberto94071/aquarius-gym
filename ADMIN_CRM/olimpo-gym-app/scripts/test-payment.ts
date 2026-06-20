import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually to bypass any module loading/hoisting order issues
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2].trim();
          // Remove wrapping quotes if present
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {
  console.error("Failed to parse env file manually:", e);
}

async function main() {
  const { db } = await import('../src/db');
  const { members } = await import('../src/db/schema');
  const { registerPayment } = await import('../src/actions/payments');
  const { eq } = await import('drizzle-orm');

  console.log("=== TESTING REGISTER PAYMENT ===");

  // Find the member "prueba 2"
  const [member] = await db.select().from(members).where(eq(members.name, "prueba 2"));
  if (!member) {
    console.error("Member 'prueba 2' not found in database!");
    return;
  }

  console.log(`Found member: ${member.name} (${member.id})`);
  console.log(`Current membershipEnd: ${member.membershipEnd}, status: ${member.status}`);

  // Simulate registerPayment
  try {
    const result = await registerPayment({
      memberId: member.id,
      paymentType: "mensualidad",
      paymentMonth: "2026-04",
      amount: "150.00",
      paymentMethod: "efectivo",
      notes: "Test manual payment",
      forceConfirm: true
    });
    console.log("Payment registered successfully!", result);
  } catch (error) {
    console.error("Error during registerPayment:", error);
  }
}

main().catch(console.error);
