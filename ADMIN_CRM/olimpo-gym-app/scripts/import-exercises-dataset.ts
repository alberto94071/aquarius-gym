/**
 * import-exercises-dataset.ts
 *
 * Importa el banco de 1,324 ejercicios de scripts/data/exercises-dataset.json
 * (derivado de github.com/alberto94071/exercises-dataset, fork de
 * hasaneyldrm/exercises-dataset) como ejercicios GLOBALES (gymId null,
 * visibles en las 3 sedes).
 *
 * Imágenes y GIFs se sirven directo desde raw.githubusercontent.com del
 * fork — no ocupan espacio ni ancho de banda de este proyecto.
 *
 * Es aditivo e idempotente: omite cualquier ejercicio cuyo nombre ya exista
 * en el banco global, así que no duplica los que ya sembró seed-exercises.ts.
 *
 * Uso:  npx tsx scripts/import-exercises-dataset.ts
 */

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";
import { isNull } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

interface SeedExercise {
  name: string;
  muscleGroup: "pecho" | "espalda" | "hombros" | "biceps" | "triceps" | "piernas" | "gluteos" | "core" | "cardio" | "full_body";
  notes: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
}

async function main() {
  const dataPath = path.join(__dirname, "data", "exercises-dataset.json");
  const data: SeedExercise[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(`Cargando ${data.length} ejercicios del dataset...`);

  const existing = await db
    .select({ name: schema.exercises.name })
    .from(schema.exercises)
    .where(isNull(schema.exercises.gymId));
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));

  const toInsert = data.filter((e) => !existingNames.has(e.name.toLowerCase()));
  console.log(`Ya existían: ${data.length - toInsert.length} · Nuevos a insertar: ${toInsert.length}`);

  const CHUNK = 200;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    await db.insert(schema.exercises).values(
      chunk.map((e) => ({
        gymId: null,
        name: e.name,
        muscleGroup: e.muscleGroup,
        defaultSets: "3 x 10-12",
        defaultRest: "2 min",
        notes: e.notes,
        imageUrl: e.imageUrl,
        videoUrl: e.videoUrl,
        createdBy: null,
      }))
    );
    inserted += chunk.length;
    console.log(`  ${inserted}/${toInsert.length}`);
  }

  console.log(`\n✅ Importación completa: ${inserted} ejercicios nuevos agregados al banco global.`);
}

main()
  .catch((e) => {
    console.error("Error importando ejercicios:", e);
    process.exit(1);
  })
  .finally(() => pool.end());
