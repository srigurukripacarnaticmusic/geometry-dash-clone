import { SONG_LIBRARY } from "./songs.js";
import { clamp } from "../utils/math.js";

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

export class AudioSystem {
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
