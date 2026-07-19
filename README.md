# 🐍 Python Öğrenme Yol Haritası

32 bölümlük Python öğrenme merdiveni — XP, aktivite haritası, kod odası ve geliştirici paneli.

**Canlı site:** [furkaneneskum.github.io/python-yol-haritasi](https://furkaneneskum.github.io/python-yol-haritasi/)

## Özellikler

- 32 Udemy bölümü için interaktif merdiven
- XP, seviye, streak ve aktivite haritası
- Kod odası (GitHub Pages'te Pyodide ile tarayıcıda Python çalıştırma)
- Notlar, süre takibi, Udemy + dokümantasyon kaynakları
- Mobil uyumlu arayüz

## GitHub Pages (herkese açık)

Site `docs/` klasöründen yayınlanır. Veriler tarayıcıda `localStorage` ile saklanır.

### İlk kurulum

1. Repoyu GitHub'a push edin
2. **Settings → Pages → Build and deployment**
3. **Source:** Deploy from a branch
4. **Branch:** `main` → **`/docs`**
5. Birkaç dakika sonra site yayında olur

### Frontend güncelledikten sonra

`frontend/` klasöründeki değişiklikleri `docs/` klasörüne kopyalayın:

```powershell
Copy-Item -Path frontend\* -Destination docs\ -Recurse -Force
```

Ardından commit + push yapın.

## Yerel geliştirme (FastAPI + SQLite)

Backend ile tam özellikli yerel sürüm:

```powershell
pip install -r requirements.txt
cd backend
python -m uvicorn main:app --reload
```

Tarayıcı: [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Proje yapısı

```
frontend/     Kaynak arayüz dosyaları
docs/         GitHub Pages yayın klasörü
backend/      FastAPI + SQLite (yerel geliştirme)
```

## Lisans

Kişisel eğitim projesi.
