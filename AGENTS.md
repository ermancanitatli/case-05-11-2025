# Proje Ajan Notları (AGENTS.md)

Bu depo için ek kurallar ve beklentiler:

- Paket Yöneticisi: Yalnızca `yarn` kullanılacaktır. `npm`/`pnpm` kullanılmamalıdır.
- Testler: Servislerin (DB, Redis, MQ bağlayıcıları ve iş mantığı) testleri yazılacaktır. Test komutları `yarn test` üzerinden koşturulacaktır.
- Docker ve Compose: MongoDB, Redis ve RabbitMQ Docker ile çalıştırılacak; `docker-compose up` komutu tüm alt servisleri ve backend’i birlikte ayağa kaldırmalıdır.
- Geliştirme Prensipleri: KISS, YAGNI, DRY, SOLID ilkelere uyulacaktır.


Notlar:
- Ortam değişkenleri `.env` ile yönetilir. Docker Compose backend konteynerine uygun bağlantı URL’lerini enjekte eder.
- CI/CD ve ek kalite araçları (ESLint/Prettier, test çerçevesi) Yarn komutları ile entegre edilecektir.

Durum Güncellemesi:
- Mimari ve kurulum tamamlandı: Yarn tercihleri, Dockerfile ve `docker-compose.yml` eklendi, `docker-compose up` ile tüm servisler (app+Mongo+Redis+RabbitMQ) ayağa kalkar. İlerleme TODO.md’ye işlenmiştir.
- Veri Modelleri (MongoDB): Mongoose ile `User`, `Conversation`, `Message`, `AutoMessage` şemaları yazıldı. Tümünde timestamps ve soft-delete (isDeleted/deletedAt) plugin’i uygulanmıştır. Index’ler eklendi.
- Auth ve Kullanıcı Yönetimi: JWT (HS256) access token, Redis tabanlı opaque refresh token (TTL, rotate, revoke) eklendi. Middleware ile Bearer doğrulama yapılıyor. Endpoint’ler: register, login, refresh, logout, me, user/list.
- Mesajlaşma API’leri: Conversations list/detail, Messages list/create ve read akışı tamamlandı. Listelemede son mesaj ve unread sayaçları döndürülür. `POST /api/messages` conversationId veya toUserId ile çalışır.
- Socket.IO: JWT tabanlı handshake, `join_room`, `send_message`, `message_received`, `typing`, `user_online`, `disconnect` eklendi. Redis üzerinden online kullanıcı seti yönetilir.
- Redis Cache & Presence: Uygulama açılışında Redis bağlanır ve kapanışta temiz kapanış yapılır. `online_users` set’i ile presence tutulur. Cache: son N mesaj (50) TTL 3600s; REST ve Socket yazımında cache güncellenir, belirli koşullarda listede cache kullanılır.
- RabbitMQ: `message_sending_queue` ana kuyruk; DLX `dlx`, retry kuyruğu TTL ile geri döner; terminal DLQ. Producer `enqueueAutoMessageTask`, consumer uygulama içinde başlatılır ve Socket.IO bildirimi yapar.
- Cron: 02:00’da planlama (aktif kullanıcılar rastgele eşleşir, AutoMessage kayıtları oluşturulur), dakikalık job ile zamanı gelenler sıraya alınır. Günlük tek çalıştırma Redis anahtarı ile garanti edilir.
- Güvenlik ve Performans: Global ve auth rate limiting eklendi. Tüm kritik endpoint’lerde celebrate+joi ile input validation uygulanır. Helmet, CORS ve body limit aktif. Parola `scrypt` ile hash’lenir ve doğrulama timing-safe yapılır.
- Loglama & İzleme & Dokümantasyon: Pino ile HTTP request/response loglama. Sentry DSN tanımlı ise hata yakalama aktif. Swagger UI `/api/docs`, OpenAPI JSON `/api/openapi.json`. ElasticSearch opsiyonel: mesaj indeksleme ve arama ucu eklendi.
- Test ve Kalite: Jest + Supertest + socket.io-client ile birim ve entegrasyon testleri hazır. Socket testlerinde Redis mock’lanır. Lint için ESLint, format için Prettier yapılandırıldı. Test komutları: `yarn test`, `yarn test:unit`, `yarn test:integration`, `yarn test:socket`.
 - Kabul Kriterleri: TODO.md altındaki tüm DoD maddeleri sağlandı ve işaretlendi.
