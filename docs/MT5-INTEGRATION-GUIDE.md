# 🚀 MT5 Gerçek Entegrasyon Kılavuzu

## 📋 Genel Bakış

Bu kılavuz, Trade Journal uygulamanızı gerçek MetaTrader 5 (MT5) hesabınızla nasıl entegre edeceğinizi adım adım açıklar. Entegrasyon tamamlandığında, MT5'teki tüm işlemleriniz otomatik olarak Trade Journal'ınıza senkronize edilecektir.

## 🎯 Özellikler

- ✅ **Real-time Trade Sync**: İşlemler kapanır kapanmaz otomatik import
- ✅ **Account Information**: Hesap bakiyesi, equity, margin bilgileri
- ✅ **Position Tracking**: Kapalı pozisyonların tam geçmişi
- ✅ **Duplicate Prevention**: Aynı işlemin tekrar import edilmemesi
- ✅ **Connection Monitoring**: Bağlantı durumu takibi
- ✅ **Error Handling**: Hata durumlarında otomatik yeniden deneme
- ✅ **Multi-Account Support**: Birden fazla MT5 hesabı desteği

## 🛠️ Kurulum Adımları

### Adım 1: Expert Advisor Dosyasını İndirin

1. Trade Journal uygulamasında **Dashboard** sayfasına gidin
2. Sağ taraftaki **"MT5 Real-Time Sync"** widget'ını bulun
3. **"EA İndir"** butonuna tıklayın veya [buradan indirin](/mt5-expert-advisor-real.mq5)

### Adım 2: MT5'e Expert Advisor'ı Yükleyin

1. **MetaTrader 5**'i açın
2. **Dosya → Veri Klasörünü Aç** menüsüne tıklayın
3. Açılan pencerede **MQL5 → Experts** klasörüne gidin
4. İndirdiğiniz `TradeJournal-EA.mq5` dosyasını bu klasöre kopyalayın
5. **MT5'i yeniden başlatın**

### Adım 3: WebRequest İzinlerini Ayarlayın

1. MT5'te **Tools → Options** menüsüne gidin
2. **Expert Advisors** sekmesini seçin
3. **"Allow WebRequest for listed URL"** seçeneğini işaretleyin

#### Seçenek A: Localhost (Bazı durumlarda çalışmayabilir)
URL listesine şu adresleri ekleyin:
```
http://localhost:3000/api/mt5/import
https://localhost:3000/api/mt5/import
http://127.0.0.1:3000/api/mt5/import
```

#### Seçenek B: Ngrok (Önerilen) 🚀
Eğer localhost çalışmazsa:

1. **Terminal'de ngrok kurun:**
   ```bash
   npm install -g ngrok
   ```

2. **Ngrok tunnel'ı başlatın:**
   ```bash
   ngrok http 3000
   ```

3. **HTTPS URL'sini kopyalayın** (örn: `https://abc123.ngrok.io`)

4. **MT5'te bu URL'yi ekleyin:**
   ```
   https://abc123.ngrok.io/api/mt5/import
   ```

5. **Expert Advisor ayarlarında değiştirin:**
   - `WebhookURL`: `https://abc123.ngrok.io/api/mt5/import`
   - `UseSSL`: `true`

### Adım 4: Expert Advisor'ı Çalıştırın

1. MT5'te herhangi bir **grafik** açın (sembol önemli değil)
2. **Navigator** panelinden **Expert Advisors** bölümünü genişletin
3. **TradeJournal-EA** dosyasını **grafiğe sürükleyin**
4. Açılan ayarlar penceresinde:
   - **"Allow live trading"** seçeneğini işaretleyin
   - **"Allow imports"** seçeneğini işaretleyin
   - Diğer ayarları varsayılan olarak bırakın
5. **OK** butonuna tıklayın

## ⚙️ Expert Advisor Ayarları

EA'da özelleştirebileceğiniz önemli ayarlar:

### Bağlantı Ayarları
- **WebhookURL**: Trade Journal API endpoint'i (varsayılan: localhost:3000)
- **ApiKey**: Güvenlik için API anahtarı (opsiyonel)
- **UseSSL**: HTTPS bağlantısı kullanımı

