const TEXTS = {
    easy: [
        "The quick brown fox jumps over the lazy dog.",
        "A journey of a thousand miles begins with a single step.",
        "To be or not to be, that is the question.",
        "All that glitters is not gold.",
        "Practice makes perfect in everything you do."
    ],
    normal: [
        "Innovation distinguishes between a leader and a follower. Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.",
        "Success is not final, failure is not fatal: it is the courage to continue that counts. It is better to fail in originality than to succeed in imitation.",
        "The future belongs to those who believe in the beauty of their dreams. Do not go where the path may lead, go instead where there is no path and leave a trail.",
        "Life is what happens when you're busy making other plans. It is during our darkest moments that we must focus to see the light."
    ],
    hard: [
        "The phenomenon of quantum entanglement suggests that particles can remain connected such that the state of one instantly influences the other, regardless of distance.",
        "Philosophical skepticism often challenges our fundamental assumptions about reality, questioning whether the external world exists independently of our perceptions.",
        "Metamorphosis in biological systems involves complex hormonal regulations that trigger profound morphological and physiological transformations during an organism's life cycle.",
        "The juxtaposition of industrial advancement and environmental preservation remains one of the most significant challenges for modern civilization in the twenty-first century."
    ],
    code: [
        "function calculateWPM(chars, time) { return Math.round((chars / 5) / (time / 60)); }",
        "const observer = new IntersectionObserver((entries) => { entries.forEach(entry => console.log(entry)); });",
        "async function fetchData(url) { const response = await fetch(url); return await response.json(); }",
        "document.addEventListener('keydown', (e) => { if (e.key === 'Enter') startTest(); });",
        "export const theme = { dark: '#0a0b10', light: '#f8f9fa', accent: '#00d2ff' };"
    ]
};

// State Management
let state = {
    mode: 'easy',
    timeLimit: 30,
    timeLeft: 30,
    timer: null,
    isTestRunning: false,
    text: "",
    currentIndex: 0,
    mistakes: 0,
    charsTyped: 0,
    soundEnabled: true,
    leaderboard: JSON.parse(localStorage.getItem('zee_type_leaderboard')) || []
};

// DOM Elements
const elements = {
    hero: document.getElementById('hero'),
    testArea: document.getElementById('test-area'),
    resultsArea: document.getElementById('results-area'),
    textDisplay: document.getElementById('text-display'),
    typingInput: document.getElementById('typing-input'),
    cursor: document.getElementById('cursor'),
    liveWpm: document.getElementById('live-wpm'),
    liveAccuracy: document.getElementById('live-accuracy'),
    timer: document.getElementById('timer'),
    mistakes: document.getElementById('mistakes'),
    finalWpm: document.getElementById('final-wpm'),
    finalAccuracy: document.getElementById('final-accuracy'),
    finalChars: document.getElementById('final-chars'),
    finalMistakes: document.getElementById('final-mistakes'),
    lastWpm: document.getElementById('last-wpm'),
    leaderboardBody: document.getElementById('leaderboard-body'),
    noData: document.getElementById('no-data'),
    toast: document.getElementById('toast'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    newTestBtn: document.getElementById('new-test-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    soundToggle: document.getElementById('sound-toggle'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    timeBtns: document.querySelectorAll('.time-btn')
};

// Initialization
function init() {
    updateLeaderboard();
    setupEventListeners();
    elements.lastWpm.innerText = localStorage.getItem('zee_type_last_wpm') || '0';
}

function setupEventListeners() {
    elements.startBtn.addEventListener('click', startTest);
    elements.restartBtn.addEventListener('click', startTest);
    elements.newTestBtn.addEventListener('click', () => {
        elements.resultsArea.classList.add('hidden');
        elements.hero.classList.remove('hidden');
    });

    elements.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.mode = btn.dataset.mode;
        });
    });

    elements.timeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.timeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.timeLimit = parseInt(btn.dataset.time);
            state.timeLeft = state.timeLimit;
            elements.timer.innerText = `${state.timeLeft}s`;
        });
    });

    elements.typingInput.addEventListener('input', handleTyping);
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.soundToggle.addEventListener('click', toggleSound);
    
    // Focus input on click anywhere in typing container
    document.querySelector('.typing-container').addEventListener('click', () => {
        elements.typingInput.focus();
    });
}

function startTest() {
    state.isTestRunning = true;
    state.currentIndex = 0;
    state.mistakes = 0;
    state.charsTyped = 0;
    state.timeLeft = state.timeLimit;
    
    const modeTexts = TEXTS[state.mode];
    state.text = modeTexts[Math.floor(Math.random() * modeTexts.length)];
    
    elements.hero.classList.add('hidden');
    elements.resultsArea.classList.add('hidden');
    elements.testArea.classList.remove('hidden');
    
    renderText();
    updateStats();
    
    elements.timer.innerText = `${state.timeLeft}s`;
    elements.typingInput.value = "";
    elements.typingInput.focus();
    
    clearInterval(state.timer);
    state.timer = setInterval(updateTimer, 1000);
    
    updateCursorPosition();
}

function renderText() {
    elements.textDisplay.innerHTML = state.text.split('').map((char, i) => {
        return `<span class="char" id="char-${i}">${char}</span>`;
    }).join('');
}

