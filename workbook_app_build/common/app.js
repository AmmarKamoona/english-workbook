/* -----------------------------------------------------------------
 English Workbook PWA
 Developed by Dr. Ammar Kamoona (PhD, CPEng)
 Single-page router. Loads content.json and renders every screen.
 ----------------------------------------------------------------- */

const APP = {
    content: null,     // loaded JSON
    state: null,       // progress state
    year: null,        // 3 or 5
};

// -------- STORAGE --------
const STORAGE_KEY = () => `workbook_state_y${APP.year}`;

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY());
        if (raw) return JSON.parse(raw);
    } catch(e) {}
    return {
        stars: 0,
        weeks: {}, // {weekNumber: {sections: {vocab: true, ...}, done: bool, quizScore: n}}
        stickers: [], // unlocked sticker ids
        streak: 0,
        lastActive: null,
    };
}

function saveState() {
    try { localStorage.setItem(STORAGE_KEY(), JSON.stringify(APP.state)); } catch(e) {}
}

function markSection(week, section) {
    APP.state.weeks[week] = APP.state.weeks[week] || {sections:{}, done:false};
    if (!APP.state.weeks[week].sections[section]) {
        APP.state.weeks[week].sections[section] = true;
        addStars(5, `+5 for ${section}`);
    }
    // Check if all 8 sections done -> week done
    const secs = APP.state.weeks[week].sections;
    const ALL = ['vocab','grammar','punct','spelling','reading','writing','thinking','review'];
    const allDone = ALL.every(s => secs[s]);
    if (allDone && !APP.state.weeks[week].done) {
        APP.state.weeks[week].done = true;
        addStars(20, `Week ${week} complete!`);
        celebrate(`🎉 Week ${week} Complete!`, `You finished ${APP.content.themes[week-1].name}!`);
        maybeUnlockSticker();
    }
    saveState();
}

function addStars(n, msg) {
    APP.state.stars = (APP.state.stars || 0) + n;
    saveState();
    if (msg) toast(msg);
}

function maybeUnlockSticker() {
    const donecount = Object.values(APP.state.weeks).filter(w=>w.done).length;
    // Every 4 weeks unlocks a new sticker
    const stickerCount = Math.floor(donecount / 4);
    const stickers = ['⭐','🌟','🎨','📚','🎯','🏆','🎓','🚀','🌈','🦋','🐉','🌺','🎭','🎪','🎯'];
    while (APP.state.stickers.length < stickerCount && APP.state.stickers.length < stickers.length) {
        const s = stickers[APP.state.stickers.length];
        APP.state.stickers.push(s);
        celebrate(`New Sticker!`, `You unlocked ${s}`);
    }
    saveState();
}

// -------- UI helpers --------
function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
        for (const k in attrs) {
            if (k === 'onclick') e.onclick = attrs[k];
            else if (k === 'className') e.className = attrs[k];
            else if (k === 'html') e.innerHTML = attrs[k];
            else e.setAttribute(k, attrs[k]);
        }
    }
    if (children) {
        (Array.isArray(children) ? children : [children]).forEach(c => {
            if (c == null) return;
            e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        });
    }
    return e;
}

function speak(text) {
    try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.85;
        u.pitch = 1.05;
        window.speechSynthesis.speak(u);
    } catch(e) {}
}

function toast(msg) {
    const t = el('div', {className: 'toast', html: msg});
    Object.assign(t.style, {
        position: 'fixed', bottom: '90px', left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.85)', color: '#fff',
        padding: '8px 16px', borderRadius: '20px',
        fontSize: '13px', fontWeight: '600',
        zIndex: 200, opacity: 0, transition: 'opacity .3s'
    });
    document.body.appendChild(t);
    requestAnimationFrame(() => t.style.opacity = 1);
    setTimeout(() => {
        t.style.opacity = 0;
        setTimeout(() => t.remove(), 300);
    }, 1500);
}

function celebrate(title, msg) {
    const box = el('div', {className: 'celebrate-box'}, [
        el('div', {className: 'emoji', html: '🎉'}),
        el('h3', null, title),
        el('p', null, msg),
        el('button', {className: 'big-btn', onclick: () => overlay.classList.remove('show')}, 'Awesome!')
    ]);
    let overlay = document.querySelector('.celebrate-overlay');
    if (!overlay) {
        overlay = el('div', {className: 'celebrate-overlay'});
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = '';
    overlay.appendChild(box);
    overlay.classList.add('show');
    // Confetti
    for (let i = 0; i < 40; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.background = ['#FF6B6B','#4ECDC4','#FFE66D','#F18F01','#A23B72'][Math.floor(Math.random()*5)];
        c.style.animationDelay = Math.random() + 's';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 3000);
    }
}

function root() { return document.getElementById('root'); }

function header(title, sub, backHref) {
    return el('div', {className: 'app-header'}, [
        backHref ? el('button', {className: 'icon-btn', onclick: () => location.hash = backHref}, '←') : null,
        el('h1', {html: `${esc(title)}<div class="sub">${esc(sub||'')}</div>`}),
    ]);
}

