# DiscBox MP4

DiscBox MP4 es una aplicacion para TV pensada para reproducir una biblioteca personal de peliculas en formato MP4 desde un HDD o USB externo. La idea es tener una experiencia sencilla tipo streaming: biblioteca visual, portadas, detalles de pelicula, seleccion de idioma, subtitulos externos y guardado de progreso.

El proyecto nace como una alternativa ligera para organizar peliculas locales en televisores y dispositivos de TV, usando una estructura simple de carpetas que se puede preparar desde cualquier computadora.

## Caracteristicas

- Biblioteca visual de peliculas.
- Reproduccion directa de archivos MP4.
- Seleccion de idioma antes de iniciar la pelicula.
- Soporte para subtitulos externos `.srt` y `.vtt`.
- Portadas personalizadas por pelicula.
- Lectura de detalles desde archivos XML.
- Guardado de progreso por pelicula.
- Interfaz pensada para control remoto.
- Barra de reproduccion con pausa, avance, retroceso y ajustes.
- Sistema simple de carpetas en HDD/USB.
- Reproduccion desde almacenamiento externo, sin copiar peliculas al almacenamiento interno de la TV.

## Compatibilidad

La version 1.0.0 esta enfocada en Samsung Tizen TV.

El objetivo del proyecto es crecer como una app multiplataforma para:

- Samsung Tizen TV
- Android TV / Google TV
- Roku
- Navegador web como modo de prueba

Cada plataforma puede requerir una version o empaquetado diferente, pero la estructura del HDD/USB se mantiene igual.

## Formato recomendado

Para mejor compatibilidad se recomienda usar:

| Tipo | Recomendado |
|---|---|
| Contenedor | `.mp4` |
| Video | H.264 / AVC |
| Audio | AAC |
| Subtitulos | `.srt` o `.vtt` en UTF-8 |
| Portadas | `.jpg`, `.jpeg` o `.png` |

Tambien pueden funcionar otros codecs dependiendo de la TV o dispositivo, pero H.264 + AAC suele ser la opcion mas segura.

## Estructura del repositorio

Este repositorio contiene:

| Carpeta o archivo | Uso |
|---|---|
| `DiscBoxMP4_1.0.0/` | Proyecto principal para Samsung Tizen TV |
| `Herramientas_DiscBox/` | Herramientas auxiliares, como generador de XML |
| `USB_Ejemplo/DiscBox/` | Ejemplo de estructura para preparar el HDD/USB |
| `README.md` | Documentacion del proyecto |

Para instalar en Samsung Tizen TV, el proyecto que se debe abrir en Tizen Studio es:

```text
DiscBoxMP4_1.0.0/
```

Dentro de esa carpeta deben existir archivos como:

```text
config.xml
indice.html
icono.png
CSS/
js/
activos/
```

## Estructura del HDD o USB

En la raiz del HDD/USB debe existir una carpeta llamada `DiscBox`.

Dentro de `DiscBox` van las carpetas de peliculas, portadas, subtitulos y detalles:

```text
DiscBox/
  MP4/
  Covers/
  Subtitulos/
  Detalles/
```

Ejemplo completo:

```text
DiscBox/
  MP4/
    Amelie/
      es.mp4
      fr.mp4

  Covers/
    Amelie.jpg

  Subtitulos/
    Amelie/
      es.srt
      fr.srt

  Detalles/
    Amelie.xml
```

La carpeta `DiscBox` debe estar en la raiz del disco.

Ejemplo en Windows:

```text
E:/DiscBox/MP4/
E:/DiscBox/Covers/
E:/DiscBox/Subtitulos/
E:/DiscBox/Detalles/
```

## Como agregar una pelicula

1. Crear una carpeta dentro de `DiscBox/MP4/` con el nombre de la pelicula.

   ```text
   DiscBox/MP4/Amelie/
   ```

2. Agregar uno o mas archivos MP4 dentro de esa carpeta.

   ```text
   es.mp4
   en.mp4
   fr.mp4
   ```

3. Agregar una portada con el mismo nombre de la carpeta de la pelicula.

   ```text
   DiscBox/Covers/Amelie.jpg
   ```

4. Agregar subtitulos si se necesitan.

   ```text
   DiscBox/Subtitulos/Amelie/es.srt
   DiscBox/Subtitulos/Amelie/en.srt
   ```

