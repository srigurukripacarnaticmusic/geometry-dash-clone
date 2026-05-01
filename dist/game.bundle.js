(() => {
  const __modules__ = {
    "src/audio/AudioSystem.js": (exports, __require__) => {
      const { SONG_LIBRARY } = __require__("src/audio/songs.js");
      const { clamp } = __require__("src/utils/math.js");
      const NOTE_MAP = {
        C: 0,
        "C#": 1,
        Db: 1,
        D: 2,
        "D#": 3,
        Eb: 3,
        E: 4,
        F: 5,
        "F#": 6,
        Gb: 6,
        G: 7,
        "G#": 8,
        Ab: 8,
        A: 9,
        "A#": 10,
        Bb: 10,
        B: 11
      };
      
      class AudioSystem {
        constructor(config, eventBus) {
          this.config = config;
          this.eventBus = eventBus;
          this.context = null;
          this.masterGain = null;
          this.noiseBuffer = null;
          this.unlocked = false;
          this.currentSong = null;
          this.currentSongId = null;
          this.songStartTime = 0;
          this.nextStepTime = 0;
          this.stepIndex = 0;
          this.lastBeat = -1;
          this.masterVolume = config.audio.masterVolume;
        }
      
        async unlock() {
          if (this.unlocked) {
            if (this.context?.state === "suspended") {
              await this.context.resume();
            }
      
            return;
          }
      
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      
          if (!AudioContextClass) {
            console.warn("Web Audio API is not available in this browser.");
            return;
          }
      
          this.context = new AudioContextClass();
          this.masterGain = this.context.createGain();
          this.masterGain.gain.value = this.masterVolume;
          this.masterGain.connect(this.context.destination);
          this.noiseBuffer = this.createNoiseBuffer();
          this.unlocked = true;
        }
      
        setMasterVolume(volume) {
          this.masterVolume = clamp(volume, 0, 1);
      
          if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
          }
        }
      
        createNoiseBuffer() {
          const buffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
          const channel = buffer.getChannelData(0);
      
          for (let index = 0; index < channel.length; index += 1) {
            channel[index] = Math.random() * 2 - 1;
          }
      
          return buffer;
        }
      
        startSong(songId) {
          if (!this.unlocked || !this.context) {
            return;
          }
      
          this.stopSong();
          this.currentSong = SONG_LIBRARY[songId] ?? null;
          this.currentSongId = songId;
      
          if (!this.currentSong) {
            return;
          }
      
          this.songStartTime = this.context.currentTime + 0.05;
          this.nextStepTime = this.songStartTime;
          this.stepIndex = 0;
          this.lastBeat = -1;
        }
      
        stopSong() {
          this.currentSong = null;
          this.currentSongId = null;
        }
      
        restartSong() {
          if (this.currentSongId) {
            this.startSong(this.currentSongId);
          }
        }
      
        update() {
          if (!this.unlocked || !this.currentSong || !this.context) {
            return;
          }
      
          const secondsPerBeat = 60 / this.currentSong.bpm;
          const secondsPerStep = secondsPerBeat / this.currentSong.stepsPerBeat;
      
          while (this.nextStepTime < this.context.currentTime + this.config.audio.scheduleAhead) {
            this.scheduleStep(this.stepIndex, this.nextStepTime);
            this.nextStepTime += secondsPerStep;
            this.stepIndex = (this.stepIndex + 1) % (this.currentSong.loopBeats * this.currentSong.stepsPerBeat);
          }
      
          const elapsed = Math.max(0, this.context.currentTime - this.songStartTime);
          const beat = Math.floor(elapsed / secondsPerBeat);
      
          if (beat !== this.lastBeat) {
            this.lastBeat = beat;
            this.eventBus.emit("audio:beat", {
              beat,
              songId: this.currentSong.id
            });
          }
        }
      
        getBeatPulse() {
          if (!this.unlocked || !this.currentSong || !this.context) {
            return 0;
          }
      
          const secondsPerBeat = 60 / this.currentSong.bpm;
          const elapsed = Math.max(0, this.context.currentTime - this.songStartTime);
          const phase = (elapsed % secondsPerBeat) / secondsPerBeat;
          return 1 - Math.min(1, phase * 1.4);
        }
      
        scheduleStep(stepIndex, time) {
          const song = this.currentSong;
      
          for (const track of song.tracks) {
            if (track.steps?.includes(stepIndex)) {
              this.playInstrument(track.instrument, time, null);
            }
      
            if (track.notes) {
              for (const note of track.notes) {
                if (note.step === stepIndex) {
                  this.playInstrument(track.instrument, time, note);
                }
              }
            }
          }
        }
      
        noteToFrequency(note) {
          const match = /^([A-G](?:#|b)?)(-?\d)$/.exec(note);
      
          if (!match) {
            return 440;
          }
      
          const [, pitch, octaveString] = match;
          const octave = Number.parseInt(octaveString, 10);
          const semitone = NOTE_MAP[pitch];
          const midi = semitone + (octave + 1) * 12;
          return 440 * 2 ** ((midi - 69) / 12);
        }
      
        playInstrument(instrument, time, note) {
          if (!this.context || !this.masterGain) {
            return;
          }
      
          const songGain = this.currentSong?.masterGain ?? 1;
          const output = this.context.createGain();
          output.gain.value = songGain;
          output.connect(this.masterGain);
      
          if (instrument === "kick") {
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(140, time);
            oscillator.frequency.exponentialRampToValueAtTime(40, time + 0.18);
            gain.gain.setValueAtTime(0.0001, time);
            gain.gain.exponentialRampToValueAtTime(0.9, time + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
            oscillator.connect(gain);
            gain.connect(output);
            oscillator.start(time);
            oscillator.stop(time + 0.22);
            return;
          }
      
          if (instrument === "snare" || instrument === "hat") {
            const noise = this.context.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.context.createBiquadFilter();
            filter.type = "highpass";
            filter.frequency.value = instrument === "snare" ? 1000 : 5000;
            const gain = this.context.createGain();
            gain.gain.setValueAtTime(0.0001, time);
            gain.gain.exponentialRampToValueAtTime(instrument === "snare" ? 0.5 : 0.14, time + 0.001);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + (instrument === "snare" ? 0.18 : 0.06));
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(output);
            noise.start(time);
            noise.stop(time + 0.2);
            return;
          }
      
          const oscillator = this.context.createOscillator();
          const gain = this.context.createGain();
          const filter = this.context.createBiquadFilter();
          const frequency = this.noteToFrequency(note?.note ?? "A4");
          const length = note?.length ?? 2;
          const secondsPerStep = (60 / this.currentSong.bpm) / this.currentSong.stepsPerBeat;
          const duration = Math.max(secondsPerStep * length, 0.08);
      
          oscillator.type = instrument === "bass" ? "triangle" : instrument === "arp" ? "sawtooth" : "square";
          oscillator.frequency.setValueAtTime(frequency, time);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.exponentialRampToValueAtTime(instrument === "bass" ? 0.3 : 0.12, time + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
          filter.type = "lowpass";
          filter.frequency.value = instrument === "bass" ? 420 : 1800;
          filter.Q.value = 1;
          oscillator.connect(filter);
          filter.connect(gain);
          gain.connect(output);
          oscillator.start(time);
          oscillator.stop(time + duration + 0.02);
        }
      
        playJump() {
          this.playEffect(680, 920, 0.06, 0.12, "triangle");
        }
      
        playDoubleJump() {
          this.playEffect(540, 1040, 0.07, 0.16, "square");
        }
      
        playDeath() {
          this.playEffect(260, 72, 0.1, 0.26, "sawtooth");
        }
      
        playPad() {
          this.playEffect(240, 760, 0.08, 0.2, "triangle");
        }
      
        playPortal() {
          this.playEffect(320, 1120, 0.18, 0.22, "sine");
        }
      
        playCheckpoint() {
          this.playEffect(560, 980, 0.12, 0.14, "triangle");
        }
      
        playComplete() {
          this.playEffect(520, 920, 0.22, 0.32, "triangle");
          this.playEffect(660, 1100, 0.24, 0.34, "triangle");
        }
      
        playEffect(startFrequency, endFrequency, attack, decay, type = "sine") {
          if (!this.context || !this.masterGain) {
            return;
          }
      
          const time = this.context.currentTime;
          const oscillator = this.context.createOscillator();
          const gain = this.context.createGain();
          oscillator.type = type;
          oscillator.frequency.setValueAtTime(startFrequency, time);
          oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 40), time + decay);
          gain.gain.setValueAtTime(0.0001, time);
          gain.gain.exponentialRampToValueAtTime(0.18, time + attack);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
          oscillator.connect(gain);
          gain.connect(this.masterGain);
          oscillator.start(time);
          oscillator.stop(time + decay + 0.03);
        }
      }
      
      exports.AudioSystem = AudioSystem;
      
    },
    "src/audio/songs.js": (exports, __require__) => {
      const SONG_LIBRARY = {
        neonPulse: {
          id: "neonPulse",
          bpm: 150,
          stepsPerBeat: 4,
          loopBeats: 32,
          masterGain: 0.82,
          tracks: [
            { instrument: "kick", steps: [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60] },
            { instrument: "snare", steps: [8, 24, 40, 56] },
            { instrument: "hat", steps: [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62] },
            {
              instrument: "bass",
              notes: [
                { step: 0, length: 4, note: "C2" },
                { step: 4, length: 4, note: "G2" },
                { step: 8, length: 4, note: "A1" },
                { step: 12, length: 4, note: "G2" },
                { step: 16, length: 4, note: "C2" },
                { step: 20, length: 4, note: "G2" },
                { step: 24, length: 4, note: "A1" },
                { step: 28, length: 4, note: "G2" },
                { step: 32, length: 4, note: "F2" },
                { step: 36, length: 4, note: "C2" },
                { step: 40, length: 4, note: "G1" },
                { step: 44, length: 4, note: "C2" },
                { step: 48, length: 4, note: "A1" },
                { step: 52, length: 4, note: "E2" },
                { step: 56, length: 4, note: "G1" },
                { step: 60, length: 4, note: "E2" }
              ]
            },
            {
              instrument: "lead",
              notes: [
                { step: 0, length: 2, note: "E4" },
                { step: 4, length: 2, note: "G4" },
                { step: 8, length: 2, note: "A4" },
                { step: 12, length: 2, note: "G4" },
                { step: 16, length: 2, note: "E4" },
                { step: 20, length: 2, note: "G4" },
                { step: 24, length: 2, note: "A4" },
                { step: 28, length: 2, note: "B4" },
                { step: 32, length: 2, note: "C5" },
                { step: 36, length: 2, note: "B4" },
                { step: 40, length: 2, note: "G4" },
                { step: 44, length: 2, note: "E4" },
                { step: 48, length: 2, note: "A4" },
                { step: 52, length: 2, note: "G4" },
                { step: 56, length: 2, note: "E4" },
                { step: 60, length: 4, note: "D4" }
              ]
            }
          ]
        },
        gravityDrive: {
          id: "gravityDrive",
          bpm: 150,
          stepsPerBeat: 4,
          loopBeats: 32,
          masterGain: 0.8,
          tracks: [
            { instrument: "kick", steps: [0, 4, 8, 14, 16, 20, 24, 30, 32, 36, 40, 46, 48, 52, 56, 62] },
            { instrument: "snare", steps: [8, 24, 40, 56] },
            { instrument: "hat", steps: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63] },
            {
              instrument: "bass",
              notes: [
                { step: 0, length: 4, note: "D2" },
                { step: 4, length: 4, note: "A1" },
                { step: 8, length: 4, note: "F2" },
                { step: 12, length: 4, note: "A1" },
                { step: 16, length: 4, note: "D2" },
                { step: 20, length: 4, note: "A1" },
                { step: 24, length: 4, note: "G1" },
                { step: 28, length: 4, note: "A1" },
                { step: 32, length: 4, note: "E2" },
                { step: 36, length: 4, note: "B1" },
                { step: 40, length: 4, note: "G2" },
                { step: 44, length: 4, note: "B1" },
                { step: 48, length: 4, note: "D2" },
                { step: 52, length: 4, note: "A1" },
                { step: 56, length: 4, note: "F2" },
                { step: 60, length: 4, note: "E2" }
              ]
            },
            {
              instrument: "arp",
              notes: [
                { step: 0, length: 1, note: "D4" },
                { step: 2, length: 1, note: "F4" },
                { step: 4, length: 1, note: "A4" },
                { step: 6, length: 1, note: "D5" },
                { step: 8, length: 1, note: "F4" },
                { step: 10, length: 1, note: "A4" },
                { step: 12, length: 1, note: "C5" },
                { step: 14, length: 1, note: "A4" },
                { step: 16, length: 1, note: "D4" },
                { step: 18, length: 1, note: "F4" },
                { step: 20, length: 1, note: "A4" },
                { step: 22, length: 1, note: "D5" },
                { step: 24, length: 1, note: "G4" },
                { step: 26, length: 1, note: "B4" },
                { step: 28, length: 1, note: "D5" },
                { step: 30, length: 1, note: "B4" },
                { step: 32, length: 1, note: "E4" },
                { step: 34, length: 1, note: "G4" },
                { step: 36, length: 1, note: "B4" },
                { step: 38, length: 1, note: "E5" },
                { step: 40, length: 1, note: "G4" },
                { step: 42, length: 1, note: "B4" },
                { step: 44, length: 1, note: "D5" },
                { step: 46, length: 1, note: "B4" },
                { step: 48, length: 1, note: "D4" },
                { step: 50, length: 1, note: "F4" },
                { step: 52, length: 1, note: "A4" },
                { step: 54, length: 1, note: "D5" },
                { step: 56, length: 1, note: "F4" },
                { step: 58, length: 1, note: "A4" },
                { step: 60, length: 1, note: "C5" },
                { step: 62, length: 1, note: "A4" }
              ]
            }
          ]
        }
      };
      
      exports.SONG_LIBRARY = SONG_LIBRARY;
      
    },
    "src/config/gameConfig.js": (exports, __require__) => {
      const GAME_CONFIG = {
        title: "Neon Rush",
        version: "1.0.0",
        canvas: {
          width: 1280,
          height: 720,
          maxPixelRatio: 2
        },
        loop: {
          fixedDelta: 1 / 120,
          maxFrameDelta: 1 / 15
        },
        physics: {
          gravity: 2200,
          jumpVelocity: 820,
          doubleJumpVelocity: 760,
          maxFallSpeed: 1700,
          coyoteTime: 0.07,
          jumpBufferTime: 0.11,
          defaultGroundSpeed: 240,
          rotationSpeed: Math.PI * 3.75
        },
        player: {
          width: 36,
          height: 36,
          trailSpacing: 0.028,
          trailLife: 0.24
        },
        camera: {
          followOffsetX: 350,
          followOffsetY: 0,
          verticalLook: 26,
          lerp: 0.12,
          shakeDamping: 7
        },
        render: {
          tileSize: 48,
          glowStrength: 16,
          gridMajorEvery: 4
        },
        gameplay: {
          restartDelay: 0.52,
          completeDelay: 1.2,
          checkpointEnabled: true,
          practiceMode: false
        },
        audio: {
          masterVolume: 0.32,
          scheduleAhead: 0.25,
          lookAheadMs: 40,
          analyserSize: 2048
        },
        storageKeys: {
          saveData: "neon-rush-save-v1"
        }
      };
      
      exports.GAME_CONFIG = GAME_CONFIG;
      
    },
    "src/core/BaseState.js": (exports, __require__) => {
      class BaseState {
        constructor(game) {
          this.game = game;
          this.transparent = false;
          this.blocksUpdateBelow = true;
        }
      
        onEnter() {}
      
        onExit() {}
      
        onPause() {}
      
        onResume() {}
      
        update() {}
      
        render() {}
      }
      
      exports.BaseState = BaseState;
      
    },
    "src/core/EventBus.js": (exports, __require__) => {
      class EventBus {
        constructor() {
          this.listeners = new Map();
        }
      
        on(eventName, callback) {
          if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
          }
      
          this.listeners.get(eventName).add(callback);
      
          return () => {
            this.off(eventName, callback);
          };
        }
      
        once(eventName, callback) {
          const unsubscribe = this.on(eventName, (...args) => {
            unsubscribe();
            callback(...args);
          });
      
          return unsubscribe;
        }
      
        off(eventName, callback) {
          this.listeners.get(eventName)?.delete(callback);
        }
      
        emit(eventName, payload) {
          const eventListeners = this.listeners.get(eventName);
      
          if (!eventListeners) {
            return;
          }
      
          for (const listener of eventListeners) {
            listener(payload);
          }
        }
      }
      
      exports.EventBus = EventBus;
      
    },
    "src/core/Game.js": (exports, __require__) => {
      const { EventBus } = __require__("src/core/EventBus.js");
      const { GameLoop } = __require__("src/core/GameLoop.js");
      const { StateManager } = __require__("src/core/StateManager.js");
      const { SaveManager } = __require__("src/core/SaveManager.js");
      const { Renderer } = __require__("src/rendering/Renderer.js");
      const { InputSystem } = __require__("src/input/InputSystem.js");
      const { TouchControls } = __require__("src/input/TouchControls.js");
      const { AudioSystem } = __require__("src/audio/AudioSystem.js");
      const { LevelLoader } = __require__("src/level/LevelLoader.js");
      const { PhysicsSystem } = __require__("src/physics/PhysicsSystem.js");
      const { MenuUI } = __require__("src/ui/MenuUI.js");
      const { MenuState } = __require__("src/states/MenuState.js");
      const { LevelSelectState } = __require__("src/states/LevelSelectState.js");
      const { PlayState } = __require__("src/states/PlayState.js");
      const { PauseState } = __require__("src/states/PauseState.js");
      const { LevelEditor } = __require__("src/editor/LevelEditor.js");
      class Game {
        constructor(canvas, config) {
          this.canvas = canvas;
          this.config = config;
          this.eventBus = new EventBus();
          this.saveManager = new SaveManager();
          this.renderer = new Renderer(canvas, config);
          this.input = new InputSystem(canvas);
          this.touchControls = new TouchControls(this.input, document.getElementById("touchControls"));
          this.audio = new AudioSystem(config, this.eventBus);
          this.levelLoader = new LevelLoader();
          this.physics = new PhysicsSystem(config);
          this.stateManager = new StateManager(this);
          this.ui = new MenuUI(this);
          this.editor = new LevelEditor(this);
          this.loop = new GameLoop({
            fixedDelta: config.loop.fixedDelta,
            maxFrameDelta: config.loop.maxFrameDelta,
            update: (dt) => this.update(dt),
            render: (alpha) => this.render(alpha)
          });
      
          this.boundUnlockAudio = this.unlockAudio.bind(this);
        }
      
        async init() {
          this.audio.setMasterVolume(this.saveManager.settings.masterVolume);
          this.touchControls.setVisible(this.saveManager.settings.touchControls);
          window.addEventListener("pointerdown", this.boundUnlockAudio);
          window.addEventListener("keydown", this.boundUnlockAudio);
          this.openMenu();
        }
      
        start() {
          this.loop.start();
        }
      
        async unlockAudio() {
          await this.audio.unlock();
      
          if (this.audio.unlocked) {
            window.removeEventListener("pointerdown", this.boundUnlockAudio);
            window.removeEventListener("keydown", this.boundUnlockAudio);
          }
        }
      
        update(dt) {
          this.audio.update();
          this.stateManager.update(dt);
          this.input.endFrame();
        }
      
        render(alpha) {
          this.renderer.beginFrame();
          this.stateManager.render(this.renderer, alpha);
        }
      
        getActivePlayState() {
          for (let index = this.stateManager.stack.length - 1; index >= 0; index -= 1) {
            const state = this.stateManager.stack[index];
      
            if (state.kind === "play") {
              return state;
            }
          }
      
          return null;
        }
      
        applySettingsToActivePlayState() {
          this.ui.syncSettings();
          this.touchControls.setVisible(this.saveManager.settings.touchControls && this.getActivePlayState() !== null);
          this.audio.setMasterVolume(this.saveManager.settings.masterVolume);
          this.getActivePlayState()?.applySettings();
        }
      
        openMenu() {
          this.stateManager.setState(new MenuState(this));
        }
      
        openLevelSelect() {
          this.stateManager.setState(new LevelSelectState(this));
        }
      
        playLevel(levelId) {
          if (!levelId) {
            return;
          }
      
          this.stateManager.setState(new PlayState(this, levelId));
        }
      
        pauseCurrentLevel() {
          if (this.stateManager.current?.kind === "play") {
            this.stateManager.pushState(new PauseState(this));
            this.touchControls.setVisible(false);
          }
        }
      
        resumeCurrentPause() {
          if (this.stateManager.current?.kind === "pause") {
            this.stateManager.popState();
            this.touchControls.setVisible(this.saveManager.settings.touchControls && this.getActivePlayState() !== null);
          }
        }
      
        restartCurrentLevel() {
          if (this.stateManager.current?.kind === "pause") {
            this.stateManager.popState();
          }
      
          const playState = this.getActivePlayState();
      
          if (playState) {
            playState.handleDeath();
          }
      
          this.touchControls.setVisible(this.saveManager.settings.touchControls && playState !== null);
        }
      
        exitToMenu() {
          this.audio.stopSong();
          this.touchControls.setVisible(false);
          this.openMenu();
        }
      }
      
      exports.Game = Game;
      
    },
    "src/core/GameLoop.js": (exports, __require__) => {
      class GameLoop {
        constructor({ fixedDelta, maxFrameDelta, update, render }) {
          this.fixedDelta = fixedDelta;
          this.maxFrameDelta = maxFrameDelta;
          this.updateCallback = update;
          this.renderCallback = render;
          this.running = false;
          this.accumulator = 0;
          this.lastTimestamp = 0;
          this.boundFrame = this.frame.bind(this);
        }
      
        start() {
          if (this.running) {
            return;
          }
      
          this.running = true;
          this.accumulator = 0;
          this.lastTimestamp = performance.now();
          requestAnimationFrame(this.boundFrame);
        }
      
        stop() {
          this.running = false;
        }
      
        frame(timestamp) {
          if (!this.running) {
            return;
          }
      
          let frameDelta = (timestamp - this.lastTimestamp) / 1000;
          this.lastTimestamp = timestamp;
      
          frameDelta = Math.min(frameDelta, this.maxFrameDelta);
          this.accumulator += frameDelta;
      
          while (this.accumulator >= this.fixedDelta) {
            this.updateCallback(this.fixedDelta);
            this.accumulator -= this.fixedDelta;
          }
      
          const alpha = this.accumulator / this.fixedDelta;
          this.renderCallback(alpha);
      
          requestAnimationFrame(this.boundFrame);
        }
      }
      
      exports.GameLoop = GameLoop;
      
    },
    "src/core/SaveManager.js": (exports, __require__) => {
      const { GAME_CONFIG } = __require__("src/config/gameConfig.js");
      const DEFAULT_SAVE = {
        settings: {
          doubleJumpMode: false,
          touchControls: false,
          masterVolume: GAME_CONFIG.audio.masterVolume
        },
        progress: {
          unlockedLevels: ["level-01"],
          bestPercentByLevel: {},
          completedLevels: []
        }
      };
      
      class SaveManager {
        constructor(storageKey = GAME_CONFIG.storageKeys.saveData) {
          this.storageKey = storageKey;
          this.data = this.load();
        }
      
        load() {
          try {
            const raw = localStorage.getItem(this.storageKey);
      
            if (!raw) {
              return structuredClone(DEFAULT_SAVE);
            }
      
            return this.mergeDefaults(JSON.parse(raw));
          } catch (error) {
            console.warn("Failed to load save data, resetting to defaults.", error);
            return structuredClone(DEFAULT_SAVE);
          }
        }
      
        mergeDefaults(data) {
          return {
            settings: {
              ...DEFAULT_SAVE.settings,
              ...(data?.settings ?? {})
            },
            progress: {
              ...DEFAULT_SAVE.progress,
              ...(data?.progress ?? {})
            }
          };
        }
      
        commit() {
          localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        }
      
        get settings() {
          return this.data.settings;
        }
      
        get progress() {
          return this.data.progress;
        }
      
        setVolume(value) {
          this.data.settings.masterVolume = value;
          this.commit();
        }
      
        setDoubleJumpMode(enabled) {
          this.data.settings.doubleJumpMode = enabled;
          this.commit();
        }
      
        setTouchControls(enabled) {
          this.data.settings.touchControls = enabled;
          this.commit();
        }
      
        unlockLevel(levelId) {
          if (!this.progress.unlockedLevels.includes(levelId)) {
            this.progress.unlockedLevels.push(levelId);
            this.commit();
          }
        }
      
        markComplete(levelId) {
          if (!this.progress.completedLevels.includes(levelId)) {
            this.progress.completedLevels.push(levelId);
            this.commit();
          }
        }
      
        setBestPercent(levelId, progress) {
          const currentBest = this.progress.bestPercentByLevel[levelId] ?? 0;
      
          if (progress > currentBest) {
            this.progress.bestPercentByLevel[levelId] = progress;
            this.commit();
          }
        }
      
        reset() {
          this.data = structuredClone(DEFAULT_SAVE);
          this.commit();
        }
      }
      
      exports.SaveManager = SaveManager;
      
    },
    "src/core/StateManager.js": (exports, __require__) => {
      class StateManager {
        constructor(game) {
          this.game = game;
          this.stack = [];
        }
      
        get current() {
          return this.stack[this.stack.length - 1] ?? null;
        }
      
        setState(state) {
          while (this.stack.length > 0) {
            const existing = this.stack.pop();
            existing?.onExit?.();
          }
      
          this.stack.push(state);
          state.onEnter?.();
        }
      
        pushState(state) {
          this.current?.onPause?.();
          this.stack.push(state);
          state.onEnter?.();
        }
      
        popState() {
          const popped = this.stack.pop();
          popped?.onExit?.();
          this.current?.onResume?.();
          return popped;
        }
      
        update(dt) {
          if (this.stack.length === 0) {
            return;
          }
      
          let firstUpdatedIndex = this.stack.length - 1;
      
          for (let index = this.stack.length - 1; index >= 0; index -= 1) {
            firstUpdatedIndex = index;
      
            if (this.stack[index].blocksUpdateBelow !== false) {
              break;
            }
          }
      
          for (let index = firstUpdatedIndex; index < this.stack.length; index += 1) {
            this.stack[index].update?.(dt);
          }
        }
      
        render(renderer, alpha) {
          if (this.stack.length === 0) {
            return;
          }
      
          let firstVisibleIndex = this.stack.length - 1;
      
          for (let index = this.stack.length - 1; index >= 0; index -= 1) {
            firstVisibleIndex = index;
      
            if (this.stack[index].transparent !== true) {
              break;
            }
          }
      
          for (let index = firstVisibleIndex; index < this.stack.length; index += 1) {
            this.stack[index].render?.(renderer, alpha);
          }
        }
      }
      
      exports.StateManager = StateManager;
      
    },
    "src/editor/LevelEditor.js": (exports, __require__) => {
      const { createEntityFromDefinition } = __require__("src/entities/createEntity.js");
      const { snap } = __require__("src/utils/math.js");
      class LevelEditor {
        constructor(game) {
          this.game = game;
          this.enabled = false;
          this.selectionIndex = 0;
          this.selectionTypes = [
            { label: "Spike", build: (x, y) => ({ type: "spike", x, y, width: 1, height: 1, direction: "up" }) },
            { label: "Block", build: (x, y) => ({ type: "block", x, y, width: 1, height: 1 }) },
            { label: "Jump Pad", build: (x, y) => ({ type: "jumpPad", x, y: y + 0.75, width: 1, height: 0.25, power: 1.24 }) },
            { label: "Gravity Portal", build: (x, y) => ({ type: "portal", portalType: "gravity", x, y: y - 1, width: 1, height: 3, targetGravity: -1 }) },
            { label: "Speed Portal", build: (x, y) => ({ type: "portal", portalType: "speed", x, y: y - 1, width: 1, height: 3, speedMultiplier: 1.5 }) },
            { label: "Moving Platform", build: (x, y) => ({ type: "movingPlatform", x, y, width: 2, height: 0.5, axis: "y", distance: 2, speed: 60 }) },
            { label: "Checkpoint", build: (x, y) => ({ type: "checkpoint", x, y: y - 1, width: 0.4, height: 2 }) }
          ];
        }
      
        get currentSelection() {
          return this.selectionTypes[this.selectionIndex];
        }
      
        setEnabled(enabled) {
          this.enabled = enabled;
          this.game.ui.setEditorVisible(enabled, this.currentSelection.label);
        }
      
        toggle() {
          this.setEnabled(!this.enabled);
        }
      
        setSelection(index) {
          const wrapped = Math.max(0, Math.min(this.selectionTypes.length - 1, index));
          this.selectionIndex = wrapped;
          this.game.ui.setEditorVisible(this.enabled, this.currentSelection.label);
        }
      
        update(playState) {
          const input = this.game.input;
      
          if (input.consume("editor")) {
            this.toggle();
          }
      
          if (!this.enabled) {
            return;
          }
      
          const selectionActions = [
            "editorType1",
            "editorType2",
            "editorType3",
            "editorType4",
            "editorType5",
            "editorType6",
            "editorType7"
          ];
      
          selectionActions.forEach((action, index) => {
            if (input.consume(action)) {
              this.setSelection(index);
            }
          });
      
          if (input.consume("pointerPrimary")) {
            this.placeAtPointer(playState);
          }
      
          if (input.consume("editorDelete")) {
            this.removeAtPointer(playState);
          }
      
          if (input.consume("editorExport")) {
            this.export(playState);
          }
        }
      
        getPointerTile(playState) {
          const screen = this.game.input.pointerWorld;
          const worldX = playState.camera.x + screen.x;
          const worldY = playState.camera.y + screen.y;
          const tileSize = playState.level.tileSize;
          const tileX = snap(worldX, tileSize) / tileSize;
          const tileY = snap(worldY, tileSize) / tileSize;
          return { tileX, tileY };
        }
      
        placeAtPointer(playState) {
          const { tileX, tileY } = this.getPointerTile(playState);
          const definition = this.currentSelection.build(tileX, tileY);
          playState.level.objects.push(definition);
          const entity = createEntityFromDefinition(playState.level, definition);
      
          if (entity) {
            playState.addEntity(entity);
            this.game.ui.showToast(`Placed ${this.currentSelection.label}`);
          }
        }
      
        removeAtPointer(playState) {
          const { tileX, tileY } = this.getPointerTile(playState);
          const tileSize = playState.level.tileSize;
          const worldX = tileX * tileSize;
          const worldY = tileY * tileSize;
      
          const hitIndex = playState.entities.findIndex((entity) => (
            entity.type !== "player" &&
            entity.x <= worldX + tileSize &&
            entity.x + entity.width >= worldX &&
            entity.y <= worldY + tileSize &&
            entity.y + entity.height >= worldY
          ));
      
          if (hitIndex === -1) {
            return;
          }
      
          const entity = playState.entities[hitIndex];
          playState.entities.splice(hitIndex, 1);
          const rawIndex = playState.level.objects.findIndex((objectDefinition) => {
            const candidate = createEntityFromDefinition(playState.level, objectDefinition);
            return candidate && candidate.type === entity.type && candidate.x === entity.x && candidate.y === entity.y;
          });
      
          if (rawIndex !== -1) {
            playState.level.objects.splice(rawIndex, 1);
          }
      
          this.game.ui.showToast(`Removed ${entity.type}`);
        }
      
        export(playState) {
          const tileSize = playState.level.tileSize;
          const exportData = playState.level.cloneData();
          exportData.objects = playState.entities
            .filter((entity) => entity.type !== "player")
            .map((entity) => entity.serialize?.(tileSize))
            .filter(Boolean)
            .sort((a, b) => a.x - b.x || a.y - b.y);
      
          const json = JSON.stringify(exportData, null, 2);
          navigator.clipboard.writeText(json)
            .then(() => this.game.ui.showToast("Level JSON copied to clipboard"))
            .catch(() => this.game.ui.showToast("Clipboard export failed"));
        }
      }
      
      exports.LevelEditor = LevelEditor;
      
    },
    "src/entities/Checkpoint.js": (exports, __require__) => {
      const { Entity } = __require__("src/entities/Entity.js");
      const { aabbIntersects } = __require__("src/physics/Collision.js");
      class Checkpoint extends Entity {
        constructor(definition) {
          super({
            x: definition.x,
            y: definition.y,
            width: definition.width,
            height: definition.height,
            type: "checkpoint"
          });
      
          this.activated = false;
          this.color = definition.color ?? "#ffe57a";
        }
      
        tryTrigger(player) {
          if (this.activated || !aabbIntersects(this.bounds, player.bounds)) {
            return false;
          }
      
          this.activated = true;
          return true;
        }
      
        reset() {
          this.activated = false;
        }
      
        draw(renderer) {
          const color = this.activated ? "#89ffb0" : this.color;
          renderer.drawGlowRect(this.x, this.y, this.width, this.height, color, 16);
        }
      
        serialize(tileSize) {
          return {
            type: "checkpoint",
            x: this.x / tileSize,
            y: this.y / tileSize,
            width: this.width / tileSize,
            height: this.height / tileSize,
            color: this.color
          };
        }
      }
      
      exports.Checkpoint = Checkpoint;
      
    },
    "src/entities/createEntity.js": (exports, __require__) => {
      const { Spike } = __require__("src/entities/Spike.js");
      const { JumpPad } = __require__("src/entities/JumpPad.js");
      const { Portal } = __require__("src/entities/Portal.js");
      const { MovingPlatform } = __require__("src/entities/MovingPlatform.js");
      const { Checkpoint } = __require__("src/entities/Checkpoint.js");
      const { SolidBlock } = __require__("src/entities/SolidBlock.js");
      function worldize(level, definition) {
        const tileSize = level.tileSize;
        return {
          ...definition,
          x: definition.x * tileSize,
          y: definition.y * tileSize,
          width: (definition.width ?? 1) * tileSize,
          height: (definition.height ?? 1) * tileSize,
          distance: (definition.distance ?? 0) * tileSize
        };
      }
      
      function createEntityFromDefinition(level, definition) {
        const data = worldize(level, definition);
      
        switch (definition.type) {
          case "spike":
            return new Spike(data);
          case "jumpPad":
            return new JumpPad(data);
          case "portal":
            return new Portal(data);
          case "movingPlatform":
            return new MovingPlatform(data);
          case "checkpoint":
            return new Checkpoint(data);
          case "block":
            return new SolidBlock(data);
          default:
            return null;
        }
      }
      
      exports.createEntityFromDefinition = createEntityFromDefinition;
      
    },
    "src/entities/Entity.js": (exports, __require__) => {
      let ENTITY_ID = 1;
      
      class Entity {
        constructor({
          x = 0,
          y = 0,
          width = 0,
          height = 0,
          type = "entity"
        } = {}) {
          this.id = ENTITY_ID += 1;
          this.x = x;
          this.y = y;
          this.width = width;
          this.height = height;
          this.type = type;
          this.active = true;
          this.isSolid = false;
        }
      
        get bounds() {
          return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
          };
        }
      
        update() {}
      
        draw() {}
      
        reset() {}
      }
      
      exports.Entity = Entity;
      
    },
    "src/entities/JumpPad.js": (exports, __require__) => {
      const { Entity } = __require__("src/entities/Entity.js");
      const { aabbIntersects } = __require__("src/physics/Collision.js");
      class JumpPad extends Entity {
        constructor(definition) {
          super({
            x: definition.x,
            y: definition.y,
            width: definition.width,
            height: definition.height,
            type: "jumpPad"
          });
      
          this.power = definition.power ?? 1.2;
          this.color = definition.color ?? "#ffe57a";
          this.cooldown = 0;
        }
      
        update(dt) {
          this.cooldown = Math.max(0, this.cooldown - dt);
        }
      
        tryTrigger(player) {
          if (this.cooldown > 0) {
            return false;
          }
      
          const triggerBounds = {
            x: this.x,
            y: this.y - 4,
            width: this.width,
            height: this.height + 8
          };
      
          if (!aabbIntersects(triggerBounds, player.bounds)) {
            return false;
          }
      
          const correctDirection = player.gravityDirection > 0
            ? player.vy >= 0 && player.y + player.height <= this.y + this.height + 10
            : player.vy <= 0 && player.y >= this.y - 10;
      
          if (!correctDirection) {
            return false;
          }
      
          this.cooldown = 0.14;
          player.bounce(this.power);
          return true;
        }
      
        draw(renderer) {
          renderer.drawPad(this.x, this.y, this.width, this.height, this.color);
        }
      
        serialize(tileSize) {
          return {
            type: "jumpPad",
            x: this.x / tileSize,
            y: this.y / tileSize,
            width: this.width / tileSize,
            height: this.height / tileSize,
            power: this.power,
            color: this.color
          };
        }
      }
      
      exports.JumpPad = JumpPad;
      
    },
    "src/entities/MovingPlatform.js": (exports, __require__) => {
      const { Entity } = __require__("src/entities/Entity.js");
      const { pingPong } = __require__("src/utils/math.js");
      class MovingPlatform extends Entity {
        constructor(definition) {
          super({
            x: definition.x,
            y: definition.y,
            width: definition.width,
            height: definition.height,
            type: "movingPlatform"
          });
      
          this.startX = definition.x;
          this.startY = definition.y;
          this.axis = definition.axis ?? "x";
          this.distance = definition.distance ?? 120;
          this.speed = definition.speed ?? 90;
          this.time = 0;
          this.deltaX = 0;
          this.deltaY = 0;
          this.color = definition.color ?? "#9fe0ff";
          this.isSolid = true;
        }
      
        reset() {
          this.x = this.startX;
          this.y = this.startY;
          this.time = 0;
          this.deltaX = 0;
          this.deltaY = 0;
        }
      
        update(dt) {
          const previousX = this.x;
          const previousY = this.y;
      
          this.time += dt * this.speed;
          const offset = pingPong(this.time, this.distance);
      
          if (this.axis === "x") {
            this.x = this.startX + offset;
            this.y = this.startY;
          } else {
            this.y = this.startY + offset;
            this.x = this.startX;
          }
      
          this.deltaX = this.x - previousX;
          this.deltaY = this.y - previousY;
        }
      
        draw(renderer) {
          renderer.drawGlowRect(this.x, this.y, this.width, this.height, this.color, 18);
        }
      
        serialize(tileSize) {
          return {
            type: "movingPlatform",
            x: this.startX / tileSize,
            y: this.startY / tileSize,
            width: this.width / tileSize,
            height: this.height / tileSize,
            axis: this.axis,
            distance: this.distance / tileSize,
            speed: this.speed,
            color: this.color
          };
        }
      }
      
      exports.MovingPlatform = MovingPlatform;
      
    },
    "src/entities/Player.js": (exports, __require__) => {
      const { Entity } = __require__("src/entities/Entity.js");
      const { clamp } = __require__("src/utils/math.js");
      class Player extends Entity {
        constructor(config, spawnPoint) {
          super({
            x: spawnPoint.x,
            y: spawnPoint.y,
            width: config.player.width,
            height: config.player.height,
            type: "player"
          });
      
          this.config = config;
          this.spawnPoint = { ...spawnPoint };
          this.baseSpeed = config.physics.defaultGroundSpeed;
          this.targetSpeed = this.baseSpeed;
          this.vx = this.baseSpeed;
          this.vy = 0;
          this.gravityDirection = 1;
          this.jumpBufferTimer = 0;
          this.coyoteTimer = 0;
          this.jumpCount = 0;
          this.grounded = false;
          this.hitCeiling = false;
          this.hitWall = false;
          this.rotation = 0;
          this.alive = true;
          this.allowDoubleJump = false;
          this.trail = [];
          this.trailSpawnTimer = 0;
          this.groundEntity = null;
          this.carriedBy = null;
          this.isCompleting = false;
        }
      
        setDoubleJumpEnabled(enabled) {
          this.allowDoubleJump = enabled;
        }
      
        setBaseSpeed(speed) {
          this.baseSpeed = speed;
          this.targetSpeed = speed;
        }
      
        setSpawnPoint(spawnPoint) {
          this.spawnPoint = { ...spawnPoint };
        }
      
        reset(spawnPoint = this.spawnPoint) {
          this.x = spawnPoint.x;
          this.y = spawnPoint.y;
          this.vx = this.baseSpeed;
          this.vy = 0;
          this.gravityDirection = 1;
          this.jumpBufferTimer = 0;
          this.coyoteTimer = 0;
          this.jumpCount = 0;
          this.grounded = false;
          this.hitCeiling = false;
          this.hitWall = false;
          this.rotation = 0;
          this.alive = true;
          this.trail = [];
          this.trailSpawnTimer = 0;
          this.groundEntity = null;
          this.carriedBy = null;
          this.isCompleting = false;
        }
      
        queueJump() {
          this.jumpBufferTimer = this.config.physics.jumpBufferTime;
        }
      
        canJump() {
          if (this.grounded || this.coyoteTimer > 0) {
            return true;
          }
      
          if (this.allowDoubleJump && this.jumpCount < 2) {
            return true;
          }
      
          return false;
        }
      
        performJump(source = "jump") {
          const isAirJump = !this.grounded && this.coyoteTimer <= 0 && this.jumpCount >= 1;
          const jumpVelocity = isAirJump
            ? this.config.physics.doubleJumpVelocity
            : this.config.physics.jumpVelocity;
      
          this.vy = -jumpVelocity * this.gravityDirection;
          this.grounded = false;
          this.coyoteTimer = 0;
          this.jumpBufferTimer = 0;
          this.jumpCount += 1;
      
          return {
            type: isAirJump ? "doubleJump" : "jump",
            source
          };
        }
      
        bounce(multiplier = 1.18) {
          const velocity = this.config.physics.jumpVelocity * multiplier;
          this.vy = -velocity * this.gravityDirection;
          this.grounded = false;
          this.coyoteTimer = 0;
          this.jumpBufferTimer = 0;
          this.jumpCount = Math.min(this.jumpCount + 1, this.allowDoubleJump ? 1 : 1);
        }
      
        flipGravity() {
          this.gravityDirection *= -1;
          this.y += this.gravityDirection * -6;
          this.grounded = false;
          this.coyoteTimer = 0;
        }
      
        update(dt, context) {
          if (!this.alive) {
            return null;
          }
      
          const { input, physics, level, dynamicSolids } = context;
          let actionResult = null;
      
          if (input.consume("jump")) {
            this.queueJump();
          }
      
          this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
      
          if (this.grounded) {
            this.coyoteTimer = this.config.physics.coyoteTime;
            this.jumpCount = 0;
          } else {
            this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
          }
      
          if (this.jumpBufferTimer > 0 && this.canJump()) {
            actionResult = this.performJump("buffered");
          }
      
          this.vx = this.targetSpeed;
          this.vy += this.config.physics.gravity * this.gravityDirection * dt;
          this.vy = clamp(this.vy, -this.config.physics.maxFallSpeed, this.config.physics.maxFallSpeed);
          this.rotation += this.config.physics.rotationSpeed * dt * this.gravityDirection;
      
          physics.moveActor(this, level, dynamicSolids, dt);
      
          if (this.grounded) {
            const quarterTurn = Math.PI / 2;
            this.rotation = Math.round(this.rotation / quarterTurn) * quarterTurn;
          }
      
          this.trailSpawnTimer -= dt;
      
          if (this.trailSpawnTimer <= 0) {
            this.trailSpawnTimer = this.config.player.trailSpacing;
            this.trail.push({
              x: this.x + this.width * 0.5,
              y: this.y + this.height * 0.5,
              rotation: this.rotation,
              life: this.config.player.trailLife,
              maxLife: this.config.player.trailLife,
              gravityDirection: this.gravityDirection
            });
          }
      
          for (const piece of this.trail) {
            piece.life -= dt;
          }
      
          this.trail = this.trail.filter((piece) => piece.life > 0);
      
          return actionResult;
        }
      
        draw(renderer) {
          const ctx = renderer.ctx;
      
          for (const trailPiece of this.trail) {
            const alpha = trailPiece.life / trailPiece.maxLife;
            ctx.save();
            ctx.translate(trailPiece.x, trailPiece.y);
            ctx.rotate(trailPiece.rotation);
            ctx.globalAlpha = alpha * 0.36;
            ctx.fillStyle = trailPiece.gravityDirection > 0 ? "#7bf7ff" : "#ff9fd4";
            ctx.fillRect(-this.width * 0.4, -this.height * 0.4, this.width * 0.8, this.height * 0.8);
            ctx.restore();
          }
      
          ctx.save();
          ctx.translate(this.x + this.width * 0.5, this.y + this.height * 0.5);
          ctx.rotate(this.rotation);
          ctx.shadowBlur = 20;
          ctx.shadowColor = this.gravityDirection > 0 ? "#7bf7ff" : "#ff9fd4";
          ctx.fillStyle = this.gravityDirection > 0 ? "#90fbff" : "#ffc0dc";
          ctx.fillRect(-this.width * 0.5, -this.height * 0.5, this.width, this.height);
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.fillRect(-this.width * 0.34, -this.height * 0.34, this.width * 0.3, this.height * 0.3);
          ctx.restore();
        }
      }
      
      exports.Player = Player;
      
    },
    "src/entities/Portal.js": (exports, __require__) => {
      const { Entity } = __require__("src/entities/Entity.js");
      const { aabbIntersects } = __require__("src/physics/Collision.js");
      class Portal extends Entity {
        constructor(definition) {
          super({
            x: definition.x,
            y: definition.y,
            width: definition.width,
            height: definition.height,
            type: definition.portalType === "speed" ? "speedPortal" : "gravityPortal"
          });
      
          this.portalType = definition.portalType ?? "gravity";
          this.targetGravity = definition.targetGravity ?? -1;
          this.speedMultiplier = definition.speedMultiplier ?? 1.4;
          this.cooldown = 0;
          this.outerColor = this.portalType === "gravity" ? "#7bf7ff" : "#89ffb0";
          this.innerColor = this.portalType === "gravity" ? "#a5c6ff" : "#d4ff9c";
        }
      
        update(dt) {
          this.cooldown = Math.max(0, this.cooldown - dt);
        }
      
        tryTrigger(player) {
          if (this.cooldown > 0) {
            return null;
          }
      
          if (!aabbIntersects(this.bounds, player.bounds)) {
            return null;
          }
      
          this.cooldown = 0.25;
      
          if (this.portalType === "gravity") {
            const desired = this.targetGravity >= 0 ? 1 : -1;
      
            if (player.gravityDirection !== desired) {
              player.flipGravity();
            }
      
            return { type: "gravity", value: desired };
          }
      
          player.targetSpeed = player.baseSpeed * this.speedMultiplier;
          return { type: "speed", value: player.targetSpeed };
        }
      
        draw(renderer) {
          renderer.drawPortal(this.x, this.y, this.width, this.height, this.outerColor, this.innerColor);
        }
      
        serialize(tileSize) {
          return {
            type: "portal",
            portalType: this.portalType,
            x: this.x / tileSize,
            y: this.y / tileSize,
            width: this.width / tileSize,
            height: this.height / tileSize,
            targetGravity: this.targetGravity,
            speedMultiplier: this.speedMultiplier
          };
        }
      }
      
      exports.Portal = Portal;
      
    },
    "src/entities/SolidBlock.js": (exports, __require__) => {
      const { Entity } = __require__("src/entities/Entity.js");
      class SolidBlock extends Entity {
        constructor(definition) {
          super({
            x: definition.x,
            y: definition.y,
            width: definition.width,
            height: definition.height,
            type: "block"
          });
      
          this.isSolid = true;
          this.color = definition.color ?? "#2d4d73";
          this.outline = definition.outline ?? "#8ddcf8";
        }
      
        draw(renderer) {
          renderer.drawGlowRect(this.x, this.y, this.width, this.height, this.color, 10);
          renderer.drawRoundedRect(this.x, this.y, this.width, this.height, 4, null, this.outline);
        }
      
        serialize(tileSize) {
          return {
            type: "block",
            x: this.x / tileSize,
            y: this.y / tileSize,
            width: this.width / tileSize,
            height: this.height / tileSize,
            color: this.color,
            outline: this.outline
          };
        }
      }
      
      exports.SolidBlock = SolidBlock;
      
    },
    "src/entities/Spike.js": (exports, __require__) => {
      const { Entity } = __require__("src/entities/Entity.js");
      class Spike extends Entity {
        constructor(definition) {
          super({
            x: definition.x,
            y: definition.y,
            width: definition.width,
            height: definition.height,
            type: "spike"
          });
          this.direction = definition.direction ?? "up";
          this.color = definition.color ?? "#ff6e96";
        }
      
        draw(renderer) {
          renderer.drawSpike(this.x, this.y, this.width, this.height, this.color, this.direction);
        }
      
        serialize(tileSize) {
          return {
            type: "spike",
            x: this.x / tileSize,
            y: this.y / tileSize,
            width: this.width / tileSize,
            height: this.height / tileSize,
            direction: this.direction,
            color: this.color
          };
        }
      }
      
      exports.Spike = Spike;
      
    },
    "src/fx/ParticleSystem.js": (exports, __require__) => {
      const { withAlpha } = __require__("src/utils/color.js");
      const { randRange } = __require__("src/utils/math.js");
      class ParticleSystem {
        constructor() {
          this.particles = [];
        }
      
        clear() {
          this.particles = [];
        }
      
        spawnBurst(x, y, options = {}) {
          const {
            count = 12,
            color = "#7bf7ff",
            speed = 220,
            spread = Math.PI,
            size = 8,
            life = 0.45
          } = options;
      
          for (let index = 0; index < count; index += 1) {
            const angle = randRange(-spread * 0.5, spread * 0.5);
            const magnitude = randRange(speed * 0.35, speed);
            this.particles.push({
              x,
              y,
              vx: Math.cos(angle) * magnitude,
              vy: Math.sin(angle) * magnitude,
              size: randRange(size * 0.5, size),
              color,
              life,
              maxLife: life,
              gravity: randRange(240, 720)
            });
          }
        }
      
        spawnDirectionalBurst(x, y, directionX, directionY, options = {}) {
          const {
            count = 10,
            color = "#ffe57a",
            speed = 180,
            spread = 0.9,
            size = 6,
            life = 0.35
          } = options;
      
          const baseAngle = Math.atan2(directionY, directionX);
      
          for (let index = 0; index < count; index += 1) {
            const angle = baseAngle + randRange(-spread * 0.5, spread * 0.5);
            const magnitude = randRange(speed * 0.3, speed);
            this.particles.push({
              x,
              y,
              vx: Math.cos(angle) * magnitude,
              vy: Math.sin(angle) * magnitude,
              size: randRange(size * 0.4, size),
              color,
              life,
              maxLife: life,
              gravity: randRange(160, 520)
            });
          }
        }
      
        update(dt) {
          for (const particle of this.particles) {
            particle.vy += particle.gravity * dt;
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.life -= dt;
          }
      
          this.particles = this.particles.filter((particle) => particle.life > 0);
        }
      
        draw(renderer) {
          const { ctx } = renderer;
      
          for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            ctx.save();
            ctx.fillStyle = withAlpha(particle.color, alpha);
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 14;
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            ctx.restore();
          }
        }
      }
      
      exports.ParticleSystem = ParticleSystem;
      
    },
    "src/input/InputSystem.js": (exports, __require__) => {
      class InputSystem {
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
      
      exports.InputSystem = InputSystem;
      
    },
    "src/input/TouchControls.js": (exports, __require__) => {
      class TouchControls {
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
      
      exports.TouchControls = TouchControls;
      
    },
    "src/level/Level.js": (exports, __require__) => {
      class Level {
        constructor(data) {
          this.raw = data;
          this.id = data.id;
          this.name = data.name;
          this.description = data.description;
          this.width = data.width;
          this.height = data.height;
          this.tileSize = data.tileSize;
          this.baseSpeed = data.baseSpeed;
          this.finishX = data.finishX * this.tileSize;
          this.songId = data.songId;
          this.player = data.player;
          this.colors = data.colors;
          this.tiles = data.tiles;
          this.objects = data.objects ?? [];
          this.layers = data.layers ?? {};
          this.meta = data.meta ?? {};
        }
      
        cloneData() {
          return structuredClone(this.raw);
        }
      
        tileToWorld(tileX, tileY) {
          return {
            x: tileX * this.tileSize,
            y: tileY * this.tileSize
          };
        }
      
        worldToTile(x, y) {
          return {
            x: Math.floor(x / this.tileSize),
            y: Math.floor(y / this.tileSize)
          };
        }
      
        getTile(tileX, tileY) {
          if (tileY < 0 || tileY >= this.tiles.solids.length) {
            return ".";
          }
      
          const row = this.tiles.solids[tileY];
      
          if (!row || tileX < 0 || tileX >= row.length) {
            return ".";
          }
      
          return row[tileX];
        }
      
        isSolidTile(tileX, tileY) {
          return this.getTile(tileX, tileY) === "#";
        }
      
        getSolidRectsForRegion(minX, minY, maxX, maxY) {
          const tileMinX = Math.floor(minX / this.tileSize);
          const tileMaxX = Math.floor(maxX / this.tileSize);
          const tileMinY = Math.floor(minY / this.tileSize);
          const tileMaxY = Math.floor(maxY / this.tileSize);
          const rects = [];
      
          for (let tileY = tileMinY; tileY <= tileMaxY; tileY += 1) {
            for (let tileX = tileMinX; tileX <= tileMaxX; tileX += 1) {
              if (!this.isSolidTile(tileX, tileY)) {
                continue;
              }
      
              rects.push({
                x: tileX * this.tileSize,
                y: tileY * this.tileSize,
                width: this.tileSize,
                height: this.tileSize,
                type: "tile"
              });
            }
          }
      
          return rects;
        }
      }
      
      exports.Level = Level;
      
    },
    "src/level/levelCatalog.js": (exports, __require__) => {
      const LEVEL_CATALOG = [
        {
          id: "level-01",
          name: "Neon Run",
          description: "A bright introduction with spikes, pads, portals, and a first moving platform rhythm pattern.",
          difficulty: "Normal",
          songId: "neonPulse",
          order: 1,
          file: "./levels/level-01.json"
        },
        {
          id: "level-02",
          name: "Gravity Groove",
          description: "A more technical route with faster pacing, ceiling runs, and chained gravity swaps.",
          difficulty: "Hard",
          songId: "gravityDrive",
          order: 2,
          file: "./levels/level-02.json"
        }
      ];
      
      exports.LEVEL_CATALOG = LEVEL_CATALOG;
      
    },
    "src/level/levelData.js": (exports, __require__) => {
      const LEVEL_DATA = {
        "level-01": {
          "id": "level-01",
          "name": "Neon Run",
          "description": "Intro course with steady rhythm, bounce timing, gravity flips, and moving-platform recovery sections.",
          "width": 176,
          "height": 15,
          "tileSize": 48,
          "baseSpeed": 240,
          "finishX": 171,
          "songId": "neonPulse",
          "meta": {
            "author": "Codex",
            "difficulty": "Normal"
          },
          "player": {
            "spawnX": 4,
            "spawnY": 12.25
          },
          "colors": {
            "skyTop": "#102744",
            "skyBottom": "#05101d",
            "glow": "#7bf7ff",
            "accent": "#ffe57a",
            "tile": "#23496d"
          },
          "tiles": {
            "solids": [
              "################################################################################################################################################################################",
              "................................................................................................................................................................................",
              "................................................................................................................................................................................",
              "................................................................................................................................................................................",
              "................................................................................................................................................................................",
              "................................................................................................................................................................................",
              "................................................................................................................................................................................",
              "....................................................................................................................................................#################...........",
              "..........................................#######################...............................................#####################...........................................",
              "................................................................................................................................................................................",
              "....................................................................................########........########....................................................................",
              "................................................................................................................................................................................",
              "................................................................................................................................................................................",
              "################################################################################.....#################################....######################################################",
              "################################################################################.....#################################....######################################################"
            ]
          },
          "objects": [
            {
              "type": "spike",
              "x": 10,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 12,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 14,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 18,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 21,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "jumpPad",
              "x": 24,
              "y": 12.75,
              "width": 1,
              "height": 0.25,
              "power": 1.28,
              "color": "#ffe57a"
            },
            {
              "type": "spike",
              "x": 28,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 30,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 32,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "portal",
              "portalType": "gravity",
              "x": 38,
              "y": 9,
              "width": 1,
              "height": 3,
              "targetGravity": -1
            },
            {
              "type": "spike",
              "x": 44,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 46,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 48,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 50,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 52,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 54,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 56,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "block",
              "x": 54,
              "y": 4,
              "width": 2,
              "height": 1,
              "color": "#395b84"
            },
            {
              "type": "portal",
              "portalType": "gravity",
              "x": 62,
              "y": 6,
              "width": 1,
              "height": 3,
              "targetGravity": 1
            },
            {
              "type": "spike",
              "x": 69,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 72,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "portal",
              "portalType": "speed",
              "x": 74,
              "y": 9,
              "width": 1,
              "height": 3,
              "speedMultiplier": 1.32
            },
            {
              "type": "movingPlatform",
              "x": 80,
              "y": 12,
              "width": 2,
              "height": 0.5,
              "axis": "y",
              "distance": 2,
              "speed": 66,
              "color": "#9fe0ff"
            },
            {
              "type": "checkpoint",
              "x": 93,
              "y": 10.5,
              "width": 0.4,
              "height": 2,
              "color": "#ffe57a"
            },
            {
              "type": "spike",
              "x": 99,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 101,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 103,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 105,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "jumpPad",
              "x": 108,
              "y": 12.75,
              "width": 1,
              "height": 0.25,
              "power": 1.24,
              "color": "#ffe57a"
            },
            {
              "type": "spike",
              "x": 114,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "portal",
              "portalType": "gravity",
              "x": 120,
              "y": 9,
              "width": 1,
              "height": 3,
              "targetGravity": -1
            },
            {
              "type": "spike",
              "x": 124,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 127,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 130,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 133,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 136,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "portal",
              "portalType": "gravity",
              "x": 136,
              "y": 6,
              "width": 1,
              "height": 3,
              "targetGravity": 1
            },
            {
              "type": "movingPlatform",
              "x": 144,
              "y": 10.5,
              "width": 2,
              "height": 0.5,
              "axis": "x",
              "distance": 3,
              "speed": 54,
              "color": "#89ffb0"
            },
            {
              "type": "spike",
              "x": 151,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 153,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 155,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "jumpPad",
              "x": 158,
              "y": 12.75,
              "width": 1,
              "height": 0.25,
              "power": 1.32,
              "color": "#ffe57a"
            },
            {
              "type": "spike",
              "x": 164,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 166,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            }
          ]
        },
        "level-02": {
          "id": "level-02",
          "name": "Gravity Groove",
          "description": "Faster sections with back-to-back gravity routing, moving platforms, and denser spike timing.",
          "width": 224,
          "height": 15,
          "tileSize": 48,
          "baseSpeed": 240,
          "finishX": 219,
          "songId": "gravityDrive",
          "meta": {
            "author": "Codex",
            "difficulty": "Hard"
          },
          "player": {
            "spawnX": 4,
            "spawnY": 12.25
          },
          "colors": {
            "skyTop": "#24133f",
            "skyBottom": "#07101d",
            "glow": "#89ffb0",
            "accent": "#7bf7ff",
            "tile": "#3d3d7d"
          },
          "tiles": {
            "solids": [
              "################################################################################################################################################################################################################################",
              "................................................................................................................................................................................................................................",
              "................................................................................................................................................................................................................................",
              "................................................................................................................................................................................................................................",
              "................................................................................................................................................................................................................................",
              "................................................................................................................................................................................................................................",
              "................................................................................................................................................................................................................................",
              "..................................#############################.................................................................................................................................................................",
              "........................................................................................##########################..............................................................#####################...........................",
              "..........................................................................................................................................#######################...............................................................",
              "................................................................................................................................................................................................................................",
              "................................................................................................................................................................................................................................",
              "................................................................................................................................................................................................................................",
              "################################################.....###############################################################.....#################################################################.....#################################",
              "################################################.....###############################################################.....#################################################################.....#################################"
            ]
          },
          "objects": [
            {
              "type": "spike",
              "x": 9,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 11,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 13,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 15,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "jumpPad",
              "x": 18,
              "y": 12.75,
              "width": 1,
              "height": 0.25,
              "power": 1.3,
              "color": "#ffe57a"
            },
            {
              "type": "spike",
              "x": 23,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 25,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 27,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "portal",
              "portalType": "gravity",
              "x": 31,
              "y": 9,
              "width": 1,
              "height": 3,
              "targetGravity": -1
            },
            {
              "type": "spike",
              "x": 36,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 38,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 40,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 42,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 44,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 46,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "portal",
              "portalType": "speed",
              "x": 45,
              "y": 6,
              "width": 1,
              "height": 3,
              "speedMultiplier": 1.45
            },
            {
              "type": "movingPlatform",
              "x": 48,
              "y": 12,
              "width": 2,
              "height": 0.5,
              "axis": "y",
              "distance": 2,
              "speed": 72,
              "color": "#7bf7ff"
            },
            {
              "type": "portal",
              "portalType": "gravity",
              "x": 58,
              "y": 6,
              "width": 1,
              "height": 3,
              "targetGravity": 1
            },
            {
              "type": "spike",
              "x": 66,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 68,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 70,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 72,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "checkpoint",
              "x": 78,
              "y": 10.5,
              "width": 0.4,
              "height": 2,
              "color": "#ffe57a"
            },
            {
              "type": "jumpPad",
              "x": 84,
              "y": 12.75,
              "width": 1,
              "height": 0.25,
              "power": 1.2,
              "color": "#ffe57a"
            },
            {
              "type": "spike",
              "x": 92,
              "y": 7,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 94,
              "y": 7,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 96,
              "y": 7,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "portal",
              "portalType": "gravity",
              "x": 104,
              "y": 9,
              "width": 1,
              "height": 3,
              "targetGravity": -1
            },
            {
              "type": "spike",
              "x": 110,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 113,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 116,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 119,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "portal",
              "portalType": "gravity",
              "x": 118,
              "y": 6,
              "width": 1,
              "height": 3,
              "targetGravity": 1
            },
            {
              "type": "movingPlatform",
              "x": 116,
              "y": 12,
              "width": 2,
              "height": 0.5,
              "axis": "x",
              "distance": 3,
              "speed": 58,
              "color": "#89ffb0"
            },
            {
              "type": "spike",
              "x": 126,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 128,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 130,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 132,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 134,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "portal",
              "portalType": "speed",
              "x": 138,
              "y": 9,
              "width": 1,
              "height": 3,
              "speedMultiplier": 1.55
            },
            {
              "type": "block",
              "x": 146,
              "y": 10,
              "width": 2,
              "height": 1,
              "color": "#355374"
            },
            {
              "type": "block",
              "x": 149,
              "y": 9,
              "width": 2,
              "height": 1,
              "color": "#355374"
            },
            {
              "type": "jumpPad",
              "x": 153,
              "y": 12.75,
              "width": 1,
              "height": 0.25,
              "power": 1.34,
              "color": "#ffe57a"
            },
            {
              "type": "portal",
              "portalType": "gravity",
              "x": 166,
              "y": 9,
              "width": 1,
              "height": 3,
              "targetGravity": -1
            },
            {
              "type": "spike",
              "x": 172,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 174,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 176,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 178,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "spike",
              "x": 180,
              "y": 1,
              "width": 1,
              "height": 1,
              "direction": "down",
              "color": "#ff9fd4"
            },
            {
              "type": "movingPlatform",
              "x": 186,
              "y": 12,
              "width": 2,
              "height": 0.5,
              "axis": "y",
              "distance": 2,
              "speed": 74,
              "color": "#9fe0ff"
            },
            {
              "type": "portal",
              "portalType": "gravity",
              "x": 194,
              "y": 6,
              "width": 1,
              "height": 3,
              "targetGravity": 1
            },
            {
              "type": "spike",
              "x": 201,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 203,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 205,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 207,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "spike",
              "x": 209,
              "y": 12,
              "width": 1,
              "height": 1,
              "direction": "up",
              "color": "#ff6e96"
            },
            {
              "type": "jumpPad",
              "x": 213,
              "y": 12.75,
              "width": 1,
              "height": 0.25,
              "power": 1.35,
              "color": "#ffe57a"
            }
          ]
        }
      };
      
      exports.LEVEL_DATA = LEVEL_DATA;
      
    },
    "src/level/LevelLoader.js": (exports, __require__) => {
      const { LEVEL_CATALOG } = __require__("src/level/levelCatalog.js");
      const { Level } = __require__("src/level/Level.js");
      const { LEVEL_DATA } = __require__("src/level/levelData.js");
      class LevelLoader {
        constructor() {
          this.catalog = LEVEL_CATALOG;
          this.cache = new Map();
        }
      
        getCatalog() {
          return this.catalog;
        }
      
        getLevelMeta(levelId) {
          return this.catalog.find((level) => level.id === levelId) ?? null;
        }
      
        getNextLevelId(levelId) {
          const sorted = [...this.catalog].sort((a, b) => a.order - b.order);
          const currentIndex = sorted.findIndex((level) => level.id === levelId);
      
          if (currentIndex === -1 || currentIndex === sorted.length - 1) {
            return null;
          }
      
          return sorted[currentIndex + 1].id;
        }
      
        async loadLevel(levelId) {
          if (this.cache.has(levelId)) {
            return new Level(structuredClone(this.cache.get(levelId)));
          }
      
          const meta = this.getLevelMeta(levelId);
      
          if (!meta) {
            throw new Error(`Unknown level id: ${levelId}`);
          }
      
          const data = LEVEL_DATA[levelId];
      
          if (!data) {
            throw new Error(`Missing in-memory level data for "${levelId}".`);
          }
      
          this.cache.set(levelId, data);
          return new Level(structuredClone(data));
        }
      }
      
      exports.LevelLoader = LevelLoader;
      
    },
    "src/main.js": (exports, __require__) => {
      const { GAME_CONFIG } = __require__("src/config/gameConfig.js");
      const { Game } = __require__("src/core/Game.js");
      const canvas = document.getElementById("gameCanvas");
      const game = new Game(canvas, GAME_CONFIG);
      
      async function boot() {
        await game.init();
        game.start();
        window.__NEON_RUSH_BOOT_STATUS__ = "ready";
      }
      
      boot().catch((error) => {
        window.__NEON_RUSH_BOOT_STATUS__ = "error";
        console.error("Failed to boot Neon Rush.", error);
        const overlayRoot = document.getElementById("overlayRoot");
      
        if (overlayRoot) {
          overlayRoot.innerHTML = `
            <section class="screen active modal-screen">
              <div class="panel modal-panel">
                <h2>Boot Error</h2>
                <p>The game could not start. Open the console for details.</p>
                <pre style="text-align:left; white-space:pre-wrap;">${String(error)}</pre>
              </div>
            </section>
          `;
        }
      });
      
      
      
    },
    "src/physics/Collision.js": (exports, __require__) => {
      function aabbIntersects(a, b) {
        return (
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y
        );
      }
      
      function containsPoint(rect, x, y) {
        return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
      }
      
      function pointInTriangle(point, a, b, c) {
        const area = (first, second, third) => (
          (first.x * (second.y - third.y) + second.x * (third.y - first.y) + third.x * (first.y - second.y)) / 2
        );
      
        const triangleArea = Math.abs(area(a, b, c));
        const area1 = Math.abs(area(point, b, c));
        const area2 = Math.abs(area(a, point, c));
        const area3 = Math.abs(area(a, b, point));
        return Math.abs(triangleArea - (area1 + area2 + area3)) < 0.5;
      }
      
      function rectIntersectsSpike(rect, spike) {
        const bounds = {
          x: spike.x,
          y: spike.y,
          width: spike.width,
          height: spike.height
        };
      
        if (!aabbIntersects(rect, bounds)) {
          return false;
        }
      
        const points = [
          { x: rect.x, y: rect.y },
          { x: rect.x + rect.width, y: rect.y },
          { x: rect.x, y: rect.y + rect.height },
          { x: rect.x + rect.width, y: rect.y + rect.height },
          { x: rect.x + rect.width * 0.5, y: rect.y + rect.height * 0.5 }
        ];
      
        let triangle;
      
        if (spike.direction === "down") {
          triangle = [
            { x: spike.x, y: spike.y },
            { x: spike.x + spike.width * 0.5, y: spike.y + spike.height },
            { x: spike.x + spike.width, y: spike.y }
          ];
        } else if (spike.direction === "left") {
          triangle = [
            { x: spike.x + spike.width, y: spike.y },
            { x: spike.x, y: spike.y + spike.height * 0.5 },
            { x: spike.x + spike.width, y: spike.y + spike.height }
          ];
        } else if (spike.direction === "right") {
          triangle = [
            { x: spike.x, y: spike.y },
            { x: spike.x + spike.width, y: spike.y + spike.height * 0.5 },
            { x: spike.x, y: spike.y + spike.height }
          ];
        } else {
          triangle = [
            { x: spike.x, y: spike.y + spike.height },
            { x: spike.x + spike.width * 0.5, y: spike.y },
            { x: spike.x + spike.width, y: spike.y + spike.height }
          ];
        }
      
        return points.some((point) => pointInTriangle(point, triangle[0], triangle[1], triangle[2]));
      }
      
      exports.aabbIntersects = aabbIntersects;
      exports.containsPoint = containsPoint;
      exports.rectIntersectsSpike = rectIntersectsSpike;
      
    },
    "src/physics/PhysicsSystem.js": (exports, __require__) => {
      const { aabbIntersects } = __require__("src/physics/Collision.js");
      class PhysicsSystem {
        constructor(config) {
          this.config = config;
        }
      
        getNearbySolids(level, actor, dynamicSolids = []) {
          const region = level.getSolidRectsForRegion(
            actor.x - 4,
            actor.y - 4,
            actor.x + actor.width + 4,
            actor.y + actor.height + 4
          );
      
          for (const entity of dynamicSolids) {
            if (!entity.active || !entity.isSolid) {
              continue;
            }
      
            if (
              entity.x < actor.x + actor.width + 128 &&
              entity.x + entity.width > actor.x - 128 &&
              entity.y < actor.y + actor.height + 128 &&
              entity.y + entity.height > actor.y - 128
            ) {
              region.push(entity);
            }
          }
      
          return region;
        }
      
        moveActor(actor, level, dynamicSolids, dt) {
          actor.grounded = false;
          actor.hitCeiling = false;
          actor.hitWall = false;
          actor.groundEntity = null;
      
          if (actor.carriedBy && actor.carriedBy.active) {
            actor.x += actor.carriedBy.deltaX;
            actor.y += actor.carriedBy.deltaY;
          }
      
          actor.carriedBy = null;
      
          let moveX = actor.vx * dt;
          actor.x += moveX;
          let solids = this.getNearbySolids(level, actor, dynamicSolids);
      
          for (const solid of solids) {
            if (!aabbIntersects(actor.bounds, solid.bounds ?? solid)) {
              continue;
            }
      
            if (moveX > 0) {
              actor.x = (solid.x ?? solid.bounds.x) - actor.width;
            } else if (moveX < 0) {
              actor.x = (solid.x ?? solid.bounds.x) + (solid.width ?? solid.bounds.width);
            }
      
            actor.vx = 0;
            actor.hitWall = true;
            moveX = 0;
          }
      
          let moveY = actor.vy * dt;
          actor.y += moveY;
          solids = this.getNearbySolids(level, actor, dynamicSolids);
      
          for (const solid of solids) {
            const box = solid.bounds ?? solid;
      
            if (!aabbIntersects(actor.bounds, box)) {
              continue;
            }
      
            if (moveY > 0) {
              actor.y = box.y - actor.height;
              actor.grounded = actor.gravityDirection > 0;
              actor.hitCeiling = actor.gravityDirection < 0;
              actor.groundEntity = solid.isSolid ? solid : null;
            } else if (moveY < 0) {
              actor.y = box.y + box.height;
              actor.grounded = actor.gravityDirection < 0;
              actor.hitCeiling = actor.gravityDirection > 0;
              actor.groundEntity = solid.isSolid ? solid : null;
            }
      
            actor.vy = 0;
            moveY = 0;
          }
      
          if (actor.grounded && actor.groundEntity?.isSolid) {
            actor.carriedBy = actor.groundEntity;
          }
        }
      }
      
      exports.PhysicsSystem = PhysicsSystem;
      
    },
    "src/rendering/BackgroundRenderer.js": (exports, __require__) => {
      const { blend, withAlpha } = __require__("src/utils/color.js");
      const { clamp, inverseLerp } = __require__("src/utils/math.js");
      class BackgroundRenderer {
        constructor(config) {
          this.config = config;
          this.starSeed = Array.from({ length: 96 }, (_, index) => ({
            x: ((index * 113) % 997) / 997,
            y: ((index * 181) % 991) / 991,
            size: 1 + ((index * 17) % 3),
            speed: 0.1 + (((index * 29) % 100) / 100) * 0.7
          }));
        }
      
        draw(renderer, scene) {
          const { ctx, width, height } = renderer;
          const palette = scene?.colors ?? {
            skyTop: "#102744",
            skyBottom: "#05101d",
            glow: "#7bf7ff",
            accent: "#ffe57a"
          };
          const beat = scene?.beat ?? 0;
      
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, palette.skyTop);
          gradient.addColorStop(1, palette.skyBottom);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
      
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          const glowGradient = ctx.createRadialGradient(width * 0.5, height * 0.26, 20, width * 0.5, height * 0.26, 280);
          glowGradient.addColorStop(0, withAlpha(palette.glow, 0.26 + beat * 0.18));
          glowGradient.addColorStop(1, withAlpha(palette.glow, 0));
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(width * 0.5, height * 0.26, 280, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
      
          for (const star of this.starSeed) {
            const x = (star.x * width - (scene?.cameraX ?? 0) * star.speed * 0.1) % width;
            const y = star.y * height * 0.72;
            ctx.fillStyle = withAlpha("#ffffff", 0.18 + beat * 0.12);
            ctx.fillRect((x + width) % width, y, star.size, star.size);
          }
      
          this.drawMountains(ctx, width, height, palette.skyBottom, scene?.cameraX ?? 0, 0.18, 0.62, 72);
          this.drawMountains(ctx, width, height, blend(palette.skyBottom, palette.glow, 0.18), scene?.cameraX ?? 0, 0.3, 0.74, 102);
          this.drawGroundGrid(ctx, width, height, palette, beat, scene?.cameraX ?? 0);
        }
      
        drawMountains(ctx, width, height, color, cameraX, speed, horizon, amplitude) {
          ctx.fillStyle = withAlpha(color, 0.42);
          ctx.beginPath();
          ctx.moveTo(0, height);
      
          const segments = 10;
          for (let index = 0; index <= segments; index += 1) {
            const t = index / segments;
            const x = t * width;
            const wave = Math.sin((t * 4.3 + cameraX * 0.0025 * speed) * Math.PI * 2);
            const y = height * horizon - Math.abs(wave) * amplitude;
            ctx.lineTo(x, y);
          }
      
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fill();
        }
      
        drawGroundGrid(ctx, width, height, palette, beat, cameraX) {
          const horizonY = height * 0.73;
          ctx.strokeStyle = withAlpha(palette.glow, 0.18);
          ctx.lineWidth = 1;
      
          for (let row = 0; row < 16; row += 1) {
            const y = horizonY + Math.pow(row / 15, 1.8) * height * 0.45;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }
      
          const perspective = 16;
          for (let column = -perspective; column <= perspective; column += 1) {
            const x = width * 0.5 + (column * width) / 15 - (cameraX * 0.4) % (width / 7.5);
            ctx.beginPath();
            ctx.moveTo(width * 0.5, horizonY);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
      
          const floorGlow = ctx.createLinearGradient(0, horizonY, 0, height);
          floorGlow.addColorStop(0, withAlpha(palette.accent, 0.02));
          floorGlow.addColorStop(1, withAlpha(palette.glow, 0.12 + beat * 0.07));
          ctx.fillStyle = floorGlow;
          ctx.fillRect(0, horizonY, width, height - horizonY);
      
          const pulseHeight = inverseLerp(0, 1, clamp(beat, 0, 1));
          ctx.fillStyle = withAlpha(palette.glow, 0.05 + pulseHeight * 0.05);
          ctx.fillRect(0, horizonY - 8, width, 10);
        }
      }
      
      exports.BackgroundRenderer = BackgroundRenderer;
      
    },
    "src/rendering/Camera.js": (exports, __require__) => {
      const { clamp, damp, randRange } = __require__("src/utils/math.js");
      class Camera {
        constructor(config) {
          this.config = config;
          this.x = 0;
          this.y = 0;
          this.shakeTime = 0;
          this.shakeDuration = 0;
          this.shakeIntensity = 0;
          this.shakeOffsetX = 0;
          this.shakeOffsetY = 0;
        }
      
        reset(x = 0, y = 0) {
          this.x = x;
          this.y = y;
          this.shakeTime = 0;
          this.shakeDuration = 0;
          this.shakeIntensity = 0;
          this.shakeOffsetX = 0;
          this.shakeOffsetY = 0;
        }
      
        addShake(intensity, duration = 0.24) {
          this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
          this.shakeDuration = Math.max(this.shakeDuration, duration);
          this.shakeTime = Math.max(this.shakeTime, duration);
        }
      
        update(dt, targetX, targetY) {
          this.x = damp(this.x, targetX, 10, dt);
          this.y = damp(this.y, targetY, 10, dt);
      
          if (this.shakeTime > 0) {
            this.shakeTime = Math.max(0, this.shakeTime - dt);
            const normalized = this.shakeDuration <= 0 ? 0 : this.shakeTime / this.shakeDuration;
            const amplitude = this.shakeIntensity * normalized;
            this.shakeOffsetX = randRange(-amplitude, amplitude);
            this.shakeOffsetY = randRange(-amplitude, amplitude);
      
            if (this.shakeTime === 0) {
              this.shakeIntensity = 0;
              this.shakeDuration = 0;
            }
          } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
          }
      
          this.y = clamp(this.y, -2000, 2000);
        }
      
        applyToContext(ctx) {
          ctx.translate(Math.round(-this.x + this.shakeOffsetX), Math.round(-this.y + this.shakeOffsetY));
        }
      }
      
      exports.Camera = Camera;
      
    },
    "src/rendering/Renderer.js": (exports, __require__) => {
      const { BackgroundRenderer } = __require__("src/rendering/BackgroundRenderer.js");
      const { withAlpha } = __require__("src/utils/color.js");
      class Renderer {
        constructor(canvas, config) {
          this.canvas = canvas;
          this.ctx = canvas.getContext("2d");
          this.config = config;
          this.width = config.canvas.width;
          this.height = config.canvas.height;
          this.pixelRatio = 1;
          this.background = new BackgroundRenderer(config);
          this.resizeObserver = null;
      
          this.handleResize = this.handleResize.bind(this);
          this.handleResize();
          window.addEventListener("resize", this.handleResize);
        }
      
        handleResize() {
          const devicePixelRatio = Math.min(window.devicePixelRatio || 1, this.config.canvas.maxPixelRatio);
          this.pixelRatio = devicePixelRatio;
          this.canvas.width = Math.floor(this.width * devicePixelRatio);
          this.canvas.height = Math.floor(this.height * devicePixelRatio);
          this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
          this.ctx.imageSmoothingEnabled = true;
        }
      
        beginFrame() {
          this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
          this.ctx.clearRect(0, 0, this.width, this.height);
        }
      
        drawBackground(scene) {
          this.background.draw(this, scene);
        }
      
        withCamera(camera, callback) {
          this.ctx.save();
          camera.applyToContext(this.ctx);
          callback(this.ctx);
          this.ctx.restore();
        }
      
        drawGrid(cameraX, cameraY, tileSize, color = "rgba(255,255,255,0.08)") {
          const ctx = this.ctx;
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          const startX = Math.floor(cameraX / tileSize) * tileSize - tileSize * 2;
          const endX = startX + this.width + tileSize * 4;
          const startY = Math.floor(cameraY / tileSize) * tileSize - tileSize * 2;
          const endY = startY + this.height + tileSize * 4;
      
          for (let x = startX; x <= endX; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
          }
      
          for (let y = startY; y <= endY; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
          }
      
          ctx.restore();
        }
      
        drawRect(x, y, width, height, color) {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(x, y, width, height);
        }
      
        drawGlowRect(x, y, width, height, color, glow = 18) {
          const ctx = this.ctx;
          ctx.save();
          ctx.shadowColor = color;
          ctx.shadowBlur = glow;
          ctx.fillStyle = color;
          ctx.fillRect(x, y, width, height);
          ctx.restore();
        }
      
        drawRoundedRect(x, y, width, height, radius, fillStyle, strokeStyle = null) {
          const ctx = this.ctx;
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.arcTo(x + width, y, x + width, y + height, radius);
          ctx.arcTo(x + width, y + height, x, y + height, radius);
          ctx.arcTo(x, y + height, x, y, radius);
          ctx.arcTo(x, y, x + width, y, radius);
          ctx.closePath();
      
          if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
          }
      
          if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
          }
        }
      
        drawSpike(x, y, width, height, color, direction = "up") {
          const ctx = this.ctx;
          ctx.save();
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 14;
          ctx.beginPath();
      
          if (direction === "up") {
            ctx.moveTo(x, y + height);
            ctx.lineTo(x + width * 0.5, y);
            ctx.lineTo(x + width, y + height);
          } else if (direction === "down") {
            ctx.moveTo(x, y);
            ctx.lineTo(x + width * 0.5, y + height);
            ctx.lineTo(x + width, y);
          } else if (direction === "left") {
            ctx.moveTo(x + width, y);
            ctx.lineTo(x, y + height * 0.5);
            ctx.lineTo(x + width, y + height);
          } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y + height * 0.5);
            ctx.lineTo(x, y + height);
          }
      
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      
        drawPortal(x, y, width, height, outerColor, innerColor) {
          const ctx = this.ctx;
          ctx.save();
          ctx.strokeStyle = outerColor;
          ctx.lineWidth = 6;
          ctx.shadowColor = outerColor;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.ellipse(x + width * 0.5, y + height * 0.5, width * 0.38, height * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = withAlpha(innerColor, 0.2);
          ctx.fill();
      
          ctx.strokeStyle = withAlpha("#ffffff", 0.9);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x + width * 0.5, y + height * 0.5, width * 0.24, height * 0.34, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      
        drawPad(x, y, width, height, color) {
          const ctx = this.ctx;
          ctx.save();
          ctx.shadowColor = color;
          ctx.shadowBlur = 18;
          const gradient = ctx.createLinearGradient(x, y, x, y + height);
          gradient.addColorStop(0, withAlpha(color, 0.95));
          gradient.addColorStop(1, withAlpha(color, 0.32));
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, width, height);
      
          ctx.fillStyle = withAlpha("#ffffff", 0.35);
          ctx.fillRect(x + 4, y + 4, width - 8, 4);
          ctx.restore();
        }
      
        drawRing(x, y, radius, lineWidth, color) {
          const ctx = this.ctx;
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.shadowColor = color;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      
        drawLabel(text, x, y, color = "#ffffff", font = "600 16px Segoe UI") {
          this.ctx.save();
          this.ctx.font = font;
          this.ctx.fillStyle = color;
          this.ctx.fillText(text, x, y);
          this.ctx.restore();
        }
      }
      
      exports.Renderer = Renderer;
      
    },
    "src/states/CompleteState.js": (exports, __require__) => {
      const { BaseState } = __require__("src/core/BaseState.js");
      class CompleteState extends BaseState {
        constructor(game, payload) {
          super(game);
          this.kind = "complete";
          this.transparent = true;
          this.blocksUpdateBelow = true;
          this.payload = payload;
        }
      
        onEnter() {
          this.game.ui.showComplete(this.payload);
        }
      
        onExit() {
          this.game.ui.hideComplete();
        }
      }
      
      exports.CompleteState = CompleteState;
      
    },
    "src/states/GameOverState.js": (exports, __require__) => {
      const { BaseState } = __require__("src/core/BaseState.js");
      class GameOverState extends BaseState {
        constructor(game, playState) {
          super(game);
          this.kind = "gameOver";
          this.transparent = true;
          this.blocksUpdateBelow = true;
          this.playState = playState;
          this.timer = game.config.gameplay.restartDelay;
        }
      
        onEnter() {
          this.game.ui.flashGameOver();
        }
      
        update(dt) {
          this.timer -= dt;
      
          if (this.timer <= 0) {
            this.playState.restart();
            this.game.stateManager.popState();
          }
        }
      }
      
      exports.GameOverState = GameOverState;
      
    },
    "src/states/LevelSelectState.js": (exports, __require__) => {
      const { BaseState } = __require__("src/core/BaseState.js");
      class LevelSelectState extends BaseState {
        constructor(game) {
          super(game);
          this.kind = "levelSelect";
          this.time = 0;
        }
      
        onEnter() {
          this.game.audio.stopSong();
          this.game.ui.hideComplete();
          this.game.ui.showPause(false);
          this.game.ui.showLoading(false);
          this.game.ui.showLevelSelect(this.game.levelLoader.getCatalog(), this.game.saveManager.progress);
        }
      
        update(dt) {
          this.time += dt;
        }
      
        render(renderer) {
          renderer.drawBackground({
            colors: {
              skyTop: "#0b2440",
              skyBottom: "#060d18",
              glow: "#89ffb0",
              accent: "#7bf7ff"
            },
            beat: (Math.sin(this.time * 2) + 1) * 0.16,
            cameraX: this.time * 32
          });
        }
      }
      
      exports.LevelSelectState = LevelSelectState;
      
    },
    "src/states/MenuState.js": (exports, __require__) => {
      const { BaseState } = __require__("src/core/BaseState.js");
      class MenuState extends BaseState {
        constructor(game) {
          super(game);
          this.kind = "menu";
          this.time = 0;
        }
      
        onEnter() {
          this.game.audio.stopSong();
          this.game.ui.hideComplete();
          this.game.ui.showPause(false);
          this.game.ui.showLoading(false);
          this.game.ui.showMenu();
          this.game.ui.syncSettings();
        }
      
        update(dt) {
          this.time += dt;
        }
      
        render(renderer) {
          renderer.drawBackground({
            colors: {
              skyTop: "#102744",
              skyBottom: "#06101c",
              glow: "#7bf7ff",
              accent: "#ffe57a"
            },
            beat: (Math.sin(this.time * 2.8) + 1) * 0.18,
            cameraX: this.time * 40
          });
        }
      }
      
      exports.MenuState = MenuState;
      
    },
    "src/states/PauseState.js": (exports, __require__) => {
      const { BaseState } = __require__("src/core/BaseState.js");
      class PauseState extends BaseState {
        constructor(game) {
          super(game);
          this.kind = "pause";
          this.transparent = true;
          this.blocksUpdateBelow = true;
        }
      
        onEnter() {
          this.game.ui.showPause(true);
        }
      
        onExit() {
          this.game.ui.showPause(false);
        }
      
        update() {
          if (this.game.input.consume("pause")) {
            this.game.resumeCurrentPause();
          }
        }
      }
      
      exports.PauseState = PauseState;
      
    },
    "src/states/PlayState.js": (exports, __require__) => {
      const { BaseState } = __require__("src/core/BaseState.js");
      const { Camera } = __require__("src/rendering/Camera.js");
      const { Player } = __require__("src/entities/Player.js");
      const { createEntityFromDefinition } = __require__("src/entities/createEntity.js");
      const { ParticleSystem } = __require__("src/fx/ParticleSystem.js");
      const { rectIntersectsSpike } = __require__("src/physics/Collision.js");
      const { GameOverState } = __require__("src/states/GameOverState.js");
      const { CompleteState } = __require__("src/states/CompleteState.js");
      const { clamp } = __require__("src/utils/math.js");
      class PlayState extends BaseState {
        constructor(game, levelId) {
          super(game);
          this.kind = "play";
          this.levelId = levelId;
          this.level = null;
          this.camera = new Camera(game.config);
          this.player = null;
          this.entities = [];
          this.dynamicSolids = [];
          this.spikes = [];
          this.jumpPads = [];
          this.portals = [];
          this.checkpoints = [];
          this.particles = new ParticleSystem();
          this.attempt = 1;
          this.progress = 0;
          this.bestRunProgress = 0;
          this.loaded = false;
          this.loadingError = null;
          this.initialSpawn = null;
          this.activeCheckpoint = null;
          this.completing = false;
          this.beatPulse = 0;
          this.loadGeneration = 0;
          this.disposed = false;
        }
      
        async onEnter() {
          this.disposed = false;
          this.game.ui.clearScreens();
          this.game.ui.showLoading(true);
          this.game.ui.showHUD(false);
          this.game.ui.showPause(false);
          this.game.ui.hideComplete();
          this.game.ui.touchControls(this.game.saveManager.settings.touchControls);
          this.game.ui.setEditorVisible(false);
          await this.load();
        }
      
        async load() {
          const loadGeneration = ++this.loadGeneration;
      
          try {
            this.level = await this.game.levelLoader.loadLevel(this.levelId);
      
            if (this.disposed || loadGeneration !== this.loadGeneration || this.game.stateManager.current !== this) {
              return;
            }
      
            this.initialSpawn = {
              x: this.level.player.spawnX * this.level.tileSize,
              y: this.level.player.spawnY * this.level.tileSize
            };
            this.buildLevel();
            this.loaded = true;
            this.game.ui.showLoading(false);
            this.game.ui.showHUD(true);
            this.game.audio.startSong(this.level.songId);
          } catch (error) {
            if (this.disposed || loadGeneration !== this.loadGeneration) {
              return;
            }
      
            this.loadingError = error;
            console.error("Failed to load play state.", error);
            this.game.ui.showToast("Failed to load level");
            this.game.openMenu();
          }
        }
      
        onExit() {
          this.disposed = true;
          this.loadGeneration += 1;
          this.game.ui.showLoading(false);
          this.game.ui.setEditorVisible(false);
        }
      
        buildLevel(spawnOverride = null) {
          const spawn = spawnOverride ?? this.initialSpawn;
          this.entities = [];
          this.particles.clear();
          this.player = new Player(this.game.config, spawn);
          this.player.setBaseSpeed(this.level.baseSpeed);
          this.player.setDoubleJumpEnabled(this.game.saveManager.settings.doubleJumpMode);
      
          for (const definition of this.level.objects) {
            const entity = createEntityFromDefinition(this.level, definition);
      
            if (entity) {
              this.entities.push(entity);
            }
          }
      
          this.refreshEntityBuckets();
          this.camera.reset(Math.max(0, spawn.x - 240), 0);
        }
      
        refreshEntityBuckets() {
          this.dynamicSolids = this.entities.filter((entity) => entity.isSolid);
          this.spikes = this.entities.filter((entity) => entity.type === "spike");
          this.jumpPads = this.entities.filter((entity) => entity.type === "jumpPad");
          this.portals = this.entities.filter((entity) => entity.type === "gravityPortal" || entity.type === "speedPortal");
          this.checkpoints = this.entities.filter((entity) => entity.type === "checkpoint");
        }
      
        addEntity(entity) {
          this.entities.push(entity);
          this.refreshEntityBuckets();
        }
      
        applySettings() {
          this.player?.setDoubleJumpEnabled(this.game.saveManager.settings.doubleJumpMode);
        }
      
        restart() {
          this.game.audio.startSong(this.level.songId);
          this.game.ui.showPause(false);
          this.game.ui.hideComplete();
          this.game.ui.showHUD(true);
          this.game.ui.clearScreens();
          this.attempt += 1;
          const spawn = this.activeCheckpoint ?? this.initialSpawn;
          this.level = new this.level.constructor(this.level.cloneData());
          this.buildLevel(spawn);
          this.completing = false;
        }
      
        completeLevel() {
          if (this.completing) {
            return;
          }
      
          this.completing = true;
          this.bestRunProgress = 1;
          this.game.saveManager.setBestPercent(this.level.id, 1);
          this.game.saveManager.markComplete(this.level.id);
          const nextLevelId = this.game.levelLoader.getNextLevelId(this.level.id);
      
          if (nextLevelId) {
            this.game.saveManager.unlockLevel(nextLevelId);
          }
      
          this.game.audio.playComplete();
          this.game.stateManager.pushState(new CompleteState(this.game, {
            levelName: this.level.name,
            nextLevelId
          }));
        }
      
        handleDeath() {
          if (!this.loaded || this.completing || this.game.stateManager.current?.kind === "gameOver") {
            return;
          }
      
          this.bestRunProgress = Math.max(this.bestRunProgress, this.progress);
          this.game.saveManager.setBestPercent(this.level.id, this.bestRunProgress);
          this.player.alive = false;
          this.game.audio.playDeath();
          this.camera.addShake(26, 0.28);
          this.particles.spawnBurst(this.player.x + this.player.width * 0.5, this.player.y + this.player.height * 0.5, {
            count: 18,
            color: this.player.gravityDirection > 0 ? "#7bf7ff" : "#ff9fd4",
            speed: 260,
            life: 0.55
          });
          this.game.stateManager.pushState(new GameOverState(this.game, this));
        }
      
        update(dt) {
          if (!this.loaded || !this.player) {
            return;
          }
      
          this.beatPulse = this.game.audio.getBeatPulse();
      
          if (this.game.input.consume("pause")) {
            this.game.pauseCurrentLevel();
            return;
          }
      
          if (this.game.input.consume("restart")) {
            this.handleDeath();
            return;
          }
      
          this.game.editor.update(this);
      
          if (this.game.editor.enabled) {
            this.game.input.consume("jump");
          }
      
          for (const entity of this.entities) {
            entity.update?.(dt, this);
          }
      
          const jumpResult = this.player.update(dt, {
            input: this.game.input,
            physics: this.game.physics,
            level: this.level,
            dynamicSolids: this.dynamicSolids
          });
      
          if (jumpResult?.type === "jump") {
            this.game.audio.playJump();
            this.particles.spawnDirectionalBurst(
              this.player.x + this.player.width * 0.5,
              this.player.y + this.player.height * (this.player.gravityDirection > 0 ? 1 : 0),
              -1,
              -this.player.gravityDirection,
              {
                color: "#7bf7ff",
                count: 8,
                speed: 140
              }
            );
          } else if (jumpResult?.type === "doubleJump") {
            this.game.audio.playDoubleJump();
            this.particles.spawnBurst(this.player.x + this.player.width * 0.5, this.player.y + this.player.height * 0.5, {
              color: "#ffe57a",
              count: 14,
              speed: 180,
              life: 0.35
            });
          }
      
          for (const pad of this.jumpPads) {
            if (pad.tryTrigger(this.player)) {
              this.game.audio.playPad();
              this.particles.spawnDirectionalBurst(pad.x + pad.width * 0.5, pad.y, 0, -this.player.gravityDirection, {
                color: pad.color,
                count: 12,
                speed: 160
              });
            }
          }
      
          for (const portal of this.portals) {
            const result = portal.tryTrigger(this.player);
      
            if (result) {
              this.game.audio.playPortal();
              this.particles.spawnBurst(portal.x + portal.width * 0.5, portal.y + portal.height * 0.5, {
                color: portal.outerColor,
                count: 10,
                speed: 140,
                life: 0.4
              });
            }
          }
      
          for (const checkpoint of this.checkpoints) {
            if (checkpoint.tryTrigger(this.player)) {
              this.activeCheckpoint = {
                x: checkpoint.x,
                y: checkpoint.y
              };
              this.game.audio.playCheckpoint();
              this.game.ui.showToast("Checkpoint tagged");
            }
          }
      
          for (const spike of this.spikes) {
            if (rectIntersectsSpike(this.player.bounds, spike)) {
              this.handleDeath();
              return;
            }
          }
      
          if (this.player.hitWall) {
            this.handleDeath();
            return;
          }
      
          if (this.player.y > this.level.height * this.level.tileSize + 220 || this.player.y < -260) {
            this.handleDeath();
            return;
          }
      
          this.progress = clamp((this.player.x + this.player.width * 0.5) / this.level.finishX, 0, 1);
          this.bestRunProgress = Math.max(this.bestRunProgress, this.progress);
      
          if (this.player.x + this.player.width >= this.level.finishX) {
            this.completeLevel();
            return;
          }
      
          this.particles.update(dt);
      
          const targetCameraX = Math.max(0, this.player.x - this.game.config.camera.followOffsetX);
          const targetCameraY = Math.max(-80, this.player.y - this.game.config.canvas.height * 0.46 + this.game.config.camera.verticalLook * this.player.gravityDirection);
          this.camera.update(dt, targetCameraX, targetCameraY);
      
          this.game.ui.updateHUD({
            levelName: this.level.name,
            attempt: this.attempt,
            progress: this.progress,
            doubleJumpMode: this.game.saveManager.settings.doubleJumpMode,
            beat: this.beatPulse
          });
        }
      
        drawTiles(renderer) {
          const ctx = renderer.ctx;
          const tileSize = this.level.tileSize;
          const startTileX = Math.floor(this.camera.x / tileSize) - 2;
          const endTileX = startTileX + Math.ceil(renderer.width / tileSize) + 4;
          const startTileY = Math.floor(this.camera.y / tileSize) - 2;
          const endTileY = startTileY + Math.ceil(renderer.height / tileSize) + 5;
      
          for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
            for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
              if (!this.level.isSolidTile(tileX, tileY)) {
                continue;
              }
      
              const x = tileX * tileSize;
              const y = tileY * tileSize;
              renderer.drawGlowRect(x, y, tileSize, tileSize, this.level.colors.tile, 8);
              ctx.strokeStyle = "rgba(255,255,255,0.08)";
              ctx.strokeRect(x, y, tileSize, tileSize);
            }
          }
        }
      
        drawFinishGate(renderer) {
          const ctx = renderer.ctx;
          const x = this.level.finishX;
          const totalHeight = this.level.height * this.level.tileSize;
          ctx.save();
          ctx.strokeStyle = "#89ffb0";
          ctx.lineWidth = 8;
          ctx.shadowColor = "#89ffb0";
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, totalHeight);
          ctx.stroke();
          ctx.restore();
        }
      
        render(renderer) {
          if (this.loadingError) {
            renderer.drawBackground({
              colors: {
                skyTop: "#2a0f22",
                skyBottom: "#160814",
                glow: "#ff6e96",
                accent: "#ffe57a"
              },
              beat: 0,
              cameraX: 0
            });
            return;
          }
      
          const colors = this.level?.colors ?? {
            skyTop: "#102744",
            skyBottom: "#06101c",
            glow: "#7bf7ff",
            accent: "#ffe57a"
          };
      
          renderer.drawBackground({
            colors,
            beat: this.beatPulse,
            cameraX: this.camera.x
          });
      
          if (!this.loaded) {
            return;
          }
      
          renderer.withCamera(this.camera, () => {
            if (this.game.editor.enabled) {
              renderer.drawGrid(this.camera.x, this.camera.y, this.level.tileSize);
            }
      
            this.drawTiles(renderer);
      
            for (const entity of this.entities) {
              entity.draw(renderer);
            }
      
            this.drawFinishGate(renderer);
            this.player.draw(renderer);
            this.particles.draw(renderer);
          });
        }
      }
      
      exports.PlayState = PlayState;
      
    },
    "src/ui/MenuUI.js": (exports, __require__) => {
      const { formatPercent } = __require__("src/utils/math.js");
      class MenuUI {
        constructor(game) {
          this.game = game;
          this.toastTimer = null;
          this.pendingNextLevelId = null;
          this.transitionLocked = false;
      
          this.elements = {
            hud: document.getElementById("hud"),
            hudLevelName: document.getElementById("hudLevelName"),
            hudAttempt: document.getElementById("hudAttempt"),
            hudMode: document.getElementById("hudMode"),
            progressFill: document.getElementById("progressFill"),
            progressPulse: document.getElementById("progressPulse"),
            progressLabel: document.getElementById("progressLabel"),
            editorBanner: document.getElementById("editorBanner"),
            editorPanel: document.getElementById("editorPanel"),
            editorSelectionLabel: document.getElementById("editorSelectionLabel"),
            touchControls: document.getElementById("touchControls"),
            toast: document.getElementById("toast"),
            gameOverFlash: document.getElementById("gameOverFlash"),
            doubleJumpToggle: document.getElementById("doubleJumpToggle"),
            touchToggle: document.getElementById("touchToggle"),
            volumeSlider: document.getElementById("volumeSlider"),
            levelGrid: document.getElementById("levelGrid"),
            completeText: document.getElementById("completeText"),
            screens: {
              menu: document.getElementById("screenMenu"),
              levelSelect: document.getElementById("screenLevelSelect"),
              pause: document.getElementById("screenPause"),
              complete: document.getElementById("screenComplete"),
              loading: document.getElementById("screenLoading")
            }
          };
      
          this.bindEvents();
          this.syncSettings();
        }
      
        bindEvents() {
          document.getElementById("startGameButton")?.addEventListener("click", () => {
            const firstLevel = this.game.levelLoader.getCatalog()[0]?.id;
            this.game.playLevel(firstLevel);
          });
      
          document.getElementById("levelSelectButton")?.addEventListener("click", () => {
            this.game.openLevelSelect();
          });
      
          document.getElementById("backToMenuButton")?.addEventListener("click", () => {
            this.game.openMenu();
          });
      
          document.getElementById("resumeButton")?.addEventListener("click", () => {
            this.game.resumeCurrentPause();
          });
      
          document.getElementById("restartButton")?.addEventListener("click", () => {
            this.game.restartCurrentLevel();
          });
      
          document.getElementById("exitLevelButton")?.addEventListener("click", () => {
            this.game.exitToMenu();
          });
      
          document.getElementById("nextLevelButton")?.addEventListener("click", () => {
            if (this.pendingNextLevelId) {
              this.game.playLevel(this.pendingNextLevelId);
              return;
            }
      
            this.game.openLevelSelect();
          });
      
          document.getElementById("completeToMenuButton")?.addEventListener("click", () => {
            this.game.openMenu();
          });
      
          this.elements.doubleJumpToggle?.addEventListener("change", (event) => {
            const enabled = event.target.checked;
            this.game.saveManager.setDoubleJumpMode(enabled);
            this.game.applySettingsToActivePlayState();
          });
      
          this.elements.touchToggle?.addEventListener("change", (event) => {
            const enabled = event.target.checked;
            this.game.saveManager.setTouchControls(enabled);
            this.game.touchControls.setVisible(enabled);
          });
      
          this.elements.volumeSlider?.addEventListener("input", (event) => {
            const volume = Number.parseInt(event.target.value, 10) / 100;
            this.game.saveManager.setVolume(volume);
            this.game.audio.setMasterVolume(volume);
          });
        }
      
        syncSettings() {
          const { settings } = this.game.saveManager;
          this.elements.doubleJumpToggle.checked = settings.doubleJumpMode;
          this.elements.touchToggle.checked = settings.touchControls;
          this.elements.volumeSlider.value = String(Math.round(settings.masterVolume * 100));
        }
      
        setTransitionLocked(locked) {
          this.transitionLocked = locked;
          document
            .querySelectorAll("#startGameButton, #levelSelectButton, #backToMenuButton, #resumeButton, #restartButton, #exitLevelButton, #nextLevelButton, #completeToMenuButton")
            .forEach((element) => {
              if (element instanceof HTMLButtonElement) {
                element.disabled = locked;
              }
            });
        }
      
        setScreen(name, active) {
          const screen = this.elements.screens[name];
          screen?.classList.toggle("active", active);
        }
      
        clearScreens() {
          Object.keys(this.elements.screens).forEach((name) => this.setScreen(name, false));
        }
      
        showMenu() {
          this.setTransitionLocked(false);
          this.clearScreens();
          this.setScreen("menu", true);
          this.showHUD(false);
          this.touchControls(false);
        }
      
        showLevelSelect(catalog, progress) {
          this.setTransitionLocked(false);
          this.clearScreens();
          this.setScreen("levelSelect", true);
          this.showHUD(false);
          this.touchControls(false);
          this.renderLevelCards(catalog, progress);
        }
      
        showPause(active) {
          if (active) {
            this.setTransitionLocked(false);
          }
          this.setScreen("pause", active);
        }
      
        showLoading(active) {
          this.setTransitionLocked(active);
          this.setScreen("loading", active);
        }
      
        showComplete({ levelName, nextLevelId }) {
          this.setTransitionLocked(false);
          this.pendingNextLevelId = nextLevelId;
          this.elements.completeText.textContent = nextLevelId
            ? `${levelName} cleared. The next course is unlocked.`
            : `${levelName} cleared. You completed all available levels.`;
          this.setScreen("complete", true);
        }
      
        hideComplete() {
          this.setScreen("complete", false);
          this.pendingNextLevelId = null;
        }
      
        showHUD(visible) {
          this.elements.hud.classList.toggle("hidden", !visible);
        }
      
        updateHUD(data) {
          this.elements.hudLevelName.textContent = data.levelName;
          this.elements.hudAttempt.textContent = String(data.attempt);
          this.elements.hudMode.textContent = data.doubleJumpMode ? "Double Jump" : "Single Jump";
          this.elements.progressFill.style.width = `${Math.round(data.progress * 100)}%`;
          this.elements.progressPulse.style.left = `${Math.round(data.progress * 100)}%`;
          this.elements.progressLabel.textContent = formatPercent(data.progress);
          this.elements.progressFill.style.boxShadow = `0 0 ${12 + data.beat * 12}px rgba(123, 247, 255, 0.5)`;
        }
      
        setEditorVisible(visible, selectionLabel = "Spike") {
          this.elements.editorBanner.classList.toggle("hidden", !visible);
          this.elements.editorPanel.classList.toggle("hidden", !visible);
          this.elements.editorSelectionLabel.textContent = selectionLabel;
        }
      
        touchControls(visible) {
          this.game.touchControls.setVisible(visible);
        }
      
        showToast(message, duration = 1600) {
          const toast = this.elements.toast;
          toast.textContent = message;
          toast.classList.remove("hidden");
      
          if (this.toastTimer) {
            clearTimeout(this.toastTimer);
          }
      
          this.toastTimer = setTimeout(() => {
            toast.classList.add("hidden");
          }, duration);
        }
      
        flashGameOver() {
          this.elements.gameOverFlash.classList.remove("hidden");
          setTimeout(() => {
            this.elements.gameOverFlash.classList.add("hidden");
          }, 420);
        }
      
        renderLevelCards(catalog, progress) {
          const grid = this.elements.levelGrid;
          grid.innerHTML = "";
      
          const ordered = [...catalog].sort((first, second) => first.order - second.order);
      
          for (const level of ordered) {
            const unlocked = progress.unlockedLevels.includes(level.id);
            const completed = progress.completedLevels.includes(level.id);
            const best = progress.bestPercentByLevel[level.id] ?? 0;
            const card = document.createElement("article");
            card.className = `level-card ${unlocked ? "" : "locked"}`;
            card.innerHTML = `
              <h3>${level.name}</h3>
              <div class="difficulty-pill">${level.difficulty}</div>
              <p>${level.description}</p>
              <div class="level-stats">
                <span>Best ${Math.round(best * 100)}%</span>
                <span>${completed ? "Cleared" : unlocked ? "Unlocked" : "Locked"}</span>
              </div>
              <button ${unlocked ? "" : "disabled"}>${unlocked ? "Play" : "Locked"}</button>
            `;
            const button = card.querySelector("button");
            button?.addEventListener("click", () => {
              if (unlocked) {
                this.game.playLevel(level.id);
              }
            });
            grid.appendChild(card);
          }
        }
      }
      
      exports.MenuUI = MenuUI;
      
    },
    "src/utils/color.js": (exports, __require__) => {
      function withAlpha(color, alpha) {
        if (color.startsWith("rgba")) {
          return color.replace(/rgba\(([^)]+),\s*[\d.]+\)/, `rgba($1, ${alpha})`);
        }
      
        if (color.startsWith("rgb(")) {
          return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
        }
      
        const hex = color.replace("#", "");
        const normalized = hex.length === 3
          ? hex.split("").map((character) => `${character}${character}`).join("")
          : hex;
      
        const value = parseInt(normalized, 16);
        const r = (value >> 16) & 255;
        const g = (value >> 8) & 255;
        const b = value & 255;
      
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      
      function blend(colorA, colorB, ratio) {
        const a = toRgb(colorA);
        const b = toRgb(colorB);
        const mix = (first, second) => Math.round(first + (second - first) * ratio);
        return `rgb(${mix(a.r, b.r)}, ${mix(a.g, b.g)}, ${mix(a.b, b.b)})`;
      }
      
      function toRgb(color) {
        if (color.startsWith("rgb")) {
          const values = color
            .replace(/[rgba()]/g, "")
            .split(",")
            .map((value) => Number.parseFloat(value.trim()));
          return {
            r: values[0],
            g: values[1],
            b: values[2]
          };
        }
      
        const hex = color.replace("#", "");
        const normalized = hex.length === 3
          ? hex.split("").map((character) => `${character}${character}`).join("")
          : hex;
        const value = parseInt(normalized, 16);
        return {
          r: (value >> 16) & 255,
          g: (value >> 8) & 255,
          b: value & 255
        };
      }
      
      exports.withAlpha = withAlpha;
      exports.blend = blend;
      exports.toRgb = toRgb;
      
    },
    "src/utils/math.js": (exports, __require__) => {
      function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
      }
      
      function lerp(a, b, t) {
        return a + (b - a) * t;
      }
      
      function inverseLerp(a, b, value) {
        if (a === b) {
          return 0;
        }
      
        return clamp((value - a) / (b - a), 0, 1);
      }
      
      function approach(value, target, amount) {
        if (value < target) {
          return Math.min(value + amount, target);
        }
      
        return Math.max(value - amount, target);
      }
      
      function damp(current, target, smoothing, dt) {
        return lerp(current, target, 1 - Math.exp(-smoothing * dt));
      }
      
      function signNonZero(value) {
        return value >= 0 ? 1 : -1;
      }
      
      function wrap(value, min, max) {
        const range = max - min;
      
        if (range === 0) {
          return min;
        }
      
        return ((((value - min) % range) + range) % range) + min;
      }
      
      function snap(value, size) {
        return Math.round(value / size) * size;
      }
      
      function randRange(min, max) {
        return min + Math.random() * (max - min);
      }
      
      function randInt(min, max) {
        return Math.floor(randRange(min, max + 1));
      }
      
      function pingPong(time, length) {
        const double = length * 2;
        const wrapped = wrap(time, 0, double);
        return wrapped <= length ? wrapped : double - wrapped;
      }
      
      function degToRad(degrees) {
        return (degrees * Math.PI) / 180;
      }
      
      function radToDeg(radians) {
        return (radians * 180) / Math.PI;
      }
      
      function easeOutQuad(t) {
        return 1 - (1 - t) * (1 - t);
      }
      
      function formatPercent(value) {
        return `${Math.round(clamp(value, 0, 1) * 100)}%`;
      }
      
      exports.clamp = clamp;
      exports.lerp = lerp;
      exports.inverseLerp = inverseLerp;
      exports.approach = approach;
      exports.damp = damp;
      exports.signNonZero = signNonZero;
      exports.wrap = wrap;
      exports.snap = snap;
      exports.randRange = randRange;
      exports.randInt = randInt;
      exports.pingPong = pingPong;
      exports.degToRad = degToRad;
      exports.radToDeg = radToDeg;
      exports.easeOutQuad = easeOutQuad;
      exports.formatPercent = formatPercent;
      
    }
  };

  const __cache__ = {};

  function __require__(id) {
    if (__cache__[id]) {
      return __cache__[id].exports;
    }

    const module = { exports: {} };
    __cache__[id] = module;
    const factory = __modules__[id];

    if (!factory) {
      throw new Error(`Missing bundled module: ${id}`);
    }

    factory(module.exports, __require__);
    return module.exports;
  }

  __require__("src/main.js");
})();
