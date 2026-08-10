const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/";

const CODE_BLOCKED_PATTERNS = [
  /\bimport\s+os\b/i,
  /\bimport\s+subprocess\b/i,
  /\bimport\s+shutil\b/i,
  /\bimport\s+sys\b/i,
  /\b__import__\s*\(/i,
  /\beval\s*\(/i,
  /\bexec\s*\(/i,
  /\bopen\s*\(/i,
  /\bcompile\s*\(/i,
  /\bos\./i,
  /\bsubprocess\./i,
];

/* ── Varsayılan konu verisi ── */
const DEFAULT_TOPICS = [
  { title: "Bölüm 1: Temel Python Objeleri ve Veri Yapıları", duration: "2 Saat 12 Dk" },
  { title: "Bölüm 2: Koşullu Durumlar", duration: "55 Dk" },
  { title: "Bölüm 3: Pythonda Döngü Yapıları", duration: "1 Saat 33 Dk" },
  { title: "Bölüm 4: Fonksiyonlar", duration: "1 Saat 11 Dk" },
  { title: "Bölüm 5: Modüller", duration: "32 Dk" },
  { title: "Bölüm 6: Nesne Tabanlı Programlama", duration: "1 Saat 24 Dk" },
  { title: "Bölüm 7: Hatalar ve İstisnalar", duration: "20 Dk" },
  { title: "Bölüm 8: Dosya İşlemleri", duration: "55 Dk" },
  { title: "Bölüm 9: Pythondaki Gömülü Fonksiyonlar", duration: "38 Dk" },
  { title: "Bölüm 10: İleri Seviye Veri Yapıları ve Objeler", duration: "58 Dk" },
  { title: "Bölüm 11: Sqlite Veritabanı", duration: "1 Saat 14 Dk" },
  { title: "Bölüm 12: Fonksiyonların İleri Seviye Özellikleri ve Decoratorlar", duration: "37 Dk" },
  { title: "Bölüm 13: Pythondaki Iteratorlar ve Generatorlar", duration: "33 Dk" },
  { title: "Bölüm 14: Pythondaki İleri Seviye Modüller", duration: "45 Dk" },
  { title: "Bölüm 15: PyQt5 - Arayüz Geliştirme", duration: "2 Saat" },
  { title: "Bölüm 16: Python Kursu 2. Seviye Başlıyor!", duration: "5 Dk" },
  { title: "Bölüm 17: Flask Framework ile Web Geliştirme Temelleri", duration: "1 Saat 30 Dk" },
  { title: "Bölüm 18: Flask, ORM ve SqlAlchemy ile Todo App", duration: "1 Saat 15 Dk" },
  { title: "Bölüm 19: Django Framework ile Web Geliştirme Temelleri", duration: "2 Saat" },
  { title: "Bölüm 20: Flask Websitesinin Yayına Alınması", duration: "45 Dk" },
  { title: "Bölüm 21: Django Websitesinin Yayına Alınması", duration: "45 Dk" },
  { title: "Bölüm 22: Selenium ve Ekşi Sözlük", duration: "34 Dk" },
  { title: "Bölüm 23: Selenium ve Twitter", duration: "34 Dk" },
  { title: "Bölüm 24: Selenium ve Instagram", duration: "34 Dk" },
  { title: "Bölüm 25: Flask ve Fixer.io ile Döviz Çevirici", duration: "38 Dk" },
  { title: "Bölüm 26: Github Rest Api ile Github Finder", duration: "36 Dk" },
  { title: "Bölüm 27: Scrapy Framework ve kitapyurdu.com Projesi", duration: "1 Saat 36 Dk" },
  { title: "Bölüm 28: Veri Analizi - Numpy", duration: "38 Dk" },
  { title: "Bölüm 29: Veri Analizi - Pandas", duration: "2 Saat 13 Dk" },
  { title: "Bölüm 30: U.S Soccer Leauge Salaries Analizi", duration: "18 Dk" },
  { title: "Bölüm 31: Youtube Video İstatistikleri Analizi", duration: "29 Dk" },
  { title: "Bölüm 32: Veri Görselleştirme - Matplotlib", duration: "1 Saat" },
];

const STORAGE_KEY = "python_yol_data_v1";

function topicSectionTitle(title) {
  return title.includes(": ") ? title.split(": ", 2)[1] : title;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getRankTitle(xp) {
  if (xp >= 1500) return "Usta Yazılımcı 👑";
  if (xp >= 500) return "Gelişen Yazılımcı 📘";
  return "Yeni Başlayan 🐍";
}

function statsToDict(stats) {
  const xp = stats.total_xp;
  return {
    streak_count: stats.streak_count,
    last_active_date: stats.last_active_date,
    total_xp: xp,
    user_level: stats.user_level,
    rank_title: getRankTitle(xp),
    xp_to_next_level: xp % 500 !== 0 ? 500 - (xp % 500) : 500,
    level_progress_pct: (xp % 500) / 5,
  };
}

function createInitialState() {
  return {
    topics: DEFAULT_TOPICS.map((topic, index) => ({
      id: index + 1,
      title: topic.title,
      duration: topic.duration,
      is_completed: false,
      notes: "",
      time_spent: 0,
    })),
    stats: {
      streak_count: 0,
      last_active_date: "",
      total_xp: 0,
      user_level: 1,
    },
    activity: {},
    learning: { flashcards: {}, quizzes: {}, bosses: {} },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed?.topics?.length) return createInitialState();
    if (!parsed.learning) parsed.learning = { flashcards: {}, quizzes: {}, bosses: {} };
    if (!parsed.learning.bosses) parsed.learning.bosses = {};
    if (!parsed.activity) parsed.activity = {};
    parsed.topics.forEach((t) => {
      if (t.resources) delete t.resources;
    });
    return parsed;
  } catch {
    return createInitialState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateStreak(state) {
  const today = todayIso();
  const stats = state.stats;
  if (stats.last_active_date === today) return;

  if (stats.last_active_date === yesterdayIso()) {
    stats.streak_count += 1;
  } else {
    stats.streak_count = 1;
  }
  stats.last_active_date = today;
}

function addXp(state, amount) {
  if (amount <= 0) return statsToDict(state.stats);
  updateStreak(state);
  const stats = state.stats;
  stats.total_xp += amount;
  stats.user_level = Math.floor(stats.total_xp / 500) + 1;
  return statsToDict(stats);
}

function addDailyMinutes(state, minutes) {
  if (minutes <= 0) return;
  const today = todayIso();
  state.activity[today] = (state.activity[today] || 0) + minutes;
}

function getActivityMap(state, days = 30) {
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, minutes: state.activity[key] || 0 });
  }
  return result;
}

function findTopic(state, topicId) {
  return state.topics.find((t) => t.id === topicId) || null;
}

/* ═══ İNTERAKTİF PYTHON AKADEMİSİ — İÇERİK & ÖĞRENME MOTORU ═══ */

const MODULE_KEYS = [
  "data", "conditionals", "loops", "functions", "modules", "oop", "errors", "files",
  "builtins", "collections", "sqlite", "decorators", "iterators", "adv_modules",
  "pyqt", "level2", "flask", "sqlalchemy", "django", "deploy_flask", "deploy_django",
  "selenium", "selenium2", "selenium3", "flask_api", "github_api", "scrapy",
  "numpy", "pandas", "pandas_proj", "api_proj", "matplotlib",
];

const BOSS_XP_REWARD = 500;

const BOSS_FIGHTS = {
  data: {
    monster: "Veri Golem",
    emoji: "🗿",
    task: "`ters_cevir(elemanlar)` fonksiyonunu yaz. Verilen listeyi ters sırada yeni bir liste olarak döndürsün; orijinal listeyi değiştirmesin.",
    starter: "def ters_cevir(elemanlar):\n    # Listeyi ters çevir\n    pass\n",
    tests: `assert ters_cevir([1, 2, 3]) == [3, 2, 1]
assert ters_cevir([]) == []
assert ters_cevir(['a', 'b']) == ['b', 'a']
assert ters_cevir([1, 1]) == [1, 1]`,
  },
  conditionals: {
    monster: "Koşul Hydra",
    emoji: "🐍",
    task: "`not_mu(puan)` fonksiyonunu yaz. 0–100 arası puan alır: 90+ → 'AA', 70+ → 'BB', 50+ → 'CC', aksi halde 'FF' döndürsün.",
    starter: "def not_mu(puan):\n    pass\n",
    tests: `assert not_mu(95) == 'AA'
assert not_mu(70) == 'BB'
assert not_mu(55) == 'CC'
assert not_mu(40) == 'FF'`,
  },
  loops: {
    monster: "Döngü Dev",
    emoji: "👾",
    task: "`cift_toplam(sayilar)` fonksiyonunu yaz. Parametre olarak aldığı listedeki çift sayıları toplayıp döndürsün.",
    starter: "def cift_toplam(sayilar):\n    # Çift sayıları topla\n    pass\n",
    tests: `assert cift_toplam([1, 2, 3, 4]) == 6
assert cift_toplam([]) == 0
assert cift_toplam([2, 4, 6]) == 12
assert cift_toplam([1, 3, 5]) == 0`,
  },
  functions: {
    monster: "Fonksiyon Phantom",
    emoji: "👻",
    task: "`tekrarli_selam(isim, adet=1)` fonksiyonunu yaz. 'Merhaba {isim}!' metnini adet kadar boşlukla birleştirip döndürsün.",
    starter: "def tekrarli_selam(isim, adet=1):\n    pass\n",
    tests: `assert tekrarli_selam('Ali') == 'Merhaba Ali!'
assert tekrarli_selam('Ali', 2) == 'Merhaba Ali! Merhaba Ali!'
assert tekrarli_selam('Ayşe', 3).count('Merhaba') == 3`,
  },
  modules: {
    monster: "Import Sentinel",
    emoji: "📦",
    task: "`kareler(liste)` fonksiyonunu yaz. Listedeki her sayının karesini yeni bir listede döndürsün.",
    starter: "def kareler(liste):\n    pass\n",
    tests: `assert kareler([1, 2, 3]) == [1, 4, 9]
assert kareler([]) == []
assert kareler([-2, 0]) == [4, 0]`,
  },
  oop: {
    monster: "Sınıf Titan",
    emoji: "🛡️",
    task: "`Dikdortgen` sınıfını yaz. `__init__(self, genislik, yukseklik)` ve `alan(self)` metodu olsun; alan genişlik × yükseklik döndürsün.",
    starter: "class Dikdortgen:\n    def __init__(self, genislik, yukseklik):\n        pass\n\n    def alan(self):\n        pass\n",
    tests: `r = Dikdortgen(4, 5)
assert r.alan() == 20
k = Dikdortgen(3, 3)
assert k.alan() == 9`,
  },
  errors: {
    monster: "Exception Wraith",
    emoji: "💀",
    task: "`guvenli_bol(a, b)` fonksiyonunu yaz. b sıfırsa None döndürsün; aksi halde a/b sonucunu döndürsün (try/except kullan).",
    starter: "def guvenli_bol(a, b):\n    pass\n",
    tests: `assert guvenli_bol(10, 2) == 5
assert guvenli_bol(10, 0) is None
assert guvenli_bol(7, 2) == 3.5`,
  },
  files: {
    monster: "Metin Specter",
    emoji: "📜",
    task: "`satir_say(metin)` fonksiyonunu yaz. Metindeki satır sayısını döndürsün (\\n ile ayrılmış satırlar).",
    starter: "def satir_say(metin):\n    pass\n",
    tests: `assert satir_say('a\\nb\\nc') == 3
assert satir_say('tek') == 1
assert satir_say('') == 1
assert satir_say('a\\n') == 2`,
  },
};

const ORDUCK_KNOWLEDGE = [
  {
    keys: ["liste", "list", "dizi", "append", "pop"],
    mentor: "Listeler sıralı veri tutar. append() sona ekler, indeks 0'dan başlar. len(liste) boyutu verir.",
    strict: "Liste karıştırma oyunu değil — indeks taşarsa IndexError gelir. len()'i unutma.",
    socratic: "Bu listenin uzunluğu kaç? Son elemana hangi indeksle ulaşırsın?",
  },
  {
    keys: ["sözlük", "dict", "dictionary", "anahtar", "key"],
    mentor: "Sözlükler anahtar-değer çiftleri tutar. Anahtar yoksa .get() güvenli bir alternatiftir.",
    strict: "KeyError = olmayan anahtara koşmak. get() kullanmayı öğren, hayat kurtarır.",
    socratic: "Aradığın anahtar gerçekten sözlükte var mı — nasıl doğrularsın?",
  },
  {
    keys: ["döngü", "for", "while", "range"],
    mentor: "for genelde koleksiyonlar üzerinde, while koşul doğru olduğu sürece döner. range(n) 0'dan n-1'e gider.",
    strict: "Sonsuz while mı yazdın? Koşulun bir gün False olmalı — yoksa tarayıcı da seninle ağlar.",
    socratic: "Döngün ne zaman duracak? Durma koşulunu tek cümleyle söyleyebilir misin?",
  },
  {
    keys: ["fonksiyon", "def", "return", "parametre"],
    mentor: "def ile fonksiyon tanımlarsın; return sonucu geri verir. Parametreler girdiyi taşır.",
    strict: "return'süz fonksiyon None döner — bazen kasıtlı, çoğu zaman sürpriz.",
    socratic: "Fonksiyonun girdisi ne, çıktısı ne — ikisini net ayırabilir misin?",
  },
  {
    keys: ["if", "else", "elif", "koşul"],
    mentor: "Koşullu ifadeler karar verir. elif zinciri alternatifleri sırayla dener.",
    strict: "if'ten sonra mutlaka : var mı? Python'da iki nokta unutulursa SyntaxError gelir.",
    socratic: "Hangi koşul True olduğunda hangi dal çalışır — tablo yapabilir misin?",
  },
  {
    keys: ["print", "çıktı", "output"],
    mentor: "print() değerleri terminale yazar. f-string ile değişken gömmek okunabilirliği artırır.",
    strict: "Python 3'te print merhaba yazmaz — print('merhaba'). Parantez şaka değil.",
    socratic: "Ekranda görmek istediğin değer tam olarak hangi değişkende?",
  },
  {
    keys: ["xp", "seviye", "level", "streak", "seri"],
    mentor: "XP kart çevirme (+10), quiz (+100), süre kaydı (+10/dk) ve Boss (+500) ile gelir. Seri günlük aktiviteyi ödüllendirir.",
    strict: "XP kasılmıyor mu? Quiz geç, kart çevir veya süreyi kaydet — bedava değil.",
    socratic: "Bugün XP kazanmak için hangi aksiyonu seçeceksin?",
  },
  {
    keys: ["boss", "patron", "canavar", "unit test", "assert"],
    mentor: "Boss Fight'ta gizli assert testleri kodunu doğrular. Görev metnindeki fonksiyon adına dikkat et.",
    strict: "Canavar assert ile konuşur — isim uyuşmazlığı en büyük tuzak. Görevi kelime kelime oku.",
    socratic: "Testin beklediği çıktı ile senin return değerin aynı mı — nasıl kanıtlarsın?",
  },
  {
    keys: ["kısayol", "shortcut", "?", "klavye"],
    mentor: "Uygulama içindeyken ? tuşu kısayol panelini açar. Merdivende Enter ile modül açılır.",
    strict: "Fareyle her şeye tıklama — ? ile kısayolları öğren, hız kazan.",
    socratic: "Sık yaptığın işlem hangi kısayolla daha hızlı olurdu?",
  },
  {
    keys: ["pyodide", "laboratuvar", "terminal", "kod"],
    mentor: "Kod Laboratuvarı Pyodide ile tarayıcıda Python çalıştırır. ▶ Kodu Ateşle ile dene.",
    strict: "Kodu çalıştırmadan tahmin yürütme — Pyodide bedava, kullan.",
    socratic: "Kodunu çalıştırmadan önce ne olmasını bekliyorsun — yazabilir misin?",
  },
];

const DUCK_ERROR_LINES = {
  generic: {
    mentor: "Hata yakalandı. Kodu satır satır anlat — birlikte izleyelim.",
    strict: "Terminal kırmızı — klasik. İlk hata satırını oku, sonra panik yap.",
    socratic: "Hata mesajı sana ne sormaya çalışıyor? İlk satırı yüksek sesle oku.",
  },
  syntax: {
    mentor: "SyntaxError: parantez, iki nokta veya tırnak eksik olabilir.",
    strict: "SyntaxError = Python cümleyi anlamadı. Muhtemelen `:` veya `)` eksik — kahve molası değil, düzelt.",
    socratic: "Hata satırının hemen üstünde hangi karakter eksik olabilir?",
  },
  indent: {
    mentor: "IndentationError: girinti Python'da sözdiziminin parçasıdır.",
    strict: "Girinti hatası — tab ve boşluk karışımı mı? Bir stil seç, sadık kal.",
    socratic: "Blok içindeki satırlar aynı hizada mı — hangi satır kaymış?",
  },
  name: {
    mentor: "NameError: tanımsız bir isim kullanılmış olabilir.",
    strict: "NameError = Python o ismi tanımıyor. Yazım mı, tanımlamayı mı unuttun?",
    socratic: "Bu değişkeni nerede tanımladın — gerçekten tanımladın mı?",
  },
  type: {
    mentor: "TypeError: yanlış tipte işlem yapılıyor olabilir.",
    strict: "TypeError = elma ile armut topluyorsun. Türleri print() ile gör.",
    socratic: "İki değerin türü uyumlu mu — hangisini dönüştürmelisin?",
  },
  index: {
    mentor: "Index/KeyError: olmayan bir elemana erişilmiş olabilir.",
    strict: "Index/KeyError — sınır dışı veya olmayan anahtar. len() ve .get() dostundur.",
    socratic: "Erişmeye çalıştığın indeks veya anahtar gerçekten var mı?",
  },
  value: {
    mentor: "ValueError: değer biçimi uygun değil.",
    strict: "ValueError — doğru tür ama yanlış içerik. int('abc') klasik örnektir.",
    socratic: "Girdiyi dönüştürmeden önce geçerliliğini nasıl kontrol edersin?",
  },
  zero: {
    mentor: "ZeroDivisionError: sıfıra bölme yapılmış.",
    strict: "Sıfıra böldün — matematik değil, Python kızar. Payda kontrolü ekle.",
    socratic: "Payda sıfır olabilir mi — hangi koşulla korursun?",
  },
  assert: {
    mentor: "Unit test geçmedi. Dönüş değerini ve kenar durumlarını gözden geçir.",
    strict: "Assert patladı — fonksiyon adı, parametre ve return. Üçlü kontrol, hemen.",
    socratic: "Testin beklediği sonuç ile senin sonucun nerede ayrışıyor?",
  },
};

let duckPersonality = "mentor";
let duckChatOpen = false;
let duckWelcomePending = true;
let duckLastLine = "";
let duckWelcomeShown = false;

/* ── ORDEK.AI Enterprise: Hibrit AI + Guardrails ── */
const ORDUCK_AI_CONFIG = {
  ollamaGenerateUrl: "http://localhost:11434/api/generate",
  ollamaChatUrl: "http://localhost:11434/api/chat",
  ollamaTagsUrl: "http://localhost:11434/api/tags",
  defaultModel: "qwen2.5-coder:latest",
  fallbackModels: ["qwen2.5-coder:7b", "llama3.2:latest", "llama3:latest"],
  probeTimeoutMs: 1800,
  generateTimeoutMs: 45000,
  maxHistoryTurns: 14,
};

const ORDUCK_INPUT_GUARDRAILS = [
  { pattern: /ignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts?)/i, reason: "jailbreak" },
  { pattern: /(system\s*prompt|prompt\s*injection|jailbreak|dan\s+mode|do\s+anything\s+now)/i, reason: "jailbreak" },
  { pattern: /(forget|disregard|override)\s+(your|all)\s+(rules|instructions|guidelines)/i, reason: "jailbreak" },
  { pattern: /\bos\.system\b|\bsubprocess\b|\brm\s+-rf\b|\bformat\s+c:/i, reason: "harmful" },
  { pattern: /\beval\s*\(|\bexec\s*\(|\b__import__\s*\(/i, reason: "harmful" },
  { pattern: /<script[\s>]|[\s"']javascript:/i, reason: "xss" },
  { pattern: /\b(api[_-]?key|secret|password|token)\s*[:=]/i, reason: "secrets" },
];

const ORDUCK_GUARDRAIL_MESSAGES = {
  jailbreak: "Güvenlik duvarı: sistem talimatlarını atlatmaya yönelik girdiler engellendi.",
  harmful: "Güvenlik duvarı: zararlı sistem komutları içeren girdiler engellendi.",
  xss: "Güvenlik duvarı: güvenli olmayan içerik engellendi.",
  secrets: "Güvenlik duvarı: hassas veri paylaşımı engellendi.",
  default: "Güvenlik duvarı: girdi reddedildi.",
};

const orduckAiState = {
  mode: "rules",
  webgpu: false,
  model: null,
  probing: false,
  lastProbe: 0,
};

let orduckMessageBusy = false;
const orduckChatHistory = [];
const conversationHistory = orduckChatHistory;
const ORDUCK_MEMORY_KEY = "python_yol_orduck_conversation_v1";
let orduckConversationContext = { lastTopic: null, lastIntent: null };
let orduckThreadTypewriterId = null;
let orduckSpeechRecognition = null;
let orduckMicActive = false;
let orduckErrorToastTimeoutId = null;
let orduckErrorPulseTimeoutId = null;

function formatOrduckPlainText(text) {
  return String(text || "")
    .replace(/```(?:python|py)?\s*\n([\s\S]*?)```/gi, (_, code) => `\n${code.trim()}\n`)
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function formatOrduckMessageHtml(text) {
  const raw = String(text || "");
  const parts = [];
  const re = /```(?:python|py)?\s*\n([\s\S]*?)```/gi;
  let last = 0;
  let match = re.exec(raw);
  while (match) {
    if (match.index > last) {
      parts.push({ type: "text", value: raw.slice(last, match.index) });
    }
    parts.push({ type: "code", value: match[1].trim() });
    last = match.index + match[0].length;
    match = re.exec(raw);
  }
  if (last < raw.length) parts.push({ type: "text", value: raw.slice(last) });
  if (!parts.length) parts.push({ type: "text", value: raw });

  return parts.map((part) => {
    if (part.type === "code") {
      const encoded = encodeURIComponent(part.value);
      return `<div class="orduck-code-wrap"><pre class="orduck-code-block"><code>${escapeHtml(part.value)}</code></pre>`
        + `<div class="orduck-code-actions">`
        + `<button type="button" class="orduck-code-btn" data-orduck-copy="${encoded}">📋 Kopyala</button>`
        + `<button type="button" class="orduck-code-btn" data-orduck-insert="${encoded}">▶ Editöre Aktar</button>`
        + `</div></div>`;
    }
    return escapeHtml(part.value).replace(/\n/g, "<br>");
  }).join("");
}

function scrollOrduckChatToBottom() {
  if (el.orduckChatBody) el.orduckChatBody.scrollTop = el.orduckChatBody.scrollHeight;
  else if (el.orduckChatThread) el.orduckChatThread.scrollTop = el.orduckChatThread.scrollHeight;
}

function setOrduckThinking(active) {
  el.orduckChatStatus?.classList.toggle("hidden", !active);
  if (active) scrollOrduckChatToBottom();
}

function renderOrduckChatThread(activeTypewriterId = null, partialText = null) {
  if (!el.orduckChatThread) return;
  el.orduckChatThread.innerHTML = orduckChatHistory.map((msg) => {
    const isTyping = activeTypewriterId === msg.id;
    const body = isTyping ? formatOrduckMessageHtml(partialText || "") : formatOrduckMessageHtml(msg.text);
    const alertClass = msg.alert ? " is-alert" : "";
    const speakBtn = msg.role === "assistant" && msg.text
      ? `<div class="orduck-msg-toolbar"><button type="button" class="orduck-speak-btn" data-orduck-speak="${msg.id}" aria-label="Sesli oku">🔊 Sesli Oku</button></div>`
      : "";
    return `<article class="orduck-msg orduck-msg--${msg.role}${alertClass}" data-orduck-id="${msg.id}">
      <span class="orduck-msg-label">${msg.role === "user" ? "Sen" : "ORDEK.AI"}</span>
      <div class="orduck-msg-body">${body}</div>${speakBtn}
    </article>`;
  }).join("");
  scrollOrduckChatToBottom();
}

function loadOrduckConversationMemory() {
  try {
    const raw = localStorage.getItem(ORDUCK_MEMORY_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return false;
    orduckChatHistory.length = 0;
    parsed.slice(-40).forEach((entry) => {
      if (!entry || !entry.role || !entry.text) return;
      orduckChatHistory.push({
        id: entry.id || `m-${entry.ts || Date.now()}`,
        role: entry.role,
        text: String(entry.text),
        alert: Boolean(entry.alert),
        ts: entry.ts || Date.now(),
      });
    });
    return orduckChatHistory.length > 0;
  } catch {
    return false;
  }
}

function saveOrduckConversationMemory() {
  try {
    localStorage.setItem(
      ORDUCK_MEMORY_KEY,
      JSON.stringify(
        orduckChatHistory.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          ts: m.ts,
          alert: m.alert,
        })),
      ),
    );
  } catch { /* ignore quota */ }
}

function appendOrduckChatMessage(role, text, options = {}) {
  const entry = {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    text: String(text || ""),
    alert: Boolean(options.alert),
    ts: Date.now(),
  };
  orduckChatHistory.push(entry);
  if (orduckChatHistory.length > 40) orduckChatHistory.splice(0, orduckChatHistory.length - 40);
  saveOrduckConversationMemory();
  if (options.typewriter && role === "assistant" && entry.text) {
    typewriteOrduckThread(entry.id, entry.text, options.speed || 14);
    return entry;
  }
  renderOrduckChatThread();
  return entry;
}

function typewriteOrduckThread(messageId, text, speed = 14) {
  if (orduckThreadTypewriterId !== null) {
    clearInterval(orduckThreadTypewriterId);
    orduckThreadTypewriterId = null;
  }
  let i = 0;
  renderOrduckChatThread(messageId, "");
  orduckThreadTypewriterId = window.setInterval(() => {
    i += 1;
    renderOrduckChatThread(messageId, text.slice(0, i));
    if (i >= text.length) {
      clearInterval(orduckThreadTypewriterId);
      orduckThreadTypewriterId = null;
      const msg = orduckChatHistory.find((m) => m.id === messageId);
      if (msg) renderOrduckChatThread();
    }
  }, speed);
}

function seedOrduckWelcomeIfEmpty() {
  if (orduckChatHistory.length) return;
  appendOrduckChatMessage(
    "assistant",
    "Merhaba! Ben ORDEK.AI — Python Akademisi'nin siber ördek asistanıyım.\n\n"
    + "Benimle karşılıklı sohbet edebilirsin: Python soruları, kod inceleme, ilerleme takibi, Boss Fight ipuçları.\n"
    + "🎤 Mikrofon ile sesli sor · 🔊 yanıtları sesli dinle · sohbet geçmişin kaydedilir.",
  );
}

function getTimeGreetingParts(name) {
  const displayName = name
    ? name.charAt(0).toUpperCase() + name.slice(1)
    : "Operatör";
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) {
    return { prefix: "İyi Geceler, ", suffix: " 🌙", full: `İyi Geceler, ${displayName} 🌙` };
  }
  if (hour >= 6 && hour < 12) {
    return { prefix: "Günaydın, ", suffix: " ⚡", full: `Günaydın, ${displayName} ⚡` };
  }
  if (hour >= 12 && hour < 18) {
    return { prefix: "Tünaydın, ", suffix: " 🚀", full: `Tünaydın, ${displayName} 🚀` };
  }
  return { prefix: "İyi Akşamlar, ", suffix: " 💻", full: `İyi Akşamlar, ${displayName} 💻` };
}

function getTimeBasedGreeting(name) {
  return getTimeGreetingParts(name).full;
}

const HERO_SCRAMBLE_POOL = "01#$%&";
let heroTitleScrambleId = null;
let lastHeroGreetingText = "";

function scrambleHeroTitle(targetEl, finalText, durationMs = 500) {
  if (!targetEl) return;
  const text = String(finalText || "");
  if (!text) {
    targetEl.textContent = "";
    return;
  }
  if (heroTitleScrambleId !== null) {
    cancelAnimationFrame(heroTitleScrambleId);
    heroTitleScrambleId = null;
  }
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / durationMs);
    if (progress >= 1) {
      targetEl.textContent = text;
      heroTitleScrambleId = null;
      return;
    }
    const revealCount = Math.floor(progress * text.length);
    targetEl.textContent = text.split("").map((ch, i) => {
      if (i < revealCount) return ch;
      if (ch === " ") return " ";
      return HERO_SCRAMBLE_POOL[Math.floor(Math.random() * HERO_SCRAMBLE_POOL.length)];
    }).join("");
    heroTitleScrambleId = requestAnimationFrame(tick);
  };
  heroTitleScrambleId = requestAnimationFrame(tick);
}

function renderCyberHeroPanel() {
  const name = getOperatorName();
  const greeting = getTimeBasedGreeting(name);
  const nextTopic = findNextTopic();

  if (el.cyberHeroTitle && greeting !== lastHeroGreetingText) {
    lastHeroGreetingText = greeting;
    scrambleHeroTitle(el.cyberHeroTitle, greeting, 500);
  }
  if (el.cyberHeroSub) {
    if (nextTopic) {
      el.cyberHeroSub.textContent = `Siber komuta hattı aktif — sıradaki hedef: ${getShortTitle(nextTopic.title)}.`;
    } else {
      el.cyberHeroSub.textContent = "Tüm modüller tamamlandı — ustalaştın! Yine de kod pratiği yapabilirsin.";
    }
  }
  if (el.cyberHeroResumeBtn) {
    if (nextTopic) {
      el.cyberHeroResumeBtn.disabled = false;
      el.cyberHeroResumeBtn.textContent = `[ ⏩ Kaldığın Yerden Devam Et: ${getBolum(nextTopic.title)} ]`;
    } else {
      el.cyberHeroResumeBtn.disabled = true;
      el.cyberHeroResumeBtn.textContent = "[ ✓ Tüm Bölümler Tamamlandı ]";
    }
  }
}

function scrollCyberHeroResume() {
  const nextTopic = findNextTopic();
  if (!nextTopic) return;
  setFocusedTopic(nextTopic.id);
  scrollToTopic(nextTopic.id);
}

function copyOrduckCode(encoded) {
  const code = decodeURIComponent(encoded || "");
  if (!code) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(code).catch(() => {});
  }
}

function insertOrduckCodeToEditor(encoded) {
  const code = decodeURIComponent(encoded || "");
  if (!code || !el.codeEditor) return;
  el.codeEditor.value = code;
  el.codeEditor.focus();
  if (isModalOpen() && activeFocusPanel !== "code") {
    switchModalTab("code");
  }
}

function speakOrduckText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(formatOrduckPlainText(text));
  utter.lang = "tr-TR";
  utter.rate = 0.95;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}

function stopOrduckMic() {
  orduckMicActive = false;
  el.orduckChatMic?.classList.remove("is-listening");
  try {
    orduckSpeechRecognition?.stop();
  } catch { /* ignore */ }
}

function toggleOrduckMic() {
  if (!orduckSpeechRecognition) return;
  if (orduckMicActive) {
    stopOrduckMic();
    return;
  }
  try {
    orduckMicActive = true;
    el.orduckChatMic?.classList.add("is-listening");
    orduckSpeechRecognition.start();
  } catch {
    stopOrduckMic();
  }
}

function initOrduckSpeechInput() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    if (el.orduckChatMic) {
      el.orduckChatMic.disabled = true;
      el.orduckChatMic.title = "Tarayıcı sesli girişi desteklemiyor";
    }
    return;
  }
  orduckSpeechRecognition = new SR();
  orduckSpeechRecognition.lang = "tr-TR";
  orduckSpeechRecognition.interimResults = false;
  orduckSpeechRecognition.continuous = false;
  orduckSpeechRecognition.maxAlternatives = 1;
  orduckSpeechRecognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
    stopOrduckMic();
    if (!transcript || !el.orduckChatInput) return;
    el.orduckChatInput.value = transcript;
    handleOrduckUserMessage();
  };
  orduckSpeechRecognition.onerror = () => stopOrduckMic();
  orduckSpeechRecognition.onend = () => {
    if (orduckMicActive) stopOrduckMic();
  };
}

