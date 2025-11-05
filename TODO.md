# Real-Time Mesajlaşma Sistemi — TODO

> Kapsam: Node.js + Express.js, MongoDB, RabbitMQ, Redis, JWT, Socket.IO, Cron.
> Hedef: Ölçeklenebilir, güvenli ve basit bir gerçek zamanlı mesajlaşma altyapısı.

## Mimari ve Kurulum
- [x] Paket yöneticisi tercihi: Yalnızca `yarn` kullanılacak (AGENTS.md notu eklendi)
- [x] Projeyi başlat: `yarn` ile temel yapı (src/, config/, modules/) oluşturuldu
- [x] Ortam değişkenleri ve konfigürasyon: `dotenv`, merkezi `config` modülü (app, db, jwt, redis, mq)
- [x] Express uygulaması, global middleware’ler (JSON, CORS, Helmet, compression)
- [x] Merkezi hata yakalama ve standart hata yanıt şeması
- [x] MongoDB bağlantısı ve kapatma sinyalleri (SIGINT/SIGTERM) için graceful shutdown
- [x] Dockerfile ve `docker-compose.yml` eklendi; `docker-compose up` ile app+Mongo+Redis+RabbitMQ ayağa kalkar

## Veri Modelleri (MongoDB)
- [x] User (Mongoose şeması)
  - [x] `username` (unique), `email` (unique, index), `passwordHash` (select:false), `isActive`
  - [x] `lastOnlineAt`, `createdAt`, `updatedAt` — timestamps ile otomatik
  - [x] Soft delete: `isDeleted`, `deletedAt` (plugin)
  - [x] Indexler: `email_1` (unique), `username_1` (unique)
- [x] Conversation (Mongoose şeması)
  - [x] `participants: [userId]`, `lastMessageAt`, `type: direct|group`
  - [x] timestamps, soft delete plugin
  - [x] Indexler: `participants_1`, `lastMessageAt_1`
- [x] Message (Mongoose şeması)
  - [x] `conversationId`, `senderId`, `content`, `status: sent|delivered|read`
  - [x] `createdAt`, `deliveredAt`, `readAt` — timestamps + alanlar
  - [x] Soft delete plugin
  - [x] Indexler: `conversationId_1_createdAt_1`
- [x] AutoMessage (Mongoose şeması)
  - [x] `senderId`, `receiverId`, `content`, `sendDate`
  - [x] Durum: `isQueued`, `queuedAt`, `isSent`, `sentAt`, `error`
  - [x] timestamps, soft delete plugin
  - [x] Indexler: `sendDate_1_isQueued_1`, `isSent_1`

## Kimlik Doğrulama ve Kullanıcı Yönetimi API’leri
- [x] JWT Yapılandırması
  - [x] `accessToken` (kısa ömür, HS256)
  - [x] `refreshToken` (opaque, Redis TTL, rotate/revoke)
- [x] Middleware: Authentication
  - [x] `Authorization: Bearer <token>` ayıklama
  - [x] JWT doğrulama, `req.user` bağlama
  - [x] Hata durumlarında uygun HTTP 401 gövdesi
- [x] Endpoint’ler
  - [x] `POST /api/auth/register`
  - [x] `POST /api/auth/login`
  - [x] `POST /api/auth/refresh`
  - [x] `POST /api/auth/logout`
  - [x] `GET  /api/user/list`
  - [x] `GET  /api/auth/me`

## Mesajlaşma API’leri (REST)
- [x] Konuşmalar
  - [x] `GET  /api/conversations` — kullanıcının konuşmaları, son mesaj ve unread sayaçları ile
  - [x] `GET  /api/conversations/:id` — konuşma detayı + izin kontrolü
- [x] Mesajlar
  - [x] `GET  /api/conversations/:id/messages` — sayfalama, sıralama, tarih aralığı filtreleri
  - [x] `POST /api/messages` — mesaj yarat (conversationId veya toUserId desteği)
- [x] Okundu/teslim durumları
  - [x] `POST /api/messages/:id/read` — okundu durumunu güncelle


## Socket.IO — Gerçek Zamanlı İletişim
- [x] Bağlantı doğrulama
  - [x] JWT ile handshake/auth (query veya `auth` alanı)
  - [x] Başarılı doğrulamada kullanıcı için oda: `user:{userId}`
- [x] Oda yönetimi
  - [x] `join_room` — `conversation:{id}` odasına katılım + izin kontrolü
- [x] Mesajlaşma event’leri
  - [x] `send_message` — mesaj yarat, `message_received` ile odaya yayın
  - [x] `message_received` — alıcı client’lara push
  - [x] `typing` — yazma durumu yayını
- [x] Varlık event’leri
  - [x] `user_online` — bağlantı/çıkışta broadcast
  - [x] `disconnect` — çıkışta broadcast ve Redis set temizleme

## Redis — Cache ve Online Durum Yönetimi
- [x] Bağlantı ve sağlıklı kapanış
- [x] Online kullanıcı takibi
  - [x] Set: `online_users` — `SADD` bağlantıda, `SREM` çıkışta
  - [x] Sayaç ve liste endpoint’i: `GET /api/online/count`, `GET /api/online/list` (auth gerektirir)
- [x] Konuşma/Mesaj cache stratejisi (son N mesaj)
  - [x] Yazımda cache’e ekleme ve kısıtlama (N=50, TTL=3600s)
  - [x] Listelemede page=1, sort=desc, no before/after ise cache’den okuma
