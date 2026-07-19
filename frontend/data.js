/** Varsayılan konu listesi — backend/database.py ile senkron */
const ROADMAP_DEFAULT_TOPICS = [
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

const ROADMAP_UDEMY_URL = "https://www.udemy.com/course/sifirdan-ileri-seviyeye-python/";

const ROADMAP_DOC_URLS = [
  "https://docs.python.org/tr/3/tutorial/datastructures.html",
  "https://docs.python.org/tr/3/tutorial/controlflow.html",
  "https://docs.python.org/tr/3/tutorial/controlflow.html#for-statements",
  "https://docs.python.org/tr/3/tutorial/controlflow.html#defining-functions",
  "https://docs.python.org/tr/3/tutorial/modules.html",
  "https://docs.python.org/tr/3/tutorial/classes.html",
  "https://docs.python.org/tr/3/tutorial/errors.html",
  "https://docs.python.org/tr/3/tutorial/inputoutput.html",
  "https://docs.python.org/tr/3/library/functions.html",
  "https://docs.python.org/tr/3/library/collections.html",
  "https://docs.python.org/tr/3/library/sqlite3.html",
  "https://docs.python.org/tr/3/glossary.html#term-decorator",
  "https://docs.python.org/tr/3/tutorial/classes.html#generators",
  "https://docs.python.org/tr/3/py-modindex.html",
  "https://www.riverbankcomputing.com/static/Docs/PyQt5/",
  "https://docs.python.org/tr/3/",
  "https://flask.palletsprojects.com/",
  "https://www.sqlalchemy.org/",
  "https://docs.djangoproject.com/tr/5.0/",
  "https://flask.palletsprojects.com/en/latest/deploying/",
  "https://docs.djangoproject.com/en/stable/howto/deployment/",
  "https://selenium-python.readthedocs.io/",
  "https://selenium-python.readthedocs.io/getting-started.html",
  "https://developers.facebook.com/docs/instagram-api/",
  "https://flask.palletsprojects.com/en/latest/quickstart/",
  "https://docs.github.com/en/rest",
  "https://docs.scrapy.org/",
  "https://numpy.org/doc/stable/user/quickstart.html",
  "https://pandas.pydata.org/docs/getting_started/index.html",
  "https://www.kaggle.com/learn/pandas",
  "https://developers.google.com/youtube/v3",
  "https://matplotlib.org/stable/gallery/index.html",
];

function roadmapSectionTitle(title) {
  return title.includes(": ") ? title.split(": ", 2)[1] : title;
}

function roadmapResourcesForIndex(index) {
  const section = roadmapSectionTitle(ROADMAP_DEFAULT_TOPICS[index].title);
  const docUrl =
    index < ROADMAP_DOC_URLS.length
      ? ROADMAP_DOC_URLS[index]
      : "https://docs.python.org/tr/3/";
  return [
    { title: `▶ Udemy — ${section}`, url: `${ROADMAP_UDEMY_URL}learn/` },
    { title: `🐍 Dokümantasyon — ${section}`, url: docUrl },
  ];
}
