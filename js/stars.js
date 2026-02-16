/* ===================================================================
 *  Particle Starfield Effect — js/stars.js  (Task 5)
 *
 *  A first-person starfield flythrough with mouse-controlled vanishing
 *  point and occasional dramatic meteors.
 * =================================================================== */

(function () {
  'use strict';

  /* ── Helpers ── */

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /* ── Meteor color palette ── */

  var METEOR_COLORS = [
    { r: 0,   g: 255, b: 255 },  // cyan
    { r: 255, g: 0,   b: 255 },  // magenta
    { r: 255, g: 215, b: 0   },  // gold
    { r: 255, g: 100, b: 50  },  // orange-red
    { r: 100, g: 200, b: 255 },  // ice blue
    { r: 180, g: 100, b: 255 },  // violet
  ];

  /* ── StarfieldEffect constructor ── */

  function StarfieldEffect() {
    this.canvas  = null;
    this.ctx     = null;
    this.stars   = [];
    this.meteors = [];
    this.centerX = 0;
    this.centerY = 0;
    this.meteorTimer = 0;
    this.STAR_COUNT  = 450;
    this.SPEED       = 0.005;
    this.PROJECTION  = 300;
  }

  /* ── start(canvas, ctx) ── */

  StarfieldEffect.prototype.start = function (canvas, ctx) {
    this.canvas  = canvas;
    this.ctx     = ctx;
    this.centerX = canvas.width  / 2;
    this.centerY = canvas.height / 2;

    // Populate stars
    this.stars = [];
    for (var i = 0; i < this.STAR_COUNT; i++) {
      this.stars.push(this._makeStar(true));
    }

    // Meteor state
    this.meteors     = [];
    this.meteorTimer = Math.floor(rand(120, 300));
  };

  /* Create a single star.  fresh = true randomises z across full range */
  StarfieldEffect.prototype._makeStar = function (fresh) {
    var x = rand(-1, 1);
    var y = rand(-1, 1);
    var z = fresh ? rand(0.01, 1) : 1;
    // Pre-compute initial screen position so the first frame has no stale streak
    var sx = (x / z) * this.PROJECTION + this.centerX;
    var sy = (y / z) * this.PROJECTION + this.centerY;
    return { x: x, y: y, z: z, prevX: sx, prevY: sy };
  };

  /* ── update() ── */

  StarfieldEffect.prototype.update = function () {
    var canvas = this.canvas;
    var mx = window.mouseX || canvas.width  / 2;
    var my = window.mouseY || canvas.height / 2;

    // Smooth the vanishing-point toward the mouse
    this.centerX = lerp(this.centerX, mx, 0.02);
    this.centerY = lerp(this.centerY, my, 0.02);

    // Move each star toward the camera
    for (var i = 0; i < this.stars.length; i++) {
      var s = this.stars[i];

      // Store previous projected position for streak lines
      s.prevX = (s.x / s.z) * this.PROJECTION + this.centerX;
      s.prevY = (s.y / s.z) * this.PROJECTION + this.centerY;

      s.z -= this.SPEED;

      if (s.z <= 0) {
        this.stars[i] = this._makeStar(false);
      }
    }

    // ── Meteor logic ──
    this.meteorTimer--;
    if (this.meteorTimer <= 0) {
      this._spawnMeteor();
      this.meteorTimer = Math.floor(rand(120, 300));
    }

    for (var j = this.meteors.length - 1; j >= 0; j--) {
      var m = this.meteors[j];
      m.x    += m.vx;
      m.y    += m.vy;
      m.life -= m.decay;

      // Push positions into trail history
      m.trail.push({ x: m.x, y: m.y });
      if (m.trail.length > m.trailLen) {
        m.trail.shift();
      }

      if (m.life <= 0) {
        this.meteors.splice(j, 1);
      }
    }
  };

  /* Spawn a new meteor with random colour, position, and velocity */
  StarfieldEffect.prototype._spawnMeteor = function () {
    var w = this.canvas.width;
    var h = this.canvas.height;
    var color = METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)];

    // Start from a random edge
    var edge = Math.floor(rand(0, 4));
    var x, y, vx, vy;
    switch (edge) {
      case 0: // top
        x = rand(0, w); y = -10;
        vx = rand(-3, 3); vy = rand(4, 8);
        break;
      case 1: // right
        x = w + 10; y = rand(0, h);
        vx = rand(-8, -4); vy = rand(-2, 4);
        break;
      case 2: // bottom
        x = rand(0, w); y = h + 10;
        vx = rand(-3, 3); vy = rand(-8, -4);
        break;
      default: // left
        x = -10; y = rand(0, h);
        vx = rand(4, 8); vy = rand(-2, 4);
        break;
    }

    this.meteors.push({
      x:        x,
      y:        y,
      vx:       vx,
      vy:       vy,
      life:     1,
      decay:    rand(0.005, 0.012),
      radius:   rand(2.5, 4.5),
      color:    color,
      trail:    [{ x: x, y: y }],
      trailLen: Math.floor(rand(30, 60)),
    });
  };

  /* ── draw() ── */

  StarfieldEffect.prototype.draw = function () {
    var ctx    = this.ctx;
    var canvas = this.canvas;
    var w      = canvas.width;
    var h      = canvas.height;

    // ── Background: radial nebula gradient ──
    ctx.clearRect(0, 0, w, h);
    var grd = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    grd.addColorStop(0, '#0a0015');
    grd.addColorStop(0.5, '#060010');
    grd.addColorStop(1, '#000000');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // ── Draw stars ──
    for (var i = 0; i < this.stars.length; i++) {
      var s = this.stars[i];

      var sx = (s.x / s.z) * this.PROJECTION + this.centerX;
      var sy = (s.y / s.z) * this.PROJECTION + this.centerY;

      // Skip off-screen stars
      if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) {
        continue;
      }

      var size  = (1 - s.z) * 3;
      var alpha = (1 - s.z);

      // Streak line (previous position -> current position)
      var dx = sx - s.prevX;
      var dy = sy - s.prevY;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.5) {
        ctx.beginPath();
        ctx.moveTo(s.prevX, s.prevY);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = 'rgba(200, 210, 255, ' + (alpha * 0.4) + ')';
        ctx.lineWidth   = size * 0.5;
        ctx.stroke();
      }

      // Star dot
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(size, 0.5), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
      ctx.fill();
    }

    // ── Draw meteors ──
    for (var j = 0; j < this.meteors.length; j++) {
      this._drawMeteor(ctx, this.meteors[j]);
    }
  };

  /* Render a single meteor with a gradient trail */
  StarfieldEffect.prototype._drawMeteor = function (ctx, m) {
    var trail = m.trail;
    var c     = m.color;

    if (trail.length < 2) return;

    // Draw the tail as a series of connected segments with fading alpha
    for (var i = 1; i < trail.length; i++) {
      var t     = i / trail.length;               // 0 at tail, 1 at head
      var alpha = t * t * m.life;                  // fade toward tail and with life
      var width = t * m.radius * 2;

      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x,     trail[i].y);
      ctx.strokeStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
      ctx.lineWidth   = Math.max(width, 0.5);
      ctx.lineCap     = 'round';
      ctx.stroke();
    }

    // Draw the bright head
    var head = trail[trail.length - 1];
    ctx.beginPath();
    ctx.arc(head.x, head.y, m.radius * m.life, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + m.life + ')';
    ctx.fill();

    // Glow around head
    ctx.beginPath();
    ctx.arc(head.x, head.y, m.radius * 3 * m.life, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (m.life * 0.25) + ')';
    ctx.fill();
  };

  /* ── stop() ── */

  StarfieldEffect.prototype.stop = function () {
    this.stars   = [];
    this.meteors = [];
  };

  /* ── resize(w, h) ── */

  StarfieldEffect.prototype.resize = function (w, h) {
    this.centerX = w / 2;
    this.centerY = h / 2;
  };

  /* ── Expose globally ── */

  window.StarfieldEffect = StarfieldEffect;

  /* ── Register terminal command ── */

  window.terminal.registerCommand('stars', 'Starfield flythrough', function () {
    window.startEffect(new StarfieldEffect());
    window.terminal.print(
      'Starfield activated. Move your mouse to steer. Type "stop" to end.',
      'line-info'
    );
  });

})();