function showOrduckErrorToast() {
  if (!el.orduckErrorToast) return;
  el.orduckErrorToast.classList.remove("hidden");
  if (orduckErrorToastTimeoutId !== null) clearTimeout(orduckErrorToastTimeoutId);
  orduckErrorToastTimeoutId = window.setTimeout(() => {
    el.orduckErrorToast?.classList.add("hidden");
    orduckErrorToastTimeoutId = null;
  }, 9000);
}

function hideOrduckErrorToast() {
  if (orduckErrorToastTimeoutId !== null) {
    clearTimeout(orduckErrorToastTimeoutId);
    orduckErrorToastTimeoutId = null;
  }
  el.orduckErrorToast?.classList.add("hidden");
}

function pulseOrduckErrorState() {
  el.orduckWidget?.classList.add("is-error-pulse", "is-alert");
  if (orduckErrorPulseTimeoutId !== null) clearTimeout(orduckErrorPulseTimeoutId);
  orduckErrorPulseTimeoutId = window.setTimeout(() => {
    el.orduckWidget?.classList.remove("is-error-pulse");
    orduckErrorPulseTimeoutId = null;
  }, 12000);
}

function buildOrduckCapabilitiesMessage() {
  const modeLine = orduckAiState.mode === "ollama"
    ? (orduckAiState.webgpu ? "Yerel LLM + GPU/NPU ivmelendirme aktif." : "Yerel Ollama LLM bağlı.")
    : "Şu an akıllı kural motoru + bağlam analizi aktif (Ollama kapalıysa otomatik devreye girer).";
  const persona = {
    mentor: "Mentor modundayım — adım adım, destekleyici anlatırım.",
    strict: "Sert moddayım — net, filtresiz geri bildirim veririm.",
    socratic: "Sokratik moddayım — cevabı birlikte sorularla buldururum.",
  };
  return `ORDEK.AI yetenek envanteri:\n\n`
    + `🧠 ${modeLine}\n`
    + `🛡️ Girdi guardrails + Pyodide AST çıktı doğrulama\n`
    + `💬 Çok turlu sohbet hafızası (son ${ORDUCK_AI_CONFIG.maxHistoryTurns} mesaj)\n`
    + `🐞 Editördeki kodunu canlı statik analiz\n`
    + `🚀 XP, seviye, modül ilerlemesi ve Boss Fight rehberliği\n`
    + `⚡ WebGPU algılama + graceful degradation\n\n`
    + `${persona[duckPersonality] || persona.mentor}\n\n`
    + `Dene: "for döngüsü anlat", "kodumu incele", "sıradaki modül ne?"`;
}

function scoreOrduckKnowledgeMatch(userMessage, entry) {
  const lower = String(userMessage || "").toLowerCase();
  const tokens = lower.split(/[^\wçğıöşü]+/i).filter((w) => w.length > 2);
  let score = 0;
  entry.keys.forEach((key) => {
    if (lower.includes(key)) score += 3;
    if (tokens.some((t) => t.includes(key) || key.includes(t))) score += 2;
  });
  return score;
}

function buildOrduckConversationalResponse(userMessage) {
  const raw = String(userMessage || "").trim();
  const lower = raw.toLowerCase();
  orduckConversationContext.lastUserMessage = raw;

  if (/^(merhaba|selam|hey|hi|hello|sa\b|günaydın|iyi akşamlar|naber|naber\?)/.test(lower)) {
    orduckConversationContext.lastIntent = "greeting";
    if (duckPersonality === "strict") {
      return "Selam. Vaktini boşa harcama — ne öğrenmek istiyorsun, net sor.";
    }
    if (duckPersonality === "socratic") {
      return "Merhaba! Bugün Python yolculuğunda hangi problemi çözmeye geldin?";
    }
    return "Merhaba! ORDEK.AI hazır — Python, kod veya akademi hakkında istediğini sor.\nİstersen 'ne yapabilirsin?' de, tüm yeteneklerimi listelerim.";
  }

  if (/teşekk|sağ\s*ol|eyvallah|thanks/.test(lower)) {
    return duckPersonality === "strict"
      ? "Rica etme. Bir sonraki soruya geç — momentum kaybetme."
      : "Rica ederim! Devam etmek istersen yeni bir soru yaz veya kodunu incelet.";
  }

  if (/ne\s*yapabilir|yetenek|özellik|neler\s*yap|hüner|beceri/.test(lower)) {
    orduckConversationContext.lastIntent = "capabilities";
    return buildOrduckCapabilitiesMessage();
  }

  if (/kim\s*sin|sen\s*kimsin|orduck|ördek|ordak/.test(lower)) {
    return "Ben ORDEK.AI — Python Akademisi'nin hibrit yapay zeka asistanıyım.\n"
      + "Yerel Ollama LLM, WebGPU algılama, guardrails, AST doğrulama ve kişilik modlarıyla çalışırım.\n"
      + "Amacım: Python'u öğrenirken yanında gerçek bir pair-programming partneri olmak.";
  }

  if (/^(evet|tamam|olur|devam|peki|anladım)$/.test(lower) && orduckConversationContext.lastIntent) {
    if (orduckConversationContext.lastIntent === "capabilities") {
      return buildOrduckTipMessage();
    }
    if (orduckConversationContext.lastTopic) {
      const hit = ORDUCK_KNOWLEDGE.find((e) => e.keys.includes(orduckConversationContext.lastTopic));
      if (hit) {
        return enrichOrduckKnowledgeReply(hit, raw, true);
      }
    }
  }

  if (/ilerleme|xp|seviye|modül|tamaml|rank|seri|streak/.test(lower)) {
    orduckConversationContext.lastIntent = "progress";
    return buildDuckProgressMessage();
  }

  if (/kodumu|kodum|incele|debug|hata|syntax|sözdizim|çalışmıyor|patladı|error/.test(lower)) {
    orduckConversationContext.lastIntent = "code_review";
    return buildDuckCodeReviewMessage();
  }

  if (/ipucu|tüyo|yardım|ne\s*yapay|sıradaki|hedef|tavsiye/.test(lower)) {
    orduckConversationContext.lastIntent = "tip";
    return buildDuckTipMessage();
  }

  if (/boss|patron|canavar|assert|unit\s*test/.test(lower)) {
    orduckConversationContext.lastTopic = "boss";
    const hit = ORDUCK_KNOWLEDGE.find((e) => e.keys.includes("boss"));
    return enrichOrduckKnowledgeReply(hit, raw);
  }

  let best = null;
  let bestScore = 0;
  ORDUCK_KNOWLEDGE.forEach((entry) => {
    const score = scoreOrduckKnowledgeMatch(raw, entry);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  });
  if (best && bestScore >= 2) {
    orduckConversationContext.lastTopic = best.keys[0];
    orduckConversationContext.lastIntent = "knowledge";
    return enrichOrduckKnowledgeReply(best, raw);
  }

  const snap = getDuckProgressSnapshot();
  const topicHint = activeTopicId
    ? (topics.find((t) => t.id === activeTopicId)?.title || "")
    : "";
  if (duckPersonality === "socratic") {
    return `"${raw}" hakkında düşünüyorum.\n\n`
      + `Şu an ${snap.completed}/${snap.total} modül tamamlamışsın${topicHint ? ` · Açık modül: ${getShortTitle(topicHint)}` : ""}.\n`
      + `Sorunu biraz açar mısın — örneğin liste mi, döngü mü, fonksiyon mu?`;
  }
  if (duckPersonality === "strict") {
    return `Soru biraz genel: "${raw}"\n\n`
      + "Netleştir: hangi konu (liste, dict, for, def…)? Editörde kod varsa 'kodumu incele' de.\n"
      + `Şu an ${snap.completed}/${snap.total} modül bitmiş — odaklan.`;
  }
  return `"${raw}" için elimden geleni yapıyorum.\n\n`
    + `Python konularında yardımcı olabilirim. Daha keskin yanıt için konuyu belirt:\n`
    + `• "for döngüsü örneği ver"\n`
    + `• "kodumu incele"\n`
    + `• "ilerlememi göster"\n\n`
    + `${topicHint ? `Şu an "${getShortTitle(topicHint)}" modülündesin — bu konuyla ilgili sorabilirsin.` : "Merdivenden bir modül açarsan bağlamı otomatik kullanırım."}`;
}

function enrichOrduckKnowledgeReply(entry, userMessage, extended = false) {
  if (!entry) return matchOrduckKnowledge();
  const base = entry[duckPersonality] || entry.mentor;
  const lower = String(userMessage || "").toLowerCase();
  const wantsExample = /örnek|kod|göster|yaz|demo|sample/.test(lower) || extended;
  const examples = {
    liste: "liste = [1, 2, 3]\nliste.append(4)\nprint(liste[0], len(liste))",
    dict: "user = {'ad': 'Ayşe', 'xp': 120}\nprint(user.get('ad'))\nprint(user.get('yas', 0))",
    döngü: "for i in range(3):\n    print('tur', i)",
    for: "for i in range(3):\n    print('tur', i)",
    fonksiyon: "def topla(a, b):\n    return a + b\n\nprint(topla(2, 3))",
    def: "def selam(isim):\n    return f'Merhaba {isim}'",
    if: "yas = 18\nif yas >= 18:\n    print('yetiskin')\nelse:\n    print('cocuk')",
    print: "isim = 'Python'\nprint(f'Merhaba {isim}!')",
    boss: "def hedef_fonksiyon(x):\n    return x * 2  # görev metnindeki isimle birebir",
  };
  const key = entry.keys.find((k) => examples[k]) || entry.keys[0];
  if (wantsExample && examples[key]) {
    return `${base}\n\n\`\`\`python\n${examples[key]}\n\`\`\``;
  }
  return base;
}

function buildOrduckRuleResponse(userMessage) {
  return buildOrduckConversationalResponse(userMessage);
}

async function detectWebGPU() {
  if (!navigator.gpu) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return Boolean(adapter);
  } catch {
    return false;
  }
}

function pickOllamaModel(models) {
  const names = (models || []).map((m) => (typeof m === "string" ? m : m.name || "")).filter(Boolean);
  const prefs = [ORDUCK_AI_CONFIG.defaultModel, ...ORDUCK_AI_CONFIG.fallbackModels];
  for (const pref of prefs) {
    const base = pref.split(":")[0];
    const hit = names.find((n) => n === pref || n.startsWith(`${base}:`) || n.startsWith(base));
    if (hit) return hit;
  }
  return names[0] || ORDUCK_AI_CONFIG.defaultModel;
}

function updateOrduckAiStatusUI() {
  if (!el.orduckAiStatus) return;
  el.orduckAiStatus.classList.remove("is-live", "is-webgpu");
  if (orduckAiState.mode === "ollama") {
    el.orduckAiStatus.textContent = orduckAiState.webgpu ? "[ GPU/NPU: Aktif ]" : "[ Mod: Yerel LLM ]";
    el.orduckAiStatus.classList.add("is-live");
    if (orduckAiState.webgpu) el.orduckAiStatus.classList.add("is-webgpu");
    return;
  }
  el.orduckAiStatus.textContent = "[ Mod: Kural Motoru ]";
}

async function probeOllamaProvider(force = false) {
  if (orduckAiState.probing) return orduckAiState.mode;
  const now = Date.now();
  if (!force && orduckAiState.lastProbe && now - orduckAiState.lastProbe < 30000) {
    updateOrduckAiStatusUI();
    return orduckAiState.mode;
  }

  orduckAiState.probing = true;
  orduckAiState.webgpu = await detectWebGPU();

  try {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), ORDUCK_AI_CONFIG.probeTimeoutMs);
    const res = await fetch(ORDUCK_AI_CONFIG.ollamaTagsUrl, { signal: ctrl.signal, mode: "cors" });
    window.clearTimeout(timer);
    if (!res.ok) throw new Error("Ollama erişilemedi");
    const data = await res.json();
    orduckAiState.model = pickOllamaModel(data.models);
    orduckAiState.mode = "ollama";
  } catch {
    orduckAiState.mode = "rules";
    orduckAiState.model = null;
  } finally {
    orduckAiState.probing = false;
    orduckAiState.lastProbe = Date.now();
    updateOrduckAiStatusUI();
  }
  return orduckAiState.mode;
}