function bottomNav(active) {
    const items = [
        {id: 'home', ico: '🏠', label: 'Home', href: '#/'},
        {id: 'weeks', ico: '📚', label: 'Weeks', href: '#/weeks'},
        {id: 'tracker', ico: '📊', label: 'Progress', href: '#/tracker'},
        {id: 'rewards', ico: '🏆', label: 'Rewards', href: '#/rewards'},
    ];
    const nav = el('div', {className: 'bottom-nav'});
    items.forEach(it => {
        const a = el('a', {onclick: () => location.hash = it.href, className: it.id === active ? 'active' : ''}, [
            el('div', {className: 'ico', html: it.ico}),
            el('div', null, it.label),
        ]);
        nav.appendChild(a);
    });
    return nav;
}

function themeImg(id) {
    const safe = APP.content.themes[id-1].name.toLowerCase().replace(/[^a-z0-9]/g,'_').slice(0,40);
    return `../common/images/week${String(id).padStart(2,'0')}_${safe}.jpg`;
}

// -------- ROUTES --------
const routes = {};

routes[''] = routes['/'] = () => {
    const doneWeeks = Object.values(APP.state.weeks).filter(w=>w.done).length;
    const totalStars = APP.state.stars || 0;
    const stickers = (APP.state.stickers || []).length;

    // Find current or next week to work on
    let nextWeek = 1;
    for (let i = 1; i <= 52; i++) {
        if (!(APP.state.weeks[i] && APP.state.weeks[i].done)) { nextWeek = i; break; }
    }

    const nextTheme = APP.content.themes[nextWeek - 1];

    root().innerHTML = '';
    root().appendChild(header(APP.content.title, `Ages ${APP.content.age}+ • Victorian Curriculum 2.0`));
    root().appendChild(el('div', {className: 'hero'}, [
        el('div', {className: 'welcome'}, 'HELLO, LEARNER'),
        el('div', {className: 'name'}, `Ready for Week ${nextWeek}?`),
        el('div', {html: `<div style="font-size:14px; opacity:0.95;">📖 ${esc(nextTheme.name)}</div>`}),
        el('button', {className: 'big-btn', style: 'background:rgba(255,255,255,0.25);color:#fff;box-shadow:none;margin-top:14px', onclick: () => location.hash = `#/week/${nextWeek}`}, 'Continue Learning →'),
        el('div', {className: 'stats'}, [
            el('div', {className: 'stat-card', html: `<div class="num">${doneWeeks}</div><div class="lbl">Weeks Done</div>`}),
            el('div', {className: 'stat-card', html: `<div class="num">${totalStars}</div><div class="lbl">Stars ⭐</div>`}),
            el('div', {className: 'stat-card', html: `<div class="num">${stickers}</div><div class="lbl">Stickers 🎨</div>`}),
        ]),
    ]));

    // Term overview
    root().appendChild(el('div', {className: 'section-title'}, 'YOUR TERMS'));
    const termRow = el('div', {className: 'term-row'});
    APP.content.terms.forEach(term => {
        const inTerm = term.weeks;
        const done = inTerm.filter(w => APP.state.weeks[w] && APP.state.weeks[w].done).length;
        const pct = Math.round((done / inTerm.length) * 100);
        termRow.appendChild(el('div', {className: 'term-card', onclick: () => location.hash = `#/term/${term.n}`}, [
            el('div', {className: 'badge', html: `TERM ${term.n}`}),
            el('h3', null, term.name.replace(/^Term \d+ - /, '')),
            el('div', {className: 'meta', html: `${done} of ${inTerm.length} weeks done`}),
            el('div', {className: 'progress-bar', html: `<span style="width:${pct}%"></span>`}),
        ]));
    });
    root().appendChild(termRow);

    root().appendChild(bottomNav('home'));
};

routes['/weeks'] = () => {
    root().innerHTML = '';
    root().appendChild(header('All 52 Weeks', 'Choose a week to start'));
    const grid = el('div', {className: 'week-grid'});
    for (let i = 1; i <= 52; i++) {
        const done = APP.state.weeks[i] && APP.state.weeks[i].done;
        const theme = APP.content.themes[i-1];
        const card = el('div', {className: `week-card ${done ? 'done' : ''}`, onclick: () => location.hash = `#/week/${i}`}, [
            el('img', {className: 'thumb', src: themeImg(i), loading: 'lazy', onerror: `this.style.display='none'`}),
            el('div', {className: 'info', html: `<div class="wk-num">WEEK ${i}</div><div class="wk-title">${esc(theme.name)}</div>`}),
            el('div', {className: 'done-badge', html: '✓'}),
        ]);
        grid.appendChild(card);
    }
    root().appendChild(grid);
    root().appendChild(bottomNav('weeks'));
};

