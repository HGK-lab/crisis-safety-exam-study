import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const window = {};
for (const f of ['data/lists.js', 'data/notes.js', 'data/questions.js']) {
  vm.runInNewContext(readFileSync(new URL(f, root), 'utf8'), { window });
}
const { LISTS, NOTES, CHAPTERS, QUESTIONS } = window;
const CHS = [2, 3, 4, 5, 6];
const KINDS = ['confirmed', 'class', 'unknown'];

test('lists: unique ids, >=2 items, fakes never overlap items', () => {
  assert.equal(new Set(LISTS.map((l) => l.id)).size, LISTS.length);
  for (const l of LISTS) {
    assert.ok(CHS.includes(l.ch), l.id);
    assert.ok(l.items.length >= 2, l.id);
    assert.ok(l.fakes.length >= 1, l.id);
    assert.ok(l.src, l.id);
    for (const f of l.fakes) assert.ok(!l.items.includes(f), `${l.id}: ${f}`);
    assert.equal(new Set(l.items).size, l.items.length, l.id);
  }
});

test('notes: chapters, list links and blank kinds are valid', () => {
  assert.deepEqual(Array.from(CHAPTERS, (c) => c.ch), CHS);
  assert.equal(new Set(NOTES.map((n) => n.id)).size, NOTES.length);
  const listIds = new Set(LISTS.map((l) => l.id));
  for (const n of NOTES) {
    assert.ok(CHS.includes(n.ch), n.id);
    assert.ok(n.src, n.id);
    assert.ok((n.lines && n.lines.length) || n.pair, n.id);
    if (n.list) assert.ok(listIds.has(n.list), `${n.id} -> ${n.list}`);
    for (const b of n.blanks || []) {
      assert.ok(KINDS.includes(b.kind), n.id);
      if (b.kind === 'unknown') assert.equal(b.answer, null, n.id);
      else assert.ok(b.answer, n.id);
    }
  }
  for (const ch of CHS) assert.ok(NOTES.some((n) => n.ch === ch), `ch ${ch}`);
});

test('questions: 30~40, 3 distinct wrong answers, source on each', () => {
  assert.ok(QUESTIONS.length >= 30 && QUESTIONS.length <= 40, String(QUESTIONS.length));
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
  for (const q of QUESTIONS) {
    assert.ok(CHS.includes(q.ch), q.id);
    assert.equal(q.wrong.length, 3, q.id);
    assert.equal(new Set([q.correct, ...q.wrong]).size, 4, q.id);
    assert.ok(q.q && q.explain && q.src, q.id);
    assert.ok(['judge', 'pair', 'source', 'blank', 'case'].includes(q.type), q.id);
  }
});

test('questions: chapters 4 and 5 carry the most weight', () => {
  const count = (ch) => QUESTIONS.filter((q) => q.ch === ch).length;
  for (const ch of [2, 3, 6]) {
    assert.ok(count(4) > count(ch) && count(5) > count(ch), `ch ${ch}`);
  }
});

test('blank questions only use confirmed blanks, and maslow blank is asked', () => {
  const byId = Object.fromEntries(NOTES.map((n) => [n.id, n]));
  const blanks = QUESTIONS.filter((q) => q.type === 'blank');
  for (const q of blanks) {
    const b = byId[q.blankOf.note]?.blanks?.[q.blankOf.i];
    assert.ok(b, q.id);
    assert.equal(b.kind, 'confirmed', q.id);
  }
  assert.ok(blanks.some((q) => q.blankOf.note === 'maslow'));
});

test('nothing out of scope is asked', () => {
  const banned = ['신도미노', '버드', '소화기', '옥내소화전', '축압식', '가압식', '소화약제'];
  for (const q of QUESTIONS) {
    const text = [q.q, q.correct, ...q.wrong].join(' ');
    for (const w of banned) assert.ok(!text.includes(w), `${q.id}: ${w}`);
  }
});
