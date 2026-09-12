# DiscBox MP4 1.0.0

Nueva base para Samsung TU7000 / Tizen 5.5. Creado por **JoshKo007**.

La aplicación reproduce el archivo MP4 completo directamente desde el HDD/USB mediante AVPlay. El idioma se elige abriendo la versión correspondiente. No genera fragmentos de vídeo, conversiones, copias de películas ni una caché de vídeo propia. El reproductor nativo administra la lectura y su búfer; no se puede prometer que cualquier archivo o disco funcionará sin interrupciones.

## Organizar el HDD

Crea `DiscBox` en la raíz del disco. Todas estas rutas están dentro de esa carpeta:

| Ruta de ejemplo | Uso |
| --- | --- |
| `MP4/El Graduado/es.mp4` | Película con audio principal en español |
| `MP4/El Graduado/en.mp4` | Película con audio principal en inglés |
| `Covers/El Graduado.jpg` | Portada vertical; también `.jpeg` o `.png` |
| `Subtitulos/El Graduado/es.srt` | Subtítulos españoles |
| `Subtitulos/El Graduado/en.vtt` | Subtítulos ingleses |
| `Detalles/El Graduado.xml` | Información de la película |

Cada carpeta dentro de MP4 representa una película. Puedes tener uno o varios MP4 por carpeta. El nombre de la carpeta es el título predeterminado; `<titulo>` en el XML permite cambiar el título mostrado. Las portadas, los XML y los subtítulos son opcionales. La búsqueda admite mayúsculas/minúsculas y nombres Unicode equivalentes. No agrupa películas de discos distintos.

Los nombres `es`, `en`, `es-MX`, `es-ES`, `Español`, `English`, `latino`, `fr`, `it`, etc. reciben etiquetas legibles. Un nombre diferente se muestra como nombre de edición. El XML permite dar una etiqueta personalizada. Cada archivo debe tener como audio principal el idioma que indica: esta versión elige archivos, no pistas internas de un MP4 multiaudio.

## Fichas y subtítulos

Abre **Herramientas_DiscBox/Crear_ficha.html** en tu computadora, llena los campos y descarga el XML. Colócalo en `DiscBox/Detalles` con el mismo nombre de la carpeta de la película. También se incluye una plantilla con etiquetas de idioma, subtítulos y capítulos. Se admiten los campos comunes de XML `<movie>`: title, originaltitle, year, runtime, genre, plot, director, actor/name, country y mpaa.

Los SRT/VTT deben estar en UTF-8. La app dibuja el texto siguiendo el tiempo del reproductor. En Ajustes puedes activarlos, apagarlos, cambiar el tamaño y ajustar el desfase en pasos de 0.25 s; un valor positivo los retrasa. Se admite texto básico, múltiples líneas y entradas superpuestas. Los estilos/posiciones avanzados de VTT y los formatos ASS, PGS o subtítulos incrustados no forman parte del selector. Si un subtítulo está dañado, se avisa y se permite reproducir sin él.

Un subtítulo debe corresponder a la misma edición/corte del vídeo. En XML, el atributo opcional `video="en.mp4"` limita ese subtítulo a un archivo específico. Los capítulos solo aparecen si hay tiempos declarados en el XML.

## Mando y reproducción

| Control | Acción |
| --- | --- |
| Flechas / OK en biblioteca | Navegar / abrir la ficha |
| Izquierda / derecha en una opción | Cambiar idioma o subtítulos |
| Arriba durante la película | Mostrar barra |
| Atrás durante la película | Abrir / cerrar ajustes |
| OK con barra oculta | Mostrar controles |
| Play/Pause | Pausar / continuar |
| Izquierda / derecha sobre la línea de tiempo | Saltar 10 segundos |
| MediaStop | Volver a la ficha |

La posición se guarda por archivo. **Continuar** reúne las películas pendientes. **Desde el inicio** permite ignorar la posición guardada. Para cambiar el archivo de idioma durante la película, elige **Elegir otro idioma**, selecciona el nuevo archivo y reproduce. Cada edición mantiene su propia posición, pues los cortes pueden diferir.

Se guarda únicamente un pequeño historial local (máximo 100 archivos) y preferencias; no se guardan vídeos ni portadas en el almacenamiento interno. Se solicitan permisos de lectura del disco. La app no necesita que el HDD permita escritura. Escanea hasta 1 000 películas; mantiene seis portadas en la fila visible. XML: máximo 128 KiB. SRT/VTT: máximo 2 MiB y 20 000 entradas. Portadas: máximo 8 MiB; conviene usar JPG de aproximadamente 600 × 900 píxeles.

## Instalar en la televisión

1. Extrae el ZIP en tu computadora.
2. En Tizen Studio, importa **solo** la carpeta `DiscBoxMP4_1.0.0` como proyecto existente. Las carpetas de ejemplo, herramientas y pruebas quedan fuera de la app.
3. Usa tu perfil de certificado Samsung y la televisión registrada con su DUID, como en las versiones anteriores.
4. Compila y ejecuta como **Tizen Web Application** en la TV conectada en modo desarrollador.
5. Copia la carpeta `DiscBox` de `USB_Ejemplo` a la raíz de un USB/HDD. Es un clip original de prueba de 60 s en dos archivos con texto y tonos distintos, sin voces.
6. Prueba reproducción, subtítulos, pausa y avance con ese clip; después añade tus películas.

Se conserva el identificador `DBoxDVD001.DiscBoxDVD` y el paquete `DBoxDVD001` para actualizar la aplicación anterior usando el mismo certificado. El nombre visible ahora es DiscBox. El ZIP contiene fuentes; debe firmarse localmente con tu certificado para generar el WGT.

## Compatibilidad y verificación

Para empezar, usa **MP4 H.264, 8 bits y audio AAC**, preferentemente una sola pista de audio. La extensión MP4 por sí sola no garantiza la compatibilidad. El contenedor debe estar completo y tener un índice válido. Los límites de resolución, tasa de bits y perfiles dependen del televisor.

El proyecto incluye pruebas de estados de AVPlay, lectura de archivos, XML, subtítulos, navegación y reproducción HTML5 del clip. Las simulaciones y el navegador de escritorio no sustituyen la comprobación en la TU7000 física. No se ha tenido acceso remoto a esa TV ni a las películas del usuario. Si AVPlay devuelve un error, la pantalla ofrece **Ver diagnóstico** con el archivo, estado, tiempo y eventos; no reinicia automáticamente la película.

Para la vista de escritorio sirve desde la carpeta que contiene el proyecto y `USB_Ejemplo` con `python3 -m http.server 8765`; abre `http://localhost:8765/DiscBoxMP4_1.0.0/`. La biblioteca de esa vista usa seis títulos/portadas ficticios y el clip de prueba; la TV muestra únicamente lo que encuentre en el HDD.

Referencias oficiales consultadas:

- [Uso de AVPlay](https://developer.samsung.com/smarttv/develop/guides/multimedia/media-playback/using-avplay.html): archivo local absoluto, preparación asíncrona y plano de vídeo.
- [API AVPlay](https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/avplay-api.html): estados y espera de callbacks de seekTo.
- [Especificaciones de vídeo 2020](https://developer.samsung.com/smarttv/develop/specifications/media-specifications/2020-tv-video-specifications.html): contenedores y códecs.
- [API Filesystem](https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references/filesystem-api.html): almacenamiento externo y lectura de archivos.
