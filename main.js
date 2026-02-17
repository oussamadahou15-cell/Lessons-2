/* ============================================
   محفظة دروسي v2.0 — Social Platform JS
============================================ */
const SUPABASE_URL = "https://ujyvfxmyquvdpjyvryae.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeXZmeG15cXV2ZHBqeXZyeWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc4ODUsImV4cCI6MjA4NjczMzg4NX0.tkOTsj6aTUAV73sRRcBaGOT0JJHDMtg25clfWY-FE94";
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// STATE
let currentUser = null, currentProfile = null;
let currentLang = localStorage.getItem('lang') || 'ar';
let chatHistory = [], allSubjects = [], allLessons = [];
let currentSubjectColor = '#6366f1', currentSubjectIcon = '📚';
let selectedFile = null, selectedPostFile = null;
let viewingUserId = null, currentConvUserId = null;
let realtimeChannel = null;

// ============================
// THEME
// ============================
function toggleTheme() {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  document.getElementById('theme-icon').textContent = t === 'dark' ? '☀️' : '🌙';
}
function initTheme() {
  const t = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('theme-icon').textContent = t === 'dark' ? '☀️' : '🌙';
}

// ============================
// LANGUAGE
// ============================
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dataset.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', (lang==='ar'&&b.textContent==='ع')||(lang==='en'&&b.textContent==='EN')||(lang==='fr'&&b.textContent==='FR'));
  });
}

// ============================
// TOAST
// ============================
function showToast(msg, type = 'info') {
  const icons = {success:'✅',error:'❌',info:'ℹ️'};
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 400); }, 3500);
}

// ============================
// PAGE NAVIGATION
// ============================
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) { el.classList.add('active'); window.scrollTo(0,0); }
  document.querySelectorAll('.sidebar-nav-btn').forEach(b => b.classList.remove('active'));
  if (page === 'feed') loadFeed();
  if (page === 'subjects' && currentUser) loadSubjects();
  if (page === 'lessons' && currentUser) loadLessons();
  if (page === 'discover') loadDiscover();
  if (page === 'friends') loadFriends('all');
  if (page === 'messages') loadConversations();
  if (page === 'settings') loadSettings();
}

// ============================
// MOBILE MENU
// ============================
function toggleMobileMenu() {
  document.getElementById('hamburger').classList.toggle('active');
}
function toggleUserMenu() {
  document.getElementById('user-dropdown').classList.toggle('open');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.user-avatar-nav')) {
    const d = document.getElementById('user-dropdown');
    if (d) d.classList.remove('open');
  }
  if (!e.target.closest('#notif-btn')) {
    const d = document.getElementById('notif-dropdown');
    if (d) d.classList.remove('open');
  }
  if (!e.target.closest('.nav-search')) {
    const d = document.getElementById('search-results');
    if (d) d.innerHTML = '';
  }
});

// ============================
// MODAL
// ============================
function openModal(id) { document.getElementById(id).classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow=''; }
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if(e.target===o) closeModal(o.id); });
});

// ============================
// AUTH
// ============================
async function loginWithGoogle() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) showToast(error.message, 'error');
}

async function loginWithFacebook() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'facebook',
    options: { redirectTo: window.location.origin }
  });
  if (error) showToast(error.message, 'error');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    showToast('مرحباً بعودتك! 🎉', 'success');
    await onLogin(data.user);
  } catch (err) { showToast(err.message, 'error'); }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim().toLowerCase().replace(/\s/g,'_');
  const university = document.getElementById('reg-university').value.trim();
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  try {
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: name, username, university } }
    });
    if (error) throw error;
    if (data.user) {
      await createOrUpdateProfile(data.user, { full_name: name, username, university });
      showToast('تم إنشاء الحساب! 🎉', 'success');
      await onLogin(data.user);
    } else {
      showToast('تحقق من بريدك الإلكتروني ✉️', 'info');
      showPage('login');
    }
  } catch (err) { showToast(err.message, 'error'); }
}

async function handleForgot(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value;
  const { error } = await sb.auth.resetPasswordForEmail(email);
  if (error) showToast(error.message, 'error');
  else { showToast('تم إرسال الرابط ✉️', 'success'); showPage('login'); }
}

async function logout() {
  if (realtimeChannel) sb.removeChannel(realtimeChannel);
  await sb.auth.signOut();
  currentUser = null; currentProfile = null;
  onLogout();
}

async function onLogin(user) {
  currentUser = user;
  currentProfile = await fetchProfile(user.id);
  if (!currentProfile) {
    const meta = user.user_metadata || {};
    await createOrUpdateProfile(user, { full_name: meta.full_name || meta.name || user.email.split('@')[0], username: meta.username || user.email.split('@')[0], university: meta.university || '' });
    currentProfile = await fetchProfile(user.id);
  }
  document.getElementById('auth-nav-btns').style.display = 'none';
  document.getElementById('user-nav').style.display = 'block';
  document.getElementById('nav-search-wrap').style.display = 'block';
  document.getElementById('notif-btn').style.display = 'block';
  document.getElementById('msg-btn').style.display = 'block';
  document.getElementById('mobile-bottom-nav').style.display = 'flex';
  const initial = (currentProfile?.full_name || user.email || 'أ')[0].toUpperCase();
  document.getElementById('user-initial').textContent = initial;
  document.getElementById('user-name-drop').textContent = currentProfile?.full_name || '';
  document.getElementById('user-email-drop').textContent = user.email;
  if (currentProfile?.avatar_url) {
    const img = document.getElementById('user-avatar-img');
    img.src = currentProfile.avatar_url; img.style.display = 'block';
    document.getElementById('user-initial').style.display = 'none';
  }
  setupRealtime();
  loadNotifications();
  showPage('feed');
}

function onLogout() {
  document.getElementById('auth-nav-btns').style.display = 'flex';
  document.getElementById('user-nav').style.display = 'none';
  document.getElementById('nav-search-wrap').style.display = 'none';
  document.getElementById('notif-btn').style.display = 'none';
  document.getElementById('msg-btn').style.display = 'none';
  document.getElementById('mobile-bottom-nav').style.display = 'none';
  showPage('home');
}

async function fetchProfile(userId) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return data;
}

async function createOrUpdateProfile(user, extra = {}) {
  await sb.from('profiles').upsert({
    id: user.id,
    full_name: extra.full_name || user.user_metadata?.full_name || '',
    username: extra.username || user.user_metadata?.username || user.email.split('@')[0],
    university: extra.university || user.user_metadata?.university || '',
    avatar_url: user.user_metadata?.avatar_url || '',
    email: user.email,
    updated_at: new Date().toISOString()
  });
}

