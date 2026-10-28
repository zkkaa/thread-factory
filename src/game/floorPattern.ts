import { FLOOR_DEBRIS_EVERY, TINY_FRAMES } from './assetManifest';

/** Hash bilangan bulat sederhana: hasil sama untuk (col, row) yang sama. */
function hash(col: number, row: number): number {
  let h = Math.imul(col + 1, 0x85ebca6b) ^ Math.imul(row + 1, 0xc2b2ae35);
  h ^= h >>> 13;
  h = Math.imul(h, 0x27d4eb2f);
  h ^= h >>> 15;
  return h >>> 0;
}

/**
 * Frame lantai untuk ubin (col, row). Deterministik tanpa Math.random, jadi
 * arena selalu tampak sama pada setiap pemuatan.
 */
export function floorFrameAt(col: number, row: number): number {
  return hash(col, row) % FLOOR_DEBRIS_EVERY === 0
    ? TINY_FRAMES.floorDebris
    : TINY_FRAMES.floorBase;
}
