/* ============================================
   محفظة دروسي — MAIN.JS
   Full Application Logic
============================================ */

// ===== SUPABASE CONFIG =====
const SUPABASE_URL = "https://ujyvfxmyquvdpjyvryae.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeXZmeG15cXV2ZHBqeXZyeWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTc4ODUsImV4cCI6MjA4NjczMzg4NX0.tkOTsj6aTUAV73sRRcBaGOT0JJHDMtg25clfWY-FE94";
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== CLAUDE AI CONFIG =====
const CLAUDE_API = "https://api.anthropic.com/v1/messages";
// NOTE: For production, use a backend proxy. For demo, uses claude.ai via artifact API.

// ===== STATE =====
let currentUser = null;
let currentLang = localStorage.getItem('lang') || 'ar';
let chatHistory = [];
let currentSubjectColor = '#6366f1';
let currentSubjectIcon = '📚';
let selectedFile = null;
let editingSubjectId = null;
let editingLessonId = null;
let allSubjects = [];
let allLessons = [];

// ===== TRANSLATIONS =====
const i18n = {
  ar: {
    appName: "محفظة دروسي",
    home: "الرئيسية",
    subjects: "المقاييس",
    lessons: "الدروس",
    aiChat: "الذكاء الاصطناعي",
    calculator: "الحاسبة",
    admin: "الإدارة",
    about: "حول المشروع",
    login: "تسجيل الدخول",
    register: "حساب جديد",
    logout: "تسجيل الخروج",
    profile: "الملف الشخصي",
    heroBadge: "منصة تعليمية متكاملة",
    heroTitle1: "محفظة",
    heroTitle2: "دروسي",
    heroSub: "نظّم دروسك، ارفع ملفاتك، وتواصل مع الذكاء الاصطناعي — كل ما تحتاجه في مكان واحد",
    university: "جامعة النعامة",
    startFree: "ابدأ مجاناً",
    statFiles: "ملفات بلا حدود",
    statLangs: "لغات",
    statAI: "ذكاء اصطناعي",
    featuresTitle: "مميزات المنصة",
    featuresSub: "كل ما تحتاجه لتنظيم حياتك الدراسية",
    feat1Title: "إدارة المقاييس",
    feat1Desc: "أضف وعدّل ونظّم مقاييسك بطريقة بصرية أنيقة",
    feat2Title: "رفع الملفات",
    feat2Desc: "PDF, Word, PPT, صور, فيديو, صوت — كل الصيغ مدعومة",
    feat3Title: "ذكاء اصطناعي",
    feat3Desc: "اسأل AI أي سؤال واحصل على إجابات فورية",
    feat4Title: "حاسبة المعدل",
    feat4Desc: "احسب معدلك الدراسي واحصل على تحليل كامل",
    feat5Title: "3 لغات",
    feat5Desc: "عربية، إنجليزية، فرنسية مع دعم RTL",
    feat6Title: "الوضع الليلي",
    feat6Desc: "تصميم مريح للعين في كل الأوقات",
    welcomeBack: "مرحباً بعودتك",
    loginSub: "سجّل الدخول لمتابعة دروسك",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    forgotPass: "نسيت كلمة المرور؟",
    noAccount: "ليس لديك حساب؟",
    createAccount: "إنشاء حساب جديد",
    haveAccount: "لديك حساب؟",
    registerSub: "انضم الآن وابدأ رحلتك التعليمية",
    fullName: "الاسم الكامل",
    confirmPass: "تأكيد كلمة المرور",
    resetPass: "استرجاع كلمة المرور",
    resetSub: "أدخل بريدك وسنرسل لك رابط إعادة التعيين",
    sendLink: "إرسال الرابط",
    backToLogin: "← العودة لتسجيل الدخول",
    mySubjects: "مقاييسي",
    subjectsSub: "نظّم وأدر مقاييسك الدراسية",
    addSubject: "إضافة مقياس",
    myLessons: "دروسي",
    lessonsSub: "ارفع وعرض ملفات دروسك",
    addLesson: "إضافة درس",
    filterBySubject: "تصفية حسب المقياس:",
    allSubjects: "جميع المقاييس",
    loading: "جاري التحميل...",
    subjectName: "اسم المقياس",
    subjectColor: "اللون",
    subjectIcon: "الرمز",
    coefficient: "المعامل",
    lessonTitle: "عنوان الدرس",
    subject: "المقياس",
    lessonDesc: "الوصف (اختياري)",
    uploadFile: "رفع ملف",
    uploadText: "اسحب الملف هنا أو اضغط للاختيار",
    cancel: "إلغاء",
    save: "حفظ",
    delete: "حذف",
    edit: "تعديل",
    view: "عرض",
    download: "تحميل",
    confirmDelete: "تأكيد الحذف",
    confirmMsg: "هل أنت متأكد من حذف هذا العنصر؟",
    aiAssistant: "المساعد الذكي",
    newChat: "محادثة جديدة",
    chatWelcome: "مرحباً! كيف يمكنني مساعدتك؟",
    chatWelcomeSub: "اسألني أي شيء عن دروسك أو أي موضوع تريده",
    chatPlaceholder: "اكتب سؤالك هنا...",
    chatDisclaimer: "قد يرتكب الذكاء الاصطناعي أخطاء — تحقق دائماً من المعلومات المهمة",
    gradeCalc: "حاسبة المعدل",
    calcSub: "احسب معدلك وحلل أداءك الدراسي",
    gradesInput: "إدخال الدرجات",
    subjectNamePh: "اسم المادة",
    grade: "الدرجة /20",
    addGrade: "إضافة مادة",
    calculate: "احسب المعدل",
    adminPanel: "لوحة الإدارة",
    adminSub: "إدارة المستخدمين والمحتوى",
    totalUsers: "إجمالي المستخدمين",
    totalSubjects: "إجمالي المقاييس",
    totalFiles: "إجمالي الملفات",
    manageUsers: "إدارة المستخدمين",
    aboutTitle: "حول المشروع",
    projectGoal: "هدف المشروع",
    projectGoalDesc: "تصميم منصة تعليمية شاملة تساعد الطلاب على تنظيم دروسهم، رفع ملفاتهم، والاستفادة من الذكاء الاصطناعي في دراستهم",
    techUsed: "التقنيات المستخدمة",
    features: "المميزات",
    noSubjectsYet: "لا يوجد مقاييس بعد",
    noSubjectsHint: "اضغط على زر + لإضافة مقياس",
    noLessonsYet: "لا يوجد دروس بعد",
    noLessonsHint: "اضغط على زر + لإضافة درس",
    loginSuccess: "تم تسجيل الدخول بنجاح! 🎉",
    registerSuccess: "تم إنشاء الحساب بنجاح! 🎉",
    resetSent: "تم إرسال رابط الاستعادة ✉️",
    subjectSaved: "تم حفظ المقياس ✓",
    subjectDeleted: "تم حذف المقياس",
    lessonSaved: "تم حفظ الدرس ✓",
    lessonDeleted: "تم حذف الدرس",
    passError: "كلمة المرور غير متطابقة!",
    fillAll: "يرجى ملء جميع الحقول",
    errorOccurred: "حدث خطأ، حاول مجدداً",
    files: "ملفات",
    lessons2: "دروس",
    aiThinking: "يفكر...",
    excellent: "ممتاز",
    veryGood: "جيد جداً",
    good: "جيد",
    acceptable: "مقبول",
    fail: "راسب",
    aiAnalysis: "تحليل الذكاء الاصطناعي لأدائك",
    yourBest: "أفضل مادة لديك:",
    yourWorst: "تحتاج تحسين في:",
    uploadingFile: "جاري رفع الملف...",
    lessonFiles: "ملفات الدرس",
  },
  en: {
    appName: "My Lesson Portfolio",
    home: "Home",
    subjects: "Subjects",
    lessons: "Lessons",
    aiChat: "AI Chat",
    calculator: "Calculator",
    admin: "Admin",
    about: "About",
    login: "Login",
    register: "Sign Up",
    logout: "Logout",
    profile: "Profile",
    heroBadge: "Complete Educational Platform",
    heroTitle1: "My Lesson",
    heroTitle2: "Portfolio",
    heroSub: "Organize your lessons, upload files, and chat with AI — everything you need in one place",
    university: "Naama University",
    startFree: "Get Started Free",
    statFiles: "Unlimited Files",
    statLangs: "Languages",
    statAI: "Artificial Intelligence",
    featuresTitle: "Platform Features",
    featuresSub: "Everything you need to organize your student life",
    feat1Title: "Subject Management",
    feat1Desc: "Add, edit and organize your subjects beautifully",
    feat2Title: "File Upload",
    feat2Desc: "PDF, Word, PPT, Images, Video, Audio — all formats supported",
    feat3Title: "AI Assistant",
    feat3Desc: "Ask AI any question and get instant answers",
    feat4Title: "Grade Calculator",
    feat4Desc: "Calculate your GPA and get a full performance analysis",
    feat5Title: "3 Languages",
    feat5Desc: "Arabic, English, French with RTL support",
    feat6Title: "Dark Mode",
    feat6Desc: "Eye-friendly design at all times",
    welcomeBack: "Welcome Back",
    loginSub: "Sign in to continue your studies",
    email: "Email Address",
    password: "Password",
    forgotPass: "Forgot password?",
    noAccount: "Don't have an account?",
    createAccount: "Create Account",
    haveAccount: "Already have an account?",
    registerSub: "Join now and start your learning journey",
    fullName: "Full Name",
    confirmPass: "Confirm Password",
    resetPass: "Reset Password",
    resetSub: "Enter your email and we'll send you a reset link",
    sendLink: "Send Link",
    backToLogin: "← Back to Login",
    mySubjects: "My Subjects",
    subjectsSub: "Organize and manage your academic subjects",
    addSubject: "Add Subject",
    myLessons: "My Lessons",
    lessonsSub: "Upload and view your lesson files",
    addLesson: "Add Lesson",
    filterBySubject: "Filter by Subject:",
    allSubjects: "All Subjects",
    loading: "Loading...",
    subjectName: "Subject Name",
    subjectColor: "Color",
    subjectIcon: "Icon",
    coefficient: "Coefficient",
    lessonTitle: "Lesson Title",
    subject: "Subject",
    lessonDesc: "Description (optional)",
    uploadFile: "Upload File",
    uploadText: "Drag file here or click to browse",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    download: "Download",
    confirmDelete: "Confirm Delete",
    confirmMsg: "Are you sure you want to delete this item?",
    aiAssistant: "AI Assistant",
    newChat: "New Chat",
    chatWelcome: "Hello! How can I help you?",
    chatWelcomeSub: "Ask me anything about your lessons or any topic you want",
    chatPlaceholder: "Type your question here...",
    chatDisclaimer: "AI may make mistakes — always verify important information",
    gradeCalc: "Grade Calculator",
    calcSub: "Calculate your GPA and analyze your academic performance",
    gradesInput: "Enter Grades",
    grade: "Grade /20",
    addGrade: "Add Subject",
    calculate: "Calculate GPA",
    adminPanel: "Admin Panel",
    adminSub: "Manage users and content",
    totalUsers: "Total Users",
    totalSubjects: "Total Subjects",
    totalFiles: "Total Files",
    manageUsers: "Manage Users",
    aboutTitle: "About the Project",
    projectGoal: "Project Goal",
    projectGoalDesc: "Design a comprehensive educational platform that helps students organize their lessons, upload files, and benefit from AI in their studies",
    techUsed: "Technologies Used",
    features: "Features",
    noSubjectsYet: "No subjects yet",
    noSubjectsHint: "Click + to add a subject",
    noLessonsYet: "No lessons yet",
    noLessonsHint: "Click + to add a lesson",
    loginSuccess: "Login successful! 🎉",
    registerSuccess: "Account created successfully! 🎉",
    resetSent: "Reset link sent ✉️",
    subjectSaved: "Subject saved ✓",
    subjectDeleted: "Subject deleted",
    lessonSaved: "Lesson saved ✓",
    lessonDeleted: "Lesson deleted",
    passError: "Passwords do not match!",
    fillAll: "Please fill all fields",
    errorOccurred: "An error occurred, please try again",
    files: "files",
    lessons2: "lessons",
    aiThinking: "Thinking...",
    excellent: "Excellent",
    veryGood: "Very Good",
    good: "Good",
    acceptable: "Acceptable",
    fail: "Fail",
    aiAnalysis: "AI Analysis of your performance",
    yourBest: "Your best subject:",
    yourWorst: "Needs improvement:",
    uploadingFile: "Uploading file...",
    lessonFiles: "Lesson Files",
  },
  fr: {
    appName: "Mon Portfolio de Cours",
    home: "Accueil",
    subjects: "Matières",
    lessons: "Leçons",
    aiChat: "IA Chat",
    calculator: "Calculatrice",
    admin: "Admin",
    about: "À propos",
    login: "Connexion",
    register: "S'inscrire",
    logout: "Déconnexion",
    profile: "Profil",
    heroBadge: "Plateforme éducative complète",
    heroTitle1: "Mon Portfolio",
    heroTitle2: "de Cours",
    heroSub: "Organisez vos leçons, importez vos fichiers et chattez avec l'IA — tout ce qu'il vous faut en un seul endroit",
    university: "Université de Naâma",
    startFree: "Commencer gratuitement",
    statFiles: "Fichiers illimités",
    statLangs: "Langues",
    statAI: "Intelligence artificielle",
    featuresTitle: "Fonctionnalités",
    featuresSub: "Tout ce qu'il vous faut pour organiser votre vie étudiante",
    feat1Title: "Gestion des matières",
    feat1Desc: "Ajoutez, modifiez et organisez vos matières visuellement",
    feat2Title: "Upload de fichiers",
    feat2Desc: "PDF, Word, PPT, Images, Vidéo, Audio — tous les formats",
    feat3Title: "Intelligence artificielle",
    feat3Desc: "Posez des questions à l'IA et obtenez des réponses instantanées",
    feat4Title: "Calculatrice de notes",
    feat4Desc: "Calculez votre moyenne et obtenez une analyse complète",
    feat5Title: "3 langues",
    feat5Desc: "Arabe, Anglais, Français avec support RTL",
    feat6Title: "Mode sombre",
    feat6Desc: "Design agréable pour les yeux à tout moment",
    welcomeBack: "Bon retour!",
    loginSub: "Connectez-vous pour continuer vos études",
    email: "Adresse email",
    password: "Mot de passe",
    forgotPass: "Mot de passe oublié?",
    noAccount: "Pas de compte?",
    createAccount: "Créer un compte",
    haveAccount: "Déjà un compte?",
    registerSub: "Rejoignez maintenant et commencez votre parcours",
    fullName: "Nom complet",
    confirmPass: "Confirmer le mot de passe",
    resetPass: "Réinitialiser le mot de passe",
    resetSub: "Entrez votre email et nous vous enverrons un lien",
    sendLink: "Envoyer le lien",
    backToLogin: "← Retour à la connexion",
    mySubjects: "Mes Matières",
    subjectsSub: "Organisez et gérez vos matières académiques",
    addSubject: "Ajouter une matière",
    myLessons: "Mes Leçons",
    lessonsSub: "Importez et visualisez vos fichiers de cours",
    addLesson: "Ajouter une leçon",
    filterBySubject: "Filtrer par matière:",
    allSubjects: "Toutes les matières",
    loading: "Chargement...",
    subjectName: "Nom de la matière",
    subjectColor: "Couleur",
    subjectIcon: "Icône",
    coefficient: "Coefficient",
    lessonTitle: "Titre de la leçon",
    subject: "Matière",
    lessonDesc: "Description (optionnel)",
    uploadFile: "Importer un fichier",
    uploadText: "Glissez le fichier ici ou cliquez pour parcourir",
    cancel: "Annuler",
    save: "Enregistrer",
    delete: "Supprimer",
    edit: "Modifier",
    view: "Voir",
    download: "Télécharger",
    confirmDelete: "Confirmer la suppression",
    confirmMsg: "Êtes-vous sûr de vouloir supprimer cet élément?",
    aiAssistant: "Assistant IA",
    newChat: "Nouvelle discussion",
    chatWelcome: "Bonjour! Comment puis-je vous aider?",
    chatWelcomeSub: "Posez-moi n'importe quelle question sur vos cours",
    chatPlaceholder: "Tapez votre question ici...",
    chatDisclaimer: "L'IA peut faire des erreurs — vérifiez toujours les informations importantes",
    gradeCalc: "Calculatrice de notes",
    calcSub: "Calculez votre moyenne et analysez vos performances",
    gradesInput: "Saisie des notes",
    grade: "Note /20",
    addGrade: "Ajouter une matière",
    calculate: "Calculer la moyenne",
    adminPanel: "Panneau d'administration",
    adminSub: "Gérer les utilisateurs et le contenu",
    totalUsers: "Total utilisateurs",
    totalSubjects: "Total matières",
    totalFiles: "Total fichiers",
    manageUsers: "Gérer les utilisateurs",
    aboutTitle: "À propos du projet",
    projectGoal: "Objectif du projet",
    projectGoalDesc: "Concevoir une plateforme éducative complète qui aide les étudiants à organiser leurs cours et bénéficier de l'IA",
    techUsed: "Technologies utilisées",
    features: "Fonctionnalités",
    noSubjectsYet: "Aucune matière encore",
    noSubjectsHint: "Cliquez sur + pour ajouter",
    noLessonsYet: "Aucune leçon encore",
    noLessonsHint: "Cliquez sur + pour ajouter",
    loginSuccess: "Connexion réussie! 🎉",
    registerSuccess: "Compte créé avec succès! 🎉",
    resetSent: "Lien envoyé ✉️",
    subjectSaved: "Matière enregistrée ✓",
    subjectDeleted: "Matière supprimée",
    lessonSaved: "Leçon enregistrée ✓",
    lessonDeleted: "Leçon supprimée",
    passError: "Les mots de passe ne correspondent pas!",
    fillAll: "Veuillez remplir tous les champs",
    errorOccurred: "Une erreur s'est produite, veuillez réessayer",
    files: "fichiers",
    lessons2: "leçons",
    aiThinking: "En train de réfléchir...",
    excellent: "Excellent",
    veryGood: "Très bien",
    good: "Bien",
    acceptable: "Acceptable",
    fail: "Insuffisant",
    aiAnalysis: "Analyse IA de vos performances",
    yourBest: "Votre meilleure matière:",
    yourWorst: "Nécessite amélioration:",
    uploadingFile: "Téléchargement en cours...",
    lessonFiles: "Fichiers de cours",
  }
};

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || i18n['ar'][key] || key;
}