routes['/term/'] = (n) => {
    n = parseInt(n);
    const term = APP.content.terms.find(t => t.n === n);
    if (!term) { location.hash = '#/'; return; }
    root().innerHTML = '';
    root().appendChild(header(term.name, `Weeks ${term.weeks[0]} to ${term.weeks[term.weeks.length-1]}`, '#/'));
    const grid = el('div', {className: 'week-grid'});
    term.weeks.forEach(i => {
        const done = APP.state.weeks[i] && APP.state.weeks[i].done;
        const theme = APP.content.themes[i-1];
        const card = el('div', {className: `week-card ${done ? 'done' : ''}`, onclick: () => location.hash = `#/week/${i}`}, [
            el('img', {className: 'thumb', src: themeImg(i), loading: 'lazy'}),
            el('div', {className: 'info', html: `<div class="wk-num">WEEK ${i}</div><div class="wk-title">${esc(theme.name)}</div>`}),
            el('div', {className: 'done-badge', html: '✓'}),
        ]);
        grid.appendChild(card);
    });
    root().appendChild(grid);
    root().appendChild(bottomNav('weeks'));
};

routes['/week/'] = (wk) => {
    wk = parseInt(wk);
    const unit = APP.content.weeks[wk-1];
    const secState = (APP.state.weeks[wk] && APP.state.weeks[wk].sections) || {};
    root().innerHTML = '';
    root().appendChild(header(`Week ${wk}`, unit.theme, '#/weeks'));
    root().appendChild(el('div', {className: 'week-hero'}, [
        el('img', {src: themeImg(wk), loading: 'lazy'}),
        el('div', {className: 'txt', html: `<div class="wknum">Week ${wk}</div><h2>${esc(unit.theme)}</h2><div class="focus">${esc(unit.theme_desc)}</div>`}),
    ]));

    const sections = [
        {id: 'vocab',    icon: '📝', title: 'Vocabulary', sub: `${unit.vocab.length} words to learn`},
        {id: 'grammar',  icon: '📖', title: 'Grammar', sub: unit.grammar_focus},
        {id: 'punct',    icon: '✏️',  title: 'Punctuation', sub: unit.punct_focus},
        {id: 'spelling', icon: '🔤', title: 'Spelling', sub: unit.spelling_focus},
        {id: 'reading',  icon: '📚', title: 'Reading', sub: 'Story + questions'},
        {id: 'writing',  icon: '✍️',  title: 'Writing', sub: unit.writing_type},
        {id: 'thinking', icon: '🧠', title: 'Thinking Challenge', sub: 'Riddles & puzzles'},
        {id: 'review',   icon: '🎯', title: 'Weekly Review', sub: 'Quiz time!'},
    ];
    const list = el('div', {className: 'section-list'});
    sections.forEach(s => {
        list.appendChild(el('div', {className: `section-tile ${secState[s.id] ? 'done' : ''}`, onclick: () => location.hash = `#/week/${wk}/${s.id}`}, [
            el('div', {className: 'tick', html: '✓'}),
            el('div', {className: 'icon', html: s.icon}),
            el('h4', null, s.title),
            el('div', {className: 'sub', html: esc(s.sub)}),
        ]));
    });
    root().appendChild(list);
    root().appendChild(bottomNav('weeks'));
};

routes['/tracker'] = () => {
    root().innerHTML = '';
    root().appendChild(header('Progress Tracker', 'How you\'re doing'));
    const total = 52;
    const done = Object.values(APP.state.weeks).filter(w=>w.done).length;
    const pct = Math.round(done/total*100);
    root().appendChild(el('div', {className: 'card', html: `
        <h3 style="margin:0 0 8px">Overall Progress</h3>
        <div class="progress-bar" style="height:14px"><span style="width:${pct}%"></span></div>
        <div class="muted" style="margin-top:6px">${done} of ${total} weeks • ${pct}%</div>
    `}));

    APP.content.terms.forEach(term => {
        const inTerm = term.weeks;
        const dc = inTerm.filter(w => APP.state.weeks[w] && APP.state.weeks[w].done).length;
        const p = Math.round(dc/inTerm.length*100);
        root().appendChild(el('div', {className: 'card', html: `
            <h3 style="margin:0 0 8px">${esc(term.name)}</h3>
            <div class="progress-bar" style="height:10px"><span style="width:${p}%"></span></div>
            <div class="muted" style="margin-top:4px">${dc} of ${inTerm.length} weeks</div>
        `}));
    });

    // Per-week status
    root().appendChild(el('div', {className: 'section-title'}, 'WEEKLY STATUS'));
    const grid = el('div', {style: 'display:grid;grid-template-columns:repeat(7,1fr);gap:6px;padding:0 16px 12px'});
    for (let i = 1; i <= 52; i++) {
        const w = APP.state.weeks[i] || {sections:{}, done:false};
        const secDone = Object.values(w.sections||{}).filter(Boolean).length;
        const bg = w.done ? 'var(--success)' : secDone>0 ? 'var(--secondary)' : '#E0E0E0';
        const color = secDone>0 || w.done ? '#fff' : 'var(--muted)';
        grid.appendChild(el('div', {onclick: () => location.hash = `#/week/${i}`, style: `background:${bg};color:${color};aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;cursor:pointer`, html: String(i)}));
    }
    root().appendChild(grid);
    root().appendChild(bottomNav('tracker'));
};

