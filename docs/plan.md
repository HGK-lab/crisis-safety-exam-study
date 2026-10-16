# 위기대응과 안전관리 시험 대비 사이트 구현 계획

**Goal:** 교안 2~6장(44쪽까지) 내용을 흐름 정리 / 목록 훈련 / 실전 문제 3탭 모바일 정적 사이트로 만들어 GitHub Pages에 배포한다.

**Architecture:** 빌드 없는 정적 파일. 데이터는 `data/*.js`가 `window.*` 전역에 넣고, `logic.js`의 순수 함수(문제 섞기·침입자 보기 만들기)를 `app.js`가 화면에 쓴다. `logic.js`는 Node에서도 불러 테스트한다.

**Tech Stack:** HTML/CSS/바닐라 JS, Node 24(테스트만), GitHub Pages.

**Spec:** 설계 문서 `2026-10-16-crisis-exam-study-design.md` (세션 스크래치패드).

## Global Constraints
- 정답은 교안 문구 기준. 녹음으로만 확인된 빈칸은 "수업 설명"으로 표시하고 빈칸형 문항으로 내지 않는다.
- 범위 밖(신도미노, 사고의 원인, 45쪽 이후, 소화기) 문항 금지.
- 교안 원본·쪽 이미지·녹음·받아쓰기 원문·교수 연락처를 저장소에 넣지 않는다.
- 실전 문제 30~40문항, 4·5장 비중 최대. 매슬로 빈칸 문항 1개 필수.
- localStorage는 try/catch로 감싼다.

## Tasks
1. `logic.js` + `tests/logic.test.mjs`: `makeIntruder(list, rng) -> {options: string[4], answer: number}`(진짜 3 + 가짜 1, 가짜는 `list.fakes`에서만), `shuffle(arr, rng)`. 테스트: 보기 4개·중복 없음·가짜 정확히 1개·가짜가 항목 목록에 없음.
2. `data/lists.js`, `data/notes.js`, `data/questions.js` + `tests/data.test.mjs`: 목록마다 가짜 후보가 진짜 항목과 겹치지 않음, 문항 보기 4개·정답 인덱스 유효·근거 표기, 빈칸형 문항은 `kind: 'confirmed'` 빈칸만 참조, 문항 수 30~40, 매슬로 빈칸 문항 존재.
3. `index.html`, `style.css`, `app.js`: 3탭, 필터, 기록, 홈 안내 카드. 브라우저로 390px 폭 확인.
4. README, 공개 저장소 생성, Pages 배포, 배포 URL에서 확인.
