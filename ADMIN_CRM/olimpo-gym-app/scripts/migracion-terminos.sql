-- ═══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Términos de Uso / Consentimiento de Riesgo (versionado)
-- Pegar y ejecutar COMPLETO en: Neon Console → SQL Editor → Run
-- Idempotente: si ya corriste esto antes, no duplica nada.
-- ═══════════════════════════════════════════════════════════════════

-- Columnas de aceptación en members
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS terms_accepted_version integer,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp;

-- Tabla de documentos legales versionados
CREATE TABLE IF NOT EXISTS legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  version integer NOT NULL,
  title varchar(255) NOT NULL,
  content_html text NOT NULL,
  published_by uuid REFERENCES system_users(id),
  created_at timestamp DEFAULT now() NOT NULL
);

-- Versión 1: consentimiento informado y términos de uso (editable después
-- desde el CRM en Configuración → Términos Legales; publicar ahí crea la v2)
INSERT INTO legal_documents (version, title, content_html)
SELECT 1, 'Consentimiento Informado y Términos de Uso', '<p style="color:#f0b429;font-weight:700;text-align:center;">AQUARIUS GYM</p>
<h2>Consentimiento Informado, Aceptación de Riesgo y Términos de Uso</h2>
<p><em>Última actualización: 7 de agosto de 2026</em></p>

<p>Antes de usar las instalaciones de Aquarius Gym y esta aplicación móvil, lee completo este documento. Al presionar <strong>"Acepto"</strong> confirmas que lo leíste, lo entendiste, y que participas en las actividades del gimnasio de forma voluntaria y bajo tu propia responsabilidad, en los términos aquí descritos.</p>

<h3>1. Reconocimiento y aceptación de riesgos</h3>
<p>El ejercicio físico y el uso de equipo de gimnasio conllevan riesgos inherentes, incluso cuando se toman precauciones razonables. Reconozco que estos riesgos incluyen, entre otros:</p>
<ul>
  <li>Desgarres musculares, esguinces, luxaciones y fracturas</li>
  <li>Lesiones de espalda, cuello o articulaciones por mal uso del equipo o técnica incorrecta</li>
  <li>Eventos cardiovasculares (mareo, desmayo, arritmias, en casos graves infarto)</li>
  <li>Golpes o accidentes por caída de pesas, mal uso de máquinas, o colisión con otros usuarios</li>
  <li>Agravamiento de lesiones o condiciones médicas preexistentes</li>
</ul>
<p>Acepto voluntariamente estos riesgos como parte normal de entrenar en un gimnasio.</p>

<h3>2. Confirmación de mi condición física</h3>
<p>Declaro que:</p>
<ul>
  <li>Me encuentro en condiciones físicas adecuadas para realizar actividad física, o he consultado con un médico antes de iniciar</li>
  <li>Informaré al personal de Aquarius Gym sobre cualquier condición médica, lesión, embarazo u otra circunstancia relevante para mi seguridad</li>
  <li>Detendré cualquier ejercicio de inmediato si siento dolor, mareo, falta de aire u otro síntoma anormal, y buscaré atención médica si es necesario</li>
  <li>Las rutinas y ejercicios sugeridos en esta aplicación son de carácter informativo general y <strong>no sustituyen la evaluación de un médico, fisioterapeuta o entrenador certificado</strong>. Debo adaptar cualquier ejercicio a mi propia condición y límites</li>
</ul>

<h3>3. Reglas de uso y conducta</h3>
<ul>
  <li>Debo usar cada máquina y equipo según las instrucciones y la técnica correcta; si tengo dudas, debo pedir ayuda al personal antes de usarlo</li>
  <li>Debo regresar las pesas y el equipo a su lugar después de usarlo, y reportar cualquier equipo dañado</li>
  <li>Debo usar vestimenta y calzado deportivo adecuado</li>
  <li>Debo mantener una distancia y comportamiento respetuoso hacia otros usuarios; el acoso o la conducta agresiva son causa de cancelación de membresía sin reembolso</li>
  <li>El uso de celular durante el uso de máquinas debe ser breve, evitando bloquear el paso o distraer a otros usuarios</li>
  <li>Mi carné/código de acceso es personal e intransferible; no debo prestarlo a terceros</li>