routes['/rewards'] = () => {
    root().innerHTML = '';
    root().appendChild(header('Rewards', 'Look what you earned!'));
    const stars = APP.state.stars || 0;
    root().appendChild(el('div', {className: 'reward-hero', html: `
        <div style="font-size:16px;margin-bottom:4px">✨ YOUR STAR COLLECTION</div>
        <div class="stars">${stars} ⭐</div>
        <div class="sub">Earn 5 stars per section, 20 for finishing a week</div>
    `}));
    root().appendChild(el('div', {className: 'section-title'}, 'STICKER COLLECTION'));
    const stickers = ['⭐','🌟','🎨','📚','🎯','🏆','🎓','🚀','🌈','🦋','🐉','🌺','🎭','🎪','🎯'];
    const grid = el('div', {className: 'sticker-grid'});
    stickers.forEach((s, i) => {
        const unlocked = (APP.state.stickers || []).includes(s);
        grid.appendChild(el('div', {className: `sticker ${unlocked ? 'unlocked' : ''}`, html: `${s}<div class="label">${unlocked ? 'GOT IT!' : 'LOCKED'}</div>`}));
    });
    root().appendChild(grid);
    root().appendChild(el('div', {className: 'muted center', style: 'padding:12px 16px'}, 'Unlock a new sticker every 4 finished weeks!'));
    root().appendChild(bottomNav('rewards'));
};

// -------- SECTION VIEWS --------

routes['/week//vocab'] = (wk) => {
    wk = parseInt(wk);
    const unit = APP.content.weeks[wk-1];
    root().innerHTML = '';
    root().appendChild(header(`Week ${wk} - Vocabulary`, unit.theme, `#/week/${wk}`));
    const body = el('div', {className: 'lesson'});
    body.appendChild(el('h2', null, '📝 Vocabulary'));
    body.appendChild(el('img', {className: 'section-hero', src: themeImg(wk), loading: 'lazy'}));
    body.appendChild(el('p', null, 'Tap the speaker to hear each word. Learn the meaning, synonym, and example.'));
    const list = el('div', {className: 'vocab-list'});
    unit.vocab.forEach((v, idx) => {
        const card = el('div', {className: 'vocab-card'}, [
            el('div', {className: 'num', html: String(idx+1)}),
            el('div', {html: `<div class="word">${esc(v.word)}</div><div class="meaning">${esc(v.meaning)}</div><div class="syn">Synonym: ${esc(v.synonym)}</div><div class="example">"${esc(v.example)}"</div>`}),
            el('button', {className: 'speak', onclick: () => speak(v.word + '. ' + v.meaning + '. Example: ' + v.example), html: '🔊'}),
        ]);
        list.appendChild(card);
    });
    body.appendChild(list);
    body.appendChild(el('button', {className: 'big-btn', onclick: () => {
        markSection(wk, 'vocab');
        location.hash = `#/week/${wk}`;
    }}, 'Mark as Done ✓'));
    root().appendChild(body);
    root().appendChild(bottomNav('weeks'));
};

routes['/week//grammar'] = (wk) => {
    wk = parseInt(wk);
    const unit = APP.content.weeks[wk-1];
    root().innerHTML = '';
    root().appendChild(header(`Week ${wk} - Grammar`, unit.theme, `#/week/${wk}`));
    const body = el('div', {className: 'lesson'});
    body.appendChild(el('h2', null, '📖 Grammar'));
    body.appendChild(el('div', {className: 'card', html: `<span class="tag grammar">FOCUS</span><h3 style="margin:6px 0;border:0">${esc(unit.grammar_focus)}</h3><p>${esc(unit.grammar_note)}</p>`}));
    body.appendChild(el('h3', null, 'Examples'));
    unit.grammar_examples.forEach(ex => {
        body.appendChild(el('div', {className: 'card', style: 'padding:8px 12px', html: `▸ ${esc(ex)}`}));
    });
    body.appendChild(el('h3', null, 'Try it yourself'));
    unit.grammar_practice.forEach((pr, i) => {
        const div = el('div', {className: 'quiz-q'}, [
            el('div', {className: 'q-text', html: `${i+1}. ${esc(pr)}`}),
            el('textarea', {placeholder: 'Type your answer here...', id: `gp-${wk}-${i}`}),
        ]);
        body.appendChild(div);
    });
    body.appendChild(el('button', {className: 'big-btn', onclick: () => {
        // save practice answers
        unit.grammar_practice.forEach((_, i) => {
            const val = document.getElementById(`gp-${wk}-${i}`).value;
            if (val) localStorage.setItem(`grammar_${APP.year}_${wk}_${i}`, val);
        });
        markSection(wk, 'grammar');
        location.hash = `#/week/${wk}`;
    }}, 'Save & Mark Done ✓'));
    root().appendChild(body);
    root().appendChild(bottomNav('weeks'));
};