function validateOrduckInput(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return { ok: false, message: "Boş mesaj gönderemezsin." };
  if (trimmed.length > 500) return { ok: false, message: "Mesaj çok uzun (en fazla 500 karakter)." };

  for (const rule of ORDUCK_INPUT_GUARDRAILS) {
    if (rule.pattern.test(trimmed)) {
      return { ok: false, message: ORDUCK_GUARDRAIL_MESSAGES[rule.reason] || ORDUCK_GUARDRAIL_MESSAGES.default };
    }
  }
  if (isCodeBlocked(trimmed)) {
    return { ok: false, message: "Güvenlik duvarı: çalıştırılamayan komut desenleri tespit edildi." };
  }
  return { ok: true, text: trimmed };
}

function buildOrduckSystemPrompt() {
  const persona = {
    mentor: "Destekleyici Python mentorüsün. Kısa, net, Türkçe yanıt ver.",
    strict: "Sert ama yapıcı Python incelemecisisin. Gereksiz nezaket yok, net Türkçe.",
    socratic: "Sokratik öğretmensin. Cevabı doğrudan vermek yerine yönlendirici sorular sor, Türkçe.",
  };
  const snap = getDuckProgressSnapshot();
  const code = getActiveEditorCode();
  const codeCtx = code.trim()
    ? `\nAktif editör kodu:\n\`\`\`python\n${code.slice(0, 2000)}\n\`\`\``
    : "";
  return `Sen ORDEK.AI, Python Akademisi siber ördek asistanısın.
${persona[duckPersonality] || persona.mentor}
Yalnızca Python öğrenimi, Pyodide laboratuvarı ve akademi içeriği hakkında yardım et.
Önceki mesajları hatırla; karşılıklı, doğal ve Türkçe sohbet et.
Kod örneklerini \`\`\`python bloklarında ver.
Kullanıcı ilerlemesi: Seviye ${snap.stats.user_level}, ${snap.completed}/${snap.total} modül.${codeCtx}`;
}

async function fetchOllamaCompletion(userMessage, options = {}) {
  const model = options.model || orduckAiState.model || ORDUCK_AI_CONFIG.defaultModel;
  const prompt = options.prompt
    || `${buildOrduckSystemPrompt()}\n\nKullanıcı: ${userMessage}\n\nORDEK.AI:`;
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), ORDUCK_AI_CONFIG.generateTimeoutMs);

  try {
    const res = await fetch(ORDUCK_AI_CONFIG.ollamaGenerateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.55, num_predict: 512 },
      }),
      signal: ctrl.signal,
      mode: "cors",
    });
    window.clearTimeout(timer);
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json();
    const text = String(data.response || "").trim();
    if (!text) throw new Error("Ollama boş yanıt döndürdü");
    return text;
  } catch (err) {
    window.clearTimeout(timer);
    throw err;
  }
}

function buildOllamaChatMessages(userMessage) {
  const history = orduckChatHistory
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-ORDUCK_AI_CONFIG.maxHistoryTurns)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: formatOrduckPlainText(m.text),
    }));

  const messages = [{ role: "system", content: buildOrduckSystemPrompt() }, ...history];
  const last = messages[messages.length - 1];
  const plain = formatOrduckPlainText(userMessage);
  if (!last || last.role !== "user" || last.content !== plain) {
    messages.push({ role: "user", content: plain });
  }
  return messages;
}

async function fetchOllamaChatCompletion(userMessage) {
  const model = orduckAiState.model || ORDUCK_AI_CONFIG.defaultModel;
  const messages = buildOllamaChatMessages(userMessage);
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), ORDUCK_AI_CONFIG.generateTimeoutMs);

  try {
    const res = await fetch(ORDUCK_AI_CONFIG.ollamaChatUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { temperature: 0.65, num_predict: 768 },
      }),
      signal: ctrl.signal,
      mode: "cors",
    });
    window.clearTimeout(timer);
    if (!res.ok) throw new Error(`Ollama chat HTTP ${res.status}`);
    const data = await res.json();
    const text = String(data.message?.content || data.response || "").trim();
    if (!text) throw new Error("Ollama chat boş yanıt döndürdü");
    return text;
  } catch (err) {
    window.clearTimeout(timer);
    throw err;
  }
}

function extractPythonCodeBlocks(text) {
  const blocks = [];
  const fenced = /```(?:python|py)?\s*\n([\s\S]*?)```/gi;
  let match = fenced.exec(text);
  while (match) {
    const code = match[1].trim();
    if (code) blocks.push(code);
    match = fenced.exec(text);
  }
  return blocks;
}

async function verifyPythonAst(code) {
  const trimmed = String(code || "").trim();
  if (!trimmed) return { ok: true };
  if (isCodeBlocked(trimmed)) {
    return { ok: false, error: "Güvenlik: kod blokları çalıştırılamaz." };
  }
  try {
    const pyodide = await initPyodide();
    const payload = JSON.stringify(trimmed);
    pyodide.runPython(`
import ast
try:
    ast.parse(${payload})
    __orduck_ast_ok = True
    __orduck_ast_err = ""
except SyntaxError as e:
    __orduck_ast_ok = False
    __orduck_ast_err = str(e)
`);
    return {
      ok: Boolean(pyodide.runPython("__orduck_ast_ok")),
      error: String(pyodide.runPython("__orduck_ast_err") || ""),
    };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function verifyAndReviseAiOutput(rawText, userMessage, revisionAttempt = 0) {
  const blocks = extractPythonCodeBlocks(rawText);
  if (!blocks.length) return rawText;

  for (const block of blocks) {
    const check = await verifyPythonAst(block);
    if (check.ok) continue;

    const prefix = "Ürettiğim kodda sözdizimi hatası tespit ettim, düzeltiyorum...";
    if (revisionAttempt >= 1) {
      return `${prefix}\n\nAST doğrulama hatası: ${check.error}\n\n${buildOrduckRuleResponse(userMessage)}`;
    }

    if (orduckAiState.mode === "ollama") {
      try {
        const fixPrompt = `${buildOrduckSystemPrompt()}\n\nÖnceki yanıtında sözdizimi hatası vardı: ${check.error}\nKullanıcı sorusu: ${userMessage}\nYalnızca düzeltilmiş yanıtı ver; Python kodunu \`\`\`python bloğunda yaz.`;
        const fixed = await fetchOllamaCompletion(userMessage, { prompt: fixPrompt });
        const revised = await verifyAndReviseAiOutput(fixed, userMessage, revisionAttempt + 1);
        if (revised.startsWith(prefix)) return revised;
        return `${prefix}\n\n${revised}`;
      } catch {
        return `${prefix}\n\n${buildOrduckRuleResponse(userMessage)}`;
      }
    }
    return `${prefix}\n\n${buildOrduckRuleResponse(userMessage)}`;
  }
  return rawText;
}

async function orduckAiProviderGenerate(userMessage) {
  if (!orduckAiState.lastProbe || Date.now() - orduckAiState.lastProbe > 30000) {
    await probeOllamaProvider();
  } else {
    updateOrduckAiStatusUI();
  }

  if (orduckAiState.mode === "ollama") {
    try {
      let raw;
      try {
        raw = await fetchOllamaChatCompletion(userMessage);
      } catch {
        raw = await fetchOllamaCompletion(userMessage);
      }
      return verifyAndReviseAiOutput(raw, userMessage);
    } catch {
      orduckAiState.mode = "rules";
      updateOrduckAiStatusUI();
    }
  }
  return buildOrduckConversationalResponse(userMessage);
}

async function handleOrduckUserMessage() {
  if (orduckMessageBusy || !el.orduckChatInput) return;
  const validation = validateOrduckInput(el.orduckChatInput.value);
  if (!validation.ok) {
    deliverDuckResponse(validation.message, { analyzing: false });
    return;
  }

  const message = validation.text;
  el.orduckChatInput.value = "";
  if (!duckChatOpen) openDuckChat(false);
  appendOrduckChatMessage("user", message);
  orduckMessageBusy = true;
  if (el.orduckChatSend) el.orduckChatSend.disabled = true;
  setOrduckThinking(true);

  try {
    const response = await orduckAiProviderGenerate(message);
    setOrduckThinking(false);
    deliverDuckResponse(response, { analyzing: false, typewriter: true });
  } catch {
    setOrduckThinking(false);
    deliverDuckResponse(buildOrduckConversationalResponse(message), { analyzing: false, typewriter: true });
  } finally {
    orduckMessageBusy = false;
    if (el.orduckChatSend) el.orduckChatSend.disabled = false;
    el.orduckChatInput?.focus();
  }
}

function buildGenericModule(topicId, section) {
  return {
    lesson: `<h3>${section}</h3>
<p>Bu modülde <strong>${section}</strong> konusunu derinlemesine işliyoruz. Aşağıdaki örnekleri laboratuvar sekmesinde deneyebilirsin.</p>
<h4>Temel Kavramlar</h4>
<p>Python'da pratik yapmak en hızlı öğrenme yoludur. Kod laboratuvarında Pyodide ile anında çalıştır.</p>
<pre><code class="language-python"># Modül ${topicId}: ${section}
print("Merhaba Python Akademisi!")
print("Konu:", "${section}")</code></pre>
<h4>İpucu</h4>
<p>Bilgi kartlarını çevir, ardından modül testini %70+ ile geçerek <strong>+100 XP</strong> kazan.</p>`,
    flashcards: mkCards([
      [`${section} modülünün amacı?`, `${section} becerilerini pekiştirmek.`, `# Modül ${topicId}\nprint('OK')`],
      ["XP nasıl kazanılır?", "Kart (+10), quiz geçme (+100), süre kaydı.", "print(10+100)"],
      ["Pyodide ne yapar?", "Python'u tarayıcıda çalıştırır.", "print(2+2)"],
    ]),
    quiz: mkQuiz([
      [`${section} ile ilgili doğru print?`, ["echo hi", "print('hi')", "Console.log", "printf"], 1, "Python'da print() kullanılır."],
      ["Python yorum satırı?", ["//", "#", "--", "/*"], 1, "# tek satır yorum."],
      ["len('abc')?", ["2", "3", "4", "abc"], 1, "3 karakter."],
    ]),
    starter: `print("Modül ${topicId}: ${section}")\nfor i in range(3):\n    print(i)`,
  };
}

function getAcademyModule(topicId) {
  const key = MODULE_KEYS[topicId - 1] || "data";
  const bank = ACADEMY_BANK[key];
  if (bank) return bank;
  const section = topicSectionTitle(DEFAULT_TOPICS[topicId - 1]?.title || `Modül ${topicId}`);
  return buildGenericModule(topicId, section);
}

function ensureLearningState(state) {
  if (!state.learning) state.learning = { flashcards: {}, quizzes: {}, bosses: {} };
  if (!state.learning.bosses) state.learning.bosses = {};
  return state.learning;
}

function getModuleKey(topicId) {
  return MODULE_KEYS[topicId - 1] || "data";
}

function getBossFight(topicId) {
  return BOSS_FIGHTS[getModuleKey(topicId)] || null;
}

function isBossModule(topicId) {
  return Boolean(getBossFight(topicId));
}

function isBossDefeated(topicId) {
  return Boolean(loadState().learning?.bosses?.[topicId]?.defeated);
}

function saveBossVictory(topicId) {
  const state = loadState();
  const learning = ensureLearningState(state);
  if (learning.bosses[topicId]?.defeated) {
    return { stats: statsToDict(state.stats), xpGained: 0, firstVictory: false };
  }

  learning.bosses[topicId] = {
    defeated: true,
    defeatedAt: new Date().toISOString(),
  };

  const topic = findTopic(state, topicId);
  if (topic) {
    topic.boss_defeated = true;
    if (!topic.is_completed) topic.is_completed = true;
  }

  const stats = addXp(state, BOSS_XP_REWARD);
  saveState(state);
  return { stats, xpGained: BOSS_XP_REWARD, firstVictory: true };
}

function isFlashcardDone(topicId, cardIdx) {
  const learning = loadState().learning;
  return !!learning?.flashcards?.[`${topicId}-${cardIdx}`];
}

function markFlashcardDone(topicId, cardIdx) {
  const state = loadState();
  const learning = ensureLearningState(state);
  const key = `${topicId}-${cardIdx}`;
  if (learning.flashcards[key]) return null;
  learning.flashcards[key] = true;
  const stats = addXp(state, 10);
  saveState(state);
  return stats;
}

function getQuizRecord(topicId) {
  return loadState().learning?.quizzes?.[topicId] || null;
}

function saveQuizResult(topicId, score, total) {
  const state = loadState();
  const learning = ensureLearningState(state);
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 70;
  const prev = learning.quizzes[topicId];
  learning.quizzes[topicId] = {
    score, total, pct, passed,
    completedAt: new Date().toISOString(),
    bestPct: Math.max(prev?.bestPct || 0, pct),
  };
  let xpGained = 0;
  let stats = statsToDict(state.stats);
  let firstPass = passed && !prev?.passed;
  if (firstPass) {
    const topic = findTopic(state, topicId);
    if (topic && !topic.is_completed) {
      topic.is_completed = true;
      stats = addXp(state, 100);
      xpGained = 100;
    }
  }
  saveState(state);
  return { pct, passed, xpGained, stats, firstPass };
}

let quizState = { topicId: null, index: 0, score: 0, total: 0, answered: false };
let flashcardIndex = 0;
let flashcardFlipped = false;

let activeFocusPanel = null;

const FOCUS_LABELS = {
  notes: "📖 Ders Notları",
  code: "💻 Kod Laboratuvarı",
  flashcards: "🎴 Bilgi Kartları",
  quiz: "🧠 Modül Testi",
};

let duckTypewriterId = null;
let duckAlertTimeoutId = null;
let duckAnalyzeTimeoutId = null;

function openFocusMode(panelName) {
  activeFocusPanel = panelName;
  if (el.commandCenter) el.commandCenter.classList.add("is-hidden");
  if (el.focusMode) el.focusMode.classList.remove("hidden");
  if (el.focusTitle) {
    if (panelName === "quiz" && activeTopicId && isBossModule(activeTopicId)) {
      el.focusTitle.textContent = "👾 Boss Fight";
    } else {
      el.focusTitle.textContent = FOCUS_LABELS[panelName] || panelName;
    }
  }
  document.querySelectorAll(".focus-panel").forEach((panel) => {
    const active = panel.dataset.panel === panelName;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
  if (el.notesModalPanel) el.notesModalPanel.classList.add("focus-active");
  if (panelName === "notes") {
    setTimeout(() => {
      const lessonEl = document.getElementById("lessonContent");
      if (lessonEl) lessonEl.scrollTop = 0;
    }, 80);
  }
}

function closeFocusMode() {
  activeFocusPanel = null;
  if (el.commandCenter) el.commandCenter.classList.remove("is-hidden");
  if (el.focusMode) el.focusMode.classList.add("hidden");
  if (el.notesModalPanel) el.notesModalPanel.classList.remove("focus-active");
}

function switchModalTab(tabName) {
  openFocusMode(tabName);
}

function launchConfetti() {
  const colors = ["#00f0ff", "#ffe873", "#a855f7", "#39ff14", "#306998"];
  for (let i = 0; i < 55; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.left = `${Math.random() * 100}vw`;
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = `${1.8 + Math.random() * 1.5}s`;
    p.style.animationDelay = `${Math.random() * 0.4}s`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3500);
  }
}

function renderLessonPanel(topicId) {
  const container = document.getElementById("lessonContent");
  if (!container) return;
  const mod = getAcademyModule(topicId);
  container.innerHTML = mod.lesson;
  container.querySelectorAll("pre code").forEach((block) => {
    if (window.Prism) Prism.highlightElement(block);
  });
}

function renderFlashcards(topicId) {
  const container = document.getElementById("flashcardsContainer");
  if (!container) return;
  const mod = getAcademyModule(topicId);
  const cards = mod.flashcards;
  if (!cards.length) {
    container.innerHTML = '<p class="learning-placeholder">Kart bulunamadı.</p>';
    return;
  }
  flashcardIndex = Math.min(flashcardIndex, cards.length - 1);
  flashcardFlipped = false;
  const card = cards[flashcardIndex];
  const done = isFlashcardDone(topicId, flashcardIndex);
  container.innerHTML = `
    <p class="flashcards-progress">Kart ${flashcardIndex + 1} / ${cards.length}</p>
    <div class="flashcard-scene">
      <div class="flashcard ${done ? "is-done" : ""}" id="activeFlashcard">
        <div class="flashcard-face flashcard-front">
          <span class="flashcard-label">Soru</span>
          <p class="flashcard-question">${escapeHtml(card.front)}</p>
          <span class="flashcard-hint">Tıkla · kartı çevir</span>
        </div>
        <div class="flashcard-face flashcard-back">
          <span class="flashcard-label">Cevap</span>
          <p class="flashcard-answer">${escapeHtml(card.back)}</p>
          <pre class="flashcard-code">${escapeHtml(card.code)}</pre>
        </div>
      </div>
    </div>
    <div class="flashcard-actions">
      <button type="button" class="flashcard-btn" id="flashRetryBtn">Tekrar Et</button>
      <button type="button" class="flashcard-btn primary" id="flashGotItBtn" ${done ? "disabled" : ""}>
        ${done ? "✓ Anlaşıldı" : "Anladım (+10 XP)"}
      </button>
    </div>`;
  const fc = document.getElementById("activeFlashcard");
  fc?.addEventListener("click", () => {
    flashcardFlipped = !flashcardFlipped;
    fc.classList.toggle("is-flipped", flashcardFlipped);
  });
  document.getElementById("flashRetryBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    flashcardFlipped = false;
    fc?.classList.remove("is-flipped");
  });
  document.getElementById("flashGotItBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const stats = markFlashcardDone(topicId, flashcardIndex);
    if (stats) {
      showXpToast(10);
      renderRpgHud(stats);
      renderDevPanel();
    }
    if (flashcardIndex < cards.length - 1) {
      flashcardIndex += 1;
      renderFlashcards(topicId);
    } else {
      renderFlashcards(topicId);
    }
  });
}

function renderQuizQuestion(topicId) {
  const container = document.getElementById("quizContainer");
  if (!container) return;
  const mod = getAcademyModule(topicId);
  const questions = mod.quiz;
  quizState.total = questions.length;
  if (quizState.index >= questions.length) {
    renderQuizResult(topicId);
    return;
  }
  const q = questions[quizState.index];
  const pct = Math.round((quizState.index / questions.length) * 100);
  container.innerHTML = `
    <div class="quiz-progress-wrap">
      <span class="quiz-progress-label">Soru ${quizState.index + 1} / ${questions.length}</span>
      <div class="quiz-progress-track"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
    </div>
    <p class="quiz-question">${escapeHtml(q.q)}</p>
    <div class="quiz-options" id="quizOptions">
      ${q.options.map((opt, i) => `<button type="button" class="quiz-option" data-idx="${i}">${escapeHtml(opt)}</button>`).join("")}
    </div>
    <div id="quizFeedback"></div>`;
  container.querySelectorAll(".quiz-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (quizState.answered) return;
      quizState.answered = true;
      const idx = Number(btn.dataset.idx);
      const correct = idx === q.correct;
      if (correct) quizState.score += 1;
      container.querySelectorAll(".quiz-option").forEach((b, i) => {
        b.disabled = true;
        if (i === q.correct) b.classList.add("correct");
        else if (i === idx) b.classList.add("wrong");
      });
      const fb = document.getElementById("quizFeedback");
      if (fb) {
        fb.className = `quiz-feedback ${correct ? "correct" : "wrong"}`;
        fb.textContent = (correct ? "✓ Doğru! " : "✗ Yanlış. ") + q.explain;
      }
      const next = document.createElement("button");
      next.type = "button";
      next.className = "quiz-next-btn";
      next.textContent = quizState.index + 1 >= questions.length ? "Sonuçları Gör" : "Sonraki Soru →";
      next.addEventListener("click", () => {
        quizState.index += 1;
        quizState.answered = false;
        renderQuizQuestion(topicId);
      });
      container.appendChild(next);
    });
  });
}

function renderQuizResult(topicId) {
  const container = document.getElementById("quizContainer");
  if (!container) return;
  const pct = Math.round((quizState.score / quizState.total) * 100);
  const result = saveQuizResult(topicId, quizState.score, quizState.total);
  const passed = result.passed;
  if (passed && result.firstPass) {
    launchConfetti();
    showXpToast(result.xpGained || 100);
    if (result.stats) renderRpgHud(result.stats);
    const idx = topics.findIndex((t) => t.id === topicId);
    if (idx !== -1) topics[idx].is_completed = true;
    renderStaircase();
    renderDevPanel();
  }
  container.innerHTML = `
    <div class="quiz-result">
      <p class="quiz-result-score">%${pct} ${passed ? "Başarı!" : "Tekrar Dene"}</p>
      <p class="quiz-result-msg">${quizState.score} / ${quizState.total} doğru cevap.
        ${passed ? "Modül tamamlandı olarak işaretlendi!" : "%70 ve üzeri için tekrar dene."}</p>
      <button type="button" class="quiz-retry-btn" id="quizRetryBtn">🔄 Testi Yeniden Başlat</button>
    </div>`;
  document.getElementById("quizRetryBtn")?.addEventListener("click", () => {
    quizState = { topicId, index: 0, score: 0, total: 0, answered: false };
    renderQuizQuestion(topicId);
  });
}

function startQuiz(topicId) {
  if (isBossModule(topicId)) {
    renderBossFight(topicId);
    return;
  }
  quizState = { topicId, index: 0, score: 0, total: 0, answered: false };
  renderQuizQuestion(topicId);
}