// ===== LANGUAGE =====
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.body.dataset.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.trim().toLowerCase() === (lang === 'ar' ? 'ع' : lang));
  });
  applyTranslations();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = t(key);
    } else {
      el.textContent = t(key);
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  const chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.placeholder = t('chatPlaceholder');
}

// ===== THEME =====
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  document.getElementById('theme-icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ===== PAGE NAVIGATION =====
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo(0, 0);
  }
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const links = document.querySelectorAll(`.nav-link`);
  links.forEach(l => {
    if (l.getAttribute('onclick') && l.getAttribute('onclick').includes(`'${page}'`)) l.classList.add('active');
  });
  // Load page data
  if (page === 'subjects' && currentUser) loadSubjects();
  if (page === 'lessons' && currentUser) loadLessons();
  if (page === 'admin' && currentUser) loadAdmin();
}

// ===== MOBILE MENU =====
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const hamburger = document.getElementById('hamburger');
  menu.classList.toggle('open');
  hamburger.classList.toggle('active');
}
function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('active');
}

// ===== USER MENU =====
function toggleUserMenu() {
  document.getElementById('user-dropdown').classList.toggle('open');
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-avatar-nav')) {
    const dd = document.getElementById('user-dropdown');
    if (dd) dd.classList.remove('open');
  }
});