function handleTyping(e) {
    if (!state.isTestRunning) return;
    
    const inputVal = e.target.value;
    const inputChar = inputVal[inputVal.length - 1];
    const targetChar = state.text[state.currentIndex];
    
    if (inputVal.length < state.currentIndex) {
        // Backspace handled implicitly by comparing length
        state.currentIndex = inputVal.length;
        updateUIClasses();
        return;
    }

    if (inputChar === targetChar) {
        playSound('key');
    } else {
        state.mistakes++;
        playSound('error');
    }
    
    state.currentIndex = inputVal.length;
    state.charsTyped++;
    
    updateUIClasses();
    updateStats();
    updateCursorPosition();
    
    if (state.currentIndex === state.text.length) {
        endTest();
    }
}

function updateUIClasses() {
    const inputVal = elements.typingInput.value;
    for (let i = 0; i < state.text.length; i++) {
        const charEl = document.getElementById(`char-${i}`);
        charEl.classList.remove('correct', 'incorrect', 'current');
        
        if (i < inputVal.length) {
            if (inputVal[i] === state.text[i]) {
                charEl.classList.add('correct');
            } else {
                charEl.classList.add('incorrect');
            }
        } else if (i === inputVal.length) {
            charEl.classList.add('current');
        }
    }
}

function updateCursorPosition() {
    const currentCharEl = document.getElementById(`char-${state.currentIndex}`) || 
                         document.getElementById(`char-${state.text.length - 1}`);
    if (currentCharEl) {
        const rect = currentCharEl.getBoundingClientRect();
        const containerRect = elements.textDisplay.getBoundingClientRect();
        
        let left = rect.left - containerRect.left;
        let top = rect.top - containerRect.top;
        
        // If at the end of text, move cursor after the last character
        if (state.currentIndex === state.text.length) {
            left += rect.width;
        }
        
        elements.cursor.style.left = `${left + 40}px`; // 40px is padding
        elements.cursor.style.top = `${top + 40}px`;
    }
}

function updateTimer() {
    state.timeLeft--;
    elements.timer.innerText = `${state.timeLeft}s`;
    
    if (state.timeLeft <= 0) {
        endTest();
    }
    updateStats();
}

function updateStats() {
    const timeSpent = state.timeLimit - state.timeLeft;
    const wpm = timeSpent > 0 ? Math.round((state.charsTyped / 5) / (timeSpent / 60)) : 0;
    const accuracy = state.charsTyped > 0 ? Math.round(((state.charsTyped - state.mistakes) / state.charsTyped) * 100) : 100;
    
    elements.liveWpm.innerText = wpm;
    elements.liveAccuracy.innerText = `${accuracy}%`;
    elements.mistakes.innerText = state.mistakes;
}

function endTest() {
    state.isTestRunning = false;
    clearInterval(state.timer);
    
    const timeSpent = state.timeLimit - state.timeLeft;
    const wpm = timeSpent > 0 ? Math.round((state.charsTyped / 5) / (timeSpent / 60)) : 0;
    const accuracy = state.charsTyped > 0 ? Math.max(0, Math.round(((state.charsTyped - state.mistakes) / state.charsTyped) * 100)) : 0;
    
    elements.finalWpm.innerText = wpm;
    elements.finalAccuracy.innerText = `${accuracy}%`;
    elements.finalChars.innerText = state.charsTyped;
    elements.finalMistakes.innerText = state.mistakes;
    
    elements.testArea.classList.add('hidden');
    elements.resultsArea.classList.remove('hidden');
    
    localStorage.setItem('zee_type_last_wpm', wpm);
    elements.lastWpm.innerText = wpm;
    
    saveToLeaderboard(wpm, accuracy);
}

function saveToLeaderboard(wpm, accuracy) {
    const entry = {
        name: "Anonymous", // Simple version, could add name prompt
        wpm,
        accuracy,
        date: new Date().toLocaleDateString()
    };
    
    state.leaderboard.push(entry);
    state.leaderboard.sort((a, b) => b.wpm - a.wpm);
    state.leaderboard = state.leaderboard.slice(0, 10);
    
    localStorage.setItem('zee_type_leaderboard', JSON.stringify(state.leaderboard));
    updateLeaderboard();
}

function updateLeaderboard() {
    if (state.leaderboard.length === 0) {
        elements.noData.classList.remove('hidden');
        elements.leaderboardBody.innerHTML = "";
        return;
    }
    
    elements.noData.classList.add('hidden');
    elements.leaderboardBody.innerHTML = state.leaderboard.map((entry, index) => `
        <tr>
            <td>#${index + 1}</td>
            <td>${entry.name}</td>
            <td class="accent-text"><strong>${entry.wpm}</strong></td>
            <td>${entry.accuracy}%</td>
            <td>${entry.date}</td>
        </tr>
    `).join('');
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
        document.body.classList.replace('dark-mode', 'light-mode');
        elements.themeToggle.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
    } else {
        document.body.classList.replace('light-mode', 'dark-mode');
        elements.themeToggle.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    }
}

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    elements.soundToggle.classList.toggle('active');
    showToast(state.soundEnabled ? "Sound Enabled" : "Sound Muted");
}

function playSound(type) {
    if (!state.soundEnabled) return;
    // Synthesis audio for zero external dependencies
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'key') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }
}

function showToast(msg) {
    elements.toast.innerText = msg;
    elements.toast.classList.remove('hidden');
    setTimeout(() => {
        elements.toast.classList.add('hidden');
    }, 2000);
}

// Start
init();
