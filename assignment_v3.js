/* ============================================================
   assignment_v3.js — 本実験：参加者ID発行 & 6セル割当（v3）
   設計（procedure_v1.md 第7節）
   ・6セル = 2（いいね数：low 27 / high 15,376）× 3（動機公示：A/B/C）
       cell 0 = low×A, 1 = low×B, 2 = low×C, 3 = high×A, 4 = high×B, 5 = high×C
   ・割当表（assignment_table.js：6セルを並べ替えたブロックの連続、シード固定）を使い、
     DataPipe のカウンタ番号は「表の何行目か」の指定にだけ使う。
     → DataPipe 側の条件数は TABLE_LEN（=360）に設定すること。
     → DataPipe の条件数を 6 にしか設定できない場合は USE_TABLE = false
       （番号 % 6 による単純な順繰り）にする。
   ・割当は同意・スクリーニング通過後に1回だけ（app_v3.js から呼ぶ）。
   ・割当結果はブラウザ内に保存し、再読み込み時は再利用（カウンタを消費しない）。
   ・DataPipe 不通時はブラウザ内で無作為割当し assignment_fallback = 1 を記録。
   ・テストモード：?test=1（&cell=0〜5 でセル指定）。本番カウンタも本番保存も使わない。
   ============================================================ */
(function (global) {
  'use strict';

  // ★本実験用の新しい DataPipe 実験ID（Google Drive 連携で新規作成したもの）に差し替える
  const EXPERIMENT_ID = '6LzF7icynyMz';
  const CONDITION_URL = 'https://pipe.jspsych.org/api/condition/';

  const TABLE = (global.ASSIGNMENT_TABLE && global.ASSIGNMENT_TABLE.cells) || [0, 1, 2, 3, 4, 5];
  const USE_TABLE = true;                       // DataPipe の条件数を 360 にできない場合は false
  const TABLE_LEN = TABLE.length;               // 360
  const N_CELLS = 6;

  const STORE_KEY = 'assign_main_' + EXPERIMENT_ID;
  const LIKES = { low: '27 likes', high: '15,376 likes' };
  const DISCLOSURE = ['A', 'B', 'C'];

  const params = new URLSearchParams(global.location.search);
  const TEST_MODE = params.get('test') === '1';
   
  // ★一時的：?multi=1 で同一端末からの複数回答を許可（開くたびに保存済みの割当を消し、新しいIDで始める）
  const MULTI_MODE = params.get('multi') === '1';
  if (MULTI_MODE) { try { global.localStorage.removeItem(STORE_KEY); } catch (e) { /* 継続 */ } }

  /* ---------- ブラウザ内保存（失敗しても動作は続ける） ---------- */
  function loadSaved() {
    try {
      const s = JSON.parse(global.localStorage.getItem(STORE_KEY));
      if (s && Number.isInteger(s.cell)) return s;
    } catch (e) { /* 保存領域が使えない環境 */ }
    return null;
  }
  function save(obj) {
    try { global.localStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch (e) { /* 継続 */ }
  }

  /* ---------- 参加者ID：保存済み → ?pid= → 新規発行 ---------- */
  function getParticipantId() {
    if (!TEST_MODE) {
      const saved = loadSaved();
      if (saved && saved.participantId) return saved.participantId;
    }
    const pid = params.get('pid');
    if (pid && /^[A-Za-z0-9_-]{3,64}$/.test(pid)) return pid;
    return (TEST_MODE ? 'test-' : (MULTI_MODE ? 'multi-' : 'm-')) + randomID(10);
  }
  function randomID(n) {
    const chars = '0123456789abcdefghjklmnopqrstuvwxyz';
    let s = '';
    for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  // 'new'：初回／'assigned'：割当済み・未完了／'completed'：回答完了済み
  function getStatus() {
    if (TEST_MODE) return 'new';
    const saved = loadSaved();
    if (!saved) return 'new';
    return saved.completed ? 'completed' : 'assigned';
  }

  /* ---------- セル番号 → 条件 ---------- */
  function decode(cell) {
    return {
      cell: cell,
      likesLevel: cell < 3 ? 'low' : 'high',
      likesText: cell < 3 ? LIKES.low : LIKES.high,
      disclosure: DISCLOSURE[cell % 3],
    };
  }

  /* ---------- 割当 ---------- */
  async function assignCondition(participantId) {
    // (1) 割当済みなら再利用（DataPipe に要求しない）
    const saved = TEST_MODE ? null : loadSaved();
    if (saved) {
      return Object.assign(decode(saved.cell), {
        counterIndex: saved.counterIndex, assignmentFallback: saved.assignmentFallback,
        tsAssigned: saved.tsAssigned, resumed: true,
      });
    }

    let counterIndex = null, cell = null, fallback = false;

    if (TEST_MODE) {
      // (2) テスト：本番カウンタを使わない
      const c = parseInt(params.get('cell'), 10);
      cell = (c >= 0 && c < N_CELLS) ? c : Math.floor(Math.random() * N_CELLS);
    } else {
      // (3) 本番：DataPipe にカウンタ番号を要求（リトライ3回）
      for (let attempt = 0; attempt < 3 && counterIndex === null; attempt++) {
        try {
          const res = await fetch(CONDITION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: '*/*' },
            body: JSON.stringify({ experimentID: EXPERIMENT_ID }),
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const json = await res.json();
          const raw = (json && json.condition !== undefined) ? json.condition : json;
          const n = (typeof raw === 'number') ? raw : parseInt(raw, 10);
          if (!isNaN(n) && n >= 0) counterIndex = n;
        } catch (e) {
          await sleep(1000 * Math.pow(2, attempt));
        }
      }
      if (counterIndex === null) {
        cell = Math.floor(Math.random() * N_CELLS);   // 不通時：ブラウザ内で無作為割当
        fallback = true;
      } else {
        cell = USE_TABLE ? TABLE[counterIndex % TABLE_LEN] : (counterIndex % N_CELLS);
      }
    }

    const tsAssigned = new Date().toISOString();
    if (!TEST_MODE) {
      save({ participantId: participantId, cell: cell, counterIndex: counterIndex,
             assignmentFallback: fallback, tsAssigned: tsAssigned, completed: false });
    }
    return Object.assign(decode(cell), {
      counterIndex: counterIndex, assignmentFallback: fallback, tsAssigned: tsAssigned, resumed: false,
    });
  }

  function markCompleted() {
    const saved = loadSaved();
    if (saved) { saved.completed = true; saved.tsCompleted = new Date().toISOString(); save(saved); }
  }

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  global.Assignment = {
    getParticipantId, getStatus, assignCondition, markCompleted, decode,
    EXPERIMENT_ID, TEST_MODE, USE_TABLE, TABLE_LEN, TABLE_SEED: (global.ASSIGNMENT_TABLE || {}).seed,
    EXPERIMENT_ID, TEST_MODE, MULTI_MODE, USE_TABLE, TABLE_LEN, TABLE_SEED: (global.ASSIGNMENT_TABLE || {}).seed,
  };
})(window);
