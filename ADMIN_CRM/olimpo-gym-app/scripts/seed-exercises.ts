/**
 * seed-exercises.ts
 *
 * Seeds the exercise bank and routine templates for Aquarius Gym.
 * Run with:  npx tsx scripts/seed-exercises.ts
 *
 * Uses the free-exercise-db image CDN for reference images.
 */

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";
import { eq, and } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ─── Image Base URL ───────────────────────────────────────────────────────────

const IMG =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// ─── Exercise Definitions ─────────────────────────────────────────────────────

type MuscleGroup =
  | "pecho"
  | "espalda"
  | "hombros"
  | "biceps"
  | "triceps"
  | "piernas"
  | "gluteos"
  | "core"
  | "cardio"
  | "full_body";

interface ExerciseSeed {
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets: string;
  defaultRest: string;
  notes: string;
  imageUrl: string | null;
}

const exercises: ExerciseSeed[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // PECHO
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Press de Banca con Barra",
    muscleGroup: "pecho",
    defaultSets: "4 x 8-10",
    defaultRest: "2-3 min",
    notes:
      "Retrae las escápulas y mantén los pies firmes en el suelo. Baja la barra hasta rozar el pecho y empuja en trayectoria ligeramente arqueada hacia arriba.",
    imageUrl: `${IMG}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
  },
  {
    name: "Press de Banca Inclinado con Mancuernas",
    muscleGroup: "pecho",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Ajusta el banco a 30-45°. Mantén los codos a 75° del torso y baja las mancuernas hasta sentir estiramiento profundo en el pecho antes de empujar.",
    imageUrl: `${IMG}/Incline_Dumbbell_Bench_Press/0.jpg`,
  },
  {
    name: "Press de Banca Declinado con Barra",
    muscleGroup: "pecho",
    defaultSets: "3 x 10-12",
    defaultRest: "2 min",
    notes:
      "Asegura los pies en el banco declinado (15-30°). El descenso controlado activa la porción inferior del pectoral; evita rebotar la barra en el pecho.",
    imageUrl: `${IMG}/Decline_Barbell_Bench_Press/0.jpg`,
  },
  {
    name: "Aperturas con Mancuernas en Banco Plano",
    muscleGroup: "pecho",
    defaultSets: "3 x 12-15",
    defaultRest: "90 seg",
    notes:
      "Con una ligera flexión fija en los codos, abre los brazos describiendo un arco hasta sentir estiramiento en el pecho; regresa apretando el pectoral.",
    imageUrl: `${IMG}/Dumbbell_Flyes/0.jpg`,
  },
  {
    name: "Cruce de Poleas (Cable Crossover)",
    muscleGroup: "pecho",
    defaultSets: "3 x 12-15",
    defaultRest: "60 seg",
    notes:
      "Sitúa las poleas en alto y cruza las manos frente al ombligo con un ligero encorvamiento hacia adelante. Mantén la tensión en el pectoral durante todo el recorrido.",
    imageUrl: `${IMG}/Cable_Crossover/0.jpg`,
  },
  {
    name: "Fondos en Paralelas (Énfasis Pecho)",
    muscleGroup: "pecho",
    defaultSets: "3 x 8-12",
    defaultRest: "2 min",
    notes:
      "Inclina el torso ligeramente hacia adelante y abre los codos para reclutar el pectoral inferior. Desciende hasta que los hombros queden por debajo de los codos.",
    imageUrl: `${IMG}/Chest_Dip/0.jpg`,
  },
  {
    name: "Press en Máquina de Pecho",
    muscleGroup: "pecho",
    defaultSets: "3 x 12-15",
    defaultRest: "90 seg",
    notes:
      "Ajusta el asiento de modo que las manijas queden a la altura del pecho. Empuja de forma controlada sin bloquear los codos; regresa lentamente para máxima tensión.",
    imageUrl: `${IMG}/Chest_Press/0.jpg`,
  },
  {
    name: "Aperturas en Máquina (Pec Deck)",
    muscleGroup: "pecho",
    defaultSets: "3 x 12-15",
    defaultRest: "60 seg",
    notes:
      "Mantén la espalda pegada al respaldo y los codos levemente flexionados. Une los brazos frente al pecho apretando el pectoral en la posición de cierre.",
    imageUrl: `${IMG}/Pec_Deck_Fly/0.jpg`,
  },
  {
    name: "Press de Banca Inclinado con Barra",
    muscleGroup: "pecho",
    defaultSets: "4 x 8-10",
    defaultRest: "2-3 min",
    notes:
      "El agarre debe ser ligeramente más estrecho que en banco plano. Apunta a la clavícula al bajar la barra para enfatizar la porción superior del pectoral.",
    imageUrl: `${IMG}/Incline_Barbell_Bench_Press/0.jpg`,
  },
  {
    name: "Flexiones de Brazos (Push-Up)",
    muscleGroup: "pecho",
    defaultSets: "3 x 15-20",
    defaultRest: "60 seg",
    notes:
      "Mantén el cuerpo en línea recta de cabeza a talones. Baja el pecho hasta casi tocar el suelo y empuja explosivamente sin permitir que la cadera se hunda.",
    imageUrl: `${IMG}/Push-Up/0.jpg`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ESPALDA
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Jalón al Pecho en Polea Alta",
    muscleGroup: "espalda",
    defaultSets: "4 x 10-12",
    defaultRest: "2 min",
    notes:
      "Agarra la barra con las manos separadas al ancho de los hombros. Lleva el pecho hacia la barra deprimiendo las escápulas y activando los dorsales; evita columpiarte.",
    imageUrl: `${IMG}/Wide-Grip_Lat_Pulldown/0.jpg`,
  },
  {
    name: "Remo con Barra",
    muscleGroup: "espalda",
    defaultSets: "4 x 8-10",
    defaultRest: "2-3 min",
    notes:
      "Inclina el torso 45° con la espalda recta y las rodillas ligeramente flexionadas. Tira de la barra hacia el ombligo apretando las escápulas en la posición de contracción.",
    imageUrl: `${IMG}/Barbell_Bent_Over_Row/0.jpg`,
  },
  {
    name: "Remo en Polea Baja (Sentado)",
    muscleGroup: "espalda",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Mantén el torso vertical y estable. Tira del mango hacia el abdomen bajo comprimiendo los omóplatos; extiende los brazos de forma controlada para el estiramiento completo.",
    imageUrl: `${IMG}/Seated_Cable_Rows/0.jpg`,
  },
  {
    name: "Dominadas (Pull-Up)",
    muscleGroup: "espalda",
    defaultSets: "4 x 6-10",
    defaultRest: "2-3 min",
    notes:
      "Cuelga con los brazos completamente extendidos. Inicia el movimiento deprimiendo los hombros, luego dobla los codos hasta que la barbilla supere la barra.",
    imageUrl: `${IMG}/Pullups/0.jpg`,
  },
  {
    name: "Peso Muerto Convencional",
    muscleGroup: "espalda",
    defaultSets: "4 x 5-6",
    defaultRest: "3-4 min",
    notes:
      "Pies a la anchura de las caderas, espalda neutra y barra sobre los metatarsos. Empuja el suelo con los pies mientras extiende caderas y rodillas simultáneamente.",
    imageUrl: `${IMG}/Barbell_Deadlift/0.jpg`,
  },
  {
    name: "Peso Muerto Rumano",
    muscleGroup: "espalda",
    defaultSets: "3 x 10-12",
    defaultRest: "2 min",
    notes:
      "Mantén la barra pegada a los muslos con la espalda plana. Bisagra desde las caderas sintiendo el estiramiento isquiotibial; no redondees la columna lumbar.",
    imageUrl: `${IMG}/Romanian_Deadlift/0.jpg`,
  },
  {
    name: "Jalón al Pecho con Agarre Neutro",
    muscleGroup: "espalda",
    defaultSets: "3 x 12-15",
    defaultRest: "90 seg",
    notes:
      "Con agarre neutro (palmas enfrentadas) activas más el dorsal y minimizas la fatiga del bíceps. Jala hacia el mentón deprimiendo activamente las escápulas.",
    imageUrl: `${IMG}/Lat_Pulldown_-_With_V-Bar/0.jpg`,
  },
  {
    name: "Remo con Mancuerna a Una Mano",
    muscleGroup: "espalda",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Apoya la rodilla y la mano contraria en el banco para sostener el torso. Tira de la mancuerna hacia la cadera girando ligeramente el torso para máxima contracción del dorsal.",
    imageUrl: `${IMG}/One-Arm_Dumbbell_Row/0.jpg`,
  },
  {
    name: "Remo en Máquina (Hammer Strength)",
    muscleGroup: "espalda",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Apoya el pecho en el almohadillado y mantén la cabeza en posición neutra. Tira de los mangos hacia las caderas retrayendo las escápulas; regresa con control.",
    imageUrl: `${IMG}/Hammer_Strength_Row/0.jpg`,
  },
  {
    name: "Hiperextensiones en Banco Romano",
    muscleGroup: "espalda",
    defaultSets: "3 x 12-15",
    defaultRest: "60 seg",
    notes:
      "Fija las caderas en el borde del almohadillado. Baja el torso hasta 90° y sube manteniendo la espalda recta; evita hiperextender la columna al llegar arriba.",
    imageUrl: `${IMG}/Hyperextensions_Back_Extensions/0.jpg`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // HOMBROS
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Press Militar con Barra (De Pie)",
    muscleGroup: "hombros",
    defaultSets: "4 x 8-10",
    defaultRest: "2-3 min",
    notes:
      "Sostén la barra a la altura de la clavícula con las manos ligeramente más anchas que los hombros. Empuja verticalmente sin arquear excesivamente la espalda baja; activa el core.",
    imageUrl: `${IMG}/Barbell_Shoulder_Press/0.jpg`,
  },
  {
    name: "Press con Mancuernas (Sentado)",
    muscleGroup: "hombros",
    defaultSets: "3 x 10-12",
    defaultRest: "2 min",
    notes:
      "Siéntate con la espalda apoyada en un banco a 90°. Sube las mancuernas hasta casi tocar y bájalas hasta que los codos queden ligeramente por debajo de la línea del hombro.",
    imageUrl: `${IMG}/Dumbbell_Shoulder_Press/0.jpg`,
  },
  {
    name: "Elevaciones Laterales con Mancuernas",
    muscleGroup: "hombros",
    defaultSets: "4 x 12-15",
    defaultRest: "60 seg",
    notes:
      "Eleva los brazos hasta la altura del hombro con el codo ligeramente doblado. Inclina levemente las mancuernas como si vaciases agua de una jarra para mayor activación del deltoides medio.",
    imageUrl: `${IMG}/Side_Lateral_Raise/0.jpg`,
  },
  {
    name: "Elevaciones Frontales con Barra",
    muscleGroup: "hombros",
    defaultSets: "3 x 12",
    defaultRest: "60 seg",
    notes:
      "Sujeta la barra con agarre prono. Eleva los brazos al frente hasta la altura de los ojos con los codos casi extendidos y baja lentamente para resistir la gravedad.",
    imageUrl: `${IMG}/Barbell_Front_Raise/0.jpg`,
  },
  {
    name: "Face Pull con Cuerda",
    muscleGroup: "hombros",
    defaultSets: "3 x 15",
    defaultRest: "60 seg",
    notes:
      "Sitúa la polea a la altura de la cara. Tira de la cuerda hacia la nariz separando los extremos y rotando externamente los hombros; es clave para la salud del manguito rotador.",
    imageUrl: `${IMG}/Face_Pull/0.jpg`,
  },
  {
    name: "Encogimientos de Hombros con Barra (Shrugs)",
    muscleGroup: "hombros",
    defaultSets: "4 x 12-15",
    defaultRest: "90 seg",
    notes:
      "Sujeta la barra con agarre prono frente al cuerpo. Eleva los trapecios directamente hacia arriba (no en círculos) y mantén la contracción 1 segundo en el punto más alto.",
    imageUrl: `${IMG}/Barbell_Shrug/0.jpg`,
  },
  {
    name: "Elevaciones Laterales en Polea Baja",
    muscleGroup: "hombros",
    defaultSets: "3 x 12-15",
    defaultRest: "60 seg",
    notes:
      "La polea baja proporciona tensión constante a lo largo de todo el recorrido. Mantén el cuerpo ligeramente inclinado hacia el lado contrario para mayor rango de movimiento.",
    imageUrl: `${IMG}/Cable_Lateral_Raise/0.jpg`,
  },
  {
    name: "Arnold Press con Mancuernas",
    muscleGroup: "hombros",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Inicia con las mancuernas frente al cuerpo y las palmas hacia ti. Gira las palmas hacia afuera mientras empujas hacia arriba; el movimiento rotacional recluta los tres haces del deltoides.",
    imageUrl: `${IMG}/Arnold_Dumbbell_Press/0.jpg`,
  },
  {
    name: "Press en Máquina de Hombros",
    muscleGroup: "hombros",
    defaultSets: "3 x 12-15",
    defaultRest: "90 seg",
    notes:
      "Ajusta el asiento de modo que las manijas estén a la altura de los oídos. Empuja verticalmente sin elevar los trapecios; baja con control para proteger el acromion.",
    imageUrl: `${IMG}/Machine_Shoulder_(Military)_Press/0.jpg`,
  },
  {
    name: "Pájaro (Posterior Shoulder Fly)",
    muscleGroup: "hombros",
    defaultSets: "3 x 12-15",
    defaultRest: "60 seg",
    notes:
      "Inclina el torso 45-90° con la espalda recta. Eleva las mancuernas lateralmente manteniendo los codos ligeramente flexionados; activa el deltoides posterior y los romboides.",
    imageUrl: `${IMG}/Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench/0.jpg`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // BICEPS
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Curl de Bíceps con Barra",
    muscleGroup: "biceps",
    defaultSets: "4 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Mantén los codos fijos a los lados del torso y la espalda recta. Supina completamente las manos al subir y controla el descenso durante 2-3 segundos para máxima tensión excéntrica.",
    imageUrl: `${IMG}/Barbell_Curl/0.jpg`,
  },
  {
    name: "Curl Alternado con Mancuernas",
    muscleGroup: "biceps",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Alterna los brazos supinando la muñeca al subir para reclutar la porción larga del bíceps. Evita balancear el torso usando el impulso del cuerpo.",
    imageUrl: `${IMG}/Dumbbell_Alternate_Bicep_Curl/0.jpg`,
  },
  {
    name: "Curl en Polea Baja con Barra Recta",
    muscleGroup: "biceps",
    defaultSets: "3 x 12-15",
    defaultRest: "60 seg",
    notes:
      "La polea mantiene tensión constante en todo el arco. Mantén los codos pegados al cuerpo y evita ceder hacia atrás; ideal para la congestión muscular.",
    imageUrl: `${IMG}/Cable_Curl/0.jpg`,
  },
  {
    name: "Curl en Banco Scott (Predicador)",
    muscleGroup: "biceps",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "El banco elimina el balanceo. Extiende los brazos hasta casi bloquear (no completamente) y sube manteniendo los codos sobre el almohadillado; enfatiza la porción inferior del bíceps.",
    imageUrl: `${IMG}/Preacher_Curl/0.jpg`,
  },
  {
    name: "Curl Martillo con Mancuernas",
    muscleGroup: "biceps",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Agarre neutro (palmas enfrentadas) durante todo el movimiento. Trabaja el braquial y braquiorradial además del bíceps, aportando volumen y fuerza al brazo.",
    imageUrl: `${IMG}/Hammer_Curls/0.jpg`,
  },
  {
    name: "Curl Concentrado con Mancuerna",
    muscleGroup: "biceps",
    defaultSets: "3 x 12",
    defaultRest: "60 seg",
    notes:
      "Apoya el codo en la cara interna del muslo sentado. Curl completo hasta la contracción máxima, apretando el bíceps en la cima; excelente para el pico del músculo.",
    imageUrl: `${IMG}/Concentration_Curls/0.jpg`,
  },
  {
    name: "Curl Inclinado con Mancuernas",
    muscleGroup: "biceps",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Recostado en banco inclinado a 60°, los brazos cuelgan perpendiculares al suelo para un estiramiento mayor de la porción larga. Sube sin llevar los codos hacia adelante.",
    imageUrl: `${IMG}/Incline_Dumbbell_Curl/0.jpg`,
  },
  {
    name: "Curl con Barra EZ",
    muscleGroup: "biceps",
    defaultSets: "4 x 10-12",
    defaultRest: "90 seg",
    notes:
      "El agarre semi-supino de la barra EZ reduce el estrés en las muñecas. Controla el peso en la fase negativa (3 segundos) para máximo daño muscular y crecimiento.",
    imageUrl: `${IMG}/EZ-Bar_Curl/0.jpg`,
  },
  {
    name: "Curl en Máquina de Bíceps",
    muscleGroup: "biceps",
    defaultSets: "3 x 12-15",
    defaultRest: "60 seg",
    notes:
      "La guía de la máquina aísla perfectamente el bíceps. Ajusta el asiento para que los codos queden al frente; realiza el movimiento completo de extensión a flexión.",
    imageUrl: `${IMG}/Machine_Bicep_Curl/0.jpg`,
  },
  {
    name: "Curl Araña (Spider Curl)",
    muscleGroup: "biceps",
    defaultSets: "3 x 12",
    defaultRest: "60 seg",
    notes:
      "Recuéstate boca abajo en un banco inclinado a 45°. Los brazos cuelgan perpendiculares y el curl se realiza sin poder usar impulso corporal, enfatizando la contracción.",
    imageUrl: `${IMG}/Spider_Curl/0.jpg`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TRICEPS
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Extensión de Tríceps en Polea con Cuerda",
    muscleGroup: "triceps",
    defaultSets: "4 x 12-15",
    defaultRest: "90 seg",
    notes:
      "Mantén los codos fijos a los lados del cuerpo durante todo el movimiento. Al extender los brazos, separa los extremos de la cuerda para máxima activación de la cabeza lateral.",
    imageUrl: `${IMG}/Triceps_Pushdown_-_Rope_Attachment/0.jpg`,
  },
  {
    name: "Press Francés con Barra EZ",
    muscleGroup: "triceps",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Recostado en banco plano con la barra EZ sobre el frente. Baja la barra hacia la frente doblando solo los codos y extiende de vuelta; trabaja especialmente la cabeza larga.",
    imageUrl: `${IMG}/EZ-Bar_Skullcrusher/0.jpg`,
  },
  {
    name: "Fondos en Paralelas (Énfasis Tríceps)",
    muscleGroup: "triceps",
    defaultSets: "3 x 8-12",
    defaultRest: "2 min",
    notes:
      "Mantén el torso vertical y los codos cerca del cuerpo. Desciende hasta 90° de flexión de codo y empuja explosivamente; el torso erguido redirige la carga al tríceps.",
    imageUrl: `${IMG}/Tricep_Dips/0.jpg`,
  },
  {
    name: "Extensión de Tríceps sobre la Cabeza con Mancuerna",
    muscleGroup: "triceps",
    defaultSets: "3 x 12",
    defaultRest: "90 seg",
    notes:
      "Sujeta una mancuerna con ambas manos sobre la cabeza con los codos apuntando al techo. Baja la mancuerna detrás de la nuca doblando los codos y extiende completamente.",
    imageUrl: `${IMG}/Overhead_Triceps_Extension/0.jpg`,
  },
  {
    name: "Extensión de Tríceps en Polea con Barra Recta",
    muscleGroup: "triceps",
    defaultSets: "3 x 12-15",
    defaultRest: "60 seg",
    notes:
      "Agarre prono en la barra recta de la polea alta. Mantén los codos estacionarios y extiende completamente; la barra recta permite cargar más peso que la cuerda.",
    imageUrl: `${IMG}/Triceps_Pushdown/0.jpg`,
  },
  {
    name: "Press de Banca Agarre Cerrado (Close Grip)",
    muscleGroup: "triceps",
    defaultSets: "4 x 8-10",
    defaultRest: "2 min",
    notes:
      "Manos separadas al ancho de los hombros (no demasiado juntas). Baja la barra al pecho manteniendo los codos cerca del torso y empuja activando pectorales y tríceps.",
    imageUrl: `${IMG}/Close-Grip_Barbell_Bench_Press/0.jpg`,
  },
  {
    name: "Extensión de Tríceps sobre la Cabeza en Polea",
    muscleGroup: "triceps",
    defaultSets: "3 x 12-15",
    defaultRest: "90 seg",
    notes:
      "Con la polea detrás y la cuerda en la nuca, extiende los codos hacia adelante y abajo. La posición estira la cabeza larga del tríceps al inicio para mayor reclutamiento.",
    imageUrl: `${IMG}/Cable_Rope_Overhead_Triceps_Extension/0.jpg`,
  },
  {
    name: "Patada de Tríceps con Mancuerna (Kickback)",
    muscleGroup: "triceps",
    defaultSets: "3 x 12-15",
    defaultRest: "60 seg",
    notes:
      "Apoya la mano y rodilla contrarias en el banco con el torso paralelo al suelo. Extiende el codo completamente rotando ligeramente la muñeca; mantén el brazo pegado al tronco.",
    imageUrl: `${IMG}/Tricep_Dumbbell_Kickback/0.jpg`,
  },
  {
    name: "Press de Tríceps en Máquina",
    muscleGroup: "triceps",
    defaultSets: "3 x 12-15",
    defaultRest: "60 seg",
    notes:
      "Ajusta el asiento de modo que los codos queden al frente y a la altura del pecho. Empuja las palancas hacia abajo extendiendo los codos; regresa de forma controlada.",
    imageUrl: `${IMG}/Tricep_Machine_Dips/0.jpg`,
  },
  {
    name: "Diamante (Diamond Push-Up)",
    muscleGroup: "triceps",
    defaultSets: "3 x 12-20",
    defaultRest: "60 seg",
    notes:
      "Forma un triángulo con los pulgares e índices en el suelo. Baja el pecho hacia las manos manteniendo los codos pegados al cuerpo; los tríceps asumen la mayor carga.",
    imageUrl: `${IMG}/Diamond_Pushups/0.jpg`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // PIERNAS (Cuádriceps)
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Sentadilla con Barra (Back Squat)",
    muscleGroup: "piernas",
    defaultSets: "4 x 8-10",
    defaultRest: "3 min",
    notes:
      "Coloca la barra sobre los trapecios medios, pie a la anchura de las caderas y puntas ligeramente hacia afuera. Desciende hasta los muslos paralelos al suelo manteniendo el pecho alto y las rodillas alineadas con los pies.",
    imageUrl: `${IMG}/Barbell_Full_Squat/0.jpg`,
  },
  {
    name: "Prensa de Piernas (Leg Press)",
    muscleGroup: "piernas",
    defaultSets: "4 x 10-12",
    defaultRest: "2 min",
    notes:
      "Coloca los pies a la anchura de los hombros en la plataforma. No bloquees las rodillas al extender; baja la plataforma hasta 90° de flexión sin despegar la espalda baja del respaldo.",
    imageUrl: `${IMG}/Leg_Press/0.jpg`,
  },
  {
    name: "Extensión de Cuádriceps en Máquina",
    muscleGroup: "piernas",
    defaultSets: "3 x 12-15",
    defaultRest: "90 seg",
    notes:
      "Ajusta el rodillo sobre los tobillos y extiende las rodillas hasta casi bloquear. Mantén la contracción 1 segundo en la cima; desciende lentamente para trabajar el cuádriceps en excéntrico.",
    imageUrl: `${IMG}/Leg_Extensions/0.jpg`,
  },
  {
    name: "Zancada con Mancuernas (Lunges)",
    muscleGroup: "piernas",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Da un paso al frente de 60-80 cm. Baja la rodilla trasera hasta casi rozar el suelo manteniendo el torso erguido y la rodilla delantera alineada con el segundo dedo del pie.",
    imageUrl: `${IMG}/Dumbbell_Lunges/0.jpg`,
  },
  {
    name: "Sentadilla Búlgara (Split Squat)",
    muscleGroup: "piernas",
    defaultSets: "3 x 10",
    defaultRest: "2 min",
    notes:
      "Apoya el empeine del pie trasero en un banco. La distancia al banco determina el énfasis: más lejos activa más el glúteo; más cerca, el cuádriceps. Rodilla delantera sin sobrepasar la punta del pie.",
    imageUrl: `${IMG}/Dumbbell_Bulgarian_Split_Squat/0.jpg`,
  },
  {
    name: "Sentadilla Hack con Máquina",
    muscleGroup: "piernas",
    defaultSets: "3 x 10-12",
    defaultRest: "2 min",
    notes:
      "Pies juntos y bajos en la plataforma para mayor énfasis en el cuádriceps. Desciende hasta 90° y sube sin bloquear las rodillas; la máquina estabiliza la columna.",
    imageUrl: `${IMG}/Hack_Squat/0.jpg`,
  },
  {
    name: "Prensa de Piernas a Una Pierna",
    muscleGroup: "piernas",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Trabaja cada pierna por separado para corregir desequilibrios. El pie a 45° en la plataforma enfatiza el cuádriceps; reduce el peso respecto a la prensa bilateral.",
    imageUrl: `${IMG}/Single_Leg_Press/0.jpg`,
  },
  {
    name: "Step-Up con Mancuernas",
    muscleGroup: "piernas",
    defaultSets: "3 x 12",
    defaultRest: "90 seg",
    notes:
      "Sube a una plataforma de 40-50 cm empujando con el talón de la pierna delantera. Mantén el torso erguido y controla el descenso; trabaja cuádriceps, glúteos e isquios.",
    imageUrl: `${IMG}/Dumbbell_Step_Ups/0.jpg`,
  },
  {
    name: "Sentadilla Frontal con Barra",
    muscleGroup: "piernas",
    defaultSets: "4 x 6-8",
    defaultRest: "3 min",
    notes:
      "La barra descansa en los deltoides anteriores con los codos en alto. El torso debe permanecer más vertical que en la sentadilla trasera, reclutando intensamente los cuádriceps.",
    imageUrl: `${IMG}/Barbell_Front_Squat/0.jpg`,
  },
  {
    name: "Curl Femoral Tumbado en Máquina",
    muscleGroup: "piernas",
    defaultSets: "3 x 12-15",
    defaultRest: "90 seg",
    notes:
      "Ajusta el rodillo sobre los tobillos boca abajo. Dobla las rodillas llevando los talones al glúteo sin despegar las caderas del almohadillado; trabaja isquiotibiales en aislamiento.",
    imageUrl: `${IMG}/Lying_Leg_Curl/0.jpg`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // GLUTEOS
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Hip Thrust con Barra",
    muscleGroup: "gluteos",
    defaultSets: "4 x 10-12",
    defaultRest: "2 min",
    notes:
      "Apoya los omóplatos en el banco y coloca la barra sobre las caderas con almohadilla. Empuja hacia arriba hasta que caderas, rodillas y hombros formen una línea; aprieta los glúteos en la cima.",
    imageUrl: `${IMG}/Barbell_Hip_Thrust/0.jpg`,
  },
  {
    name: "Peso Muerto Rumano con Mancuernas",
    muscleGroup: "gluteos",
    defaultSets: "3 x 10-12",
    defaultRest: "2 min",
    notes:
      "Bisagra desde las caderas manteniendo la espalda neutra y las rodillas ligeramente flexionadas. Siente el estiramiento en los isquios y glúteos antes de empujar las caderas hacia adelante para regresar.",
    imageUrl: `${IMG}/Romanian_Deadlift/0.jpg`,
  },
  {
    name: "Sentadilla Sumo con Barra",
    muscleGroup: "gluteos",
    defaultSets: "4 x 10",
    defaultRest: "2 min",
    notes:
      "Pies más anchos que los hombros y puntas a 45°. Desciende manteniendo el pecho alto y las rodillas empujando hacia afuera; la postura sumo recluta más los glúteos y aductores.",
    imageUrl: `${IMG}/Sumo_Barbell_Squat/0.jpg`,
  },
  {
    name: "Patada de Glúteo en Cable (Kickback)",
    muscleGroup: "gluteos",
    defaultSets: "3 x 15",
    defaultRest: "60 seg",
    notes:
      "Ata el cable al tobillo y apoya las manos en la máquina. Extiende la cadera hacia atrás manteniendo el core activo y la espalda recta; no hiperextiendas la columna lumbar.",
    imageUrl: `${IMG}/Cable_Hip_Extension/0.jpg`,
  },
  {
    name: "Abducción de Cadera en Máquina",
    muscleGroup: "gluteos",
    defaultSets: "3 x 15",
    defaultRest: "60 seg",
    notes:
      "Siéntate con la espalda plana en el respaldo. Separa las piernas hasta el límite del recorrido apretando el glúteo medio en el punto más abierto; regresa con control.",
    imageUrl: `${IMG}/Hip_Abduction/0.jpg`,
  },
  {
    name: "Sentadilla Búlgara con Mancuernas",
    muscleGroup: "gluteos",
    defaultSets: "3 x 10",
    defaultRest: "2 min",
    notes:
      "Pie trasero elevado en banco y pie delantero adelantado para mayor activación del glúteo. Baja en línea recta sin dejar que la rodilla delantera colapse hacia adentro.",
    imageUrl: `${IMG}/Dumbbell_Bulgarian_Split_Squat/0.jpg`,
  },
  {
    name: "Elevación de Cadera a Una Pierna (Glute Bridge)",
    muscleGroup: "gluteos",
    defaultSets: "3 x 12-15",
    defaultRest: "60 seg",
    notes:
      "Recostado boca arriba con los pies en el suelo, levanta una pierna y empuja con el talón de la otra. Contrae el glúteo arriba durante 1-2 segundos; ideal para corregir desequilibrios.",
    imageUrl: `${IMG}/Glute_Bridge/0.jpg`,
  },
  {
    name: "Zancada Reversa con Barra",
    muscleGroup: "gluteos",
    defaultSets: "3 x 10-12",
    defaultRest: "90 seg",
    notes:
      "Da un paso atrás en lugar de adelante, lo que reduce el estrés en la rodilla. Baja hasta 90° de flexión y sube empujando con el talón de la pierna delantera.",
    imageUrl: `${IMG}/Barbell_Reverse_Lunge/0.jpg`,
  },
  {
    name: "Sentadilla con Salto (Jump Squat)",
    muscleGroup: "gluteos",
    defaultSets: "3 x 12",
    defaultRest: "90 seg",
    notes:
      "Desciende a media sentadilla y explota hacia arriba. Aterriza con suavidad absorbiendo el impacto con las rodillas flexionadas; mejora la potencia de glúteos y cuádriceps.",
    imageUrl: `${IMG}/Jump_Squat/0.jpg`,
  },
  {
    name: "Hip Thrust a Una Pierna con Mancuerna",
    muscleGroup: "gluteos",
    defaultSets: "3 x 12",
    defaultRest: "90 seg",
    notes:
      "Versión unilateral del hip thrust con el banco detrás. Empuja la cadera hasta la extensión completa con una sola pierna; la mancuerna sobre la cadera añade resistencia extra.",
    imageUrl: `${IMG}/Barbell_Hip_Thrust/0.jpg`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // CORE
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Plancha Frontal (Plank)",
    muscleGroup: "core",
    defaultSets: "3 x 30-60 seg",
    defaultRest: "60 seg",
    notes:
      "Apoya los antebrazos y los pies; el cuerpo debe formar una línea recta de cabeza a talones. Activa glúteos, core y cuádriceps simultáneamente; evita dejar caer o elevar la cadera.",
    imageUrl: `${IMG}/Plank/0.jpg`,
  },
  {
    name: "Crunch Abdominal en Máquina",
    muscleGroup: "core",
    defaultSets: "3 x 15-20",
    defaultRest: "60 seg",
    notes:
      "Mantén el rango de movimiento corto y controlado. Redondea la columna desde la zona lumbar hacia arriba; no uses el cuello ni los flexores de cadera como motor principal.",
    imageUrl: `${IMG}/Machine_Crunch/0.jpg`,
  },
  {
    name: "Rueda Abdominal (Ab Wheel Rollout)",
    muscleGroup: "core",
    defaultSets: "3 x 8-12",
    defaultRest: "90 seg",
    notes:
      "Parte de rodillas con la rueda bajo los hombros. Extiende lentamente manteniendo la espalda plana y regresa contrayendo el core sin arquear la zona lumbar.",
    imageUrl: `${IMG}/Ab_Roller/0.jpg`,
  },
  {
    name: "Elevación de Piernas Colgado",
    muscleGroup: "core",
    defaultSets: "3 x 12-15",
    defaultRest: "90 seg",
    notes:
      "Cuélgate de la barra con los brazos extendidos. Eleva las piernas rectas hasta la horizontal o más sin usar impulso; controla el descenso para activar el recto abdominal.",
    imageUrl: `${IMG}/Hanging_Leg_Raise/0.jpg`,
  },
  {
    name: "Crunch Bicicleta",
    muscleGroup: "core",
    defaultSets: "3 x 20-30",
    defaultRest: "60 seg",
    notes:
      "Alterna codo a rodilla opuesta de forma controlada; no atraigas el cuello con las manos. Mantén la zona lumbar pegada al suelo durante todo el movimiento rotacional.",
    imageUrl: `${IMG}/Bicycle_Crunch/0.jpg`,
  },
  {
    name: "Plancha Lateral",
    muscleGroup: "core",
    defaultSets: "3 x 20-45 seg",
    defaultRest: "60 seg",
    notes:
      "Apoya el antebrazo y el lateral del pie. Eleva la cadera en línea recta activando el cuadrado lumbar y el oblicuo; evita que el lateral de la cadera se hunda.",
    imageUrl: `${IMG}/Side_Plank/0.jpg`,
  },
  {
    name: "Crunch en Polea Alta",
    muscleGroup: "core",
    defaultSets: "3 x 15-20",
    defaultRest: "60 seg",
    notes:
      "Arrodillado frente a la polea con la cuerda en la nuca. Redondea la espalda hacia los muslos contrayendo el recto abdominal; no doblas desde las caderas sino desde la zona torácica.",
    imageUrl: `${IMG}/Cable_Crunch/0.jpg`,
  },
  {
    name: "Palof Press (Anti-Rotación en Polea)",
    muscleGroup: "core",
    defaultSets: "3 x 12",
    defaultRest: "60 seg",
    notes:
      "De pie lateral a la polea, extiende los brazos al frente resistiendo la rotación del torso. Mantén la posición 2 segundos; trabaja la estabilidad del core en plano frontal.",
    imageUrl: null,
  },
  {
    name: "Dead Bug",
    muscleGroup: "core",
    defaultSets: "3 x 10",
    defaultRest: "60 seg",
    notes:
      "Recostado, extiende simultáneamente el brazo y la pierna opuesta hacia el suelo manteniendo la espalda baja pegada. Ideal para activar el core profundo y la coordinación neuromuscular.",
    imageUrl: null,
  },
  {
    name: "Giro Ruso con Disco (Russian Twist)",
    muscleGroup: "core",
    defaultSets: "3 x 20",
    defaultRest: "60 seg",
    notes:
      "Siéntate con el torso a 45°, los pies levantados y un disco en las manos. Rota el torso de lado a lado tocando el disco en el suelo; trabaja oblicuos en todo el rango.",
    imageUrl: `${IMG}/Russian_Twist/0.jpg`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // CARDIO
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Caminata en Caminadora (Inclinación Alta)",
    muscleGroup: "cardio",
    defaultSets: "1 x 20-30 min",
    defaultRest: "—",
    notes:
      "Ajusta la inclinación al 10-15% y la velocidad a 5-6 km/h. No te apoyes en los pasamanos; mantén el torso erguido y activa el core para quemar más calorías.",
    imageUrl: null,
  },
  {
    name: "Carrera en Caminadora (LISS)",
    muscleGroup: "cardio",
    defaultSets: "1 x 30-45 min",
    defaultRest: "—",
    notes:
      "Mantén una velocidad que permita conversar (zona 2, 60-70% FCmáx). Aterriza con el mediopié bajo las caderas para reducir el impacto en rodillas y caderas.",
    imageUrl: null,
  },
  {
    name: "Intervalos en Caminadora (HIIT)",
    muscleGroup: "cardio",
    defaultSets: "8-10 x 30 seg rápido / 90 seg lento",
    defaultRest: "90 seg",
    notes:
      "Alterna sprints al 85-95% FCmáx con recuperación activa. El entrenamiento intervalado de alta intensidad eleva el metabolismo durante horas posteriores al ejercicio.",
    imageUrl: null,
  },
  {
    name: "Bicicleta Estática (Cycling Steady State)",
    muscleGroup: "cardio",
    defaultSets: "1 x 30-45 min",
    defaultRest: "—",
    notes:
      "Ajusta el sillín para que la rodilla tenga una ligera flexión al extender. Pedalea a 80-90 RPM con resistencia moderada; mantén el torso ligeramente inclinado y los hombros relajados.",
    imageUrl: null,
  },
  {
    name: "Bicicleta Estática (Sprints)",
    muscleGroup: "cardio",
    defaultSets: "10 x 20 seg sprint / 40 seg recuperación",
    defaultRest: "40 seg",
    notes:
      "Eleva la resistencia al máximo durante los sprints. El protocolo Tabata en bicicleta es uno de los métodos más eficientes para mejorar la capacidad aeróbica y quemar grasa.",
    imageUrl: null,
  },
  {
    name: "Elíptica (Paso Largo)",
    muscleGroup: "cardio",
    defaultSets: "1 x 30-40 min",
    defaultRest: "—",
    notes:
      "Usa también las manijas para involucrar la parte superior del cuerpo. Mantén el talón en contacto con el pedal y los codos a 90°; la elíptica minimiza el impacto articular.",
    imageUrl: null,
  },
  {
    name: "Remo en Máquina (Rowing Ergómetro)",
    muscleGroup: "cardio",
    defaultSets: "1 x 20-30 min",
    defaultRest: "—",
    notes:
      "Inicia empujando con las piernas, luego inclina el torso hacia atrás y finaliza jalando el mango hacia el abdomen bajo. El remo trabaja el 86% de los músculos del cuerpo.",
    imageUrl: null,
  },
  {
    name: "Salto de Cuerda (Jump Rope)",
    muscleGroup: "cardio",
    defaultSets: "5 x 2 min",
    defaultRest: "60 seg",
    notes:
      "Mantén los codos cerca del cuerpo y salta con las puntas de los pies. El salto de cuerda mejora la coordinación, la resistencia cardiovascular y quema hasta 15 kcal/min.",
    imageUrl: null,
  },
  {
    name: "Escaladora (Stairmaster / Stepper)",
    muscleGroup: "cardio",
    defaultSets: "1 x 20-30 min",
    defaultRest: "—",
    notes:
      "No te apoyes en los pasamanos para maximizar el gasto calórico. Mantén la espalda recta y da pasos completos; activa glúteos, cuádriceps y el sistema cardiovascular.",
    imageUrl: null,
  },
  {
    name: "Burpees",
    muscleGroup: "cardio",
    defaultSets: "4 x 10-15",
    defaultRest: "60 seg",
    notes:
      "Desde de pie, baja al suelo en posición de lagartija, haz una flexión, salta los pies hacia las manos y salta al aire. Movimiento explosivo de cuerpo completo para máxima demanda cardiovascular.",
    imageUrl: `${IMG}/Burpee/0.jpg`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // FULL BODY
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Sentadilla con Press (Thruster)",
    muscleGroup: "full_body",
    defaultSets: "4 x 10-12",
    defaultRest: "2 min",
    notes:
      "Sostén mancuernas en los hombros. Realiza una sentadilla completa y al subir usa el impulso para presionar las mancuernas sobre la cabeza; combina fuerza de piernas y hombros.",
    imageUrl: `${IMG}/Dumbbell_Squat_to_Arnold_Press/0.jpg`,
  },
  {
    name: "Clean y Press con Barra",
    muscleGroup: "full_body",
    defaultSets: "4 x 5-6",
    defaultRest: "3 min",
    notes:
      "Halón desde el suelo hasta los hombros (clean) seguido de un press militar. Requiere coordinación de piernas, caderas, core y brazos; dominalo con peso ligero antes de progresar.",
    imageUrl: `${IMG}/Barbell_Clean_and_Press/0.jpg`,
  },
  {
    name: "Peso Muerto Sumo con Remo Alto",
    muscleGroup: "full_body",
    defaultSets: "3 x 12",
    defaultRest: "2 min",
    notes:
      "Desde posición sumo, sube la barra con extensión de caderas y luego tira hacia la barbilla elevando los codos. Trabaja glúteos, trapecios y deltoides en un solo movimiento.",
    imageUrl: `${IMG}/Sumo_Deadlift_with_High_Pull/0.jpg`,
  },
  {
    name: "Turkish Get-Up con Kettlebell",
    muscleGroup: "full_body",
    defaultSets: "3 x 3-5",
    defaultRest: "2 min",
    notes:
      "Desde el suelo hasta de pie con la kettlebell extendida sobre la cabeza. Movimiento multi-fase que desarrolla estabilidad de hombro, movilidad de cadera y fuerza del core.",
    imageUrl: null,
  },
  {
    name: "Swing con Kettlebell",
    muscleGroup: "full_body",
    defaultSets: "4 x 15-20",
    defaultRest: "60 seg",
    notes:
      "Bisagra explosivamente desde las caderas para balancear la kettlebell a la altura de los hombros. El movimiento no es una sentadilla sino una bisagra de cadera; los glúteos son el motor.",
    imageUrl: null,
  },
  {
    name: "Dominadas con Peso (Weighted Pull-Up)",
    muscleGroup: "full_body",
    defaultSets: "4 x 5-8",
    defaultRest: "3 min",
    notes:
      "Cuelga un disco del cinturón de lastre. Misma técnica que la dominada estándar: deprime hombros antes de doblar los codos; el peso adicional aumenta el estímulo de fuerza.",
    imageUrl: `${IMG}/Weighted_Pull_Up/0.jpg`,
  },
  {
    name: "Remo + Curl + Press (Combinación con Mancuernas)",
    muscleGroup: "full_body",
    defaultSets: "3 x 10",
    defaultRest: "90 seg",
    notes:
      "Realiza un remo inclinado, lleva las mancuernas al hombro con un curl y finaliza con un press sobre la cabeza. La secuencia de 3 movimientos maximiza el gasto calórico y la síntesis proteica.",
    imageUrl: null,
  },
  {
    name: "Sentadilla Goblet",
    muscleGroup: "full_body",
    defaultSets: "3 x 12-15",
    defaultRest: "90 seg",
    notes:
      "Sostén una mancuerna o kettlebell frente al pecho con ambas manos. Desciende a sentadilla profunda manteniendo los talones en el suelo y los codos dentro de las rodillas.",
    imageUrl: `${IMG}/Goblet_Squat/0.jpg`,
  },
];

// ─── Routine Templates ────────────────────────────────────────────────────────

interface RoutineExerciseSeed {
  exerciseName: string;
  sets?: string;
  rest?: string;
  notes?: string;
}

interface RoutineSeed {
  name: string;
  description: string;
  dayLabel: string;
  exercises: RoutineExerciseSeed[];
}

const routines: RoutineSeed[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // 1. RUTINA FULL BODY — PRINCIPIANTES (3 días / semana)
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Full Body — Día A",
    description:
      "Rutina de cuerpo completo para principiantes (3 días/semana: Lun, Mié, Vie). Ejercicios multiarticulares con cargas moderadas para aprender patrones de movimiento y construir una base sólida.",
    dayLabel: "Lunes / Miércoles / Viernes — Día A",
    exercises: [
      { exerciseName: "Sentadilla con Barra (Back Squat)", sets: "3 x 10", rest: "2 min" },
      { exerciseName: "Press de Banca con Barra", sets: "3 x 10", rest: "2 min" },
      { exerciseName: "Jalón al Pecho en Polea Alta", sets: "3 x 10", rest: "2 min" },
      { exerciseName: "Press Militar con Barra (De Pie)", sets: "3 x 10", rest: "90 seg" },
      { exerciseName: "Curl de Bíceps con Barra", sets: "2 x 12", rest: "60 seg" },
      { exerciseName: "Extensión de Tríceps en Polea con Cuerda", sets: "2 x 12", rest: "60 seg" },
      { exerciseName: "Plancha Frontal (Plank)", sets: "3 x 30 seg", rest: "45 seg" },
      {
        exerciseName: "Caminata en Caminadora (Inclinación Alta)",
        sets: "1 x 10 min",
        rest: "—",
        notes: "Calentamiento al inicio de la sesión.",
      },
    ],
  },
  {
    name: "Full Body — Día B",
    description:
      "Segundo día del programa Full Body para principiantes con variantes de ejercicios del Día A. El cambio de estímulo favorece la adaptación sin sobrecargar los mismos patrones.",
    dayLabel: "Lunes / Miércoles / Viernes — Día B (semana alternada)",
    exercises: [
      { exerciseName: "Prensa de Piernas (Leg Press)", sets: "3 x 12", rest: "2 min" },
      { exerciseName: "Press de Banca Inclinado con Mancuernas", sets: "3 x 12", rest: "90 seg" },
      { exerciseName: "Remo en Polea Baja (Sentado)", sets: "3 x 12", rest: "90 seg" },
      { exerciseName: "Elevaciones Laterales con Mancuernas", sets: "3 x 12", rest: "60 seg" },
      { exerciseName: "Curl Martillo con Mancuernas", sets: "2 x 12", rest: "60 seg" },
      { exerciseName: "Press de Tríceps en Máquina", sets: "2 x 12", rest: "60 seg" },
      { exerciseName: "Crunch Abdominal en Máquina", sets: "3 x 15", rest: "45 seg" },
      {
        exerciseName: "Bicicleta Estática (Cycling Steady State)",
        sets: "1 x 10 min",
        rest: "—",
        notes: "Calentamiento al inicio de la sesión.",
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 2. RUTINA UPPER / LOWER — INTERMEDIO (4 días / semana)
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Upper/Lower — Parte Superior A",
    description:
      "Programa Upper/Lower de 4 días para nivel intermedio (Lun, Mar, Jue, Vie). El día superior A prioriza el volumen con rangos de repeticiones moderados.",
    dayLabel: "Lunes — Parte Superior A",
    exercises: [
      { exerciseName: "Press de Banca con Barra", sets: "4 x 8", rest: "3 min" },
      { exerciseName: "Jalón al Pecho en Polea Alta", sets: "4 x 10", rest: "2 min" },
      { exerciseName: "Press de Banca Inclinado con Mancuernas", sets: "3 x 12", rest: "90 seg" },
      { exerciseName: "Remo con Mancuerna a Una Mano", sets: "3 x 10", rest: "90 seg" },
      { exerciseName: "Press en Máquina de Hombros", sets: "3 x 12", rest: "90 seg" },
      { exerciseName: "Curl de Bíceps con Barra", sets: "3 x 12", rest: "60 seg" },
      { exerciseName: "Press Francés con Barra EZ", sets: "3 x 12", rest: "60 seg" },
    ],
  },
  {
    name: "Upper/Lower — Parte Inferior A",
    description:
      "Día inferior A del programa Upper/Lower. Enfocado en sentadilla y derivados para cuádriceps con trabajo accesorio de isquiotibiales.",
    dayLabel: "Martes — Parte Inferior A",
    exercises: [
      { exerciseName: "Sentadilla con Barra (Back Squat)", sets: "4 x 6-8", rest: "3 min" },
      { exerciseName: "Peso Muerto Rumano", sets: "3 x 10", rest: "2 min" },
      { exerciseName: "Prensa de Piernas (Leg Press)", sets: "3 x 12", rest: "2 min" },
      { exerciseName: "Curl Femoral Tumbado en Máquina", sets: "3 x 12", rest: "90 seg" },
      { exerciseName: "Extensión de Cuádriceps en Máquina", sets: "3 x 15", rest: "60 seg" },
      { exerciseName: "Hip Thrust con Barra", sets: "3 x 12", rest: "2 min" },
      { exerciseName: "Elevación de Piernas Colgado", sets: "3 x 12", rest: "60 seg" },
    ],
  },
  {
    name: "Upper/Lower — Parte Superior B",
    description:
      "Día superior B con énfasis en fuerza relativa (menores repeticiones, mayor carga). Complementa el Día A con variantes de press y jalón.",
    dayLabel: "Jueves — Parte Superior B",
    exercises: [
      { exerciseName: "Press Militar con Barra (De Pie)", sets: "4 x 6-8", rest: "3 min" },
      { exerciseName: "Remo con Barra", sets: "4 x 8", rest: "3 min" },
      { exerciseName: "Press de Banca con Agarre Cerrado (Close Grip)", sets: "3 x 10", rest: "2 min" },
      { exerciseName: "Dominadas (Pull-Up)", sets: "3 x 8-10", rest: "2 min" },
      { exerciseName: "Aperturas con Mancuernas en Banco Plano", sets: "3 x 12", rest: "90 seg" },
      { exerciseName: "Face Pull con Cuerda", sets: "3 x 15", rest: "60 seg" },
      { exerciseName: "Curl en Banco Scott (Predicador)", sets: "3 x 12", rest: "60 seg" },
      { exerciseName: "Extensión de Tríceps sobre la Cabeza con Mancuerna", sets: "3 x 12", rest: "60 seg" },
    ],
  },
  {
    name: "Upper/Lower — Parte Inferior B",
    description:
      "Día inferior B con énfasis en glúteos e isquiotibiales para balancear el día inferior A cuadricep-dominante. Incluye trabajo unilateral.",
    dayLabel: "Viernes — Parte Inferior B",
    exercises: [
      { exerciseName: "Peso Muerto Convencional", sets: "4 x 5", rest: "4 min" },
      { exerciseName: "Hip Thrust con Barra", sets: "4 x 10", rest: "2 min" },
      { exerciseName: "Sentadilla Búlgara (Split Squat)", sets: "3 x 10", rest: "2 min" },
      { exerciseName: "Curl Femoral Tumbado en Máquina", sets: "4 x 12", rest: "90 seg" },
      { exerciseName: "Abducción de Cadera en Máquina", sets: "3 x 15", rest: "60 seg" },
      { exerciseName: "Elevación de Cadera a Una Pierna (Glute Bridge)", sets: "3 x 12", rest: "60 seg" },
      { exerciseName: "Plancha Lateral", sets: "3 x 30 seg", rest: "45 seg" },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 3. PUSH / PULL / LEGS — AVANZADO (6 días / semana)
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "PPL — Push A (Empuje)",
    description:
      "Programa Push/Pull/Legs 6 días para nivel avanzado (Lun-Sáb). El día Push A trabaja pecho, hombros y tríceps con énfasis en fuerza (cargas altas, repeticiones bajas).",
    dayLabel: "Lunes — Push A",
    exercises: [
      { exerciseName: "Press de Banca con Barra", sets: "5 x 5", rest: "3 min" },
      { exerciseName: "Press de Banca Inclinado con Barra", sets: "4 x 8", rest: "2-3 min" },
      { exerciseName: "Press Militar con Barra (De Pie)", sets: "4 x 8", rest: "2-3 min" },
      { exerciseName: "Cruce de Poleas (Cable Crossover)", sets: "3 x 12", rest: "90 seg" },
      { exerciseName: "Elevaciones Laterales con Mancuernas", sets: "4 x 15", rest: "60 seg" },
      { exerciseName: "Extensión de Tríceps en Polea con Cuerda", sets: "4 x 12", rest: "60 seg" },
      { exerciseName: "Press de Banca con Agarre Cerrado (Close Grip)", sets: "3 x 10", rest: "90 seg" },
    ],
  },
  {
    name: "PPL — Pull A (Jalón)",
    description:
      "Día Pull A para espalda y bíceps con énfasis en fuerza. Las dominadas y el peso muerto son los ejercicios principales.",
    dayLabel: "Martes — Pull A",
    exercises: [
      { exerciseName: "Peso Muerto Convencional", sets: "4 x 5", rest: "4 min" },
      { exerciseName: "Dominadas (Pull-Up)", sets: "4 x 6-8", rest: "3 min" },
      { exerciseName: "Remo con Barra", sets: "4 x 8", rest: "2-3 min" },
      { exerciseName: "Jalón al Pecho en Polea Alta", sets: "3 x 10", rest: "2 min" },
      { exerciseName: "Remo con Mancuerna a Una Mano", sets: "3 x 10", rest: "90 seg" },
      { exerciseName: "Face Pull con Cuerda", sets: "3 x 15", rest: "60 seg" },
      { exerciseName: "Curl de Bíceps con Barra", sets: "4 x 10", rest: "60 seg" },
      { exerciseName: "Curl Martillo con Mancuernas", sets: "3 x 12", rest: "60 seg" },
    ],
  },
  {
    name: "PPL — Legs A (Piernas — Cuádriceps)",
    description:
      "Día de piernas con énfasis en cuádriceps. La sentadilla frontal y la prensa con pie bajo son los ejercicios clave.",
    dayLabel: "Miércoles — Legs A",
    exercises: [
      { exerciseName: "Sentadilla con Barra (Back Squat)", sets: "5 x 5", rest: "3-4 min" },
      { exerciseName: "Sentadilla Frontal con Barra", sets: "4 x 6", rest: "3 min" },
      { exerciseName: "Prensa de Piernas (Leg Press)", sets: "4 x 12", rest: "2 min" },
      { exerciseName: "Extensión de Cuádriceps en Máquina", sets: "3 x 15", rest: "90 seg" },
      { exerciseName: "Curl Femoral Tumbado en Máquina", sets: "3 x 12", rest: "90 seg" },
      { exerciseName: "Elevación de Piernas Colgado", sets: "4 x 15", rest: "60 seg" },
      { exerciseName: "Plancha Frontal (Plank)", sets: "3 x 45 seg", rest: "45 seg" },
    ],
  },
  {
    name: "PPL — Push B (Empuje — Volumen)",
    description:
      "Push B con énfasis en volumen e hipertrofia. Más series de aislamiento y mayor densidad de entrenamiento para completar el ciclo semanal.",
    dayLabel: "Jueves — Push B",
    exercises: [
      { exerciseName: "Press de Banca Inclinado con Mancuernas", sets: "4 x 10", rest: "2 min" },
      { exerciseName: "Press de Banca Declinado con Barra", sets: "4 x 10", rest: "2 min" },
      { exerciseName: "Arnold Press con Mancuernas", sets: "4 x 10", rest: "90 seg" },
      { exerciseName: "Aperturas en Máquina (Pec Deck)", sets: "3 x 12-15", rest: "60 seg" },
      { exerciseName: "Elevaciones Laterales en Polea Baja", sets: "4 x 15", rest: "60 seg" },
      { exerciseName: "Pájaro (Posterior Shoulder Fly)", sets: "3 x 15", rest: "60 seg" },
      { exerciseName: "Extensión de Tríceps sobre la Cabeza en Polea", sets: "3 x 15", rest: "60 seg" },
      { exerciseName: "Press Francés con Barra EZ", sets: "3 x 12", rest: "60 seg" },
    ],
  },
  {
    name: "PPL — Pull B (Jalón — Volumen)",
    description:
      "Pull B de volumen para espalda y bíceps. Incluye más ejercicios de aislamiento y variantes para asegurar la estimulación completa de todos los haces del dorsal y bíceps.",
    dayLabel: "Viernes — Pull B",
    exercises: [
      { exerciseName: "Peso Muerto Rumano", sets: "4 x 8", rest: "2-3 min" },
      { exerciseName: "Jalón al Pecho con Agarre Neutro", sets: "4 x 12", rest: "2 min" },
      { exerciseName: "Remo en Polea Baja (Sentado)", sets: "4 x 12", rest: "2 min" },
      { exerciseName: "Remo en Máquina (Hammer Strength)", sets: "3 x 12", rest: "90 seg" },
      { exerciseName: "Hiperextensiones en Banco Romano", sets: "3 x 15", rest: "60 seg" },
      { exerciseName: "Encogimientos de Hombros con Barra (Shrugs)", sets: "4 x 15", rest: "60 seg" },
      { exerciseName: "Curl en Banco Scott (Predicador)", sets: "3 x 12", rest: "60 seg" },
      { exerciseName: "Curl Concentrado con Mancuerna", sets: "3 x 12", rest: "60 seg" },
    ],
  },
  {
    name: "PPL — Legs B (Piernas — Glúteos e Isquios)",
    description:
      "Segundo día de piernas con énfasis en glúteos e isquiotibiales para equilibrar el Legs A cuadricep-dominante. Hip thrust y peso muerto rumano son los pilares.",
    dayLabel: "Sábado — Legs B",
    exercises: [
      { exerciseName: "Hip Thrust con Barra", sets: "5 x 10", rest: "2-3 min" },
      { exerciseName: "Peso Muerto Rumano", sets: "4 x 10", rest: "2 min" },
      { exerciseName: "Sentadilla Búlgara (Split Squat)", sets: "4 x 10", rest: "2 min" },
      { exerciseName: "Curl Femoral Tumbado en Máquina", sets: "4 x 12", rest: "90 seg" },
      { exerciseName: "Abducción de Cadera en Máquina", sets: "3 x 20", rest: "60 seg" },
      { exerciseName: "Patada de Glúteo en Cable (Kickback)", sets: "3 x 15", rest: "60 seg" },
      { exerciseName: "Elevación de Cadera a Una Pierna (Glute Bridge)", sets: "3 x 15", rest: "60 seg" },
      { exerciseName: "Giro Ruso con Disco (Russian Twist)", sets: "3 x 20", rest: "45 seg" },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 4. RUTINA FUERZA 5×5 — STRENGTH FOCUSED (5 días / semana)
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Fuerza 5×5 — Día A",
    description:
      "Programa de fuerza basado en el método 5×5 (5 series de 5 repeticiones con máxima carga posible). Los tres levantamientos principales más trabajo accesorio mínimo.",
    dayLabel: "Lunes — Día A",
    exercises: [
      { exerciseName: "Sentadilla con Barra (Back Squat)", sets: "5 x 5", rest: "4-5 min", notes: "Incrementa 2.5 kg cada sesión mientras puedas completar las 5×5." },
      { exerciseName: "Press de Banca con Barra", sets: "5 x 5", rest: "3-4 min", notes: "Incrementa 2.5 kg cada sesión." },
      { exerciseName: "Remo con Barra", sets: "5 x 5", rest: "3 min", notes: "Torso a 45°. Incrementa 2.5 kg cada sesión." },
      { exerciseName: "Hiperextensiones en Banco Romano", sets: "3 x 10", rest: "90 seg", notes: "Trabajo accesorio de espalda baja." },
      { exerciseName: "Plancha Frontal (Plank)", sets: "3 x 45 seg", rest: "60 seg" },
    ],
  },
  {
    name: "Fuerza 5×5 — Día B",
    description:
      "Día B del programa 5×5 con sentadilla, press militar y peso muerto. Alterna con el Día A para completar las 5 sesiones semanales (A-B-A-B-A).",
    dayLabel: "Martes — Día B",
    exercises: [
      { exerciseName: "Sentadilla con Barra (Back Squat)", sets: "5 x 5", rest: "4-5 min", notes: "Mismo esquema de progresión que el Día A." },
      { exerciseName: "Press Militar con Barra (De Pie)", sets: "5 x 5", rest: "3-4 min", notes: "Incrementa 2.5 kg cada sesión de press militar." },
      { exerciseName: "Peso Muerto Convencional", sets: "1 x 5", rest: "5 min", notes: "Solo 1 serie de trabajo pesado. Incrementa 5 kg cada sesión." },
      { exerciseName: "Fondos en Paralelas (Énfasis Tríceps)", sets: "3 x 8-10", rest: "2 min", notes: "Añade lastre cuando puedas hacer 10 reps limpias." },
      { exerciseName: "Dominadas (Pull-Up)", sets: "3 x 6-8", rest: "2-3 min", notes: "Añade lastre cuando puedas hacer 8 reps limpias." },
    ],
  },
  {
    name: "Fuerza 5×5 — Día C (Accessory)",
    description:
      "Día de accesorios del programa 5×5 para apoyar los levantamientos principales sin sobrecargar el sistema nervioso central. Repeticiones más altas y cargas moderadas.",
    dayLabel: "Miércoles — Día C (Accesorios)",
    exercises: [
      { exerciseName: "Sentadilla Frontal con Barra", sets: "4 x 4", rest: "3 min", notes: "60-70% del RM de sentadilla trasera." },
      { exerciseName: "Press de Banca con Agarre Cerrado (Close Grip)", sets: "4 x 6", rest: "2-3 min" },
      { exerciseName: "Jalón al Pecho en Polea Alta", sets: "4 x 8", rest: "2 min" },
      { exerciseName: "Curl de Bíceps con Barra", sets: "3 x 8", rest: "90 seg" },
      { exerciseName: "Extensión de Tríceps en Polea con Cuerda", sets: "3 x 10", rest: "90 seg" },
      { exerciseName: "Hiperextensiones en Banco Romano", sets: "4 x 12", rest: "90 seg" },
    ],
  },
  {
    name: "Fuerza 5×5 — Día D",
    description:
      "Cuarta sesión del programa Fuerza 5×5 (copia del Día A con la semana avanzada). La alternancia A-B garantiza que cada levantamiento se entrena múltiples veces por semana.",
    dayLabel: "Jueves — Día D (= A)",
    exercises: [
      { exerciseName: "Sentadilla con Barra (Back Squat)", sets: "5 x 5", rest: "4-5 min" },
      { exerciseName: "Press de Banca con Barra", sets: "5 x 5", rest: "3-4 min" },
      { exerciseName: "Remo con Barra", sets: "5 x 5", rest: "3 min" },
      { exerciseName: "Crunch Abdominal en Máquina", sets: "3 x 15", rest: "60 seg" },
    ],
  },
  {
    name: "Fuerza 5×5 — Día E",
    description:
      "Quinta y última sesión de la semana en el programa 5×5 (copia del Día B). El lunes siguiente reinicia como Día A con nuevas cargas progresivas.",
    dayLabel: "Viernes — Día E (= B)",
    exercises: [
      { exerciseName: "Sentadilla con Barra (Back Squat)", sets: "5 x 5", rest: "4-5 min" },
      { exerciseName: "Press Militar con Barra (De Pie)", sets: "5 x 5", rest: "3-4 min" },
      { exerciseName: "Peso Muerto Convencional", sets: "1 x 5", rest: "5 min" },
      { exerciseName: "Fondos en Paralelas (Énfasis Tríceps)", sets: "3 x 8", rest: "2 min" },
      { exerciseName: "Dominadas (Pull-Up)", sets: "3 x 6", rest: "2-3 min" },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 5. RUTINA CARDIO + TONO — FAT LOSS (5 días / semana)
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Cardio + Tono — Día 1 (Tren Superior)",
    description:
      "Programa de definición muscular y pérdida de grasa. Combina entrenamiento de resistencia con cardio en la misma sesión. Descansos cortos para mantener la frecuencia cardíaca elevada.",
    dayLabel: "Lunes — Tren Superior",
    exercises: [
      { exerciseName: "Bicicleta Estática (Cycling Steady State)", sets: "1 x 10 min", rest: "—", notes: "Calentamiento cardiovascular." },
      { exerciseName: "Press de Banca con Barra", sets: "3 x 12-15", rest: "60 seg" },
      { exerciseName: "Jalón al Pecho en Polea Alta", sets: "3 x 12-15", rest: "60 seg" },
      { exerciseName: "Press en Máquina de Hombros", sets: "3 x 12-15", rest: "60 seg" },
      { exerciseName: "Remo en Polea Baja (Sentado)", sets: "3 x 12-15", rest: "60 seg" },
      { exerciseName: "Aperturas en Máquina (Pec Deck)", sets: "3 x 15", rest: "45 seg" },
      { exerciseName: "Curl de Bíceps con Barra", sets: "3 x 15", rest: "45 seg" },
      { exerciseName: "Extensión de Tríceps en Polea con Cuerda", sets: "3 x 15", rest: "45 seg" },
      { exerciseName: "Carrera en Caminadora (LISS)", sets: "1 x 20 min", rest: "—", notes: "Zona 2. Finaliza la sesión." },
    ],
  },
  {
    name: "Cardio + Tono — Día 2 (HIIT + Core)",
    description:
      "Sesión de alta intensidad con intervalos y trabajo de core. Maximiza el gasto calórico post-ejercicio (EPOC) con el protocolo HIIT.",
    dayLabel: "Martes — HIIT + Core",
    exercises: [
      { exerciseName: "Intervalos en Caminadora (HIIT)", sets: "10 x 30 seg / 90 seg", rest: "90 seg", notes: "Calentamiento 5 min antes de iniciar los intervalos." },
      { exerciseName: "Burpees", sets: "4 x 10", rest: "45 seg" },
      { exerciseName: "Plancha Frontal (Plank)", sets: "4 x 45 seg", rest: "30 seg" },
      { exerciseName: "Elevación de Piernas Colgado", sets: "3 x 15", rest: "45 seg" },
      { exerciseName: "Crunch Bicicleta", sets: "3 x 25", rest: "30 seg" },
      { exerciseName: "Giro Ruso con Disco (Russian Twist)", sets: "3 x 20", rest: "30 seg" },
      { exerciseName: "Rueda Abdominal (Ab Wheel Rollout)", sets: "3 x 8", rest: "60 seg" },
    ],
  },
  {
    name: "Cardio + Tono — Día 3 (Tren Inferior)",
    description:
      "Día de piernas en el programa de definición. Sentadilla, prensa y ejercicios de glúteo con descansos cortos para mantener la quema calórica elevada.",
    dayLabel: "Miércoles — Tren Inferior",
    exercises: [
      { exerciseName: "Elíptica (Paso Largo)", sets: "1 x 10 min", rest: "—", notes: "Calentamiento cardiovascular." },
      { exerciseName: "Sentadilla con Barra (Back Squat)", sets: "4 x 12-15", rest: "90 seg" },
      { exerciseName: "Hip Thrust con Barra", sets: "4 x 15", rest: "90 seg" },
      { exerciseName: "Prensa de Piernas (Leg Press)", sets: "3 x 15", rest: "60 seg" },
      { exerciseName: "Extensión de Cuádriceps en Máquina", sets: "3 x 15", rest: "60 seg" },
      { exerciseName: "Curl Femoral Tumbado en Máquina", sets: "3 x 15", rest: "60 seg" },
      { exerciseName: "Abducción de Cadera en Máquina", sets: "3 x 20", rest: "45 seg" },
      { exerciseName: "Escaladora (Stairmaster / Stepper)", sets: "1 x 20 min", rest: "—", notes: "Finaliza la sesión." },
    ],
  },
  {
    name: "Cardio + Tono — Día 4 (Full Body Metabólico)",
    description:
      "Entrenamiento metabólico de cuerpo completo. Superseries y tríos de ejercicios para maximizar el gasto calórico y el efecto hormonal de quema de grasa.",
    dayLabel: "Jueves — Full Body Metabólico",
    exercises: [
      { exerciseName: "Sentadilla con Press (Thruster)", sets: "4 x 12", rest: "60 seg", notes: "Superserie con el siguiente ejercicio." },
      { exerciseName: "Remo en Polea Baja (Sentado)", sets: "4 x 12", rest: "60 seg" },
      { exerciseName: "Swing con Kettlebell", sets: "4 x 20", rest: "60 seg", notes: "Superserie con el siguiente ejercicio." },
      { exerciseName: "Plancha Frontal (Plank)", sets: "4 x 30 seg", rest: "30 seg" },
      { exerciseName: "Zancada con Mancuernas (Lunges)", sets: "3 x 12", rest: "60 seg" },
      { exerciseName: "Press de Banca con Barra", sets: "3 x 12", rest: "60 seg" },
      { exerciseName: "Burpees", sets: "3 x 12", rest: "60 seg" },
      { exerciseName: "Bicicleta Estática (Sprints)", sets: "10 x 20 seg", rest: "40 seg", notes: "Finaliza la sesión." },
    ],
  },
  {
    name: "Cardio + Tono — Día 5 (Cardio Largo)",
    description:
      "Sesión de cardio en zona 2 de baja intensidad y larga duración para maximizar la oxidación de grasas. Ideal al final de la semana como recuperación activa.",
    dayLabel: "Viernes — Cardio Largo (LISS)",
    exercises: [
      { exerciseName: "Caminata en Caminadora (Inclinación Alta)", sets: "1 x 45 min", rest: "—", notes: "Mantén la zona 2 (60-65% FCmáx). No agarres los pasamanos." },
      { exerciseName: "Remo en Máquina (Rowing Ergómetro)", sets: "1 x 15 min", rest: "—", notes: "Ritmo constante y controlado." },
      { exerciseName: "Salto de Cuerda (Jump Rope)", sets: "5 x 2 min", rest: "60 seg", notes: "Opcional para añadir variedad al final." },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // 6. RUTINA POSTURAL — CORRECTIVA (3-4 días / semana)
  // ───────────────────────────────────────────────────────────────────────────
  {
    name: "Postural — Sesión A (Espalda y Hombros)",
    description:
      "Programa correctivo-postural para contrarrestar los efectos del sedentarismo y el trabajo de oficina. Énfasis en fortalecer la cadena posterior y activar los estabilizadores escapulares. 3-4 días/semana.",
    dayLabel: "Lunes / Jueves — Sesión A",
    exercises: [
      {
        exerciseName: "Caminata en Caminadora (Inclinación Alta)",
        sets: "1 x 10 min",
        rest: "—",
        notes: "Calentamiento con postura consciente: pecho alto, hombros atrás y abajo.",
      },
      {
        exerciseName: "Face Pull con Cuerda",
        sets: "4 x 20",
        rest: "45 seg",
        notes: "Ejercicio más importante de la rutina. Activa rotadores externos y retractores escapulares. Usa peso ligero con excelente forma.",
      },
      {
        exerciseName: "Hiperextensiones en Banco Romano",
        sets: "3 x 15",
        rest: "60 seg",
        notes: "Activa erectores espinales y glúteos. Mantén la cabeza en posición neutra y evita hiperextender.",
      },
      {
        exerciseName: "Remo en Polea Baja (Sentado)",
        sets: "4 x 12",
        rest: "60 seg",
        notes: "Enfatiza la retracción escapular; pausa 2 segundos en la posición de cierre apretando los omóplatos.",
      },
      {
        exerciseName: "Jalón al Pecho con Agarre Neutro",
        sets: "3 x 12",
        rest: "60 seg",
        notes: "Agarre neutro reduce el estrés en el hombro anterior. Deprime las escápulas antes de doblar los codos.",
      },
      {
        exerciseName: "Pájaro (Posterior Shoulder Fly)",
        sets: "3 x 15",
        rest: "60 seg",
        notes: "Activa deltoides posterior y romboides, músculos frecuentemente debilitados por mala postura.",
      },
      {
        exerciseName: "Plancha Frontal (Plank)",
        sets: "3 x 45 seg",
        rest: "45 seg",
        notes: "Activa el core profundo (transverso abdominal) que es el corsé natural de la columna.",
      },
      {
        exerciseName: "Plancha Lateral",
        sets: "3 x 30 seg",
        rest: "45 seg",
        notes: "Fortalece el cuadrado lumbar para estabilizar la columna en el plano frontal.",
      },
    ],
  },
  {
    name: "Postural — Sesión B (Core y Cadenas Cruzadas)",
    description:
      "Segunda sesión postural con énfasis en el core profundo, cadena anterior y ejercicios de movilidad activa. Complementa la Sesión A para una corrección postural completa.",
    dayLabel: "Martes / Viernes — Sesión B",
    exercises: [
      {
        exerciseName: "Bicicleta Estática (Cycling Steady State)",
        sets: "1 x 10 min",
        rest: "—",
        notes: "Calentamiento de bajo impacto.",
      },
      {
        exerciseName: "Dead Bug",
        sets: "3 x 10",
        rest: "60 seg",
        notes: "Activa el transverso abdominal y estabilizadores profundos. Haz una pausa de 3 segundos en la posición extendida.",
      },
      {
        exerciseName: "Palof Press (Anti-Rotación en Polea)",
        sets: "3 x 12",
        rest: "60 seg",
        notes: "Trabaja la estabilidad rotacional del core. Empieza con una carga muy ligera para dominar el patrón.",
      },
      {
        exerciseName: "Elevación de Cadera a Una Pierna (Glute Bridge)",
        sets: "3 x 15",
        rest: "60 seg",
        notes: "Activa glúteos e inhibe los flexores de cadera acortados por el sedentarismo.",
      },
      {
        exerciseName: "Hip Thrust con Barra",
        sets: "3 x 15",
        rest: "90 seg",
        notes: "Fortalece glúteos para aliviar la sobrecarga lumbar. Activa el glúteo en el punto superior con 2 seg de pausa.",
      },
      {
        exerciseName: "Extensión de Tríceps sobre la Cabeza con Mancuerna",
        sets: "3 x 12",
        rest: "60 seg",
        notes: "Trabaja la movilidad de los hombros en flexión overhead, frecuentemente limitada por tensión en el pectoral menor.",
      },
      {
        exerciseName: "Crunch Bicicleta",
        sets: "3 x 20",
        rest: "45 seg",
        notes: "Activa oblicuos para la estabilización rotacional del tronco.",
      },
      {
        exerciseName: "Elevaciones Laterales con Mancuernas",
        sets: "3 x 15",
        rest: "45 seg",
        notes: "Fortalece el deltoides medio para mejorar la posición de los hombros y contrarrestar el síndrome cruzado superior.",
      },
    ],
  },
];

// ─── Seed Function ─────────────────────────────────────────────────────────────

async function seedExercisesAndRoutines() {
  try {
    // Get Aquarius Gym — Río Blanco (first gym, or seed for both)
    const allGyms = await db.select().from(schema.gyms);
    if (allGyms.length === 0) {
      console.error("No se encontraron sedes. Ejecuta seed-gym.ts primero.");
      process.exit(1);
    }

    const gym = allGyms[0];
    console.log(`\nSeeding exercises for: ${gym.name} (${gym.id})\n`);

    // ── Step 1: Seed Exercises ──────────────────────────────────────────────
    const exerciseIdMap: Record<string, string> = {};

    for (const ex of exercises) {
      // Check if exercise already exists for this gym (or globally)
      const existing = await db
        .select()
        .from(schema.exercises)
        .where(eq(schema.exercises.name, ex.name));

      if (existing.length > 0) {
        exerciseIdMap[ex.name] = existing[0].id;
        console.log(`  ✓ Ejercicio ya existe: ${ex.name}`);
        continue;
      }

      const [inserted] = await db
        .insert(schema.exercises)
        .values({
          gymId: gym.id,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          defaultSets: ex.defaultSets,
          defaultRest: ex.defaultRest,
          notes: ex.notes,
          imageUrl: ex.imageUrl,
        })
        .returning();

      exerciseIdMap[ex.name] = inserted.id;
      console.log(`  + Ejercicio creado: ${ex.name} [${ex.muscleGroup}]`);
    }

    console.log(`\nEjercicios procesados: ${Object.keys(exerciseIdMap).length}\n`);

    // ── Step 2: Seed Routines ───────────────────────────────────────────────
    for (const routine of routines) {
      // Check if routine already exists
      const existingRoutine = await db
        .select()
        .from(schema.routines)
        .where(
          and(
            eq(schema.routines.gymId, gym.id),
            eq(schema.routines.name, routine.name)
          )
        );

      if (existingRoutine.length > 0) {
        console.log(`  ✓ Rutina ya existe: ${routine.name}`);
        continue;
      }

      const [insertedRoutine] = await db
        .insert(schema.routines)
        .values({
          gymId: gym.id,
          name: routine.name,
          description: routine.description,
          dayLabel: routine.dayLabel,
        })
        .returning();

      console.log(`  + Rutina creada: ${routine.name}`);

      // Insert exercises into routine
      for (let i = 0; i < routine.exercises.length; i++) {
        const re = routine.exercises[i];
        const exerciseId = exerciseIdMap[re.exerciseName];

        if (!exerciseId) {
          console.warn(
            `    ! Ejercicio no encontrado: "${re.exerciseName}" — omitiendo.`
          );
          continue;
        }

        await db.insert(schema.routineExercises).values({
          routineId: insertedRoutine.id,
          exerciseId,
          sortOrder: i,
          sets: re.sets ?? null,
          rest: re.rest ?? null,
          notes: re.notes ?? null,
        });
      }

      console.log(
        `    -> ${routine.exercises.length} ejercicios asignados a la rutina.`
      );
    }

    // ── Step 3: Seed for second gym if exists ───────────────────────────────
    if (allGyms.length > 1) {
      const gym2 = allGyms[1];
      console.log(`\nRepitiendo rutinas para: ${gym2.name} (${gym2.id})\n`);

      for (const routine of routines) {
        const existingRoutine = await db
          .select()
          .from(schema.routines)
          .where(
            and(
              eq(schema.routines.gymId, gym2.id),
              eq(schema.routines.name, routine.name)
            )
          );

        if (existingRoutine.length > 0) {
          console.log(`  ✓ Ya existe: ${routine.name}`);
          continue;
        }

        const [insertedRoutine] = await db
          .insert(schema.routines)
          .values({
            gymId: gym2.id,
            name: routine.name,
            description: routine.description,
            dayLabel: routine.dayLabel,
          })
          .returning();

        for (let i = 0; i < routine.exercises.length; i++) {
          const re = routine.exercises[i];
          const exerciseId = exerciseIdMap[re.exerciseName];
          if (!exerciseId) continue;

          await db.insert(schema.routineExercises).values({
            routineId: insertedRoutine.id,
            exerciseId,
            sortOrder: i,
            sets: re.sets ?? null,
            rest: re.rest ?? null,
            notes: re.notes ?? null,
          });
        }

        console.log(`  + Rutina duplicada: ${routine.name}`);
      }
    }

    console.log("\nSeed completado exitosamente.\n");
  } catch (error) {
    console.error("Error durante el seed:", error);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seedExercisesAndRoutines();
