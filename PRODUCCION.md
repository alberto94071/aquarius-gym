# Checklist de lanzamiento a producción — Aquarius Gym

## 1. Resetear la base de datos y crear las sedes nuevas

Las sedes nuevas son **Tacaná (AGTC)**, **Cuilco (AGCU)** y **San Marcos (AGSM)**.
Los carnés se generan con la misma lógica: `AGTC-0000-0001`, etc.

```bash
cd ADMIN_CRM/olimpo-gym-app
# .env.local debe tener DATABASE_URL (producción) y ADMIN_INITIAL_PASSWORD
npm run db:reset
```

El script:
- Borra TODOS los datos (miembros, grupos, pagos, anuncios, rutinas, notificaciones).
- Crea las 3 sedes con precios base (Q150 mensual, Q400 trimestral, Q1500 anual, Q100 grupal) — ajustables después desde el panel en "Precios".
- Recrea los usuarios admin (`admin@aquariusgym.com` y `alberto.94071@gmail.com`) con la contraseña de `ADMIN_INITIAL_PASSWORD`. **Cámbiala después de entrar.**

## 2. Variables de entorno obligatorias en Vercel (CRM)

| Variable | Nota |
|---|---|
| `DATABASE_URL` | Conexión a Neon |
| `AUTH_SECRET` | Secret de NextAuth |
| `MOBILE_JWT_SECRET` | **Obligatorio**: ahora la app falla en producción si falta (antes usaba un secret de fallback inseguro). Genera uno con `openssl rand -base64 48` |
| `GOOGLE_CLIENT_ID_MOBILE` | **Obligatorio**: sin él, el login con Google se rechaza en producción (antes aceptaba tokens de cualquier app) |
| `ADMIN_INITIAL_PASSWORD` | Solo para correr `db:reset`; no hace falta en Vercel |

## 3. Seguridad que ya quedó implementada

- **Rate limit** en login: 10 intentos por IP y por cuenta cada 15 min (email/contraseña), 20 por IP en Google. Responde `429` con `Retry-After`. Es en memoria (por instancia serverless); si algún día se necesita límite global exacto, usar Upstash Redis.
- **JWT móvil**: expira a los 30 días (antes 90). El token se guarda en `SecureStore` (cifrado por el sistema operativo), no en texto plano.
- **Login con Google**: ahora exige que el token venga de NUESTRA app (valida `aud`) y que el email esté verificado.
- **Respuestas de auth** con `Cache-Control: no-store` para que ningún proxy cachee tokens.
- Los errores internos ya no se filtran al cliente (mensaje genérico + log en servidor).

## 4. App móvil — antes de subir a las tiendas

- [x] **Package/bundle id**: ya quedó como `com.aquariusgym.mobile` (Android e iOS) y el scheme de deep links como `aquariusgym`. Pendiente de tu lado: crear el OAuth client de **Android** en Google Cloud con este package + SHA-1, y usar este mismo package al registrar la app en Firebase (ver `CONFIGURACION.md`).
- [ ] `EXPO_PUBLIC_API_URL` apuntando al dominio de producción del CRM (https).
- [ ] `eas build --profile production --platform android` y probar el APK/AAB en dispositivo físico (login, push, pagos reflejados).
- [ ] Probar push notification real: crear anuncio con push desde el panel → debe llegar al teléfono.
- [ ] Íconos y splash ya con branding Aquarius (revisar `assets/`).
- [ ] Cuenta de Google Play Console ($25 una vez) y ficha de la app (descripción, capturas, política de privacidad — obligatoria porque la app maneja datos personales).

## 5. Caché y rendimiento (estado actual)

- La app **no cachea datos en disco**: cada pantalla consulta al API al abrirse (con pull-to-refresh). Para el volumen actual está bien y evita mostrar estados de pago desactualizados, que es lo más delicado en un gym.
- Se agregó **timeout de 15 s** y mensajes claros de "sin conexión" en el cliente HTTP de la app.
- Mejora futura (no bloqueante): cache local con `AsyncStorage` para mostrar el último estado conocido sin conexión, y `stale-while-revalidate` en anuncios.

## 6. Prueba end-to-end sugerida antes del lanzamiento

1. Correr `db:reset` → entrar al panel → verificar que solo existen las 3 sedes.
2. Crear una secretaria por sede (rol "Secretaria" + sede asignada).
3. Inscribir un miembro de prueba en Tacaná → verificar carné `AGTC-0000-0001`.
4. Login en la app móvil con ese miembro → ver membresía al día.
5. Registrar pago / dejar vencer → verificar estados (activo/mora).
6. Anuncio con push a una sola sede → confirmar que solo llega a esa sede.
