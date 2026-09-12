export type GameMode = 'classic' | 'demo';

export type GameState = {
  version: 1;
  mode: GameMode;
  classicSwipes: number;
  demoSwipes: number;
  bananas: number;
  totalSwipes: number;
  activeSeconds: number;
  haptics: boolean;
};

export const initialState: GameState = {
  version: 1,
  mode: 'classic',
  classicSwipes: 0,
  demoSwipes: 0,
  bananas: 0,
  totalSwipes: 0,
  activeSeconds: 0,
  haptics: true,
};

export function getTarget(state: GameState): number {
  return state.mode === 'classic' ? 1000 : 20;
}

export function getSwipes(state: GameState): number {
  return state.mode === 'classic' ? state.classicSwipes : state.demoSwipes;
}

export function isComplete(state: GameState): boolean {
  return getSwipes(state) >= getTarget(state);
}

function increment(value: number): number {
  return Math.min(Number.MAX_SAFE_INTEGER, value + 1);
}

export function peel(state: GameState): GameState {
  if (isComplete(state)) return state;

  const swipes = getSwipes(state) + 1;
  return {
    ...state,
    ...(state.mode === 'classic' ? { classicSwipes: swipes } : { demoSwipes: swipes }),
    totalSwipes: increment(state.totalSwipes),
    bananas: swipes === getTarget(state) ? increment(state.bananas) : state.bananas,
  };
}

export function nextBanana(state: GameState): GameState {
  if (!isComplete(state)) return state;
  return {
    ...state,
    ...(state.mode === 'classic' ? { classicSwipes: 0 } : { demoSwipes: 0 }),
  };
}

export function setMode(state: GameState, mode: GameMode): GameState {
  return state.mode === mode ? state : { ...state, mode };
}

function savedCount(value: unknown, maximum = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(maximum, Math.max(0, Math.floor(value)));
}

export function restoreState(json: string | null): GameState {
  if (!json) return { ...initialState };

  try {
    const saved: unknown = JSON.parse(json);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
      return { ...initialState };
    }

    const data = saved as Record<string, unknown>;
    if (data.version !== 1) return { ...initialState };

    return {
      version: 1,
      mode: data.mode === 'demo' ? 'demo' : 'classic',
      classicSwipes: savedCount(data.classicSwipes, 1000),
      demoSwipes: savedCount(data.demoSwipes, 20),
      bananas: savedCount(data.bananas),
      totalSwipes: savedCount(data.totalSwipes),
      activeSeconds: savedCount(data.activeSeconds),
      haptics: typeof data.haptics === 'boolean' ? data.haptics : initialState.haptics,
    };
  } catch {
    return { ...initialState };
  }
}

export function getMessage(state: GameState): string {
  const progress = getSwipes(state) / getTarget(state);
  if (progress >= 1) return 'Oh. Another banana.';
  if (progress >= 0.99) return 'This will change absolutely nothing.';
  if (progress >= 0.9) return 'Surely something happens next.';
  if (progress >= 0.75) return 'The banana believes in you.';
  if (progress >= 0.5) return 'Halfway to exactly where you started.';
  if (progress >= 0.25) return '25% peeled. 0% useful.';
  if (progress >= 0.1) return 'You could have eaten a real one by now.';
  if (progress > 0) return 'A productive start to an unproductive activity.';
  return 'Swipe down. Accomplish nothing.';
}

export function isPeelGesture(dx: number, dy: number): boolean {
  return Number.isFinite(dx) && Number.isFinite(dy) && dy >= 45 && dy > Math.abs(dx) * 1.25;
}
