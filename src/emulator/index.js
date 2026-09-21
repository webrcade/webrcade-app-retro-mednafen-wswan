import {
  BasicRetroAppWrapper,
  ScriptAudioProcessor,
  LOG
} from '@webrcade/app-common';

export class Emulator extends BasicRetroAppWrapper {

  GAME_SRAM_NAME = 'game.srm';
  SAVE_NAME = 'sav';

  constructor(app, debug = false) {
    super(app, debug);
    window.emulator = this;
    this.rotated = this.getProps().rotated ? true : false;
    this.japanese = this.getProps().language === 1;

    this.audioStarted = 0;

    this.total = 0;
    this.count = 0;
    this.audioCallback = (offset, length) => {
      this.total += length;
      this.count = this.count + 1;

      if (this.count === 60) {
        //console.log("total: " + this.total);
        this.total = 0;
        this.count = 0;
      }

      length = length << 1;
      const audioArray = new Int16Array(window.Module.HEAP16.buffer, offset, length);
      this.audioProcessor.storeSoundCombinedInput(audioArray, 2, length, 0, 32768);
    };
  }

  createAudioProcessor() {
    return new ScriptAudioProcessor(
      2,
      44100,
      8192 + 4096,
      2048
    ).setDebug(this.debug);
  }

  onFrame() {
    if (this.audioStarted !== -1) {
      if (this.audioStarted > 1) {
        this.audioStarted = -1;
        // Start the audio processor
        this.audioProcessor.start();
      } else {
        this.audioStarted++;
      }
    }

    // Touch/mouse/keyboard interaction detection + on-screen touch overlay
    // gating is inherited from BasicRetroAppWrapper.
    super.onFrame();
  }

  // Base class default pauses on any tap anywhere on screen -- redundant
  // (and disruptive) now that there's a dedicated Pause button in the
  // touch overlay. Same override every other TouchOverlay app uses for
  // the same reason.
  createTouchListener() {}

  getHashFileExtension() {
    const type = this.getProps().type;
    return type === 'retro-mednafen-ws' ? 'ws' : 'wsc';
  }

  getScriptUrl() {
    return 'js/mednafen_wswan_libretro.js';
  }

  getPrefs() {
    return this.prefs;
  }

  sendInput(controller, input, analog0x, analog0y, analog1x, analog1y) {
    const { controllers } = this;

    // WRC - sendInput() is called once per controller slot (CONTROLLER_COUNT=4)
    // every polling cycle, with `input` reflecting whichever slot is
    // currently being processed - only slot 0 ever has a real gamepad
    // attached, so the toggle check must stay scoped to controller 0 (matching
    // the original raw controllers.isControlDown(0, ...) read) or it sees a
    // spurious release on every other slot's call and fires every frame.
    // Reading the already-gated INP_SELECT bit (instead of the raw state)
    // keeps the rotation toggle honoring the same hold-timer protection as
    // the rest of Select's handling, instead of firing unconditionally
    // regardless of how long RTRIG has been held.
    if (controller === 0) {
      if (input & this.INP_SELECT) {
        this.selectDown = true;
      } else {
        if (this.selectDown) {
          this.rotated = !this.rotated;
          this.resizeScreen(this.canvas);
          this.selectDown = false;
        }
      }
    }

    let isLeft = false;
    let isRight = false;
    let isUp = false;
    let isDown = false;

    if (controllers.isAxisLeft(0, 1)) {
      isLeft = true;
    }
    if (controllers.isAxisRight(0, 1)) {
      isRight = true;
    }
    if (controllers.isAxisUp(0, 1)) {
      isUp = true;
    }
    if (controllers.isAxisDown(0, 1)) {
      isDown = true;
    }

    if (!this.getDisableInput()) {
      window.Module._wrc_set_input(
        controller,
        input,
        analog0x,
        analog0y,
        isLeft ? .25 : isRight ? .5 : 0,
        isUp ? .25 : isDown ? .5 : 0,
      );
    } else {
      window.Module._wrc_set_input(
        controller, 0, 0, 0, 0, 0
      );
    }
  }

  async saveState() {
    const { saveStatePath, started } = this;
    const { FS, Module } = window;

    try {
      if (!started) {
        return;
      }

      // Save to files
      Module._cmd_savefiles();

      let path = '';
      const files = [];
      let s = null;

      path = `/home/web_user/retroarch/userdata/saves/${this.GAME_SRAM_NAME}`;
      LOG.info('Checking: ' + path);
      try {
        s = FS.readFile(path);
        if (s) {
          LOG.info('Found save file: ' + path);
          files.push({
            name: this.SAVE_NAME,
            content: s,
          });
        }
      } catch (e) {}

      if (files.length > 0) {
        if (await this.getSaveManager().checkFilesChanged(files)) {
          await this.getSaveManager().save(
            saveStatePath,
            files,
            this.saveMessageCallback,
          );
        }
      } else {
        await this.getSaveManager().delete(path);
      }
    } catch (e) {
      LOG.error('Error persisting save state: ' + e);
    }
  }

  async loadState() {
    const { saveStatePath } = this;
    const { FS } = window;

    // Write the save state (if applicable)
    try {
      // Load
      const files = await this.getSaveManager().load(
        saveStatePath,
        this.loadMessageCallback,
      );

      if (files) {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (f.name === this.SAVE_NAME) {
            LOG.info(`writing ${this.GAME_SRAM_NAME} file`);
            FS.writeFile(
              `/home/web_user/retroarch/userdata/saves/${this.GAME_SRAM_NAME}`,
              f.content,
            );
          }
        }

        // Cache the initial files
        await this.getSaveManager().checkFilesChanged(files);
      }
    } catch (e) {
      LOG.error('Error loading save state: ' + e);
    }
  }

  // WRC - unlike neocd/picodrive (no real trigger function at all), this
  // app maps both LTRIG and RTRIG to real, potentially-held buttons: the
  // secondary Y-pad's "Y3"/"Y1" directions (see pause/controls.js's
  // WonderSwanGamepadControls). Some WonderSwan games use the Y-pad as
  // their primary input, so either trigger can genuinely be held for
  // extended real gameplay - per the decision rule in
  // docs/escape-hack-audit.md, all three getters below are true:
  // Select is also a real function here (toggles screen rotation, see
  // sendInput() below), and the right analog stick's tilt genuinely
  // drives the secondary D-pad in rotated mode (also in sendInput()) -
  // both conditions the rule requires alongside the real RTRIG use.
  isEscapeHackEnabled() {
    return true;
  }

  isStartEscapeHackEnabled() {
    return true;
  }

  isSelectEscapeHackEnabled() {
    return true;
  }

  applyGameSettings() {
    // const { Module } = window;
    // const props = this.getProps();
    // let options = 0;

    // // b buttons
    // if (props.pad6button) {
    //   LOG.info('## 6 button pad on');
    //   options |= this.OPT1;
    // } else {
    //   LOG.info('## 6 button pad off');
    // }

    // // map RUN/SELECT
    // if (props.mapRunSelect) {
    //   LOG.info('## Map run and select on');
    //   options |= this.OPT2;
    // } else {
    //   LOG.info('## Map run and select off');
    // }

    // Module._wrc_set_options(options);
  }

  isForceAspectRatio() {
    return false;
  }

  isRotated() {
    return this.rotated;
  }

  isJapanese() {
    return this.japanese;
  }

  getDefaultAspectRatio() {
    return this.rotated ? 0.643 : 1.555;
  }

  resizeScreen(canvas) {
    this.canvas = canvas;
    this.updateScreenSize();
  }

  getShotAspectRatio() { return this.getDefaultAspectRatio(); }
}

