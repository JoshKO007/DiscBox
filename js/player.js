(function (root) {
  'use strict';
  function errorText(e) { return typeof e === 'string' ? e : [e && e.name, e && e.message].filter(Boolean).join(': ') || 'Error de reproducción'; }
  function Player(native, video, events) {
    this.native = native; this.video = video; this.events = events;
    this.generation = 0; this.operation = 0; this.state = 'NONE'; this.busy = false; this.closing = false;
    this.waiters = []; this.time = 0; this.duration = 0; this.trace = []; this.timer = null; this.operationTimer = null; this.uri = '';
  }
  Player.prototype.log = function (event, data) {
    this.trace.push({ at: new Date().toISOString(), event: event, state: this.state, data: data || '' });
    if (this.trace.length > 100) this.trace.shift();
  };
  Player.prototype.emit = function (type, data) { if (this.events[type]) this.events[type](data); };
  Player.prototype.endBusy = function (operation) {
    if (operation !== undefined && operation !== this.operation) return true;
    this.operation++; clearTimeout(this.operationTimer); this.operationTimer = null; this.busy = false;
    if (this.closing) { this.closeNow(); return true; }
    return false;
  };
  Player.prototype.closeNow = function () {
    var native = this.native;
    clearInterval(this.timer); this.timer = null; this.closing = false;
    if (native) {
      try { if (native.getState() !== 'NONE') { native.stop(); native.close(); } } catch (e) { this.log('close-warning', errorText(e)); try { native.close(); } catch (_) {} }
    } else {
      this.video.onloadedmetadata = this.video.onerror = this.video.onended = this.video.ontimeupdate = this.video.onwaiting = this.video.onplaying = this.video.onseeked = null;
      this.video.pause(); this.video.removeAttribute('src'); this.video.load();
    }
    this.state = 'NONE'; this.log('closed');
    var waiters = this.waiters.splice(0); waiters.forEach(function (done) { done(); });
  };
  Player.prototype.stop = function () {
    var self = this; this.generation++; clearInterval(this.timer); this.timer = null; this.closing = true;
    return new Promise(function (resolve) { self.waiters.push(resolve); if (!self.busy) self.closeNow(); });
  };
  Player.prototype.fail = function (error) {
    var message = errorText(error);
    this.log('error', message);
    var report = { version: '1.0.0', error: message, uri: this.uri, state: this.state, timeMs: this.time, durationMs: this.duration, trace: this.trace.slice() };
    this.endBusy(); this.stop(); this.emit('error', report);
  };
  Player.prototype.start = function (uri, resumeMs) {
    var self = this, stopped = this.stop(), token = this.generation;
    return stopped.then(function () {
      if (token !== self.generation) return;
      if (self.native && /^file:\/\//i.test(uri)) {
        try { uri = decodeURIComponent(new URL(uri).pathname); } catch (_) {}
      }
      self.time = 0; self.duration = 0; self.uri = uri; self.trace = []; self.state = 'IDLE'; self.log('open', uri);
      self.emit('buffer', 'Abriendo película…'); self.busy = true; var operation = ++self.operation;
      self.operationTimer = setTimeout(function () { if (token === self.generation) self.fail('La preparación del MP4 no terminó en 45 segundos.'); else { self.endBusy(operation); } }, 45000);
      function current() { return token === self.generation; }
      function failed(e) { if (current()) self.fail(e); }
      function prepareFailed(e) { if (self.endBusy(operation) || !current()) return; self.fail(e); }
      function launch() {
        if (!current()) return;
        try {
          if (self.native) self.native.play();
          else { var promise = self.video.play(); if (promise && promise.catch) promise.catch(failed); }
          if (!current()) return;
          self.state = 'PLAYING'; self.log('play'); self.emit('ready', self.duration); self.emit('pause', false); self.emit('buffer', '');
          // Optional native subtitle suppression cannot abort MP4 playback.
          if (self.native) {
            try { var tracks = self.native.getTotalTrackInfo(); if (tracks.some(function (t) { return t.type === 'TEXT'; })) self.native.setSilentSubtitle(true); } catch (e) { self.log('subtitle-warning', errorText(e)); }
          }
          self.timer = setInterval(function () {
            if (!current() || self.busy || self.closing) return;
            try {
              if (self.native) { self.tick(self.native.getCurrentTime()); if (!self.duration) self.duration = self.native.getDuration(); }
              else self.tick(self.video.currentTime * 1000);
            } catch (_) {}
          }, 200);
        } catch (e) { failed(e); }
      }
      function prepared() {
        if (self.endBusy(operation) || !current()) return;
        self.state = 'READY'; self.log('prepared');
        try { self.duration = self.native ? self.native.getDuration() : self.video.duration * 1000; } catch (_) { self.duration = 0; }
        if (!isFinite(self.duration)) self.duration = 0;
        if (resumeMs > 0 && self.duration > 0) self.seek(Math.min(resumeMs, Math.max(0, self.duration - 1000)), launch);
        else launch();
      }
      if (self.native) {
        try {
          self.native.open(uri);
          self.native.setListener({
            onbufferingstart: function () { if (current()) { self.log('buffer-start'); self.emit('buffer', 'Cargando vídeo…'); } },
            onbufferingprogress: function (percent) { if (current()) self.emit('buffer', 'Cargando vídeo · ' + Math.round(percent) + '%'); },
            onbufferingcomplete: function () { if (current()) { self.log('buffer-complete'); self.emit('buffer', ''); } },
            oncurrentplaytime: function (time) { if (current() && !self.busy) self.tick(time); },
            onstreamcompleted: function () { if (current()) { self.log('ended'); self.stop(); self.emit('ended'); } },
            onerror: failed,
            onerrormsg: function (code, message) { failed(code + ': ' + message); },
            onsubtitlechange: function () {},
            onresourceconflicted: function () { failed('Otro servicio de la televisión tomó el reproductor.'); }
          });
          self.native.setDisplayRect(0, 0, 1920, 1080);
          try { self.native.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX'); } catch (e) { self.log('display-warning', errorText(e)); }
          self.native.prepareAsync(prepared, prepareFailed);
        } catch (e) { prepareFailed(e); }
      } else {
        self.video.onloadedmetadata = prepared; self.video.onerror = function () { if (self.busy && self.operation === operation) prepareFailed('El navegador no pudo abrir el MP4.'); else failed('El navegador no pudo abrir el MP4.'); };
        self.video.onended = function () { if (current()) { self.stop(); self.emit('ended'); } };
        self.video.onwaiting = function () { if (current()) self.emit('buffer', 'Cargando vídeo…'); };
        self.video.onplaying = function () { if (current()) self.emit('buffer', ''); };
        self.video.src = uri; self.video.load();
      }
    });
  };
  Player.prototype.tick = function (time) { if (!isFinite(time) || time < 0) return; this.time = time; this.emit('time', { time: time, duration: this.duration }); };
  Player.prototype.toggle = function () {
    if (this.busy || this.closing || (this.state !== 'PLAYING' && this.state !== 'PAUSED')) return;
    try {
      var pause = this.state === 'PLAYING';
      if (this.native) this.native[pause ? 'pause' : 'play']();
      else if (pause) this.video.pause(); else { var result = this.video.play(); if (result && result.catch) result.catch(this.fail.bind(this)); }
      this.state = pause ? 'PAUSED' : 'PLAYING'; this.log(pause ? 'pause' : 'resume'); this.emit('pause', pause);
    } catch (e) { this.fail(e); }
  };
  Player.prototype.seek = function (target, done) {
    var self = this, token = this.generation;
    if (this.busy || this.closing || !/^(READY|PLAYING|PAUSED)$/.test(this.state) || !isFinite(target)) return;
    target = Math.round(Math.max(0, Math.min(target, Math.max(0, this.duration - 500))));
    this.busy = true; var operation = ++this.operation; this.log('seek', target); this.emit('buffer', 'Buscando posición…');
    function finish(error) {
      if (self.endBusy(operation) || token !== self.generation) return;
      if (error) self.emit('notice', 'No se pudo ir a esa posición.'); else self.tick(target);
      self.emit('buffer', ''); if (done) done();
    }
    this.operationTimer = setTimeout(function () { if (token === self.generation) self.fail('El reproductor no terminó el salto de posición.'); else self.endBusy(operation); }, 20000);
    try {
      if (this.native) this.native.seekTo(target, function () { finish(); }, finish);
      else { this.video.onseeked = function () { self.video.onseeked = null; finish(); }; this.video.currentTime = target / 1000; if (Math.abs(this.video.currentTime * 1000 - target) < 1 && target === 0) finish(); }
    } catch (e) { finish(e); }
  };
  root.DiscPlayer = Player;
})(window);
