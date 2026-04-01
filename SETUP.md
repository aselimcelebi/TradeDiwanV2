# TradeDiwan — Kurulum Kılavuzu

## Yapılan Değişiklikler

### 🐛 Düzeltilen Hatalar
- `tailwind-merge` eksikti → `cn()` fonksiyonu class çakışmalarına yol açıyordu
- Dashboard'daki hardcoded değerler (`$32,032.50`, haftalık veriler) → gerçek DB'den hesaplanıyor
- Streak her zaman `3` döndürüyordu → `calculateStreak()` ile gerçek değer
- `DEMO_USER_ID` → NextAuth session ile gerçek kullanıcı sistemi
- `avgRMultiple` metrik hesabı eklendi

### ✨ Yeni Özellikler
- **NextAuth.js** — Email/şifre + Google OAuth
- **Multi-user** — Her kullanıcı kendi verisini görür
- **PostgreSQL** — SQLite production sorunu çözüldü
- **Geist font** — Inter yerine modern ve özgün
- **Dark theme** — TradeZella kopyası görünümden kurtuldu
- **Win Rate gauge** — Animasyonlu çember grafik
- **R-Multiple** — İşlem başına ortalama R hesabı
- **Son 30 gün P&L** — Gerçek hesaplama
- **Haftalık breakdown** — Bar chart yerine minimal görünüm

### 🎨 Tasarım Değişiklikleri
- Renk sistemi: Mor gradient → Koyu/siyah profesyonel tema
- Font: Inter → Geist + Geist Mono
- Sidebar: Parlak gradient → Sade, minimal, koyu
- Kartlar: Beyaz → Koyu yüzey, ince border
- Tablo: Açık gri → Koyu, hover efektli
- Login sayfası: Yok → Split layout, branded sol panel

---

## Kurulum

### 1. Repo'yu kur
```bash
git clone https://github.com/aselimcelebi/TradeDiwan.git
cd TradeDiwan
npm install
```

### 2. Değiştirilen dosyaları kopyala
Bu paketteki dosyaları ilgili yerlere koy:
- `package.json`
- `tailwind.config.js`
- `prisma/schema.prisma`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/auth/login/page.tsx` (yeni klasör)
- `src/app/api/auth/[...nextauth]/route.ts` (yeni klasör)
- `src/app/api/auth/register/route.ts` (yeni klasör)
- `src/app/api/trades/route.ts`
- `src/lib/auth.ts` (yeni)
- `src/lib/utils.ts`
- `src/components/sidebar.tsx`
- `src/components/session-wrapper.tsx` (yeni)
- `src/components/dashboard-content.tsx`

### 3. Environment variables
```bash
cp env.example .env.local
```

`.env.local` dosyasını düzenle:
```env
DATABASE_URL="postgresql://..."   # Supabase connection string
NEXTAUTH_SECRET="rastgele-uzun-bir-string"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Supabase kurulumu (ücretsiz)
1. supabase.com → New Project
2. Settings → Database → Connection string → URI kopyala
3. `.env.local`'e yapıştır

### 5. DB migration
```bash
npm run db:generate
npm run db:migrate
npm run db:seed    # Demo verisi (opsiyonel)
```

### 6. Çalıştır
```bash
npm run dev
```

`http://localhost:3000` → login sayfasına yönlendirir → kayıt ol → dashboard!

---

## Sıradaki Adımlar (Roadmap)

### Phase 1 — Tamamlandı ✅
- Auth sistemi
- Multi-user
- PostgreSQL
- Tasarım modernizasyonu
- Hardcoded veri düzeltmeleri

### Phase 2 — Yapılacak
- [ ] Stripe ödeme entegrasyonu (Free/Pro planlar)
- [ ] Header bileşeni auth ile güncellenmeli
- [ ] Journal API auth ile güncellenmeli
- [ ] Broker API auth ile güncellenmeli
- [ ] CSV/Excel import
- [ ] Equity curve chart (Recharts AreaChart)

### Phase 3 — Gelecek
- [ ] MT5 gerçek WebSocket bağlantısı
- [ ] AI insights (OpenAI API)
- [ ] Mobile responsive iyileştirmeleri
- [ ] Email bildirimleri

---

## Para Kazanma Modeli

**Freemium önerisi:**
- Free: 50 trade/ay, 1 hesap, temel analitik
- Pro ($15/ay): Sınırsız trade, çoklu hesap, gelişmiş analitik, MT5 sync
- Team ($49/ay): 5 kullanıcı, mentor modu, paylaşımlı stratejiler

**Stripe kurulumu sonraki paketle gelecek.**
