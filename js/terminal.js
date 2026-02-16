/* ===================================================================
 *  Effect Manager — Animation Loop and Lifecycle  (Task 3)
 * =================================================================== */

let currentEffect = null;
let animFrameId = null;

// Global mouse coordinates for effects to read
window.mouseX = 0;
window.mouseY = 0;

document.addEventListener('mousemove', (e) => {
  window.mouseX = e.clientX;
  window.mouseY = e.clientY;
});

/**
 * Start a visual effect on the background canvas.
 * If an effect is already running, it is stopped first.
 *
 * An effect object must expose:
 *   start(canvas, ctx)  — initialise
 *   update()            — advance state
 *   draw()              — render a frame
 *   stop()              — clean up
 *   resize(w, h)        — (optional) handle window resize
 */
window.startEffect = function (effect) {
  // Tear down any running effect
  if (currentEffect) {
    currentEffect.stop();
    cancelAnimationFrame(animFrameId);
  }

  currentEffect = effect;

  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');

  // Size canvas to the full viewport
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  effect.start(canvas, ctx);

  animFrameId = requestAnimationFrame(function loop() {
    effect.update();
    effect.draw();
    animFrameId = requestAnimationFrame(loop);
  });
};

/**
 * Stop the current effect, cancel the animation frame, and clear the canvas.
 */
window.stopEffect = function () {
  if (currentEffect) {
    currentEffect.stop();
    cancelAnimationFrame(animFrameId);

    const canvas = document.getElementById('bg');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    currentEffect = null;
    animFrameId = null;
  }
};

// Keep the canvas sized to the viewport and notify the running effect
window.addEventListener('resize', () => {
  const canvas = document.getElementById('bg');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if (currentEffect && typeof currentEffect.resize === 'function') {
    currentEffect.resize(canvas.width, canvas.height);
  }
});

// Initialise canvas size on page load
(function initCanvas() {
  const canvas = document.getElementById('bg');
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
})();

/* ===================================================================
 *  Terminal Emulator Core  (Task 2)
 * =================================================================== */

class Terminal {
  constructor() {
    // DOM references
    this.output = document.getElementById('output');
    this.hiddenInput = document.getElementById('hidden-input');
    this.inputMirror = document.getElementById('input-mirror');
    this.cursor = document.getElementById('cursor');
    this.bg = document.getElementById('bg');
    this.terminalEl = document.getElementById('terminal');

    // State
    this.history = [];
    this.historyIndex = -1;
    this.commands = {};

    // Bind event handlers
    this._bindEvents();

    // Register built-in commands
    this._registerBuiltins();
  }

  /* ── Command registration ── */

  registerCommand(name, description, fn) {
    this.commands[name] = { description, fn };
  }

  /* ── Output helpers ── */

  print(text, className) {
    const div = document.createElement('div');
    div.classList.add('line');
    if (className) {
      div.classList.add(className);
    }
    div.textContent = text;
    this.output.appendChild(div);
    this.output.scrollTop = this.output.scrollHeight;
  }

  printMulti(lines) {
    for (const line of lines) {
      this.print(line);
    }
  }

  clear() {
    this.output.innerHTML = '';
  }

  /* ── Input handling ── */

  handleInput(text) {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return;
    }

    // Record in history
    this.history.push(trimmed);
    this.historyIndex = -1;

    // Echo the command
    this.print('$ ' + trimmed, 'line-prompt');

    // Parse command name (first word) and arguments
    const parts = trimmed.split(/\s+/);
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const cmd = this.commands[cmdName];
    if (cmd) {
      cmd.fn(args);
    } else {
      this.print(
        "Unknown command: " + trimmed + ". Type 'help' for available commands.",
        'line-error'
      );
    }
  }

  /* ── Welcome message ── */

  showWelcome() {
    const banner = [
      ' ____   _   _  _  ___ ___ ___ _____ ',
      '|  _ \\ / \\ | \\| |/ __| _ )_ _|_   _|',
      '| |_) / _ \\| .` | (_ | _ \\| |  | |  ',
      '|___/_/ \\_\\_|\\_|\\___|___/___| |_|  ',
      '                                      ',
    ];
    for (const line of banner) {
      this.print(line, 'line-accent');
    }
    this.print('');
    this.print("  Type 'help' to begin.", 'line-info');
  }

  /* ── Private: event binding ── */

  _bindEvents() {
    const input = this.hiddenInput;

    // Key events on hidden input
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleInput(input.value);
        input.value = '';
        this.inputMirror.textContent = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this._navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this._navigateHistory(1);
      }
    });

    // Sync mirror on every input change
    input.addEventListener('input', () => {
      this.inputMirror.textContent = input.value;
    });

    // Click anywhere on terminal to focus
    this.terminalEl.addEventListener('click', () => {
      input.focus();
    });

    // Focus on page load
    window.addEventListener('load', () => {
      input.focus();
    });

    // Focus on any keypress when terminal is visible
    document.addEventListener('keydown', (e) => {
      // Avoid hijacking system shortcuts
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }
      if (this.terminalEl.offsetParent !== null) {
        input.focus();
      }
    });
  }

  /* ── Private: history navigation ── */

  _navigateHistory(direction) {
    if (this.history.length === 0) {
      return;
    }

    if (direction === -1) {
      // ArrowUp — go back in history
      if (this.historyIndex === -1) {
        this.historyIndex = this.history.length - 1;
      } else if (this.historyIndex > 0) {
        this.historyIndex--;
      }
    } else if (direction === 1) {
      // ArrowDown — go forward in history
      if (this.historyIndex === -1) {
        return;
      }
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
      } else {
        // Past the end — clear
        this.historyIndex = -1;
        this.hiddenInput.value = '';
        this.inputMirror.textContent = '';
        return;
      }
    }

    const entry = this.history[this.historyIndex];
    this.hiddenInput.value = entry;
    this.inputMirror.textContent = entry;
  }

  /* ── Private: built-in commands ── */

  _registerBuiltins() {
    this.registerCommand('help', 'Show this message', () => {
      this.print('');
      this.print('  Available Commands:', 'line-accent');
      this.print('');
      const names = Object.keys(this.commands).sort();
      const maxLen = Math.max(...names.map((n) => n.length));
      for (const name of names) {
        const padding = ' '.repeat(maxLen - name.length + 4);
        this.print('  ' + name + padding + this.commands[name].description, 'line-info');
      }
      this.print('');
    });

    this.registerCommand('clear', 'Clear the terminal', () => {
      this.clear();
    });

    this.registerCommand('stop', 'Stop the current background effect', () => {
      if (currentEffect) {
        window.stopEffect();
        this.print('Effect stopped.', 'line-info');
      } else {
        this.print('No effect is currently running.', 'line-info');
      }
    });
  }
}

/* ===================================================================
 *  Idle Effect — Subtle drifting particles  (Task 8)
 * =================================================================== */

class IdleEffect {
  constructor() {
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
    this.particleCount = 40;
  }

  start(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particles = [];

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: 1 + Math.random(),
        alpha: 0.15 + Math.random() * 0.2,
      });
    }
  }

  update() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x += w;
      if (p.x > w) p.x -= w;
      if (p.y < 0) p.y += h;
      if (p.y > h) p.y -= h;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#00ff41';
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    ctx.globalAlpha = 1;
  }

  stop() {
    this.particles = [];
  }

  resize(w, h) {
    // Particles will naturally wrap — no special handling needed
  }
}

/* ── Bootstrap ── */

window.terminal = new Terminal();
terminal.showWelcome();

// Start subtle idle animation on the background canvas
window.startEffect(new IdleEffect());