routes['/week//punct'] = (wk) => {
    wk = parseInt(wk);
    const unit = APP.content.weeks[wk-1];
    root().innerHTML = '';
    root().appendChild(header(`Week ${wk} - Punctuation`, unit.theme, `#/week/${wk}`));
    const body = el('div', {className: 'lesson'});
    body.appendChild(el('h2', null, '✏️ Punctuation'));
    body.appendChild(el('div', {className: 'card', html: `<span class="tag">FOCUS</span><h3 style="margin:6px 0;border:0">${esc(unit.punct_focus)}</h3>`}));
    body.appendChild(el('h3', null, 'Examples'));
    unit.punct_examples.forEach(ex => body.appendChild(el('div', {className: 'card', style: 'padding:8px 12px', html: `▸ ${esc(ex)}`})));
    body.appendChild(el('h3', null, 'Try it yourself'));
    unit.punct_practice.forEach((p, i) => {
        body.appendChild(el('div', {className: 'quiz-q'}, [
            el('div', {className: 'q-text', html: `${i+1}. ${esc(p)}`}),
            el('textarea', {placeholder: 'Rewrite with correct punctuation...'}),
        ]));
    });
    body.appendChild(el('button', {className: 'big-btn', onclick: () => {
        markSection(wk, 'punct');
        location.hash = `#/week/${wk}`;
    }}, 'Mark as Done ✓'));
    root().appendChild(body);
    root().appendChild(bottomNav('weeks'));
};

routes['/week//spelling'] = (wk) => {
    wk = parseInt(wk);
    const unit = APP.content.weeks[wk-1];
    root().innerHTML = '';
    root().appendChild(header(`Week ${wk} - Spelling`, unit.theme, `#/week/${wk}`));
    const body = el('div', {className: 'lesson'});
    body.appendChild(el('h2', null, '🔤 Spelling'));
    body.appendChild(el('div', {className: 'card', html: `<span class="tag spelling">FOCUS</span><h3 style="margin:6px 0;border:0">${esc(unit.spelling_focus)}</h3>`}));
    body.appendChild(el('h3', null, 'This Week\'s Words'));
    const grid = el('div', {style: 'display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:8px 0'});
    unit.spelling_words.forEach(w => {
        grid.appendChild(el('div', {className: 'card', style: 'padding:8px;text-align:center', onclick: () => speak(w)}, [
            el('div', {style: 'font-weight:700;font-size:15px', html: esc(w)}),
            el('div', {className: 'muted small', html: 'Tap to hear 🔊'}),
        ]));
    });
    body.appendChild(grid);
    body.appendChild(el('h3', null, 'Practice: Type each word 3 times'));
    unit.spelling_words.slice(0, 5).forEach((w, i) => {
        body.appendChild(el('div', {className: 'quiz-q'}, [
            el('div', {className: 'q-text', html: `${i+1}. <b>${esc(w)}</b>`}),
            el('textarea', {placeholder: `${w}  ${w}  ${w}`, style: 'min-height:50px'}),
        ]));
    });
    body.appendChild(el('button', {className: 'big-btn', onclick: () => {
        markSection(wk, 'spelling');
        location.hash = `#/week/${wk}`;
    }}, 'Mark as Done ✓'));
    root().appendChild(body);
    root().appendChild(bottomNav('weeks'));
};