function renderBossFight(topicId) {
  const container = document.getElementById("quizContainer");
  if (!container) return;

  const boss = getBossFight(topicId);
  if (!boss) {
    quizState = { topicId, index: 0, score: 0, total: 0, answered: false };
    renderQuizQuestion(topicId);
    return;
  }

  if (isBossDefeated(topicId)) {
    container.innerHTML = `
      <div class="boss-defeated-banner">
        <p>👾 <strong>${escapeHtml(boss.monster)}</strong> yenildi!</p>
        <p>Bu bölümün patronu alt edildi · +${BOSS_XP_REWARD} XP kazanıldı.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="boss-fight" id="bossFightPanel">
      <div class="boss-fight-header">
        <p class="boss-fight-kicker">// BÖLÜM SONU CANAVARI</p>
        <div class="boss-fight-monster" aria-hidden="true">${boss.emoji}</div>
        <p class="boss-fight-name">${escapeHtml(boss.monster)}</p>
      </div>
      <div class="boss-fight-task">${boss.task.replace(/`([^`]+)`/g, "<code>$1</code>")}</div>
      <textarea class="boss-code-editor" id="bossCodeEditor" spellcheck="false">${escapeHtml(boss.starter)}</textarea>
      <button type="button" class="boss-attack-btn" id="bossAttackBtn">⚔ Kodu Sına / Canavara Saldır</button>
      <div class="boss-output" id="bossOutput"><p class="output-line dim">// Kodunu yaz ve canavara saldır...</p></div>
    </div>`;

  document.getElementById("bossAttackBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    attackBoss(topicId);
  });
}

async function attackBoss(topicId) {
  const boss = getBossFight(topicId);
  const editor = document.getElementById("bossCodeEditor");
  const output = document.getElementById("bossOutput");
  const btn = document.getElementById("bossAttackBtn");
  if (!boss || !editor || !output || !btn) return;

  const code = editor.value.trim();
  if (!code) {
    output.innerHTML = '<p class="output-line err">Kod boş — fonksiyonunu yazmalısın!</p>';
    return;
  }

  btn.disabled = true;
  btn.textContent = "⏳ SINAV YAPILIYOR...";
  output.innerHTML = '<p class="output-line dim">// Unit testler çalıştırılıyor...</p>';

  try {
    const result = await runCodeWithTests(code, boss.tests);
    if (result.success) {
      output.innerHTML = '<p class="output-line ok">✓ Tüm unit testler geçti — PATRON DÜŞTÜ!</p>';
      triggerScreenShake();
      const victory = saveBossVictory(topicId);
      if (victory.firstVictory) {
        showBossVictoryOverlay(boss.monster);
        showXpToast(victory.xpGained);
        if (victory.stats) renderRpgHud(victory.stats);
        const idx = topics.findIndex((t) => t.id === topicId);
        if (idx !== -1) topics[idx].boss_defeated = true;
        renderStaircase();
        renderDevPanel();
        launchConfetti();
      }
      setTimeout(() => renderBossFight(topicId), 1200);
    } else {
      output.innerHTML = "";
      result.stderr.split("\n").forEach((line) => {
        if (!line.trim()) return;
        const p = document.createElement("p");
        p.className = "output-line err";
        p.textContent = line;
        output.appendChild(p);
      });
      if (!output.children.length) {
        output.innerHTML = '<p class="output-line err">Test başarısız — kodunu gözden geçir.</p>';
      }
      triggerDuckError(result.stderr || "", { boss: true });
    }
  } catch (err) {
    output.innerHTML = `<p class="output-line err">${escapeHtml(err.message)}</p>`;
    triggerDuckError(err.message || "", { boss: true });
  } finally {
    btn.disabled = false;
    btn.textContent = "⚔ Kodu Sına / Canavara Saldır";
  }
}

function triggerScreenShake() {
  const target = el.app || document.body;
  target.classList.remove("screen-shake");
  void target.offsetWidth;
  target.classList.add("screen-shake");
  setTimeout(() => target.classList.remove("screen-shake"), 700);
}

function showBossVictoryOverlay(monsterName) {
  if (!el.bossVictoryOverlay) return;
  if (el.bossVictorySub) {
    el.bossVictorySub.textContent = `${monsterName} alt edildi — +${BOSS_XP_REWARD} XP kasana aktarıldı.`;
  }
  el.bossVictoryOverlay.classList.remove("hidden");
}

function hideBossVictoryOverlay() {
  el.bossVictoryOverlay?.classList.add("hidden");
}

function updateBossNavLabel(topicId) {
  const btn = document.querySelector('.command-action-btn[data-focus="quiz"]');
  if (!btn) return;
  btn.textContent = isBossModule(topicId) ? "👾 Boss Fight'a Git" : "🧠 Modül Testine Git";
  if (el.focusTitle && activeFocusPanel === "quiz") {
    el.focusTitle.textContent = isBossModule(topicId) ? "👾 Boss Fight" : FOCUS_LABELS.quiz;
  }
}

function renderAcademyTabs(topicId) {
  renderLessonPanel(topicId);
  flashcardIndex = 0;
  renderFlashcards(topicId);
  startQuiz(topicId);
  updateBossNavLabel(topicId);
  const mod = getAcademyModule(topicId);
  if (el.codeEditor && mod.starter) el.codeEditor.value = mod.starter;
}

function getAllFlashcardsFlat() {
  const all = [];
  for (let i = 1; i <= DEFAULT_TOPICS.length; i++) {
    getAcademyModule(i).flashcards.forEach((c) => all.push({ ...c, topicId: i }));
  }
  return all;
}

function refreshDevTip() {
  const all = getAllFlashcardsFlat();
  if (!all.length) return;
  const pick = all[Math.floor(Math.random() * all.length)];
  if (el.devTipFront) el.devTipFront.textContent = pick.front;
  if (el.devTipBack) el.devTipBack.textContent = pick.code;
  if (el.devTipAnswer) el.devTipAnswer.textContent = pick.back;
  if (el.devTipFlipInner) el.devTipFlipInner.classList.remove("is-flipped");
}

function initDevTip() {
  refreshDevTip();
}

function bindLearningEvents() {
  document.querySelectorAll(".command-action-btn").forEach((btn) => {
    safeOn(btn, "click", (e) => {
      e.preventDefault();
      if (btn.dataset.focus) openFocusMode(btn.dataset.focus);
    });
  });
  safeOn(el.focusCloseBtn, "click", (e) => {
    e.preventDefault();
    closeFocusMode();
  });
  safeOn(el.devTipFlipBtn, "click", () => {
    el.devTipFlipInner?.classList.toggle("is-flipped");
  });
  safeOn(el.devTipRefresh, "click", (e) => {
    e.preventDefault();
    refreshDevTip();
  });
}


/* ── Pyodide (tarayıcıda Python) ── */
let pyodideReady = null;

function initPyodide() {
  if (!pyodideReady) {
    if (typeof loadPyodide !== "function") {
      pyodideReady = Promise.reject(new Error("Pyodide kütüphanesi yüklenemedi"));
    } else {
      pyodideReady = loadPyodide({ indexURL: PYODIDE_INDEX_URL });
    }
  }
  return pyodideReady;
}

function resetPyodideIO(pyodide) {
  pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`);
}

function isCodeBlocked(code) {
  return CODE_BLOCKED_PATTERNS.some((pattern) => pattern.test(code));
}

async function runCode(code) {
  const trimmed = code.trim();
  if (!trimmed) throw new Error("Kod boş olamaz");
  if (isCodeBlocked(trimmed)) {
    throw new Error("Güvenlik: Bu kod güvenlik nedeniyle çalıştırılamaz.");
  }

  const pyodide = await initPyodide();
  resetPyodideIO(pyodide);

  try {
    await pyodide.runPythonAsync(trimmed);
    const stdout = pyodide.runPython("sys.stdout.getvalue()");
    const stderr = pyodide.runPython("sys.stderr.getvalue()");
    return {
      stdout: stdout || "",
      stderr: stderr || "",
      exit_code: 0,
      success: true,
    };
  } catch (err) {
    const stderr = pyodide.runPython("sys.stderr.getvalue()") || String(err);
    return {
      stdout: "",
      stderr,
      exit_code: 1,
      success: false,
    };
  }
}

async function runCodeWithTests(userCode, testCode) {
  const combined = `${userCode.trim()}\n\n# --- Unit Tests ---\n${testCode.trim()}`;
  if (isCodeBlocked(combined)) {
    throw new Error("Güvenlik: Bu kod güvenlik nedeniyle çalıştırılamaz.");
  }
  return runCode(combined);
}

const TYPEWRITER_LINES = [
  "İnteraktif Python Akademisi...",
  "Sistem hazır. Bağlanıyorsun...",
];

const OPERATOR_KEY = "python_yol_operator";
const THEME_KEY = "python_yol_theme";
const DAILY_GOAL_KEY = "python_yol_daily_goal";
const DAILY_GOAL_DONE_KEY = "python_yol_daily_goal_done";
const DEFAULT_DAILY_GOAL = 30;
const DAILY_GOAL_OPTIONS = [15, 30, 45, 60];
const DAILY_RING_CIRCUMFERENCE = 188.5;
const WELCOME_PROGRESS_MS = 3800;
const WELCOME_HOLD_MS = 700;
const WELCOME_BURST_MS = 600;
const WELCOME_FADE_MS = 800;

const DEV_RANK_TITLES = [
  { minXp: 0, title: "Python Çırağı 🐍", icon: "🐍", avatarTier: "novice" },
  { minXp: 500, title: "Kod Geliştiricisi 💻", icon: "💻", avatarTier: "coder" },
  { minXp: 1500, title: "Python Uzmanı 👑", icon: "👑", avatarTier: "expert" },
  { minXp: 3000, title: "Veri Ustası 📊", icon: "📊", avatarTier: "master" },
  { minXp: 5000, title: "Full-Stack Yazılımcı 🚀", icon: "🚀", avatarTier: "legend" },
];

const DEV_RING_CIRCUMFERENCE = 251.2;

const GOAL_MOTIVATIONS = [
  "Her satır kod seni bir adım ileri taşır.",
  "Bugün küçük bir adım, yarın büyük bir beceri.",
  "Odaklan, kodla, öğren — serin seni taşır.",
  "Bu basamak seni bir sonraki seviyeye hazırlıyor.",
  "Pratik yapmak teoriden daha değerlidir.",
  "Merdivenin zirvesi sabırla tırmananlarındır.",
];

/** Site genelinde kayıtlı klavye kısayolları — modal buradan üretilir */
const KEYBOARD_SHORTCUTS = [
  {
    title: "Genel",
    items: [
      { keys: ["?"], desc: "Kısayollar panelini aç" },
      { keys: ["Esc"], desc: "Açık modalı kapat veya giriş ekranına dön" },
      { keys: ["Alt", "N"], desc: "Sıradaki hedefe git ve akademi modülünü aç" },
    ],
  },
  {
    title: "Akademi modülü",
    items: [
      { keys: ["Ctrl", "Enter"], desc: "Kodu çalıştır (laboratuvar sekmesindeyken)" },
    ],
  },
  {
    title: "Giriş ekranı",
    items: [
      { keys: ["Enter"], desc: "Ad alanındayken sisteme gir" },
    ],
  },
  {
    title: "Python merdiveni",
    items: [
      { keys: ["Enter"], desc: "Konu başlığına odaklanınca akademi modülünü aç" },
      { keys: ["Space"], desc: "Konu başlığına odaklanınca akademi modülünü aç" },
    ],
  },
];

const BOOT_LINES = [
  { text: "SYS://PYTHON_AKADEMI v4.0 — Boot sequence başlatıldı", cls: "dim boot" },
  { text: "▸ Kernel ..................... [OK]", cls: "dim boot" },
  { text: "▸ localStorage veritabanı .... [OK]", cls: "dim boot" },
  { text: "▸ 32 eğitim modülü ........... [YÜKLENDİ]", cls: "success boot" },
  { text: "▸ XP motoru .................. [AKTİF]", cls: "success boot" },
  { text: "▸ Kod sandbox ................ [HAZIR]", cls: "success boot" },
  { text: "▸ Aktivite haritası .......... [SENKRON]", cls: "success boot" },
  { text: "────────────────────────────────────", cls: "dim boot" },
  { text: "✓ Tüm sistemler çalışır durumda.", cls: "success boot" },
  { text: "▸ Giriş: [ SİSTEMİ BAŞLAT ] veya Enter", cls: "hint boot" },
];

const LANDING_BOOT_MS = 1500;
const LANDING_BOOT_LOGS = [
  { text: "> Kullanıcı doğrulandı...", cls: "success boot", delay: 80 },
  { text: "> Modüller yükleniyor...", cls: "dim boot", delay: 480 },
  { text: "> Erişim izni verildi.", cls: "success boot", delay: 980 },
];

/** @type {Record<string, HTMLElement|null>} */
const el = {};

let topics = [];
let userStats = null;
let nextGoalTopicId = null;
let focusedTopicId = null;
let xpToastTimeoutId = null;
let activityData = [];
let activeTopicId = null;
let activeTopicDuration = "";
let celebrationShown = false;
let noteTimer = null;
let appInitialized = false;
let enteringApp = false;
let typewriterLineIndex = 0;
let landingClockId = null;
let welcomeTimeoutId = null;
let welcomeRevealId = null;
let welcomeProgressRaf = null;
let landingBootTimeoutId = null;
let landingEnterTimeoutId = null;
let bootTimeoutIds = [];
let terminalMeterId = null;
let globalTickId = null;
let resizeBound = false;

/** @type {Map<number, { savedSpent: number, sessionSeconds: number, running: boolean, tickStart: number|null }>} */
const timerSessions = new Map();

function $(id) {
  return document.getElementById(id);
}

function cacheElements() {
  const ids = [
    "landing", "app", "typewriter", "typewriterCursor", "landingSub",
    "landingClock", "landingBootStatus", "operatorName", "operatorError",
    "terminalOutput", "terminalStatus", "terminalOperatorName", "terminalMeterFill",
    "enterSystemBtn", "bootBtnLabel", "welcomeOverlay", "welcomeFlash", "welcomePrefix", "welcomeName", "welcomeCursor", "welcomeProgressFill",
    "welcomeParticles", "welcomeBootFeed", "welcomeSub", "welcomeStatusLabel", "welcomeStatusPct",
    "welcomeWarning", "welcomeAlert", "welcomeKicker",
    "backToLandingBtn", "openShortcutsBtn", "footerShortcutsBtn", "landingShortcutsBtn",
    "shortcutsModal", "shortcutsFrame", "shortcutsBody", "shortcutsClose",
    "hudUsername", "hudUserChip",
    "devPanel", "devAvatar", "devAvatarName", "devLevelBadge", "devRingFill",
    "devProgressLabel", "devCompletedCount", "devTodayMinutes", "devTotalXpDisplay",
    "devStreak", "devLevelRank", "devXpText", "devXpFill", "devWeekBars",
    "devGoalCard", "devGoalChapter", "devGoalTopic", "devGoalMeta", "devGoalMotivation",
    "devGoalBtn", "devGoalScrollBtn", "devMissionList",
    "devCurrentCard", "devCurrentChapter", "devCurrentTopic", "devCurrentOpenBtn",
    "mobileGoalBar", "mobileGoalTopic", "mobileGoalBtn",
    "devDailyGoal", "devDailyStatus", "devDailyRingFill", "devDailyRingLabel", "devDailyHint",
    "staircase", "loading", "progressFill", "progressPercent", "progressMeta",
    "notesModal", "notesModalPanel", "modalFrame", "modalTitle", "modalTag", "modalNotes", "modalStatus",
    "modalClose", "commandCenter", "focusMode", "focusCloseBtn", "focusTitle",
    "celebrationOverlay", "celebrationClose", "staircasePath",
    "timerDisplay", "timerToggle", "missionTimer", "timerToggleIcon", "timerToggleText",
    "timerSave", "timerReset", "timerStatus", "timerState", "timerSaved", "timerSession",
    "timerEstimate", "timerProgressFill", "timerProgressLabel", "timerSavePill", "timerTotal",
    "timerRing", "hudActiveTimer", "hudTimerLabel", "hudTimerClock",
    "rpgStreak", "rpgLevel", "rpgRank", "rpgXpText", "rpgXpFill", "cosmicGrid",
    "codeEditor", "runCodeBtn", "codeOutput", "markdownPreview", "lessonContent",
    "flashcardsContainer", "quizContainer",
    "devTipFront", "devTipBack", "devTipAnswer", "devTipFlipBtn", "devTipFlipInner", "devTipRefresh",
    "xpToast", "xpToastIcon", "xpToastText",
    "bossVictoryOverlay", "bossVictoryClose", "bossVictorySub",
    "orduckWidget", "orduckChatPanel", "orduckChatClose", "orduckChatStatus", "orduckChatText",
    "orduckChatThread", "orduckChatBody",
    "orduckAiStatus", "orduckChatInput", "orduckChatSend", "orduckChatMic", "orduckChatForm",
    "orduckErrorToast",
    "cyberHeroPanel", "cyberHeroTitle", "cyberHeroSub", "cyberHeroResumeBtn",
    "orduckBtnProgress", "orduckBtnCode", "orduckBtnTip",
    "cyberDuck",
  ];
  ids.forEach((id) => {
    el[id] = $(id);
  });
}

function safeOn(target, event, handler, options) {
  if (target) target.addEventListener(event, handler, options);
}

/* ── Veri katmanı (localStorage) ── */
function fetchTopics() {
  const state = loadState();
  return state.topics.map((t) => ({ ...t }));
}

function updateCompletion(topicId, isCompleted) {
  const state = loadState();
  const topic = findTopic(state, topicId);
  if (!topic) throw new Error("Konu bulunamadı");

  const wasCompleted = topic.is_completed;
  topic.is_completed = Boolean(isCompleted);

  let xpGained = 0;
  let stats;
  if (isCompleted && !wasCompleted) {
    stats = addXp(state, 100);
    xpGained = 100;
  } else {
    stats = statsToDict(state.stats);
  }

  saveState(state);
  return { ...topic, xp_gained: xpGained, stats };
}

function updateNotes(topicId, notes) {
  const state = loadState();
  const topic = findTopic(state, topicId);
  if (!topic) throw new Error("Konu bulunamadı");
  topic.notes = notes;
  saveState(state);
  return { ...topic };
}

function updateTime(topicId, seconds, mode = "add") {
  const state = loadState();
  const topic = findTopic(state, topicId);
  if (!topic) throw new Error("Konu bulunamadı");

  if (mode === "add") {
    topic.time_spent += seconds;
  } else if (mode === "set") {
    topic.time_spent = seconds;
  } else {
    throw new Error("mode 'add' veya 'set' olmalı");
  }

  let xpGained = 0;
  if (mode === "add" && seconds > 0) {
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      xpGained = minutes * 10;
      addXp(state, xpGained);
      addDailyMinutes(state, minutes);
    } else if (seconds >= 30) {
      addDailyMinutes(state, 1);
    }
  }

  const stats = statsToDict(state.stats);
  saveState(state);
  return { ...topic, xp_gained: xpGained, stats };
}

function fetchStats() {
  return statsToDict(loadState().stats);
}

function fetchActivity() {
  return getActivityMap(loadState(), 30);
}

/* ── RPG & Kozmik Harita ── */
function getDevRankTitle(xp = 0) {
  let title = DEV_RANK_TITLES[0].title;
  for (const rank of DEV_RANK_TITLES) {
    if (xp >= rank.minXp) title = rank.title;
  }
  return title;
}

function getDevAvatarTier(xp = 0) {
  let tier = DEV_RANK_TITLES[0].avatarTier;
  for (const rank of DEV_RANK_TITLES) {
    if (xp >= rank.minXp) tier = rank.avatarTier;
  }
  return tier;
}

function updateDevAvatarTier(xp = 0) {
  if (!el.devAvatar) return;
  el.devAvatar.dataset.tier = getDevAvatarTier(xp);
}

function getTodayMinutes() {
  if (!activityData.length) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = activityData.find((d) => d.date === today);
  return todayEntry?.minutes ?? 0;
}

function getDailyGoalMinutes() {
  const stored = parseInt(localStorage.getItem(DAILY_GOAL_KEY) || "", 10);
  return DAILY_GOAL_OPTIONS.includes(stored) ? stored : DEFAULT_DAILY_GOAL;
}

function setDailyGoalMinutes(minutes) {
  if (!DAILY_GOAL_OPTIONS.includes(minutes)) return;
  localStorage.setItem(DAILY_GOAL_KEY, String(minutes));
  renderDailyGoal();
}

function renderDailyGoal() {
  const goal = getDailyGoalMinutes();
  const today = getTodayMinutes();
  const pct = goal > 0 ? Math.min(100, Math.round((today / goal) * 100)) : 0;
  const complete = today >= goal && goal > 0;
  const remaining = Math.max(0, goal - today);

  if (el.devDailyRingFill) {
    const offset = DAILY_RING_CIRCUMFERENCE - (pct / 100) * DAILY_RING_CIRCUMFERENCE;
    el.devDailyRingFill.style.strokeDashoffset = String(offset);
  }
  if (el.devDailyRingLabel) {
    el.devDailyRingLabel.textContent = complete ? "✓" : `${pct}%`;
  }
  if (el.devDailyStatus) {
    el.devDailyStatus.textContent = `${today} / ${goal} dk`;
  }
  if (el.devDailyHint) {
    if (complete) {
      el.devDailyHint.textContent = "Harika! Günlük hedefini tamamladın. 🎉";
    } else if (today === 0) {
      el.devDailyHint.textContent = `Bugün ${goal} dakika odaklan — sayacı kaydet, halka dolsun.`;
    } else {
      el.devDailyHint.textContent = `Hedefe ${remaining} dakika kaldı. Devam et!`;
    }
  }
  if (el.devDailyGoal) {
    el.devDailyGoal.classList.toggle("dev-daily-complete", complete);
  }
  if (el.devDailyGoal) {
    el.devDailyGoal.querySelectorAll(".dev-daily-preset").forEach((btn) => {
      const mins = Number(btn.dataset.minutes);
      btn.classList.toggle("active", mins === goal);
    });
  }
  if (el.devTodayMinutes) el.devTodayMinutes.textContent = String(today);
}

function updateDevProgressRing(pct) {
  if (!el.devRingFill) return;
  const clamped = Math.min(100, Math.max(0, pct));
  const offset = DEV_RING_CIRCUMFERENCE - (clamped / 100) * DEV_RING_CIRCUMFERENCE;
  el.devRingFill.style.strokeDashoffset = String(offset);
}

function renderDevWeekBars() {
  if (!el.devWeekBars) return;
  el.devWeekBars.innerHTML = "";

  const last7 = activityData.slice(-7);
  const maxMinutes = Math.max(1, ...last7.map((d) => d.minutes));

  const dayLabels = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];

  last7.forEach((day) => {
    const wrap = document.createElement("div");
    wrap.className = "dev-week-bar";
    wrap.title = `${day.date}: ${day.minutes} dk`;

    const fill = document.createElement("div");
    fill.className = "dev-week-bar-fill";
    if (day.minutes > 0) fill.classList.add("has-data");
    const heightPct = Math.max(8, Math.round((day.minutes / maxMinutes) * 100));
    fill.style.height = `${heightPct}%`;

    const label = document.createElement("span");
    label.className = "dev-week-bar-label";
    const d = new Date(`${day.date}T12:00:00`);
    label.textContent = dayLabels[d.getDay()];

    wrap.appendChild(fill);
    wrap.appendChild(label);
    el.devWeekBars.appendChild(wrap);
  });
}

