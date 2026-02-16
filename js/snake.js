/* ===================================================================
 *  Snake Game Effect  (Task 7)
 * =================================================================== */

(function () {
  'use strict';

  var GRID_SIZE = 20; // pixels per cell

  // 8-bit retro palette
  var COLOR_BG     = '#0a0e2a';
  var COLOR_SNAKE   = '#00ff41';
  var COLOR_HEAD    = '#44ff77';
  var COLOR_FOOD    = '#ff4444';
  var COLOR_GRID    = '#111133';

  function SnakeGame() {
    this.canvas = null;
    this.ctx = null;
    this.cols = 0;
    this.rows = 0;

    this.snake = [];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = { x: 0, y: 0 };
    this.score = 0;
    this.gameOver = false;

    this.tickTimer = 0;
    this.tickInterval = 8; // frames between moves

    this._keyHandler = null;
    this._frameCount = 0; // for pulse animation
  }

  /* ── start(canvas, ctx) ── */

  SnakeGame.prototype.start = function (canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Hide terminal
    document.getElementById('terminal').style.display = 'none';

    // Bring canvas to front so it receives visual focus
    canvas.style.zIndex = '100';

    // Compute grid dimensions
    this.cols = Math.floor(canvas.width / GRID_SIZE);
    this.rows = Math.floor(canvas.height / GRID_SIZE);

    // Initialise game state
    this._initGame();

    // Bind keydown listener (store reference for removal)
    var self = this;
    this._keyHandler = function (e) {
      self._onKeyDown(e);
    };
    document.addEventListener('keydown', this._keyHandler);
  };

  /* ── Internal: initialise / reset game state ── */

  SnakeGame.prototype._initGame = function () {
    var cx = Math.floor(this.cols / 2);
    var cy = Math.floor(this.rows / 2);

    this.snake = [{ x: cx, y: cy }];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.gameOver = false;
    this.tickTimer = 0;
    this.tickInterval = 8;
    this._frameCount = 0;

    this._placeFood();
  };

  /* ── Internal: place food at a random position not occupied by the snake ── */

  SnakeGame.prototype._placeFood = function () {
    var occupied = {};
    for (var i = 0; i < this.snake.length; i++) {
      occupied[this.snake[i].x + ',' + this.snake[i].y] = true;
    }

    var attempts = 0;
    var maxAttempts = this.cols * this.rows;
    do {
      this.food = {
        x: Math.floor(Math.random() * this.cols),
        y: Math.floor(Math.random() * this.rows)
      };
      attempts++;
    } while (occupied[this.food.x + ',' + this.food.y] && attempts < maxAttempts);
  };

  /* ── Internal: keydown handler ── */

  SnakeGame.prototype._onKeyDown = function (e) {
    var key = e.key;

    // Arrow keys / WASD → set nextDirection (prevent 180-degree turns)
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      if (this.direction.y !== 1) { // not moving down
        this.nextDirection = { x: 0, y: -1 };
      }
      e.preventDefault();
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      if (this.direction.y !== -1) { // not moving up
        this.nextDirection = { x: 0, y: 1 };
      }
      e.preventDefault();
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      if (this.direction.x !== 1) { // not moving right
        this.nextDirection = { x: -1, y: 0 };
      }
      e.preventDefault();
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      if (this.direction.x !== -1) { // not moving left
        this.nextDirection = { x: 1, y: 0 };
      }
      e.preventDefault();
    } else if (key === 'Escape') {
      window.stopEffect();
      e.preventDefault();
    } else if (key === 'Enter') {
      if (this.gameOver) {
        this._initGame();
      }
      e.preventDefault();
    }
  };

  /* ── update() ── */

  SnakeGame.prototype.update = function () {
    this._frameCount++;

    if (this.gameOver) {
      return;
    }

    this.tickTimer++;
    if (this.tickTimer < this.tickInterval) {
      return;
    }
    this.tickTimer = 0;

    // Apply nextDirection (but prevent reversing: if new dir is opposite of current, ignore)
    var nx = this.nextDirection.x;
    var ny = this.nextDirection.y;
    if (!(nx === -this.direction.x && ny === -this.direction.y)) {
      this.direction.x = nx;
      this.direction.y = ny;
    }

    // Compute new head position
    var head = this.snake[0];
    var newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= this.cols ||
        newHead.y < 0 || newHead.y >= this.rows) {
      this.gameOver = true;
      return;
    }

    // Self collision (check against all current segments)
    for (var i = 0; i < this.snake.length; i++) {
      if (this.snake[i].x === newHead.x && this.snake[i].y === newHead.y) {
        this.gameOver = true;
        return;
      }
    }

    // Check food collision
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score++;
      this._placeFood();
      // Speed up (decrease interval, min 3)
      this.tickInterval = Math.max(3, this.tickInterval - 0.3);
      // Do NOT remove tail — snake grows
    } else {
      // Remove tail
      this.snake.pop();
    }

    // Add new head
    this.snake.unshift(newHead);
  };

  /* ── draw() ── */

  SnakeGame.prototype.draw = function () {
    var ctx = this.ctx;
    var canvas = this.canvas;
    var cols = this.cols;
    var rows = this.rows;

    // Fill background
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw faint grid lines
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    var i;
    for (i = 0; i <= cols; i++) {
      var x = i * GRID_SIZE;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rows * GRID_SIZE);
    }
    for (i = 0; i <= rows; i++) {
      var y = i * GRID_SIZE;
      ctx.moveTo(0, y);
      ctx.lineTo(cols * GRID_SIZE, y);
    }
    ctx.stroke();

    // Draw snake segments
    for (i = 0; i < this.snake.length; i++) {
      var seg = this.snake[i];
      if (i === 0) {
        // Head — slightly brighter
        ctx.fillStyle = COLOR_HEAD;
      } else {
        ctx.fillStyle = COLOR_SNAKE;
      }
      ctx.fillRect(
        seg.x * GRID_SIZE + 1,
        seg.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2
      );
    }

    // Draw food with pulse effect
    var pulse = Math.sin(this._frameCount * 0.1) * 0.15 + 0.85; // oscillates between 0.7 and 1.0
    var foodSize = GRID_SIZE * pulse;
    var offset = (GRID_SIZE - foodSize) / 2;

    ctx.fillStyle = COLOR_FOOD;
    ctx.fillRect(
      this.food.x * GRID_SIZE + offset,
      this.food.y * GRID_SIZE + offset,
      foodSize,
      foodSize
    );

    // Add a subtle glow to the food
    ctx.shadowColor = COLOR_FOOD;
    ctx.shadowBlur = 8 + Math.sin(this._frameCount * 0.1) * 4;
    ctx.fillRect(
      this.food.x * GRID_SIZE + offset,
      this.food.y * GRID_SIZE + offset,
      foodSize,
      foodSize
    );
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw score in top-right corner
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Score: ' + this.score, canvas.width - 16, 28);
    ctx.textAlign = 'left'; // reset

    // Game over overlay
    if (this.gameOver) {
      // Dark overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      var centerX = canvas.width / 2;
      var centerY = canvas.height / 2;

      // GAME OVER text
      ctx.fillStyle = COLOR_FOOD;
      ctx.font = 'bold 48px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', centerX, centerY - 40);

      // Score
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.fillText('Score: ' + this.score, centerX, centerY + 10);

      // Instructions
      ctx.fillStyle = '#888888';
      ctx.font = '16px monospace';
      ctx.fillText('ESC to exit  |  ENTER to retry', centerX, centerY + 50);

      // Reset text alignment
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  };

  /* ── stop() ── */

  SnakeGame.prototype.stop = function () {
    // Show terminal again
    document.getElementById('terminal').style.display = '';

    // Remove keydown listener
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }

    // Reset canvas z-index
    if (this.canvas) {
      this.canvas.style.zIndex = '';
    }

    this.canvas = null;
    this.ctx = null;
  };

  /* ── resize(w, h) ── */

  SnakeGame.prototype.resize = function (w, h) {
    if (this.canvas) {
      this.cols = Math.floor(this.canvas.width / GRID_SIZE);
      this.rows = Math.floor(this.canvas.height / GRID_SIZE);
      this._initGame(); // restart on resize
    }
  };

  // Expose globally
  window.SnakeGame = SnakeGame;

  // Register the terminal command
  window.terminal.registerCommand('snake', 'Pixel snake game', function () {
    window.startEffect(new SnakeGame());
  });
})();
