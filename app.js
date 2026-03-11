// ══════════════════════════════════════
// API KEY
// ══════════════════════════════════════
function getApiKey() { return sessionStorage.getItem('ab_key') || ''; }
function saveApiKey(key) { sessionStorage.setItem('ab_key', key); }
function saveKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key.startsWith('sk-ant-')) { showToast('Clé invalide — doit commencer par sk-ant-'); return; }
  saveApiKey(key);
  document.getElementById('apiModal').style.display = 'none';
  showToast('Clé API sauvegardée ✓');
}
function checkApiKey() {
  if (!getApiKey()) { document.getElementById('apiModal').style.display = 'flex'; return false; }
  return true;
}

// ══════════════════════════════════════
// THEME
// ══════════════════════════════════════
function toggleTheme() {
  const isLight = document.body.classList.toggle('theme-light');
  localStorage.setItem('ab_theme', isLight ? 'light' : 'dark');
  document.getElementById('themeBtn').textContent = isLight ? '☀️' : '🌙';
}

// Init theme
(function() {
  if (localStorage.getItem('ab_theme') === 'light') {
    document.body.classList.add('theme-light');
    document.getElementById('themeBtn').textContent = '☀️';
  }
})();

// ══════════════════════════════════════
// MODES CONFIG
// ══════════════════════════════════════
const MODES = {
  cfo: {
    icon: '🧮', name: 'CFO IA', desc: 'Expert en finances et trésorerie',
    welcome: 'Bonjour, je suis ton CFO IA',
    welcomeText: "Pose-moi n'importe quelle question sur tes finances, ta trésorerie, ta comptabilité ou tes impôts.",
    suggestions: ['Comment gérer ma trésorerie ?', 'Quel est le taux de TVA au Sénégal ?', 'Comment calculer mon bénéfice net ?', 'Comment réduire mes charges ?'],
    prompt: `Tu es le CFO IA d'AfriaBrain, expert en finances pour les PME d'Afrique de l'Ouest.
CONTEXTE FISCAL SÉNÉGAL : TVA standard 18%, TVA réduite alimentaire 10%, IS 30%, IPRES 8.4% employeur 5.6% employé, CSS 7% employeur 3% employé.
RÈGLES : Toujours donner des chiffres en FCFA. Proposer 3 actions concrètes. Répondre en français simple. Maximum 250 mots.`
  },
  ohada: {
    icon: '⚖️', name: 'Juriste OHADA', desc: 'Droit des affaires et contrats',
    welcome: 'Bonjour, je suis ton Juriste OHADA',
    welcomeText: "Je t'aide avec tes questions juridiques, tes contrats et la conformité OHADA.",
    suggestions: ['Comment créer une SARL au Sénégal ?', 'Quel contrat pour un fournisseur ?', 'Délai légal de paiement ?', 'Comment protéger ma marque ?'],
    prompt: `Tu es le Juriste OHADA d'AfriaBrain, expert en droit des affaires pour les PME d'Afrique de l'Ouest.
DROIT OHADA : SARL capital min 1 FCFA, SA capital min 10M FCFA, délai paiement 60 jours max. RCCM et NINEA obligatoires au Sénégal.
RÈGLES : Citer l'acte uniforme. Donner les étapes et coûts en FCFA. Maximum 250 mots.`
  },
  financement: {
    icon: '🏦', name: 'Financement', desc: 'Accès aux financements africains',
    welcome: 'Bonjour, je suis ton Expert Financement',
    welcomeText: "Je t'aide à trouver les meilleurs financements disponibles pour ta PME en Afrique.",
    suggestions: ['Quels financements pour ma PME ?', 'Comment accéder au DER/FJ ?', 'Conditions du fonds BOAD ?', 'Microfinance ou banque ?'],
    prompt: `Tu es l'Expert Financement d'AfriaBrain pour les PME d'Afrique de l'Ouest.
FINANCEMENTS : DER/FJ jusqu'à 50M FCFA, BOAD grands projets, FONGIP garanties, BNDE, ADEPME, CMS/PAMECAS/ACEP microfinances jusqu'à 10M FCFA.
RÈGLES : Identifier le bon financement. Donner montants taux conditions. Lister documents nécessaires. Maximum 250 mots.`
  },
  strategie: {
    icon: '📊', name: 'Stratégie', desc: 'Marché, pricing et croissance',
    welcome: 'Bonjour, je suis ton Stratège Business',
    welcomeText: "Je t'aide à développer ta stratégie de marché, ton pricing et ta croissance en Afrique.",
    suggestions: ['Comment fixer mon prix de vente ?', 'Comment analyser mes concurrents ?', 'Stratégie pour se développer ?', 'Comment fidéliser mes clients ?'],
    prompt: `Tu es le Stratège Business d'AfriaBrain pour les PME d'Afrique de l'Ouest.
CONTEXTE : Marché informel 60-80%, mobile first 85%+, WhatsApp Business canal principal, Wave et Orange Money paiements dominants, saisonnalité Tabaski Korité Magal.
RÈGLES : Adapter au contexte africain. Exemples en FCFA. Stratégies low-cost. 3 actions prioritaires. Maximum 250 mots.`
  },
  commercial: {
    icon: '🤝', name: 'Commercial', desc: 'Ventes, clients et fidélisation',
    welcome: 'Bonjour, je suis ton Expert Commercial',
    welcomeText: "Je t'aide à développer tes ventes, gérer tes clients et booster ton chiffre d'affaires.",
    suggestions: ['Comment trouver de nouveaux clients ?', 'Script de vente WhatsApp ?', 'Comment fidéliser mes clients ?', 'Comment négocier avec les fournisseurs ?'],
    prompt: `Tu es l'Expert Commercial d'AfriaBrain pour les PME d'Afrique de l'Ouest.
CONTEXTE : WhatsApp canal de vente principal, confiance personnelle cruciale, Wave OM facilitent conversion, bouche à oreille canal #1, prix psychologiques 9900 FCFA.
RÈGLES : Scripts de vente prêts en français. Techniques marché africain. Exemples FCFA. 3 actions cette semaine. Maximum 250 mots.`
  }
};

