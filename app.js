const API_BASE_URL = 'https://selfdestructmessageapi-1987e7a10253.herokuapp.com/api/Secret';

const createSection = document.getElementById('createSection');
const viewSection = document.getElementById('viewSection');
const messageInput = document.getElementById('messageInput');
const durationInput = document.getElementById('durationInput');
const durationRange = document.getElementById('durationRange');
const createBtn = document.getElementById('createBtn');
const resultSection = document.getElementById('resultSection');
const resultUrl = document.getElementById('resultUrl');
const copyBtn = document.getElementById('copyBtn');
const newMessageBtn = document.getElementById('newMessageBtn');

const messageLoading = document.getElementById('messageLoading');
const messageContent = document.getElementById('messageContent');
const messageDestroyed = document.getElementById('messageDestroyed');
const messageNotFound = document.getElementById('messageNotFound');
const secretMessage = document.getElementById('secretMessage');
const timerText = document.getElementById('timerText');
const timerCircle = document.getElementById('timerCircle');

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    let messageId = null;
    
    if (hash && hash.startsWith('#')) {
        messageId = hash.substring(1);
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        messageId = urlParams.get('id');
    }
    
    if (messageId) {
        showViewSection(messageId);
    } else {
        showCreateSection();
    }
});

durationRange.addEventListener('input', () => {
    durationInput.value = durationRange.value;
});

durationInput.addEventListener('input', () => {
    let value = parseInt(durationInput.value) || 5;
    value = Math.max(5, Math.min(60, value));
    durationInput.value = value;
    durationRange.value = value;
});

createBtn.addEventListener('click', async () => {
    const message = messageInput.value.trim();
    const duration = parseInt(durationInput.value) || 15;
    
    if (!message) {
        shakeElement(messageInput);
        messageInput.focus();
        return;
    }
    
    createBtn.classList.add('loading');
    createBtn.disabled = true;
    
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                duration: duration
            })
        });
        
        if (!response.ok) {
            throw new Error('Mesaj oluşturulamadı');
        }
        
        const data = await response.json();
        
        const frontendUrl = `${window.location.origin}${window.location.pathname}#${data.id}`;
        resultUrl.value = frontendUrl;
        
        resultSection.classList.remove('hidden');
        messageInput.value = '';
        
    } catch (error) {
        console.error('Error:', error);
        alert('Bir hata oluştu. API bağlantısını kontrol edin.');
    } finally {
        createBtn.classList.remove('loading');
        createBtn.disabled = false;
    }
});

copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(resultUrl.value);
        copyBtn.textContent = '✅';
        setTimeout(() => {
            copyBtn.textContent = '📋';
        }, 2000);
    } catch (err) {
        resultUrl.select();
        document.execCommand('copy');
        copyBtn.textContent = '✅';
        setTimeout(() => {
            copyBtn.textContent = '📋';
        }, 2000);
    }
});

newMessageBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    messageInput.focus();
});

function showCreateSection() {
    createSection.classList.remove('hidden');
    viewSection.classList.add('hidden');
}

async function showViewSection(messageId) {
    createSection.classList.add('hidden');
    viewSection.classList.remove('hidden');
    
    messageLoading.classList.remove('hidden');
    messageContent.classList.add('hidden');
    messageDestroyed.classList.add('hidden');
    messageNotFound.classList.add('hidden');
    
    try {
        const response = await fetch(`${API_BASE_URL}/${messageId}`);
        
        if (response.status === 404) {
            showNotFound();
            return;
        }
        
        if (!response.ok) {
            throw new Error('Mesaj alınamadı');
        }
        
        const data = await response.json();
        displayMessage(data.message, data.duration, data.firstReadTime);
        
    } catch (error) {
        console.error('Error:', error);
        showNotFound();
    }
}

function displayMessage(message, duration, firstReadTime) {
    messageLoading.classList.add('hidden');
    messageContent.classList.remove('hidden');
    
    secretMessage.textContent = message;
    
    let timeLeft = duration;
    if (firstReadTime) {
        let readTimeStr = String(firstReadTime);
        if (!readTimeStr.endsWith('Z') && !readTimeStr.includes('+')) {
            readTimeStr += 'Z';
        }
        const readTime = new Date(readTimeStr);
        const now = Date.now();
        const elapsed = Math.floor((now - readTime.getTime()) / 1000);
        
        if (elapsed >= 0 && elapsed < duration) {
            timeLeft = duration - elapsed;
        } else if (elapsed < 0) {
            timeLeft = duration;
        }
    }
    
    if (timeLeft <= 0) {
        destroyMessage();
        return;
    }
    
    const circumference = 2 * Math.PI * 46;
    const initialProgress = (duration - timeLeft) / duration;
    
    timerCircle.style.strokeDasharray = circumference;
    timerCircle.style.strokeDashoffset = circumference * initialProgress;
    timerText.textContent = timeLeft;
    
    const timer = setInterval(() => {
        timeLeft--;
        timerText.textContent = timeLeft;
        
        const progress = (duration - timeLeft) / duration;
        timerCircle.style.strokeDashoffset = circumference * progress;
        
        if (timeLeft <= 5) {
            timerText.style.animation = 'blink 0.5s ease-in-out infinite';
        }
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            destroyMessage();
        }
    }, 1000);
}

function destroyMessage() {
    messageContent.classList.add('hidden');
    messageDestroyed.classList.remove('hidden');
    
    history.replaceState(null, '', window.location.pathname);
}

function showNotFound() {
    messageLoading.classList.add('hidden');
    messageNotFound.classList.remove('hidden');
}

function shakeElement(element) {
    element.style.animation = 'none';
    element.offsetHeight;
    element.style.animation = 'shake 0.5s ease';
}

const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        createBtn.click();
    }
});

let currentLang = localStorage.getItem('lang') || 'tr';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    
    document.querySelectorAll('[data-tr]').forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
    });
    
    document.querySelectorAll('[data-tr-placeholder]').forEach(el => {
        el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
    });
    
    document.getElementById('langTR').classList.toggle('active', lang === 'tr');
    document.getElementById('langEN').classList.toggle('active', lang === 'en');
    
    document.documentElement.lang = lang;
}

document.getElementById('langTR').addEventListener('click', () => setLanguage('tr'));
document.getElementById('langEN').addEventListener('click', () => setLanguage('en'));

setLanguage(currentLang);
