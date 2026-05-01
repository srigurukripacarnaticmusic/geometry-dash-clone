export class TouchControls {
  constructor(inputSystem, rootElement) {
    this.input = inputSystem;
    this.rootElement = rootElement;
    this.jumpButton = document.getElementById("touchJump");
    this.pauseButton = document.getElementById("touchPause");

    this.bindPress(this.jumpButton, "jump");
    this.bindTap(this.pauseButton, "pause");
  }

  bindPress(button, action) {
    if (!button) {
      return;
    }

    const press = (event) => {
      event.preventDefault();
      this.input.pressVirtual(action);
    };

    const release = (event) => {
      event.preventDefault();
      this.input.releaseVirtual(action);
    };

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  }

  bindTap(button, action) {
    if (!button) {
      return;
    }

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      this.input.pressVirtual(action);
      this.input.releaseVirtual(action);
    });
  }

  setVisible(visible) {
    this.rootElement.classList.toggle("hidden", !visible);
  }
}
