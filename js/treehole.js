// treehole.js: the "Tree Hole" CONCEPT DEMO (an anonymous, caring campus message box).
// Everything here is pre-written text or simple, visible rules. There is NO AI service,
// NO network and NOTHING is saved. Pure data and functions (no DOM), so Node can test it.
// zh-TW draft: must be checked by our Taiwanese teammates
(function (root) {
  'use strict';

  // ---- 1. The safety check: simple rules you can read and explain ----
  // Each rule has English patterns and Chinese words. A message can match several rules.
  var RULES = [
    { cat: 'care',                                  // someone may be struggling: never public, always kind
      en: [/\bsuicid/i, /\b(kill|hurt|harm|cut) myself\b/i, /\bwant to die\b/i,
           /\b(don'?t|do not) want to (live|be alive|be here)\b/i, /\bend (my life|it all)\b/i,
           /\bcan'?t (go on|hold on|take (it|this) anymore|do this anymore)\b/i,
           /\bno reason to live\b/i, /\bwish i (was|were) (gone|dead)\b/i],
      zh: ['想死', '不想活', '不想再活', '自殺', '自殘', '傷害自己', '結束生命', '活不下去', '撐不下去', '不想存在', '想消失', '消失就好'] },
    { cat: 'violence',
      en: [/\b(kill|stab|shoot|punch|attack|bomb)\b/i, /\b(hit|beat|hurt|slap|kick) (him|her|them|you|someone|everyone)\b/i,
           /\bbeat (him|her|them|you) up\b/i, /\bmake (him|her|them|you) pay\b/i],
      zh: ['殺了', '殺死', '打死', '打爆', '弄死', '去死', '砍', '捅', '炸掉', '揍', '打他', '打她', '打你', '報復', '讓他好看', '要他好看'] },
    { cat: 'explicit',
      en: [/\b(nude|nudes|naked|porn|sexting|send pics)\b/i],
      zh: ['裸照', '色情', '性愛', 'a片', '脫光', '私密照'] },
    { cat: 'insult',
      en: [/\b(stupid|idiot|loser|ugly|fat|dumb|worthless|freak|moron|trash)\b/i, /\bhate (her|him|them)\b/i, /\beveryone hates\b/i],
      zh: ['笨蛋', '白痴', '智障', '廢物', '垃圾', '醜', '胖子', '討厭她', '討厭他', '大家都討厭', '噁心'] }
  ];

  // The kind of next step each category leads to (the strongest one wins).
  var ROUTE_OF = { care: 'care', violence: 'block', explicit: 'block', insult: 'reword', privacy: 'reword' };
  var ROUTE_ORDER = ['care', 'block', 'reword'];

  // Phone numbers (8+ digits), e-mail addresses and links are personal information.
  function looksPrivate(raw) {
    var digits = raw.replace(/[\s\-().]/g, '');
    return /\d{8,}/.test(digits) || /[\w.+-]+@[\w-]+\.[\w.]+/.test(raw) || /(https?:\/\/|www\.)/i.test(raw);
  }

  // classify(text) -> { route: 'empty' | 'pass' | 'reword' | 'block' | 'care', cats: [...] }
  function classify(text) {
    var raw = String(text == null ? '' : text).trim();
    if (!raw) return { route: 'empty', cats: [] };
    // Phones type curly quotes (’ ‘). Turn them into plain ' so "can’t" and "can't" are the same.
    var low = raw.toLowerCase().replace(/[‘’ʼ`´]/g, "'"), cats = [];
    RULES.forEach(function (r) {
      var hit = r.en.some(function (re) { return re.test(low); }) ||
                r.zh.some(function (w) { return low.indexOf(w) !== -1; });
      if (hit) cats.push(r.cat);
    });
    if (looksPrivate(raw)) cats.push('privacy');
    var route = 'pass';
    for (var i = 0; i < ROUTE_ORDER.length && route === 'pass'; i++) {
      if (cats.some(function (c) { return ROUTE_OF[c] === ROUTE_ORDER[i]; })) route = ROUTE_ORDER[i];
    }
    return { route: route, cats: cats };
  }

  // Example messages for the demo. `route` is what the check should answer (tests make sure).
  var SAMPLES = [
    { id: 'exam', route: 'pass',
      text: { en: 'I’m so nervous about the math test tomorrow. Any tips? 😢', 'zh-TW': '明天數學考試我好緊張，有人有什麼小撇步嗎？😢' } },
    { id: 'thanks', route: 'pass',
      text: { en: 'Thank you to the classmate who helped me pick up my books today 💛', 'zh-TW': '謝謝今天幫我撿書的同學 💛' } },
    { id: 'insult', route: 'reword',
      text: { en: 'Amy is so stupid and ugly, everyone hates her.', 'zh-TW': '小美超笨又超醜，大家都討厭她。' } },
    { id: 'phone', route: 'reword',
      text: { en: 'Message me! My number is 0912 345 678.', 'zh-TW': '傳訊息給我！我的電話是 0912 345 678。' } },
    { id: 'threat', route: 'block',
      text: { en: 'I’m going to hit him after school.', 'zh-TW': '放學後我要去打他。' } },
    { id: 'low', route: 'care',
      text: { en: 'Lately I feel like I can’t hold on anymore.', 'zh-TW': '最近我覺得好累，好像撐不下去了。' } }
  ];

  // ---- 2. The AI Buddy (pre-written answers; a real one would need a school-approved service) ----
  var BUDDY = [
    { id: 'exam', e: '📚',
      q: { en: 'I’m really stressed about exams', 'zh-TW': '我好擔心考試，壓力好大' },
      intro: { en: 'Feeling stressed before exams is very common. Your body is getting ready, but too much stress feels heavy.',
               'zh-TW': '考試前會緊張是很常見的，身體只是在做準備，只是壓力太大時會覺得很沉重。' },
      tips: { en: ['Split studying into small chunks (for example 25 minutes, then a 5-minute break).',
                   'Write down the 3 most important things to review today.',
                   'Take 5 slow breaths: in for 4 counts, out for 6.',
                   'Sleep and a little movement help your brain more than studying all night.'],
              'zh-TW': ['把讀書切成小段（例如讀 25 分鐘，休息 5 分鐘）。',
                        '寫下今天最重要的 3 件要複習的事。',
                        '慢慢呼吸 5 次：吸氣數 4 下，吐氣數 6 下。',
                        '睡飽和稍微動一動，比熬夜讀書更能幫助大腦。'] },
      talk: { en: 'Talk to someone if the worry lasts many days, you can’t sleep or eat well, or you feel stuck. A teacher or the school counseling office can help.',
              'zh-TW': '如果擔心持續好幾天、睡不好或吃不下，或覺得卡住了，請找人談談。老師或學校輔導室都可以幫忙。' } },
    { id: 'sleep', e: '😴',
      q: { en: 'I can’t sleep well lately', 'zh-TW': '我最近睡不好' },
      intro: { en: 'Many students have trouble sleeping sometimes, especially when they are worried or use screens late.',
               'zh-TW': '很多同學有時會睡不好，尤其是在擔心的時候，或是很晚還在看螢幕。' },
      tips: { en: ['Most teens need about 8 to 10 hours of sleep.',
                   'Put your phone away from your bed 30 to 60 minutes before sleeping.',
                   'Try to go to bed at about the same time every day.',
                   'If your mind is busy, write your worries on paper and leave them for tomorrow.'],
              'zh-TW': ['大部分青少年大約需要 8 到 10 小時的睡眠。',
                        '睡前 30 到 60 分鐘，把手機放到離床遠一點的地方。',
                        '每天盡量在差不多的時間上床。',
                        '如果腦袋停不下來，把擔心的事寫在紙上，留到明天再想。'] },
      talk: { en: 'If poor sleep lasts more than a couple of weeks, or you feel very tired or sad, tell a parent or guardian, or the school nurse. A doctor can check if something else is going on.',
              'zh-TW': '如果睡不好持續超過兩個星期，或是覺得很累、很難過，請告訴家長或監護人，或保健室老師。醫生可以幫忙看看有沒有其他原因。' } },
    { id: 'puberty', e: '🌱',
      q: { en: 'My body is changing and I feel confused', 'zh-TW': '我的身體在變化，我覺得很困惑' },
      intro: { en: 'Puberty is a normal part of growing up. Everyone starts at a different time and moves at a different speed, so comparing yourself with others is not fair to you.',
               'zh-TW': '青春期是成長的正常過程。每個人開始的時間不同、變化的速度也不同，所以拿自己跟別人比較，對你並不公平。' },
      tips: { en: ['Changes can include growing taller, skin changes, body odor and voice changes, and for many people periods starting.',
                   'Washing every day, wearing clean clothes and eating well help you feel fresh and strong.',
                   'Mood swings can happen. Be kind to yourself.',
                   'No question is silly. The school nurse, a parent or guardian, or a doctor can answer questions about your body.'],
              'zh-TW': ['變化可能包括長高、皮膚改變、有體味、變聲，很多人還會開始有月經。',
                        '每天清潔身體、穿乾淨的衣服、好好吃飯，能讓你感覺清爽又有精神。',
                        '情緒起伏也可能出現，請對自己溫柔一點。',
                        '沒有什麼問題是笨問題。保健室老師、家長或監護人、醫生都可以回答關於身體的問題。'] },
      talk: { en: 'Talk to a trusted adult or the school nurse if pain does not go away or you are worried about your body. If anyone makes you feel unsafe or uncomfortable about your body, tell a trusted adult right away (in Taiwan you can also call 113).',
              'zh-TW': '如果疼痛一直沒有好，或是擔心自己的身體，請找信任的大人或保健室老師談談。如果有人讓你對自己的身體感到不安全或不舒服，請立刻告訴信任的大人（在臺灣也可以撥 113）。' } },
    { id: 'friend', e: '🤝',
      q: { en: 'I had a fight with my best friend', 'zh-TW': '我和好朋友吵架了' },
      intro: { en: 'Fights with friends hurt because the friendship matters to you. Most of them can be repaired.',
               'zh-TW': '和朋友吵架會難過，是因為你很在乎這份友誼。大部分的爭吵都可以修復。' },
      tips: { en: ['Pause for a moment before you reply when you feel angry.',
                   'Say how YOU feel: “I felt sad when…” instead of “You always…”.',
                   'Listen to their side, and say sorry for your part.',
                   'If it keeps happening, it is okay to ask a teacher to help you talk.'],
              'zh-TW': ['生氣的時候，先停一下再回應。',
                        '說出「你自己」的感受：「當……的時候，我覺得很難過」，而不是「你總是……」。',
                        '聽聽對方的想法，也為自己做得不好的地方道歉。',
                        '如果一直發生，請老師幫你們好好談談也沒關係。'] },
      talk: { en: 'If a friend controls you, spreads rumours about you or hurts you, that is more than a fight. Tell a trusted adult.',
              'zh-TW': '如果朋友控制你、散播你的謠言或傷害你，那就不只是吵架了，請告訴信任的大人。' } },
    { id: 'sad', e: '☁️',
      q: { en: 'I feel sad or anxious a lot', 'zh-TW': '我常常覺得難過或焦慮' },
      intro: { en: 'Thank you for telling someone. Everyone feels sad or anxious sometimes, and you do not have to carry it alone.',
               'zh-TW': '謝謝你願意說出來。每個人有時都會難過或焦慮，你不需要一個人扛著。' },
      tips: { en: ['Name the feeling: “I feel worried / sad / tired.”',
                   'Do one small kind thing for yourself: a walk, some music, a glass of water, a hug from a pet.',
                   'Tell one person you trust how you feel.',
                   'Keep a simple routine: sleep, meals and a little movement.'],
              'zh-TW': ['說出這個感覺：「我覺得擔心／難過／很累。」',
                        '為自己做一件小小的溫柔的事：散散步、聽聽音樂、喝杯水、抱抱寵物。',
                        '告訴一位你信任的人你的感受。',
                        '維持簡單的作息：睡覺、吃飯，加上一點點運動。'] },
      talk: { en: 'If this lasts about two weeks or more, affects your sleep, eating or school, or you have thoughts of hurting yourself, please tell a trusted adult today. In Taiwan you can call 1925 (24 hours, free). If you are in danger now, call 110 or 119.',
              'zh-TW': '如果這種感覺持續大約兩個星期以上、影響睡覺、吃飯或上學，或是有傷害自己的想法，請今天就告訴信任的大人。在臺灣可以撥 1925（24 小時、免費）。如果現在有危險，請撥 110 或 119。' } },
    { id: 'bully', e: '🛡️',
      q: { en: 'Someone is bullying me', 'zh-TW': '有人在欺負我' },
      intro: { en: 'I’m sorry this is happening. Being bullied is never your fault, and you deserve to feel safe.',
               'zh-TW': '很抱歉你遇到這種事。被欺負絕對不是你的錯，你值得感到安全。' },
      tips: { en: ['Tell a trusted adult: your homeroom teacher, the school counseling office, or a parent or guardian.',
                   'Save evidence: screenshots, dates, and what happened.',
                   'Try not to hit back or reply in anger. It can make things harder for you.',
                   'Stay near friends or teachers where you feel safe.'],
              'zh-TW': ['告訴信任的大人：導師、學校輔導室，或家長、監護人。',
                        '留下證據：截圖、日期，還有發生了什麼事。',
                        '盡量不要動手還擊，也不要在生氣時回訊息，這可能讓事情對你更不利。',
                        '待在讓你覺得安全的朋友或老師身邊。'] },
      talk: { en: 'In Taiwan the Ministry of Education’s anti-bullying line is 1953 (24 hours). If you feel in danger, tell an adult right away or call 110.',
              'zh-TW': '在臺灣，教育部的反霸凌專線是 1953（24 小時）。如果覺得有危險，請馬上告訴大人，或撥 110。' } }
  ];

  // ---- 3. The Wall: made-up, kind, moderated messages ----
  var WALL = [
    { id: 'w1', tag: 'study', base: { hug: 18, heart: 9, strong: 12 },
      text: { en: 'Exams are coming and I keep worrying that I’m not good enough. Does anyone else feel like this?',
              'zh-TW': '快要考試了，我一直擔心自己不夠好。有人也這樣嗎？' },
      reply: { en: 'You are not alone. Many students feel this way before exams. Try small study chunks, and our counseling office is always open if you want to talk. 💛',
               'zh-TW': '你並不孤單，很多同學在考試前都有這種感覺。可以試試把讀書切成小段。如果想聊聊，輔導室隨時都在。💛' } },
    { id: 'w2', tag: 'friends', base: { hug: 24, heart: 31, strong: 6 },
      text: { en: 'I want to say thank you to the friend who sat with me at lunch when I felt alone. 💛',
              'zh-TW': '我想謝謝在我覺得孤單時，陪我一起吃午餐的朋友。💛' } },
    { id: 'w3', tag: 'growing', base: { hug: 11, heart: 5, strong: 8 },
      text: { en: 'Is it normal that all my friends are taller than me? I feel a bit small.',
              'zh-TW': '朋友們好像都比我高，我覺得自己有點矮，這樣正常嗎？' },
      reply: { en: 'Totally normal. Everyone grows at their own pace. If you are worried, the school nurse is happy to chat with you.',
               'zh-TW': '這很正常，每個人都有自己的成長速度。如果你擔心，保健室老師很樂意和你聊聊。' } },
    { id: 'w4', tag: 'family', base: { hug: 15, heart: 14, strong: 4 },
      text: { en: 'My parents are very busy and I miss spending time with them.',
              'zh-TW': '爸媽都很忙，我好想念和他們相處的時間。' } },
    { id: 'w5', tag: 'feelings', base: { hug: 9, heart: 17, strong: 10 },
      text: { en: 'Today was a hard day, but my cat made me smile. 🐱',
              'zh-TW': '今天是辛苦的一天，但是我的貓咪讓我笑了。🐱' } }
  ];

  // ---- 4. Real help in Taiwan. Numbers checked against Ministry of Health and Welfare / Ministry of Education pages (Nov 2026). ----
  var HELP = {
    school: [
      { e: '🏫', name: { en: 'School counseling office', 'zh-TW': '學校輔導室' },
        desc: { en: 'Trained counselors who listen and protect your privacy (unless someone may be in danger). You can walk in, or ask your teacher to go with you.',
                'zh-TW': '受過訓練的輔導老師會聽你說，也會保護你的隱私（除非有人可能遇到危險）。你可以直接走進去，也可以請老師陪你去。' } },
      { e: '👩‍🏫', name: { en: 'Homeroom teacher', 'zh-TW': '導師' },
        desc: { en: 'Someone who knows you and can connect you with the right help.', 'zh-TW': '認識你的人，可以幫你連結到適合的協助。' } },
      { e: '🩺', name: { en: 'School nurse', 'zh-TW': '保健室' },
        desc: { en: 'For questions about your body, feeling unwell, or growing up.', 'zh-TW': '關於身體、不舒服，或成長的問題，都可以來問。' } }
    ],
    hotlines: [
      { e: '📞', num: '1925', name: { en: 'Peace-of-mind Hotline (安心專線)', 'zh-TW': '安心專線' },
        desc: { en: 'Free mental-health counseling, 24 hours a day.', 'zh-TW': '免費的心理諮詢，全天 24 小時。' } },
      { e: '💬', num: '1995', name: { en: 'Lifeline (生命線)', 'zh-TW': '生命線' },
        desc: { en: 'Emotional support and crisis help, 24 hours a day.', 'zh-TW': '情緒支持與危機協助，全天 24 小時。' } },
      { e: '🛡️', num: '113', name: { en: 'Protection Line (保護專線)', 'zh-TW': '保護專線' },
        desc: { en: 'For children and teens facing abuse, family violence or sexual assault. 24 hours, confidential.',
                'zh-TW': '兒童與青少年遇到虐待、家庭暴力或性侵害時可以撥打，全天 24 小時，並且會保密。' } },
      { e: '🤝', num: '1953', name: { en: 'Anti-bullying Line, Ministry of Education (反霸凌專線)', 'zh-TW': '教育部反霸凌專線' },
        desc: { en: 'A 24-hour line to ask for advice or report bullying at school.', 'zh-TW': '全天 24 小時，可以諮詢或通報校園霸凌。' } }
    ],
    emergency: [
      { e: '🚓', num: '110', name: { en: 'Police', 'zh-TW': '警察' } },
      { e: '🚑', num: '119', name: { en: 'Ambulance and fire', 'zh-TW': '救護車與消防' } }
    ]
  };

  var api = { RULES: RULES, SAMPLES: SAMPLES, BUDDY: BUDDY, WALL: WALL, HELP: HELP, classify: classify };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MFMM_TH = api;
})(typeof window !== 'undefined' ? window : this);
