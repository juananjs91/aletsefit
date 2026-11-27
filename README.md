# ALETSE FIT · Rutinas y Dietas

App de entreno, nutrición y motivación con suscripción VIP (9,99 €/mes).

- `www/` → la app (HTML/JS). `www/config.js` → tus claves de Firebase y RevenueCat.
- `android/`, `ios/` → proyectos nativos (Capacitor).
- `docs/` → web pública: política de privacidad, borrar cuenta y **panel de administración** (`admin.html`).
- `firestore.rules` → reglas de seguridad de la base de datos (pégalas en Firebase).
- `.github/workflows/android.yml` → crea el `.aab` para Google Play desde GitHub › Actions.
- `codemagic.yaml` → versión de iPhone (fase 2).

Sin configuración de Firebase, la app arranca en modo prueba (datos solo en el móvil).
