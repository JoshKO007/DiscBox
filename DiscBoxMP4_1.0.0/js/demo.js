(function (root) {
  'use strict';
  var data = [
    ['El bosque interior', '2025', 'Drama', 'Hay lugares que también nos encuentran.', 'Una ilustración de la nueva colección de DiscBox. Los títulos y las portadas de esta vista son ficticios; Reproducir abre el clip de prueba incluido.'],
    ['Donde termina el mar', '2024', 'Aventura', 'El horizonte es solo el comienzo.', 'Una costa tranquila, una promesa pendiente y todas las historias que aún quedan por vivir.'],
    ['Un verano lento', '2025', 'Comedia', 'A veces basta con quedarse.', 'Días largos, calles vacías y encuentros inesperados bajo el sol de un pequeño pueblo.'],
    ['La última luz', '2023', 'Suspenso', 'Algo permanece cuando todo se apaga.', 'Al caer la noche, una fotógrafa sigue la pista de una luz en las montañas.'],
    ['El mapa del silencio', '2024', 'Drama', 'Cada camino tiene su propio ritmo.', 'Un viaje sin prisa por los lugares y los recuerdos que nos acompañan.'],
    ['Volver a casa', '2025', 'Familia', 'Siempre hay un camino de regreso.', 'El reencuentro de una familia con las pequeñas cosas que hacen extraordinario lo cotidiano.']
  ];
  function textFile(name, url) { return { name: name, fileSize: 1000, readAsText: function (ok, fail) { fetch(url).then(function (r) { if (!r.ok) throw new Error('No se encontró el ejemplo. Abre la vista desde la carpeta completa del ZIP.'); return r.text(); }).then(ok, fail); } }; }
  root.DiscDemo = { catalog: function () {
    var base = '../USB_Ejemplo/DiscBox/';
    return { drives: 0, warnings: [], movies: data.map(function (item, i) {
      return { id: 'demo-' + i, folder: item[0], title: item[0], storage: 'DEMO', cover: 'assets/cover-' + (i + 1) + '.jpg',
        meta: { title: item[0], year: item[1], runtime: '1', genres: [item[2]], tagline: item[3], plot: item[4], director: 'Colección de demostración', cast: [], chapters: [{ title: 'Inicio', time: 0 }, { title: 'Prueba de avance', time: 30000 }] },
        variants: ['es', 'en'].map(function (lang) { return { name: lang + '.mp4', label: lang === 'es' ? 'Español' : 'English', uri: base + 'MP4/Prueba%20DiscBox/' + lang + '.mp4', id: 'demo-' + i + '-' + lang }; }),
        subtitles: ['es', 'en'].map(function (lang) { return { name: lang + '.srt', label: lang === 'es' ? 'Español' : 'English', video: '', file: textFile(lang + '.srt', base + 'Subtitulos/Prueba%20DiscBox/' + lang + '.srt') }; }) };
    }) };
  } };
})(window);
