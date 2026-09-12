(function (root) {
  'use strict';
  function stamp(value) {
    var m = /^(?:(\d{1,3}):)?(\d{2}):(\d{2})[.,](\d{3})$/.exec(value);
    if (!m || Number(m[2]) >= 60 || Number(m[3]) >= 60) return NaN;
    return ((Number(m[1] || 0) * 60 + Number(m[2])) * 60 + Number(m[3])) * 1000 + Number(m[4]);
  }
  function plain(value) {
    return value.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\{\\[^}]*\}/g, '').replace(/&(amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-f]+);/gi, function (entity, code) {
      var named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
      if (code[0] !== '#') return named[code.toLowerCase()] || entity;
      var n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return n > 0 && n <= 0x10FFFF && !(n >= 0xD800 && n <= 0xDFFF) ? String.fromCodePoint(n) : '';
    }).trim().slice(0, 2000);
  }
  function parse(text) {
    if (text.length > 2097152) throw new Error('El subtítulo supera 2 MiB.');
    var cues = [], maxEnds = [], maximum = 0;
    text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split(/\n[\t ]*\n/).forEach(function (block) {
      var lines = block.trim().split('\n');
      if (/^(NOTE(?:\s|$)|STYLE$|REGION$|WEBVTT(?:\s|$))/.test(lines[0])) return;
      var index = lines[0].indexOf('-->') >= 0 ? 0 : 1;
      var timing = /^(\S+)\s+-->\s+(\S+)/.exec(lines[index] || '');
      if (!timing) return;
      var start = stamp(timing[1]), end = stamp(timing[2]), value = plain(lines.slice(index + 1).join('\n'));
      if (!isFinite(start) || !isFinite(end) || end <= start || !value) return;
      cues.push({ start: start, end: end, text: value });
    });
    if (cues.length > 20000) throw new Error('El subtítulo tiene más de 20 000 entradas.');
    if (!cues.length) throw new Error('No se encontraron tiempos válidos en el subtítulo.');
    cues.sort(function (a, b) { return a.start - b.start || a.end - b.end; });
    cues.forEach(function (cue) { maximum = Math.max(maximum, cue.end); maxEnds.push(maximum); });
    return {
      cues: cues,
      at: function (time, delay) {
        time -= delay || 0;
        var low = 0, high = cues.length;
        while (low < high) { var mid = (low + high) >>> 1; if (cues[mid].start <= time) low = mid + 1; else high = mid; }
        var active = [];
        for (var i = low - 1; i >= 0 && maxEnds[i] > time; i--) {
          if (cues[i].end > time) { active.push(cues[i].text); if (active.length === 4) break; }
        }
        return active.reverse().join('\n');
      }
    };
  }
  root.DiscSubtitles = { parse: parse, stamp: stamp, plain: plain };
})(window);