5. Agregar un XML con detalles de la pelicula.

   ```text
   DiscBox/Detalles/Amelie.xml
   ```

El XML y los subtitulos son opcionales. Si no existen, la pelicula puede aparecer y reproducirse usando solo el nombre de la carpeta y el archivo MP4.

## Idiomas

DiscBox detecta los idiomas segun el nombre del archivo MP4.

| Archivo | Idioma mostrado |
|---|---|
| `es.mp4` | Espanol |
| `en.mp4` | English |
| `fr.mp4` | Francais |
| `ja.mp4` | Japones |
| `es-MX.mp4` | Espanol Mexico |

Cada archivo MP4 debe tener el audio correcto. Por ejemplo, si el archivo se llama `es.mp4`, ese video debe tener audio en espanol.

## Subtitulos

Los subtitulos pueden estar en formato `.srt` o `.vtt`.

Ejemplo:

```text
DiscBox/Subtitulos/Amelie/es.srt
DiscBox/Subtitulos/Amelie/en.srt
```

Se recomienda guardar los subtitulos en UTF-8 para evitar problemas con acentos o caracteres especiales.

## XML de detalles

Cada pelicula puede tener un archivo XML con informacion adicional.

Ejemplo:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<pelicula>
  <titulo>Amelie</titulo>
  <tituloOriginal>Le Fabuleux Destin d'Amelie Poulain</tituloOriginal>
  <anio>2001</anio>
  <duracion>123</duracion>
  <genero>Comedia</genero>
  <genero>Romance</genero>
  <sinopsis>Amelie es una joven camarera de Montmartre que decide mejorar la vida de quienes la rodean mientras descubre su propia forma de buscar la felicidad.</sinopsis>
  <director>Jean-Pierre Jeunet</director>
  <reparto>
    <actor>Audrey Tautou</actor>
    <actor>Mathieu Kassovitz</actor>
  </reparto>
  <pais>Francia / Alemania</pais>
