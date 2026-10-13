/* ============================================================
   stimuli_v3.js — 本実験の刺激（KIORI のみ・6セル）
   プレテスト版 stimuli.js からの変更点
   1. いいね数を条件ごとに切り替える（'27 likes' / '15,376 likes'、表記はプレテストと同じ英語）
   2. コメント欄の件数を削除（「コメント12件をすべて表示」→「コメントをすべて表示」）
   3. 本実験で使わない MIRAINE・TSUMUGI の定義を削除
   ※画像・キャプション・公示文・アイコン・ヘッダの「広告」表示はプレテストと同一
   API：Stimuli.renderStimulus(cond, likesText) → HTML文字列
        Stimuli.mountStimulus(container, cond, likesText, {onGate}) → 計測カルーセルcontroller
   ============================================================ */
(function (global) {
  'use strict';

  const IMG_BASE = '';   // 画像ディレクトリ（必要に応じ 'images/' 等に変更）
  const BRAND = 'KIORI';
  const COMMENTS_TEXT = 'コメントをすべて表示';

  const ICON = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
    '<g fill="none" stroke="#5D4037" stroke-width="1.2" stroke-linecap="round">' +
    '<circle cx="16" cy="16" r="11"/>' +
    '<circle cx="16" cy="16" r="7.5" stroke-width="0.9"/>' +
    '<circle cx="16" cy="16" r="4" stroke-width="0.9"/>' +
    '<circle cx="16" cy="16" r="1.3" fill="#5D4037" stroke="none"/></g></svg>';

  const S = {
    profileName: 'kiori_official',
    slides: ['KIORI1.png', 'KIORI2.png', 'KIORI3.jpg', null, 'KIORI5.png'], // スライド3は.jpg
    slide4: { a: 'KIORI4-a.png', b: 'KIORI4-b.png', c: 'KIORI4-c.png' },
    alt: ['KIORI Re:Furniture プロジェクト', '年間 約60万トン', 'Re:Furniture の流れ', '動機公示スライド', '森と次世代へ'],
    caption: {
      hook: '✦ Re:Furniture プロジェクト、はじまります。',
      intro: 'KIORIから大切なお知らせです。私たちは家具の大量廃棄問題に向き合うため、『Re:Furniture プロジェクト』をスタートします。ご不要になった家具を回収し、新たな商品の素材として生まれ変わらせます。',
      publicMain: '森と次世代のために、私たちにできることを。',
      disclosure: {
        a: '',
        b: 'この活動は、KIORIの事業にとっても意味あるものになると考えています。',
        c: 'この活動は、KIORIの新規市場開拓と長期的な顧客関係構築につながります。',
      },
      hashtags: '#ReFurnitureプロジェクト #KIORI #サステナブル家具 #循環型社会',
    },
  };

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderStimulus(cond, likesText) {
    cond = (cond || 'a').toLowerCase();
    if (!S.slide4[cond]) throw new Error('unknown cond: ' + cond);
    if (!likesText) throw new Error('likesText is required');

    const imgs = S.slides.slice();
    imgs[3] = S.slide4[cond];
    const slidesHtml = imgs.map(function (src, i) {
      return '<div class="carousel-slide"><img src="' + IMG_BASE + src + '" alt="' + escapeHtml(S.alt[i] || '') + '"></div>';
    }).join('\n');
    const dotsHtml = imgs.map(function (_, i) { return '<div class="dot' + (i === 0 ? ' active' : '') + '"></div>'; }).join('');

    const c = S.caption;
    const captionBody = c.hook + '\n\n' + c.intro + '\n\n' + c.publicMain + (c.disclosure[cond] || '') + '\n\n';

    return (
      '<div class="instagram-post" data-brand="' + BRAND + '" data-cond="' + cond + '">' +
        '<div class="post-header">' +
          '<div class="profile-icon">' + ICON + '</div>' +
          '<div class="profile-info"><div class="profile-name">' + S.profileName + '</div><div class="profile-meta">広告</div></div>' +
          '<div class="post-menu"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="5" cy="12" r="1.5" fill="#262626"/><circle cx="12" cy="12" r="1.5" fill="#262626"/><circle cx="19" cy="12" r="1.5" fill="#262626"/></svg></div>' +
        '</div>' +
        '<div class="carousel-container">' +
          '<div class="slide-counter">1/5</div>' +
          '<div class="carousel-wrapper"><div class="carousel-track">' + slidesHtml + '</div></div>' +
          '<button class="carousel-btn prev" aria-label="前へ"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></button>' +
          '<button class="carousel-btn next" aria-label="次へ"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg></button>' +
        '</div>' +
        '<div class="carousel-dots">' + dotsHtml + '</div>' +
        '<div class="action-bar">' +
          '<div class="action-icon like"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938z"/></svg></div>' +
          '<div class="action-icon comment"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"/></svg></div>' +
          '<div class="action-icon share"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><line x1="22" y1="3" x2="9.218" y2="10.083"/><polygon points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke-linejoin="round"/></svg></div>' +
          '<div class="action-icon bookmark"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="20 21 12 13.44 4 21 4 3 20 3 20 21" stroke-linejoin="round"/></svg></div>' +
        '</div>' +
        '<div class="post-content">' +
          '<div class="likes-count">' + escapeHtml(likesText) + '</div>' +
          '<div class="caption"><span class="username">' + S.profileName + '</span><span>' + escapeHtml(captionBody) + '</span><span class="hashtags">' + escapeHtml(c.hashtags) + '</span></div>' +
          '<div class="comments-link">' + COMMENTS_TEXT + '</div>' +
          '<div class="timestamp">3時間前</div>' +
        '</div>' +
        '<div class="comment-input-bar"><span class="emoji-icon">☺</span><span class="placeholder">コメントを追加...</span></div>' +
      '</div>'
    );
  }

  function mountStimulus(container, cond, likesText, options) {
    container.innerHTML = renderStimulus(cond, likesText);
    const post = container.querySelector('.instagram-post');
    const opts = Object.assign({ industry: BRAND, disclosure: (cond || 'a').toUpperCase() }, options || {});
    return global.InstrumentedCarousel.init(post, opts);
  }

  global.Stimuli = { data: S, BRAND: BRAND, renderStimulus: renderStimulus, mountStimulus: mountStimulus, escapeHtml: escapeHtml };
})(window);
