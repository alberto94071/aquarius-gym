/**
 * Seed: Más contenido motivacional — Tips, Artículos y Noticias
 * Run: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-home-content2.ts
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { homeContent } from "../src/db/schema";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const CONTENT: Array<{
  type: "video" | "article" | "tip" | "image" | "notice";
  title: string;
  body?: string;
  imageUrl?: string;
  sortOrder: number;
  pinned?: boolean;
}> = [

  // ─── MÁS TIPS ──────────────────────────────────────────────────────────────

  {
    type: "tip",
    title: "El músculo no se construye en el gym — se construye en la cocina",
    body: "Puedes entrenar 2 horas diarias, pero si no comes suficiente proteína y calorías, tu cuerpo no tiene los materiales para crecer. El entrenamiento es el estímulo. La comida es el material de construcción. Sin uno no funciona el otro.",
    sortOrder: 16,
  },
  {
    type: "tip",
    title: "Aprende a escuchar tu cuerpo",
    body: "Si llegas al gym y algo duele (articulaciones, tendones, músculos de un día anterior), no es debilidad escuchar esas señales — es inteligencia. Adapta el entrenamiento ese día. Un atleta consistente es el que evita lesiones, no el que las ignora.",
    sortOrder: 17,
  },
  {
    type: "tip",
    title: "Las sentadillas son el rey de los ejercicios",
    body: "La sentadilla activa glúteos, cuádriceps, isquiotibiales, espalda baja y core al mismo tiempo. Es el ejercicio que más hormona de crecimiento natural genera. Aprende a hacerla bien y hazla cada semana — transformará tu cuerpo.",
    sortOrder: 18,
  },
  {
    type: "tip",
    title: "No temas al peso muerto",
    body: "El peso muerto tiene mala fama injustificada. Hecho con técnica correcta fortalece toda la cadena posterior (espalda, glúteos, isquios) y es uno de los mejores indicadores de fuerza funcional. Empieza con poco peso, domina la postura y súbelo gradualmente.",
    sortOrder: 19,
  },
  {
    type: "tip",
    title: "La consistencia supera a la intensidad",
    body: "Mejor 3 días a la semana durante 12 meses seguidos que 6 días durante 3 semanas y luego abandonar. El cuerpo responde a la acumulación de estímulos en el tiempo. La disciplina construye el cuerpo que la motivación solo sueña.",
    sortOrder: 20,
  },
  {
    type: "tip",
    title: "Descanso activo: muévete sin destruirte",
    body: "Los días de descanso no significan quedarse en cama. Una caminata de 30 minutos, nadar suave o hacer yoga acelera la recuperación, mejora la circulación y mantiene el hábito de movimiento. El descanso activo es diferente al entrenamiento intenso.",
    sortOrder: 21,
  },
  {
    type: "tip",
    title: "Grasa corporal vs. peso total",
    body: "El objetivo real no es pesar menos — es tener menos grasa y más músculo. Dos personas pueden pesar 70kg: una con 30% de grasa y otra con 15%. La diferencia visual es enorme. Enfócate en tu composición corporal, no en el número de la báscula.",
    sortOrder: 22,
  },
  {
    type: "tip",
    title: "El plátano: el snack perfecto pre-entreno",
    body: "Rico en carbohidratos de absorción rápida, potasio (previene calambres) y magnesio. Cómelo 30-45 minutos antes de entrenar para energía sostenida. En Guatemala lo tenemos fresco, barato y disponible todo el año. No necesitas un gel de carbohidratos importado.",
    sortOrder: 23,
  },
  {
    type: "tip",
    title: "La postura en remo salva tu espalda",
    body: "En cualquier tipo de remo: pecho fuera, hombros hacia atrás y abajo, core activado. El jalón viene de los codos, no de las manos. Si sientes que tus bíceps se fatigan antes que tu espalda, estás haciendo el movimiento con brazos, no con espalda. Corrige la técnica.",
    sortOrder: 24,
  },
  {
    type: "tip",
    title: "El frío post-entreno sí funciona",
    body: "Una ducha fría de 2-3 minutos después de entrenar reduce la inflamación muscular, mejora la recuperación y aumenta el estado de alerta. No tienes que aguantar agua helada — agua fresca es suficiente. Tu cuerpo te lo agradece.",
    sortOrder: 25,
  },
  {
    type: "tip",
    title: "Varía tu entrenamiento cada 4-6 semanas",
    body: "El cuerpo se adapta al mismo estímulo en 4-6 semanas. Después de ese punto, el progreso se estanca. Cambia el orden de los ejercicios, el número de series/reps, el tiempo de descanso o los ángulos de trabajo. La variedad mantiene los avances.",
    sortOrder: 26,
  },
  {
    type: "tip",
    title: "El core no es solo el abdomen",
    body: "El core incluye abdominales, oblicuos, suelo pélvico, multífidos (espalda baja) y diafragma. Todos trabajan juntos para estabilizar la columna. Un core fuerte mejora TODOS tus levantamientos y previene el dolor de espalda. Incluye plancha, dead bug y pallof press.",
    sortOrder: 27,
  },
  {
    type: "tip",
    title: "Fuerza vs. hipertrofia: ¿cuál elegir?",
    body: "Fuerza: 1-5 repeticiones con peso muy alto, descansos largos (3-5 min). Hipertrofia (músculo): 6-12 reps con peso moderado-alto, descansos de 60-90 seg. Resistencia muscular: 15+ reps, descansos cortos. Para la mayoría de personas, 8-12 reps es el rango ideal para ver cambios visuales.",
    sortOrder: 28,
  },
  {
    type: "tip",
    title: "No descuides el entrenamiento de agarre",
    body: "El agarre es el eslabón débil en jalones, remos y peso muerto. Fortalece el agarre con ejercicios como cargadas con mancuernas, jalón con toalla o simplemente aguantar la barra más tiempo. Un agarre fuerte = más peso en todos los ejercicios de tracción.",
    sortOrder: 29,
  },
  {
    type: "tip",
    title: "Cuándo tomar proteína importa menos de lo que crees",
    body: "La ventana anabólica post-entreno existe pero es más amplia de lo que se dice: tienes 1-2 horas para comer, no 30 minutos. Lo más importante es el total de proteína del día (1.6-2g/kg). Si comes bien durante el día, no entres en pánico si no tienes tu batido justo al terminar.",
    sortOrder: 30,
  },

  // ─── MÁS ARTÍCULOS ─────────────────────────────────────────────────────────

  {
    type: "article",
    title: "Guía de nutrición para el miembro de Aquarius Gym",
    body: "Para la mayoría de personas que entrenan 3-4 veces por semana con objetivo de composición corporal:\n\n✅ Proteína: 1.6-2g por kg de peso (huevo, pollo, frijol, atún, leche)\n✅ Carbohidratos: 3-5g/kg en días de entrenamiento (arroz, avena, plátano, tortilla)\n✅ Grasas saludables: aguacate, aceite de oliva, nueces\n✅ Agua: mínimo 2.5 litros diarios\n\nNo necesitas suplementos para empezar. Domina estos fundamentos y verás resultados en 8-12 semanas.",
    sortOrder: 31,
  },
  {
    type: "article",
    title: "¿Por qué los hombres y mujeres deben entrenar igual?",
    body: "Mito: las mujeres deben levantar poco peso para no 'ponerse como hombres'. Realidad: las mujeres producen 10-20 veces menos testosterona que los hombres, por lo que ganar músculo voluminoso es biológicamente muy difícil para ellas.\n\nLevantar peso pesado para las mujeres significa:\n• Más tono muscular y definición\n• Mayor metabolismo (quema más grasa en reposo)\n• Huesos más densos (previene osteoporosis)\n• Mejor postura y reducción de dolor de espalda\n\nLas rutinas de Aquarius Gym están diseñadas para funcionar para todos, independientemente del género.",
    sortOrder: 32,
  },
  {
    type: "article",
    title: "Cómo dormir mejor para recuperarte más rápido",
    body: "El sueño es la herramienta de recuperación más poderosa. Para maximizarlo:\n\n1. Duerme y despierta a la misma hora todos los días (incluso fines de semana)\n2. No uses pantallas 30 min antes de dormir — la luz azul suprime la melatonina\n3. La habitación debe estar oscura y fresca (18-20°C es ideal)\n4. No entrenes intenso 2 horas antes de dormir — el cortisol te mantiene despierto\n5. Evita cafeína después de las 2pm\n6. Considera magnesio antes de dormir — mejora la calidad del sueño profundo",
    sortOrder: 33,
  },
  {
    type: "article",
    title: "El síndrome del principiante: por qué los primeros 6 meses son los mejores",
    body: "Cuando empiezas a entrenar sin experiencia previa, tu cuerpo responde al estímulo de forma extraordinaria. Los primeros 3-6 meses puedes ganar fuerza Y músculo al mismo tiempo — algo que atletas avanzados ya no pueden hacer.\n\nEsto se llama 'ganancias del principiante' y es la ventana más productiva de tu vida atlética. Aprovéchala:\n• Entrena consistentemente\n• Come suficiente proteína\n• Duerme 8 horas\n• No te saltes entrenamientos\n\nDespués de estos 6 meses, el progreso se vuelve más lento y requiere más planificación. Por eso, ¡comienza ahora y no desperdicies esta ventana!",
    sortOrder: 34,
  },
  {
    type: "article",
    title: "Lesiones comunes en el gym y cómo evitarlas",
    body: "Las 5 lesiones más comunes en el gimnasio y cómo prevenirlas:\n\n1. Dolor lumbar: Causa — mala técnica en sentadilla/peso muerto. Prevención — aprende la postura correcta, fortalece el core.\n\n2. Tendinitis de rodilla: Causa — aumentar peso/volumen demasiado rápido. Prevención — progresión gradual, fortalecer cuádriceps y glúteos.\n\n3. Lesión de manguito rotador (hombro): Causa — demasiado press vertical sin trabajo de estabilizadores. Prevención — incluye face pulls y trabajo de rotadores externos.\n\n4. Codo de tenista: Causa — agarre fuerte repetitivo. Prevención — fortalece el agarre gradualmente, estira los antebrazos.\n\n5. Distensión muscular: Causa — saltarse el calentamiento o forzar rangos de movimiento fríos. Prevención — 5-10 minutos de calentamiento SIEMPRE.",
    sortOrder: 35,
  },
  {
    type: "article",
    title: "Cómo hacer crecer glúteos: la guía definitiva",
    body: "El glúteo mayor es el músculo más grande del cuerpo. Para desarrollarlo efectivamente:\n\nEjercicios clave (en orden de efectividad):\n1. Hip thrust con barra — el ejercicio #1 para glúteos\n2. Sentadilla búlgara (split squat)\n3. Peso muerto rumano — énfasis en isquiotibiales y glúteo\n4. Sentadilla con barra, pausa abajo\n5. Patada de glúteo en cable\n\nClaves adicionales:\n• Activa el glúteo ANTES del ejercicio (glute bridge sin peso x 20 reps)\n• Pausa 1 segundo en contracción máxima\n• Progresión de peso constante\n• 3-4 sesiones de glúteo por semana\n• Come suficiente proteína (el músculo necesita material)",
    sortOrder: 36,
  },
  {
    type: "article",
    title: "Hidratación durante el entrenamiento: más importante de lo que crees",
    body: "La deshidratación durante el ejercicio reduce el rendimiento significativamente:\n\n• -1% deshidratación: reducción del 5-8% en rendimiento\n• -2%: reducción hasta 20% de fuerza y resistencia\n• -3%: riesgo de calambres y mareos\n\nProtocolo de hidratación:\n✓ Antes: 500ml de agua 1-2 horas antes de entrenar\n✓ Durante: 150-250ml cada 15-20 minutos\n✓ Después: 500-750ml por cada kg de peso perdido durante el ejercicio\n\nSi sudas mucho, agrega una pizca de sal al agua — repone el sodio perdido y mejora la absorción de agua a nivel celular.",
    sortOrder: 37,
  },
  {
    type: "article",
    title: "Entrenamiento en ayunas: ¿mito o realidad?",
    body: "El entrenamiento en ayunas (generalmente por la mañana antes del desayuno) tiene tanto defensores como críticos. La verdad es matizada:\n\nSÍ funciona para:\n• Cardio de baja intensidad (caminar, bicicleta suave)\n• Personas que simplemente prefieren entrenar así\n• Pérdida de grasa a largo plazo (evidencia moderada)\n\nNO es ideal para:\n• Entrenamiento de fuerza de alta intensidad\n• Construir músculo activamente\n• Personas que se marean sin comer\n\nVeredicto: si te sientes bien entrenando en ayunas, hazlo. Si notas bajón de energía o rendimiento, come algo ligero 30-60 minutos antes.",
    sortOrder: 38,
  },

  // ─── NOTICIAS/AVISOS EJEMPLO ────────────────────────────────────────────────

  {
    type: "notice",
    title: "¡Bienvenido a Aquarius Gym!",
    body: "<h2>¡Gracias por unirte a nuestra familia!</h2><p>En <b>Aquarius Gym</b> creemos que cada persona tiene el potencial de alcanzar su mejor versión. Nuestro equipo está aquí para apoyarte en cada paso del camino.</p><h3>¿Qué incluye tu membresía?</h3><ul><li>Acceso ilimitado a todas las instalaciones</li><li>Rutina personalizada asignada por tu coach</li><li>Seguimiento de tu progreso en la app</li><li>Contenido educativo y motivacional</li></ul><p style='color:#00D4E8;font-weight:bold;'>Entrena sin límites. ¡Aquarius te espera!</p>",
    pinned: true,
    sortOrder: 0,
  },
  {
    type: "notice",
    title: "Horarios del Gimnasio",
    body: "<h2>Horarios de Atención</h2><p><b>Lunes a Viernes:</b> 5:00am – 9:00pm</p><p><b>Sábados:</b> 6:00am – 6:00pm</p><p><b>Domingos:</b> 7:00am – 2:00pm</p><hr/><p>En días feriados nacionales el horario puede variar. Te notificaremos con anticipación por este medio.</p>",
    pinned: false,
    sortOrder: 1,
  },
  {
    type: "notice",
    title: "Reglas de uso del gimnasio",
    body: "<h2>Normas para una mejor experiencia</h2><ul><li><b>Devuelve los pesos</b> a su lugar después de usarlos</li><li><b>Limpia el equipo</b> con el desinfectante disponible después de cada uso</li><li><b>Trae tu toalla</b> para los bancos y máquinas</li><li>Respeta los turnos en equipos muy solicitados</li><li><b>No grabes</b> a otras personas sin su consentimiento</li><li>Mantén el volumen de tus audífonos para no molestar</li></ul><p>El respeto mutuo hace que todos disfrutemos mejor el espacio.</p>",
    pinned: false,
    sortOrder: 2,
  },
];

async function main() {
  console.log("\nSeeding additional home content...\n");

  const existing = await db.select({ title: homeContent.title }).from(homeContent);
  const existingTitles = new Set(existing.map((e) => e.title));

  let created = 0;
  let skipped = 0;

  for (const item of CONTENT) {
    if (existingTitles.has(item.title)) {
      console.log(`  ~ Existe: "${item.title}" — omitiendo`);
      skipped++;
      continue;
    }

    await db.insert(homeContent).values({
      gymId: null,
      type: item.type,
      title: item.title,
      body: item.body ?? null,
      url: null,
      imageUrl: item.imageUrl ?? null,
      published: true,
      pinned: item.pinned ?? false,
      sortOrder: item.sortOrder,
    });

    const icon = item.type === "tip" ? "💡" : item.type === "article" ? "📄" : item.type === "notice" ? "📌" : "🖼️";
    console.log(`  + ${icon} [${item.type}] "${item.title}"`);
    created++;
  }

  console.log(`\n✔ Completado: ${created} creados, ${skipped} omitidos.\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