// ===== MODAL =====
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// ===== AUTH =====
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const spinner = document.getElementById('login-spinner');
  btn.disabled = true;
  spinner.style.display = 'inline';
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    showToast(t('loginSuccess'), 'success');
    onLogin(data.user);
  } catch (err) {
    showToast(err.message || t('errorOccurred'), 'error');
  } finally {
    btn.disabled = false;
    spinner.style.display = 'none';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  if (password !== confirm) { showToast(t('passError'), 'error'); return; }
  try {
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) throw error;
    showToast(t('registerSuccess'), 'success');
    if (data.user) onLogin(data.user);
    else showPage('login');
  } catch (err) {
    showToast(err.message || t('errorOccurred'), 'error');
  }
}

async function handleForgot(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value;
  try {
    const { error } = await sb.auth.resetPasswordForEmail(email);
    if (error) throw error;
    showToast(t('resetSent'), 'success');
    showPage('login');
  } catch (err) {
    showToast(err.message || t('errorOccurred'), 'error');
  }
}

async function logout() {
  await sb.auth.signOut();
  currentUser = null;
  onLogout();
}

function onLogin(user) {
  currentUser = user;
  document.getElementById('auth-nav-btns').style.display = 'none';
  document.getElementById('user-nav').style.display = 'block';
  document.getElementById('user-initial').textContent = (user.user_metadata?.full_name || user.email || '?')[0].toUpperCase();
  document.getElementById('user-email-drop').textContent = user.email;
  // Show nav links
  ['nav-subjects', 'nav-lessons', 'nav-chat', 'nav-calc'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });
  document.querySelectorAll('.mobile-auth-hidden').forEach(el => el.style.display = '');
  document.getElementById('mobile-auth-btns').style.display = 'none';
  showPage('subjects');
}

