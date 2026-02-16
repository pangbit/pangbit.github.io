/* ===================================================================
 *  Matrix Digital Rain Effect
 * =================================================================== */

(function () {
  'use strict';

  var CHARSET = '0123456789ABCDEF:<>+=';
  var FONT_SIZE = 14;
  var TRAIL_LENGTH = 25;  // number of visible characters in each trail

  function MatrixEffect() {
    this.canvas = null;
    this.ctx = null;
    this.columns = 0;
    this.streams = [];
  }

  MatrixEffect.prototype.start = function (canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this._initStreams();
  };

  /* Create one stream per column. Each stream has:
   *   y        – current head row position
   *   speed    – rows per frame
   *   chars[]  – fixed array of random characters (refreshed occasionally)
   *   length   – how many characters in this trail (varies for depth)
   */
  MatrixEffect.prototype._initStreams = function () {
    this.columns = Math.floor(this.canvas.width / FONT_SIZE);
    var rows = Math.ceil(this.canvas.height / FONT_SIZE);
    this.streams = [];

    for (var i = 0; i < this.columns; i++) {
      this.streams.push(this._makeStream(rows, true));
    }
  };

  MatrixEffect.prototype._makeStream = function (rows, stagger) {
    var len = Math.floor(TRAIL_LENGTH * 0.5 + Math.random() * TRAIL_LENGTH);
    var chars = [];
    for (var j = 0; j < len; j++) {
      chars.push(CHARSET[Math.floor(Math.random() * CHARSET.length)]);
    }
    return {
      y: stagger ? -(Math.random() * rows) : -(Math.random() * 10),
      speed: 0.3 + Math.random() * 0.4,
      chars: chars,
      length: len
    };
  };

  MatrixEffect.prototype.update = function () {
    var rows = Math.ceil(this.canvas.height / FONT_SIZE);
    var mouseCol = -1;
    if (typeof window.mouseX === 'number') {
      mouseCol = Math.floor(window.mouseX / FONT_SIZE);
    }

    for (var i = 0; i < this.streams.length; i++) {
      var s = this.streams[i];
      var boost = 1;
      if (mouseCol >= 0 && Math.abs(i - mouseCol) < 5) {
        boost = 1.4;
      }
      s.y += s.speed * boost;

      // Randomly mutate a character in the trail (shimmer effect)
      if (Math.random() < 0.15) {
        var idx = Math.floor(Math.random() * s.chars.length);
        s.chars[idx] = CHARSET[Math.floor(Math.random() * CHARSET.length)];
      }

      // Reset stream when it has fully passed off screen
      if ((s.y - s.length) > rows) {
        this.streams[i] = this._makeStream(rows, false);
      }
    }
  };

  MatrixEffect.prototype.draw = function () {
    var ctx = this.ctx;
    var w = this.canvas.width;
    var h = this.canvas.height;

    // Clear to black each frame (we draw full trails explicitly)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    ctx.font = FONT_SIZE + 'px monospace';
    ctx.textBaseline = 'top';

    for (var i = 0; i < this.streams.length; i++) {
      var s = this.streams[i];
      var headRow = Math.floor(s.y);

      for (var j = 0; j < s.length; j++) {
        var row = headRow - j;
        if (row < 0 || row * FONT_SIZE > h) continue;

        var x = i * FONT_SIZE;
        var y = row * FONT_SIZE;
        var ch = s.chars[j % s.chars.length];

        if (j === 0) {
          // Head: bright white
          ctx.fillStyle = '#ffffff';
        } else if (j === 1) {
          // Just behind head: bright green-white
          ctx.fillStyle = '#aaffaa';
        } else {
          // Trail: green fading to dark
          var t = 1 - (j / s.length);  // 1 at head, 0 at tail
          var alpha = t * t;            // quadratic fade for smooth tail
          var g = Math.floor(180 + 75 * t);
          ctx.fillStyle = 'rgba(0,' + g + ',65,' + alpha.toFixed(2) + ')';
        }

        ctx.fillText(ch, x, y);
      }
    }
  };

  MatrixEffect.prototype.stop = function () {
    this.canvas = null;
    this.ctx = null;
    this.streams = [];
    this.columns = 0;
  };

  MatrixEffect.prototype.resize = function (w, h) {
    if (this.canvas) {
      this._initStreams();
    }
  };

  window.MatrixEffect = MatrixEffect;

  window.terminal.registerCommand('matrix', 'Digital rain effect', function () {
    window.startEffect(new MatrixEffect());
    window.terminal.print('Matrix rain activated. Type "stop" to end.', 'line-info');
  });
})();