</pelicula>
```

El XML es opcional. Si no existe, la app usa el nombre de la carpeta como titulo.

## Instalacion en Samsung Tizen TV desde GitHub

### 1. Clonar el repositorio

En la computadora, abre una terminal y clona el proyecto:

```bash
git clone https://github.com/JoshKO007/DiscBox.git
```

Entra a la carpeta del repositorio:

```bash
cd DiscBox
```

### 2. Abrir el proyecto correcto

El proyecto Tizen esta dentro de:

```text
DiscBoxMP4_1.0.0/
```

Esa es la carpeta que se debe importar en Tizen Studio.

### 3. Importar en Tizen Studio

1. Abre Tizen Studio.
2. Ve a `File > Import`.
3. Selecciona `Tizen > Tizen Project` o `Existing Projects into Workspace`.
4. Elige la carpeta `DiscBoxMP4_1.0.0`.
5. Confirma la importacion.

Si Tizen Studio no detecta el proyecto, revisa que dentro de `DiscBoxMP4_1.0.0` exista el archivo:

```text
config.xml
```

### 4. Activar modo desarrollador en la TV Samsung

1. En la TV, abre `Apps`.
2. Presiona la secuencia:

   ```text
   1 2 3 4 5
   ```

3. Activa `Developer Mode`.
4. Escribe la IP de tu computadora.
5. Reinicia la TV.

La TV y la computadora deben estar conectadas a la misma red.

### 5. Conectar la TV a Tizen Studio

En Tizen Studio:

1. Abre `Device Manager`.
2. Busca la TV en la red.
3. Si no aparece, abre `Remote Device Manager`.
4. Agrega la IP de la TV manualmente.
5. Activa la conexion.

Si la TV pide aceptar la conexion, acepta desde la pantalla.

### 6. Crear o seleccionar certificado Samsung

Para instalar en una TV real necesitas firmar la app.

1. Abre `Certificate Manager`.
2. Crea o selecciona un perfil de certificado Samsung.
3. Usa un certificado valido para TV.
4. Asegurate de que el perfil este activo.

Si ya habias instalado una version anterior de DiscBox, conviene usar el mismo certificado para poder actualizar la app sin conflictos.

### 7. Compilar la app

En Tizen Studio:

1. Clic derecho sobre el proyecto.
2. Selecciona `Build Project`.
3. Espera a que termine sin errores.

Si aparece un error de archivos no encontrados, revisa que los nombres del proyecto coincidan con los que usa `config.xml`.

En esta version el proyecto usa:

```text
indice.html
CSS/
js/
activos/
```

### 8. Instalar en la TV

Con la TV conectada en Device Manager:

1. Clic derecho sobre el proyecto.
2. Selecciona `Run As > Tizen Web Application`.
3. Tizen Studio firmara e instalara la app en la TV.
4. La app debe abrirse automaticamente.

Tambien puedes generar el paquete `.wgt` y despues instalarlo desde Device Manager.

## Instalacion usando el archivo WGT

El repositorio tambien puede incluir un archivo `.wgt`, por ejemplo:

```text
DiscBoxMP4_1_0_0.wgt
```

Ese archivo es el paquete de instalacion de Tizen. Si ya esta firmado correctamente para tu TV, puedes instalarlo desde Tizen Studio usando Device Manager.

Si el `.wgt` no esta firmado con tu certificado o no coincide con tu TV, vuelve a compilar desde Tizen Studio usando tu certificado Samsung.

## Preparar el HDD/USB

Antes de abrir la app en la TV:

1. Conecta el HDD/USB a una computadora.
2. Crea una carpeta llamada `DiscBox` en la raiz.
3. Dentro crea las carpetas:

   ```text
   MP4
   Covers
   Subtitulos
   Detalles
   ```

4. Copia tus peliculas a `MP4`.
5. Copia tus portadas a `Covers`.
6. Copia tus subtitulos a `Subtitulos`.
7. Copia tus XML a `Detalles`.
8. Expulsa el disco de forma segura.
9. Conectalo a la TV.

## Uso de la app

1. Conecta el HDD/USB a la TV.
2. Abre DiscBox.
3. La app buscara la carpeta `DiscBox`.
4. Selecciona una pelicula desde la biblioteca.
5. Elige idioma.
6. Elige subtitulos si existen.
7. Presiona reproducir.

Durante la reproduccion puedes usar el control remoto para pausar, avanzar, retroceder, abrir la barra de reproduccion y entrar a ajustes.

## Modo de prueba en navegador

La app puede abrirse en navegador como modo de prueba para revisar la interfaz y la biblioteca de ejemplo.

Este modo sirve para probar visualmente la app, pero la reproduccion real en TV depende del dispositivo, del sistema y de los codecs del archivo.

## Android TV y Roku

El soporte para Android TV y Roku forma parte del objetivo del proyecto.

La idea es conservar la misma estructura:

```text
DiscBox/
  MP4/
  Covers/
  Subtitulos/
  Detalles/
```

Pero cada plataforma puede necesitar una version distinta de la app:

| Plataforma | Estado |
|---|---|
| Samsung Tizen TV | Version 1.0.0 inicial |
| Android TV / Google TV | Planeado |
| Roku | Planeado |
| Navegador web | Modo de prueba |

## Notas importantes

- La app no copia peliculas al almacenamiento interno de la TV.
- Las peliculas se reproducen desde el HDD/USB externo.
- El HDD/USB debe tener una carpeta `DiscBox` en la raiz.
- El nombre de la carpeta de la pelicula debe coincidir con la portada, subtitulos y XML.
- Se recomienda usar MP4 con video H.264 y audio AAC.
- Los subtitulos deben estar en `.srt` o `.vtt`.
- Los archivos XML son opcionales.
- La compatibilidad final depende de la TV, del sistema y de los codecs del archivo.

## Roadmap

- Mejorar compatibilidad con mas televisores.
- Crear version para Android TV.
- Explorar version para Roku.
- Mejorar el diseno de la biblioteca.
- Agregar filtros por genero, ano e idioma.
- Agregar busqueda.
- Mejorar el editor/generador de XML.
- Agregar soporte para colecciones o sagas.

## Estado del proyecto

DiscBox MP4 1.0.0 es la primera version enfocada completamente en MP4.

El sistema anterior basado en DVD/ISO fue descartado para mejorar estabilidad, compatibilidad y rendimiento.

## Autor

Creado por JoshKO007.

## Licencia

Proyecto en desarrollo.
