# Configuración de Google Sign-In y Notificaciones Push — Aquarius Gym

Esta guía explica **por qué fallan hoy** el login con Google y las notificaciones,
y qué configurar exactamente para que funcionen en producción.

---

## Lo primero que hay que entender: Expo Go NO sirve para probar esto

La app "sol" de Expo (Expo Go) es solo un visor genérico para desarrollo. Desde el
SDK 53 de Expo tiene dos limitaciones que te afectan directamente:

1. **No soporta notificaciones push remotas en Android.** Aunque el código esté
   perfecto (y lo está), la push jamás llegará dentro de Expo Go.
2. **No incluye el módulo nativo de Google Sign-In** (`@react-native-google-signin`),
   así que el botón de Google no puede funcionar ahí.

**La solución es usar un development build propio en lugar de Expo Go:**

```bash
cd olimpo-gym-mobile
npx eas build --profile development --platform android
```

Eso genera un APK instalable en tu teléfono que se comporta como la app real
(con push y Google funcionando), pero con recarga en vivo para desarrollo.
El proyecto ya tiene `expo-dev-client` instalado, así que no falta nada en código.

---

## Google Sign-In: configuración completa

### Cómo funciona la cadena

```
App (webClientId) → Google devuelve idToken → API del CRM verifica que
el "aud" del token == GOOGLE_CLIENT_ID_MOBILE → busca el email en members
```

Si cualquiera de esos IDs no coincide, el login falla.

### Paso 1 — Google Cloud Console (console.cloud.google.com)

En el proyecto de Google Cloud, en **APIs y servicios → Credenciales**, necesitas
DOS OAuth Client IDs:

| Tipo | Para qué | Dónde va |
|---|---|---|
| **Web** | Es el `webClientId` que genera el idToken | `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (eas.json) **y** `GOOGLE_CLIENT_ID_MOBILE` (Vercel) — **el mismo valor en ambos lados** |
| **Android** | Autoriza a TU app (package + firma) a usar Google Sign-In | Solo debe existir en Google Cloud; no se pega en ningún lado |

### Paso 2 — El OAuth client de Android necesita el package name y el SHA-1

- **Package name:** el de `app.json` → hoy es `com.olimpogym.mobile`
  (si lo cambias a `com.aquariusgym.mobile` antes de publicar, hay que crear el
  client de Android de nuevo con el package nuevo).
- **SHA-1:** la huella del keystore con que EAS firma tu app. La obtienes con:

```bash
npx eas credentials -p android
# → selecciona el perfil → verás "SHA1 Fingerprint"
```

⚠️ El SHA-1 del build de **desarrollo** y el de **producción** pueden ser
distintos. Si Google da error `DEVELOPER_ERROR` (código 10), es casi siempre
esto: el SHA-1 o el package del OAuth client de Android no coinciden con el
APK instalado. Puedes agregar varios clients de Android (uno por keystore).

### Paso 3 — Variables en Vercel (CRM)

- `GOOGLE_CLIENT_ID_MOBILE` = el client ID **Web** (idéntico a
  `EXPO_PUBLIC_GOOGLE_CLIENT_ID` de eas.json). Desde el último cambio de
  seguridad, si falta esta variable el login con Google **se rechaza** en
  producción — es obligatoria.

### Paso 4 — Pantalla de consentimiento OAuth

En **OAuth consent screen**: tipo *External*, estado **En producción** (publicada).
Si queda en "Testing", solo los correos de prueba registrados podrán entrar y
los demás miembros verán un error de acceso.

### Ya corregido en esta rama

El perfil `production` de `eas.json` **no tenía variables de entorno**: el APK
de producción salía apuntando a `http://localhost:3000` y con el client ID
vacío — el login con Google no podía funcionar en ese build. Ya quedó igual
que los perfiles de desarrollo.

---

## Notificaciones Push: configuración completa

El código de la app y del CRM ya está bien (token de Expo se registra al hacer
login, el panel envía por la API de Expo). Lo que falta es **entorno**:

### Para probar YA (sin más configuración)

1. `npx eas build --profile development --platform android`
2. Instala ese APK en tu teléfono (no Expo Go).
3. Inicia sesión con un miembro → acepta el permiso de notificaciones.
4. Desde el panel crea un anuncio con "enviar push" → debe llegar.

### Para builds de producción (APK/AAB de la tienda) hace falta Firebase (FCM)

Expo entrega las push en Android a través de Firebase Cloud Messaging:

1. En [console.firebase.google.com](https://console.firebase.google.com) crea un
   proyecto (puede ser el mismo proyecto de Google Cloud del OAuth).
2. Agrega una app **Android** con el package name exacto de `app.json`.
3. Descarga **google-services.json** y colócalo en `olimpo-gym-mobile/`.
4. En `app.json` agrega dentro de `"android"`:
   ```json
   "googleServicesFile": "./google-services.json"
   ```
5. Sube la llave de servicio FCM V1 a EAS:
   ```bash
   npx eas credentials -p android
   # → Push Notifications → Upload a service account key
   ```
   (La llave se genera en Firebase → Configuración del proyecto → Cuentas de
   servicio → Generar nueva clave privada.)
6. Vuelve a compilar. Sin estos pasos, las push **no llegan en builds de
   producción** aunque todo lo demás esté bien.

### Checklist rápido cuando "no llegan las push"

- [ ] ¿Estás probando en Expo Go? → No va a funcionar nunca ahí.
- [ ] ¿El teléfono aceptó el permiso de notificaciones?
- [ ] ¿El miembro inició sesión después de instalar? (el token se registra al login)
- [ ] ¿Es build de producción sin FCM configurado? → pasos de Firebase arriba.
- [ ] Revisa los logs de Vercel: `[expo-push] Ticket error: ...` dice el motivo
      exacto (p. ej. `DeviceNotRegistered`).

### iOS (para después)

Publicar en iPhone requiere cuenta de Apple Developer ($99/año) y certificados
APNs que EAS configura solo (`eas credentials -p ios`). Recomendación: lanzar
primero Android, que es donde está la mayoría de miembros.

---

## Resumen de variables por entorno

**Vercel (CRM):**

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Neon |
| `AUTH_SECRET` | secret del panel |
| `MOBILE_JWT_SECRET` | `openssl rand -base64 48` |
| `GOOGLE_CLIENT_ID_MOBILE` | client ID **Web** de Google Cloud |

**eas.json (los 3 perfiles: development, preview y production):**

| Variable | Valor |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL del CRM en Vercel |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | client ID **Web** (mismo que arriba) |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID` | client ID Android (informativo) |
