import { ControlsTab } from '@webrcade/app-common';

export class WonderSwanGamepadControls extends ControlsTab {
  render() {
    return (
      <>
        {[
          this.renderControl('start', 'Start'),
          this.renderControl('select', 'Rotate'),
          this.renderControl('dpad', 'X Buttons'),
          this.renderControl('lanalog', 'X Buttons'),
          this.renderControl('rtrig', 'Y1'),
          this.renderControl('rbump', 'Y2'),
          this.renderControl('ltrig', 'Y3'),
          this.renderControl('lbump', 'Y4'),
          this.renderControl('a', 'B'),
          this.renderControl('y', 'B'),
          this.renderControl('b', 'A'),
          this.renderControl('x', 'A'),
        ]}
      </>
    );
  }
}

export class WonderSwanKeyboardControls extends ControlsTab {
  render() {
    return (
      <>
        {[
          this.renderKey('Enter', 'Start'),
          this.renderKey('ShiftRight', 'Rotate'),
          this.renderKey('ArrowUp', 'X1'),
          this.renderKey('ArrowDown', 'X3'),
          this.renderKey('ArrowLeft', 'X4'),
          this.renderKey('ArrowRight', 'X2'),
          this.renderKey('KeyQ', 'Y4'),
          this.renderKey('KeyW', 'Y2'),
          this.renderKey('KeyZ', 'B'),
          this.renderKey('KeyS', 'B'),
          this.renderKey('KeyX', 'A'),
          this.renderKey('KeyA', 'A'),
        ]}
      </>
    );
  }
}

export class WonderSwanGamepadControlsRotated extends ControlsTab {
  render() {
    return (
      <>
        {[
          this.renderControl('start', 'Start'),
          this.renderControl('select', 'Rotate'),
          this.renderControl('dpad', 'Y Buttons'),
          this.renderControl('lanalog', 'Y Buttons'),
          this.renderControl('ranalog', 'X Buttons'),
          this.renderControl('x', 'X1'),
          this.renderControl('y', 'X2'),
          this.renderControl('b', 'X3'),
          this.renderControl('a', 'X4'),
          this.renderControl('lbump', 'A'),
          this.renderControl('rbump', 'B'),
        ]}
      </>
    );
  }
}

export class WonderSwanKeyboardControlsRotated extends ControlsTab {
  render() {
    return (
      <>
        {[
          this.renderKey('Enter', 'Start'),
          this.renderKey('ShiftRight', 'Rotate'),
          this.renderKey('ArrowUp', 'Y2'),
          this.renderKey('ArrowDown', 'Y4'),
          this.renderKey('ArrowLeft', 'Y1'),
          this.renderKey('ArrowRight', 'Y3'),
          this.renderKey('KeyA', 'X1'),
          this.renderKey('KeyS', 'X2'),
          this.renderKey('KeyX', 'X3'),
          this.renderKey('KeyZ', 'X4'),
          this.renderKey('KeyQ', 'A'),
          this.renderKey('KeyW', 'B'),
        ]}
      </>
    );
  }
}
