(function (root) {
  // mulberry32: 연속된 작은 seed에서도 첫 값이 고르게 퍼진다 (단순 LCG는 첫 값이 거의 같았다).
  function seededRng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rng) {
    const rand = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 진짜 3개 + 목록 고유의 가짜 후보 1개. 시험이 "아닌 것 고르기"라서 이 형식을 그대로 쓴다.
  // 항목이 2개뿐인 목록은 4지선다를 만들 수 없어 진짜 1개 + 가짜 3개에서 "해당하는 것"을 고르게 한다.
  function makeIntruder(list, rng) {
    const rand = rng || Math.random;
    if (list.items.length < 3) {
      const real = list.items[Math.floor(rand() * list.items.length)];
      const options = shuffle(shuffle(list.fakes, rand).slice(0, 3).concat([real]), rand);
      return { options, answer: options.indexOf(real), ask: 'in' };
    }
    const reals = shuffle(list.items, rand).slice(0, 3);
    const fake = list.fakes[Math.floor(rand() * list.fakes.length)];
    const options = shuffle(reals.concat([fake]), rand);
    return { options, answer: options.indexOf(fake), ask: 'out' };
  }

  function makeChoice(q, rng) {
    const options = shuffle([q.correct].concat(q.wrong), rng || Math.random);
    return { options, answer: options.indexOf(q.correct) };
  }

  const api = { seededRng, shuffle, makeIntruder, makeChoice };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Logic = api;
})(this);