// ══════════════════════════════════════
// STATE
// ══════════════════════════════════════
let currentMode = 'cfo';
let currentUser = null;
let messages = [];
let isLoading = false;

// ══════════════════════════════════════
// SCREENS
// ══════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goToApp(mode) {
  currentMode = mode;
  if (!currentUser) currentUser = { name: 'Demo', email: 'demo@afriabrain.co' };
  initApp();
  showScreen('app');
}

// ══════════════════════════════════════
// AUTH
// ══════════════════════════════════════
function switchTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { showToast('Veuillez remplir tous les champs'); return; }
  currentUser = { name: email.split('@')[0], email };
  initApp(); showScreen('app');
}

function register() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  if (!name || !email || !password) { showToast('Veuillez remplir tous les champs'); return; }
  currentUser = { name, email };
  initApp(); showScreen('app');
  showToast('Bienvenue sur AfriaBrain ! 🎉');
}

function logout() {
  currentUser = null; messages = []; currentMode = 'cfo';
  showScreen('landing');
}

// ══════════════════════════════════════
// APP
// ══════════════════════════════════════
function initApp() {
  document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('userName').textContent = currentUser.name;
  updateModeUI(currentMode);
}

function updateModeUI(mode) {
  const m = MODES[mode];
  document.getElementById('headerIcon').textContent = m.icon;
  document.getElementById('headerName').textContent = m.name;
  document.getElementById('headerDesc').textContent = m.desc;
  document.getElementById('welcomeIcon').textContent = m.icon;
  document.getElementById('welcomeTitle').textContent = m.welcome;
  document.getElementById('welcomeText').textContent = m.welcomeText;
  document.getElementById('suggestions').innerHTML = m.suggestions.map(s =>
    `<div class="suggestion" onclick="sendSuggestion('${s}')">${s}</div>`).join('');
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`btn-${mode}`).classList.add('active');
}

function switchMode(mode) {
  currentMode = mode; messages = [];
  const container = document.getElementById('messages');
  container.innerHTML = '';
  const welcome = document.createElement('div');
  welcome.className = 'welcome'; welcome.id = 'welcome';
  welcome.innerHTML = `
    <div class="welcome-icon">${MODES[mode].icon}</div>
    <h2>${MODES[mode].welcome}</h2>
    <p>${MODES[mode].welcomeText}</p>
    <div class="suggestions">
      ${MODES[mode].suggestions.map(s => `<div class="suggestion" onclick="sendSuggestion('${s}')">${s}</div>`).join('')}
    </div>`;
  container.appendChild(welcome);
  updateModeUI(mode);
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// ══════════════════════════════════════
// MESSAGING
// ══════════════════════════════════════
function sendSuggestion(text) {
  document.getElementById('messageInput').value = text;
  sendMessage();
}

async function sendMessage() {
  if (!checkApiKey()) return;
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text || isLoading) return;

  const welcome = document.getElementById('welcome');
  if (welcome) welcome.remove();

  addMessage('user', text);
  messages.push({ role: 'user', content: text });
  input.value = ''; autoResize(input);

  const typingId = showTyping();
  isLoading = true;
  document.getElementById('sendBtn').disabled = true;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getApiKey(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: MODES[currentMode].prompt,
        messages: messages
      })
    });

    const data = await response.json();
    removeTyping(typingId);

    if (!response.ok) {
      const errMsg = data.error?.message || JSON.stringify(data);
      addMessage('assistant', '❌ Erreur API (' + response.status + ') : ' + errMsg);
      isLoading = false;
      document.getElementById('sendBtn').disabled = false;
      input.focus();
      return;
    }

    const reply = data.content?.[0]?.text || "Désolé, je n'ai pas pu traiter ta demande.";
    addMessage('assistant', reply);
    messages.push({ role: 'assistant', content: reply });

  } catch (err) {
    removeTyping(typingId);
    addMessage('assistant', '❌ Erreur : ' + err.message);
  }

  isLoading = false;
  document.getElementById('sendBtn').disabled = false;
  input.focus();
}

function addMessage(role, text) {
  const container = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.className = `message ${role}`;
  const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  msg.innerHTML = `
    <div class="msg-avatar">${role === 'user' ? currentUser.name.charAt(0).toUpperCase() : MODES[currentMode].icon}</div>
    <div class="msg-bubble">${formatted}</div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('messages');
  const id = 'typing-' + Date.now();
  const el = document.createElement('div');
  el.className = 'message assistant typing'; el.id = id;
  el.innerHTML = `<div class="msg-avatar">${MODES[currentMode].icon}</div><div class="msg-bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTyping(id) { const el = document.getElementById(id); if (el) el.remove(); }

function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('show'); }
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