function renderDevMissionList() {
  if (!el.devMissionList) return;
  el.devMissionList.innerHTML = "";

  topics.forEach((topic) => {
    const li = document.createElement("li");
    li.className = "dev-mission-item";
    if (topic.is_completed) li.classList.add("is-done");
    if (topic.id === nextGoalTopicId) li.classList.add("is-next");

    const status = document.createElement("span");
    status.className = "dev-mission-status";
    status.textContent = topic.is_completed ? "✓" : "○";
    status.setAttribute("aria-hidden", "true");

    const title = document.createElement("span");
    title.className = "dev-mission-title";
    title.textContent = getShortTitle(topic.title);

    li.appendChild(status);
    li.appendChild(title);
    li.addEventListener("click", () => openNotesModal(topic));
    el.devMissionList.appendChild(li);
  });
}

function findNextTopic() {
  if (!topics.length) return null;
  return topics.find((t) => !t.is_completed) ?? null;
}

function getGoalMotivation(topic) {
  if (!topic) return "";
  if (!topic.time_spent) {
    return "Bu konuya henüz başlamadın — harika bir başlangıç noktası seni bekliyor.";
  }
  if (!topic.is_completed) {
    return "Yarım kalan işini tamamla; momentumunu koru ve ilerlemeye devam et.";
  }
  const idx = topics.findIndex((t) => t.id === topic.id);
  return GOAL_MOTIVATIONS[Math.max(0, idx) % GOAL_MOTIVATIONS.length];
}

function highlightNextGoalStep(topicId) {
  if (!el.staircase) return;
  el.staircase.querySelectorAll(".step.next-goal-highlight").forEach((step) => {
    step.classList.remove("next-goal-highlight");
  });
  if (!topicId) return;
  const step = el.staircase.querySelector(`[data-topic-id="${topicId}"]`);
  if (step) step.classList.add("next-goal-highlight");
}

function highlightFocusedStep(topicId) {
  if (!el.staircase) return;
  el.staircase.querySelectorAll(".step.step-focused").forEach((step) => {
    step.classList.remove("step-focused");
  });
  if (!topicId) return;
  const step = el.staircase.querySelector(`[data-topic-id="${topicId}"]`);
  if (step) step.classList.add("step-focused");
}

function setFocusedTopic(topicId) {
  focusedTopicId = topicId ?? null;
  highlightFocusedStep(focusedTopicId);
  updateDevCurrentSection();
}

function updateDevCurrentSection() {
  const focused = focusedTopicId
    ? topics.find((t) => t.id === focusedTopicId)
    : null;

  if (el.devCurrentCard) {
    el.devCurrentCard.classList.toggle("hidden", !focused);
  }
  if (!focused) return;

  if (el.devCurrentChapter) el.devCurrentChapter.textContent = getBolum(focused.title);
  if (el.devCurrentTopic) el.devCurrentTopic.textContent = getShortTitle(focused.title);
}

function scrollToTopic(topicId) {
  const step = el.staircase?.querySelector(`[data-topic-id="${topicId}"]`);
  if (step) step.scrollIntoView({ behavior: "smooth", block: "center" });
}

function renderDevPanel() {
  const name = getOperatorName();
  const displayName = name
    ? name.charAt(0).toUpperCase() + name.slice(1)
    : "Yazılımcı";

  if (el.devAvatarName) el.devAvatarName.textContent = displayName;

  const stats = userStats || {};
  const streak = stats.streak_count ?? 0;
  const level = stats.user_level ?? 1;
  const totalXp = stats.total_xp ?? 0;
  const xpInLevel = totalXp % 500;
  const xpPct = stats.level_progress_pct ?? Math.round((xpInLevel / 500) * 100);

  const totalTopics = topics.length;
  const completed = topics.filter((t) => t.is_completed).length;
  const roadmapPct = totalTopics === 0 ? 0 : Math.round((completed / totalTopics) * 100);

  if (el.devAvatar) updateDevAvatarTier(totalXp);
  if (el.devLevelBadge) el.devLevelBadge.textContent = String(level);
  updateDevProgressRing(roadmapPct);

  if (el.devProgressLabel) {
    el.devProgressLabel.textContent = totalTopics
      ? `${completed} / ${totalTopics} bölüm tamamlandı (%${roadmapPct})`
      : "Yol haritası yükleniyor...";
  }
  if (el.devCompletedCount) el.devCompletedCount.textContent = String(completed);
  if (el.devTotalXpDisplay) el.devTotalXpDisplay.textContent = String(totalXp);

  renderDailyGoal();

  if (el.devStreak) {
    el.devStreak.textContent = streak > 0
      ? `${streak} Günlük Odaklanma`
      : "Serini bugün başlat";
  }
  if (el.devLevelRank) {
    el.devLevelRank.textContent = `Seviye ${level} — ${getDevRankTitle(totalXp)}`;
  }
  if (el.devXpText) el.devXpText.textContent = `${xpInLevel} / 500 XP`;
  if (el.devXpFill) el.devXpFill.style.width = `${xpPct}%`;

  renderDevWeekBars();

  renderDevMissionList();

  const nextTopic = findNextTopic();
  nextGoalTopicId = nextTopic?.id ?? null;
  highlightNextGoalStep(nextGoalTopicId);
  highlightFocusedStep(focusedTopicId);
  updateDevCurrentSection();

  if (el.devGoalCard) {
    el.devGoalCard.classList.toggle("dev-goal-card-pulse", Boolean(nextTopic && !nextTopic.time_spent));
  }

  if (el.devGoalChapter) {
    if (nextTopic) {
      el.devGoalChapter.textContent = getBolum(nextTopic.title);
      el.devGoalChapter.classList.remove("hidden");
    } else {
      el.devGoalChapter.classList.add("hidden");
    }
  }

  if (el.devGoalTopic) {
    el.devGoalTopic.textContent = nextTopic
      ? getShortTitle(nextTopic.title)
      : "Tüm bölümler tamamlandı! 🎉";
  }

  if (el.devGoalMeta) {
    if (nextTopic) {
      const parts = [];
      if (nextTopic.time_spent > 0) {
        parts.push(`🟢 ${formatClock(nextTopic.time_spent)} kayıtlı`);
      } else {
        parts.push("✨ Henüz çalışılmadı");
      }
      el.devGoalMeta.textContent = parts.join(" · ");
    } else {
      el.devGoalMeta.textContent = "";
    }
  }

  if (el.devGoalMotivation) {
    el.devGoalMotivation.textContent = nextTopic
      ? getGoalMotivation(nextTopic)
      : "Python yolculuğunu baştan sona tamamladın. Tebrikler, gerçek bir geliştiricisin!";
  }

  if (el.devGoalBtn) {
    el.devGoalBtn.disabled = !nextTopic;
    el.devGoalBtn.textContent = nextTopic
      ? (nextTopic.time_spent > 0 ? "Devam Et" : "Çalışmaya Başla")
      : "Yol Haritası Tamam";
  }

  if (el.devGoalScrollBtn) {
    el.devGoalScrollBtn.classList.toggle("hidden", !nextTopic);
  }

  updateMobileGoalBar(nextTopic);
  renderCyberHeroPanel();
}

function updateMobileGoalBar(nextTopic) {
  if (!el.mobileGoalTopic || !el.mobileGoalBtn) return;

  if (nextTopic) {
    el.mobileGoalTopic.textContent = getShortTitle(nextTopic.title);
    el.mobileGoalBtn.disabled = false;
    el.mobileGoalBtn.textContent = nextTopic.time_spent > 0 ? "Devam" : "Başla";
  } else {
    el.mobileGoalTopic.textContent = "Tüm bölümler tamam!";
    el.mobileGoalBtn.disabled = true;
    el.mobileGoalBtn.textContent = "Bitti";
  }
}

function scrollToNextGoal() {
  if (!nextGoalTopicId) return;
  scrollToTopic(nextGoalTopicId);
}

function startNextGoal() {
  const nextTopic = findNextTopic();
  if (!nextTopic) return;
  setFocusedTopic(nextTopic.id);
  scrollToTopic(nextTopic.id);
  openNotesModal(nextTopic);
}

function renderRpgHud(stats) {
  if (!stats) return;
  userStats = stats;
  if (el.rpgStreak) el.rpgStreak.textContent = `${stats.streak_count ?? 0} Gün Kesintisiz Kodlama!`;
  if (el.rpgLevel) el.rpgLevel.textContent = `Seviye ${stats.user_level ?? 1}`;
  if (el.rpgRank) el.rpgRank.textContent = `Unvan: ${stats.rank_title ?? "Yeni Başlayan 🐍"}`;
  const xpInLevel = (stats.total_xp ?? 0) % 500;
  const pct = stats.level_progress_pct ?? Math.round((xpInLevel / 500) * 100);
  if (el.rpgXpText) el.rpgXpText.textContent = `${xpInLevel} / 500 XP`;
  if (el.rpgXpFill) el.rpgXpFill.style.width = `${pct}%`;
  renderDevPanel();
}

function hideXpToast() {
  if (xpToastTimeoutId !== null) {
    clearTimeout(xpToastTimeoutId);
    xpToastTimeoutId = null;
  }
  if (el.xpToast) {
    el.xpToast.classList.add("hidden");
    el.xpToast.classList.remove("xp-toast-complete");
  }
  if (el.xpToastIcon) el.xpToastIcon.textContent = "⚡";
}

function showXpToast(amount) {
  if (!amount || amount <= 0 || !el.xpToast || !el.xpToastText) return;
  hideXpToast();
  if (el.xpToastIcon) el.xpToastIcon.textContent = "⚡";
  el.xpToastText.textContent = `+${amount} XP Kazandın!`;
  el.xpToast.classList.remove("hidden", "xp-toast-complete");
  xpToastTimeoutId = setTimeout(hideXpToast, 2200);
}

function showCompletionToast(topic, xpGained = 0) {
  if (!topic || !el.xpToast || !el.xpToastText) return;
  hideXpToast();
  const title = getShortTitle(topic.title);
  const xpPart = xpGained > 0 ? ` · +${xpGained} XP` : "";
  if (el.xpToastIcon) el.xpToastIcon.textContent = "🎉";
  el.xpToastText.textContent = `Bölüm tamam! ${title}${xpPart}`;
  el.xpToast.classList.remove("hidden");
  el.xpToast.classList.add("xp-toast-complete");
  xpToastTimeoutId = setTimeout(hideXpToast, 2800);
}

function showDailyGoalToast() {
  if (!el.xpToast || !el.xpToastText) return;
  hideXpToast();
  if (el.xpToastIcon) el.xpToastIcon.textContent = "🎯";
  el.xpToastText.textContent = "Günlük hedef tamamlandı! Harika iş.";
  el.xpToast.classList.remove("hidden");
  el.xpToast.classList.add("xp-toast-complete");
  xpToastTimeoutId = setTimeout(hideXpToast, 2800);
}

function maybeCelebrateDailyGoal(wasCompleteBefore) {
  const goal = getDailyGoalMinutes();
  const completeNow = getTodayMinutes() >= goal && goal > 0;
  const today = new Date().toISOString().slice(0, 10);
  const celebrated = localStorage.getItem(DAILY_GOAL_DONE_KEY);
  if (completeNow && !wasCompleteBefore && celebrated !== today) {
    localStorage.setItem(DAILY_GOAL_DONE_KEY, today);
    showDailyGoalToast();
  }
}

function getCosmicLevel(minutes) {
  if (minutes === 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 45) return 2;
  if (minutes < 90) return 3;
  return 4;
}

function renderCosmicMap(data) {
  if (!el.cosmicGrid || !Array.isArray(data)) return;
  activityData = data;
  el.cosmicGrid.innerHTML = "";
  data.forEach((day) => {
    const cell = document.createElement("div");
    const level = getCosmicLevel(day.minutes);
    cell.className = `cosmic-cell level-${level}`;
    cell.dataset.tooltip = day.minutes > 0
      ? `⏳ ${day.minutes} Dakika Kod Yazıldı`
      : `⏳ 0 Dakika — ${day.date}`;
    el.cosmicGrid.appendChild(cell);
  });
  renderDevPanel();
}

function renderMarkdownPreview() {
  if (!el.markdownPreview || !el.modalNotes) return;
  if (typeof marked === "undefined") {
    el.markdownPreview.textContent = el.modalNotes.value || "";
    return;
  }
  el.markdownPreview.innerHTML = marked.parse(el.modalNotes.value || "");
  if (typeof Prism !== "undefined") {
    el.markdownPreview.querySelectorAll("pre code").forEach((block) => {
      Prism.highlightElement(block);
    });
  }
}

function renderCodeOutput(result) {
  if (!el.codeOutput) return;
  el.codeOutput.innerHTML = "";
  if (result.stdout) {
    result.stdout.split("\n").forEach((line) => {
      const p = document.createElement("p");
      p.className = "output-line out";
      p.textContent = line;
      el.codeOutput.appendChild(p);
    });
  }
  if (result.stderr) {
    result.stderr.split("\n").forEach((line) => {
      if (!line.trim()) return;
      const p = document.createElement("p");
      p.className = "output-line err";
      p.textContent = line;
      el.codeOutput.appendChild(p);
    });
  }
  if (!result.stdout && !result.stderr) {
    const p = document.createElement("p");
    p.className = "output-line dim";
    p.textContent = result.success ? "// Kod başarıyla çalıştı (çıktı yok)" : "// Hata oluştu";
    el.codeOutput.appendChild(p);
  }
  if (!result.success) triggerDuckError(result.stderr || "");
}

function classifyDuckError(text) {
  const sample = String(text || "").toLowerCase();
  if (!sample.trim()) return "generic";
  if (sample.includes("assertionerror") || sample.includes("assert")) return "assert";
  if (sample.includes("syntaxerror")) return "syntax";
  if (sample.includes("indentationerror")) return "indent";
  if (sample.includes("nameerror")) return "name";
  if (sample.includes("typeerror")) return "type";
  if (sample.includes("indexerror") || sample.includes("keyerror")) return "index";
  if (sample.includes("valueerror")) return "value";
  if (sample.includes("zerodivisionerror")) return "zero";
  return "generic";
}

function getDuckPersonalityLine(errorKind) {
  const bucket = DUCK_ERROR_LINES[errorKind] || DUCK_ERROR_LINES.generic;
  return bucket[duckPersonality] || bucket.mentor;
}

function isModalOpen() {
  return el.notesModal && !el.notesModal.classList.contains("hidden");
}

function getDuckProgressSnapshot() {
  const state = loadState();
  const stats = statsToDict(state.stats);
  const completed = state.topics.filter((t) => t.is_completed).length;
  const total = state.topics.length;
  const bosses = Object.values(state.learning?.bosses || {}).filter((b) => b.defeated).length;
  return { stats, completed, total, bosses };
}

function buildDuckProgressMessage() {
  const { stats, completed, total, bosses } = getDuckProgressSnapshot();
  const base = `Seviye ${stats.user_level}'tesin, ${stats.total_xp} XP topladın.\n${completed}/${total} modül tamamlandı · ${bosses} patron yenildi.\nUnvan: ${stats.rank_title} · Seri: ${stats.streak_count} gün.`;
  if (duckPersonality === "strict") {
    return `${base}\n\nNot: XP kendiliğinden gelmez — çalış, kaydet, test et.`;
  }
  if (duckPersonality === "socratic") {
    return `${base}\n\nSıradaki hedefin hangi modül — ve neden o?`;
  }
  return `${base}\n\nHarika gidiyorsun; bir sonraki basamağa odaklan.`;
}

function getActiveEditorCode() {
  const bossEditor = document.getElementById("bossCodeEditor");
  if (isModalOpen() && activeFocusPanel === "quiz" && activeTopicId && isBossModule(activeTopicId) && bossEditor) {
    return bossEditor.value || "";
  }
  if (el.codeEditor && isModalOpen() && activeFocusPanel === "code") {
    return el.codeEditor.value || "";
  }
  if (el.codeEditor?.value?.trim()) return el.codeEditor.value;
  if (bossEditor?.value?.trim()) return bossEditor.value;
  return "";
}