routes['/week//reading'] = (wk) => {
    wk = parseInt(wk);
    const unit = APP.content.weeks[wk-1];
    const s = unit.story;
    root().innerHTML = '';
    root().appendChild(header(`Week ${wk} - Reading`, unit.theme, `#/week/${wk}`));
    const body = el('div', {className: 'lesson'});
    body.appendChild(el('h2', null, '📚 Reading Comprehension'));
    body.appendChild(el('img', {className: 'section-hero', src: themeImg(wk), loading: 'lazy'}));
    const story = el('div', {className: 'story'});
    story.appendChild(el('h4', null, s.title));
    s.text.split(/\n\n/).forEach(p => story.appendChild(el('p', null, p)));
    story.appendChild(el('button', {className: 'secondary-btn', onclick: () => speak(s.text.slice(0, 700))}, 'Read Aloud 🔊'));
    body.appendChild(story);

    // MCQ
    body.appendChild(el('h3', null, 'Multiple Choice'));
    let mcqScore = 0;
    s.mcq.forEach((q, i) => {
        const qDiv = el('div', {className: 'quiz-q'});
        qDiv.appendChild(el('div', {className: 'q-text', html: `${i+1}. ${esc(q.q)}`}));
        q.options.forEach((opt, j) => {
            const optEl = el('div', {className: 'option', html: esc(opt), onclick: () => {
                qDiv.querySelectorAll('.option').forEach(x => x.classList.remove('selected','correct','wrong'));
                if (j === q.answer) {
                    optEl.classList.add('correct');
                    mcqScore++;
                } else {
                    optEl.classList.add('wrong');
                    qDiv.querySelectorAll('.option')[q.answer].classList.add('correct');
                }
            }});
            qDiv.appendChild(optEl);
        });
        body.appendChild(qDiv);
    });

    // Short answer
    body.appendChild(el('h3', null, 'Short Answer'));
    s.short.forEach((q, i) => {
        body.appendChild(el('div', {className: 'quiz-q'}, [
            el('div', {className: 'q-text', html: `${i+1}. ${esc(q)}`}),
            el('textarea', {placeholder: 'Your answer...'}),
        ]));
    });

    // Inference
    body.appendChild(el('h3', null, 'Inference Questions'));
    s.inference.forEach((q, i) => {
        body.appendChild(el('div', {className: 'quiz-q'}, [
            el('div', {className: 'q-text', html: `${i+1}. ${esc(q)}`}),
            el('textarea', {placeholder: 'Think and write...'}),
        ]));
    });

    // Vocab in context
    body.appendChild(el('h3', null, 'Vocabulary in Context'));
    s.vocab_ctx.forEach((q, i) => {
        const qDiv = el('div', {className: 'quiz-q'});
        qDiv.appendChild(el('div', {className: 'q-text', html: `${i+1}. ${esc(q.q)}`}));
        q.options.forEach((opt, j) => {
            const optEl = el('div', {className: 'option', html: esc(opt), onclick: () => {
                qDiv.querySelectorAll('.option').forEach(x => x.classList.remove('selected','correct','wrong'));
                if (j === q.answer) optEl.classList.add('correct');
                else { optEl.classList.add('wrong'); qDiv.querySelectorAll('.option')[q.answer].classList.add('correct'); }
            }});
            qDiv.appendChild(optEl);
        });
        body.appendChild(qDiv);
    });

    body.appendChild(el('button', {className: 'big-btn', onclick: () => {
        markSection(wk, 'reading');
        location.hash = `#/week/${wk}`;
    }}, 'Mark as Done ✓'));
    root().appendChild(body);
    root().appendChild(bottomNav('weeks'));
};

routes['/week//writing'] = (wk) => {
    wk = parseInt(wk);
    const unit = APP.content.weeks[wk-1];
    root().innerHTML = '';
    root().appendChild(header(`Week ${wk} - Writing`, unit.theme, `#/week/${wk}`));
    const body = el('div', {className: 'lesson'});
    body.appendChild(el('h2', null, '✍️ Writing: ' + unit.writing_type));
    body.appendChild(el('div', {className: 'card', html: `<p>${esc(unit.writing_desc)}</p>`}));
    body.appendChild(el('h3', null, 'Your Task'));
    unit.writing_task.forEach(line => body.appendChild(el('p', null, line)));
    body.appendChild(el('h3', null, 'Plan Your Writing'));
    body.appendChild(el('div', {className: 'quiz-q'}, [
        el('textarea', {placeholder: 'Notes and ideas...', style: 'min-height:80px', id: `plan-${wk}`}),
    ]));
    body.appendChild(el('h3', null, 'Write Your Piece'));
    const ta = el('textarea', {placeholder: 'Start writing here...', style: 'min-height:220px', id: `write-${wk}`});
    body.appendChild(el('div', {className: 'quiz-q'}, [ta]));
    const wc = el('div', {className: 'muted small', style: 'text-align:right;margin-top:-8px'});
    body.appendChild(wc);
    ta.addEventListener('input', () => {
        const words = ta.value.trim().split(/\s+/).filter(Boolean).length;
        wc.textContent = `${words} words`;
    });
    // load saved
    ta.value = localStorage.getItem(`writing_${APP.year}_${wk}`) || '';
    const plan = document.getElementById(`plan-${wk}`);
    plan.value = localStorage.getItem(`writing_plan_${APP.year}_${wk}`) || '';
    body.appendChild(el('button', {className: 'big-btn', onclick: () => {
        localStorage.setItem(`writing_${APP.year}_${wk}`, ta.value);
        localStorage.setItem(`writing_plan_${APP.year}_${wk}`, plan.value);
        markSection(wk, 'writing');
        location.hash = `#/week/${wk}`;
    }}, 'Save & Mark Done ✓'));
    root().appendChild(body);
    root().appendChild(bottomNav('weeks'));
};

