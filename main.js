/* ============================================
   محفظة دروسي — MAIN.JS (النسخة الكاملة والنهائية)
============================================ */

// ===== 1. الإعدادات (CONFIG) =====
const SUPABASE_URL = "https://ujyvfxmyquvdpjyvryae.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeXZmeG15cXV2ZHBqeXZyeWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc4ODUsImV4cCI6MjA4NjczMzg4NX0.tkOTsj6aTUAV73sRRcBaGOT0JJHDMtg25clfWY-FE94";
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const GEMINI_API_KEY = "AIzaSyAYqefgtqVrFyjr8tiZGLKh7Fu03rV5VHw";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// ===== 2. الحالة العامة (STATE) =====
let currentUser = null;
let currentLang = localStorage.getItem('lang') || 'ar';
let chatHistory = [];
let selectedChatImage = null;

// ===== 3. وظيفة الذكاء الاصطناعي (AI FUNCTION) =====

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg && !selectedChatImage) return;
  
  // تنظيف الحقل فوراً
  input.value = '';
  
  // 1. إضافة رسالة الطالب للواجهة
  addChatMessage('user', msg);
  
  // 2. إضافة رسالة انتظار "جاري التفكير..."
  const typingEl = addTyping();
  
  try {
    const parts = [{ text: "أنت مساعد تعليمي خبير في موقع محفظة دروسي. أجب باختصار على: " + msg }];
    
    // دعم الصور إذا تم رفعها في الشات
    if (selectedChatImage) {
      const base64Data = await imageToBase64(selectedChatImage);
      parts.push({ inline_data: { mime_type: selectedChatImage.type, data: base64Data } });
    }

    // 3. الاتصال بـ Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    });

    const data = await response.json();
    typingEl.remove(); // حذف علامة التحميل

    if (data.candidates && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      addChatMessage('ai', aiResponse);
    } else {
      addChatMessage('ai', "عذراً، لم أستطع فهم السؤال.");
    }

  } catch (error) {
    typingEl.remove();
    addChatMessage('ai', "حدث خطأ في الاتصال بالذكاء الاصطناعي.");
    console.error(error);
  }
}

// دالة تحويل الصورة لـ Base64
function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// دالة إضافة الرسائل للواجهة
function addChatMessage(role, text) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `
    <div class="chat-avatar">${role === 'ai' ? '🤖' : '👤'}</div>
    <div class="chat-bubble">${text}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// دالة حركة التحميل
function addTyping() {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg ai';
  div.innerHTML = `<div class="chat-avatar">🤖</div><div class="chat-bubble"><div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

// ===== 4. بقية وظائف الموقع (تنقل، لغات، إلخ) =====

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

async function init() {
  setLang(currentLang);
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) currentUser = session.user;
  showPage('home');
  
  // إخفاء شاشة التحميل
  setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader) loader.classList.add('hidden');
  }, 1000);
}

document.addEventListener('DOMContentLoaded', init);