function analyzePythonCode(code) {
  const findings = [];
  const trimmed = code.trim();
  if (!trimmed) {
    findings.push({ id: "empty", mentor: "Editör boş görünüyor. Önce küçük bir deneme yaz.", strict: "Editör bomboş — debug edecek kod yok.", socratic: "Ne test etmek istiyorsun — tek satırlık bir başlangıç yazabilir misin?" });
    return findings;
  }

  const lines = code.split("\n");
  const hasTab = /^\t/.test(code);
  const hasSpaceIndent = /^ {1,}/m.test(code);
  if (hasTab && hasSpaceIndent) {
    findings.push({ id: "indent_mix", mentor: "Sekme ve boşluk girintisi karışmış. Tek bir girinti stili kullan.", strict: "Tab + space karışımı — IndentationError davetiyesi.", socratic: "Blokların girintisi tutarlı mı — hangi satır farklı hizada?" });
  }

  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    findings.push({ id: "paren", mentor: `Parantez sayısı uyuşmuyor (${openParens} açık, ${closeParens} kapalı).`, strict: "Parantez dengesi yok — SyntaxError kapıda.", socratic: "Hangi satırda açık parantez kapatılmamış olabilir?" });
  }

  const openBrackets = (code.match(/\[/g) || []).length;
  const closeBrackets = (code.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    findings.push({ id: "bracket", mentor: "Köşeli parantezler dengeli değil.", strict: "[] eşleşmiyor — list comprehension mı kırık?", socratic: "Açık kalan [ hangi satırda?" });
  }

  const singleQuotes = (code.match(/'/g) || []).length;
  const doubleQuotes = (code.match(/"/g) || []).length;
  if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
    findings.push({ id: "quote", mentor: "Tırnak eşleşmesi bozuk olabilir.", strict: "Kapanmamış tırnak — Python string'i yarıda bırakmışsın.", socratic: "String nerede başlıyor, nerede bitmeli?" });
  }

  if (/\bprint\s+[^(]/.test(code)) {
    findings.push({ id: "print", mentor: "Python 3'te print bir fonksiyondur: print('metin') şeklinde parantez kullan.", strict: "print merhaba değil, print('merhaba') — Python 2 kalmadı.", socratic: "print ifadesinin parantezi var mı?" });
  }

  lines.forEach((line, idx) => {
    const stripped = line.trim();
    if (/^(if|elif|else|for|while|def|class|try|except|finally|with)\b/.test(stripped) && !stripped.endsWith(":")) {
      findings.push({ id: `colon_${idx}`, mentor: `Satır ${idx + 1}: '${stripped.split(/\s/)[0]}' satırının sonunda ':' olmalı.`, strict: `Satır ${idx + 1} — iki nokta unutulmuş. Klasik SyntaxError.`, socratic: `Satır ${idx + 1}'de blok başlıyor mu — ':' eksik olabilir mi?` });
    }
  });

  if (!findings.length) {
    findings.push({ id: "ok", mentor: "İlk bakışta belirgin sözdizimi sorunu görmedim. Çalıştırıp çıktıyı print() ile doğrula.", strict: "Statik tarama temiz — ama çalıştırmadan emin olma, Pyodide seni yalanlar.", socratic: "Kodun en riskli satırı hangisi — neden?" });
  }

  return findings;
}

function buildDuckCodeReviewMessage() {
  const code = getActiveEditorCode();
  if (!code.trim()) {
    const empty = analyzePythonCode("")[0];
    return empty[duckPersonality] || empty.mentor;
  }
  const findings = analyzePythonCode(code);
  const lines = findings.slice(0, 3).map((f) => f[duckPersonality] || f.mentor);
  return lines.join("\n\n");
}

function matchOrduckKnowledge() {
  const hints = [];
  if (activeTopicId) {
    const topic = topics.find((t) => t.id === activeTopicId);
    if (topic) hints.push(getShortTitle(topic.title).toLowerCase());
  }
  if (activeFocusPanel) hints.push(activeFocusPanel);
  if (getRunningTopicId() !== null) hints.push("odak", "sayaç");
  const code = getActiveEditorCode().toLowerCase();
  if (code.includes("def ")) hints.push("fonksiyon", "def");
  if (code.includes("for ") || code.includes("while")) hints.push("döngü", "for");
  hints.push("python", "pyodide", "xp");

  for (const entry of ORDUCK_KNOWLEDGE) {
    if (entry.keys.some((key) => hints.some((h) => h.includes(key) || key.includes(h)))) {
      return entry[duckPersonality] || entry.mentor;
    }
  }
  const fallback = ORDUCK_KNOWLEDGE[Math.floor(Math.random() * ORDUCK_KNOWLEDGE.length)];
  return fallback[duckPersonality] || fallback.mentor;
}

function buildDuckTipMessage() {
  if (getRunningTopicId() !== null) {
    if (duckPersonality === "strict") return "Sayaç koşuyor — sosyal medyaya bakarsan zamanın da uçar gider.";
    if (duckPersonality === "socratic") return "Sayaç aktifken tam olarak hangi görevi bitirmeye çalışıyorsun?";
    return "Odak modundasın. Tek hedef, tek modül — dağılma.";
  }
  if (isModalOpen() && activeFocusPanel === "quiz" && activeTopicId && isBossModule(activeTopicId)) {
    if (duckPersonality === "strict") return "Boss Fight: fonksiyon adını görevle birebir eşleştir — yoksa assert seni yer.";
    if (duckPersonality === "socratic") return "Patronu yenmek için kodunun hangi girdilerde doğru çalışması gerekiyor?";
    return "Boss Fight'ta gizli testler var. Kenar durumlarını düşün.";
  }
  return matchOrduckKnowledge();
}

function deliverDuckResponse(text, options = {}) {
  const { analyzing = true, alert = false, typewriter = true, role = "assistant" } = options;
  el.orduckWidget?.classList.toggle("is-alert", alert);

  if (!duckChatOpen) openDuckChat(false);

  if (duckAnalyzeTimeoutId !== null) {
    clearTimeout(duckAnalyzeTimeoutId);
    duckAnalyzeTimeoutId = null;
  }
  if (orduckThreadTypewriterId !== null) {
    clearInterval(orduckThreadTypewriterId);
    orduckThreadTypewriterId = null;
  }
  if (duckTypewriterId !== null) {
    clearInterval(duckTypewriterId);
    duckTypewriterId = null;
  }

  const body = String(text || "").trim();
  if (!body && analyzing) {
    setOrduckThinking(true);
    return;
  }

  const publish = () => {
    setOrduckThinking(false);
    if (!body) return;
    appendOrduckChatMessage(role, body, {
      typewriter: typewriter && role === "assistant",
      alert,
      speed: alert ? 12 : 14,
    });
  };

  if (analyzing && body) {
    setOrduckThinking(true);
    duckAnalyzeTimeoutId = window.setTimeout(() => {
      publish();
      duckAnalyzeTimeoutId = null;
    }, 280);
  } else {
    publish();
  }
}

function openDuckChat(showWelcome = true) {
  if (!el.orduckChatPanel) return;
  duckChatOpen = true;
  el.orduckChatPanel.classList.remove("hidden");
  el.cyberDuck?.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => el.orduckChatPanel.classList.add("is-open"));
  probeOllamaProvider().catch(() => updateOrduckAiStatusUI());

  if (showWelcome && duckWelcomePending) {
    duckWelcomePending = false;
    seedOrduckWelcomeIfEmpty();
  }
}

function closeDuckChat() {
  if (!el.orduckChatPanel) return;
  duckChatOpen = false;
  el.orduckChatPanel.classList.remove("is-open");
  el.cyberDuck?.setAttribute("aria-expanded", "false");
  el.orduckWidget?.classList.remove("is-alert");
  if (duckAnalyzeTimeoutId !== null) {
    clearTimeout(duckAnalyzeTimeoutId);
    duckAnalyzeTimeoutId = null;
  }
  if (duckTypewriterId !== null) {
    clearInterval(duckTypewriterId);
    duckTypewriterId = null;
  }
  if (orduckThreadTypewriterId !== null) {
    clearInterval(orduckThreadTypewriterId);
    orduckThreadTypewriterId = null;
  }
  window.setTimeout(() => {
    if (!duckChatOpen) el.orduckChatPanel?.classList.add("hidden");
  }, 320);
}

function toggleDuckChat() {
  if (duckChatOpen) closeDuckChat();
  else openDuckChat(true);
}

function setDuckPersonality(next) {
  duckPersonality = next;
  document.querySelectorAll(".orduck-tab").forEach((tab) => {
    const active = tab.dataset.personality === next;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  const ack = {
    mentor: "Mentor modu aktif — birlikte adım adım ilerleyeceğiz.",
    strict: "Sert İncelemeci modu aktif — nazik yalan yok, net konuşacağım.",
    socratic: "Sokratik mod aktif — cevabı birlikte sorularla bulacağız.",
  };
  deliverDuckResponse(ack[next] || ack.mentor, { analyzing: false });
}

function triggerDuckError(errorText = "", options = {}) {
  if (!el.orduckWidget) return;
  let kind = classifyDuckError(errorText);
  if (options.boss && kind === "generic") kind = "assert";
  const message = getDuckPersonalityLine(kind);
  pulseOrduckErrorState();
  showOrduckErrorToast();
  openDuckChat(false);
  deliverDuckResponse(message, { analyzing: true, alert: true });
  if (duckAlertTimeoutId !== null) clearTimeout(duckAlertTimeoutId);
  duckAlertTimeoutId = window.setTimeout(() => {
    el.orduckWidget?.classList.remove("is-alert");
    duckAlertTimeoutId = null;
  }, 6500);
}

function maybeDuckWelcome() {
  if (duckWelcomeShown) return;
  duckWelcomeShown = true;
}

function initCyberDuck() {
  if (!el.cyberDuck || !el.orduckWidget) return;

  loadOrduckConversationMemory();
  if (orduckChatHistory.length) renderOrduckChatThread();
  else seedOrduckWelcomeIfEmpty();

  initOrduckSpeechInput();

  safeOn(el.cyberHeroResumeBtn, "click", (e) => {
    e.preventDefault();
    scrollCyberHeroResume();
  });

  safeOn(el.cyberDuck, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleDuckChat();
  });
  safeOn(el.cyberDuck, "keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    toggleDuckChat();
  });

  safeOn(el.orduckChatClose, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeDuckChat();
  });

  safeOn(el.orduckWidget, "click", (e) => e.stopPropagation());

  document.querySelectorAll(".orduck-tab").forEach((tab) => {
    safeOn(tab, "click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDuckPersonality(tab.dataset.personality || "mentor");
    });
  });

  safeOn(el.orduckBtnProgress, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    deliverDuckResponse(buildDuckProgressMessage());
  });

  safeOn(el.orduckBtnCode, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    deliverDuckResponse(buildDuckCodeReviewMessage());
  });

  safeOn(el.orduckBtnTip, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    deliverDuckResponse(buildDuckTipMessage());
  });

  safeOn(el.orduckChatForm, "submit", (e) => {
    e.preventDefault();
    handleOrduckUserMessage();
  });

  safeOn(el.orduckChatMic, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleOrduckMic();
  });

  safeOn(el.orduckChatThread, "click", (e) => {
    const copyBtn = e.target.closest("[data-orduck-copy]");
    if (copyBtn) {
      e.preventDefault();
      copyOrduckCode(copyBtn.getAttribute("data-orduck-copy"));
      return;
    }
    const insertBtn = e.target.closest("[data-orduck-insert]");
    if (insertBtn) {
      e.preventDefault();
      insertOrduckCodeToEditor(insertBtn.getAttribute("data-orduck-insert"));
      return;
    }
    const speakBtn = e.target.closest("[data-orduck-speak]");
    if (speakBtn) {
      e.preventDefault();
      const msg = orduckChatHistory.find((m) => m.id === speakBtn.getAttribute("data-orduck-speak"));
      if (msg) speakOrduckText(msg.text);
    }
  });

  safeOn(el.orduckErrorToast, "click", (e) => {
    e.preventDefault();
    hideOrduckErrorToast();
    openDuckChat(false);
  });

  safeOn(el.orduckChatSend, "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleOrduckUserMessage();
  });

  safeOn(el.orduckChatInput, "keydown", (e) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    handleOrduckUserMessage();
  });

  detectWebGPU().then((ok) => {
    orduckAiState.webgpu = ok;
    updateOrduckAiStatusUI();
  }).catch(() => updateOrduckAiStatusUI());

  probeOllamaProvider().catch(() => updateOrduckAiStatusUI());

  document.addEventListener("click", (e) => {
    if (!duckChatOpen) return;
    if (e.target.closest("#orduckWidget")) return;
    closeDuckChat();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && duckChatOpen) closeDuckChat();
  });
}

function showOverlay(overlayEl) {
  if (!overlayEl) return;
  overlayEl.classList.remove("hidden");
  document.body.appendChild(overlayEl);
}

function getTopicFromStep(stepEl) {
  if (!stepEl?.dataset?.topicId) return null;
  const topicId = Number(stepEl.dataset.topicId);
  return topics.find((t) => t.id === topicId) || null;
}

function handleStaircaseClick(e) {
  if (e.target.closest(".cyber-check")) return;

  const step = e.target.closest(".step");
  if (!step) return;

  const openBtn = e.target.closest(".open-modal-btn");
  const titleEl = e.target.closest(".step-title");
  const platform = e.target.closest(".step-platform");
  if (!openBtn && !titleEl && !platform) return;
  if (platform && e.target.closest("button:not(.open-modal-btn)")) return;

  e.preventDefault();
  e.stopPropagation();
  const topic = getTopicFromStep(step);
  if (topic) openNotesModal(topic);
}

/* ── Time Engine ── */
function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

function formatShortClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatSpentLabel(seconds) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} Sa ${m} Dk`;
  if (m > 0) return `${m} Dk`;
  return `${seconds} Sn`;
}

function parseDurationToSeconds(text) {
  if (!text) return 0;
  let total = 0;
  const hours = text.match(/(\d+)\s*Saat/i);
  const mins = text.match(/(\d+)\s*Dk/i);
  if (hours) total += parseInt(hours[1], 10) * 3600;
  if (mins) total += parseInt(mins[1], 10) * 60;
  return total;
}

function getSession(topicId) {
  if (!timerSessions.has(topicId)) {
    const topic = topics.find((t) => t.id === topicId);
    timerSessions.set(topicId, {
      savedSpent: topic?.time_spent || 0,
      sessionSeconds: 0,
      running: false,
      tickStart: null,
    });
  }
  return timerSessions.get(topicId);
}

function getLiveSessionSeconds(session) {
  if (!session.running || session.tickStart === null) return session.sessionSeconds;
  return session.sessionSeconds + (Date.now() - session.tickStart) / 1000;
}

function getUnsavedSeconds(topicId) {
  return Math.floor(getLiveSessionSeconds(getSession(topicId)));
}

function getTotalSeconds(topicId) {
  const session = getSession(topicId);
  return session.savedSpent + getLiveSessionSeconds(session);
}

function getRunningTopicId() {
  for (const [id, session] of timerSessions) {
    if (session.running) return id;
  }
  return null;
}

function ensureGlobalTick() {
  if (globalTickId !== null) return;
  globalTickId = window.setInterval(() => {
    for (const [topicId, session] of timerSessions) {
      if (session.running) {
        if (activeTopicId === topicId) refreshTimerUI(topicId);
        updateHudActiveTimer();
        highlightActiveStep(topicId);
      }
    }
  }, 100);
}

function stopGlobalTickIfIdle() {
  const anyRunning = [...timerSessions.values()].some((s) => s.running);
  if (!anyRunning && globalTickId !== null) {
    clearInterval(globalTickId);
    globalTickId = null;
  }
}

function refreshTimerUI(topicId) {
  if (!el.notesModal || activeTopicId !== topicId || el.notesModal.classList.contains("hidden")) return;

  const session = getSession(topicId);
  const saved = session.savedSpent;
  const liveSession = getLiveSessionSeconds(session);
  const total = saved + liveSession;
  const unsaved = Math.floor(liveSession);
  const estimateSec = parseDurationToSeconds(activeTopicDuration);

  if (el.timerDisplay) {
    el.timerDisplay.textContent = formatClock(total);
    el.timerDisplay.classList.toggle("running", session.running);
  }
  if (el.timerRing) el.timerRing.classList.toggle("active", session.running);
  if (el.timerSaved) el.timerSaved.textContent = formatClock(saved);
  if (el.timerTotal) el.timerTotal.textContent = formatClock(total);
  if (el.timerSession) el.timerSession.textContent = formatClock(liveSession);
  if (el.timerEstimate) {
    el.timerEstimate.textContent = estimateSec > 0
      ? formatClock(estimateSec)
      : "00:00:00";
  }

  if (el.timerToggleIcon) el.timerToggleIcon.textContent = session.running ? "⏸" : "▶";
  if (el.timerToggleText) el.timerToggleText.textContent = session.running ? "Durdur" : "Başlat";
  if (el.timerToggle) el.timerToggle.classList.toggle("active", session.running);

  if (el.timerState) {
    el.timerState.textContent = session.running ? "ÇALIŞIYOR" : unsaved > 0 ? "DURAKLATILDI" : "BEKLEMEDE";
    el.timerState.className = `timer-state ${session.running ? "running" : unsaved > 0 ? "paused" : "idle"}`;
  }

  if (estimateSec > 0 && el.timerProgressFill && el.timerProgressLabel) {
    const pct = Math.min(100, Math.round((total / estimateSec) * 100));
    el.timerProgressFill.style.width = `${pct}%`;
    el.timerProgressLabel.textContent = `${pct}% — ${formatSpentLabel(Math.floor(total)) || "0 Sn"} harcandı`;
  } else if (el.timerProgressFill && el.timerProgressLabel) {
    el.timerProgressFill.style.width = "0%";
    el.timerProgressLabel.textContent = "Tahmini süre tanımlı değil";
  }

  if (unsaved > 0) {
    if (el.timerSavePill) {
      el.timerSavePill.textContent = `+${formatClock(unsaved)}`;
      el.timerSavePill.classList.remove("hidden");
    }
    if (el.timerSave) {
      el.timerSave.classList.add("has-unsaved");
      el.timerSave.disabled = false;
    }
  } else if (el.timerSave) {
    if (el.timerSavePill) el.timerSavePill.classList.add("hidden");
    el.timerSave.classList.remove("has-unsaved");
    el.timerSave.disabled = false;
  }
}

function updateHudActiveTimer() {
  if (!el.hudActiveTimer) return;
  const runningId = getRunningTopicId();
  if (!runningId) {
    el.hudActiveTimer.classList.add("hidden");
    document.querySelectorAll(".step-platform.timer-active").forEach((node) => {
      node.classList.remove("timer-active");
    });
    return;
  }

  const topic = topics.find((t) => t.id === runningId);
  const total = getTotalSeconds(runningId);
  el.hudActiveTimer.classList.remove("hidden");
  if (el.hudTimerLabel) {
    el.hudTimerLabel.textContent = topic
      ? `SAYAÇ: ${getShortTitle(topic.title).slice(0, 28)}…`
      : "SAYAÇ AKTİF";
  }
  if (el.hudTimerClock) el.hudTimerClock.textContent = formatClock(total);
  highlightActiveStep(runningId);
}

function highlightActiveStep(topicId) {
  document.querySelectorAll(".step-platform").forEach((node) => {
    node.classList.remove("timer-active");
  });
  const step = document.querySelector(`.step[data-topic-id="${topicId}"] .step-platform`);
  if (step) step.classList.add("timer-active");
}

function pauseSession(topicId) {
  const session = getSession(topicId);
  if (!session.running) return;
  session.sessionSeconds = getLiveSessionSeconds(session);
  session.running = false;
  session.tickStart = null;
  stopGlobalTickIfIdle();
}

function pauseAllExcept(topicId) {
  for (const [id, session] of timerSessions) {
    if (id !== topicId && session.running) pauseSession(id);
  }
}

function toggleTimer(e) {
  e.preventDefault();
  e.stopPropagation();
  if (!activeTopicId) return;

  const session = getSession(activeTopicId);

  if (session.running) {
    pauseSession(activeTopicId);
    if (el.timerStatus) {
      el.timerStatus.textContent = "Sayaç duraklatıldı. Kaydetmek için «Süreyi Kaydet».";
      el.timerStatus.className = "timer-status warning";
    }
  } else {
    pauseAllExcept(activeTopicId);
    session.running = true;
    session.tickStart = Date.now();
    ensureGlobalTick();
    if (el.timerStatus) {
      el.timerStatus.textContent = "Sayaç çalışıyor — saniyeler akıyor...";
      el.timerStatus.className = "timer-status success";
    }
  }

  refreshTimerUI(activeTopicId);
  updateHudActiveTimer();
}

async function saveTimer(e) {
  e.preventDefault();
  e.stopPropagation();
  if (!activeTopicId) return;

  const topicId = activeTopicId;
  const session = getSession(topicId);

  if (session.running) pauseSession(topicId);

  const unsaved = getUnsavedSeconds(topicId);
  if (unsaved <= 0) {
    if (el.timerStatus) {
      el.timerStatus.textContent = "Kaydedilecek yeni süre yok. Önce sayacı başlatın.";
      el.timerStatus.className = "timer-status warning";
    }
    refreshTimerUI(topicId);
    return;
  }

  if (el.timerSave) el.timerSave.disabled = true;
  if (el.timerStatus) {
    el.timerStatus.textContent = "KAYDEDİLİYOR...";
    el.timerStatus.className = "timer-status";
  }

  try {
    const result = await updateTime(topicId, unsaved, "add");
    const idx = topics.findIndex((t) => t.id === topicId);
    if (idx !== -1) topics[idx] = result;

    session.savedSpent = result.time_spent;
    session.sessionSeconds = 0;
    session.running = false;
    session.tickStart = null;

    if (el.timerState) {
      el.timerState.textContent = "KAYDEDİLDİ";
      el.timerState.className = "timer-state saved";
    }
    if (el.timerStatus) {
      el.timerStatus.textContent = `+${formatClock(unsaved)} kaydedildi${result.xp_gained ? ` — +${result.xp_gained} XP!` : ""} ✓`;
      el.timerStatus.className = "timer-status success";
    }

    if (result.stats) renderRpgHud(result.stats);
    if (result.xp_gained) showXpToast(result.xp_gained);

    const wasGoalComplete = getTodayMinutes() >= getDailyGoalMinutes();
    activityData = fetchActivity();
    renderCosmicMap(activityData);
    maybeCelebrateDailyGoal(wasGoalComplete);

    refreshTimerUI(topicId);
    renderStaircase();
    updateHudActiveTimer();
  } catch {
    if (el.timerStatus) {
      el.timerStatus.textContent = "Kayıt hatası! Tekrar dene.";
      el.timerStatus.className = "timer-status error";
    }
  } finally {
    if (el.timerSave) el.timerSave.disabled = false;
  }
}

function resetTimer(e) {
  e.preventDefault();
  e.stopPropagation();
  if (!activeTopicId) return;

  const topicId = activeTopicId;
  const session = getSession(topicId);
  const topic = topics.find((t) => t.id === topicId);
  const saved = session.savedSpent;
  const unsaved = getUnsavedSeconds(topicId);
  const hasSaved = saved > 0;
  const hasSession = unsaved > 0 || session.running;

  if (!hasSaved && !hasSession) {
    if (el.timerStatus) {
      el.timerStatus.textContent = "Sayaç zaten 00:00:00 — sıfırlanacak süre yok.";
      el.timerStatus.className = "timer-status";
    }
    return;
  }

  if (session.running) pauseSession(topicId);

  if (hasSaved) {
    const ok = window.confirm(
      "Bu modülün kayıtlı süresi de silinecek ve sayaç 00:00:00 olacak.\n\nDevam etmek istiyor musun?",
    );
    if (!ok) {
      refreshTimerUI(topicId);
      return;
    }

    try {
      const result = updateTime(topicId, 0, "set");
      const idx = topics.findIndex((t) => t.id === topicId);
      if (idx !== -1) topics[idx] = result;
      session.savedSpent = 0;
    } catch {
      if (el.timerStatus) {
        el.timerStatus.textContent = "Sıfırlama hatası! Tekrar dene.";
        el.timerStatus.className = "timer-status error";
      }
      return;
    }
  }

  session.sessionSeconds = 0;
  session.running = false;
  session.tickStart = null;

  if (el.timerState) {
    el.timerState.textContent = "SIFIRLANDI";
    el.timerState.className = "timer-state idle";
  }
  if (el.timerStatus) {
    el.timerStatus.textContent = hasSaved
      ? "Kayıtlı süre ve oturum sıfırlandı — 00:00:00"
      : "Bu oturum sıfırlandı — 00:00:00";
    el.timerStatus.className = "timer-status success";
  }

  refreshTimerUI(topicId);
  renderStaircase();
  renderDevPanel();
  updateHudActiveTimer();
  stopGlobalTickIfIdle();
}

function initTimerForTopic(topic) {
  activeTopicId = topic.id;
  activeTopicDuration = topic.duration || "";
  const session = getSession(topic.id);

  if (!session.running) {
    session.savedSpent = topic.time_spent || 0;
  }

  if (session.running) ensureGlobalTick();

  if (el.timerStatus) {
    el.timerStatus.textContent = session.running
      ? "Sayaç aktif — arka plandan devam ediyor."
      : "";
    el.timerStatus.className = session.running ? "timer-status success" : "timer-status";
  }

  refreshTimerUI(topic.id);
  updateHudActiveTimer();
}

/* ── Typewriter ── */
function runTypewriter() {
  if (!el.typewriter) return;
  const text = TYPEWRITER_LINES[typewriterLineIndex % TYPEWRITER_LINES.length];
  let i = 0;
  function tick() {
    if (i <= text.length) {
      el.typewriter.textContent = text.slice(0, i);
      i += 1;
      setTimeout(tick, 65);
    } else if (typewriterLineIndex === 0) {
      setTimeout(() => {
        typewriterLineIndex += 1;
        runTypewriter();
      }, 2200);
    }
  }
  tick();
}

function getOperatorName() {
  const fromInput = el.operatorName?.value?.trim();
  const fromStorage = localStorage.getItem(OPERATOR_KEY)?.trim() || "";
  const raw = fromInput || (fromStorage === "undefined" || fromStorage === "null" ? "" : fromStorage);
  return raw.slice(0, 24);
}

function saveOperatorName() {
  const name = getOperatorName();
  if (name) localStorage.setItem(OPERATOR_KEY, name);
}

function loadOperatorName() {
  let saved = localStorage.getItem(OPERATOR_KEY) || "";
  if (saved === "undefined" || saved === "null") saved = "";
  if (/^undefined/i.test(saved)) saved = saved.replace(/^undefined/i, "").trim();
  if (saved && el.operatorName) el.operatorName.value = saved;
  updateHudUsername(saved);
  updateTerminalOperator(saved);
}

function updateTerminalOperator(name) {
  const trimmed = name?.trim() || "";
  const display = trimmed
    ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
    : "—";
  if (el.terminalOperatorName) el.terminalOperatorName.textContent = display;
}

function setBootButtonState(state) {
  const btn = el.enterSystemBtn;
  const label = el.bootBtnLabel;
  if (!btn || !label) return;

  if (state === "connecting") {
    btn.disabled = true;
    btn.classList.add("is-connecting");
    label.textContent = "[ BAĞLANTI KURULUYOR... ]";
    return;
  }

  btn.disabled = false;
  btn.classList.remove("is-connecting");
  label.textContent = "[ SİSTEMİ BAŞLAT ]";
}

function clearLandingBootTimers() {
  if (landingBootTimeoutId !== null) {
    clearTimeout(landingBootTimeoutId);
    landingBootTimeoutId = null;
  }
  if (landingEnterTimeoutId !== null) {
    clearTimeout(landingEnterTimeoutId);
    landingEnterTimeoutId = null;
  }
}

function runLandingBootSequence(name) {
  enteringApp = true;
  setBootButtonState("connecting");

  if (el.landingBootStatus) el.landingBootStatus.textContent = "Bağlantı kuruluyor...";
  if (el.terminalStatus) {
    el.terminalStatus.textContent = "LINK";
    el.terminalStatus.classList.remove("ready");
  }
  if (el.operatorName) el.operatorName.disabled = true;

  LANDING_BOOT_LOGS.forEach((log) => {
    setTimeout(() => appendTermLine(log.text, log.cls), log.delay);
  });

  landingBootTimeoutId = setTimeout(() => {
    landingBootTimeoutId = null;
    finishLandingBootEnter(name);
  }, LANDING_BOOT_MS);
}

function finishLandingBootEnter(name) {
  saveOperatorName();
  updateHudUsername(name);

  if (landingClockId !== null) {
    clearInterval(landingClockId);
    landingClockId = null;
  }
  if (el.terminalStatus) {
    el.terminalStatus.textContent = "READY";
    el.terminalStatus.classList.add("ready");
  }
  if (el.landingBootStatus) {
    el.landingBootStatus.textContent = "Kimlik protokolü başlatılıyor...";
  }

  if (el.landing) {
    el.landing.classList.add("exit");
    el.landing.style.pointerEvents = "none";
  }

  landingEnterTimeoutId = setTimeout(() => {
    landingEnterTimeoutId = null;
    if (el.landing) el.landing.style.display = "none";
    showWelcomeTransition(name);
  }, 850);
}

function appendTermLine(text, cls = "") {
  if (!el.terminalOutput) return;
  const line = document.createElement("div");
  line.className = cls ? `term-line ${cls}` : "term-line";
  line.textContent = text;
  el.terminalOutput.appendChild(line);
  el.terminalOutput.scrollTop = el.terminalOutput.scrollHeight;
}

function stopTerminalMeter() {
  if (terminalMeterId !== null) {
    clearInterval(terminalMeterId);
    terminalMeterId = null;
  }
}

function startTerminalMeter() {
  stopTerminalMeter();
  if (!el.terminalMeterFill) return;

  let pct = 72;
  el.terminalMeterFill.style.width = `${pct}%`;

  terminalMeterId = setInterval(() => {
    pct = Math.min(98, Math.max(68, pct + (Math.random() > 0.5 ? 2 : -3)));
    if (el.terminalMeterFill) el.terminalMeterFill.style.width = `${pct}%`;
  }, 900);
}

function resetBootTerminal() {
  bootTimeoutIds.forEach(clearTimeout);
  bootTimeoutIds = [];
  stopTerminalMeter();

  if (el.terminalOutput) el.terminalOutput.innerHTML = "";
  if (el.terminalStatus) {
    el.terminalStatus.textContent = "BOOT";
    el.terminalStatus.classList.remove("ready");
  }
  if (el.terminalMeterFill) el.terminalMeterFill.style.width = "0%";
  if (el.landingBootStatus) el.landingBootStatus.textContent = "Boot sequence başlatılıyor...";
}

function runBootSequence() {
  if (!el.terminalOutput) return;
  resetBootTerminal();

  let delay = 0;
  BOOT_LINES.forEach((line, index) => {
    delay += index === 0 ? 220 : 160 + Math.floor(Math.random() * 100);
    const id = setTimeout(() => {
      appendTermLine(line.text, line.cls);

      if (index === BOOT_LINES.length - 1) {
        if (el.terminalStatus) {
          el.terminalStatus.textContent = "READY";
          el.terminalStatus.classList.add("ready");
        }
        if (el.landingBootStatus) {
          el.landingBootStatus.textContent = "Sistem hazır — Giriş bekleniyor";
        }
        startTerminalMeter();
      }
    }, delay);
    bootTimeoutIds.push(id);
  });
}

function updateHudUsername(name) {
  const display = name?.trim() || "—";
  if (el.hudUsername) el.hudUsername.textContent = display;
  if (el.hudUserChip) {
    el.hudUserChip.classList.toggle("hidden", !name?.trim());
  }
  if (el.devAvatarName) {
    el.devAvatarName.textContent = name?.trim()
      ? name.trim().charAt(0).toUpperCase() + name.trim().slice(1)
      : "Yazılımcı";
  }
}

function validateOperatorName() {
  const name = getOperatorName();
  const valid = name.length >= 2;
  if (el.operatorError) el.operatorError.classList.toggle("hidden", valid);
  if (el.operatorName) el.operatorName.classList.toggle("error", !valid);
  return valid;
}

function closeAllModals() {
  el.notesModal?.classList.add("hidden");
  el.shortcutsModal?.classList.add("hidden");
  el.celebrationOverlay?.classList.add("hidden");
  closeFocusMode();
  activeTopicId = null;
}

function renderShortcutKey(key) {
  const kbd = document.createElement("kbd");
  kbd.textContent = key;
  return kbd;
}

function renderShortcutsModal() {
  if (!el.shortcutsBody) return;
  el.shortcutsBody.innerHTML = "";

  KEYBOARD_SHORTCUTS.forEach((group) => {
    const section = document.createElement("section");
    section.className = "shortcuts-group";

    const title = document.createElement("h3");
    title.className = "shortcuts-group-title";
    title.textContent = group.title;
    section.appendChild(title);

    const list = document.createElement("ul");
    list.className = "shortcuts-list";

    group.items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "shortcuts-item";

      const keysWrap = document.createElement("div");
      keysWrap.className = "shortcuts-keys";
      item.keys.forEach((key, index) => {
        keysWrap.appendChild(renderShortcutKey(key));
        if (index < item.keys.length - 1) {
          const plus = document.createElement("span");
          plus.className = "shortcuts-plus";
          plus.textContent = "+";
          plus.style.color = "var(--text-dim)";
          plus.style.fontSize = "0.7rem";
          keysWrap.appendChild(plus);
        }
      });

      const desc = document.createElement("span");
      desc.className = "shortcuts-desc";
      desc.textContent = item.desc;

      li.appendChild(keysWrap);
      li.appendChild(desc);
      list.appendChild(li);
    });

    section.appendChild(list);
    el.shortcutsBody.appendChild(section);
  });
}

function openShortcutsModal() {
  if (!el.shortcutsModal) return;
  renderShortcutsModal();
  showOverlay(el.shortcutsModal);
}

function closeShortcutsModal() {
  el.shortcutsModal?.classList.add("hidden");
}

function isTypingInField() {
  const tag = document.activeElement?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA";
}

function showLandingView() {
  closeAllModals();
  enteringApp = false;

  if (welcomeTimeoutId !== null) {
    clearTimeout(welcomeTimeoutId);
    welcomeTimeoutId = null;
  }
  cancelWelcomeProgress();

  if (el.welcomeOverlay) {
    el.welcomeOverlay.classList.add("hidden");
    el.welcomeOverlay.classList.remove(
      "show-progress",
      "spectacle-active",
      "from-boot",
      "welcome-burst-active",
      "welcome-exiting",
    );
  }
  if (el.welcomeProgressFill) el.welcomeProgressFill.style.width = "0%";
  resetWelcomeAnimation();

  if (el.landing) {
    el.landing.classList.remove("exit");
    el.landing.style.display = "";
    el.landing.style.pointerEvents = "";
  }
  if (el.app) {
    el.app.classList.remove("visible");
    el.app.classList.add("hidden");
  }
  setBootButtonState("idle");
  if (el.operatorName) el.operatorName.disabled = false;
  clearLandingBootTimers();

  if (welcomeTimeoutId !== null) {
    clearTimeout(welcomeTimeoutId);
    welcomeTimeoutId = null;
  }
  cancelWelcomeProgress();

  startLandingClock();
  runBootSequence();
  setTimeout(() => el.operatorName?.focus(), 200);
}

function goBackToLanding() {
  showLandingView();
  if (window.location.hash === "#app") {
    history.replaceState({ view: "landing" }, "", window.location.pathname + window.location.search);
  }
}

function showAppView(updateHistory = true) {
  if (el.landing) {
    el.landing.classList.add("exit");
    el.landing.style.pointerEvents = "none";
    el.landing.style.display = "none";
  }
  if (el.app) {
    el.app.classList.remove("hidden");
    requestAnimationFrame(() => el.app.classList.add("visible"));
  }

  if (updateHistory && window.location.hash !== "#app") {
    history.pushState({ view: "app" }, "", "#app");
  }
}

function requestEnterApp() {
  if (enteringApp) return;
  if (!validateOperatorName()) {
    el.operatorName?.focus();
    return;
  }

  runLandingBootSequence(getOperatorName());
}

const DECRYPT_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#%&*";

const WELCOME_BOOT_LINES = [
  { text: "▸ KERNEL bütünlük taraması...", cls: "" },
  { text: "▸ Derin bellek katmanına erişim...", cls: "" },
  { text: "▸ UYARI: Yetkisiz oturum algılandı", cls: "warn" },
  { text: "▸ Operatör imzası eşleştiriliyor...", cls: "" },
  { text: "▸ Kimlik matrisi çözülüyor ████░░", cls: "" },
  { text: "▸ NEURAL LINK kuruldu [OK]", cls: "ok" },
  { text: "▸ PYTHON_YOL ana çekirdeğe bağlanılıyor...", cls: "" },
];

const WELCOME_STATUS_PHASES = [
  { at: 0, label: "SİSTEM SENKRONİZASYONU", sub: "Kimlik çözülüyor...", pct: 12 },
  { at: 18, label: "OPERATÖR DOĞRULAMA", sub: "Biyometrik imza taranıyor...", pct: 34 },
  { at: 36, label: "NEURAL LINK AKTİF", sub: "Bellek katmanları açılıyor...", pct: 58 },
  { at: 52, label: "KİMLİK KİLİTLENDİ", sub: "Hoş geldin, operatör.", pct: 88 },
  { at: 68, label: "AKADEMİ YÜKLENİYOR", sub: "Python merdiveni senkronize ediliyor...", pct: 100 },
];

function resetWelcomeSpectacle() {
  cancelWelcomeProgress();
  if (el.welcomeOverlay) {
    el.welcomeOverlay.classList.remove(
      "spectacle-active",
      "spectacle-shake",
      "show-progress",
      "from-boot",
      "welcome-burst-active",
      "welcome-exiting",
    );
  }
  if (el.welcomeParticles) el.welcomeParticles.innerHTML = "";
  if (el.welcomeBootFeed) el.welcomeBootFeed.innerHTML = "";
  if (el.welcomeStatusPct) el.welcomeStatusPct.textContent = "0%";
  if (el.welcomeProgressFill) el.welcomeProgressFill.style.width = "0%";
  if (el.welcomeSub) el.welcomeSub.textContent = "Kimlik çözülüyor...";
  if (el.welcomeWarning) el.welcomeWarning.textContent = "⚠ Derin sistem katmanlarına bağlanılıyor...";
}

function cancelWelcomeProgress() {
  if (welcomeProgressRaf !== null) {
    cancelAnimationFrame(welcomeProgressRaf);
    welcomeProgressRaf = null;
  }
}

function updateWelcomeProgressUI(pct) {
  let phase = WELCOME_STATUS_PHASES[0];
  for (const p of WELCOME_STATUS_PHASES) {
    if (pct >= p.pct) phase = p;
  }
  if (el.welcomeStatusLabel) el.welcomeStatusLabel.textContent = phase.label;
  if (el.welcomeSub) el.welcomeSub.textContent = phase.sub;
  if (el.welcomeStatusPct) el.welcomeStatusPct.textContent = `${pct}%`;
  if (el.welcomeProgressFill) el.welcomeProgressFill.style.width = `${pct}%`;
}

function animateWelcomeProgress(onComplete) {
  cancelWelcomeProgress();
  const start = performance.now();

  const tick = (now) => {
    const raw = Math.min(1, (now - start) / WELCOME_PROGRESS_MS);
    const eased = 1 - Math.pow(1 - raw, 2.4);
    const pct = Math.round(eased * 100);
    updateWelcomeProgressUI(pct);

    if (raw < 1) {
      welcomeProgressRaf = requestAnimationFrame(tick);
    } else {
      welcomeProgressRaf = null;
      triggerWelcomeBurst(onComplete);
    }
  };

  welcomeProgressRaf = requestAnimationFrame(tick);
}

function triggerWelcomeBurst(onComplete) {
  welcomeTimeoutId = setTimeout(() => {
    welcomeTimeoutId = null;
    if (el.welcomeOverlay) {
      el.welcomeOverlay.classList.add("welcome-burst-active");
    }
    if (el.welcomeFlash) {
      el.welcomeFlash.style.animation = "none";
      void el.welcomeFlash.offsetWidth;
      el.welcomeFlash.style.animation = "";
    }
    if (el.welcomeSub) el.welcomeSub.textContent = "Erişim tamamlandı — Akademi açılıyor...";
    if (el.welcomeWarning) el.welcomeWarning.textContent = "⚡ Sistem hazır — geçiş başlatılıyor";

    welcomeTimeoutId = setTimeout(() => {
      welcomeTimeoutId = null;
      el.welcomeOverlay?.classList.add("welcome-exiting");
      welcomeTimeoutId = setTimeout(() => {
        welcomeTimeoutId = null;
        onComplete();
      }, WELCOME_FADE_MS);
    }, WELCOME_BURST_MS);
  }, WELCOME_HOLD_MS);
}

function spawnWelcomeParticles() {
  if (!el.welcomeParticles) return;
  el.welcomeParticles.innerHTML = "";
  const count = 55;
  for (let i = 0; i < count; i += 1) {
    const p = document.createElement("span");
    const variant = i % 5 === 0 ? "red" : i % 3 === 0 ? "purple" : "";
    p.className = `welcome-particle${variant ? ` ${variant}` : ""}`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${40 + Math.random() * 40}%`;
    p.style.setProperty("--dx", `${(Math.random() - 0.5) * 180}px`);
    p.style.setProperty("--dy", `${-80 - Math.random() * 200}px`);
    p.style.animationDelay = `${Math.random() * 1.2}s`;
    p.style.animationDuration = `${1.8 + Math.random() * 1.5}s`;
    el.welcomeParticles.appendChild(p);
  }
}

