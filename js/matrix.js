/* ===================================================================
 *  Matrix Digital Rain Effect  (Task 4)
 * =================================================================== */

(function () {
  'use strict';

  // Character set: digits + ASCII symbols (pure data stream aesthetic)
  var CHARSET = '0123456789!@#$%^&*()-_=+[]{}|;:\'",.<>?/\\~`';

  var FONT_SIZE = 16;

  function MatrixEffect() {
    this.canvas = null;
    this.ctx = null;
    this.columns = 0;
    this.drops = [];
    this.speeds = [];
  }

  /**
   * Initialise the effect with the given canvas and context.
   */
  MatrixEffect.prototype.start = function (canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this._initColumns();
  };

  /**
   * Advance the simulation by one tick.
   */
  MatrixEffect.prototype.update = function () {
    var mouseCol = -1;
    if (typeof window.mouseX === 'number') {
      mouseCol = Math.floor(window.mouseX / FONT_SIZE);
    }

    for (var i = 0; i < this.columns; i++) {
      // Mouse interaction: columns within 5 of the cursor get a speed boost
      var boost = 1;
      if (mouseCol >= 0 && Math.abs(i - mouseCol) < 5) {
        boost = 2;
      }

      this.drops[i] += this.speeds[i] * boost;

      // Reset column when it falls off-screen (with some randomness)
      if (this.drops[i] * FONT_SIZE > this.canvas.height && Math.random() > 0.975) {
        this.drops[i] = 0;
        // Give it a fresh random speed
        this.speeds[i] = 0.5 + Math.random();
      }
    }
  };

  /**
   * Render the current frame. The semi-transparent black overlay produces the
   * trailing fade that is the hallmark of the Matrix rain look.
   */
  MatrixEffect.prototype.draw = function () {
    var ctx = this.ctx;

    // Trail fade: do NOT clear the canvas — paint a translucent black rect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.font = FONT_SIZE + 'px monospace';

    for (var i = 0; i < this.columns; i++) {
      // Pick a random character from the charset each frame (characters shimmer)
      var ch = CHARSET[Math.floor(Math.random() * CHARSET.length)];
      var x = i * FONT_SIZE;
      var y = this.drops[i] * FONT_SIZE;

      // Head character: bright white-green
      ctx.fillStyle = '#aaffaa';
      ctx.fillText(ch, x, y);

      // Draw a slightly dimmer secondary head one step behind for glow depth
      if (this.drops[i] > 1) {
        var ch2 = CHARSET[Math.floor(Math.random() * CHARSET.length)];
        ctx.fillStyle = '#00ff41';
        ctx.fillText(ch2, x, y - FONT_SIZE);
      }
    }
  };

  /**
   * Stop the effect and release resources.
   */
  MatrixEffect.prototype.stop = function () {
    this.canvas = null;
    this.ctx = null;
    this.drops = [];
    this.speeds = [];
    this.columns = 0;
  };

  /**
   * Handle a viewport resize by recalculating the column grid.
   */
  MatrixEffect.prototype.resize = function (w, h) {
    if (this.canvas) {
      this._initColumns();
    }
  };

  /**
   * Internal: calculate columns from canvas width and initialise arrays.
   */
  MatrixEffect.prototype._initColumns = function () {
    this.columns = Math.floor(this.canvas.width / FONT_SIZE);
    this.drops = new Array(this.columns);
    this.speeds = new Array(this.columns);

    for (var i = 0; i < this.columns; i++) {
      // Staggered start: random negative values so columns begin at different times
      this.drops[i] = -(Math.random() * (this.canvas.height / FONT_SIZE));
      this.speeds[i] = 0.5 + Math.random();
    }
  };

  // Expose globally
  window.MatrixEffect = MatrixEffect;

  // Register the terminal command
  window.terminal.registerCommand('matrix', 'Digital rain effect', function () {
    window.startEffect(new MatrixEffect());
    window.terminal.print('Matrix rain activated. Type "stop" to end.', 'line-info');
  });
})();