function onLogout() {
  document.getElementById('auth-nav-btns').style.display = 'flex';
  document.getElementById('user-nav').style.display = 'none';
  ['nav-subjects', 'nav-lessons', 'nav-chat', 'nav-calc', 'nav-admin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.querySelectorAll('.mobile-auth-hidden').forEach(el => el.style.display = 'none');
  document.getElementById('mobile-auth-btns').style.display = 'flex';
  showPage('home');
}

function togglePass(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ===== SUBJECTS =====
async function loadSubjects() {
  if (!currentUser) return;
  const grid = document.getElementById('subjects-grid');
  grid.innerHTML = `<div class="loading-placeholder"><div class="spinner"></div><p>${t('loading')}</p></div>`;
  try {
    const { data, error } = await sb.from('subjects').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: true });
    if (error) throw error;
    allSubjects = data || [];
    renderSubjects(allSubjects);
    updateLessonFilter();
    updateLessonSubjectSelect();
  } catch (err) {
    grid.innerHTML = `<div class="loading-placeholder"><p style="color:var(--danger)">${err.message}</p></div>`;
  }
}

function renderSubjects(subjects) {
  const grid = document.getElementById('subjects-grid');
  if (!subjects.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><h3>${t('noSubjectsYet')}</h3><p>${t('noSubjectsHint')}</p></div>`;
    return;
  }
  grid.innerHTML = subjects.map(s => `
    <div class="subject-card" style="--card-color: ${s.color || '#6366f1'}">
      <span class="subject-card-icon">${s.icon || '📚'}</span>
      <div class="subject-card-name">${escHtml(s.name)}</div>
      <div class="subject-card-meta">${t('coefficient')}: ${s.coefficient || 1}</div>
      <div class="subject-card-actions">
        <button class="btn-icon" onclick="event.stopPropagation();openSubjectModal('${s.id}')" title="${t('edit')}">✏️</button>
        <button class="btn-icon danger" onclick="event.stopPropagation();confirmDelete('subject','${s.id}')" title="${t('delete')}">🗑</button>
      </div>
    </div>
  `).join('');
}

function openSubjectModal(id = null) {
  editingSubjectId = id;
  document.getElementById('subject-modal-title').textContent = id ? t('edit') + ' ' + t('subjects') : t('addSubject');
  document.getElementById('subject-id').value = id || '';
  if (id) {
    const s = allSubjects.find(x => x.id === id);
    if (s) {
      document.getElementById('subject-name').value = s.name;
      document.getElementById('subject-coefficient').value = s.coefficient || 1;
      selectColor(s.color || '#6366f1', null);
      selectEmoji(s.icon || '📚', null);
    }
  } else {
    document.getElementById('subject-form').reset();
    document.getElementById('subject-color').value = '#6366f1';
    document.getElementById('subject-icon').value = '📚';
    currentSubjectColor = '#6366f1';
    currentSubjectIcon = '📚';
  }
  openModal('subject-modal');
}

function selectColor(color, el) {
  currentSubjectColor = color;
  document.getElementById('subject-color').value = color;
  document.querySelectorAll('.color-opt').forEach(o => {
    o.classList.toggle('active', o.dataset.color === color);
  });
}

function selectEmoji(emoji, el) {
  currentSubjectIcon = emoji;
  document.getElementById('subject-icon').value = emoji;
  document.querySelectorAll('.emoji-opt').forEach(o => {
    o.classList.toggle('active', o.textContent === emoji);
  });
}

async function saveSubject(e) {
  e.preventDefault();
  const name = document.getElementById('subject-name').value.trim();
  const color = document.getElementById('subject-color').value;
  const icon = document.getElementById('subject-icon').value;
  const coefficient = parseInt(document.getElementById('subject-coefficient').value) || 1;
  const id = document.getElementById('subject-id').value;
  if (!name) { showToast(t('fillAll'), 'error'); return; }
  try {
    if (id) {
      const { error } = await sb.from('subjects').update({ name, color, icon, coefficient }).eq('id', id).eq('user_id', currentUser.id);
      if (error) throw error;
    } else {
      const { error } = await sb.from('subjects').insert({ name, color, icon, coefficient, user_id: currentUser.id });
      if (error) throw error;
    }
    showToast(t('subjectSaved'), 'success');
    closeModal('subject-modal');
    loadSubjects();
  } catch (err) {
    showToast(err.message || t('errorOccurred'), 'error');
  }
}

// ===== LESSONS =====
async function loadLessons() {
  if (!currentUser) return;
  await loadSubjects();
  const grid = document.getElementById('lessons-grid');
  grid.innerHTML = `<div class="loading-placeholder"><div class="spinner"></div><p>${t('loading')}</p></div>`;
  try {
    const { data, error } = await sb.from('lessons').select('*, subjects(name, color, icon)').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    if (error) throw error;
    allLessons = data || [];
    renderLessons(allLessons);
  } catch (err) {
    grid.innerHTML = `<div class="loading-placeholder"><p style="color:var(--danger)">${err.message}</p></div>`;
  }
}

function renderLessons(lessons) {
  const grid = document.getElementById('lessons-grid');
  if (!lessons.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📖</div><h3>${t('noLessonsYet')}</h3><p>${t('noLessonsHint')}</p></div>`;
    return;
  }
  grid.innerHTML = lessons.map(l => {
    const fileIcon = getFileIcon(l.file_type);
    const subColor = l.subjects?.color || '#6366f1';
    const subName = l.subjects?.name || '';
    return `
      <div class="lesson-card">
        <div class="lesson-card-thumb" style="background: linear-gradient(135deg, ${subColor}22, ${subColor}44)">
          <span style="font-size:3rem">${fileIcon}</span>
        </div>
        <div class="lesson-card-body">
          <span class="lesson-card-subject" style="background:${subColor}">${escHtml(subName)}</span>
          <div class="lesson-card-title">${escHtml(l.title)}</div>
          <div class="lesson-card-desc">${escHtml(l.description || '')}</div>
          <div class="lesson-card-footer">
            <span class="lesson-card-type">${fileIcon} ${l.file_type || ''}</span>
            <div class="lesson-card-actions">
              ${l.file_url ? `<button class="btn-icon" onclick="viewFile('${l.file_url}','${l.file_type || ''}','${escHtml(l.title)}')" title="${t('view')}">👁</button>` : ''}
              <button class="btn-icon" onclick="openLessonModal('${l.id}')" title="${t('edit')}">✏️</button>
              <button class="btn-icon danger" onclick="confirmDelete('lesson','${l.id}')" title="${t('delete')}">🗑</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getFileIcon(type) {
  if (!type) return '📄';
  const t2 = type.toLowerCase();
  if (t2.includes('pdf')) return '📕';
  if (t2.includes('word') || t2.includes('doc')) return '📘';
  if (t2.includes('ppt') || t2.includes('presentation')) return '📊';
  if (t2.includes('image') || t2.includes('png') || t2.includes('jpg')) return '🖼️';
  if (t2.includes('video') || t2.includes('mp4')) return '🎥';
  if (t2.includes('audio') || t2.includes('mp3')) return '🎵';
  if (t2.includes('text') || t2.includes('txt')) return '📝';
  return '📄';
}

function updateLessonFilter() {
  const sel = document.getElementById('lesson-filter');
  if (!sel) return;
  sel.innerHTML = `<option value="all">${t('allSubjects')}</option>` +
    allSubjects.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
}

function updateLessonSubjectSelect() {
  const sel = document.getElementById('lesson-subject-sel');
  if (!sel) return;
  sel.innerHTML = allSubjects.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
}

function filterLessons() {
  const val = document.getElementById('lesson-filter').value;
  if (val === 'all') renderLessons(allLessons);
  else renderLessons(allLessons.filter(l => l.subject_id === val));
}

function openLessonModal(id = null) {
  editingLessonId = id;
  selectedFile = null;
  document.getElementById('lesson-modal-title').textContent = id ? t('edit') : t('addLesson');
  document.getElementById('lesson-id').value = id || '';
  document.getElementById('file-preview').style.display = 'none';
  document.getElementById('upload-progress').style.display = 'none';
  updateLessonSubjectSelect();
  if (id) {
    const l = allLessons.find(x => x.id === id);
    if (l) {
      document.getElementById('lesson-title-input').value = l.title;
      document.getElementById('lesson-subject-sel').value = l.subject_id || '';
      document.getElementById('lesson-desc').value = l.description || '';
    }
  } else {
    document.getElementById('lesson-form').reset();
  }
  openModal('lesson-modal');
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) showFilePreview(file);
}

function showFilePreview(file) {
  selectedFile = file;
  const preview = document.getElementById('file-preview');
  preview.style.display = 'flex';
  const icon = getFileIcon(file.type || file.name);
  const size = file.size > 1024*1024 ? (file.size/(1024*1024)).toFixed(1)+'MB' : (file.size/1024).toFixed(0)+'KB';
  preview.innerHTML = `
    <span class="file-preview-icon">${icon}</span>
    <div class="file-preview-info">
      <div class="file-preview-name">${escHtml(file.name)}</div>
      <div class="file-preview-size">${size}</div>
    </div>
    <button type="button" class="btn-icon danger" onclick="clearFile()">✕</button>
  `;
}

function clearFile() {
  selectedFile = null;
  document.getElementById('file-preview').style.display = 'none';
  document.getElementById('file-input').value = '';
}

function dragOver(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.add('dragover');
}
function dropFile(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) showFilePreview(file);
}

async function saveLesson(e) {
  e.preventDefault();
  const title = document.getElementById('lesson-title-input').value.trim();
  const subjectId = document.getElementById('lesson-subject-sel').value;
  const description = document.getElementById('lesson-desc').value.trim();
  const id = document.getElementById('lesson-id').value;
  if (!title) { showToast(t('fillAll'), 'error'); return; }
  try {
    let fileUrl = null;
    let fileType = null;
    if (selectedFile) {
      showToast(t('uploadingFile'), 'info');
      const { url, type } = await uploadFile(selectedFile);
      fileUrl = url;
      fileType = type;
    }
    const payload = { title, subject_id: subjectId || null, description, user_id: currentUser.id };
    if (fileUrl) { payload.file_url = fileUrl; payload.file_type = fileType; }
    if (id) {
      const { error } = await sb.from('lessons').update(payload).eq('id', id).eq('user_id', currentUser.id);
      if (error) throw error;
    } else {
      const { error } = await sb.from('lessons').insert(payload);
      if (error) throw error;
    }
    showToast(t('lessonSaved'), 'success');
    closeModal('lesson-modal');
    loadLessons();
  } catch (err) {
    showToast(err.message || t('errorOccurred'), 'error');
  }
}

async function uploadFile(file) {
  const ext = file.name.split('.').pop();
  const path = `${currentUser.id}/${Date.now()}.${ext}`;
  const progress = document.getElementById('upload-progress');
  const fill = document.getElementById('progress-fill');
  const text = document.getElementById('progress-text');
  progress.style.display = 'block';
  fill.style.width = '10%';
  text.textContent = '10%';
  const { data, error } = await sb.storage.from('lessons').upload(path, file, { upsert: true });
  if (error) throw error;
  fill.style.width = '100%';
  text.textContent = '100%';
  const { data: { publicUrl } } = sb.storage.from('lessons').getPublicUrl(path);
  return { url: publicUrl, type: file.type || ext };
}

// ===== DELETE =====
function confirmDelete(type, id) {
  openModal('confirm-modal');
  document.getElementById('confirm-ok-btn').onclick = () => {
    closeModal('confirm-modal');
    if (type === 'subject') deleteSubject(id);
    if (type === 'lesson') deleteLesson(id);
    if (type === 'user') deleteUser(id);
  };
}

async function deleteSubject(id) {
  try {
    const { error } = await sb.from('subjects').delete().eq('id', id).eq('user_id', currentUser.id);
    if (error) throw error;
    showToast(t('subjectDeleted'), 'success');
    loadSubjects();
  } catch (err) { showToast(err.message, 'error'); }
}

async function deleteLesson(id) {
  try {
    const { error } = await sb.from('lessons').delete().eq('id', id).eq('user_id', currentUser.id);
    if (error) throw error;
    showToast(t('lessonDeleted'), 'success');
    loadLessons();
  } catch (err) { showToast(err.message, 'error'); }
}

// ===== FILE VIEWER =====
function viewFile(url, type, title) {
  document.getElementById('viewer-title').textContent = title;
  const dl = document.getElementById('viewer-download');
  dl.href = url;
  dl.download = title;
  const content = document.getElementById('viewer-content');
  const t2 = (type || '').toLowerCase();
  if (t2.includes('pdf') || url.endsWith('.pdf')) {
    content.innerHTML = `<iframe src="${url}"></iframe>`;
  } else if (t2.includes('image') || /\.(png|jpg|jpeg|gif|webp)$/i.test(url)) {
    content.innerHTML = `<img src="${url}" alt="${escHtml(title)}" style="max-width:100%;border-radius:var(--radius)">`;
  } else if (t2.includes('video') || /\.(mp4|webm|ogg)$/i.test(url)) {
    content.innerHTML = `<video controls src="${url}" style="max-width:100%;border-radius:var(--radius)"></video>`;
  } else if (t2.includes('audio') || /\.(mp3|wav|ogg)$/i.test(url)) {
    content.innerHTML = `<audio controls src="${url}" style="width:100%"></audio>`;
  } else if (t2.includes('text') || url.endsWith('.txt')) {
    fetch(url).then(r=>r.text()).then(text => {
      content.innerHTML = `<pre>${escHtml(text)}</pre>`;
    });
  } else {
    content.innerHTML = `<div style="text-align:center;padding:3rem"><div style="font-size:4rem;margin-bottom:1rem">${getFileIcon(type)}</div><p>${t('download')} to view this file</p><a href="${url}" download class="btn btn-primary">${t('download')}</a></div>`;
  }
  openModal('viewer-modal');
}

// ===== AI CHAT =====
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  autoResize(input);
  addChatMessage('user', msg);
  chatHistory.push({ role: 'user', content: msg });
  const typingEl = addTyping();
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1000,
        system: `You are a helpful AI educational assistant for a student platform called "محفظة دروسي". Respond in the same language the user writes in (Arabic, English, or French). Be friendly, helpful, and educational. The user is a student who may ask about their subjects, lessons, study tips, or any academic topic.`,
        messages: chatHistory
      })
    });
    const data = await response.json();
    typingEl.remove();
    const aiText = data.content?.[0]?.text || "Sorry, I couldn't process that request.";
    chatHistory.push({ role: 'assistant', content: aiText });
    addChatMessage('ai', aiText);
    saveChatHistory();
  } catch (err) {
    typingEl.remove();
    const errMsg = currentLang === 'ar' ? 'حدث خطأ في الاتصال. تحقق من مفتاح API.' :
                   currentLang === 'fr' ? "Erreur de connexion. Vérifiez votre clé API." :
                   "Connection error. Please check your API key.";
    addChatMessage('ai', errMsg);
  }
}

function addChatMessage(role, text) {
  const container = document.getElementById('chat-messages');
  const welcome = container.querySelector('.chat-welcome');
  if (welcome) welcome.remove();
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `
    <div class="chat-avatar">${role === 'ai' ? '🤖' : '👤'}</div>
    <div class="chat-bubble">${parseMarkdown(text)}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addTyping() {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg ai';
  div.innerHTML = `
    <div class="chat-avatar">🤖</div>
    <div class="chat-bubble">
      <div class="chat-typing">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 150) + 'px';
}

function sendQuickPrompt(btn) {
  const input = document.getElementById('chat-input');
  input.value = btn.textContent;
  sendMessage();
}

function newChat() {
  chatHistory = [];
  const container = document.getElementById('chat-messages');
  container.innerHTML = `
    <div class="chat-welcome">
      <div class="welcome-robot">🤖</div>
      <h3>${t('chatWelcome')}</h3>
      <p>${t('chatWelcomeSub')}</p>
      <div class="quick-prompts">
        <button class="quick-btn" onclick="sendQuickPrompt(this)">${currentLang === 'ar' ? 'شرح مفهوم رياضي' : currentLang === 'fr' ? 'Expliquer un concept' : 'Explain a concept'}</button>
        <button class="quick-btn" onclick="sendQuickPrompt(this)">${currentLang === 'ar' ? 'تلخيص نص' : currentLang === 'fr' ? 'Résumer un texte' : 'Summarize text'}</button>
        <button class="quick-btn" onclick="sendQuickPrompt(this)">${currentLang === 'ar' ? 'مساعدة في الواجب' : currentLang === 'fr' ? "Aide aux devoirs" : 'Homework help'}</button>
      </div>
    </div>
  `;
}

function saveChatHistory() {
  if (chatHistory.length > 2) {
    const histContainer = document.getElementById('chat-history');
    const firstMsg = chatHistory[0]?.content?.substring(0, 30) + '...';
    // Add to sidebar if not exists
    if (!document.getElementById('ch-0')) {
      const item = document.createElement('div');
      item.className = 'chat-history-item active';
      item.id = 'ch-0';
      item.textContent = firstMsg;
      histContainer.prepend(item);
    }
  }
}

function parseMarkdown(text) {
  return text
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--surface2);padding:2px 6px;border-radius:4px">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// ===== GRADE CALCULATOR =====
function addGradeRow() {
  const list = document.getElementById('grades-list');
  const row = document.createElement('div');
  row.className = 'grade-row';
  row.innerHTML = `
    <input type="text" class="form-input" placeholder="${t('subjectNamePh') || t('subjectName')}">
    <input type="number" class="form-input" placeholder="${t('grade')}" min="0" max="20">
    <input type="number" class="form-input" placeholder="${t('coefficient')}" min="1" max="10" value="1">
    <button class="btn-icon danger" onclick="removeGradeRow(this)">🗑</button>
  `;
  list.appendChild(row);
}

function removeGradeRow(btn) {
  const rows = document.querySelectorAll('#grades-list .grade-row');
  if (rows.length > 1) btn.closest('.grade-row').remove();
}

function calculateGrades() {
  const rows = document.querySelectorAll('#grades-list .grade-row');
  let totalWeighted = 0, totalCoef = 0;
  const grades = [];
  let valid = true;
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const name = inputs[0].value.trim();
    const grade = parseFloat(inputs[1].value);
    const coef = parseFloat(inputs[2].value) || 1;
    if (!name || isNaN(grade)) { valid = false; return; }
    if (grade < 0 || grade > 20) { valid = false; return; }
    grades.push({ name, grade, coef });
    totalWeighted += grade * coef;
    totalCoef += coef;
  });
  if (!valid || grades.length === 0) { showToast(t('fillAll'), 'error'); return; }
  const avg = totalWeighted / totalCoef;
  const resultsDiv = document.getElementById('calc-results');
  resultsDiv.style.display = 'block';
  document.getElementById('result-score').textContent = avg.toFixed(2);
  // Mention
  let mention, color;
  if (avg >= 16) { mention = t('excellent'); color = '#10b981'; }
  else if (avg >= 14) { mention = t('veryGood'); color = '#6366f1'; }
  else if (avg >= 12) { mention = t('good'); color = '#f59e0b'; }
  else if (avg >= 10) { mention = t('acceptable'); color = '#f97316'; }
  else { mention = t('fail'); color = '#ef4444'; }
  document.getElementById('result-mention').textContent = mention;
  document.getElementById('result-mention').style.color = color;
  document.querySelector('.result-circle').style.background = `linear-gradient(135deg, ${color}, ${color}cc)`;
  // Bars
  const barsEl = document.getElementById('result-bars');
  barsEl.innerHTML = grades.slice(0, 5).map(g => `
    <div class="result-bar-item">
      <div class="result-bar-label"><span>${escHtml(g.name)}</span><span>${g.grade}/20</span></div>
      <div class="result-bar-track"><div class="result-bar-fill" style="width:${(g.grade/20)*100}%"></div></div>
    </div>
  `).join('');
  // Analysis
  const best = grades.reduce((a,b) => a.grade > b.grade ? a : b);
  const worst = grades.reduce((a,b) => a.grade < b.grade ? a : b);
  document.getElementById('result-analysis').innerHTML = `
    <p>📊 ${t('aiAnalysis')}</p>
    <p style="margin-top:0.5rem">⭐ ${t('yourBest')} <strong>${best.name}</strong> (${best.grade}/20)</p>
    <p>⚠️ ${t('yourWorst')} <strong>${worst.name}</strong> (${worst.grade}/20)</p>
  `;
  // Tips
  const tips = [];
  if (avg < 10) tips.push(currentLang === 'ar' ? '📌 ركز على المراجعة اليومية وطلب المساعدة من الأستاذ' : currentLang === 'fr' ? '📌 Concentrez-vous sur la révision quotidienne' : '📌 Focus on daily revision and ask your teacher for help');
  if (worst.grade < 10) tips.push(currentLang === 'ar' ? `📚 تحتاج تحسيناً كبيراً في: ${worst.name}` : `📚 Major improvement needed in: ${worst.name}`);
  if (avg >= 14) tips.push(currentLang === 'ar' ? '🌟 أداء رائع! حافظ على هذا المستوى' : '🌟 Great performance! Keep it up!');
  tips.push(currentLang === 'ar' ? '💡 استخدم المساعد الذكي لشرح المواضيع الصعبة' : '💡 Use the AI assistant to explain difficult topics');
  document.getElementById('result-tips').innerHTML = tips.map(tip => `<div class="tip-item"><span>${tip}</span></div>`).join('');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===== ADMIN =====
async function loadAdmin() {
  if (!currentUser) return;
  try {
    const [subjectsRes, lessonsRes] = await Promise.all([
      sb.from('subjects').select('id', { count: 'exact' }),
      sb.from('lessons').select('id', { count: 'exact' })
    ]);
    document.getElementById('total-subjects').textContent = subjectsRes.count || 0;
    document.getElementById('total-files').textContent = lessonsRes.count || 0;
    document.getElementById('total-users').textContent = '—';
    // Load recent subjects for admin view
    const { data: recentSubjects } = await sb.from('subjects').select('*').order('created_at', { ascending: false }).limit(20);
    const wrap = document.getElementById('users-table-wrap');
    if (recentSubjects && recentSubjects.length) {
      wrap.innerHTML = `
        <table class="users-table">
          <thead><tr>
            <th>${t('subjectName')}</th>
            <th>${t('coefficient')}</th>
            <th></th>
          </tr></thead>
          <tbody>
            ${recentSubjects.map(s => `
              <tr>
                <td>${s.icon || '📚'} ${escHtml(s.name)}</td>
                <td>${s.coefficient || 1}</td>
                <td><button class="btn-icon danger" onclick="confirmDelete('subject','${s.id}')">🗑</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      wrap.innerHTML = `<div class="empty-state"><p>${t('noSubjectsYet')}</p></div>`;
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===== UTILITIES =====
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== INIT =====
async function init() {
  initTheme();
  setLang(currentLang);
  // Update lang buttons
  document.querySelectorAll('.lang-btn').forEach(b => {
    const txt = b.textContent.trim();
    b.classList.toggle('active', 
      (currentLang === 'ar' && txt === 'ع') ||
      (currentLang === 'en' && txt === 'EN') ||
      (currentLang === 'fr' && txt === 'FR')
    );
  });
  // Check auth
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    onLogin(session.user);
  } else {
    showPage('home');
  }
  // Listen to auth changes
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) onLogin(session.user);
    if (event === 'SIGNED_OUT') onLogout();
  });
  // Hide loading screen
  setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    loader.classList.add('hidden');
  }, 2200);
}

// Start app
init();
