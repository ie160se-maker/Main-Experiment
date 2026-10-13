/* ============================================================
   datasink_v3.js — 本実験：DataPipe への保存（v3）
   ・最終：CSV（ヘッダ＋1行、ファイル名 <pid>.csv）。列は固定順で全参加者共通。
   ・途中：進行記録（<pid>_ckpt<N>.json）。★回答内容は含めず、割当と到達段階だけを記録する。
       理由：途中離脱者の回答は使わない（同意文）。離脱率の集計（セル別・段階別）には
       割当と到達段階だけで足りる。事後説明後に使用を断った人の回答も残さないため。
       ckpt0 = 割当直後／ckpt1 = 刺激の閲覧完了／ckpt2 = 主要測定（企業評価まで）完了／
       ckpt3 = 全質問完了（事後説明画面に到達）
   ・事後説明後に「使用に同意しない」を選んだ場合は、回答を含まない最小限の行
     （割当情報と post_debrief_consent = 0）だけを保存する。
   ・テストモード（?test=1）では DataPipe に送らず、window.__TEST_OUTPUT に保存する。
   ============================================================ */
(function (global) {
  'use strict';

  const DATA_URL = 'https://pipe.jspsych.org/api/data/';
  function expId() { return global.Assignment.EXPERIMENT_ID; }
  function isTest() { return !!global.Assignment.TEST_MODE; }

  async function postToDataPipe(filename, dataString) {
    if (isTest()) {
      global.__TEST_OUTPUT = global.__TEST_OUTPUT || {};
      global.__TEST_OUTPUT[filename] = dataString;
      return true;
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(DATA_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: '*/*' },
          body: JSON.stringify({ experimentID: expId(), filename: filename, data: dataString }),
        });
        if (res.ok) return true;
        if (res.status >= 400 && res.status < 500) return false;
      } catch (e) { /* ネットワーク断 → リトライ */ }
      await sleep(1000 * Math.pow(2, attempt));
    }
    return false;
  }

  /* ---------- 進行記録（回答は含めない） ---------- */
  const META_KEYS = ['participant_id', 'cell', 'likes_level', 'disclosure', 'counter_index', 'assignment_fallback',
    'resumed_session', 'test_mode', 'ts_start', 'ts_assigned', 'user_agent', 'is_mobile'];
  async function saveCheckpoint(state, stage) {
    const rec = { stage: stage, ts: new Date().toISOString() };
    META_KEYS.forEach(function (k) { rec[k] = def(state[k]); });
    return postToDataPipe(state.participant_id + '_ckpt' + stage + '.json', JSON.stringify(rec));
  }

  /* ---------- 最終保存 ---------- */
  async function submitFinal(state) {
    return postToDataPipe(state.participant_id + '.csv', stateToCSV(state));
  }

  /* ---------- 列定義（固定順） ---------- */
  function seq(prefix, n) { const a = []; for (let i = 1; i <= n; i++) a.push(prefix + i); return a; }
  const COLUMNS = [].concat(
    // メタ・割当
    ['participant_id', 'cell', 'likes_level', 'disclosure', 'counter_index', 'table_seed', 'use_table',
     'assignment_fallback', 'resumed_session', 'test_mode', 'post_debrief_consent',
     'ts_start', 'ts_assigned', 'ts_end', 'duration_total_sec', 'user_agent', 'screen_w', 'screen_h', 'is_mobile'],
    // スクリーニング
    ['age', 'insta_freq'],
    // 刺激の閲覧記録
    ['dwell_total', 'dwell_s1', 'dwell_s2', 'dwell_s3', 'dwell_s4', 'dwell_s5', 'slide4_first_arrival', 'n_nav', 'forced_pass'],
    // 評価前の帰属（自由記述）
    ['attr_text', 'attr_chars', 'attr_sec'],
    // 媒介変数・従属変数
    seq('cred_', 3), seq('firm_', 7), seq('dec_', 6),
    // 動機帰属・操作チェック
    seq('motive_', 8), ['motive_order'], seq('1A_', 3), ['likes_perc', 'ad_recog'],
    // 適合度・注意チェック・既知
    seq('fit_', 4), ['attn_instructed', 'attn_instructed_correct', 'attn_recog_choice', 'attn_recog_correct', 'bf1'],
    // 共変量
    seq('skep_', 9), seq('ncs_', 6),
    // デモグラ
    ['gender', 'occupation', 'feedback_text'],
    // 画面ごとの所要時間（秒）
    ['sec_stimulus', 'sec_cred', 'sec_firm', 'sec_dec', 'sec_motive', 'sec_checks', 'sec_fit_attn', 'sec_skep_ncs', 'sec_demo', 'sec_debrief'],
    // 品質フラグ（クライアント算出。所要時間の基準は解析側で判定）
    ['flag_attn_fail', 'n_straightline_scales', 'flag_straightline', 'flag_straightline_one', 'flag_brand_known']
  );

  function stateToCSV(state) {
    const r = state.consentRefused ? minimalRow(state) : fullRow(state);
    const line = COLUMNS.map(function (k) { return csvEscape(r[k]); }).join(',');
    return COLUMNS.join(',') + '\n' + line + '\n';
  }

  function minimalRow(s) {
    const r = {};
    ['participant_id', 'cell', 'likes_level', 'disclosure', 'counter_index', 'table_seed', 'use_table',
     'assignment_fallback', 'resumed_session', 'test_mode', 'ts_start', 'ts_assigned', 'ts_end']
      .forEach(function (k) { r[k] = def(s[k]); });
    r.post_debrief_consent = 0;
    return r;
  }

  function fullRow(s) {
    const r = {};
    COLUMNS.forEach(function (k) { r[k] = ''; });
    // メタ・スクリーニング・フラグ・デモグラ・帰属などは state のトップレベルにそのまま入っている
    COLUMNS.forEach(function (k) { if (s[k] !== undefined && s[k] !== null && typeof s[k] !== 'object') r[k] = s[k]; });
    // 回答（answers：{id: value}）
    const a = s.answers || {};
    Object.keys(a).forEach(function (k) { if (k in r) r[k] = a[k]; });
    // 刺激の閲覧記録
    const t = s.timing || {};
    r.dwell_total = def(t.dwellTotal);
    for (let i = 1; i <= 5; i++) r['dwell_s' + i] = (t.dwell && t.dwell[i - 1] !== undefined) ? t.dwell[i - 1] : '';
    r.slide4_first_arrival = def(t.slide4FirstArrival);
    r.n_nav = def(t.nNav);
    r.forced_pass = t.forcedPass === undefined ? '' : (t.forcedPass ? 1 : 0);
    // 画面ごとの所要時間
    const p = s.pageSec || {};
    Object.keys(p).forEach(function (k) { if (('sec_' + k) in r) r['sec_' + k] = p[k]; });
    return r;
  }

  function def(v) { return (v === null || v === undefined) ? '' : v; }
  function csvEscape(v) {
    if (v === null || v === undefined) return '';
    const str = String(v);
    return /[",\n\r]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
  }
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  global.DataSink = { saveCheckpoint, submitFinal, stateToCSV, COLUMNS };
})(window);