function runWelcomeBootFeed() {
  if (!el.welcomeBootFeed) return;
  el.welcomeBootFeed.innerHTML = "";
  WELCOME_BOOT_LINES.forEach((line, index) => {
    setTimeout(() => {
      const div = document.createElement("div");
      div.className = `welcome-boot-line${line.cls ? ` ${line.cls}` : ""}`;
      div.textContent = line.text;
      el.welcomeBootFeed?.appendChild(div);
      while (el.welcomeBootFeed && el.welcomeBootFeed.children.length > 6) {
        el.welcomeBootFeed.firstChild?.remove();
      }
    }, 180 + index * 320);
  });
}

function triggerWelcomeShake() {
  if (!el.welcomeOverlay) return;
  el.welcomeOverlay.classList.remove("spectacle-shake");
  void el.welcomeOverlay.offsetWidth;
  el.welcomeOverlay.classList.add("spectacle-shake");
  spawnWelcomeParticles();
  if (el.welcomeWarning) {
    el.welcomeWarning.textContent = "✓ Operatör doğrulandı — Erişim izni verildi";
  }
  if (el.welcomeKicker) {
    el.welcomeKicker.textContent = "// KİMLİK KİLİTLENDİ — OTURUM AKTİF";
  }
}

function resetWelcomeTextAnimation() {
  if (welcomeRevealId !== null) {
    cancelAnimationFrame(welcomeRevealId);
    welcomeRevealId = null;
  }
  if (el.welcomePrefix) el.welcomePrefix.textContent = "";
  if (el.welcomeName) {
    el.welcomeName.textContent = "";
    el.welcomeName.classList.remove("revealed", "glitch-active", "glitch-settled");
    el.welcomeName.removeAttribute("data-text");
  }
  if (el.welcomeCursor) el.welcomeCursor.classList.remove("hidden");
}

function resetWelcomeAnimation() {
  resetWelcomeTextAnimation();
  resetWelcomeSpectacle();
}

function runWelcomeReveal(name) {
  resetWelcomeTextAnimation();
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  const greeting = getTimeGreetingParts(name);
  const prefix = greeting.prefix;
  const nameWithEmoji = `${displayName}${greeting.suffix}`;
  let frame = 0;
  const maxFrames = 72;
  let shakeTriggered = false;

  const tick = () => {
    frame += 1;

    const prefixLen = Math.min(prefix.length, Math.floor(frame / 2));
    if (el.welcomePrefix) el.welcomePrefix.textContent = prefix.slice(0, prefixLen);

    if (el.welcomeName && prefixLen >= prefix.length) {
      const scrambleFrame = frame - prefix.length * 2;
      if (scrambleFrame < 28) {
        const scrambled = nameWithEmoji.split("").map((ch, i) => {
          if (ch === " ") return " ";
          const threshold = (i + 1) / nameWithEmoji.length;
          const progress = scrambleFrame / 28;
          return progress > threshold ? ch : DECRYPT_POOL[Math.floor(Math.random() * DECRYPT_POOL.length)];
        }).join("");
        el.welcomeName.textContent = scrambled;
        el.welcomeName.setAttribute("data-text", scrambled);
        el.welcomeName.classList.add("glitch-active");
        el.welcomeName.classList.remove("revealed", "glitch-settled");
      } else {
        el.welcomeName.textContent = nameWithEmoji;
        el.welcomeName.setAttribute("data-text", nameWithEmoji);
        el.welcomeName.classList.remove("glitch-active");
        if (!el.welcomeName.classList.contains("revealed")) {
          el.welcomeName.classList.add("revealed", "glitch-settled");
          if (!shakeTriggered) {
            shakeTriggered = true;
            triggerWelcomeShake();
          }
        }
        if (el.welcomeCursor) el.welcomeCursor.classList.add("hidden");
      }
    }

    if (frame < maxFrames) {
      welcomeRevealId = requestAnimationFrame(tick);
    } else {
      welcomeRevealId = null;
      if (el.welcomeName) {
        el.welcomeName.textContent = nameWithEmoji;
        el.welcomeName.setAttribute("data-text", nameWithEmoji);
        el.welcomeName.classList.remove("glitch-active");
        el.welcomeName.classList.add("revealed", "glitch-settled");
      }
      if (el.welcomeCursor) el.welcomeCursor.classList.add("hidden");
    }
  };

  welcomeRevealId = requestAnimationFrame(tick);
}

function initParticlesBackground(theme = getStoredTheme()) {
  if (typeof particlesJS === "undefined") return;

  const isLight = theme === "light";
  particlesJS("particles-js", {
    particles: {
      number: { value: 58, density: { enable: true, value_area: 950 } },
      color: {
        value: isLight
          ? ["#306998", "#4a8bc2", "#7eb5ff", "#6366f1"]
          : ["#306998", "#4a6fa5", "#8899aa", "#6366f1"],
      },
      shape: { type: "circle" },
      opacity: { value: isLight ? 0.2 : 0.12, random: true, anim: { enable: true, speed: 0.4, opacity_min: isLight ? 0.08 : 0.04 } },
      size: { value: 2, random: true },
      line_linked: {
        enable: true,
        distance: 130,
        color: "#306998",
        opacity: isLight ? 0.14 : 0.07,
        width: 1,
      },
      move: {
        enable: true,
        speed: 0.55,
        direction: "none",
        random: true,
        straight: false,
        out_mode: "out",
      },
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: false },
        onclick: { enable: false },
        resize: true,
      },
    },
    retina_detect: true,
  });
}

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch { /* ignore */ }
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function updateThemeToggleUI(theme) {
  const isLight = theme === "light";
  document.querySelectorAll("[data-theme-switch]").forEach((btn) => {
    btn.setAttribute("aria-checked", String(isLight));
    btn.setAttribute("aria-label", isLight ? "Koyu moda geç" : "Açık moda geç");
    btn.title = isLight ? "Koyu Mod" : "Açık Mod";
  });
}

function refreshParticlesForTheme(theme) {
  const container = document.getElementById("particles-js");
  if (!container) return;
  container.innerHTML = "";
  initParticlesBackground(theme);
}

function applyTheme(theme, { persist = true, refreshParticles = true } = {}) {
  const nextTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme === "light" ? "light" : "";
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch { /* ignore */ }
  }
  updateThemeToggleUI(nextTheme);
  if (refreshParticles) refreshParticlesForTheme(nextTheme);
}

function toggleTheme() {
  applyTheme(getStoredTheme() === "light" ? "dark" : "light");
}

function initTheme() {
  applyTheme(getStoredTheme(), { persist: false, refreshParticles: false });
}

function getStepTiltBase(stepEl) {
  return stepEl?.classList.contains("completed")
    ? { x: 4, y: -1 }
    : { x: 6, y: -2 };
}

