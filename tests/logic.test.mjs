import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { makeIntruder, makeChoice, shuffle, seededRng } = require('../logic.js');

const list = {
  id: 'demo',
  items: ['손실우연의 원칙', '예방가능의 원칙', '원인연계의 원칙', '대책선정의 원칙'],
  fakes: ['일회성의 원칙', '사후처리의 원칙'],
};

test('makeIntruder returns 4 distinct options with exactly one fake', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const { options, answer } = makeIntruder(list, seededRng(seed));
    assert.equal(options.length, 4);
    assert.equal(new Set(options).size, 4);
    const fakes = options.filter((o) => list.fakes.includes(o));
    assert.equal(fakes.length, 1);
    assert.equal(options[answer], fakes[0]);
    assert.equal(options.filter((o) => list.items.includes(o)).length, 3);
  }
});

test('makeIntruder works for a 3-item list', () => {
  const small = { items: ['지식교육', '기능교육', '태도교육'], fakes: ['체벌교육'] };
  const { options, answer } = makeIntruder(small, seededRng(7));
  assert.equal(options.length, 4);
  assert.equal(options[answer], '체벌교육');
});

test('makeIntruder varies combinations across seeds', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 30; seed++) seen.add(makeIntruder(list, seededRng(seed)).options.join('|'));
  assert.ok(seen.size > 5);
});

test('shuffle keeps every element', () => {
  const a = [1, 2, 3, 4, 5, 6];
  assert.deepEqual([...shuffle(a, seededRng(3))].sort(), a);
  assert.deepEqual(a, [1, 2, 3, 4, 5, 6]);
});

test('makeChoice puts correct + 3 wrong in 4 options and points answer at correct', () => {
  const q = { correct: 'A', wrong: ['B', 'C', 'D'] };
  const positions = new Set();
  for (let seed = 1; seed <= 40; seed++) {
    const { options, answer } = makeChoice(q, seededRng(seed));
    assert.equal(options.length, 4);
    assert.deepEqual([...options].sort(), ['A', 'B', 'C', 'D']);
    assert.equal(options[answer], 'A');
    positions.add(answer);
  }
  assert.equal(positions.size, 4);
});
