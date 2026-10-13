/* ============================================================
   questions_v3.js — 本実験 測定バッテリーの単一情報源
   ・プレテストから引き継ぐ項目（動機帰属・1A・適合度・注意チェック・スクリーニング・
     デモグラ）の文言は変更しない。
   ・本実験で追加する尺度の日本語は研究者訳（★要確認：translations_v1.md）。
   ・逆転項目は reverse:true として記録のみ（採点は解析側で逆転）。回答は RAW 値で保存。
   ・{CAUSE}=社会問題, {BRAND}=ブランド名 を提示時に置換。
   ・すべて7件法（Rifon・SKEP の原典5件法から変更、方法の章に明記）。
   ============================================================ */
(function (global) {
  'use strict';

  const CAUSE = { KIORI: '家具の廃棄問題' };
  const BRAND = { KIORI: 'KIORI' };
  const LIK = { min: '全くそう思わない', max: '非常にそう思う' };
  const insta_MIN_FREQ = 3;   // 3 = 月2〜3回以上
  const FREQ5 = ['全く使わない', '月1回以下', '月2〜3回', '週数回', '毎日'];

  const Battery = {
    CAUSE: CAUSE, BRAND: BRAND, LIK: LIK, FREQ5: FREQ5, insta_MIN_FREQ: insta_MIN_FREQ,

    /* ---- 3 評価前の帰属（自由記述。Forehand & Grier 2003, p.352 の
           "Why do you think the company started this program?" に倣う） ---- */
    attribution: {
      id: 'attr_text',
      minSeconds: 30,
      text: '{BRAND}は、なぜこの活動（Re:Furniture プロジェクト）を始めたのだと思いますか。思いつく理由を、ご自身の言葉で自由にお書きください。',
      note: '※30秒たつと「次へ」が押せるようになります。氏名など、個人を特定できる情報は書かないでください。',
    },

    /* ---- 4 広告信頼性（MacKenzie & Lutz 1989, p.58：convincing / believable / biased）
           意味微分7件法。左＝否定側、右＝肯定側（7 が信頼性高） ---- */
    adCred: {
      type: 'semdiff7',
      prompt: 'この広告（投稿）は、あなたにとってどのようなものでしたか。各対について、あてはまる位置を選んでください。',
      items: [
        { id: 'cred_1', left: '説得力がない', right: '説得力がある' },          // unconvincing–convincing
        { id: 'cred_2', left: '信じられない', right: '信じられる' },            // unbelievable–believable
        { id: 'cred_3', left: '偏っている', right: '偏っていない' },            // biased–unbiased
      ],
    },

    /* ---- 5 企業評価（Forehand & Grier 2003, p.352。第6項目は Community → 環境問題）
           意味微分7件法。左＝否定側 ---- */
    firmEval: {
      type: 'semdiff7',
      prompt: '{BRAND}という企業について、あなたの印象に最も近い位置を選んでください。',
      items: [
        { id: 'firm_1', left: '悪い', right: '良い' },                                         // Bad–Good
        { id: 'firm_2', left: '役に立たない', right: '役に立つ' },                             // Unhelpful–Helpful
        { id: 'firm_3', left: '好感が持てない', right: '好感が持てる' },                       // Unlikable–Likable
        { id: 'firm_4', left: '誠実でない', right: '誠実である' },                             // Insincere–Sincere
        { id: 'firm_5', left: '信頼できない', right: '信頼できる' },                           // Untrustworthy–Trustworthy
        { id: 'firm_6', left: '環境問題に全く取り組んでいない', right: '環境問題に非常に積極的に取り組んでいる' }, // Community → 環境問題
        { id: 'firm_7', left: '顧客を大切にしていない', right: '顧客をとても大切にしている' },  // Doesn't care–Cares very much about customers
      ],
    },

    /* ---- 6 欺瞞知覚（Campbell 1995, Appendix p.253–254：Inferences of Manipulative Intent）
           リッカート7件法。1・4・5・6 が逆転（高得点＝操作意図の推測が強い）。
           第6項目は原典の意味微分（unfair/fair）をリッカート形式に変更。 ---- */
    deception: {
      type: 'likert7',
      prompt: 'この広告（投稿）について、次の各文がどの程度あてはまりますか。',
      items: [
        { id: 'dec_1', text: 'この広告の説得のしかたは、私にとって受け入れられるものだ。', reverse: true },
        { id: 'dec_2', text: 'この広告主は、私が好ましく思わないやり方で、見る人を操ろうとしていた。', reverse: false },
        { id: 'dec_3', text: 'この広告主は見る人を不適切に操作・コントロールしようとしているように思え、この広告に不快感を感じた。', reverse: false },
        { id: 'dec_4', text: 'この広告は気にならなかった。広告主は、過度に操作的になることなく説得しようとしていた。', reverse: true },
        { id: 'dec_5', text: 'この広告で述べられたり示されたりしていた内容は、公正だった。', reverse: true },
        { id: 'dec_6', text: 'この広告は公正だと思う。', reverse: true },
      ],
    },

    /* ---- 7 動機帰属（Rifon et al. 2004）文言はプレテストから変更しない。提示ランダム・M2逆転 ---- */
    motive: {
      type: 'likert7', randomize: true,
      prompt: 'この投稿を見て、この企業について、次の各文がどの程度あてはまると感じましたか。',
      items: [
        { id: 'motive_1', text: 'この企業がこの活動を行うのは、最終的に顧客を大切に思っているからだ。', reverse: false },
        { id: 'motive_2', text: 'この企業は、消費者の幸福を本心では気にかけていない。', reverse: true },
        { id: 'motive_3', text: 'この企業は、{CAUSE}に取り組むことを本当に大切に思っている。', reverse: false },
        { id: 'motive_4', text: 'この企業がこの活動を行うのは、私に商品を買わせるためだ。', reverse: false },
        { id: 'motive_5', text: 'この企業がこの活動を行うのは、最終的に自社の利益を大切に思っているからだ。', reverse: false },
        { id: 'motive_6', text: 'この企業がこの活動を行うのは、活動が良い企業イメージを生むからだ。', reverse: false },
        { id: 'motive_7', text: '最終的に、この企業は{CAUSE}に取り組むことで利益を得る。', reverse: false },
        { id: 'motive_8', text: 'この企業がこの活動を行うのは、それが道徳的に「正しい」ことだからだ。', reverse: false },
      ],
    },

    /* ---- 7 操作チェック 1A（主）：プレテストから変更なし ---- */
    item1A: {
      type: 'likert7',
      prompt: 'この投稿の内容について、次の各文がどの程度あてはまりますか。',
      items: [
        { id: '1A_1', text: 'この投稿は、活動が企業自身の利益にもつながることに触れていた。' },
        { id: '1A_2', text: 'この投稿は、企業側のメリットをはっきりと述べていた。' },
        { id: '1A_3', text: 'この投稿には、企業にとっての利点（利益・イメージ向上など）に関する記述が含まれていた。' },
      ],
    },

    /* ---- 7 いいね数の知覚（Seo et al. 2019 Study 2："the post ... has a lot of likes"）
             ＋ 広告の認識＝概念的説得知識（Boerman et al. 2012, p.1054 / 2017, p.87） ---- */
    checks: {
      type: 'likert7',
      prompt: 'この投稿について、次の各文がどの程度あてはまりますか。',
      items: [
        { id: 'likes_perc', text: 'この投稿には、たくさんの「いいね」がついていた。' },
        { id: 'ad_recog', text: 'この投稿は広告だった。' },
      ],
    },

    /* ---- 8 適合度（プレテストから変更なし。fit_4逆転）＋ 指示型の注意チェック（最後に1問） ---- */
    fit: {
      type: 'likert7',
      prompt: 'この企業とこの活動の関係について、次の各文がどの程度あてはまりますか。',
      items: [
        { id: 'fit_1', text: 'この企業（{BRAND}）と、この社会問題（{CAUSE}）は、論理的に関連していると思う。', reverse: false },
        { id: 'fit_2', text: 'この投稿の内容は、この企業（{BRAND}）の事業内容とよく調和している。', reverse: false },
        { id: 'fit_3', text: '全体として、この活動とこの企業（{BRAND}）の組み合わせは、相性が良い。', reverse: false },
        { id: 'fit_4', text: 'この企業（{BRAND}）がこのような活動をしているのを見て、違和感があった。', reverse: true },
        { id: 'attn_instructed', text: '回答の確認のための項目です。この項目では「2」を選んでください。', instructed: true, correct: '2' },
      ],
    },

    /* ---- 8 注意チェック（内容の再認・4択、プレテストと同じ） ---- */
    attention: {
      id: 'attn_recog', type: 'mc',
      text: 'この投稿が扱っていた社会問題は、次のうちどれですか。',
      correct: '家具の廃棄',
      options: ['家具の廃棄', '食品ロス', '大気汚染', 'プラスチックごみ'],
    },

    /* ---- 8 ブランド既知（除外用・1項目。Boerman 2012 に準拠し刺激の後に尋ねる） ---- */
    familiarity: { id: 'bf1', type: 'yesno', text: 'この調査に参加する前から、「{BRAND}」というブランドを知っていましたか。' },

    /* ---- 9 広告懐疑性 SKEP（Obermiller & Spangenberg 1998, Table 1 p.171、9項目）
           全項目が「広告を信頼する」方向の文。全項目を逆転して採点（高得点＝懐疑的）。
           直線回答の判定には使わない。 ---- */
    skep: {
      type: 'likert7',
      prompt: '次は、広告一般についてのあなたの考えをお聞きします。各文がどの程度あてはまりますか。',
      items: [
        { id: 'skep_1', text: 'ほとんどの広告は、真実を伝えていると信頼してよい。', reverse: true },          // We can depend on getting the truth in most advertising.
        { id: 'skep_2', text: '広告の目的は、消費者に情報を伝えることだ。', reverse: true },                    // Advertising's aim is to inform the consumer.
        { id: 'skep_3', text: '広告は、役に立つ情報を与えてくれると思う。', reverse: true },                    // I believe advertising is informative.
        { id: 'skep_4', text: '広告は、おおむね真実を伝えている。', reverse: true },                            // Advertising is generally truthful.
        { id: 'skep_5', text: '広告は、製品の品質や性能について信頼できる情報源だ。', reverse: true },          // ...reliable source of information about the quality and performance of products.
        { id: 'skep_6', text: '広告とは、真実を上手に伝えたものだ。', reverse: true },                          // Advertising is truth well told.
        { id: 'skep_7', text: '一般に、広告は宣伝している製品のありのままの姿を示している。', reverse: true },  // In general, advertising presents a true picture of the product being advertised.
        { id: 'skep_8', text: 'たいていの広告を見たあとは、正確な情報を得たと感じる。', reverse: true },        // I feel I've been accurately informed after viewing most advertisements.
        { id: 'skep_9', text: 'たいていの広告は、消費者にとって必要な情報を提供している。', reverse: true },    // Most advertising provides consumers with essential information.
      ],
    },

    /* ---- 9 認知欲求 NCS-6（Lins de Holanda Coelho et al. 2020, Appendix p.1881）
           原典の項目番号 01, 02, 03(R), 04(R), 11, 15 ---- */
    ncs: {
      type: 'likert7',
      prompt: '次は、あなた自身についてお聞きします。各文がどの程度あてはまりますか。',
      items: [
        { id: 'ncs_1', text: '単純な問題よりも、複雑な問題のほうが好きだ。', reverse: false },                                          // 01
        { id: 'ncs_2', text: 'よく考えなければならない状況で、責任をもって対処するのが好きだ。', reverse: false },                    // 02
        { id: 'ncs_3', text: '考えることは、私にとって楽しいことではない。', reverse: true },                                            // 03 (R)
        { id: 'ncs_4', text: '自分の思考力が試されるようなことよりも、あまり考えなくてすむことをしたい。', reverse: true },              // 04 (R)
        { id: 'ncs_5', text: '問題に対する新しい解決策を考え出すような課題は、とても楽しい。', reverse: false },                          // 11
        { id: 'ncs_6', text: 'ある程度重要でもあまり考えなくてよい課題よりも、知的で難しく、重要な課題のほうが好きだ。', reverse: false }, // 15
      ],
    },

    /* ---- スクリーニング（プレテストと同じ） ---- */
    screening: {
      age: { id: 'age', type: 'number', text: '年齢を半角数字で入力してください。', min: 0, max: 120 },
      insta: { id: 'insta_freq', type: 'freq5', text: 'ふだん、Instagramをどのくらいの頻度で利用しますか。' },
    },

    /* ---- デモグラフィック（プレテストと同じ） ---- */
    demographics: [
      { id: 'gender', type: 'mc', text: '性別を教えてください。', options: ['男性', '女性', 'その他', '回答しない'] },
      { id: 'occupation', type: 'mc', text: '現在の主な立場を教えてください。', options: ['学生', '被雇用', 'その他'] },
    ],
  };

  global.Battery = Battery;
})(window);