</ul>

<h3>4. Menores de edad</h3>
<p>Si el miembro es menor de edad, la inscripción y este consentimiento deben ser autorizados y firmados por su padre, madre o tutor legal, quien asume la responsabilidad de supervisión correspondiente.</p>

<h3>5. Datos personales, biométricos y de salud</h3>
<p>Para brindarte el servicio, Aquarius Gym recopila y almacena:</p>
<ul>
  <li>Datos de identificación y contacto (nombre, teléfono, correo, dirección, contacto de emergencia)</li>
  <li>Datos biométricos de huella dactilar, únicamente para registrar tu asistencia al gimnasio</li>
  <li>Medidas corporales y fotos de progreso que tú decidas registrar en la aplicación</li>
  <li>Historial de pagos, membresía y asistencia</li>
</ul>
<p>Autorizo el uso de estos datos exclusivamente para la gestión de mi membresía, control de acceso, seguimiento de mi progreso físico y comunicación relacionada con el servicio (recordatorios de pago, anuncios, notificaciones). Aquarius Gym no venderá ni compartirá mis datos personales o biométricos con terceros ajenos a la operación del gimnasio, salvo que la ley lo requiera. Puedo solicitar la eliminación de mi huella dactilar y datos personales al finalizar mi membresía, contactando directamente a mi sede.</p>

<h3>6. Responsabilidad</h3>
<p>Entiendo que Aquarius Gym mantiene sus instalaciones y equipo en condiciones razonables de seguridad y seguirá haciéndolo. Asumo la responsabilidad por lesiones que resulten de:</p>
<ul>
  <li>Mi propia negligencia, imprudencia o mal uso del equipo</li>
  <li>No seguir las instrucciones del personal o las indicaciones de uso del equipo</li>
  <li>No informar sobre una condición médica relevante</li>
  <li>Realizar ejercicios de las rutinas de la app sin la técnica adecuada o fuera de mis capacidades físicas</li>
</ul>
<p>Este documento no exime a Aquarius Gym de responsabilidad por negligencia grave, dolo, o incumplimiento de sus obligaciones esenciales de mantener instalaciones y equipo en condiciones seguras, conforme a la Ley de Protección al Consumidor y Usuario de Guatemala (Decreto 6-2003).</p>

<h3>7. Objetos personales</h3>
<p>Aquarius Gym no se hace responsable por la pérdida, robo o daño de objetos personales dejados en las instalaciones, salvo negligencia comprobada del personal.</p>

<h3>8. Vigencia y actualizaciones</h3>
<p>Aquarius Gym podrá actualizar este documento cuando sea necesario. Si se publica una nueva versión, se te pedirá aceptarla nuevamente antes de continuar usando la aplicación. La fecha de tu aceptación queda registrada.</p>

<h3>9. Ley aplicable</h3>
<p>Este documento se rige por las leyes de la República de Guatemala. Cualquier disputa se someterá a los tribunales competentes de Guatemala.</p>

<hr>
<p style="font-size:12px;color:#888;">
<strong>Aviso:</strong> este documento es una plantilla de referencia basada en prácticas estándar de la industria del fitness y en la Ley de Protección al Consumidor y Usuario de Guatemala (Decreto 6-2003). No constituye asesoría legal. Se recomienda que sea revisado y adaptado por un abogado guatemalteco antes de considerarse una protección legal completa para el negocio.
</p>
'
WHERE NOT EXISTS (SELECT 1 FROM legal_documents WHERE version = 1);

-- Verificación
SELECT version, title, length(content_html) AS caracteres, created_at FROM legal_documents ORDER BY version;
