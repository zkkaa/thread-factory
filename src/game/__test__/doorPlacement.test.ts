import { describe, expect, it } from 'vitest';
import {
  IDLE_PLACEMENT,
  reducePlacement,
  validSlots,
  type PlacementState,
} from '../doorPlacement';

const TOTAL = 5; // program 4 instruksi -> slot 0..4

const holdingEntry: PlacementState = { phase: 'holdingEntry' };
const holdingExit: PlacementState = { phase: 'holdingExit', entry: 1 };

describe('validSlots', () => {
  it('idle: tidak ada slot sah', () => {
    expect(validSlots(IDLE_PLACEMENT, TOTAL)).toEqual([]);
  });

  it('memegang pintu masuk: semua slot kecuali yang terakhir', () => {
    expect(validSlots(holdingEntry, TOTAL)).toEqual([0, 1, 2, 3]);
  });

  it('memegang pintu keluar: hanya slot sesudah pintu masuk', () => {
    expect(validSlots(holdingExit, TOTAL)).toEqual([2, 3, 4]);
  });
});

describe('reducePlacement', () => {
  it('grab dari idle: mulai memegang pintu masuk', () => {
    expect(
      reducePlacement(IDLE_PLACEMENT, { type: 'grab' }, TOTAL).state,
    ).toEqual(holdingEntry);
  });

  it('grab saat menunggu pintu keluar: state tidak berubah', () => {
    expect(reducePlacement(holdingExit, { type: 'grab' }, TOTAL).state).toEqual(
      holdingExit,
    );
  });

  it('lepas pintu masuk di slot 1: lanjut memegang pintu keluar', () => {
    const result = reducePlacement(
      holdingEntry,
      { type: 'drop', slot: 1 },
      TOTAL,
    );
    expect(result.state).toEqual({ phase: 'holdingExit', entry: 1 });
    expect(result.door).toBeNull();
  });

  it('lepas pintu keluar di slot 4: pintu lengkap dan kembali idle', () => {
    const result = reducePlacement(
      holdingExit,
      { type: 'drop', slot: 4 },
      TOTAL,
    );
    expect(result.state).toEqual(IDLE_PLACEMENT);
    expect(result.door).toEqual({ entry: 1, exit: 4 });
  });

  it('pintu keluar tidak boleh di slot yang sama atau sebelum pintu masuk', () => {
    for (const slot of [0, 1]) {
      const result = reducePlacement(
        holdingExit,
        { type: 'drop', slot },
        TOTAL,
      );
      expect(result.state).toEqual(holdingExit);
      expect(result.door).toBeNull();
    }
  });

  it('pintu masuk tidak boleh di slot terakhir', () => {
    const result = reducePlacement(
      holdingEntry,
      { type: 'drop', slot: 4 },
      TOTAL,
    );
    expect(result.state).toEqual(holdingEntry);
  });

  it('lepas di luar slot (null) atau saat idle: diabaikan', () => {
    expect(
      reducePlacement(holdingEntry, { type: 'drop', slot: null }, TOTAL).state,
    ).toEqual(holdingEntry);
    expect(
      reducePlacement(IDLE_PLACEMENT, { type: 'drop', slot: 2 }, TOTAL).state,
    ).toEqual(IDLE_PLACEMENT);
  });

  it('release: pintu masuk yang belum terpasang batal', () => {
    expect(
      reducePlacement(holdingEntry, { type: 'release' }, TOTAL).state,
    ).toEqual(IDLE_PLACEMENT);
  });

  it('release: pintu masuk yang sudah terpasang tetap menunggu keluar', () => {
    expect(
      reducePlacement(holdingExit, { type: 'release' }, TOTAL).state,
    ).toEqual(holdingExit);
  });

  it('cancel (Esc) selalu kembali ke idle', () => {
    for (const state of [IDLE_PLACEMENT, holdingEntry, holdingExit]) {
      const result = reducePlacement(state, { type: 'cancel' }, TOTAL);
      expect(result.state).toEqual(IDLE_PLACEMENT);
      expect(result.door).toBeNull();
    }
  });

  it('urutan lengkap: grab, lepas masuk, release, lepas keluar', () => {
    let state = reducePlacement(IDLE_PLACEMENT, { type: 'grab' }, TOTAL).state;
    state = reducePlacement(state, { type: 'drop', slot: 2 }, TOTAL).state;
    state = reducePlacement(state, { type: 'release' }, TOTAL).state;
    const done = reducePlacement(state, { type: 'drop', slot: 3 }, TOTAL);
    expect(done.door).toEqual({ entry: 2, exit: 3 });
  });
});