function initStepTiltEffects() {
  if (!el.staircase || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  el.staircase.querySelectorAll(".step-platform").forEach((platform) => {
    if (platform.dataset.tiltBound === "1") return;
    platform.dataset.tiltBound = "1";

    const stepEl = platform.closest(".step");
    const glare = document.createElement("div");
    glare.className = "step-tilt-glare";
    platform.appendChild(glare);

    platform.addEventListener("mouseenter", () => {
      platform.classList.add("is-tilting");
    });

    platform.addEventListener("mousemove", (e) => {
      const rect = platform.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const tiltY = x * 14;
      const tiltX = -y * 11;
      const base = getStepTiltBase(stepEl);
      platform.style.transform = `perspective(900px) rotateX(${base.x + tiltX}deg) rotateY(${base.y + tiltY}deg) translateY(-5px) scale(1.01)`;
      glare.style.opacity = "1";
      glare.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.22), rgba(0,240,255,0.06) 40%, transparent 62%)`;
    });

    platform.addEventListener("mouseleave", () => {
      platform.classList.remove("is-tilting");
      platform.style.transform = "";
      glare.style.opacity = "0";
    });
  });
}

function showWelcomeTransition(name) {
  enteringApp = true;
  resetWelcomeSpectacle();
  resetWelcomeTextAnimation();

  const displayName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
  if (el.welcomeAlert) {
    el.welcomeAlert.textContent = "▌ ERİŞİM ONAYLANDI — KİMLİK PROTOKOLÜ";
  }
  if (el.welcomeKicker) {
    el.welcomeKicker.textContent = `// OPERATÖR: ${displayName.toUpperCase()} — DECRYPT BAŞLATILDI`;
  }
  if (el.welcomeSub) el.welcomeSub.textContent = "Kimlik çözülüyor...";
  updateWelcomeProgressUI(0);

  if (el.welcomeOverlay) {
    el.welcomeOverlay.classList.remove("hidden");
    el.welcomeOverlay.classList.add("spectacle-active", "from-boot", "show-progress");
    spawnWelcomeParticles();
    runWelcomeBootFeed();
    requestAnimationFrame(() => {
      runWelcomeReveal(name);
      animateWelcomeProgress(() => finishEnterApp(name));
    });
  }

  if (landingClockId !== null) {
    clearInterval(landingClockId);
    landingClockId = null;
  }
}

function finishEnterApp(name) {
  if (welcomeTimeoutId !== null) {
    clearTimeout(welcomeTimeoutId);
    welcomeTimeoutId = null;
  }
  cancelWelcomeProgress();
  resetWelcomeAnimation();

  if (el.welcomeOverlay) {
    el.welcomeOverlay.classList.add("hidden");
    el.welcomeOverlay.classList.remove(
      "show-progress",
      "spectacle-active",
      "from-boot",
      "welcome-burst-active",
      "welcome-exiting",
    );
  }
  if (el.welcomeProgressFill) el.welcomeProgressFill.style.width = "0%";

  updateHudUsername(name);
  showAppView(true);

  if (!appInitialized) {
    appInitialized = true;
    loadTopics();
  }

  if (el.operatorName) el.operatorName.disabled = false;
  enteringApp = false;
  setBootButtonState("idle");
  maybeDuckWelcome();
}

function handlePopState(event) {
  const view = event.state?.view;
  if (view === "app" || window.location.hash === "#app") {
    if (tryRestoreAppSession()) return;
    if (appInitialized) {
      updateHudUsername(getOperatorName());
      showAppView(false);
    } else {
      showLandingView();
      history.replaceState({ view: "landing" }, "", window.location.pathname + window.location.search);
    }
    return;
  }
  showLandingView();
}

function tryRestoreAppSession() {
  if (window.location.hash !== "#app") return false;

  const saved = localStorage.getItem(OPERATOR_KEY)?.trim() || "";
  if (saved.length < 2) return false;

  if (el.operatorName) el.operatorName.value = saved;
  updateHudUsername(saved);
  updateTerminalOperator(saved);

  enteringApp = false;
  setBootButtonState("idle");
  if (el.operatorName) el.operatorName.disabled = false;
  if (el.landing) {
    el.landing.classList.add("exit");
    el.landing.style.pointerEvents = "none";
    el.landing.style.display = "none";
  }
  if (el.welcomeOverlay) el.welcomeOverlay.classList.add("hidden");

  showAppView(false);
  if (!appInitialized) {
    appInitialized = true;
    loadTopics();
  }
  maybeDuckWelcome();
  return true;
}

function initHistory() {
  const baseUrl = window.location.pathname + window.location.search;

  if (tryRestoreAppSession()) {
    history.replaceState({ view: "app" }, "", "#app");
  } else if (window.location.hash === "#app") {
    history.replaceState({ view: "landing" }, "", baseUrl);
  } else {
    history.replaceState({ view: "landing" }, "", baseUrl);
  }

  window.addEventListener("popstate", handlePopState);
}

function updateLandingClock() {
  if (!el.landingClock) return;
  const now = new Date();
  el.landingClock.textContent = now.toLocaleTimeString("tr-TR", { hour12: false });
}

function startLandingClock() {
  updateLandingClock();
  if (landingClockId !== null) clearInterval(landingClockId);
  landingClockId = setInterval(updateLandingClock, 1000);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initLanding() {
  loadOperatorName();
  initHistory();

  if (appInitialized) return;

  startLandingClock();
  runTypewriter();
  runBootSequence();
  setTimeout(() => el.operatorName?.focus(), 800);
}

/* ── Progress HUD ── */
function updateProgress() {
  if (!el.progressFill || !el.progressPercent || !el.progressMeta) return;

  const total = topics.length;
  const done = topics.filter((t) => t.is_completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  el.progressFill.style.width = `${pct}%`;
  el.progressPercent.textContent = `${pct}%`;
  el.progressMeta.textContent = `${done} / ${total}`;

  const complete = total > 0 && pct === 100;
  el.progressFill.classList.toggle("complete", complete);
  el.progressPercent.classList.toggle("complete", complete);

  if (complete && !celebrationShown && el.celebrationOverlay) {
    celebrationShown = true;
    el.celebrationOverlay.classList.remove("hidden");
  }
  if (!complete) celebrationShown = false;
}

/* ── Staircase Render ── */
function getBolum(title) {
  const m = title.match(/^Bölüm (\d+):/);
  return m ? `BÖLÜM ${m[1]}` : "BÖLÜM";
}

function getShortTitle(title) {
  return title.replace(/^Bölüm \d+:\s*/, "");
}

function createBadgeRow(topic) {
  const row = document.createElement("div");
  row.className = "badge-row";

  const spentLabel = formatSpentLabel(topic.time_spent);
  const spentBadge = document.createElement("span");
  spentBadge.className = `spent-badge${spentLabel ? " has-progress" : ""}`;
  spentBadge.title = "Kayıtlı çalışma süresi";
  spentBadge.innerHTML = `<span class="badge-icon">🟢</span><span>${formatClock(topic.time_spent || 0)}</span>`;
  row.appendChild(spentBadge);

  if (isBossModule(topic.id)) {
    const bossBadge = document.createElement("span");
    bossBadge.className = `boss-badge${isBossDefeated(topic.id) ? " defeated" : ""}`;
    bossBadge.title = isBossDefeated(topic.id) ? "Patron yenildi" : "Boss Fight mevcut";
    bossBadge.innerHTML = `<span>${isBossDefeated(topic.id) ? "👾 Yenildi" : "👾 Boss"}</span>`;
    row.appendChild(bossBadge);
  }

  return row;
}

let modalIsMaximized = false;

function setModalFullscreen(enabled) {
  modalIsMaximized = Boolean(enabled);
  const panel = el.notesModalPanel || document.getElementById("notesModalPanel");
  if (panel) panel.classList.toggle("is-maximized", modalIsMaximized);

  if (el.modalMaximize) {
    el.modalMaximize.setAttribute("aria-pressed", modalIsMaximized ? "true" : "false");
    el.modalMaximize.setAttribute("aria-label", modalIsMaximized ? "Küçült" : "Tam ekran");
    el.modalMaximize.title = modalIsMaximized ? "Küçült" : "Tam ekran";
    el.modalMaximize.querySelector(".icon-expand")?.classList.toggle("hidden", modalIsMaximized);
    el.modalMaximize.querySelector(".icon-restore")?.classList.toggle("hidden", !modalIsMaximized);
  }
}

function toggleModalFullscreen() {
  setModalFullscreen(!modalIsMaximized);
}

function resetModalFullscreen() {
  setModalFullscreen(false);
}

const STAIR_BASE_OFFSET = 48;
const STAIR_ZIGZAG = 72;
const STAIR_PROGRESS_STEP = 34;
const STAIR_PROGRESS_CAP = 300;
const STAIR_PROGRESS_MULT = 0.75;
const STAIR_MAX_MARGIN = 210;
const STAIR_STEP_WIDTH = 350;

function getStepMarginLeft(index) {
  const zigzag = index % 2 === 0 ? 0 : STAIR_ZIGZAG;
  const progress = Math.min(index * STAIR_PROGRESS_STEP, STAIR_PROGRESS_CAP);
  const raw = STAIR_BASE_OFFSET + zigzag + progress * STAIR_PROGRESS_MULT;
  let maxMargin = STAIR_MAX_MARGIN;

  if (el.staircase && el.devPanel && window.innerWidth >= 1101) {
    const wrapper = el.staircase.closest(".staircase-wrapper");
    const wrapperW = wrapper?.clientWidth || el.staircase.clientWidth;
    const stairW = Math.min(760, wrapperW);
    const reserve = el.devPanel.offsetWidth + 48;
    const maxFromLayout = Math.max(0, stairW - STAIR_STEP_WIDTH - reserve);
    maxMargin = Math.min(STAIR_MAX_MARGIN, maxFromLayout);
  }

  return Math.min(raw, maxMargin);
}

function createStep(topic, index) {
  const step = document.createElement("article");
  step.className = "step";
  step.dataset.topicId = String(topic.id);
  if (topic.is_completed) step.classList.add("completed");
  step.style.animationDelay = `${index * 0.04}s`;

  const offsetX = getStepMarginLeft(index);
  step.style.marginLeft = `${offsetX}px`;
  step.style.zIndex = String(Math.min(index + 1, 10));
  step.style.transform = `translateZ(${Math.min(index * 2, 24)}px)`;

  const platform = document.createElement("div");
  platform.className = "step-platform";
  platform.appendChild(createBadgeRow(topic));

  const inner = document.createElement("div");
  inner.className = "step-inner";

  const checkLabel = document.createElement("label");
  checkLabel.className = "cyber-check";
  checkLabel.style.pointerEvents = "auto";

  const checkInput = document.createElement("input");
  checkInput.type = "checkbox";
  checkInput.checked = topic.is_completed;
  checkInput.setAttribute("aria-label", `${getShortTitle(topic.title)} tamamlandı`);
  checkInput.addEventListener("change", async (e) => {
    e.stopPropagation();
    try {
      const updated = await updateCompletion(topic.id, checkInput.checked);
      const idx = topics.findIndex((t) => t.id === topic.id);
      if (idx !== -1) topics[idx] = updated;
      if (updated.stats) renderRpgHud(updated.stats);
      if (checkInput.checked) {
        setFocusedTopic(topic.id);
        showCompletionToast(topic, updated.xp_gained ?? 0);
      }
      renderStaircase();
    } catch {
      checkInput.checked = !checkInput.checked;
    }
  });

  const checkBox = document.createElement("span");
  checkBox.className = "cyber-check-box";
  checkBox.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  checkLabel.appendChild(checkInput);
  checkLabel.appendChild(checkBox);

  const number = document.createElement("span");
  number.className = "step-number";
  number.textContent = getBolum(topic.title);

  const titleEl = document.createElement("span");
  titleEl.className = "step-title";
  titleEl.textContent = getShortTitle(topic.title);
  titleEl.setAttribute("role", "button");
  titleEl.setAttribute("tabindex", "0");
  titleEl.setAttribute("aria-label", `${getShortTitle(topic.title)} akademi modülünü aç`);

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "open-modal-btn";
  openBtn.textContent = "📖 Akademi";
  openBtn.setAttribute("aria-label", `${getShortTitle(topic.title)} akademi modülünü aç`);

  inner.appendChild(checkLabel);
  inner.appendChild(number);
  inner.appendChild(titleEl);
  inner.appendChild(openBtn);

  platform.appendChild(inner);
  step.appendChild(platform);

  return step;
}

function drawPath() {
  if (!el.staircase || !el.staircasePath) return;
  const steps = el.staircase.querySelectorAll(".step");
  if (steps.length < 2) {
    el.staircasePath.innerHTML = "";
    return;
  }

  const wrapperRect = el.staircase.getBoundingClientRect();
  const points = [];

  steps.forEach((step) => {
    const rect = step.getBoundingClientRect();
    points.push({
      x: rect.left - wrapperRect.left + rect.width * 0.15,
      y: rect.top - wrapperRect.top + rect.height * 0.5,
    });
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  el.staircasePath.setAttribute("viewBox", `0 0 ${wrapperRect.width} ${wrapperRect.height}`);
  el.staircasePath.innerHTML = `
    <defs>
      <linearGradient id="pathGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#306998" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#FFE873" stop-opacity="0.6"/>
      </linearGradient>
    </defs>
    <path d="${pathD}" fill="none" stroke="url(#pathGrad)" stroke-width="1.5"
          stroke-dasharray="6 4" opacity="0.5"/>
  `;
}

function renderStaircase() {
  if (!el.staircase) return;
  el.staircase.innerHTML = "";
  topics.forEach((topic, i) => {
    el.staircase.appendChild(createStep(topic, i));
  });
  updateProgress();
  renderDevPanel();
  requestAnimationFrame(() => {
    drawPath();
    initStepTiltEffects();
  });
}

/* ── Notes Modal ── */
function openNotesModal(topic) {
  if (!el.notesModal) return;

  closeFocusMode();
  setFocusedTopic(topic.id);

  if (el.modalTag) el.modalTag.textContent = getBolum(topic.title);
  if (el.modalTitle) el.modalTitle.textContent = getShortTitle(topic.title);
  if (el.modalNotes) el.modalNotes.value = topic.notes || "";
  if (el.modalStatus) {
    el.modalStatus.textContent = "";
    el.modalStatus.className = "modal-status";
  }
  if (el.codeOutput) {
    el.codeOutput.innerHTML = '<p class="output-line dim">// Çıktı burada görünecek...</p>';
  }

  renderAcademyTabs(topic.id);
  closeFocusMode();
  renderMarkdownPreview();
  initTimerForTopic(topic);
  showOverlay(el.notesModal);
  setTimeout(() => {
    const lessonEl = document.getElementById("lessonContent");
    if (lessonEl) lessonEl.scrollTop = 0;
  }, 150);
}

function tryCloseNotesModal() {
  if (!el.notesModal) return;

  if (activeFocusPanel) {
    closeFocusMode();
    return;
  }

  if (!activeTopicId) {
    el.notesModal.classList.add("hidden");
    return;
  }

  const topicId = activeTopicId;
  const session = getSession(topicId);
  const unsaved = getUnsavedSeconds(topicId);

  if (unsaved > 0 || session.running) {
    const msg = session.running
      ? "Kaydedilmemiş süre var. Modal kapanacak ama sayaç arka planda çalışmaya devam edecek. Devam?"
      : "Kaydedilmemiş süre henüz kaydedilmedi. Yine de kapatmak istiyor musunuz?";
    if (!confirm(msg)) return;
  }

  if (session.running) {
    session.sessionSeconds = getLiveSessionSeconds(session);
    session.tickStart = Date.now();
    ensureGlobalTick();
  }

  el.notesModal.classList.add("hidden");
  closeFocusMode();
  activeTopicId = null;
  if (noteTimer) clearTimeout(noteTimer);
  updateHudActiveTimer();
}

function closeNotesModal() {
  tryCloseNotesModal();
}

async function handleRunCode(e) {
  e.preventDefault();
  e.stopPropagation();
  if (!el.codeEditor || !el.runCodeBtn || !el.codeOutput) return;

  const code = el.codeEditor.value.trim();
  if (!code) return;

  el.runCodeBtn.disabled = true;
  el.runCodeBtn.textContent = "⏳ ÇALIŞIYOR...";
  el.codeOutput.innerHTML = '<p class="output-line dim">// Kod ateşleniyor...</p>';

  try {
    const result = await runCode(code);
    renderCodeOutput(result);
  } catch (err) {
    el.codeOutput.innerHTML = `<p class="output-line err">${escapeHtml(err.message)}</p>`;
    triggerDuckError(err.message || "");
  } finally {
    el.runCodeBtn.disabled = false;
    el.runCodeBtn.textContent = "▶️ KODU ATEŞLE";
  }
}

function handleNotesInput() {
  renderMarkdownPreview();
  if (!activeTopicId || !el.modalStatus) return;

  el.modalStatus.textContent = "KAYDEDİLİYOR...";
  el.modalStatus.className = "modal-status saving";

  if (noteTimer) clearTimeout(noteTimer);
  noteTimer = setTimeout(async () => {
    try {
      const updated = await updateNotes(activeTopicId, el.modalNotes.value);
      const idx = topics.findIndex((t) => t.id === activeTopicId);
      if (idx !== -1) topics[idx] = updated;
      el.modalStatus.textContent = "KAYDEDİLDİ ✓";
      el.modalStatus.className = "modal-status saved";
      setTimeout(() => {
        if (el.modalStatus?.classList.contains("saved")) {
          el.modalStatus.textContent = "";
          el.modalStatus.className = "modal-status";
        }
      }, 2000);
    } catch {
      el.modalStatus.textContent = "HATA!";
      el.modalStatus.className = "modal-status error";
    }
  }, 600);
}

/* ── Init ── */
async function loadTopics() {
  try {
    topics = fetchTopics();
    activityData = fetchActivity();

    if (el.loading) el.loading.remove();
    renderStaircase();
    renderRpgHud(fetchStats());
    renderCosmicMap(activityData);
  } catch {
    if (el.loading) {
      el.loading.textContent = "Veriler yüklenemedi. Sayfayı yenileyin.";
      el.loading.classList.add("error");
    }
  }

  if (!resizeBound) {
    resizeBound = true;
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      drawPath();
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => renderStaircase(), 150);
    });
  }
}

function bindAccordions() {
  document.querySelectorAll("[data-accordion]").forEach((module) => {
    if (module.dataset.accordionBound === "1") return;
    module.dataset.accordionBound = "1";

    const trigger = module.querySelector(".accordion-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      const open = module.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(open));
    });
  });
}

function bindEvents() {
  /* Geliştirici paneli */
  safeOn(el.devGoalBtn, "click", (e) => {
    e.preventDefault();
    startNextGoal();
  });
  safeOn(el.devGoalScrollBtn, "click", (e) => {
    e.preventDefault();
    scrollToNextGoal();
  });
  safeOn(el.devCurrentOpenBtn, "click", (e) => {
    e.preventDefault();
    if (!focusedTopicId) return;
    const topic = topics.find((t) => t.id === focusedTopicId);
    if (topic) openNotesModal(topic);
  });
  safeOn(el.mobileGoalBtn, "click", (e) => {
    e.preventDefault();
    startNextGoal();
  });
  safeOn(el.devDailyGoal, "click", (e) => {
    const btn = e.target.closest(".dev-daily-preset");
    if (!btn) return;
    e.preventDefault();
    setDailyGoalMinutes(Number(btn.dataset.minutes));
  });

  document.querySelectorAll("[data-theme-switch]").forEach((btn) => {
    safeOn(btn, "click", (e) => {
      e.preventDefault();
      toggleTheme();
    });
  });

  /* Giriş & navigasyon */
  safeOn(el.enterSystemBtn, "click", (e) => {
    e.preventDefault();
    requestEnterApp();
  });
  safeOn(el.backToLandingBtn, "click", (e) => {
    e.preventDefault();
    goBackToLanding();
  });
  safeOn(el.openShortcutsBtn, "click", (e) => {
    e.preventDefault();
    openShortcutsModal();
  });
  safeOn(el.footerShortcutsBtn, "click", (e) => {
    e.preventDefault();
    openShortcutsModal();
  });
  safeOn(el.landingShortcutsBtn, "click", (e) => {
    e.preventDefault();
    openShortcutsModal();
  });
  safeOn(el.hudActiveTimer, "click", () => {
    const runningId = getRunningTopicId();
    if (!runningId) return;
    const topic = topics.find((t) => t.id === runningId);
    if (topic) openNotesModal(topic);
  });

  /* Kod odası modal */
  safeOn(el.timerToggle, "click", toggleTimer);
  safeOn(el.timerSave, "click", saveTimer);
  safeOn(el.timerReset, "click", resetTimer);
  safeOn(el.runCodeBtn, "click", handleRunCode);
  safeOn(el.modalClose, "click", closeNotesModal);
  safeOn(el.missionTimer, "click", (e) => e.stopPropagation());
  safeOn(el.modalFrame, "click", (e) => e.stopPropagation());
  safeOn(el.notesModal, "click", (e) => {
    if (e.target === el.notesModal) closeNotesModal();
  });
  safeOn(el.modalNotes, "input", handleNotesInput);

  bindLearningEvents();

  /* Kısayollar modal */
  safeOn(el.shortcutsClose, "click", closeShortcutsModal);
  safeOn(el.shortcutsFrame, "click", (e) => e.stopPropagation());
  safeOn(el.shortcutsModal, "click", (e) => {
    if (e.target === el.shortcutsModal) closeShortcutsModal();
  });

  /* Kutlama */
  safeOn(el.celebrationClose, "click", () => el.celebrationOverlay?.classList.add("hidden"));
  safeOn(el.bossVictoryClose, "click", () => hideBossVictoryOverlay());
  safeOn(el.bossVictoryOverlay, "click", (e) => {
    if (e.target === el.bossVictoryOverlay) hideBossVictoryOverlay();
  });
  safeOn(el.celebrationOverlay, "click", (e) => {
    if (e.target === el.celebrationOverlay) el.celebrationOverlay.classList.add("hidden");
  });

  /* Merdiven (event delegation) */
  safeOn(el.staircase, "click", handleStaircaseClick);
  safeOn(el.staircase, "keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const title = e.target.closest(".step-title");
    if (!title) return;
    e.preventDefault();
    const topic = getTopicFromStep(title.closest(".step"));
    if (topic) openNotesModal(topic);
  });

  /* Operatör adı */
  safeOn(el.operatorName, "input", () => {
    const name = getOperatorName();
    updateTerminalOperator(name);
    if (name.length >= 2) {
      el.operatorError?.classList.add("hidden");
      el.operatorName?.classList.remove("error");
    }
    renderDevPanel();
  });
  safeOn(el.operatorName, "blur", saveOperatorName);
  safeOn(el.operatorName, "keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      requestEnterApp();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (el.shortcutsModal && !el.shortcutsModal.classList.contains("hidden")) {
        closeShortcutsModal();
        return;
      }
      if (el.notesModal && !el.notesModal.classList.contains("hidden")) {
        closeNotesModal();
        return;
      }
      if (el.celebrationOverlay && !el.celebrationOverlay.classList.contains("hidden")) {
        el.celebrationOverlay.classList.add("hidden");
        return;
      }
      if (appInitialized && el.app && !el.app.classList.contains("hidden")) {
        goBackToLanding();
      }
      return;
    }

    if (e.key === "?" && !e.ctrlKey && !e.altKey && !e.metaKey && !isTypingInField()) {
      e.preventDefault();
      openShortcutsModal();
      return;
    }

    const notesOpen = el.notesModal && !el.notesModal.classList.contains("hidden");
    if (notesOpen && e.ctrlKey && e.key === "Enter" && document.activeElement === el.codeEditor) {
      e.preventDefault();
      handleRunCode(e);
    }

    if (e.altKey && e.key.toLowerCase() === "n" && appInitialized && el.app && !el.app.classList.contains("hidden")) {
      const modalOpen = notesOpen
        || (el.shortcutsModal && !el.shortcutsModal.classList.contains("hidden"));
      if (!modalOpen && findNextTopic()) {
        e.preventDefault();
        startNextGoal();
      }
    }
  });
}

function initApp() {
  cacheElements();
  initTheme();
  bindAccordions();
  bindEvents();
  initCyberDuck();
  initDevTip();
  initParticlesBackground(getStoredTheme());
  initLanding();
  initPyodide().catch(() => {});
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
