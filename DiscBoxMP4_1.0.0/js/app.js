(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var native = window.webapis && window.webapis.avplay;
  var television = !!(window.tizen && window.tizen.filesystem);
  var prefs = { audio: '', subtitle: '', delay: 0, size: 1, progress: [] };
  try {
    var stored = JSON.parse(localStorage.getItem('discbox.mp4.v1') || '{}');
    ['audio', 'subtitle'].forEach(function (name) { if (typeof stored[name] === 'string') prefs[name] = stored[name].slice(0, 200); });
    if (isFinite(stored.delay)) prefs.delay = Math.max(-10000, Math.min(10000, Number(stored.delay)));
    if ([0, 1, 2].indexOf(stored.size) >= 0) prefs.size = stored.size;
    if (Array.isArray(stored.progress)) prefs.progress = stored.progress.filter(function (p) { return p && typeof p.id === 'string' && isFinite(p.time) && p.time >= 0 && isFinite(p.duration) && p.duration > p.time; }).slice(-100);
  } catch (_) {}
  var state = { screen: 'library', modal: '', movies: [], visible: [], selected: 0, page: 0, filter: 'all', movie: null, audio: 0, sub: -1, playing: null, launching: false, scan: false, needsScan: false, token: 0, subToken: 0, subtitles: null, lastSave: 0, warnings: [], bar: false, settings: false, modalFocus: null };
  var barTimer, toastTimer, refreshTimer;
  function show(id, visible) { $(id).classList.toggle('hidden', !visible); }
  function text(id, value) { var element = $(id), next = String(value || ''); if (element.textContent !== next) element.textContent = next; }
  function node(tag, value, className) { var n = document.createElement(tag); if (value !== undefined) n.textContent = value; if (className) n.className = className; return n; }
  function imageBackground(id, uri) { $(id).style.backgroundImage = uri ? 'url("' + uri.replace(/"/g, '%22').replace(/[\n\r\\]/g, '') + '")' : ''; }
  function visible(element) { return element && !element.disabled && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden'; }
  function focus(element) { if (visible(element)) { try { element.focus({ preventScroll: true }); } catch (_) { element.focus(); } } }
  function savePrefs() { try { localStorage.setItem('discbox.mp4.v1', JSON.stringify(prefs)); } catch (_) {} }
  function notice(message) { text('toast', message); show('toast', true); clearTimeout(toastTimer); toastTimer = setTimeout(function () { show('toast', false); }, 6500); }
  function clock(ms) { var total = Math.max(0, Math.floor((ms || 0) / 1000)), s = total % 60, m = Math.floor(total / 60) % 60, h = Math.floor(total / 3600); return (h ? h + ':' + ('0' + m).slice(-2) : Math.floor(total / 60)) + ':' + ('0' + s).slice(-2); }
  function position(variant) { return prefs.progress.filter(function (p) { return p.id === variant.id; })[0]; }
  function remember(ended) {
    if (!state.playing) return;
    var id = state.playing.variant.id;
    prefs.progress = prefs.progress.filter(function (p) { return p.id !== id; });
    if (!ended && player.time >= 5000 && player.duration > player.time + 5000) prefs.progress.push({ id: id, time: player.time, duration: player.duration });
    prefs.progress = prefs.progress.slice(-100); savePrefs();
  }
  function movieProgress(movie) { var best = null; movie.variants.forEach(function (v) { var p = position(v); if (p && (!best || p.time > best.time)) best = p; }); return best; }
  function metadataLine(movie) { var m = movie.meta; return [m.year, m.runtime ? m.runtime + ' min' : '', (m.genres || []).slice(0, 2).join(' / '), m.rating].filter(Boolean).join('  ·  '); }
  function hero(movie) {
    if (!movie) { text('heroTitle', state.filter === 'continue' ? 'Cada historia, a su tiempo.' : 'Tu próxima película.'); text('heroMeta', ''); text('heroPlot', state.filter === 'continue' ? 'Aquí encontrarás las películas que dejes a medias.' : 'Conecta tu disco y encuentra aquí las historias que más te gustan.'); imageBackground('heroArt', ''); return; }
    text('heroTitle', movie.title); text('heroMeta', metadataLine(movie)); text('heroPlot', movie.meta.plot || 'Elige el idioma, acomódate y disfruta la película.'); imageBackground('heroArt', movie.cover);
    text('heroTag', movie.meta.tagline ? movie.meta.tagline.slice(0, 90).toUpperCase() : 'ESTA NOCHE, EN CASA');
  }
  function renderLibrary(moveFocus) {
    state.visible = state.movies.filter(function (m) { return state.filter !== 'continue' || movieProgress(m); });
    state.selected = Math.min(Math.max(0, state.selected), Math.max(0, state.visible.length - 1)); state.page = Math.floor(state.selected / 6);
    document.querySelectorAll('.nav[data-action]').forEach(function (button) { button.classList.toggle('active', button.dataset.action === (state.filter === 'continue' ? 'continue' : 'all')); });
    text('shelfTitle', state.filter === 'continue' ? 'Sigue donde te quedaste' : 'Tu colección');
    text('movieCount', state.visible.length + (state.visible.length === 1 ? ' película' : ' películas'));
    $('cards').textContent = '';
    state.visible.slice(state.page * 6, state.page * 6 + 6).forEach(function (movie, offset) {
      var index = state.page * 6 + offset, card = node('button', undefined, 'movie-card' + (index === state.selected ? ' selected' : ''));
      card.dataset.index = index; card.dataset.action = 'movie'; card.setAttribute('aria-label', movie.title);
      var poster = node('div', undefined, 'poster'); poster.appendChild(node('div', movie.title, 'poster-fallback'));
      if (movie.cover) { var img = node('img'); img.src = movie.cover; img.alt = ''; img.onerror = function () { img.removeAttribute('src'); img.style.display = 'none'; }; poster.appendChild(img); }
      var p = movieProgress(movie);
      if (p) { var bar = node('div', undefined, 'card-progress'), fill = node('span'); fill.style.width = (p.time / p.duration * 100) + '%'; bar.appendChild(fill); poster.appendChild(bar); }
      card.appendChild(poster); card.appendChild(node('strong', movie.title, 'card-title'));
      card.appendChild(node('span', [movie.meta.year, movie.variants.length + (movie.variants.length === 1 ? ' idioma' : ' idiomas'), p ? 'Continuar ' + clock(p.time) : ''].filter(Boolean).join(' · '), 'card-sub'));
      $('cards').appendChild(card);
    });
    show('cards', !!state.visible.length); show('empty', !state.visible.length); show('heroHint', !!state.visible.length);
    text('emptyTitle', state.scan ? 'Buscando tus películas…' : state.filter === 'continue' ? 'Todas las historias empiezan por algo.' : 'Hagamos espacio para tus películas.');
    text('emptyText', state.filter === 'continue' ? 'Cuando pauses una película y vuelvas después, aparecerá aquí.' : 'Crea DiscBox/MP4 en tu disco y agrega una carpeta por película.');
    text('pageLabel', '← → Explorar · OK Elegir · ↑ Acciones' + (state.visible.length > 6 ? '     ' + (state.page + 1) + ' / ' + Math.ceil(state.visible.length / 6) : ''));
    hero(state.visible[state.selected]);
    if (moveFocus && state.screen === 'library' && !state.modal) focus($('cards').children[state.selected % 6] || document.querySelector('[data-action="help"]'));
  }
  function scan() {
    if (state.scan || state.screen !== 'library' || state.modal) { state.needsScan = true; return; }
    state.scan = true; state.needsScan = false; text('storageStatus', 'Buscando películas…'); document.querySelector('[data-action="refresh"]').disabled = true;
    var result = television ? DiscCatalog.scan(tizen.filesystem, function (count) { text('storageStatus', count + ' películas encontradas…'); }) : Promise.resolve(DiscDemo.catalog());
    result.then(function (data) {
      state.movies = data.movies; state.warnings = data.warnings; text('storageStatus', television ? data.drives + (data.drives === 1 ? ' disco conectado' : ' discos conectados') + (data.warnings.length ? ' · Hay avisos' : ' · Colección local') : 'VISTA DE DEMOSTRACIÓN');
      state.selected = 0;
      if (data.warnings.length) notice('Algunos archivos no se pudieron leer. Consulta Cómo agregar → Avisos.');
    }).catch(function (error) { state.warnings = [error.message || String(error)]; text('storageStatus', 'No se pudo leer el disco'); notice(state.warnings[0]); }).then(function () {
      state.scan = false; document.querySelector('[data-action="refresh"]').disabled = false; renderLibrary(true);
    });
  }
  function subtitleOptions() {
    if (!state.movie) return [];
    var name = DiscCatalog.key(state.movie.variants[state.audio].name);
    return state.movie.subtitles.filter(function (sub) { return !sub.video || sub.video === name; });
  }
  function choices() {
    var movie = state.movie, variant = movie.variants[state.audio], subs = subtitleOptions();
    if (state.sub >= subs.length) state.sub = -1;
    var subLabel = state.sub < 0 ? 'Desactivados' : subs[state.sub].label;
    text('audioLabel', variant.label); text('subtitleLabel', subLabel); text('menuSubtitleLabel', subLabel);
    text('delayLabel', (prefs.delay > 0 ? '+' : '') + (prefs.delay / 1000).toFixed(2) + ' s'); text('sizeLabel', ['Pequeño', 'Mediano', 'Grande'][prefs.size]);
    $('audioChoice').setAttribute('aria-label', 'Idioma: ' + variant.label); $('subtitleChoice').setAttribute('aria-label', 'Subtítulos: ' + subLabel); $('menuSubtitle').setAttribute('aria-label', 'Subtítulos: ' + subLabel);
    var p = position(variant); text('playButton', p ? '▶ Continuar · ' + clock(p.time) : '▶ Reproducir'); show('restartButton', !!p);
    $('captions').style.fontSize = ([32, 40, 48][prefs.size] * (state.settings ? 0.85 : 1)) + 'px';
  }
  function screen(name) {
    state.screen = name; show('library', name === 'library'); show('details', name === 'details'); show('playerUI', name === 'player');
    show('avPlayer', name === 'player' && !!native); show('webVideo', name === 'player' && !native); document.body.classList.toggle('playing', name === 'player');
  }
  function details(movie) {
    state.movie = movie; state.audio = Math.max(0, movie.variants.findIndex(function (v) { return v.name === prefs.audio; }));
    state.sub = subtitleOptions().findIndex(function (s) { return s.name === prefs.subtitle; });
    screen('details'); text('detailTitle', movie.title); text('detailMeta', metadataLine(movie)); text('detailTagline', movie.meta.tagline || ''); text('detailPlot', movie.meta.plot || 'Todo listo para tu próxima función.');
    text('detailCredits', [movie.meta.director ? 'Dirección: ' + movie.meta.director : '', (movie.meta.cast || []).slice(0, 3).join(' · ')].filter(Boolean).join('     '));
    text('detailFallback', movie.title); imageBackground('detailArt', movie.cover);
    show('detailCover', !!movie.cover); if (movie.cover) { $('detailCover').src = movie.cover; $('detailCover').onerror = function () { show('detailCover', false); }; } else $('detailCover').removeAttribute('src');
    choices(); focus($('audioChoice'));
  }
  function loadSubtitles() {
    var request = ++state.subToken, sub = subtitleOptions()[state.sub];
    state.subtitles = null; text('captionText', '');
    if (!sub) return Promise.resolve();
    return DiscCatalog.readText(sub.file, 2097152).then(DiscSubtitles.parse).then(function (parsed) { if (request === state.subToken) { state.subtitles = parsed; updateCaptions(); } }).catch(function (error) {
      if (request !== state.subToken) return;
      state.sub = -1; choices(); notice('Se continúa sin subtítulos: ' + error.message);
    });
  }
  function updateCaptions() { text('captionText', state.subtitles && state.screen === 'player' ? state.subtitles.at(player.time, prefs.delay) : ''); }
  function play(restart) {
    if (state.launching || state.scan || !state.movie) return;
    if (television && !native) { notice('AVPlay no está disponible. Instala la app desde Tizen Studio en la televisión.'); return; }
    var variant = state.movie.variants[state.audio], token = ++state.token, saved = restart ? null : position(variant);
    clearTimeout(toastTimer); show('toast', false);
    prefs.audio = variant.name; prefs.subtitle = state.sub >= 0 ? subtitleOptions()[state.sub].name : ''; savePrefs();
    state.playing = { movie: state.movie, variant: variant }; state.launching = true; state.lastSave = Date.now();
    state.settings = false; show('settings', false); state.bar = false; show('controls', false); $('playerUI').classList.remove('settings-visible', 'bar-visible');
    screen('player'); text('playingTitle', state.movie.title); text('playingLanguage', variant.label); text('settingsLanguage', variant.label); text('playingState', '');
    text('currentTime', '0:00'); text('totalTime', '0:00'); $('timelineFill').style.width = '0'; text('bufferText', 'Abriendo película…'); show('buffer', true);
    show('chaptersButton', !!(state.movie.meta.chapters || []).length);
    loadSubtitles().then(function () {
      if (token !== state.token || state.screen !== 'player') return;
      requestAnimationFrame(function () {
        if (token !== state.token || state.screen !== 'player') return;
        player.start(variant.uri, saved ? saved.time : 0);
      });
    });
  }
  function leave(toLibrary, ended) {
    if (!ended) remember(false);
    state.modal = ''; show('modal', false);
    state.token++; state.subToken++; state.launching = false; state.playing = null; state.subtitles = null; text('captionText', ''); player.stop();
    clearTimeout(barTimer); state.settings = false; state.bar = false; show('settings', false); show('controls', false);
    if (toLibrary) { screen('library'); renderLibrary(true); if (state.needsScan) scan(); } else details(state.movie);
  }
  function bar(showBar) {
    if (state.screen !== 'player' || state.modal) return;
    state.bar = showBar; show('controls', showBar); $('playerUI').classList.toggle('bar-visible', showBar);
    clearTimeout(barTimer);
    if (showBar) {
      if (state.settings) settings(false);
      barTimer = setTimeout(function hide() { if (player.busy || player.state === 'PAUSED') { barTimer = setTimeout(hide, 2000); return; } bar(false); }, 6000);
    }
  }
  function settings(open) { state.settings = open; show('settings', open); $('playerUI').classList.toggle('settings-visible', open); if (open) { bar(false); choices(); focus($('menuSubtitle')); } else choices(); }
  function cycle(kind, delta) {
    if (kind === 'audio') { state.audio = (state.audio + delta + state.movie.variants.length) % state.movie.variants.length; state.sub = -1; }
    if (kind === 'subtitle') { var count = subtitleOptions().length + 1; state.sub = ((state.sub + 1 + delta + count) % count) - 1; if (state.screen === 'player') { prefs.subtitle = state.sub >= 0 ? subtitleOptions()[state.sub].name : ''; loadSubtitles(); } }
    if (kind === 'delay') prefs.delay = Math.max(-10000, Math.min(10000, prefs.delay + delta * 250));
    if (kind === 'size') prefs.size = (prefs.size + delta + 3) % 3;
    choices(); updateCaptions(); savePrefs();
  }
  function modal(title, kicker, build, actions, kind) {
    if (!state.modal) state.modalFocus = document.activeElement;
    state.modal = kind || 'info'; text('modalTitle', title); text('modalKicker', kicker); $('modalBody').textContent = ''; $('modalActions').textContent = ''; build($('modalBody'));
    (actions || [{ label: 'Volver', action: 'closeModal' }]).forEach(function (item, index) { var button = node('button', item.label, index ? 'secondary' : 'primary'); button.dataset.action = item.action; $('modalActions').appendChild(button); });
    show('modal', true); $('modalBody').scrollTop = 0;
    var first = $('modalBody').querySelector('button'); focus(first || ($('modalBody').scrollHeight > $('modalBody').clientHeight + 5 ? $('modalBody') : $('modalActions').firstChild));
  }
  function closeModal() { state.modal = ''; show('modal', false); if (visible(state.modalFocus)) focus(state.modalFocus); else if (state.screen === 'library') renderLibrary(true); if (state.bar) bar(true); }
  function info() {
    var movie = state.movie, m = movie.meta;
    modal(movie.title, 'FICHA DE LA PELÍCULA', function (body) {
      var list = node('dl');
      [['Título original', m.original], ['Año', m.year], ['Duración', m.runtime ? m.runtime + ' minutos' : ''], ['Géneros', (m.genres || []).join(', ')], ['Dirección', m.director], ['Reparto', (m.cast || []).join(', ')], ['País', m.country], ['Clasificación', m.rating], ['Idiomas', movie.variants.map(function (v) { return v.label; }).join(', ')]].forEach(function (pair) { if (pair[1]) { list.appendChild(node('dt', pair[0])); list.appendChild(node('dd', pair[1])); } });
      body.appendChild(list); body.appendChild(node('h3', 'Sinopsis')); body.appendChild(node('p', m.plot || 'Puedes agregar una sinopsis en Detalles/' + movie.folder + '.xml.'));
    });
  }
  function help() {
    modal('Tu colección, a tu manera.', 'ASÍ SE ORGANIZA EL DISCO', function (body) {
      body.appendChild(node('p', 'En la raíz del HDD o USB crea una carpeta DiscBox. Dentro, guarda los archivos como en este ejemplo:'));
      var table = node('table');
      [['MP4/Mi película/es.mp4', 'Versión con audio en español'], ['MP4/Mi película/en.mp4', 'Versión con audio en inglés'], ['Covers/Mi película.jpg', 'Portada vertical (también PNG)'], ['Subtitulos/Mi película/es.srt', 'Subtítulos en español (también VTT)'], ['Subtitulos/Mi película/en.srt', 'Subtítulos en inglés'], ['Detalles/Mi película.xml', 'Año, sinopsis, reparto, géneros y más']].forEach(function (pair) { var row = node('tr'); row.appendChild(node('td', pair[0])); row.appendChild(node('td', pair[1])); table.appendChild(row); }); body.appendChild(table);
      body.appendChild(node('h3', 'El nombre conecta todo')); body.appendChild(node('p', 'Usa el mismo nombre para la carpeta de la película, la portada y el XML. Puedes tener un solo idioma. Las portadas, los subtítulos y los detalles son opcionales.'));
      body.appendChild(node('h3', 'Listo para ver')); body.appendChild(node('p', 'Conecta el disco y pulsa ↻. Selecciona una película, elige idioma y subtítulos, y pulsa Reproducir. Durante el vídeo: Arriba muestra la barra; Atrás abre o cierra los ajustes.'));
      body.appendChild(node('h3', 'Archivos recomendados')); body.appendChild(node('p', 'MP4 con vídeo H.264 y audio AAC. Subtítulos SRT/VTT y XML en UTF-8. Cada MP4 debe tener como audio principal el idioma indicado en su nombre.'));
      if (state.warnings.length) { body.appendChild(node('h3', 'Avisos de la última búsqueda')); state.warnings.forEach(function (warning) { body.appendChild(node('p', warning)); }); }
    });
  }
  function chapters() {
    modal('Capítulos', 'ELIGE UNA ESCENA', function (body) {
      (state.movie.meta.chapters || []).filter(function (c) { return !player.duration || c.time < player.duration; }).forEach(function (chapter) { var button = node('button', clock(chapter.time) + '  ·  ' + chapter.title, 'secondary'); button.dataset.action = 'chapter'; button.dataset.time = chapter.time; body.appendChild(button); });
    }, null, 'chapters');
  }
  var lastError;
  var player = new DiscPlayer(native, $('webVideo'), {
    ready: function () { state.launching = false; bar(true); focus($('pauseButton')); if (document.hidden && player.state === 'PLAYING') player.toggle(); },
    time: function (data) { if (state.screen !== 'player') return; text('currentTime', clock(data.time)); text('totalTime', data.duration ? clock(data.duration) : '—'); var percent = data.duration ? Math.min(100, data.time / data.duration * 100) : 0; $('timelineFill').style.width = percent + '%'; $('timeline').setAttribute('aria-valuenow', Math.round(percent)); updateCaptions(); if (Date.now() - state.lastSave > 15000) { remember(false); state.lastSave = Date.now(); } },
    buffer: function (message) { if (state.screen === 'player') { text('bufferText', message); show('buffer', !!message); } },
    pause: function (paused) { text('pauseButton', paused ? '▶ Continuar' : 'Ⅱ Pausar'); text('playingState', paused ? 'En pausa' : ''); if (paused) remember(false); },
    notice: notice,
    ended: function () { if (!state.playing) return; remember(true); leave(false, true); notice('La película ha terminado.'); },
    error: function (report) { if (state.screen !== 'player') return; lastError = report; leave(false); modal('No se pudo reproducir este MP4.', 'REPRODUCCIÓN', function (body) { body.appendChild(node('p', 'Comprueba que el archivo esté completo y que se pueda reproducir desde el USB en la televisión. Puedes elegir otra versión de la película.')); body.appendChild(node('code', report.error)); }, [{ label: 'Volver a la película', action: 'closeModal' }, { label: 'Ver diagnóstico', action: 'diagnostic' }], 'error'); }
  });
  function action(name, element) {
    if (name === 'all' || name === 'continue') { state.filter = name === 'continue' ? 'continue' : 'all'; state.selected = 0; renderLibrary(true); }
    else if (name === 'movie') details(state.visible[Number(element.dataset.index)]);
    else if (name === 'refresh') scan();
    else if (name === 'help') help();
    else if (name === 'play' || name === 'restart') play(name === 'restart');
    else if (name === 'pause') { player.toggle(); bar(true); }
    else if (name === 'rewind' || name === 'forward') { player.seek(player.time + (name === 'forward' ? 10000 : -10000)); bar(true); }
    else if (name === 'settings') settings(true);
    else if (name === 'closeSettings') { settings(false); bar(true); focus($('pauseButton')); }
    else if (name === 'leave') leave(false);
    else if (name === 'library') leave(true);
    else if (name === 'back') { screen('library'); renderLibrary(true); if (state.needsScan) scan(); }
    else if (name === 'info') info();
    else if (name === 'closeModal') closeModal();
    else if (name === 'chapters') chapters();
    else if (name === 'chapter') { closeModal(); settings(false); bar(true); focus($('timeline')); player.seek(Number(element.dataset.time)); }
    else if (name === 'diagnostic') modal('Diagnóstico', 'DISCBOX MP4 · 1.0.0', function (body) { body.appendChild(node('pre', JSON.stringify(lastError, null, 2))); });
    else if (name === 'exit') { if (television) { try { tizen.application.getCurrentApplication().exit(); } catch (_) { closeModal(); } } else closeModal(); }
  }
  function back() {
    if (state.modal) { closeModal(); return; }
    if (state.screen === 'player') { settings(!state.settings); return; }
    if (state.screen === 'details') { action('back'); return; }
    modal('¿Terminamos por hoy?', 'DISCBOX', function (body) { body.appendChild(node('p', 'Tu colección estará aquí cuando vuelvas.')); }, [{ label: 'Seguir explorando', action: 'closeModal' }, { label: 'Salir', action: 'exit' }], 'exit');
  }
  function nearest(direction) {
    var container = state.modal ? $('modal') : state.screen === 'player' ? state.settings ? $('settings') : $('controls') : $(state.screen);
    var candidates = Array.prototype.filter.call(container.querySelectorAll('button, #modalBody'), visible), current = document.activeElement;
    if (!visible(current) || candidates.indexOf(current) < 0) { focus(candidates[0]); return; }
    var rect = current.getBoundingClientRect(), x = rect.left + rect.width / 2, y = rect.top + rect.height / 2, best = null, score = Infinity;
    candidates.forEach(function (candidate) {
      if (candidate === current || candidate.id === 'modalBody' && candidate.scrollHeight <= candidate.clientHeight + 5) return;
      var box = candidate.getBoundingClientRect(), dx = box.left + box.width / 2 - x, dy = box.top + box.height / 2 - y;
      var forward = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy;
      if (forward < 5) return;
      var cross = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
      var rank = forward + cross * 3;
      if (rank < score) { score = rank; best = candidate; }
    });
    if (best) { focus(best); if (state.modal && $('modalBody').contains(best)) best.scrollIntoView({ block: 'nearest' }); }
  }
  document.addEventListener('click', function (event) { var button = event.target.closest('button'); if (!button || button.disabled) return; if (button.dataset.cycle) cycle(button.dataset.cycle, 1); else if (button.dataset.action) action(button.dataset.action, button); });
  document.addEventListener('focusin', function (event) {
    var card = event.target.closest('.movie-card');
    if (card) { state.selected = Number(card.dataset.index); $('cards').querySelectorAll('.movie-card').forEach(function (c) { c.classList.toggle('selected', c === card); }); hero(state.visible[state.selected]); }
  });
  document.addEventListener('keydown', function (event) {
    var code = event.keyCode, key = event.key, direction = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' }[code], current = document.activeElement;
    if ([10009, 27, 8].indexOf(code) >= 0) { event.preventDefault(); if (!event.repeat) back(); return; }
    if (state.screen === 'player' && !state.modal && [10252, 415, 19, 413, 412, 417, 32].indexOf(code) >= 0) {
      event.preventDefault(); if (code === 413) leave(false); else if (code === 412 || code === 417) player.seek(player.time + (code === 417 ? 10000 : -10000)); else if (code !== 415 || player.state === 'PAUSED') { if (code !== 19 || player.state === 'PLAYING') player.toggle(); } bar(true); return;
    }
    if (code === 13 || key === 'Enter') { event.preventDefault(); if (event.repeat) return; if (state.screen === 'player' && !state.modal && !state.bar && !state.settings) { bar(true); focus($('pauseButton')); } else if (visible(current) && current.tagName === 'BUTTON') current.click(); return; }
    if (!direction) return;
    event.preventDefault();
    if (state.modal && current === $('modalBody')) {
      if (direction === 'up' || direction === 'down') { var old = current.scrollTop; current.scrollTop += direction === 'down' ? 130 : -130; if (Math.abs(old - current.scrollTop) > 1) return; }
      nearest(direction); return;
    }
    if (!state.modal && state.screen === 'player' && !state.bar && !state.settings) { bar(true); focus($('pauseButton')); return; }
    // The two visual columns form a predictable vertical route on a TV remote.
    if (!state.modal && state.screen === 'details') {
      if (current === $('audioChoice') && direction === 'down') { focus($('subtitleChoice')); return; }
      if (current === $('subtitleChoice') && direction === 'up') { focus($('audioChoice')); return; }
      if (current === $('subtitleChoice') && direction === 'down') { focus($('playButton')); return; }
      if (current && current.closest('.detail-actions') && direction === 'up') { focus($('subtitleChoice')); return; }
    }
    if (current && current.dataset && current.dataset.cycle && (direction === 'left' || direction === 'right')) { cycle(current.dataset.cycle, direction === 'left' ? -1 : 1); return; }
    if (current === $('timeline') && (direction === 'left' || direction === 'right')) { player.seek(player.time + (direction === 'left' ? -10000 : 10000)); bar(true); return; }
    if (!state.modal && state.screen === 'library') {
      var card = current && current.closest('.movie-card');
      if (card) {
        if (direction === 'left' || direction === 'right' || direction === 'down') {
          var next = state.selected + (direction === 'left' ? -1 : direction === 'right' ? 1 : 6);
          if (next >= 0 && next < state.visible.length) { state.selected = next; if (Math.floor(next / 6) !== state.page) renderLibrary(true); else focus($('cards').children[next % 6]); } return;
        }
        focus(document.querySelector('.nav.active')); return;
      }
      if (direction === 'down' && state.visible.length) { focus($('cards').children[state.selected % 6]); return; }
    }
    nearest(direction); if (state.bar && !state.modal) bar(true);
  });
  function resize() { var scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080); $('stage').style.transform = 'scale(' + scale + ')'; $('stage').style.left = Math.max(0, (window.innerWidth - 1920 * scale) / 2) + 'px'; $('stage').style.top = Math.max(0, (window.innerHeight - 1080 * scale) / 2) + 'px'; }
  window.addEventListener('resize', resize); resize();
  document.addEventListener('visibilitychange', function () { if (document.hidden) { remember(false); if (!player.busy && player.state === 'PLAYING') player.toggle(); } });
  window.addEventListener('pagehide', function () { remember(false); player.stop(); });
  if (television) {
    try { ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop', 'MediaRewind', 'MediaFastForward'].forEach(function (key) { try { tizen.tvinputdevice.registerKey(key); } catch (_) {} }); } catch (_) {}
    try { tizen.filesystem.addStorageStateChangeListener(function (storage) {
      if (state.playing && state.playing.movie.storage === storage.label && storage.state !== 'MOUNTED') { player.fail('Se desconectó el disco de la película.'); state.needsScan = true; return; }
      state.needsScan = true; clearTimeout(refreshTimer); refreshTimer = setTimeout(function () { if (state.screen === 'library' && !state.modal) scan(); }, 600);
    }); } catch (_) {}
  } else text('edition', 'DEMO VISUAL · MP4 EDITION · JoshKo007');
  window.DiscBox = { state: state, player: player, scan: scan, clock: clock };
  renderLibrary(false); scan();
})();