routes['/week//thinking'] = (wk) => {
    wk = parseInt(wk);
    const unit = APP.content.weeks[wk-1];
    const t = unit.thinking;
    root().innerHTML = '';
    root().appendChild(header(`Week ${wk} - Thinking`, unit.theme, `#/week/${wk}`));
    const body = el('div', {className: 'lesson'});
    body.appendChild(el('h2', null, '🧠 Thinking Challenge'));

    // Riddle
    body.appendChild(el('h3', null, 'Riddle'));
    body.appendChild(el('div', {className: 'card', html: `<p style="font-size:14px">${esc(t.riddle.clue)}</p>`}));
    const rIn = el('input', {placeholder: 'Your guess...', style: 'width:100%;padding:10px;border-radius:10px;border:1px solid #ddd;font-size:14px'});
    body.appendChild(el('div', {className: 'quiz-q'}, [rIn]));
    const rFeedback = el('div');
    body.appendChild(rFeedback);
    body.appendChild(el('button', {className: 'secondary-btn', onclick: () => {
        const guess = rIn.value.trim().toLowerCase();
        const ans = (t.riddle.answer || '').toLowerCase();
        rFeedback.innerHTML = '';
        rFeedback.appendChild(el('div', {className: `feedback ${guess === ans ? 'ok' : 'no'}`, html: guess === ans ? `Correct! The answer is <b>${esc(t.riddle.answer)}</b>` : `Not quite. The answer is <b>${esc(t.riddle.answer)}</b>`}));
    }}, 'Check Riddle'));

    // Analogies
    body.appendChild(el('h3', null, 'Analogies'));
    t.analogies.forEach((a, i) => {
        body.appendChild(el('div', {className: 'quiz-q'}, [
            el('div', {className: 'q-text', html: `${i+1}. ${esc(a)}`}),
            el('input', {placeholder: 'Your answer...', style: 'width:100%;padding:10px;border-radius:10px;border:1px solid #ddd'}),
        ]));
    });

    // Unscramble
    body.appendChild(el('h3', null, 'Unscramble the Words'));
    t.unscramble.forEach((u, i) => {
        const q = el('div', {className: 'quiz-q'});
        q.appendChild(el('div', {className: 'q-text', html: `<b style="font-family:monospace;font-size:18px">${esc(u.scrambled)}</b>`}));
        const inp = el('input', {placeholder: 'Unscramble it...', style: 'width:100%;padding:10px;border-radius:10px;border:1px solid #ddd'});
        q.appendChild(inp);
        const fb = el('div');
        q.appendChild(fb);
        q.appendChild(el('button', {className: 'secondary-btn', style: 'margin-top:6px', onclick: () => {
            fb.innerHTML = '';
            const ok = inp.value.trim().toLowerCase() === u.word.toLowerCase();
            fb.appendChild(el('div', {className: `feedback ${ok?'ok':'no'}`, html: ok ? 'Correct! ⭐' : `The answer is <b>${esc(u.word)}</b>`}));
        }}, 'Check'));
        body.appendChild(q);
    });

    // Crossword clues
    body.appendChild(el('h3', null, 'Crossword Clues'));
    t.crossword_clues.forEach((c, i) => {
        body.appendChild(el('div', {className: 'quiz-q'}, [
            el('div', {className: 'q-text', html: `${i+1}. ${esc(c.clue)} (${c.word.length} letters)`}),
            el('input', {placeholder: '_ _ _', style: 'width:100%;padding:10px;border-radius:10px;border:1px solid #ddd;letter-spacing:4px;text-transform:uppercase'}),
        ]));
    });

    // Word search
    body.appendChild(el('h3', null, 'Word Search'));
    body.appendChild(el('p', null, 'Find these words: ' + t.word_search_words.slice(0,8).join(', ')));
    body.appendChild(buildWordSearch(t.word_search_words.slice(0,8)));

    body.appendChild(el('button', {className: 'big-btn', onclick: () => {
        markSection(wk, 'thinking');
        location.hash = `#/week/${wk}`;
    }}, 'Mark as Done ✓'));
    root().appendChild(body);
    root().appendChild(bottomNav('weeks'));
};

function buildWordSearch(words) {
    const n = 10;
    const grid = Array.from({length: n}, () => Array(n).fill(null));
    // Simple greedy placement
    words.forEach(word => {
        const w = word.toUpperCase();
        for (let tries = 0; tries < 40; tries++) {
            const dir = Math.floor(Math.random()*2); // 0=horizontal, 1=vertical
            const maxX = dir === 0 ? n - w.length : n - 1;
            const maxY = dir === 1 ? n - w.length : n - 1;
            const x = Math.floor(Math.random()*(maxX+1));
            const y = Math.floor(Math.random()*(maxY+1));
            let ok = true;
            for (let i = 0; i < w.length; i++) {
                const cx = x + (dir===0?i:0), cy = y + (dir===1?i:0);
                if (grid[cy][cx] != null && grid[cy][cx] !== w[i]) { ok = false; break; }
            }
            if (ok) {
                for (let i = 0; i < w.length; i++) {
                    const cx = x + (dir===0?i:0), cy = y + (dir===1?i:0);
                    grid[cy][cx] = w[i];
                }
                break;
            }
        }
    });
    // Fill blanks
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const cont = el('div', {className: 'wsearch', style: `grid-template-columns: repeat(${n}, auto)`});
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            const ch = grid[y][x] || alpha[Math.floor(Math.random()*26)];
            const cell = el('div', {className: 'cell', html: ch, onclick: () => cell.classList.toggle('hit')});
            cont.appendChild(cell);
        }
    }
    return cont;
}

