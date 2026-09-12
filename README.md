# DiscBox MP4

DiscBox MP4 es una app para TV pensada para reproducir una biblioteca personal de películas en formato MP4 desde un HDD o USB externo. La idea es tener una experiencia sencilla tipo streaming: portadas, detalles de cada película, selección de idioma, subtítulos externos y guardado de progreso, sin depender de menús DVD ni conversiones pesadas.

El proyecto nace como una alternativa ligera para organizar películas locales en televisores, usando una estructura clara de carpetas y archivos fáciles de editar.

## Características

- Biblioteca visual de películas.
- Reproducción directa de archivos MP4.
- Selección de idioma antes de iniciar la película.
- Soporte para subtítulos externos `.srt` y `.vtt`.
- Portadas personalizadas por película.
- Lectura de detalles desde archivos XML.
- Guardado de progreso por película.
- Interfaz diseñada para control remoto.
- Barra de reproducción con pausa, avance, retroceso y ajustes.
- Sistema simple de carpetas en HDD/USB.
- Pensado para funcionar sin copiar películas al almacenamiento interno de la TV.

## Compatibilidad

### Versión actual

La versión 1.0 está enfocada en televisores compatibles con apps web para TV, principalmente Samsung Tizen TV.

### Objetivo del proyecto

DiscBox MP4 está pensado para crecer como una app multiplataforma para:

- Samsung Tizen TV
- Roku
- Android TV / Google TV
- Navegador web como modo de prueba

Cada plataforma puede requerir una versión o empaquetado diferente, pero la estructura del HDD/USB y el sistema de biblioteca se mantienen iguales.

## Formato recomendado de video

Para mejor compatibilidad se recomienda usar:

| Tipo | Recomendado |
|---|---|
| Contenedor | `.mp4` |
| Video | H.264 / AVC |
| Audio | AAC |
| Subtítulos | `.srt` o `.vtt` en UTF-8 |
| Portadas | `.jpg`, `.jpeg` o `.png` |

También pueden funcionar otros codecs dependiendo de la TV o dispositivo, pero H.264 + AAC es la opción más segura.

## Estructura del HDD o USB

Todo debe ir dentro de una carpeta llamada `DiscBox` en la raíz del HDD/USB.

```text
DiscBox/
  MP4/
    Nombre de la Película/
      es.mp4
      en.mp4

  Covers/
    Nombre de la Película.jpg

  Subtitulos/
    Nombre de la Película/
      es.srt
      en.srt

  Detalles/
    Nombre de la Película.xml
