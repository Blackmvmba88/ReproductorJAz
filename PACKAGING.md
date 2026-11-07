# Jasvith · distribución

El proyecto es una app web React/Vite con audio local y telemetría opcional por WebSocket. El tema **Jasvith Neon** se selecciona desde la interfaz y queda guardado en el navegador.

## Docker (web + WebSocket)

Desde la raíz del repositorio:

```bash
docker compose up --build
```

Abre http://localhost:8080. Nginx enruta `/ws` y `/api` al servicio realtime. El archivo local no requiere WebSocket para sonar.

## macOS (.dmg)

En una Mac con Node 24:

```bash
npm ci --prefix web
npm run build --prefix web
npm install --prefix desktop
npm run icon --prefix desktop
npm run dist:mac --prefix desktop
```

Resultado previsto: `release/Jasvith-*.dmg`. El DMG generado sin certificado de Developer ID no está firmado ni notarizado. macOS puede requerir autorización explícita para abrirlo. La versión de escritorio reproduce archivos locales y deja la telemetría WebSocket desconectada.

## Android (.apk de pruebas)

En una máquina con Android SDK, Java 21 y Node 24:

```bash
cd web
npm ci
npm install --no-save @capacitor/core@7 @capacitor/cli@7 @capacitor/android@7
npm run build
npx cap add android
npx cap sync android
cd android
bash gradlew assembleDebug
```

Resultado previsto: `web/android/app/build/outputs/apk/debug/app-debug.apk`. Es una APK **debug** para instalación manual, no una versión firmada de Play Store. La selección de archivos de audio debe verificarse en Android WebView.

## GitHub Actions

El workflow `.github/workflows/jasvith-packages.yml` ofrece jobs para DMG (macOS) y APK debug (Linux). Lánzalo manualmente desde Actions una vez integrada la rama. No incluye claves de firma ni publicación a tiendas.

## Ícono

El ícono fuente `web/public/jasvith-icon.svg` se usa en la web y se convierte a PNG de 1024 px con `npm run icon --prefix desktop` para Electron. La generación de íconos adaptativos Android aún queda pendiente para la fase de publicación.

## Estado

Configuraciones creadas, pero los instaladores y su comportamiento deben validarse en los runners y en dispositivos reales antes de distribución pública.