### Senkronizasyon Ayarları
- **EnableRealTimeSync**: Real-time senkronizasyon (önerilen: true)
- **ExportOnStart**: Başlangıçta geçmiş işlemleri export et (önerilen: true)
- **HistoryDays**: Kaç günlük geçmiş export edilsin (varsayılan: 30)
- **SyncIntervalSeconds**: Senkronizasyon kontrol aralığı (varsayılan: 5 saniye)

### Filtre Ayarları
- **SyncClosedTradesOnly**: Sadece kapalı işlemleri senkronize et (önerilen: true)
- **SymbolFilter**: Belirli sembolleri filtrele (boş = tümü)

## 📊 Bağlantı Durumu Kontrolü

Trade Journal dashboard'ında **MT5 Real-Time Sync** widget'ında şunları görebilirsiniz:

- 🟢 **Çevrimiçi**: EA çalışıyor ve bağlı
- 🔴 **Çevrimdışı**: EA çalışmıyor veya bağlantı sorunu var
- **Account Info**: Hesap numarası, server, balance, equity
- **Son Sinyal**: En son ne zaman veri alındığı

## 🔄 İşlem Senkronizasyonu

### Otomatik Senkronizasyon
- İşlemler **kapanır kapanmaz** otomatik olarak Trade Journal'a eklenir
- **Duplicatesion kontrolü** sayesinde aynı işlem tekrar eklenmez
- **Real-time hesap bilgileri** güncellenir

### Manuel Senkronizasyon
- EA ilk çalıştırıldığında **son 30 günün** işlemleri otomatik import edilir
- **Refresh** butonu ile manuel kontrol yapabilirsiniz

## 🐛 Sorun Giderme

### EA Çalışmıyor
1. **Terminal** penceresinde hata mesajları kontrol edin
2. **AutoTrading** butonunun yeşil olduğundan emin olun
3. **Allow live trading** seçeneğinin işaretli olduğunu kontrol edin

### WebRequest Hatası (4060)
```
WebRequest error (4060). Check if URL is in allowed list
```
**Çözüm**: WebRequest izinlerini tekrar kontrol edin (Adım 3)

### Bağlantı Sorunu
1. **Trade Journal uygulamasının** çalıştığından emin olun
2. **URL'nin doğru** olduğunu kontrol edin
3. **Windows Firewall** ayarlarını kontrol edin

### İşlemler Eklenmedi
1. **Expert Advisors** sekmesinde log mesajlarını kontrol edin
2. **Closed trades only** ayarının doğru olduğundan emin olun
3. **Symbol filter** ayarlarını kontrol edin

## 📋 Log Mesajları

EA çalışırken terminal penceresinde şu mesajları göreceksiniz:

```
=== Trade Journal EA v3.0 Initialized ===
Account: 12345678
Server: MetaQuotes-Demo
✓ trade data sent successfully
🏦 MT5 Account connected: 12345678 on MetaQuotes-Demo
```

## 🔒 Güvenlik

- EA **sadece okuma** işlemi yapar, hesabınızda işlem açmaz
- **Investor Password** kullanarak ek güvenlik sağlayabilirsiniz
- **API Key** ile endpoint'i güvenli hale getirebilirsiniz

## 📞 Destek

Sorunlarınız için:
1. Bu dokümandaki sorun giderme bölümünü kontrol edin
2. MT5 **Terminal** pencesindeki hata mesajlarını inceleyin
3. Trade Journal **console** loglarını kontrol edin

## 🎉 Başarılı Entegrasyon

Entegrasyon başarılı olduğunda:
- ✅ MT5 widget'ı yeşil durum gösterir
- ✅ Hesap bilgileriniz görüntülenir
- ✅ Yeni işlemler otomatik olarak eklenir
- ✅ Real-time PnL takibi yapabilirsiniz

**Tebrikler! MT5 entegrasyonunuz tamamlandı!** 🚀

---

*Son güncelleme: 2024*
