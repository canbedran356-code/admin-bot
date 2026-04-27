# 🤖 Berxwedan Bot - Telegram Moderasyon Botu

Telegram grupları için gelişmiş moderasyon sistemi.

## ✨ Özellikler

✅ **Ban/Unban** - Kullanıcı yasağı yönetimi
✅ **Warn/Unwarn** - Uyarı sistemi (3 uyarıya ulaşınca otomatik ban)
✅ **Mute/Unmute** - Kullanıcı susturma (dakika cinsinden)
✅ **Kick** - Kullanıcı atma
✅ **Hoşgeldin Mesajı** - Otomatik karşılama
✅ **Gülegüle Mesajı** - Çıkış mesajı
✅ **Admin Paneli** - Butonlu kontrol sistemi
✅ **İşlem Günlüğü** - Tüm işlemler kaydediliyor
✅ **MongoDB Entegrasyonu** - Güvenli veri yönetimi
✅ **Reply Sistemi** - Mesajı reply et komut çalıştır

## 🚀 Kurulum

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/canbedran356-code/admin-bot.git
cd admin-bot
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. .env Dosyasını Yapılandırın
```bash
cp .env.example .env
```

Ardından `.env` dosyasını düzenleyin:
```
BOT_TOKEN=123456789:ABCdef...
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/berxwedan_bot
ADMIN_IDS=123456789,987654321
```

### 4. Botu Başlatın
```bash
npm start
```

## 📋 Bot Komutları

### Admin Komutları
- `/ban` - Mesajı reply edip `/ban [reason]` yazın
- `/unban` - Reply edip `/unban` yazın
- `/warn` - Reply edip `/warn [reason]` yazın
- `/unwarn` - Reply edip `/unwarn` yazın
- `/mute` - Reply edip `/mute [dakika] [reason]` yazın
- `/unmute` - Reply edip `/unmute` yazın
- `/kick` - Reply edip `/kick [reason]` yazın

### Bilgi Komutları
- `/start` - Botu başlat
- `/help` - Komutlar listesi
- `/admin` - Admin paneli (butonlu)
- `/stats` - Kullanıcı istatistikleri
- `/logs` - Son işlemler
- `/info` - Bot hakkında bilgi

## 🚂 Railway'e Deploy

### Option 1: Otomatik Deploy
1. [railway.app](https://railway.app) ziyaret edin
2. **New Project** → **GitHub Repo** seçin
3. `admin-bot` deposunu seçin
4. Ortam değişkenlerini ekleyin
5. Deploy! ✅

### Option 2: Railway CLI
```bash
npm install -g railway
railway init
railway up
```

## 📁 Proje Yapısı

```
admin-bot/
├── src/
│   ├── models/
│   │   ├── User.js          # Kullanıcı modeli
│   │   ├── Group.js         # Grup modeli
│   │   └── ActionLog.js     # İşlem günlüğü modeli
│   ├── services/
│   │   ├── UserService.js       # DB işlemleri
│   │   └── KeyboardService.js   # Telegram UI butonları
│   └── index.js             # Ana bot dosyası
├── package.json             # Bağımlılıklar
├── .env.example            # Ortam değişkenleri şablonu
├── .gitignore              # Git ayarları
├── Procfile                # Railway deployment
└── README.md               # Bu dosya
```

## 🎛️ Admin Paneli

`/admin` komutu çalıştırdığında şu butonlar görünür:
- 🚫 Ban
- ⚠️ Warn
- 🔇 Mute (30 min)
- 🔇 Mute (1 saat)
- 👢 Kick
- 📋 Logs
- 👤 User Info
- ❌ Kapat

## 💾 Veritabanı

Bot MongoDB kullanır. Aşağıdaki veriler saklanır:

### Users Collection
- `telegramId` - Telegram kullanıcı ID'si
- `username` - Kullanıcı adı
- `warnings` - Uyarı sayısı
- `isBanned` - Yasaklı mı?
- `isMuted` - Susturulmuş mu?
- `warningHistory` - Uyarı geçmişi

### ActionLogs Collection
- `userId` - Etkilenen kullanıcı
- `action` - İşlem türü (ban, warn, mute, vb.)
- `reason` - İşlemin nedeni
- `adminId` - İşlemi yapan admin
- `timestamp` - İşlem tarihi

## 🔐 Güvenlik

- ✅ Admin ID kontrol
- ✅ İzin verilen komutların kısıtlaması
- ✅ Şifreleme ile MongoDB bağlantısı
- ✅ Error handling
- ✅ Input validation

## 📞 İletişim

- **GitHub**: https://github.com/canbedran356-code/admin-bot
- **Geliştirici**: @canbedran356
- **Sorunlar**: Issues sekmesinden bildir

## 📝 Lisans

MIT License - Özgürce kullanabilirsiniz!

## 🙏 Katkıda Bulunma

Pull Request göndermeyi hoşlanırız! 🚀

---

**Berxwedan Bot** ile gruplarınızı yönetmesi kolay hale getirin! 🛡️