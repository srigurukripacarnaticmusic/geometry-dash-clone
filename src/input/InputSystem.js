export class InputSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.actionState = new Map();
    this.justPressed = new Set();
    this.pointerWorld = { x: 0, y: 0 };
    this.pointerScreen = { x: 0, y: 0 };
    this.pointerDown = false;
    this.enabled = true;

    this.keyBindings = new Map([
      ["Space", "jump"],
      ["ArrowUp", "jump"],
      ["KeyW", "jump"],
      ["KeyP", "pause"],
      ["Escape", "pause"],
      ["KeyR", "restart"],
      ["KeyE", "editor"],
      ["Digit1", "editorType1"],
      ["Digit2", "editorType2"],
      ["Digit3", "editorType3"],
      ["Digit4", "editorType4"],
      ["Digit5", "editorType5"],
      ["Digit6", "editorType6"],
      ["Digit7", "editorType7"],
      ["Delete", "editorDelete"],
      ["Backspace", "editorDelete"]
    ]);

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("pointermove", this.handlePointerMove);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.actionState.clear();
      this.justPressed.clear();
      this.pointerDown = false;
    }
  }

  setAction(action, pressed) {
    const previous = this.actionState.get(action) ?? false;

    if (pressed && !previous) {
      this.justPressed.add(action);
    }

    this.actionState.set(action, pressed);
  }

  handleKeyDown(event) {
    if (!this.enabled) {
      return;
    }

    const action = this.keyBindings.get(event.code);

    if (!action) {
      if (event.code === "KeyS" && event.ctrlKey) {
        this.justPressed.add("editorExport");
      }

      return;
    }

    if (["Space", "ArrowUp", "KeyW", "KeyR", "KeyP", "Escape", "KeyE", "Delete", "Backspace"].includes(event.code)) {
      event.preventDefault();
    }

    this.setAction(action, true);
  }

  handleKeyUp(event) {
    const action = this.keyBindings.get(event.code);

    if (action) {
      this.setAction(action, false);
    }
  }

  isUiTarget(target) {
    return target instanceof HTMLElement && Boolean(target.closest("[data-ui]"));
  }

  updatePointerPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const normalizedX = (event.clientX - rect.left) / rect.width;
    const normalizedY = (event.clientY - rect.top) / rect.height;

    this.pointerScreen.x = normalizedX * this.canvas.width;
    this.pointerScreen.y = normalizedY * this.canvas.height;
    this.pointerWorld.x = normalizedX * 1280;
    this.pointerWorld.y = normalizedY * 720;
  }

  handlePointerDown(event) {
    this.updatePointerPosition(event);

    if (this.isUiTarget(event.target)) {
      return;
    }

    this.pointerDown = true;
    this.setAction("jump", true);
    this.justPressed.add("pointerPrimary");
  }

  handlePointerUp(event) {
    this.updatePointerPosition(event);
    this.pointerDown = false;
    this.setAction("jump", false);
  }

  handlePointerMove(event) {
    this.updatePointerPosition(event);
  }

  pressVirtual(action) {
    this.setAction(action, true);
  }

  releaseVirtual(action) {
    this.setAction(action, false);
  }

  isDown(action) {
    return this.actionState.get(action) ?? false;
  }

  wasPressed(action) {
    return this.justPressed.has(action);
  }

  consume(action) {
    const pressed = this.justPressed.has(action);
    this.justPressed.delete(action);
    return pressed;
  }

  endFrame() {
    this.justPressed.clear();
  }
}
