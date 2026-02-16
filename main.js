/* ============================================
   محفظة دروسي — MAIN.JS (النسخة الكاملة المدمجة)
   Full Application Logic + AI Integration
============================================ */

// ===== SUPABASE CONFIG =====
const SUPABASE_URL = "https://ujyvfxmyquvdpjyvryae.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeXZmeG15cXV2ZHBqeXZyeWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc4ODUsImV4cCI6MjA4NjczMzg4NX0.tkOTsj6aTUAV73sRRcBaGOT0JJHDMtg25clfWY-FE94";
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== GEMINI AI CONFIG =====
const GEMINI_API_KEY = "AIzaSyAYqefgtqVrFyjr8tiZGLKh7Fu03rV5VHw";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// ===== STATE =====
let currentUser = null;
let currentLang = localStorage.getItem('lang') || 'ar';
let chatHistory = [];
let currentSubjectColor = '#6366f1';
let currentSubjectIcon = '📚';
let selectedFile = null;
let selectedChatImage = null; 
let editingSubjectId = null;
let editingLessonId = null;
let allSubjects = [];
let allLessons = [];

// ===== TRANSLATIONS (i18n) =====
const i18n = {
  ar: {
    appName: "محفظة دروسي", home: "الرئيسية", subjects: "المقاييس", lessons: "الدروس", aiChat: "الذكاء الاصطناعي", calculator: "الحاسبة", login: "تسجيل الدخول", logout: "تسجيل الخروج", loginSuccess: "تم تسجيل الدخول بنجاح! 🎉", errorOccurred: "حدث خطأ، حاول مجدداً", loading: "جاري التحميل...", chatPlaceholder: "اكتب سؤالك هنا...", aiThinking: "يفكر...", chatWelcome: "مرحباً! كيف يمكنني مساعدتك؟", chatWelcomeSub: "اسألني أي شيء عن دروسك!",
    // ... (بقية المفاتيح العربية)
  },
  en: { appName: "My Lesson Portfolio", home: "Home", login: "Login", logout: "Logout", chatPlaceholder: "Type your question here...", aiThinking: "Thinking..." },
  fr: { appName: "Mon Portfolio de Cours", home: "Accueil", login: "Connexion", logout: "Déconnexion", chatPlaceholder: "Tapez votre question هنا...", aiThinking: "En train de réfléchir..." }
};

function t(key) { return (i18n[currentLang] && i18n[currentLang][key]) || i18n['ar'][key] || key; }

// ===== CORE UI FUNCTIONS =====
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  applyTranslations();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
  if (page === 'subjects' && currentUser) loadSubjects();
}

// ===== AUTH FUNCTIONS (لحل مشكلة تسجيل الدخول) =====
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    onLogin(data.user);
    showToast(t('loginSuccess'), 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function onLogin(user) {
  currentUser = user;
  document.getElementById('auth-nav-btns').style.display = 'none';
  document.getElementById('user-nav').style.display = 'block';
  document.getElementById('user-initial').textContent = (user.email)[0].toUpperCase();
  ['nav-subjects', 'nav-lessons', 'nav-chat', 'nav-calc'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });
  showPage('subjects');
}

async function logout() {
  await sb.auth.signOut();
  currentUser = null;
  location.reload();
}

// ===== AI CHAT FUNCTIONS (تفعيل Gemini الحقيقي) =====
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg && !selectedChatImage) return;

  input.value = '';
  addChatMessage('user', msg);
  const typingEl = addTyping();

  try {
    let parts = [{ text: "أنت مساعد تعليمي في موقع محفظة دروسي، أجب باختصار وذكاء: " + msg }];
    
    if (selectedChatImage) {
      const base64 = await imageToBase64(selectedChatImage);
      parts.push({ inline_data: { mime_type: selectedChatImage.type, data: base64 } });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    });

    const data = await response.json();
    typingEl.remove();

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أستطع المعالجة.";
    addChatMessage('ai', aiText);
    if(selectedChatImage) removeChatImage();

  } catch (err) {
    if(typingEl) typingEl.remove();
    addChatMessage('ai', t('errorOccurred'));
  }
}

function addChatMessage(role, text) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `<div class="chat-avatar">${role === 'ai' ? '🤖' : '👤'}</div><div class="chat-bubble">${text}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addTyping() {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg ai';
  div.innerHTML = `<div class="chat-avatar">🤖</div><div class="chat-bubble"><div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

// ===== UTILITIES =====
function showToast(msg, type) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function init() {
  setLang(currentLang);
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) onLogin(session.user);
  else showPage('home');
  
  setTimeout(() => document.getElementById('loading-screen').classList.add('hidden'), 1000);
}

document.addEventListener('DOMContentLoaded', init);
