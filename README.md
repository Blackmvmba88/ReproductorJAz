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
