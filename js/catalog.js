(function (root) {
  'use strict';
  var LIMIT = 1000;
  function key(value) {
    var text = String(value || '').trim().toLowerCase();
    return text.normalize ? text.normalize('NFC') : text;
  }
  function clean(file) { return file && !/^\./.test(file.name) && file.name !== '__MACOSX'; }
  function extension(name) { return String(name).split('.').pop().toLowerCase(); }
  function stem(name) { return String(name).replace(/\.[^.]+$/, ''); }
  function language(name) {
    var value = key(stem(name)).replace(/_/g, '-');
    var labels = { es: 'Español', spa: 'Español', esp: 'Español', 'español': 'Español', espanol: 'Español', spanish: 'Español', latino: 'Español latino', 'es-mx': 'Español latino', 'es-419': 'Español latino', 'es-es': 'Español de España', castellano: 'Español de España', en: 'English', eng: 'English', ingles: 'English', 'inglés': 'English', english: 'English', fr: 'Français', fra: 'Français', de: 'Deutsch', deu: 'Deutsch', it: 'Italiano', ita: 'Italiano', pt: 'Português', por: 'Português', 'pt-br': 'Português do Brasil', ja: '日本語', jpn: '日本語', original: 'Original' };
    return labels[value] || stem(name).replace(/_/g, ' ');
  }
  function uri(file) { try { return file.toURI(); } catch (_) { return ''; } }
  function readText(file, limit) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^(xml|srt|vtt)$/.test(extension(file.name))) { reject(new Error('Archivo de texto no admitido.')); return; }
      if (!isFinite(file.fileSize) || file.fileSize < 0 || file.fileSize > limit) { reject(new Error('El archivo supera el límite de lectura.')); return; }
      var settled = false;
      var timer = setTimeout(function () { finish(new Error('El disco no respondió al leer ' + file.name)); }, 12000);
      function finish(error, text) {
        if (settled) return;
        settled = true; clearTimeout(timer);
        if (error) reject(error); else if (String(text).length > limit) reject(new Error('Archivo demasiado grande.')); else resolve(String(text));
      }
      try { file.readAsText(function (text) { finish(null, text); }, finish, 'UTF-8'); } catch (e) { finish(e); }
    });
  }
  function children(element, names) {
    var allowed = names.split('|');
    return Array.prototype.filter.call(element.children || [], function (child) { return allowed.indexOf(child.tagName.toLowerCase()) !== -1; });
  }
  function field(element, names, max) {
    var nodes = children(element, names);
    return nodes.length ? nodes[0].textContent.trim().slice(0, max || 400) : '';
  }
  function values(element, names) { return children(element, names).map(function (node) { return node.textContent.trim().slice(0, 160); }).filter(Boolean).slice(0, 30); }
  function basename(value) { return value && value !== '.' && value !== '..' && !/[\\/:\x00]/.test(value); }
  function seconds(value) {
    if (/^\d+(\.\d+)?$/.test(value)) return Number(value);
    var parts = String(value).split(':').map(Number);
    if (parts.length < 2 || parts.length > 3 || parts.some(function (n) { return !isFinite(n) || n < 0; })) return NaN;
    return parts.reduce(function (a, b) { return a * 60 + b; }, 0);
  }
  function metadata(text) {
    if (text.length > 131072 || /<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('XML demasiado grande o con declaraciones no admitidas.');
    var document = new root.DOMParser().parseFromString(text, 'application/xml');
    if (document.getElementsByTagName('parsererror').length) throw new Error('El XML tiene un error de sintaxis.');
    var element = document.documentElement;
    if (!element || !/^(pelicula|movie)$/i.test(element.tagName)) throw new Error('La raíz XML debe ser pelicula o movie.');
    var result = {
      title: field(element, 'titulo|title'), original: field(element, 'tituloOriginal|originaltitle'.toLowerCase()),
      year: field(element, 'anio|año|year', 8), runtime: field(element, 'duracion|runtime', 12),
      plot: field(element, 'sinopsis|plot', 12000), tagline: field(element, 'frase|tagline', 240),
      director: values(element, 'director').join(', '), genres: values(element, 'genero|genre'),
      rating: field(element, 'clasificacion|mpaa', 40), country: field(element, 'pais|country', 120),
      cast: [], audio: Object.create(null), subtitles: Object.create(null), chapters: []
    };
    children(element, 'actor').forEach(function (node) { result.cast.push(field(node, 'nombre|name') || node.textContent.trim().slice(0, 160)); });
    children(element, 'reparto').forEach(function (node) { result.cast = result.cast.concat(values(node, 'actor')); });
    result.cast = result.cast.slice(0, 30);
    ['audios', 'subtitulos'].forEach(function (section) {
      children(element, section).forEach(function (group) {
        children(group, section === 'audios' ? 'audio' : 'subtitulo').forEach(function (node) {
          var file = node.getAttribute('archivo');
          if (basename(file)) result[section === 'audios' ? 'audio' : 'subtitles'][key(file)] = {
            label: (node.getAttribute('nombre') || language(node.getAttribute('idioma') || file)).slice(0, 100),
            video: basename(node.getAttribute('video')) ? key(node.getAttribute('video')) : ''
          };
        });
      });
    });
    children(element, 'capitulos').forEach(function (group) {
      children(group, 'capitulo').slice(0, 100).forEach(function (node) {
        var time = seconds(node.getAttribute('tiempo'));
        if (isFinite(time) && time >= 0) result.chapters.push({ time: time * 1000, title: (node.getAttribute('titulo') || 'Capítulo').slice(0, 100) });
      });
    });
    result.chapters.sort(function (a, b) { return a.time - b.time; });
    return result;
  }
  function list(dir) {
    if (!dir) return Promise.resolve([]);
    return new Promise(function (resolve, reject) {
      var done = false, timer = setTimeout(function () { finish(new Error('No se pudo leer ' + dir.fullPath)); }, 12000);
      function finish(error, files) { if (done) return; done = true; clearTimeout(timer); if (error) reject(error); else resolve((files || []).filter(clean)); }
      try { dir.listFiles(function (files) { finish(null, files); }, finish); } catch (e) { finish(e); }
    });
  }
  function find(files, name, directory) { return files.filter(function (f) { return key(f.name) === key(name) && !!f.isDirectory === !!directory; })[0]; }
  function mapFiles(files) { var map = Object.create(null); files.forEach(function (file) { map[key(file.name)] = file; }); return map; }
  function serial(items, action) { return items.reduce(function (chain, item) { return chain.then(function () { return action(item); }); }, Promise.resolve()); }
  function scan(filesystem, progress) {
    var movies = [], warnings = [], drives = 0;
    function warn(message) { if (warnings.length < 30) warnings.push(String(message)); }
    function optional(dir) { return list(dir).catch(function (e) { warn(e.message || e); return []; }); }
    function storageList() {
      return new Promise(function (resolve, reject) {
        var timer = setTimeout(function () { reject(new Error('La televisión no respondió al buscar discos USB.')); }, 12000);
        try { filesystem.listStorages(function (items) { clearTimeout(timer); resolve(items.filter(function (s) { return s.type === 'EXTERNAL' && s.state === 'MOUNTED'; })); }, function (e) { clearTimeout(timer); reject(e); }); } catch (e) { clearTimeout(timer); reject(e); }
      });
    }
    function resolveRoot(label) {
      return new Promise(function (resolve, reject) {
        var timer = setTimeout(function () { reject(new Error('No respondió el disco ' + label)); }, 12000);
        try { filesystem.resolve(label, function (dir) { clearTimeout(timer); resolve(dir); }, function (e) { clearTimeout(timer); reject(e); }, 'r'); } catch (e) { clearTimeout(timer); reject(e); }
      });
    }
    function library(base, label) {
      return list(base).then(function (files) {
        var mp4 = find(files, 'MP4', true);
        if (!mp4) return;
        return Promise.all([list(mp4), optional(find(files, 'Covers', true)), optional(find(files, 'Detalles', true)), optional(find(files, 'Subtitulos', true))]).then(function (groups) {
          var covers = mapFiles(groups[1]), details = mapFiles(groups[2]), subs = mapFiles(groups[3]);
          return serial(groups[0].filter(function (f) { return f.isDirectory; }), function (folder) {
            if (movies.length >= LIMIT) { warn('Se muestran las primeras ' + LIMIT + ' películas.'); return; }
            var name = key(folder.name), xml = details[name + '.xml'];
            return Promise.all([list(folder), xml ? readText(xml, 131072).then(metadata).catch(function (e) { warn(folder.name + ': ' + e.message); return {}; }) : {}, optional(subs[name] && subs[name].isDirectory ? subs[name] : null)]).then(function (items) {
              var videos = items[0].filter(function (f) { return f.isFile && extension(f.name) === 'mp4' && f.fileSize > 0; });
              if (!videos.length) return;
              var meta = items[1], cover = covers[name + '.jpg'] || covers[name + '.png'] || covers[name + '.jpeg'];
              var movie = { id: folder.fullPath, folder: folder.name, title: meta.title || folder.name, storage: label, meta: meta, cover: cover && cover.isFile && cover.fileSize <= 8388608 ? uri(cover) : '', variants: [], subtitles: [] };
              videos.forEach(function (f) {
                var labelInfo = meta.audio && meta.audio[key(f.name)];
                movie.variants.push({ name: f.name, label: labelInfo ? labelInfo.label : language(f.name), uri: uri(f), file: f, id: f.fullPath + ':' + f.fileSize + ':' + (f.modified ? Number(f.modified) : 0) });
              });
              movie.variants.sort(function (a, b) { var rank = function (v) { return /^es|^spa|^latino|^castellano/i.test(v.name) ? 0 : /^en|^eng/i.test(v.name) ? 1 : 2; }; return rank(a) - rank(b) || a.label.localeCompare(b.label); });
              items[2].filter(function (f) { return f.isFile && /^(srt|vtt)$/.test(extension(f.name)); }).forEach(function (f) {
                var info = meta.subtitles && meta.subtitles[key(f.name)];
                movie.subtitles.push({ name: f.name, label: info ? info.label : language(f.name), video: info ? info.video : '', file: f });
              });
              movie.subtitles.sort(function (a, b) { return a.label.localeCompare(b.label) || a.name.localeCompare(b.name); });
              movies.push(movie); if (progress) progress(movies.length);
            }).catch(function (e) { warn(folder.name + ': ' + (e.message || e)); });
          });
        });
      });
    }
    return storageList().then(function (storages) {
      drives = storages.length;
      return serial(storages, function (storage) {
        return resolveRoot(storage.label).then(function (rootDir) {
          return list(rootDir).then(function (files) {
            var base = find(files, 'DiscBox', true);
            return base ? library(base, storage.label) : undefined;
          });
        }).catch(function (e) { warn(storage.label + ': ' + (e.message || e)); });
      });
    }).then(function () {
      movies.sort(function (a, b) { return a.title.localeCompare(b.title) || a.id.localeCompare(b.id); });
      return { movies: movies, warnings: warnings, drives: drives };
    });
  }
  root.DiscCatalog = { key: key, language: language, metadata: metadata, readText: readText, scan: scan, seconds: seconds };
})(window);
