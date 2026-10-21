(function () {
  const { LISTS, NOTES, CHAPTERS, QUESTIONS, Logic } = window;
  const STORE_KEY = 'crisis-exam-v1';
  const STAR = { exam: '시험 출제 확인', prof: '교수 강조' };
  const TYPE = { judge: '옳은 것·아닌 것', pair: '짝 구분', source: '누구의 정의', blank: '교안 빈칸', case: '사례 적용', write: '서술형' };
  const NUM = ['①', '②', '③', '④'];

  // ── 기록 (localStorage는 막힐 수 있어 항상 try/catch) ──
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && typeof s === 'object') return { lists: s.lists || {}, qs: s.qs || {} };
    } catch (e) { /* 저장소 없음 */ }
    return { lists: {}, qs: {} };
  }
  let store = load();
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* 저장 불가 */ }
  }
  function record(bucket, id, ok) {
    const r = store[bucket][id] || { right: 0, wrong: 0 };
    if (ok) r.right++; else r.wrong++;
    r.last = ok ? 'right' : 'wrong';
    store[bucket][id] = r;
    save();
    renderProgress();
  }

  // ── DOM 도우미 ──
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : String(kid));
    }
    return el;
  }
  const badge = (star) => (star ? h('span', { class: 'badge ' + star }, STAR[star]) : null);
  const chName = (ch) => CHAPTERS.find((c) => c.ch === ch);

  function chip(label, pressed, onclick) {
    return h('button', { class: 'chip', type: 'button', 'aria-pressed': String(pressed), onclick }, label);
  }

  // ── 탭 1: 흐름 정리 ──
  const progressEls = [];
  function renderProgress() {
    const listDone = LISTS.filter((l) => (store.lists[l.id] || {}).right > 0).length;
    const qDone = QUESTIONS.filter((q) => (store.qs[q.id] || {}).last === 'right').length;
    for (const el of progressEls) {
      el.replaceChildren(
        h('span', null, '목록 훈련 ', h('b', null, `${listDone} / ${LISTS.length}`)),
        h('span', null, '실전 문제 ', h('b', null, `${qDone} / ${QUESTIONS.length}`)),
      );
    }
  }

  function renderBlank(b) {
    if (b.kind === 'confirmed') {
      const box = h('div', { class: 'blank confirmed' });
      const btn = h('button', { type: 'button', 'aria-expanded': 'false' },
        h('span', { class: 'label' }, b.label, ' '),
        h('span', { class: 'hidden-answer' }, '눌러서 답 보기'));
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        btn.lastChild.replaceWith(open
          ? h('span', { class: 'hidden-answer' }, '눌러서 답 보기')
          : h('span', { class: 'answer' }, b.answer));
      });
      box.append(btn, h('span', { class: 'why' }, '근거: ', b.src));
      return box;
    }
    if (b.kind === 'class') {
      return h('div', { class: 'blank class' },
        h('span', { class: 'tag' }, '수업 설명'),
        h('span', { class: 'label' }, b.label, ' '),
        h('span', { class: 'answer' }, b.answer),
        h('span', { class: 'why' }, '교안 문구가 아님. ', b.src));
    }
    return h('div', { class: 'blank unknown' },
      '교안 빈칸 — 답 미확인: ', b.label,
      h('span', { class: 'why' }, b.src));
  }

  function renderNote(n) {
    return h('article', { class: 'note', id: 'note-' + n.id },
      h('div', { class: 'note-head' }, h('h3', null, n.title), badge(n.star)),
      n.lines && h('ul', null, n.lines.map((t) => h('li', null, t))),
      n.pair && h('div', { class: 'pair' },
        [n.pair.left, n.pair.right].map((s) => h('div', { class: 'side' },
          h('h4', null, s.h), h('ul', null, s.lines.map((t) => h('li', null, t)))))),
      (n.blanks || []).map(renderBlank),
      n.tip && h('p', { class: 'tip' }, h('strong', null, '수업에서'), n.tip),
      h('p', { class: 'src' }, n.src),
      n.list && h('button', { type: 'button', class: 'link-btn', onclick: () => { location.hash = '#lists/' + n.list; } }, '이 목록 연습하기'),
    );
  }

  function renderNotes() {
    const view = document.getElementById('view-notes');
    const progress = h('div', { class: 'progress' });
    progressEls.push(progress);
    view.append(
      h('nav', { class: 'flow', 'aria-label': '장으로 이동' },
        CHAPTERS.map((c) => h('button', {
          type: 'button',
          'aria-label': `${c.ch}장 ${c.key}로 이동`,
          onclick: () => document.getElementById('ch-' + c.ch).scrollIntoView(),
        }, c.key))),
      h('p', { class: 'flow-cap' }, '안전이 무너지면 위험, 위험이 사고로, 사고가 커지면 재난. 화재는 인적재난의 대표.'),
      h('div', { class: 'rules' },
        h('ol', null,
          h('li', null, '대부분 "아닌 것을 고르시오" 4지선다'),
          h('li', null, '"쓰시오"로 나오면 키워드가 꼭 들어가야 정답 (예: 사고 예방 2가지 방법)'),
          h('li', null, '항목이 3~4개인 원리·개념·정의는 다 나온다'),
          h('li', null, '안 배운 범위에서 나온 문제는 3번에 체크하면 정답 처리')),
        progress),
      ...CHAPTERS.map((c) => h('section', { class: 'chapter', id: 'ch-' + c.ch },
        h('h2', null, `${c.ch}장 ${c.title}`),
        h('p', { class: 'pages' }, '교안 ' + c.pages),
        NOTES.filter((n) => n.ch === c.ch).map(renderNote))),
    );
  }

  // ── 탭 2: 목록 훈련 ──
  const listUI = { filter: 'all', open: {} };

  function listMatches(l) {
    const f = listUI.filter;
    if (f === 'all') return true;
    if (f === 'star') return !!l.star;
    if (f === 'missed') return (store.lists[l.id] || {}).wrong > 0;
    return l.ch === f;
  }

  function renderRecall(l, body) {
    const lis = l.items.map((item, i) => {
      const btn = h('button', { type: 'button', 'aria-expanded': 'false' },
        h('span', { class: 'num' }, l.ordered ? `${i + 1}.` : '•'), `${i + 1}번째 항목 — 눌러서 확인`);
      btn.addEventListener('click', () => {
        btn.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        btn.replaceChildren(h('span', { class: 'num' }, l.ordered ? `${i + 1}.` : '•'), item);
      });
      return h('li', null, btn);
    });
    body.replaceChildren(
      h('p', { class: 'prompt' }, `${l.items.length}개를 먼저 떠올린 뒤 하나씩 눌러 보세요.`),
      h('ul', { class: 'recall' }, lis),
      h('button', { type: 'button', class: 'again', onclick: () => lis.forEach((li) => li.firstChild.click()) }, '모두 보기'),
    );
  }

  function renderIntruder(l, body, card) {
    const { options, answer, ask } = Logic.makeIntruder(l);
    const verdict = h('p', { class: 'verdict', 'aria-live': 'polite' });
    const btns = options.map((o, i) => h('button', { type: 'button', class: 'opt' }, h('span', { class: 'n' }, NUM[i]), h('span', null, o)));
    btns.forEach((b, i) => b.addEventListener('click', () => {
      const ok = i === answer;
      btns.forEach((x) => { x.disabled = true; });
      btns[answer].classList.add('right');
      if (!ok) b.classList.add('wrong');
      verdict.className = 'verdict ' + (ok ? 'right' : 'wrong');
      verdict.textContent = ask === 'in'
        ? (ok ? '맞음 — 목록에 있는 항목을 골랐어요.' : `틀림 — 정답은 ${NUM[answer]}. 나머지 셋은 목록에 없는 보기예요.`)
        : (ok ? '맞음 — 목록에 없는 보기를 골랐어요.' : `틀림 — 정답은 ${NUM[answer]}. 나머지 셋은 목록에 있는 항목이에요.`);
      record('lists', l.id, ok);
      card.querySelector('.card-meta').replaceWith(cardMeta(l));
      body.append(h('button', { type: 'button', class: 'again', onclick: () => renderIntruder(l, body, card) }, '다른 조합으로'));
    }));
    body.replaceChildren(
      h('p', { class: 'prompt' }, `다음 중 「${l.title}」에 ${ask === 'in' ? '해당하는' : '해당하지 않는'} 것은?`),
      h('ul', { class: 'options' }, btns.map((b) => h('li', null, b))),
      verdict,
    );
  }

  function cardMeta(l) {
    const r = store.lists[l.id];
    return h('p', { class: 'card-meta' },
      `${l.items.length}개 · ${l.src}`,
      r ? ` · 맞힘 ${r.right} / 틀림 ${r.wrong}` : '');
  }

  function renderListCard(l) {
    const body = h('div');
    const card = h('article', { class: 'card', id: 'list-' + l.id });
    const modeBtns = [];
    const setMode = (mode) => {
      listUI.open[l.id] = mode;
      modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
      if (mode === 'recall') renderRecall(l, body);
      else renderIntruder(l, body, card);
    };
    const pickLabel = l.items.length < 3 ? '해당하는 것 고르기' : '아닌 것 고르기';
    for (const [mode, label] of [['recall', '떠올리기'], ['intruder', pickLabel]]) {
      const b = h('button', { type: 'button', class: 'mode', 'aria-pressed': 'false', 'data-mode': mode, onclick: () => setMode(mode) }, label);
      modeBtns.push(b);
    }
    card.append(
      h('div', { class: 'note-head' }, h('h3', null, `${l.ch}장 ${l.title}`), badge(l.star)),
      cardMeta(l),
      h('div', { class: 'modes' }, modeBtns),
      body,
    );
    if (listUI.open[l.id]) setMode(listUI.open[l.id]);
    return card;
  }

  function renderLists() {
    const view = document.getElementById('view-lists');
    const shown = LISTS.filter(listMatches);
    const filters = [['all', '전체'], ...CHAPTERS.map((c) => [c.ch, `${c.ch}장`]), ['star', '출제·강조'], ['missed', '틀린 적 있음']];
    view.replaceChildren(
      h('h2', { class: 'view-title' }, '목록 훈련'),
      h('p', { class: 'view-sub' }, `시험 범위의 번호 목록 ${LISTS.length}개. 떠올리기로 외우고, 아닌 것 고르기로 시험 형식 그대로 연습.`),
      h('div', { class: 'filters' }, filters.map(([v, label]) => chip(label, listUI.filter === v, () => { listUI.filter = v; renderLists(); }))),
      ...(shown.length ? shown.map(renderListCard) : [h('p', { class: 'empty' }, listUI.filter === 'missed' ? '아직 틀린 목록이 없어요. 아닌 것 고르기를 먼저 풀어 보세요.' : '해당하는 목록이 없어요.')]),
    );
  }

  function focusList(id) {
    listUI.filter = 'all';
    if (!listUI.open[id]) listUI.open[id] = 'recall';
    renderLists();
    const card = document.getElementById('list-' + id);
    if (!card) return;
    card.scrollIntoView({ block: 'start' });
    card.classList.add('flash');
    setTimeout(() => card.classList.remove('flash'), 1600);
  }

  // ── 탭 3: 실전 문제 ──
  const quiz = { filter: 'all', order: [], idx: 0, score: 0, answered: 0, armReset: false };

  function quizPool() {
    return QUESTIONS.filter((q) => {
      if (quiz.filter === 'all') return true;
      if (quiz.filter === 'missed') return (store.qs[q.id] || {}).last === 'wrong';
      return q.ch === quiz.filter;
    });
  }
  function startQuiz(shuffled) {
    const pool = quizPool();
    quiz.order = (shuffled ? Logic.shuffle(pool) : pool).map((q) => q.id);
    quiz.idx = 0; quiz.score = 0; quiz.answered = 0;
    renderQuiz();
  }

  function nextBtn() {
    const last = quiz.idx === quiz.order.length - 1;
    return h('button', { type: 'button', class: 'next', onclick: () => { quiz.idx++; renderQuiz(); window.scrollTo(0, 0); } }, last ? '결과 보기' : '다음 문제');
  }

  function qHead(q) {
    return h('div', { class: 'qmeta' },
      h('span', { class: 'count' }, `${quiz.idx + 1} / ${quiz.order.length}`),
      h('span', null, `${q.ch}장 · ${TYPE[q.type]}`),
      badge(q.star));
  }

  // 서술형: 써 본 답에 키워드 묶음이 다 들어 있는지 본다.
  function renderWrite(q) {
    const after = h('div', { 'aria-live': 'polite' });
    const box = h('textarea', { class: 'answer-box', rows: '4', 'aria-label': '답 쓰기', placeholder: '답을 써 보세요' });
    const grade = h('button', { type: 'button', class: 'next' }, '채점');
    grade.addEventListener('click', () => {
      const { hits, ok } = Logic.gradeKeywords(box.value, q.keywords);
      box.readOnly = true;
      grade.remove();
      quiz.answered++; if (ok) quiz.score++;
      record('qs', q.id, ok);
      after.replaceChildren(
        h('p', { class: 'verdict ' + (ok ? 'right' : 'wrong') }, ok ? '맞음 — 키워드가 다 들어갔어요' : '틀림 — 빠진 키워드가 있어요'),
        h('ul', { class: 'kw' }, q.keywords.map((k, i) => h('li', { class: hits[i] ? 'right' : 'wrong' }, hits[i] ? '✓ ' : '✗ ', k.label))),
        h('div', { class: 'explain' }, h('p', { class: 'model' }, h('strong', null, '모범 답안 '), q.model), q.explain, h('p', { class: 'src' }, '근거: ', q.src)),
        nextBtn(),
      );
    });
    return h('article', { class: 'qcard' }, qHead(q), h('p', { class: 'qtext' }, q.q), box, grade, after);
  }

  function renderQuestion(q) {
    if (q.type === 'write') return renderWrite(q);
    const { options, answer } = Logic.makeChoice(q);
    const after = h('div', { 'aria-live': 'polite' });
    const btns = options.map((o, i) => h('button', { type: 'button', class: 'opt' }, h('span', { class: 'n' }, NUM[i]), h('span', null, o)));
    btns.forEach((b, i) => b.addEventListener('click', () => {
      const ok = i === answer;
      btns.forEach((x) => { x.disabled = true; });
      btns[answer].classList.add('right');
      if (!ok) b.classList.add('wrong');
      quiz.answered++; if (ok) quiz.score++;
      record('qs', q.id, ok);
      after.replaceChildren(
        h('p', { class: 'verdict ' + (ok ? 'right' : 'wrong') }, ok ? '맞음' : `틀림 — 정답은 ${NUM[answer]}`),
        h('div', { class: 'explain' }, q.explain, h('p', { class: 'src' }, '근거: ', q.src)),
        nextBtn(),
      );
    }));
    return h('article', { class: 'qcard' },
      qHead(q),
      h('p', { class: 'qtext' }, q.q),
      h('ul', { class: 'options' }, btns.map((b) => h('li', null, b))),
      after,
    );
  }

  function renderQuiz() {
    const view = document.getElementById('view-quiz');
    const filters = [['all', '전체'], ...CHAPTERS.map((c) => [c.ch, `${c.ch}장`]), ['missed', '틀린 것']];
    const resetBtn = h('button', { type: 'button', class: 'tool danger' }, quiz.armReset ? '한 번 더 누르면 초기화' : '문제 기록 초기화');
    resetBtn.addEventListener('click', () => {
      if (!quiz.armReset) { quiz.armReset = true; renderQuiz(); return; }
      quiz.armReset = false;
      store.qs = {};
      save();
      renderProgress();
      startQuiz(false);
    });
    const q = QUESTIONS.find((x) => x.id === quiz.order[quiz.idx]);
    let main;
    if (!quiz.order.length) {
      main = h('p', { class: 'empty' }, quiz.filter === 'missed' ? '최근에 틀린 문제가 없어요. 전체 문제를 먼저 풀어 보세요.' : '해당하는 문제가 없어요.');
    } else if (!q) {
      main = h('article', { class: 'qcard' },
        h('p', { class: 'summary' }, `${quiz.answered}문제 중 ${quiz.score}개 맞힘`),
        h('button', { type: 'button', class: 'next', onclick: () => startQuiz(true) }, '섞어서 다시 풀기'));
    } else {
      main = renderQuestion(q);
    }
    view.replaceChildren(
      h('h2', { class: 'view-title' }, '실전 문제'),
      h('p', { class: 'view-sub' }, `직접 쓴 ${QUESTIONS.length}문항. 짝 구분, 누구의 정의, 사례 적용, 교안 빈칸, 서술형.`),
      h('div', { class: 'filters' }, filters.map(([v, label]) => chip(label, quiz.filter === v, () => { quiz.filter = v; quiz.armReset = false; startQuiz(false); }))),
      h('div', { class: 'toolbar' },
        h('button', { type: 'button', class: 'tool', onclick: () => startQuiz(true) }, '섞기'),
        resetBtn),
      main,
    );
  }

  // ── 탭 전환 ──
  function route() {
    const [tab, arg] = (location.hash.slice(1) || 'notes').split('/');
    const name = ['notes', 'lists', 'quiz'].includes(tab) ? tab : 'notes';
    for (const t of ['notes', 'lists', 'quiz']) {
      document.getElementById('view-' + t).hidden = t !== name;
      document.getElementById('tab-' + t).setAttribute('aria-selected', String(t === name));
    }
    if (name === 'lists' && arg) focusList(arg);
    else window.scrollTo(0, 0);
  }

  renderNotes();
  renderLists();
  startQuiz(false);
  renderProgress();
  window.addEventListener('hashchange', route);
  route();
})();
