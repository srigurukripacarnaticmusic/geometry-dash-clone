export const SONG_LIBRARY = {
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