- [x] Session/refresh token saklama (Redis)

## RabbitMQ — Kuyruk Sistemi
- [x] Bağlantı ve kanal yönetimi
- [x] Kuyruk tanımları
  - [x] `message_sending_queue` (asıl kuyruk)
  - [x] DLX `dlx` + retry kuyruğu (`message_sending_queue.retry`, TTL: env `MQ_RETRY_TTL`) ve terminal DLQ (`message_sending_queue.dlq`)
- [x] Producer
  - [x] `enqueueAutoMessageTask` ile görev kuyruğa yazma
- [x] Consumer
  - [x] Kuyruktan görev tüketimi, `Message` oluşturma ve DB’ye kaydetme
  - [x] Socket.IO ile `message_received` yayını
  - [x] `AutoMessage.isSent = true`, `sentAt` güncelleme; hata durumunda retry ve DLQ

## Cron — Otomatik Mesaj Süreçleri
- [x] 02:00 Planlama Job’u
  - [x] Aktif kullanıcıları çek, `shuffle` et, ikili eşleştir (gönderici/alıcı)
  - [x] Mesaj içerik üretimi, `sendDate` belirleme (10dk–20sa arası rastgele)
  - [x] Hepsini `AutoMessage` koleksiyonuna kaydet, günlük tek çalıştırma (Redis anahtar)
- [x] Her dakika Kuyruk Yönetimi Job’u
  - [x] `sendDate <= now && isQueued=false` kayıtlarını atomik olarak sıraya al
  - [x] `message_sending_queue` kuyruğuna gönder, `isQueued=true`, `queuedAt` güncelle
- [x] İşlem Tamamlama (Consumer içinde)
  - [x] Başarılı işlenen görevler için `isSent=true`, `sentAt` güncelle

## Güvenlik ve Performans
- [x] Rate limiting (express-rate-limit) — global ve auth özel limitler
- [x] Input validation & sanitization (celebrate+joi) — tüm ilgili endpoint’lerde
- [x] Security headers (Helmet), CORS kontrolü, body size limitleri
- [x] Şifre politikası ve hash: `scrypt` + min 8 karakter; timing-safe verify
- [x] DB index’leri ve sorgu optimizasyonu (ana alanlar için indexler tanımlı)
- [x] Redis caching stratejileri (TTL, invalidation kuralları)

## Loglama, İzleme ve Dokümantasyon (Bonus)
- [x] Logger (Pino) — request/response, genel kullanım
- [x] Swagger/OpenAPI — statik `docs/openapi.json`, UI: `/api/docs`
- [x] Sentry — DSN var ise hataları yakalar
- [x] ElasticSearch (opsiyonel) — mesaj indeksleme ve `GET /api/search/messages`

## Test ve Kalite
- [x] Birim testleri: jwt, password, auth middleware
- [x] Entegrasyon testleri: auth akışı, mesaj akışı (in-memory Mongo)
- [x] Socket.IO event testleri (`socket.io-client` ile)
- [ ] E2E (opsiyonel): temel kullanıcı senaryoları
- [x] Lint/format (ESLint + Prettier). CI (opsiyonel) henüz eklenmedi

### Test Komutları
- `yarn test` — tüm testler
- `yarn test:unit` — birim testleri
- `yarn test:integration` — entegrasyon testleri (Mongo Memory Server)
- `yarn test:socket` — Socket.IO testleri (Redis mock’lanır)

## Kabul Kriterleri (Definition of Done)
- [x] Belirtilen tüm auth endpoint’leri JWT ile güvenli çalışır (register/login/refresh/logout/me/list)
- [x] Kullanıcı, konuşma ve mesajlar REST ile listelenip görüntülenebilir
- [x] Socket.IO ile `join_room`, `send_message`, `message_received`, `typing`, `user_online`, `disconnect` event’leri çalışır
- [x] Redis ile online kullanıcı listesi/sayısı doğru yönetilir ve sorgulanır
- [x] 02:00 cron job’ı AutoMessage kayıtlarını üretir
- [x] Dakikalık job, zamanı gelen mesajları kuyruğa alır (`isQueued=true`)
- [x] Consumer, kuyruğu dinleyip mesajları DB’ye yazar, Socket.IO ile bildirir (`isSent=true`)
- [x] Hata durumlarında retry/DLQ politikası işler, loglar üretilebilir
- [x] Rate limiting, validation, security headers etkin
- [x] Temel index’ler tanımlı, kritik sorgular hızlı

## Notlar ve Kararlar
- [ ] Gerçek zamanlı `send_message` HTTP’den bağımsız olarak Socket.IO üzerinden doğrudan DB’ye yazılacak ve alıcıya yayınlanacaktır (KISS). Planlı otomatik gönderimler MQ zincirinden geçecektir.
- [ ] Refresh token’ların saklama yeri (Redis veya DB) proje sırasında kesinleştirilecek; logout’ta revoke zorunludur.
- [ ] V2’de grup konuşmaları, dosya gönderimi, okundu bilgisi senkronizasyonu ve arama (Elastic) ele alınabilir (YAGNI gereği şimdilik kapsam dışı).

### Geliştirme Notları (Güncel)
- [x] Yalnızca `yarn` kullanılacaktır; `package.json` içine `packageManager` alanı eklendi
- [x] Docker Compose servisleri: `app`, `mongo`, `redis`, `rabbitmq` (RabbitMQ UI: 15672)
- [x] Sağlık kontrolü: `GET /api/health` (localhost:3000)
