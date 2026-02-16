/* ===================================================================
 *  Conway's Game of Life Effect  (Task 6)
 * =================================================================== */

(function () {
  'use strict';

  var CELL_SIZE = 6;

  function LifeEffect() {
    this.canvas = null;
    this.ctx = null;
    this.cols = 0;
    this.rows = 0;
    this.grid = null;
    this.age = null;
    this.generation = 0;
    this.frameCount = 0;

    // Bound event handlers (stored for removal in stop())
    this._onMouseDown = null;
    this._onMouseMove = null;
    this._onMouseUp = null;
    this._mouseDown = false;
  }

  /**
   * Initialise the effect with the given canvas and context.
   */
  LifeEffect.prototype.start = function (canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.generation = 0;
    this.frameCount = 0;
    this._mouseDown = false;

    this._initGrid();
    this._bindListeners();
  };

  /**
   * Advance the simulation state. Evolves every 6 frames (~10 tps at 60fps).
   */
  LifeEffect.prototype.update = function () {
    this.frameCount++;

    if (this.frameCount % 6 !== 0) {
      return;
    }

    var rows = this.rows;
    var cols = this.cols;
    var grid = this.grid;
    var age = this.age;

    // Allocate next generation grid
    var nextGrid = this._createArray(rows, cols, 0);

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var neighbors = this._countNeighbors(r, c);
        var alive = grid[r][c];

        if (alive) {
          // Alive cell survives with 2 or 3 neighbors
          nextGrid[r][c] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
        } else {
          // Dead cell becomes alive with exactly 3 neighbors
          nextGrid[r][c] = (neighbors === 3) ? 1 : 0;
        }

        // Update age tracking
        if (nextGrid[r][c] === 1) {
          // Cell is alive — reset age
          age[r][c] = 0;
        } else if (alive && nextGrid[r][c] === 0) {
          // Cell just died
          age[r][c] = 1;
        } else if (!alive && age[r][c] > 0) {
          // Cell was already dead — increment age (cap at 20)
          age[r][c] = Math.min(age[r][c] + 1, 20);
        }
      }
    }

    this.grid = nextGrid;
    this.generation++;
  };

  /**
   * Render the current frame.
   */
  LifeEffect.prototype.draw = function () {
    var ctx = this.ctx;
    var canvas = this.canvas;
    var rows = this.rows;
    var cols = this.cols;
    var grid = this.grid;
    var age = this.age;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = c * CELL_SIZE;
        var y = r * CELL_SIZE;

        if (grid[r][c] === 1) {
          // Alive cell — bright green
          ctx.fillStyle = '#00ff41';
          ctx.fillRect(x, y, CELL_SIZE - 1, CELL_SIZE - 1);
        } else if (age[r][c] > 0 && age[r][c] < 15) {
          // Recently dead cell — fading green glow
          var alpha = (1 - age[r][c] / 15).toFixed(2);
          ctx.fillStyle = 'rgba(0, 255, 65, ' + alpha + ')';
          ctx.fillRect(x, y, CELL_SIZE - 1, CELL_SIZE - 1);
        }
      }
    }

    // Generation counter at bottom-left
    ctx.font = '14px monospace';
    ctx.fillStyle = '#00aaff';
    ctx.fillText('Generation: ' + this.generation, 10, canvas.height - 12);
  };

  /**
   * Stop the effect and clean up event listeners.
   */
  LifeEffect.prototype.stop = function () {
    this._unbindListeners();
    this.canvas = null;
    this.ctx = null;
    this.grid = null;
    this.age = null;
    this.cols = 0;
    this.rows = 0;
  };

  /**
   * Handle viewport resize: recalculate grid dimensions and reinitialise.
   */
  LifeEffect.prototype.resize = function (w, h) {
    if (this.canvas) {
      this._initGrid();
    }
  };

  /* ── Private helpers ── */

  /**
   * Create a 2D array of the given dimensions filled with a default value.
   */
  LifeEffect.prototype._createArray = function (rows, cols, defaultVal) {
    var arr = new Array(rows);
    for (var r = 0; r < rows; r++) {
      arr[r] = new Array(cols);
      for (var c = 0; c < cols; c++) {
        arr[r][c] = defaultVal;
      }
    }
    return arr;
  };

  /**
   * Initialise the grid dimensions and populate with random cells (~25% alive).
   */
  LifeEffect.prototype._initGrid = function () {
    this.cols = Math.floor(this.canvas.width / CELL_SIZE);
    this.rows = Math.floor(this.canvas.height / CELL_SIZE);

    this.grid = this._createArray(this.rows, this.cols, 0);
    this.age = this._createArray(this.rows, this.cols, 0);

    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        this.grid[r][c] = Math.random() < 0.25 ? 1 : 0;
      }
    }
  };

  /**
   * Count the live neighbors around (row, col) using toroidal wrapping.
   */
  LifeEffect.prototype._countNeighbors = function (row, col) {
    var count = 0;
    var rows = this.rows;
    var cols = this.cols;
    var grid = this.grid;

    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        var nr = (row + dr + rows) % rows;
        var nc = (col + dc + cols) % cols;
        count += grid[nr][nc];
      }
    }

    return count;
  };

  /**
   * Toggle or paint a cell at the given pixel coordinates.
   */
  LifeEffect.prototype._paintCell = function (px, py) {
    var c = Math.floor(px / CELL_SIZE);
    var r = Math.floor(py / CELL_SIZE);

    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      this.grid[r][c] = 1;
      this.age[r][c] = 0;
    }
  };

  /**
   * Toggle a cell at the given pixel coordinates (for initial click).
   */
  LifeEffect.prototype._toggleCell = function (px, py) {
    var c = Math.floor(px / CELL_SIZE);
    var r = Math.floor(py / CELL_SIZE);

    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
      this.grid[r][c] = this.grid[r][c] ? 0 : 1;
      this.age[r][c] = 0;
    }
  };

  /**
   * Bind mouse event listeners to the canvas for click and drag painting.
   */
  LifeEffect.prototype._bindListeners = function () {
    var self = this;

    this._onMouseDown = function (e) {
      self._mouseDown = true;
      var rect = self.canvas.getBoundingClientRect();
      var px = e.clientX - rect.left;
      var py = e.clientY - rect.top;
      self._toggleCell(px, py);
    };

    this._onMouseMove = function (e) {
      if (!self._mouseDown) return;
      var rect = self.canvas.getBoundingClientRect();
      var px = e.clientX - rect.left;
      var py = e.clientY - rect.top;
      self._paintCell(px, py);
    };

    this._onMouseUp = function () {
      self._mouseDown = false;
    };

    this.canvas.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);
  };

  /**
   * Remove all event listeners attached by _bindListeners.
   */
  LifeEffect.prototype._unbindListeners = function () {
    if (this.canvas && this._onMouseDown) {
      this.canvas.removeEventListener('mousedown', this._onMouseDown);
    }
    if (this._onMouseMove) {
      document.removeEventListener('mousemove', this._onMouseMove);
    }
    if (this._onMouseUp) {
      document.removeEventListener('mouseup', this._onMouseUp);
    }

    this._onMouseDown = null;
    this._onMouseMove = null;
    this._onMouseUp = null;
    this._mouseDown = false;
  };

  // Expose globally
  window.LifeEffect = LifeEffect;

  // Register the terminal command
  window.terminal.registerCommand('life', "Conway's Game of Life", function () {
    window.startEffect(new LifeEffect());
    window.terminal.print(
      'Game of Life activated. Click to draw cells. Type "stop" to end.',
      'line-info'
    );
  });
})();
