import type { ThreadSnapshot } from '../engine/types';
import type { ThreadDef } from '../engine/types';

export interface ThreadStepProgress {
  completedSteps: number;
  totalSteps: number;
  fraction: number;
}

export function getThreadStepProgress(
  thread: Pick<ThreadSnapshot, 'pc' | 'iteration' | 'state'>,
  definition: Pick<ThreadDef, 'program' | 'repeat'>,
): ThreadStepProgress {
  const stepsPerRound = definition.program.length;
  const totalSteps = stepsPerRound * (definition.repeat ?? 1);
  const completedSteps =
    totalSteps === 0
      ? 0
      : thread.state === 'TERMINATED'
        ? totalSteps
        : Math.min(
            totalSteps,
            Math.max(0, thread.iteration * stepsPerRound + thread.pc),
          );

  return {
    completedSteps,
    totalSteps,
    fraction: totalSteps === 0 ? 0 : completedSteps / totalSteps,
  };
}
