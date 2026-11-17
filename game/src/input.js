// Lumen Orbit — input. One object owns the keyboard and the mouse so the
// game logic never touches DOM events directly.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.justPressed = new Set();
    // Mouse position in logical canvas coordinates.
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.mouseClicked = false;
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.justPressed.add(event.code);
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    });
    canvas.addEventListener('mousedown', (event) => {
      event.preventDefault();
      this.mouseDown = true;
      this.mouseClicked = true;
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    });
    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
    // Touch: a tap is a click, a drag steers like the mouse.
    canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
      this.mouseDown = true;
      this.mouseClicked = true;
    }, { passive: false });
    canvas.addEventListener('touchend', () => {
      this.mouseDown = false;
    });
  }

  down(...codes) {
    return codes.some((code) => this.keys.has(code));
  }

  // True only on the frame the key went down.
  pressed(...codes) {
    return codes.some((code) => this.justPressed.has(code));
  }

  clicked() {
    return this.mouseClicked;
  }

  // Call once per frame, after the game has read the edge-triggered state.
  endFrame() {
    this.justPressed.clear();
    this.mouseClicked = false;
  }
}
