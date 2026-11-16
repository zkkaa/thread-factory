import { useSyncExternalStore } from 'react';
import type {
  ScoreboardData,
  ScoreboardStore,
} from '../../progress/scoreboardStore';

export function useScoreboard(store: ScoreboardStore): Readonly<ScoreboardData> {
  return useSyncExternalStore(store.subscribe, store.getState);
}