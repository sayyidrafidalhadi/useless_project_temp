import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMessage,
  getSwipes,
  getTarget,
  initialState,
  isComplete,
  isPeelGesture,
  nextBanana,
  peel,
  restoreState,
  setMode,
} from '../src/game.ts';

function swipeTimes(state, count) {
  for (let index = 0; index < count; index += 1) state = peel(state);
  return state;
}

test('classic rewards exactly the thousandth swipe and ignores extra swipes', () => {
  const almost = swipeTimes(initialState, 999);
  assert.equal(getTarget(almost), 1000);
  assert.equal(isComplete(almost), false);
  assert.equal(almost.bananas, 0);

  const completed = peel(almost);
  assert.equal(isComplete(completed), true);
  assert.equal(completed.classicSwipes, 1000);
  assert.equal(completed.totalSwipes, 1000);
  assert.equal(completed.bananas, 1);
  assert.equal(swipeTimes(completed, 100), completed);
  assert.equal(initialState.classicSwipes, 0, 'updates do not mutate the initial state');
});

test('demo completes in twenty swipes and can begin another banana', () => {
  const demo = setMode(initialState, 'demo');
  const almost = swipeTimes(demo, 19);
  assert.equal(getTarget(demo), 20);
  assert.equal(almost.bananas, 0);
  assert.equal(nextBanana(almost), almost, 'an unfinished banana cannot be reset');

  const completed = peel(almost);
  assert.equal(isComplete(completed), true);
  const restarted = nextBanana(completed);
  assert.equal(getSwipes(restarted), 0);
  assert.equal(restarted.bananas, 1);
  assert.equal(restarted.totalSwipes, 20);

  const second = swipeTimes(restarted, 20);
  assert.equal(second.bananas, 2);
  assert.equal(second.totalSwipes, 40);
});

test('switching modes preserves independent unfinished and completed progress', () => {
  const classic = swipeTimes(initialState, 371);
  const demoComplete = swipeTimes(setMode(classic, 'demo'), 20);
  const backToClassic = setMode(demoComplete, 'classic');
  assert.equal(getSwipes(backToClassic), 371);
  assert.equal(isComplete(backToClassic), false);
  assert.equal(backToClassic.demoSwipes, 20);
  assert.equal(backToClassic.bananas, 1);
  assert.equal(backToClassic.totalSwipes, 391);

  const backToDemo = setMode(backToClassic, 'demo');
  assert.equal(peel(backToDemo), backToDemo, 'switching away does not permit a duplicate reward');
  const nextDemo = nextBanana(backToDemo);
  assert.equal(nextDemo.classicSwipes, 371);
  assert.equal(nextDemo.demoSwipes, 0);
});

test('saved progress round-trips and a restored completion cannot reward twice', () => {
  const completed = {
    ...swipeTimes(setMode(initialState, 'demo'), 20),
    activeSeconds: 36,
    haptics: false,
  };
  const restored = restoreState(JSON.stringify(completed));
  assert.deepEqual(restored, completed);
  assert.equal(peel(restored), restored);
  assert.equal(peel(nextBanana(restored)).bananas, 1);
});

test('invalid JSON, payload shapes, and unsupported versions restore defaults', () => {
  for (const json of [null, '', '{broken', 'null', '[]', 'true', '42', '"banana"', '{}', '{"version":2}']) {
    const restored = restoreState(json);
    assert.deepEqual(restored, initialState, String(json));
    assert.notEqual(restored, initialState, 'fallback returns an independent object');
  }
});

test('saved values clamp finite integers and reject coerced counts and booleans', () => {
  const restored = restoreState(JSON.stringify({
    version: 1,
    mode: 'secret',
    classicSwipes: 1200.8,
    demoSwipes: -12,
    bananas: '17',
    totalSwipes: Number.MAX_VALUE,
    activeSeconds: 42.9,
    haptics: 'false',
  }));
  assert.deepEqual(restored, {
    ...initialState,
    classicSwipes: 1000,
    totalSwipes: Number.MAX_SAFE_INTEGER,
    activeSeconds: 42,
  });

  const nonfinite = restoreState('{"version":1,"classicSwipes":1e999,"demoSwipes":35,"activeSeconds":null,"haptics":false}');
  assert.equal(nonfinite.classicSwipes, 0);
  assert.equal(nonfinite.demoSwipes, 20);
  assert.equal(nonfinite.activeSeconds, 0);
  assert.equal(nonfinite.haptics, false);
});

test('lifetime counters remain safe integers when increasing saturated saved counts', () => {
  const saturated = {
    ...setMode(initialState, 'demo'),
    demoSwipes: 19,
    totalSwipes: Number.MAX_SAFE_INTEGER,
    bananas: Number.MAX_SAFE_INTEGER,
  };
  const completed = peel(saturated);
  assert.equal(completed.totalSwipes, Number.MAX_SAFE_INTEGER);
  assert.equal(completed.bananas, Number.MAX_SAFE_INTEGER);
  assert.equal(completed.demoSwipes, 20);
});

test('gesture detection requires a long enough, predominantly downward gesture', () => {
  assert.equal(isPeelGesture(0, 45), true);
  assert.equal(isPeelGesture(-20, 60), true);
  assert.equal(isPeelGesture(20, 60), true);
  assert.equal(isPeelGesture(0, 44.9), false);
  assert.equal(isPeelGesture(0, -100), false);
  assert.equal(isPeelGesture(100, 0), false);
  assert.equal(isPeelGesture(50, 50), false);
  assert.equal(isPeelGesture(40, 50), false, 'exact diagonal boundary is excluded');
  assert.equal(isPeelGesture(40, 50.1), true);
  assert.equal(isPeelGesture(NaN, 100), false);
  assert.equal(isPeelGesture(0, Infinity), false);
});

test('milestones use the current mode percentage and completion has its own message', () => {
  assert.equal(getMessage(initialState), 'Swipe down. Accomplish nothing.');
  assert.equal(getMessage({ ...initialState, classicSwipes: 500 }), getMessage({ ...initialState, mode: 'demo', demoSwipes: 10 }));
  assert.equal(getMessage({ ...initialState, mode: 'demo', demoSwipes: 20 }), 'Oh. Another banana.');
});