routes['/week//review'] = (wk) => {
    wk = parseInt(wk);
    const unit = APP.content.weeks[wk-1];
    const r = unit.review;
    root().innerHTML = '';
    root().appendChild(header(`Week ${wk} - Review Quiz`, unit.theme, `#/week/${wk}`));
    const body = el('div', {className: 'lesson'});
    body.appendChild(el('h2', null, '🎯 Weekly Review'));
    body.appendChild(el('p', null, 'Complete each section to finish the week!'));

    // A) Vocab matching
    body.appendChild(el('h3', null, 'A) Vocabulary Quiz'));
    body.appendChild(el('p', {className: 'muted'}, 'For each word, choose the correct meaning.'));
    // Build a distractor pool from all vocab meanings this week
    const allMeanings = unit.vocab.map(v => v.meaning);
    let vocabScore = 0;
    r.vocab_quiz.forEach((v, i) => {
        const correct = v.meaning;
        const distractors = allMeanings.filter(m => m !== correct).sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [correct, ...distractors].sort(() => 0.5 - Math.random());
        const answerIdx = options.indexOf(correct);
        const qDiv = el('div', {className: 'quiz-q'});
        qDiv.appendChild(el('div', {className: 'q-text', html: `${i+1}. What does <b>${esc(v.word)}</b> mean?`}));
        options.forEach((opt, j) => {
            const optEl = el('div', {className: 'option', html: esc(opt), onclick: () => {
                qDiv.querySelectorAll('.option').forEach(x => x.classList.remove('selected','correct','wrong'));
                if (j === answerIdx) { optEl.classList.add('correct'); vocabScore++; }
                else { optEl.classList.add('wrong'); qDiv.querySelectorAll('.option')[answerIdx].classList.add('correct'); }
            }});
            qDiv.appendChild(optEl);
        });
        body.appendChild(qDiv);
    });

    // B) Grammar quiz
    body.appendChild(el('h3', null, 'B) Grammar Quiz'));
    r.grammar_quiz.forEach((q, i) => {
        body.appendChild(el('div', {className: 'quiz-q'}, [
            el('div', {className: 'q-text', html: `${i+1}. ${esc(q.question)}<br><span class="muted small">${esc(q.sentence)}</span>`}),
            el('textarea', {placeholder: 'Your answer...'}),
        ]));
    });

    // C) Dictation - use TTS to speak sentences
    body.appendChild(el('h3', null, 'C) Dictation'));
    body.appendChild(el('p', {className: 'muted'}, 'Tap ▶ to hear each sentence, then write it below.'));
    (r.dictation || ['I love learning.', 'This week was fun.', 'I did my best.']).forEach((sent, i) => {
        const div = el('div', {className: 'quiz-q'});
        div.appendChild(el('div', {className: 'q-text', html: `${i+1}. <button class="secondary-btn" style="display:inline-block;width:auto;padding:6px 14px;margin:0" onclick='window.speechSynthesis.cancel();window.speechSynthesis.speak(new SpeechSynthesisUtterance(${JSON.stringify(sent)}))'>▶ Play sentence</button>`}));
        div.appendChild(el('textarea', {placeholder: 'Write what you heard...', style: 'min-height:50px'}));
        body.appendChild(div);
    });

    // D) Short writing
    body.appendChild(el('h3', null, 'D) Short Writing Task'));
    body.appendChild(el('div', {className: 'quiz-q'}, [
        el('div', {className: 'q-text', html: esc(r.short_writing)}),
        el('textarea', {placeholder: 'Write your response...', style: 'min-height:120px'}),
    ]));

    body.appendChild(el('button', {className: 'big-btn', onclick: () => {
        APP.state.weeks[wk] = APP.state.weeks[wk] || {sections:{}, done:false};
        APP.state.weeks[wk].quizScore = vocabScore;
        markSection(wk, 'review');
        location.hash = `#/week/${wk}`;
    }}, 'Finish Quiz & Mark Done ✓'));
    root().appendChild(body);
    root().appendChild(bottomNav('weeks'));
};

// -------- ROUTER --------
function route() {
    const h = (location.hash || '#/').slice(1);
    const parts = h.split('/').filter(Boolean);

    // Try prefix + slot handlers: /week/:wk, /week/:wk/:section, /term/:n
    if (parts.length === 0) return routes['/']();
    if (parts.length === 1) {
        const k = '/' + parts[0];
        if (routes[k]) return routes[k]();
    }
    if (parts.length === 2 && parts[0] === 'term') return routes['/term/'](parts[1]);
    if (parts.length === 2 && parts[0] === 'week') return routes['/week/'](parts[1]);
    if (parts.length === 3 && parts[0] === 'week') {
        const key = `/week//${parts[2]}`;
        if (routes[key]) return routes[key](parts[1]);
    }
    // Fallback
    location.hash = '#/';
}

window.addEventListener('hashchange', route);

// -------- BOOT --------
async function boot(year, contentUrl) {
    APP.year = year;
    document.documentElement.setAttribute('data-year', String(year));
    APP.state = loadState();
    const res = await fetch(contentUrl);
    APP.content = await res.json();
    document.title = APP.content.title;
    // scroll to top on route change
    window.addEventListener('hashchange', () => window.scrollTo(0, 0));
    route();
    // Register service worker if available
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
}

window.__BOOT_APP__ = boot;
