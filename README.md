# My Feed, My Mirror: Who Am I Beyond the Likes?

A small, offline, bilingual (English / Traditional Chinese zh-TW) web app that **simulates** a social-media feed.
Players see how their own actions change what the feed shows next, why each post appeared, what may be hidden behind a "perfect" post, and whether they can rewrite a feed that drifted toward appearance and comparison.

Made by Grade 7–8 students for ASEP 2026 (theme: *Breaking the Algorithm, Rewriting Youth: Youth Building a Safer Campus Ecosystem*).

> **This is a simplified teaching model made by students. It is NOT the real algorithm of any app.**

## How to run

Double-click `index.html`. That is all. It works offline, with Wi-Fi turned off.

- **One file:** `my-feed-my-mirror-offline.html` has everything inside. Copy it (or email it) to any computer and double-click it. Download email attachments first; do not open them in a mail preview window, which cannot run JavaScript.
- **Guides:** `HUONG-DAN.html` (Vietnamese) and `GUIDE-EN-zh-TW.html` (English + Traditional Chinese, with appendices for checking the zh-TW text).

- Add `?presenter=1` to the address (for example `index.html?presenter=1`) for bigger text and slower animations when screen-recording.
- Switch language with the **EN | 繁中** button at the top.
- **Restart** goes back to the start screen. Reloading the page also resets everything.

To run the tests (needs Node.js, nothing else to install):

```
node tests/algorithm.test.js
node tests/treehole.test.js
node tests/i18n.test.js
```

## Privacy and safety (by design)

- No login, no accounts, no names, no analytics, no cookies.
- Nothing is saved: no `localStorage`, `sessionStorage` or IndexedDB. All state is in memory.
- No network requests: no `fetch`, no CDN, no external fonts or images.
- Every post is **fictional**. No photos of people, no real names, creators or brands. Pictures are emoji.
- Appearance posts stay gentle: no body size or weight, diets or insults.

## The two features (Home screen)

The app opens on a **Home** screen with two cards:

1. **My Feed, My Mirror**: learn how algorithms work and how we use social media so we do not get nudged without noticing. It opens a short intro, then the lesson and game described below.
2. **Tree Hole (心事樹洞)**: a **concept demo** of an anonymous, caring campus message box. It is made for presenters: six cards, each with a clickable **Purpose** and **How to use** box.
   - **Scan & Share**: a poster with a demo QR (a picture only, it is not scannable) and the 5 steps: scan, write, AI check, teacher review, wall or private care.
   - **AI Safety Check**: type or pick a message and see the result: fine (goes to a teacher), please reword, not posted, or **care route** (never posted; kind message and help channels). The check is a set of simple, visible rules in `js/treehole.js`.
   - **The Wall**: made-up, moderated messages with kind reactions only, counselor replies and a Report button.
   - **AI Buddy**: six pre-written answers (exam stress, sleep, puberty, friends, feeling low, bullying) that always point to a trusted adult.
   - **Help Map**: school helpers and Taiwan hotlines 1925, 1995, 113, 1953 and emergency 110 / 119 (checked against Ministry of Health and Welfare and Ministry of Education pages in Nov 2026; please re-check before real use).
   - **Why It Is Safe**: the 7 design rules.

   Tree Hole is **not a real service**: there is no AI model, nothing is sent or saved, and the AI parts are simulated with pre-written text. A real launch would need the school's approval, a privacy review and trained counselors.

## The screens of My Feed, My Mirror

1. **Start**: Learn first / Play.
2. **Learn**: 6 cards on how real recommendation systems work. Each card shows its source.
3. **Feed**: one post at a time. Buttons 👀 Keep watching, ❤️ Like, 🔁 Share, ⏭️ Skip, 🚫 Not interested. A live **feed mix meter**. Links to **Why am I seeing this?** and **Behind the post**.
4. **Mirror Check** (after 10 actions): what the feed thinks you care about most.
5. **Rewrite Challenge**: start from a drifted feed and rebalance it in 12 actions. The result code (for example `WIN-7` or `TRY-12`) is shown so a facilitator can write it on paper. Nothing is stored.
6. **End**.

## How the teaching model works (plain English)

The model lives in `js/algorithm.js`. It is rule-based, so every choice can be explained. All numbers are in one `CONFIG` object at the top of that file.

- **Points:** each action changes the score of the post's topic (Watch +3, Like +2, Share +3, Skip −1, Not interested −4).
- **Score of a post** = topic score + 1 if the post is very popular + a tiny random number (0 to 0.5) to break ties.
- **Variety rule:** never the same creator twice in a row; never more than 2 posts of the same topic in a row.
- **Explore pick:** every 5th post comes from the topic the player has seen least.
- **No repeats** until all posts have been shown (then a new round starts).
- **Reasons:** `pickNext()` always returns the chosen post *and* a list of reasons, shown in "Why am I seeing this?".
- **Feed mix meter:** share of each topic among the last 10 posts shown.
- **Mirror Check:** the topic with the highest score.
- **Rewrite Challenge:** starts with Appearance at 12 points. When the player finishes (after 12 actions, or by pressing "Check my feed now"), we look at the **next 10 posts** on a copy of the feed. The player wins if Appearance is 20% or less **and** at least 3 topics have 15% or more. We judge a fresh round, so only the player's new scores matter.

The one-page version for presenting is in `RULES.md`.

## Files

```
index.html            the page
css/style.css         looks
js/i18n.js            every word the app shows, EN + zh-TW
js/content.js         the 40 fictional posts, EN + zh-TW
js/algorithm.js       the teaching model (no DOM; also runs in Node)
js/treehole.js        Tree Hole demo: safety-check rules and pre-written content (no DOM)
js/app.js             screens, buttons, drawing
tests/algorithm.test.js, treehole.test.js, i18n.test.js
RULES.md              "Our algorithm rules" (under 250 words)
CONTENT-REVIEW.md     checklist for a teacher to review every post
```

## Content notes

- 40 posts, 8 for each of the 5 topics: Appearance & Comparison, Sports/Music/Art, Science & Learning, Friends & Kindness, Pets & Funny.
- "Behind the post" facts come from this list only: beauty filter, edited or retouched, one of many retakes, good lighting or angle, paid promotion, AI-generated image (plus two harmless extras: a video was cut, a sound effect was added). A post with an empty list shows "Nothing hidden: this one is just fun 🙂".
- **zh-TW text is a draft** and must be checked by our Taiwanese teammates. A teacher should tick every row of `CONTENT-REVIEW.md` before the app is shown.

## Sources for the Learn screen

The Learn screen states only these facts. Platform descriptions are what the companies say about themselves; they may be simplified and may have changed since they were published.

- Instagram, "Instagram Ranking Explained" (Adam Mosseri, May 2023): https://about.instagram.com/blog/announcements/instagram-ranking-explained
- TikTok Newsroom, "How TikTok recommends videos #ForYou" (June 2020): https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you?lang=en
- YouTube Help, "How YouTube recommendations work": https://support.google.com/youtube/answer/16089387?hl=en
- Taiwan Ministry of Education, K-12 Education Administration news, 26 Oct 2026, 「走進學生生活日常 深耕媒體素養教育」: https://www.moe.gov.tw/News_Content.aspx?n=9E7AC85F1954DDA8&s=460ADCA7F6C10978&sms=169B8E91BB75571F

The links above are plain text for teachers to check. The app itself never opens or loads them.

## Changing the rules

Want Like to be worth more? Change the number in `CONFIG.actions` in `js/algorithm.js`, then run the tests. The Learn card "In our game" line updates by itself. If you change a number, also update `RULES.md`.
