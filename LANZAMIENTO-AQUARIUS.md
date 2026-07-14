# Lanzamiento de Aquarius Gym DESDE CERO (infraestructura propia)

Todo lo actual (Vercel `crm-olimpo-gym`, client IDs `41057349899-...`, proyecto
Expo `olimpo_gym`) es del lanzamiento de Olimpo. Aquarius se lanza con cuentas
y proyectos propios. Sigue los pasos EN ORDEN — cada uno usa valores del anterior.

> Usa una sola cuenta de Google para todo (Google Cloud, Firebase, Play Console),
> idealmente una del negocio, p. ej. tu Gmail o admin@aquariusgym.com.

---

## Paso 1 — Base de datos (Neon) · 10 min

1. En [neon.tech](https://neon.tech) crea un proyecto nuevo: **aquarius-gym**.
2. Copia el **connection string** (postgresql://...) → será `DATABASE_URL`.
3. En tu máquina, dentro de `ADMIN_CRM/olimpo-gym-app/`, crea `.env.local`:
   ```env
   DATABASE_URL=postgresql://...   (el de Neon)
   ADMIN_INITIAL_PASSWORD=una-contraseña-temporal
   ```
4. Crea las tablas y siembra sedes + admins:
   ```bash
   npm install
   npx drizzle-kit push        # crea todas las tablas del schema
   npm run db:reset -- --yes   # sedes Tacaná/Cuilco/San Marcos + admins
   ```

## Paso 2 — CRM en Vercel · 15 min

1. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo
   `alberto94071/aquarius-gym`.
2. **Root Directory:** `ADMIN_CRM/olimpo-gym-app` (¡importante!).
3. Variables de entorno (Settings → Environment Variables):

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | el de Neon (paso 1) |
   | `AUTH_SECRET` | genera con `openssl rand -base64 32` |
   | `MOBILE_JWT_SECRET` | genera con `openssl rand -base64 48` |
   | `CRON_SECRET` | genera con `openssl rand -base64 32` |
   | `GOOGLE_CLIENT_ID` | del paso 3 (vuelve aquí después) |
   | `GOOGLE_CLIENT_SECRET` | del paso 3 |
   | `GOOGLE_CLIENT_ID_MOBILE` | el MISMO valor que `GOOGLE_CLIENT_ID` |
   | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | de tu cuenta [cloudinary.com](https://cloudinary.com) (gratis) |
   | `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | preset *unsigned* creado en Cloudinary |

4. Deploy. Anota tu dominio, p. ej. `https://crm-aquarius-gym.vercel.app`
   → lo llamaremos **TU-CRM** en los pasos siguientes.

## Paso 3 — Google Cloud desde cero · 15 min

En [console.cloud.google.com](https://console.cloud.google.com):

1. **Nuevo proyecto:** "Aquarius Gym".
2. **APIs y servicios → Pantalla de consentimiento OAuth:**
   - Tipo **Externo**, nombre "Aquarius Gym", tu correo de soporte.
   - Al terminar: **PUBLICAR** la app (estado "En producción", no "Testing").
3. **Credenciales → Crear credenciales → ID de cliente OAuth → Aplicación web:**
   - Nombre: "Aquarius CRM + App"
   - URI de redireccionamiento autorizado:
     `https://TU-CRM.vercel.app/api/auth/callback/google`
   - Guarda el **Client ID** (termina en `.apps.googleusercontent.com`) y el
     **Client Secret** → van a Vercel (paso 2.3) y a `eas.json` (paso 6).
4. El **client de Android** se crea en el paso 5 (necesita el SHA-1 de EAS).

## Paso 4 — Expo/EAS desde cero · 10 min

1. Crea la cuenta del gym en [expo.dev](https://expo.dev) (anota el username).
2. En tu máquina:
   ```bash
   cd olimpo-gym-mobile
   npx expo login          # con la cuenta nueva
   ```
3. En `app.json` cambia `"owner": "olimpo_gym"` por tu username nuevo y borra
   el bloque `"extra"."eas"."projectId"` (Claude puede hacerlo si le pasas el username).
4. ```bash
   npx eas init            # crea el proyecto EAS nuevo y escribe el projectId
   ```

## Paso 5 — SHA-1, client Android y Firebase · 20 min

1. **SHA-1:**
   ```bash
   npx eas credentials -p android
   ```
   → elige el perfil → deja que EAS genere el keystore → copia el **SHA1 Fingerprint**.
2. **Google Cloud → Credenciales → ID de cliente OAuth → Android:**
   - Package: `com.aquariusgym.mobile`
   - SHA-1: el del punto 1
3. **Firebase** ([console.firebase.google.com](https://console.firebase.google.com)):
   - **Agregar proyecto** → selecciona el proyecto de Google Cloud "Aquarius Gym"
     ya existente (así queda todo unido).
   - **Agregar app → Android** → package `com.aquariusgym.mobile` →
     descarga **`google-services.json`** → colócalo en `olimpo-gym-mobile/`.
   - **Configuración del proyecto → Cuentas de servicio → Generar nueva clave
     privada** → descarga el JSON.
   - ```bash
     npx eas credentials -p android
     ```
     → **Push Notifications** → sube esa clave (FCM V1 service account key).

## Paso 6 — Actualizar el repo (lo puede hacer Claude)

Con los valores nuevos en mano, actualizar:

- `olimpo-gym-mobile/eas.json` (los 3 perfiles):
  - `EXPO_PUBLIC_API_URL` = `https://TU-CRM.vercel.app`
  - `EXPO_PUBLIC_GOOGLE_CLIENT_ID` = Client ID **Web** del paso 3
- `olimpo-gym-mobile/app.json`:
  - `owner` = username de Expo nuevo (y projectId nuevo de `eas init`)
  - agregar `"googleServicesFile": "./google-services.json"` en `"android"`

**Pásale a Claude:** el dominio de Vercel, el Client ID web, tu username de
Expo y el `google-services.json` — y deja el repo listo.

## Paso 7 — Build y prueba

```bash
npx eas build --profile development --platform android
```
Instala el APK en tu teléfono (NO Expo Go) y prueba:

- [ ] Login con Google (con el correo de un miembro inscrito)
- [ ] Login con correo/contraseña
- [ ] Crear anuncio con push desde el panel → llega al teléfono
- [ ] Registrar pago → la app refleja "activo" y el nuevo vencimiento

Cuando todo pase:
```bash
npx eas build --profile production --platform android
```
→ genera el AAB para **Google Play Console** ($25 una sola vez): crea la ficha,
sube capturas, política de privacidad (obligatoria) y publica primero en
**prueba interna** con los correos del equipo.

---

## Resumen de qué valor va en qué lugar

| Valor | Se genera en | Se usa en |
|---|---|---|
| `DATABASE_URL` | Neon | Vercel |
| Client ID **Web** + Secret | Google Cloud (paso 3) | Vercel (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CLIENT_ID_MOBILE`) y `eas.json` (`EXPO_PUBLIC_GOOGLE_CLIENT_ID`) |
| Client **Android** (package + SHA-1) | Google Cloud (paso 5) | solo existe en Google Cloud |
| `google-services.json` | Firebase | carpeta `olimpo-gym-mobile/` + `app.json` |
| Clave FCM V1 | Firebase | EAS (`eas credentials`) |
| SHA-1 | EAS | client Android de Google Cloud |