function togglePass(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

// ============================
// REALTIME
// ============================
function setupRealtime() {
  if (!currentUser) return;
  realtimeChannel = sb.channel('realtime-all')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, (payload) => {
      loadConversations();
      if (currentConvUserId === payload.new.sender_id) appendMessage(payload.new, false);
      updateMsgBadge();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, () => {
      loadNotifications();
    })
    .subscribe();
}

// ============================
// PROFILES
// ============================
function getAvatarHtml(profile, size = 40) {
  const s = size;
  if (profile?.avatar_url) {
    return `<img src="${escHtml(profile.avatar_url)}" style="width:${s}px;height:${s}px;border-radius:50%;object-fit:cover"/>`;
  }
  const name = profile?.full_name || profile?.username || '?';
  const initial = name[0].toUpperCase();
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return `<span style="display:flex;align-items:center;justify-content:center;width:${s}px;height:${s}px;border-radius:50%;background:${color};color:white;font-weight:700;font-size:${s*0.35}px;flex-shrink:0">${initial}</span>`;
}

// ============================
// FEED
// ============================
async function loadFeed() {
  if (!currentUser) return;
  const feedEl = document.getElementById('posts-feed');
  if (!feedEl) return;
  feedEl.innerHTML = `<div class="loading-placeholder"><div class="spinner"></div><p>جاري التحميل...</p></div>`;
  updateSidebarProfile();
  loadFriendRequestsWidget();
  loadSuggestionsWidget();
  try {
    const { data: posts, error } = await sb.from('posts')
      .select('*, profiles(id,full_name,username,avatar_url,university), subjects(name,color)')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    if (!posts || !posts.length) {
      feedEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><h3>لا توجد منشورات بعد</h3><p>كن أول من ينشر درساً!</p></div>`;
      return;
    }
    feedEl.innerHTML = posts.map(p => renderPost(p)).join('');
    // Update post creator avatar
    const creatorAvatar = document.getElementById('post-creator-avatar');
    if (creatorAvatar) creatorAvatar.innerHTML = getAvatarHtml(currentProfile, 40);
  } catch(err) {
    feedEl.innerHTML = `<div class="empty-state"><p style="color:var(--danger)">${err.message}</p></div>`;
  }
}

function renderPost(post) {
  const profile = post.profiles || {};
  const avatarHtml = getAvatarHtml(profile, 42);
  const timeAgo = getTimeAgo(post.created_at);
  const isOwner = currentUser && post.user_id === currentUser.id;
  const subjectTag = post.subjects ? `<span class="post-subject-tag" style="background:${post.subjects.color||'#6366f1'}">${escHtml(post.subjects.name)}</span>` : '';
  let fileHtml = '';
  if (post.file_url) {
    const type = (post.file_type||'').toLowerCase();
    if (type.includes('image')||/\.(png|jpg|jpeg|gif|webp)$/i.test(post.file_url)) {
      fileHtml = `<div class="post-file-preview"><img src="${escHtml(post.file_url)}" alt="صورة" loading="lazy" onclick="viewFile('${escHtml(post.file_url)}','${type}','${escHtml(post.title||'ملف')}')"/></div>`;
    } else if (type.includes('video')||/\.(mp4|webm)$/i.test(post.file_url)) {
      fileHtml = `<div class="post-file-preview"><video controls src="${escHtml(post.file_url)}"></video></div>`;
    } else if (type.includes('audio')||/\.(mp3|wav)$/i.test(post.file_url)) {
      fileHtml = `<div class="post-file-preview"><audio controls src="${escHtml(post.file_url)}" style="width:100%;padding:.7rem"></audio></div>`;
    } else {
      const icon = getFileIcon(post.file_type);
      fileHtml = `<div class="post-file-preview"><div class="post-file-card" onclick="viewFile('${escHtml(post.file_url)}','${type}','${escHtml(post.title||'ملف')}')"><span class="post-file-icon">${icon}</span><div class="post-file-info"><div class="post-file-name">${escHtml(post.title||'ملف')}</div><div class="post-file-size">${(post.file_type||'').toUpperCase()}</div></div><span style="margin-right:auto;color:var(--primary);font-size:.8rem">عرض ⬆</span></div></div>`;
    }
  }
  const liked = post.liked_by && Array.isArray(post.liked_by) && post.liked_by.includes(currentUser?.id);
  const stars = [1,2,3,4,5].map(n => `<button class="star-btn" onclick="ratePost('${post.id}',${n})" title="${n} نجوم">${n<=(post.avg_rating||0)?'⭐':'☆'}</button>`).join('');
  return `
  <div class="post-card" id="post-${post.id}">
    <div class="post-header">
      <div class="post-author-avatar" onclick="viewProfile('${profile.id}')">${avatarHtml}</div>
      <div class="post-author-info">
        <div class="post-author-name" onclick="viewProfile('${profile.id}')">${escHtml(profile.full_name||'مستخدم')} ${subjectTag}</div>
        <div class="post-author-meta">@${escHtml(profile.username||'')} · ${timeAgo}</div>
      </div>
      ${isOwner ? `<button class="post-menu-btn" onclick="deletePost('${post.id}')">🗑</button>` : ''}
    </div>
    <div class="post-body">
      ${post.text ? `<div class="post-text">${escHtml(post.text)}</div>` : ''}
      ${fileHtml}
    </div>
    <div class="post-footer">
      <button class="post-action-btn ${liked?'liked':''}" onclick="toggleLike('${post.id}',this)">
        ${liked?'❤️':'🤍'} <span class="like-count">${post.likes_count||0}</span>
      </button>
      <button class="post-action-btn" onclick="openComments('${post.id}')">💬 <span>${post.comments_count||0}</span></button>
      <button class="post-action-btn" onclick="sharePost('${post.id}')">↗️</button>
      <div class="post-stars">${stars}</div>
    </div>
  </div>`;
}

async function toggleLike(postId, btn) {
  if (!currentUser) return;
  const countEl = btn.querySelector('.like-count');
  const isLiked = btn.classList.contains('liked');
  try {
    if (isLiked) {
      await sb.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      btn.classList.remove('liked');
      btn.innerHTML = `🤍 <span class="like-count">${Math.max(0,(parseInt(countEl.textContent)||1)-1)}</span>`;
      await sb.from('posts').update({ likes_count: Math.max(0,(parseInt(countEl.textContent)||1)-1) }).eq('id', postId);
    } else {
      await sb.from('likes').insert({ post_id: postId, user_id: currentUser.id });
      btn.classList.add('liked');
      const newCount = (parseInt(countEl.textContent)||0)+1;
      btn.innerHTML = `❤️ <span class="like-count">${newCount}</span>`;
      await sb.from('posts').update({ likes_count: newCount }).eq('id', postId);
      // Get post owner
      const { data: post } = await sb.from('posts').select('user_id').eq('id', postId).single();
      if (post && post.user_id !== currentUser.id) {
        await createNotification(post.user_id, 'like', `أعجب ${currentProfile?.full_name||'شخص'} بمنشورك`, postId);
      }
    }
  } catch(err) { console.error(err); }
}

async function ratePost(postId, rating) {
  if (!currentUser) return;
  try {
    await sb.from('ratings').upsert({ post_id: postId, user_id: currentUser.id, rating });
    const { data: ratings } = await sb.from('ratings').select('rating').eq('post_id', postId);
    if (ratings && ratings.length) {
      const avg = ratings.reduce((s,r) => s+r.rating, 0) / ratings.length;
      await sb.from('posts').update({ avg_rating: avg }).eq('id', postId);
    }
    showToast(`تم التقييم بـ ${rating} ⭐`, 'success');
    loadFeed();
  } catch(err) { showToast(err.message, 'error'); }
}

function openComments(postId) {
  document.getElementById('current-post-id').value = postId;
  loadComments(postId);
  openModal('comments-modal');
}

async function loadComments(postId) {
  const list = document.getElementById('comments-list');
  list.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div></div>';
  const { data } = await sb.from('comments').select('*, profiles(full_name,username,avatar_url)').eq('post_id', postId).order('created_at');
  if (!data || !data.length) { list.innerHTML = '<p style="text-align:center;color:var(--text3);padding:1.5rem">لا توجد تعليقات بعد</p>'; return; }
  list.innerHTML = data.map(c => `
    <div class="comment-item">
      <div class="comment-avatar">${getAvatarHtml(c.profiles, 32)}</div>
      <div class="comment-body">
        <div class="comment-author">${escHtml(c.profiles?.full_name||'مستخدم')}</div>
        <div class="comment-text">${escHtml(c.text)}</div>
        <div class="comment-time">${getTimeAgo(c.created_at)}</div>
      </div>
    </div>`).join('');
}

async function submitComment() {
  const postId = document.getElementById('current-post-id').value;
  const text = document.getElementById('comment-input').value.trim();
  if (!text || !postId || !currentUser) return;
  document.getElementById('comment-input').value = '';
  try {
    await sb.from('comments').insert({ post_id: postId, user_id: currentUser.id, text });
    const { data: post } = await sb.from('posts').select('user_id,comments_count').eq('id', postId).single();
    if (post) {
      await sb.from('posts').update({ comments_count: (post.comments_count||0)+1 }).eq('id', postId);
      if (post.user_id !== currentUser.id) {
        await createNotification(post.user_id, 'comment', `علّق ${currentProfile?.full_name||'شخص'} على منشورك`, postId);
      }
    }
    loadComments(postId);
  } catch(err) { showToast(err.message, 'error'); }
}

function sharePost(postId) {
  const url = `${window.location.origin}${window.location.pathname}#post-${postId}`;
  if (navigator.share) { navigator.share({ title: 'محفظة دروسي', url }); }
  else { navigator.clipboard.writeText(url); showToast('تم نسخ الرابط ✓', 'success'); }
}

async function deletePost(postId) {
  if (!confirm('حذف المنشور؟')) return;
  await sb.from('posts').delete().eq('id', postId).eq('user_id', currentUser.id);
  showToast('تم الحذف', 'success');
  loadFeed();
}

// ============================
// POST CREATION
// ============================
function openPostModal(type = null) {
  if (!currentUser) { showPage('login'); return; }
  loadSubjects();
  setTimeout(() => {
    const sel = document.getElementById('post-subject');
    if (sel) sel.innerHTML = '<option value="">بدون مقياس</option>' + allSubjects.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
  }, 500);
  openModal('post-modal');
  if (type === 'file' || type === 'image' || type === 'video') {
    setTimeout(() => document.getElementById('post-file-input').click(), 300);
  }
}

function handlePostFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  selectedPostFile = file;
  const preview = document.getElementById('post-file-preview');
  const icon = getFileIcon(file.type);
  const size = file.size > 1024*1024 ? (file.size/(1024*1024)).toFixed(1)+'MB' : (file.size/1024).toFixed(0)+'KB';
  preview.style.display = 'flex';
  preview.style.cssText = 'display:flex;align-items:center;gap:.7rem;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:.65rem 1rem;margin-top:.5rem';
  preview.innerHTML = `<span style="font-size:1.8rem">${icon}</span><div style="flex:1"><div style="font-size:.82rem;font-weight:600;color:var(--text)">${escHtml(file.name)}</div><div style="font-size:.72rem;color:var(--text3)">${size}</div></div><button type="button" onclick="selectedPostFile=null;document.getElementById('post-file-preview').style.display='none'" style="background:none;border:none;cursor:pointer;font-size:1rem">✕</button>`;
}

function dropPostFile(e) {
  e.preventDefault();
  document.getElementById('post-upload-zone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) { document.getElementById('post-file-input').files = e.dataTransfer.files; handlePostFile({target:{files:[file]}}); }
}

async function submitPost(e) {
  e.preventDefault();
  const text = document.getElementById('post-text').value.trim();
  const subjectId = document.getElementById('post-subject').value;
  if (!text && !selectedPostFile) { showToast('اكتب شيئاً أو أضف ملفاً', 'error'); return; }
  const submitBtn = e.target.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  try {
    let fileUrl = null, fileType = null, title = text.substring(0,60)||'درس';
    if (selectedPostFile) {
      const prog = document.getElementById('post-progress-fill');
      document.getElementById('post-upload-progress').style.display = 'block';
      prog.style.width = '10%';
      const ext = selectedPostFile.name.split('.').pop();
      const path = `${currentUser.id}/posts/${Date.now()}.${ext}`;
      const { error: upErr } = await sb.storage.from('lessons').upload(path, selectedPostFile, { upsert: true });
      if (upErr) throw upErr;
      prog.style.width = '100%';
      const { data: { publicUrl } } = sb.storage.from('lessons').getPublicUrl(path);
      fileUrl = publicUrl; fileType = selectedPostFile.type || ext;
      title = selectedPostFile.name;
    }
    const { error } = await sb.from('posts').insert({
      user_id: currentUser.id,
      text: text || null,
      file_url: fileUrl,
      file_type: fileType,
      title,
      subject_id: subjectId || null,
      likes_count: 0,
      comments_count: 0,
      avg_rating: 0
    });
    if (error) throw error;
    showToast('تم النشر! 🚀', 'success');
    closeModal('post-modal');
    document.getElementById('post-form').reset();
    document.getElementById('post-file-preview').style.display = 'none';
    document.getElementById('post-upload-progress').style.display = 'none';
    selectedPostFile = null;
    loadFeed();
  } catch(err) { showToast(err.message, 'error'); }
  finally { submitBtn.disabled = false; }
}

// ============================
// FRIENDS / FOLLOW
// ============================
async function loadDiscover() {
  const res = document.getElementById('discover-results');
  if (!res) return;
  res.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div></div>';
  const { data } = await sb.from('profiles').select('*').neq('id', currentUser?.id||'').limit(40);
  renderUserCards(data||[], res);
}

async function discoverSearch(q) {
  const res = document.getElementById('discover-results');
  if (!q.trim()) { loadDiscover(); return; }
  const { data } = await sb.from('profiles').select('*').or(`full_name.ilike.%${q}%,username.ilike.%${q}%,university.ilike.%${q}%`).neq('id', currentUser?.id||'').limit(20);
  renderUserCards(data||[], res);
}

function renderUserCards(users, container) {
  if (!users.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h3>لا توجد نتائج</h3></div>'; return; }
  container.innerHTML = users.map(u => `
    <div class="user-card">
      <div class="user-card-avatar" onclick="viewProfile('${u.id}')">${getAvatarHtml(u, 64)}</div>
      <div class="user-card-name" onclick="viewProfile('${u.id}')">${escHtml(u.full_name||'مستخدم')}</div>
      <div class="user-card-username">@${escHtml(u.username||'')}</div>
      <div class="user-card-uni">${escHtml(u.university||'')}</div>
      <div class="user-card-actions" id="friend-actions-${u.id}">
        <button class="btn btn-primary-sm" onclick="sendFriendRequest('${u.id}')">+ إضافة</button>
        <button class="btn btn-outline-sm" onclick="viewProfile('${u.id}')">الملف</button>
      </div>
    </div>`).join('');
  checkFriendStatuses(users, container);
}

async function checkFriendStatuses(users, container) {
  if (!currentUser) return;
  const ids = users.map(u => u.id);
  const { data: friendships } = await sb.from('friendships').select('*').or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`).in('user_id', ids.concat([currentUser.id]));
  if (!friendships) return;
  users.forEach(u => {
    const fs = friendships.find(f => (f.user_id===currentUser.id&&f.friend_id===u.id)||(f.friend_id===currentUser.id&&f.user_id===u.id));
    const actionsEl = document.getElementById(`friend-actions-${u.id}`);
    if (!actionsEl) return;
    if (fs) {
      if (fs.status==='accepted') actionsEl.innerHTML = `<span style="color:var(--accent);font-size:.8rem;font-weight:600">✓ صديق</span><button class="btn btn-outline-sm" onclick="viewProfile('${u.id}')">الملف</button><button class="btn btn-outline-sm" onclick="openConversation('${u.id}')">💬</button>`;
      else if (fs.status==='pending' && fs.user_id===currentUser.id) actionsEl.innerHTML = `<span style="color:var(--text3);font-size:.8rem">طلب مرسل ⏳</span>`;
      else if (fs.status==='pending' && fs.friend_id===currentUser.id) actionsEl.innerHTML = `<button class="btn btn-primary-sm" onclick="respondFriendRequest('${fs.id}','accepted')">✓ قبول</button><button class="btn btn-outline-sm" onclick="respondFriendRequest('${fs.id}','rejected')">✗</button>`;
    }
  });
}

async function sendFriendRequest(toId) {
  if (!currentUser) return;
  const { error } = await sb.from('friendships').insert({ user_id: currentUser.id, friend_id: toId, status: 'pending' });
  if (error) { showToast(error.message, 'error'); return; }
  await createNotification(toId, 'friend_request', `أرسل ${currentProfile?.full_name||'شخص'} طلب صداقة`, null);
  showToast('تم إرسال طلب الصداقة ✓', 'success');
  loadDiscover();
}

async function respondFriendRequest(friendshipId, status) {
  await sb.from('friendships').update({ status }).eq('id', friendshipId);
  showToast(status==='accepted' ? 'تمت إضافة الصديق! 🎉' : 'تم رفض الطلب', status==='accepted'?'success':'info');
  loadFriends('requests');
}

async function loadFriends(tab) {
  const content = document.getElementById('friends-content');
  if (!content || !currentUser) return;
  content.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div></div>';
  if (tab === 'all') {
    const { data } = await sb.from('friendships').select('*, user:user_id(id,full_name,username,avatar_url,university), friend:friend_id(id,full_name,username,avatar_url,university)').eq('status','accepted').or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);
    const friends = (data||[]).map(f => f.user_id===currentUser.id ? f.friend : f.user).filter(Boolean);
    renderUserCards(friends, content);
  } else if (tab === 'requests') {
    const { data } = await sb.from('friendships').select('*, user:user_id(id,full_name,username,avatar_url,university)').eq('friend_id', currentUser.id).eq('status','pending');
    if (!data||!data.length) { content.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><h3>لا توجد طلبات معلقة</h3></div>'; return; }
    content.innerHTML = data.map(f => `
      <div class="user-card">
        <div class="user-card-avatar">${getAvatarHtml(f.user, 64)}</div>
        <div class="user-card-name">${escHtml(f.user?.full_name||'مستخدم')}</div>
        <div class="user-card-username">@${escHtml(f.user?.username||'')}</div>
        <div class="user-card-uni">${escHtml(f.user?.university||'')}</div>
        <div class="user-card-actions">
          <button class="btn btn-primary-sm" onclick="respondFriendRequest('${f.id}','accepted')">✓ قبول</button>
          <button class="btn btn-outline-sm" onclick="respondFriendRequest('${f.id}','rejected')">✗ رفض</button>
        </div>
      </div>`).join('');
  } else if (tab === 'sent') {
    const { data } = await sb.from('friendships').select('*, friend:friend_id(id,full_name,username,avatar_url,university)').eq('user_id', currentUser.id).eq('status','pending');
    const friends = (data||[]).map(f => f.friend).filter(Boolean);
    if (!friends.length) { content.innerHTML = '<div class="empty-state"><div class="empty-icon">📤</div><h3>لا توجد طلبات مرسلة</h3></div>'; return; }
    renderUserCards(friends, content);
  }
}

function switchFriendsTab(tab, btn) {
  document.querySelectorAll('.friends-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadFriends(tab);
}

// ============================
// MESSAGES
// ============================
async function loadConversations() {
  const list = document.getElementById('conversations-list');
  if (!list || !currentUser) return;
  const { data } = await sb.from('messages').select('*, sender:sender_id(id,full_name,username,avatar_url), receiver:receiver_id(id,full_name,username,avatar_url)').or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`).order('created_at', { ascending: false });
  if (!data||!data.length) { list.innerHTML = '<p style="text-align:center;color:var(--text3);padding:2rem;font-size:.85rem">لا توجد محادثات بعد</p>'; return; }
  const seen = new Set();
  const convs = [];
  data.forEach(m => {
    const otherId = m.sender_id===currentUser.id ? m.receiver_id : m.sender_id;
    if (!seen.has(otherId)) { seen.add(otherId); convs.push(m); }
  });
  list.innerHTML = convs.map(m => {
    const other = m.sender_id===currentUser.id ? m.receiver : m.sender;
    const unread = !m.read && m.receiver_id===currentUser.id;
    return `<div class="conversation-item ${currentConvUserId===other?.id?'active':''}" onclick="openConversation('${other?.id}')">
      <div class="conv-avatar">${getAvatarHtml(other, 44)}</div>
      <div class="conv-info">
        <div class="conv-name">${escHtml(other?.full_name||'مستخدم')}</div>
        <div class="conv-last-msg">${escHtml(m.text?.substring(0,35)||'ملف')}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem">
        <span class="conv-time">${getTimeAgo(m.created_at)}</span>
        ${unread ? '<span class="conv-unread-badge">!</span>' : ''}
      </div>
    </div>`;
  }).join('');
  updateMsgBadge();
}

async function updateMsgBadge() {
  if (!currentUser) return;
  const { count } = await sb.from('messages').select('id', {count:'exact'}).eq('receiver_id', currentUser.id).eq('read', false);
  const badge = document.getElementById('msg-badge');
  if (count > 0) { badge.textContent = count; badge.style.display = 'flex'; }
  else badge.style.display = 'none';
}

async function openConversation(userId) {
  currentConvUserId = userId;
  const profile = await fetchProfile(userId);
  const main = document.getElementById('messages-main');
  main.innerHTML = `
    <div class="chat-window-header">
      <div class="chat-window-avatar">${getAvatarHtml(profile, 40)}</div>
      <div>
        <div class="chat-window-name">${escHtml(profile?.full_name||'مستخدم')}</div>
        <div class="chat-window-status">متصل</div>
      </div>
      <button class="btn btn-outline-sm" style="margin-right:auto" onclick="viewProfile('${userId}')">الملف الشخصي</button>
    </div>
    <div id="chat-window-msgs" class="chat-window-msgs"></div>
    <div class="chat-window-input">
      <input type="text" id="msg-input" class="form-input" placeholder="اكتب رسالة..." onkeydown="if(event.key==='Enter')sendDirectMessage('${userId}')"/>
      <button class="btn btn-primary" onclick="sendDirectMessage('${userId}')">إرسال</button>
    </div>`;
  loadDirectMessages(userId);
  // Mark as read
  await sb.from('messages').update({ read: true }).eq('sender_id', userId).eq('receiver_id', currentUser.id);
  updateMsgBadge();
  loadConversations();
}

async function loadDirectMessages(userId) {
  const container = document.getElementById('chat-window-msgs');
  if (!container) return;
  const { data } = await sb.from('messages').select('*').or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`).order('created_at');
  if (!data||!data.length) { container.innerHTML = '<p style="text-align:center;color:var(--text3);padding:2rem;font-size:.85rem">ابدأ المحادثة الآن!</p>'; return; }
  container.innerHTML = data.map(m => {
    const sent = m.sender_id === currentUser.id;
    return `<div class="msg-bubble-wrap ${sent?'sent':'recv'}">
      <div class="msg-bubble">${escHtml(m.text||'')}</div>
    </div>`;
  }).join('');
  container.scrollTop = container.scrollHeight;
}

async function sendDirectMessage(toId) {
  const input = document.getElementById('msg-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  try {
    const { data, error } = await sb.from('messages').insert({ sender_id: currentUser.id, receiver_id: toId, text, read: false }).select().single();
    if (error) throw error;
    appendMessage(data, true);
    loadConversations();
  } catch(err) { showToast(err.message, 'error'); }
}

function appendMessage(msg, sent) {
  const container = document.getElementById('chat-window-msgs');
  if (!container) return;
  const div = document.createElement('div');
  div.className = `msg-bubble-wrap ${sent?'sent':'recv'}`;
  div.innerHTML = `<div class="msg-bubble">${escHtml(msg.text||'')}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function searchConversations(q) { if (!q) loadConversations(); }

// ============================
// PROFILE
// ============================
function showMyProfile() {
  if (currentUser) viewProfile(currentUser.id);
}

async function viewProfile(userId) {
  viewingUserId = userId;
  showPage('profile');
  const isOwn = userId === currentUser?.id;
  const profile = userId === currentUser?.id ? currentProfile : await fetchProfile(userId);
  // Cover
  const cover = document.getElementById('profile-cover');
  if (profile?.cover_url) cover.style.backgroundImage = `url(${profile.cover_url})`;
  cover.style.backgroundSize = 'cover'; cover.style.backgroundPosition = 'center';
  // Avatar
  document.getElementById('profile-avatar-display').innerHTML = getAvatarHtml(profile, 100);
  document.getElementById('profile-name-display').textContent = profile?.full_name || 'مستخدم';
  document.getElementById('profile-username-display').textContent = '@' + (profile?.username||'');
  document.getElementById('profile-uni-display').textContent = profile?.university ? '🎓 ' + profile.university : '';
  document.getElementById('profile-bio-display').textContent = profile?.bio || '';
  // Buttons
  const actionsEl = document.getElementById('profile-actions');
  if (isOwn) {
    document.getElementById('change-cover-btn').style.display = 'block';
    document.getElementById('change-avatar-btn').style.display = 'flex';
    actionsEl.innerHTML = `<button class="btn btn-outline" onclick="showPage('settings')">✏️ تعديل الملف</button>`;
  } else {
    document.getElementById('change-cover-btn').style.display = 'none';
    document.getElementById('change-avatar-btn').style.display = 'none';
    const { data: fs } = await sb.from('friendships').select('*').or(`and(user_id.eq.${currentUser.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUser.id})`).single();
    let friendBtn = `<button class="btn btn-primary" onclick="sendFriendRequest('${userId}')">+ إضافة صديق</button>`;
    if (fs) {
      if (fs.status==='accepted') friendBtn = `<span style="color:var(--accent);font-weight:700">✓ صديق</span>`;
      else if (fs.status==='pending') friendBtn = `<span style="color:var(--text3)">طلب معلق ⏳</span>`;
    }
    actionsEl.innerHTML = `${friendBtn}<button class="btn btn-outline" onclick="openConversation('${userId}');showPage('messages')">💬 رسالة</button>`;
  }
  // Stats
  const { count: postsCount } = await sb.from('posts').select('id',{count:'exact'}).eq('user_id', userId);
  const { count: friendsCount } = await sb.from('friendships').select('id',{count:'exact'}).eq('status','accepted').or(`user_id.eq.${userId},friend_id.eq.${userId}`);
  document.getElementById('profile-posts-count').textContent = postsCount||0;
  document.getElementById('profile-friends-count').textContent = friendsCount||0;
  // Load posts
  switchProfileTab('posts', document.querySelector('.profile-tab'));
}

async function switchProfileTab(tab, btn) {
  document.querySelectorAll('.profile-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const content = document.getElementById('profile-content');
  if (!content) return;
  if (tab === 'posts') {
    content.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div></div>';
    const { data } = await sb.from('posts').select('*, profiles(id,full_name,username,avatar_url), subjects(name,color)').eq('user_id', viewingUserId||currentUser.id).order('created_at',{ascending:false});
    if (!data||!data.length) { content.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><h3>لا توجد منشورات</h3></div>'; return; }
    content.innerHTML = data.map(p => renderPost(p)).join('');
  }
}

function changeCover() { document.getElementById('cover-file-input').click(); }
function changeAvatar() { document.getElementById('avatar-file-input').click(); }

async function uploadAvatar(e) {
  const file = e.target.files[0]; if (!file) return;
  const path = `${currentUser.id}/avatar.${file.name.split('.').pop()}`;
  const { error } = await sb.storage.from('lessons').upload(path, file, { upsert: true });
  if (error) { showToast(error.message, 'error'); return; }
  const { data: { publicUrl } } = sb.storage.from('lessons').getPublicUrl(path);
  await sb.from('profiles').update({ avatar_url: publicUrl }).eq('id', currentUser.id);
  currentProfile = await fetchProfile(currentUser.id);
  showToast('تم تحديث الصورة ✓', 'success');
  viewProfile(currentUser.id);
}

async function uploadCover(e) {
  const file = e.target.files[0]; if (!file) return;
  const path = `${currentUser.id}/cover.${file.name.split('.').pop()}`;
  const { error } = await sb.storage.from('lessons').upload(path, file, { upsert: true });
  if (error) { showToast(error.message, 'error'); return; }
  const { data: { publicUrl } } = sb.storage.from('lessons').getPublicUrl(path);
  await sb.from('profiles').update({ cover_url: publicUrl }).eq('id', currentUser.id);
  showToast('تم تحديث الغلاف ✓', 'success');
  viewProfile(currentUser.id);
}

// ============================
// SIDEBAR WIDGETS
// ============================
function updateSidebarProfile() {
  const el = document.getElementById('sidebar-profile-mini');
  if (!el || !currentProfile) return;
  el.innerHTML = `
    <div class="sidebar-mini-avatar" onclick="showMyProfile()">${getAvatarHtml(currentProfile, 64)}</div>
    <div class="sidebar-mini-name">${escHtml(currentProfile.full_name||'')}</div>
    <div class="sidebar-mini-uni">${escHtml(currentProfile.university||'')}</div>`;
}

async function loadFriendRequestsWidget() {
  const el = document.getElementById('friend-requests-widget');
  if (!el || !currentUser) return;
  const { data } = await sb.from('friendships').select('*, user:user_id(id,full_name,username,avatar_url)').eq('friend_id', currentUser.id).eq('status','pending').limit(3);
  if (!data||!data.length) { el.innerHTML = '<p style="font-size:.8rem;color:var(--text3)">لا توجد طلبات</p>'; return; }
  el.innerHTML = data.map(f => `
    <div class="suggestion-item">
      <div class="suggestion-avatar" onclick="viewProfile('${f.user?.id}')">${getAvatarHtml(f.user, 36)}</div>
      <div class="suggestion-info">
        <div class="suggestion-name">${escHtml(f.user?.full_name||'مستخدم')}</div>
      </div>
      <button class="btn btn-primary-sm" onclick="respondFriendRequest('${f.id}','accepted')">قبول</button>
    </div>`).join('');
  const badge = document.getElementById('req-count-badge');
  if (badge) badge.textContent = data.length;
}

async function loadSuggestionsWidget() {
  const el = document.getElementById('suggestions-widget');
  if (!el || !currentUser) return;
  const { data } = await sb.from('profiles').select('*').neq('id', currentUser.id).limit(4);
  if (!data||!data.length) { el.innerHTML = '<p style="font-size:.8rem;color:var(--text3)">لا توجد اقتراحات</p>'; return; }
  el.innerHTML = data.map(u => `
    <div class="suggestion-item">
      <div class="suggestion-avatar" onclick="viewProfile('${u.id}')">${getAvatarHtml(u, 36)}</div>
      <div class="suggestion-info">
        <div class="suggestion-name" onclick="viewProfile('${u.id}')">${escHtml(u.full_name||'مستخدم')}</div>
        <div class="suggestion-meta">${escHtml(u.university||'')}</div>
      </div>
      <button class="btn btn-primary-sm" style="font-size:.72rem;padding:.3rem .7rem" onclick="sendFriendRequest('${u.id}')">+ إضافة</button>
    </div>`).join('');
}

// ============================
// NOTIFICATIONS
// ============================
async function loadNotifications() {
  const dropdown = document.getElementById('notif-dropdown');
  if (!dropdown || !currentUser) return;
  const { data } = await sb.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at',{ascending:false}).limit(20);
  const unread = (data||[]).filter(n => !n.read).length;
  const badge = document.getElementById('notif-badge');
  if (unread > 0) { badge.textContent = unread; badge.style.display = 'flex'; }
  else badge.style.display = 'none';
  dropdown.innerHTML = data&&data.length ? `
    <div style="padding:.7rem 1rem;border-bottom:1px solid var(--border);font-weight:700;font-size:.85rem">الإشعارات</div>
    ${data.map(n => `
      <div class="notif-item ${n.read?'':'unread'}" onclick="markNotifRead('${n.id}')">
        <div class="notif-item-avatar">${getNotifIcon(n.type)}</div>
        <div><div class="notif-item-text">${escHtml(n.text)}</div><div class="notif-item-time">${getTimeAgo(n.created_at)}</div></div>
      </div>`).join('')}` : '<p style="text-align:center;padding:2rem;color:var(--text3)">لا توجد إشعارات</p>';
}

function getNotifIcon(type) {
  const icons = { like:'❤️', comment:'💬', friend_request:'👥', message:'💬' };
  return icons[type] || '🔔';
}

async function markNotifRead(id) {
  await sb.from('notifications').update({ read: true }).eq('id', id);
  loadNotifications();
}

function toggleNotifications() {
  document.getElementById('notif-dropdown').classList.toggle('open');
  loadNotifications();
}

async function createNotification(userId, type, text, postId) {
  if (!userId || userId === currentUser?.id) return;
  await sb.from('notifications').insert({ user_id: userId, type, text, post_id: postId, read: false });
}

// ============================
// NAV SEARCH
// ============================
async function searchUsers(q) {
  const res = document.getElementById('search-results');
  if (!q.trim()) { res.innerHTML = ''; return; }
  const { data } = await sb.from('profiles').select('*').or(`full_name.ilike.%${q}%,username.ilike.%${q}%`).limit(6);
  if (!data||!data.length) { res.innerHTML = '<div class="search-result-item" style="color:var(--text3)">لا توجد نتائج</div>'; return; }
  res.innerHTML = data.map(u => `
    <div class="search-result-item" onclick="viewProfile('${u.id}');document.getElementById('search-results').innerHTML='';document.getElementById('nav-search').value=''">
      <span>${getAvatarHtml(u, 32)}</span>
      <div><div style="font-size:.85rem;font-weight:600">${escHtml(u.full_name||'')}</div><div style="font-size:.75rem;color:var(--text3)">@${escHtml(u.username||'')}</div></div>
    </div>`).join('');
}

// ============================
// SUBJECTS
// ============================
async function loadSubjects() {
  if (!currentUser) return;
  const grid = document.getElementById('subjects-grid');
  if (grid) grid.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div></div>';
  const { data, error } = await sb.from('subjects').select('*').eq('user_id', currentUser.id).order('created_at');
  if (error) { showToast(error.message, 'error'); return; }
  allSubjects = data||[];
  if (grid) renderSubjects(allSubjects);
  updateLessonSubjectSelect();
  updateLessonFilter();
}

function renderSubjects(subjects) {
  const grid = document.getElementById('subjects-grid');
  if (!grid) return;
  if (!subjects.length) { grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><h3>لا توجد مقاييس بعد</h3><p>اضغط + لإضافة مقياس</p></div>'; return; }
  grid.innerHTML = subjects.map(s => `
    <div class="subject-card" style="--card-color:${s.color}">
      <span class="subject-card-icon">${s.icon||'📚'}</span>
      <div class="subject-card-name">${escHtml(s.name)}</div>
      <div class="subject-card-meta">المعامل: ${s.coefficient||1}</div>
      <div class="subject-card-actions">
        <button class="btn-icon" onclick="openSubjectModal('${s.id}')">✏️</button>
        <button class="btn-icon danger" onclick="confirmDelete('subject','${s.id}')">🗑</button>
      </div>
    </div>`).join('');
}

function openSubjectModal(id=null) {
  document.getElementById('subject-id').value = id||'';
  document.getElementById('subject-modal-title').textContent = id ? 'تعديل المقياس' : 'إضافة مقياس';
  if (id) {
    const s = allSubjects.find(x=>x.id===id);
    if (s) { document.getElementById('subject-name').value=s.name; document.getElementById('subject-coefficient').value=s.coefficient||1; selectColor(s.color||'#6366f1',null); selectEmoji(s.icon||'📚',null); }
  } else { document.getElementById('subject-form').reset(); document.getElementById('subject-color').value='#6366f1'; document.getElementById('subject-icon').value='📚'; }
  openModal('subject-modal');
}

function selectColor(color, el) {
  currentSubjectColor = color; document.getElementById('subject-color').value = color;
  document.querySelectorAll('.color-opt').forEach(o => o.classList.toggle('active', o.dataset.color===color));
}
function selectEmoji(emoji, el) {
  currentSubjectIcon = emoji; document.getElementById('subject-icon').value = emoji;
  document.querySelectorAll('.emoji-opt').forEach(o => o.classList.toggle('active', o.textContent===emoji));
}

async function saveSubject(e) {
  e.preventDefault();
  const name = document.getElementById('subject-name').value.trim();
  const color = document.getElementById('subject-color').value||'#6366f1';
  const icon = document.getElementById('subject-icon').value||'📚';
  const coefficient = parseInt(document.getElementById('subject-coefficient').value)||1;
  const id = document.getElementById('subject-id').value;
  if (!name) { showToast('أدخل اسم المقياس', 'error'); return; }
  try {
    if (id) { const {error} = await sb.from('subjects').update({name,color,icon,coefficient}).eq('id',id).eq('user_id',currentUser.id); if(error) throw error; }
    else { const {error} = await sb.from('subjects').insert([{name,color,icon,coefficient,user_id:currentUser.id}]).select(); if(error) throw error; }
    showToast('تم الحفظ ✓', 'success'); closeModal('subject-modal'); loadSubjects();
  } catch(err) { showToast(err.message, 'error'); }
}

// ============================
// LESSONS
// ============================
async function loadLessons() {
  if (!currentUser) return;
  await loadSubjects();
  const grid = document.getElementById('lessons-grid');
  if (grid) grid.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div></div>';
  const { data } = await sb.from('lessons').select('*, subjects(name,color,icon)').eq('user_id', currentUser.id).order('created_at',{ascending:false});
  allLessons = data||[];
  renderLessons(allLessons);
}

function renderLessons(lessons) {
  const grid = document.getElementById('lessons-grid');
  if (!grid) return;
  if (!lessons.length) { grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📖</div><h3>لا توجد دروس بعد</h3><p>اضغط + لإضافة درس</p></div>'; return; }
  grid.innerHTML = lessons.map(l => {
    const fileIcon = getFileIcon(l.file_type);
    const subColor = l.subjects?.color||'#6366f1';
    return `<div class="lesson-card">
      <div class="lesson-card-thumb" style="background:linear-gradient(135deg,${subColor}22,${subColor}44)">${fileIcon}</div>
      <div class="lesson-card-body">
        ${l.subjects ? `<span class="lesson-card-subject" style="background:${subColor}">${escHtml(l.subjects.name)}</span>` : ''}
        <div class="lesson-card-title">${escHtml(l.title)}</div>
        <div class="lesson-card-desc">${escHtml(l.description||'')}</div>
        <div class="lesson-card-footer">
          <span class="lesson-card-type">${fileIcon}</span>
          <div class="lesson-card-actions">
            ${l.file_url?`<button class="btn-icon" onclick="viewFile('${escHtml(l.file_url)}','${l.file_type||''}','${escHtml(l.title)}')">👁</button>`:''}
            <button class="btn-icon" onclick="openLessonModal('${l.id}')">✏️</button>
            <button class="btn-icon danger" onclick="confirmDelete('lesson','${l.id}')">🗑</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function updateLessonFilter() {
  const sel = document.getElementById('lesson-filter');
  if (!sel) return;
  sel.innerHTML = '<option value="all">جميع المقاييس</option>' + allSubjects.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
}
function updateLessonSubjectSelect() {
  const sel = document.getElementById('lesson-subject-sel');
  if (!sel) return;
  sel.innerHTML = allSubjects.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
}
function filterLessons() {
  const v = document.getElementById('lesson-filter').value;
  renderLessons(v==='all' ? allLessons : allLessons.filter(l=>l.subject_id===v));
}

function openLessonModal(id=null) {
  document.getElementById('lesson-id').value=id||'';
  document.getElementById('lesson-modal-title').textContent = id?'تعديل الدرس':'إضافة درس';
  selectedFile=null;
  document.getElementById('file-preview').style.display='none';
  document.getElementById('upload-progress').style.display='none';
  updateLessonSubjectSelect();
  if (id) { const l=allLessons.find(x=>x.id===id); if(l){document.getElementById('lesson-title-input').value=l.title;document.getElementById('lesson-subject-sel').value=l.subject_id||'';document.getElementById('lesson-desc').value=l.description||'';} }
  else document.getElementById('lesson-form').reset();
  openModal('lesson-modal');
}

function handleFileSelect(e) { const f=e.target.files[0]; if(f) showFilePreview(f); }
function showFilePreview(file) {
  selectedFile=file;
  const p=document.getElementById('file-preview'); p.style.display='flex';
  const size=file.size>1024*1024?(file.size/(1024*1024)).toFixed(1)+'MB':(file.size/1024).toFixed(0)+'KB';
  p.innerHTML=`<span style="font-size:1.4rem">${getFileIcon(file.type)}</span><div class="file-preview-info"><div class="file-preview-name">${escHtml(file.name)}</div><div class="file-preview-size">${size}</div></div><button type="button" class="btn-icon danger" onclick="selectedFile=null;document.getElementById('file-preview').style.display='none'">✕</button>`;
}
function dragOver(e) { e.preventDefault(); e.currentTarget.classList.add('dragover'); }
function dropFile(e) { e.preventDefault(); e.currentTarget.classList.remove('dragover'); const f=e.dataTransfer.files[0]; if(f) showFilePreview(f); }

async function saveLesson(e) {
  e.preventDefault();
  const title=document.getElementById('lesson-title-input').value.trim();
  const subjectId=document.getElementById('lesson-subject-sel').value;
  const description=document.getElementById('lesson-desc').value.trim();
  const id=document.getElementById('lesson-id').value;
  if (!title) { showToast('أدخل عنوان الدرس', 'error'); return; }
  try {
    let fileUrl=null, fileType=null;
    if (selectedFile) {
      showToast('جاري رفع الملف...', 'info');
      const prog=document.getElementById('progress-fill');
      document.getElementById('upload-progress').style.display='block';
      prog.style.width='20%';
      const ext=selectedFile.name.split('.').pop();
      const path=`${currentUser.id}/${Date.now()}.${ext}`;
      const {error:upErr}=await sb.storage.from('lessons').upload(path,selectedFile,{upsert:true});
      if (upErr) throw upErr;
      prog.style.width='100%';
      const {data:{publicUrl}}=sb.storage.from('lessons').getPublicUrl(path);
      fileUrl=publicUrl; fileType=selectedFile.type||ext;
    }
    const payload={title,subject_id:subjectId||null,description,user_id:currentUser.id};
    if(fileUrl){payload.file_url=fileUrl;payload.file_type=fileType;}
    if(id){const{error}=await sb.from('lessons').update(payload).eq('id',id).eq('user_id',currentUser.id);if(error)throw error;}
    else{const{error}=await sb.from('lessons').insert([payload]).select();if(error)throw error;}
    showToast('تم الحفظ ✓', 'success'); closeModal('lesson-modal'); loadLessons();
  } catch(err) { showToast(err.message, 'error'); }
}

// ============================
// DELETE
// ============================
function confirmDelete(type, id) {
  openModal('confirm-modal');
  document.getElementById('confirm-ok-btn').onclick = async () => {
    closeModal('confirm-modal');
    if(type==='subject'){await sb.from('subjects').delete().eq('id',id).eq('user_id',currentUser.id);showToast('تم الحذف','success');loadSubjects();}
    if(type==='lesson'){await sb.from('lessons').delete().eq('id',id).eq('user_id',currentUser.id);showToast('تم الحذف','success');loadLessons();}
  };
}

// ============================
// FILE VIEWER
// ============================
function viewFile(url, type, title) {
  document.getElementById('viewer-title').textContent = title;
  const dl=document.getElementById('viewer-download'); dl.href=url; dl.download=title;
  const content=document.getElementById('viewer-content');
  const t2=(type||'').toLowerCase();
  if(t2.includes('pdf')||url.endsWith('.pdf')) content.innerHTML=`<iframe src="${url}"></iframe>`;
  else if(t2.includes('image')||/\.(png|jpg|jpeg|gif|webp)$/i.test(url)) content.innerHTML=`<img src="${url}" style="max-width:100%;border-radius:var(--radius)"/>`;
  else if(t2.includes('video')||/\.(mp4|webm)$/i.test(url)) content.innerHTML=`<video controls src="${url}" style="max-width:100%;border-radius:var(--radius)"></video>`;
  else if(t2.includes('audio')||/\.(mp3|wav)$/i.test(url)) content.innerHTML=`<audio controls src="${url}" style="width:100%"></audio>`;
  else content.innerHTML=`<div style="text-align:center;padding:3rem"><div style="font-size:4rem;margin-bottom:1rem">${getFileIcon(type)}</div><a href="${url}" download class="btn btn-primary">تحميل الملف</a></div>`;
  openModal('viewer-modal');
}

// ============================
// SETTINGS
// ============================
async function loadSettings() {
  if (!currentProfile) return;
  document.getElementById('settings-name').value = currentProfile.full_name||'';
  document.getElementById('settings-username').value = currentProfile.username||'';
  document.getElementById('settings-university').value = currentProfile.university||'';
  document.getElementById('settings-bio').value = currentProfile.bio||'';
}

async function saveSettings() {
  const name=document.getElementById('settings-name').value.trim();
  const username=document.getElementById('settings-username').value.trim();
  const university=document.getElementById('settings-university').value.trim();
  const bio=document.getElementById('settings-bio').value.trim();
  try {
    await sb.from('profiles').update({full_name:name,username,university,bio}).eq('id',currentUser.id);
    currentProfile = await fetchProfile(currentUser.id);
    document.getElementById('user-name-drop').textContent = name;
    showToast('تم حفظ التغييرات ✓', 'success');
  } catch(err) { showToast(err.message, 'error'); }
}

// ============================
// AI CHAT
// ============================
async function sendMessage() {
  const input=document.getElementById('chat-input');
  const msg=input.value.trim(); if(!msg) return;
  input.value=''; autoResize(input);
  addChatMessage('user',msg);
  chatHistory.push({role:'user',content:msg});
  const typingEl=addTyping();
  try {
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-5-20250929",max_tokens:1000,system:"أنت مساعد تعليمي ذكي. أجب بنفس لغة المستخدم.",messages:chatHistory.slice(-10)})});
    const data=await res.json();
    typingEl.remove();
    const aiText=data.content?.[0]?.text||getSmartResponse(msg);
    chatHistory.push({role:'assistant',content:aiText});
    addChatMessage('ai',aiText);
  } catch(err) {
    typingEl.remove();
    addChatMessage('ai',getSmartResponse(msg));
  }
}

function getSmartResponse(msg) {
  const m=msg.toLowerCase();
  if(m.includes('مرحب')||m.includes('سلام')) return 'مرحباً! كيف يمكنني مساعدتك في دراستك؟ 😊';
  if(m.includes('رياضيات')) return '📐 يمكنني مساعدتك في الرياضيات! حدد الموضوع المطلوب.';
  if(m.includes('فيزياء')) return '⚡ الفيزياء مثيرة! ما الذي تريد فهمه؟';
  if(m.includes('كيمياء')) return '🧪 يمكنني شرح مفاهيم الكيمياء. ما موضوعك؟';
  if(m.includes('تلخيص')) return '📝 أرسل النص وسأساعدك في تلخيصه.';
  if(m.includes('شكر')) return 'العفو! يسعدني مساعدتك دائماً 😊';
  return `🤖 سؤال رائع! يمكنني مساعدتك في الرياضيات، العلوم، تلخيص النصوص، والواجبات. حدد ما تحتاجه!`;
}

function addChatMessage(role, text) {
  const c=document.getElementById('chat-messages');
  const w=c.querySelector('.chat-welcome'); if(w) w.remove();
  const d=document.createElement('div'); d.className=`chat-msg ${role}`;
  d.innerHTML=`<div class="chat-avatar">${role==='ai'?'🤖':'👤'}</div><div class="chat-bubble">${parseMarkdown(text)}</div>`;
  c.appendChild(d); c.scrollTop=c.scrollHeight;
}
function addTyping() {
  const c=document.getElementById('chat-messages');
  const d=document.createElement('div'); d.className='chat-msg ai';
  d.innerHTML=`<div class="chat-avatar">🤖</div><div class="chat-bubble"><div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  c.appendChild(d); c.scrollTop=c.scrollHeight; return d;
}
function handleChatKey(e) { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} }
function autoResize(el) { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,130)+'px'; }
function sendQuickPrompt(btn) { document.getElementById('chat-input').value=btn.textContent; sendMessage(); }
function newChat() {
  chatHistory=[];
  document.getElementById('chat-messages').innerHTML=`<div class="chat-welcome"><div class="welcome-robot">🤖</div><h3>مرحباً! كيف يمكنني مساعدتك؟</h3><p>اسألني أي شيء</p><div class="quick-prompts"><button class="quick-btn" onclick="sendQuickPrompt(this)">شرح مفهوم رياضي</button><button class="quick-btn" onclick="sendQuickPrompt(this)">تلخيص نص</button><button class="quick-btn" onclick="sendQuickPrompt(this)">مساعدة في الواجب</button></div></div>`;
}

// ============================
// CALCULATOR
// ============================
function addGradeRow() {
  const row=document.createElement('div'); row.className='grade-row';
  row.innerHTML=`<input type="text" class="form-input" placeholder="اسم المادة"><input type="number" class="form-input" placeholder="الدرجة /20" min="0" max="20"><input type="number" class="form-input" placeholder="المعامل" min="1" max="10" value="1"><button class="btn-icon danger" onclick="removeGradeRow(this)">🗑</button>`;
  document.getElementById('grades-list').appendChild(row);
}
function removeGradeRow(btn) { const rows=document.querySelectorAll('#grades-list .grade-row'); if(rows.length>1) btn.closest('.grade-row').remove(); }

function calculateGrades() {
  const rows=document.querySelectorAll('#grades-list .grade-row');
  let totalW=0, totalC=0; const grades=[]; let valid=true;
  rows.forEach(r => {
    const inp=r.querySelectorAll('input');
    const name=inp[0].value.trim(), grade=parseFloat(inp[1].value), coef=parseFloat(inp[2].value)||1;
    if(!name||isNaN(grade)) { valid=false; return; }
    grades.push({name,grade,coef}); totalW+=grade*coef; totalC+=coef;
  });
  if(!valid||!grades.length) { showToast('أدخل جميع البيانات', 'error'); return; }
  const avg=totalW/totalC;
  const resultsDiv=document.getElementById('calc-results'); resultsDiv.style.display='block';
  document.getElementById('result-score').textContent=avg.toFixed(2);
  let mention,color;
  if(avg>=16){mention='ممتاز 🌟';color='#10b981';}
  else if(avg>=14){mention='جيد جداً ⭐';color='#6366f1';}
  else if(avg>=12){mention='جيد 👍';color='#f59e0b';}
  else if(avg>=10){mention='مقبول ✓';color='#f97316';}
  else{mention='راسب ❌';color='#ef4444';}
  document.getElementById('result-mention').textContent=mention; document.getElementById('result-mention').style.color=color;
  document.querySelector('.result-circle').style.background=`linear-gradient(135deg,${color},${color}cc)`;
  document.getElementById('result-bars').innerHTML=grades.slice(0,5).map(g=>`<div class="result-bar-item"><div class="result-bar-label"><span>${escHtml(g.name)}</span><span>${g.grade}/20</span></div><div class="result-bar-track"><div class="result-bar-fill" style="width:${(g.grade/20)*100}%"></div></div></div>`).join('');
  const best=grades.reduce((a,b)=>a.grade>b.grade?a:b);
  const worst=grades.reduce((a,b)=>a.grade<b.grade?a:b);
  document.getElementById('result-analysis').innerHTML=`<p>📊 تحليل الأداء</p><p style="margin-top:.5rem">⭐ أفضل مادة: <strong>${best.name}</strong> (${best.grade}/20)</p><p>⚠️ تحتاج تحسين: <strong>${worst.name}</strong> (${worst.grade}/20)</p>`;
  const tips=[avg<10?'📌 ركز على المراجعة اليومية':'🌟 أداء رائع!', `📚 استخدم المساعد الذكي لشرح المواضيع الصعبة`];
  document.getElementById('result-tips').innerHTML=tips.map(t=>`<div class="tip-item">${t}</div>`).join('');
  resultsDiv.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ============================
// UTILITIES
// ============================
function escHtml(s) { if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function getFileIcon(type) {
  if(!type) return '📄';
  const t=(type||'').toLowerCase();
  if(t.includes('pdf')) return '📕';
  if(t.includes('word')||t.includes('doc')) return '📘';
  if(t.includes('ppt')||t.includes('presentation')) return '📊';
  if(t.includes('image')||t.includes('png')||t.includes('jpg')) return '🖼️';
  if(t.includes('video')||t.includes('mp4')) return '🎥';
  if(t.includes('audio')||t.includes('mp3')) return '🎵';
  if(t.includes('text')||t.includes('txt')) return '📝';
  if(t.includes('zip')||t.includes('rar')) return '🗜️';
  if(t.includes('excel')||t.includes('xlsx')||t.includes('csv')) return '📊';
  return '📄';
}

function getTimeAgo(dateStr) {
  if(!dateStr) return '';
  const diff=Date.now()-new Date(dateStr).getTime();
  const m=Math.floor(diff/60000), h=Math.floor(diff/3600000), d=Math.floor(diff/86400000);
  if(diff<60000) return 'الآن';
  if(m<60) return `منذ ${m} دقيقة`;
  if(h<24) return `منذ ${h} ساعة`;
  if(d<7) return `منذ ${d} يوم`;
  return new Date(dateStr).toLocaleDateString('ar');
}

function parseMarkdown(text) {
  return text.replace(/```([\s\S]*?)```/g,'<pre><code>$1</code></pre>').replace(/`([^`]+)`/g,'<code style="background:var(--surface2);padding:2px 6px;border-radius:4px">$1</code>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
}

// ============================
// INIT
// ============================
async function init() {
  initTheme();
  setLang(currentLang);
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) await onLogin(session.user);
  else showPage('home');
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event==='SIGNED_IN'&&session?.user) await onLogin(session.user);
    if (event==='SIGNED_OUT') onLogout();
  });
  setTimeout(() => { document.getElementById('loading-screen').classList.add('hidden'); }, 2000);
}

init();
