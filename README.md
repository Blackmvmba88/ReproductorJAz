# 🐍 ReproductorJAz — BLACKMAMBA AUDIO ENGINE

Reproductor de audio multiformato con **osciloscopio**, **vúmetros estéreo** y **analizador FFT** en tiempo real. Proyecto de BlackMamba Corp.

## Estado

**MVP v0.1:** interfaz web local. Soporta archivos WAV, MP3, FLAC, OGG, AAC y otros formatos **cuando el navegador puede decodificarlos**. La compatibilidad depende del sistema y navegador. No se incluye FFmpeg ni conversión de formatos en esta versión.

## Ejecutar

El proyecto no requiere dependencias ni compilación. Abre `index.html` en un navegador moderno o utiliza un servidor local:

```bash
python3 -m http.server 8000
```

Visita `http://localhost:8000`. Selecciona **Abrir audio** y elige un archivo local. Los archivos permanecen en el equipo.

## Funcionalidades implementadas

- Reproducción, pausa, búsqueda, volumen y selección de archivos.
- Osciloscopio de muestras PCM estéreo, graficado por canal.
- Vúmetros Peak y RMS por canal expresados en dBFS.
- Espectro FFT del audio reproducido.
- Modo de prueba con generador sinusoidal a 440 Hz.
- Diseño adaptable y visualización con Canvas 2D.

### Arquitectura

```text
Archivo local -> HTMLAudioElement -> MediaElementAudioSourceNode
                                               |
                                        ChannelSplitterNode
                                               |
                                         AnalyserNode (L/R)
                                               |
                              osciloscopio + FFT + RMS/Peak
                                               |
                                         AudioDestination

Oscilador 440 Hz -----> GainNode -------> AudioDestination
```

La ruta principal se conecta una sola vez al destino; los nodos analizadores observan muestras sin duplicar el sonido. Los medidores miden muestras digitales, **no** un VU calibrado, True Peak ni LUFS.

### Matemáticas

`x(t) = A sin(2π f t + φ)`

`RMS = sqrt(sum(x[n]^2)/N)`

`Peak = max(abs(x[n]))`

`dBFS = 20 log10(amplitud)`, con silencio representado como `−∞`.

Las lecturas representan ventanas de análisis, no la totalidad del archivo.

## Próximos hitos

- Motor nativo C++20 con Qt 6, miniaudio y FFmpeg para soporte multiformato consistente.
- Medidores EBU R128, LUFS, True Peak y VU calibrado.
- FFT con selección de ventanas, espectrograma y modos XY.
- Biblioteca, listas de reproducción, etiquetas y MIDI con sintetizador.
- DSP: ecualizador paramétrico, limitador y filtros.
- Pruebas de audio y latencia automatizadas.

## Seguridad y privacidad

No hay backend ni subida de audio. El navegador carga archivos mediante un selector local. No se envían muestras a servidores.

**Licencia:** pendiente de decisión del titular. No se presume licencia MIT.

---
BlackMamba Corp · ReproductorJAz · 2026


## v0.2 · Personalización y JAz Sense

- Cuatro temas: Amethyst, Ocean, Ember y Emerald.
- Glassmorphism opcional, con desenfoque y transparencia; respeta movimiento reducido.
- Perfiles visuales Studio, Spotify, Winamp y Discord (inspiración de interfaz, sin integración con sus servicios).
- Preferencias guardadas localmente cuando el navegador lo permite.
- Repetición de pista funcional. El botón aleatorio conserva su estado, pero requiere una playlist para elegir archivos y **todavía no modifica el orden**.
- **JAz Sense**: reglas locales sobre peak, RMS, crest factor y distribución aproximada del espectro. Son sugerencias heurísticas, no IA generativa ni medición profesional.

### Autenticación (pendiente)

Google y otros proveedores requieren registro OAuth, origen/redirect HTTPS y un backend o proveedor de identidad para sesiones verificables. Esta versión local no presenta falsos accesos ni recopila credenciales. Próximo hito: arquitectura OAuth/OIDC con PKCE, sesiones seguras y gestión de cuentas.

## v0.3 experimental · React + WebSocket + Audio Health

La interfaz original `index.html` sigue funcionando de manera independiente. Se añade una **interfaz React experimental** y una **API WebSocket local**. La nueva interfaz todavía no alcanza paridad con el osciloscopio estéreo y FFT de la versión original.

Abre dos terminales desde la raíz del repositorio:

```bash
npm install --prefix server
npm start --prefix server
```

```bash
npm install --prefix web
npm run dev --prefix web
```

Abre la URL local que indique Vite (normalmente `http://127.0.0.1:5173`). Para comprobar la API: `http://127.0.0.1:8787/api/health`. El WebSocket está disponible en `/ws` a través del proxy de Vite.

### Contrato de eventos

- Cliente → servidor: `{"type":"ping","clientTime":...}`.
- Servidor → cliente: `{"type":"pong","clientTime":...,"serverTime":...}`.
- Cliente → servidor: `{"type":"telemetry","state":"playing","peak":0.5,"underruns":0}`.
- Servidor → clientes: telemetría validada y reducida. **No se transmiten muestras, música ni archivos.**

La API escucha únicamente en `127.0.0.1`. No habilites exposición pública sin HTTPS/WSS, autenticación, control de orígenes, autorización por sesión y limitación de frecuencia. El servidor experimental no autentica clientes y los estados de telemetría se difunden a todos los clientes conectados: no es apto para datos privados ni multiusuario.

### Latencia y continuidad

- `AudioContext({latencyHint:'playback'})` prioriza una reproducción fluida frente a la mínima latencia interactiva.
- `audio.preload='auto'` solicita precarga, sin garantizar un tamaño de buffer fijo.
- La interfaz muestra `baseLatency + outputLatency` si el navegador expone esos valores, tiempo de audio almacenado por delante de la reproducción, RTT del WebSocket y eventos `waiting` / `stalled`.
- El RTT corresponde a la red de control; **no mide la latencia de salida de audio**.
- El contador de interrupciones es orientativo; no representa una medición de underruns del hardware.
- No existe todavía motor gapless con doble deck, crossfade, ajuste automático de buffer ni reproducción remota. Esos son hitos futuros verificables.

### Pendientes de arquitectura

1. Preservar los visualizadores completos en React mediante módulos Canvas independientes.
2. Implementar playlist y doble deck con precarga de pista siguiente y crossfade opcional, medir discontinuidades reales.
3. Autenticación OIDC (Google y otros) con PKCE, sesiones seguras, protección de WebSocket y pruebas de autorización.
4. Rooms para sincronización multiusuario sin enviar audio por el canal de control.
