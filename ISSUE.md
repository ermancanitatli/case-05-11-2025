# ISSUE Listesi

Aşağıda REVIEWTODO.md kapsamındaki maddelere göre yapılan incelemede tespit edilen eksik ve iyileştirme alanları yer almaktadır. Her madde için kısa açıklama ve çözüm önerisi eklenmiştir.

- [ ] Test Altyapısı: Entegrasyon testlerinde Redis bağımlılığı gerçek Redis gerektiriyor
  - Belirti: `tests/integration/auth.flow.test.js:1` akışında `POST /api/auth/refresh` ve `POST /api/auth/logout` çağrıları `src/services/refreshTokens.js` üzerinden Redis kullanır. Test yardımcıları `tests/integration/helpers.js:1` içinde `connectRedis/disconnectRedis` içe aktarılmış ancak çağrılmıyor; Redis mock’u da yok.
  - Etki: CI ortamında Redis olmadığı için testler bağlantı denemelerinde takılabilir/başarısız olabilir.
  - Çözüm Önerisi:
    - Seçenek A: Entegrasyon testleri için `src/lib/redis` modülünü jest ile mock’layın (socket testlerinde yapıldığı gibi) ve `getRedis()` için in-memory stub döndürün.
    - Seçenek B: `ioredis-mock` ekleyip test başlangıcında `connectRedis()` ile mock’a bağlanın, bitişte `disconnectRedis()` çağırın.
    - Seçenek C: `src/services/refreshTokens.js` içinde `NODE_ENV==='test'` iken in-memory Map tabanlı bir depoya graceful fallback ekleyin.

- [ ] Doğrulama: `GET /api/search/messages` celebrate+joi kullanılmıyor
  - Belirti: `src/routes/search.js:1` manuel kontrol var, ancak proje standardı kritik uçlarda celebrate+joi.
  - Etki: Parametre şeması tutarlılığı bozuluyor; hata mesajları standardize değil.
  - Çözüm Önerisi: `src/validation/schemas.js` içine `search.messages` şeması ekleyip route’a `celebrate` middleware’i bağlayın.

- [ ] Doğrulama: Online sorgu uçları için şema yok
  - Belirti: `src/routes/online.js:1` içinde `GET /api/online/count` ve `GET /api/online/list` parametre almıyor fakat standartlaştırma için şema (boş şema dahi) kullanılabilir.
  - Etki: Küçük ama tutarlılık eksikliği.
  - Çözüm Önerisi: Boş query şeması ile celebrate kullanımı ekleyin (ör. sadece tip güvenliği ve ortak hata formatı için).

- [ ] Güvenlik: CORS yapılandırması prod ortamda çok geniş
  - Belirti: `src/middlewares/security.js:1` `cors({ origin: true, credentials: true })` tüm origin’lere izin veriyor.
  - Etki: Prod’da istenmeyen origin’lerden istek kabul edilebilir.
  - Çözüm Önerisi: `CORS_ORIGINS` ortam değişkeni ile izinli origin listesini yapılandırın; development’ta serbest, production’da whitelist.

- [ ] Güvenlik: JWT imza karşılaştırması constant-time değil
  - Belirti: `src/utils/jwt.js:27` imza kontrolü `sig === expSig` ile yapılıyor.
  - Etki: Teorik timing attack yüzeyi (düşük risk, ama best practice değil).
  - Çözüm Önerisi: `crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expSig))` ile sabit süreli karşılaştırma yapın; boyut eşitliği için ön kontrol ekleyin.

- [ ] Cron Dayanıklılığı: 02:00 planlama penceresi kaçırılabilir
  - Belirti: `src/jobs/autoMessagePlanner.js:56` `dailyPlannerJob()` sadece `getHours()===2 && getMinutes()===0` anında çalışıyor, 30 sn’lik loop var.
  - Etki: Uygulama o dakikada kapalıysa/geldiğinde 02:00 penceresi kaçırılabilir ve gün planlaması yapılmayabilir.
  - Çözüm Önerisi: “Son çalıştırma < bugün ve şimdi >= 02:00” koşulu ile ilk uygun kontrolde çalışacak şekilde esnekleştirin veya bir cron kütüphanesi kullanın.

- [ ] OpenAPI: Yanıt şemaları data-wrapper ve hata yapıları ile hizalı değil
  - Belirti: `docs/openapi.json:1` çoğu endpoint 200 dönerken `success/data` sarmalayıcı ve hata şemaları (ör. `error.code`, `error.message`) tam modellenmemiş.
  - Etki: İstemci jenerasyonları ve sözleşme tabanlı testler için eksik tip bilgisi.
  - Çözüm Önerisi: Ortak yanıt şeması (SuccessResponse, ErrorResponse) tanımlayıp tüm path’lere uygula.

- [ ] ElasticSearch: `indices.exists` dönüş tipi sürüme bağlı farklılık gösterebilir
  - Belirti: `src/services/search.js:14` ile kullanılan client sürümünde `indices.exists` boolean/nesne dönebilir.
  - Etki: Belirli sürümlerde false-negatif/pozitif interpretasyon riski.
  - Çözüm Önerisi: Kütüphane sürümüne uygun şekilde dönüş tipini netleştirip kontrolü sabitleyin (boolean coercion veya resmi tip tanımlarına uygun varyant).

- [ ] Rate Limit: `/api/docs` ve `/api/openapi.json` rate limit kapsamına giriyor
  - Belirti: `src/app.js:1` `app.use('/api', apiLimiter, routes)` tüm `/api/*`’yı limitlemekte.
  - Etki: Dokümantasyon UI’si yerel geliştirmede gereksiz limitlenebilir.
  - Çözüm Önerisi: `/api/docs` ve `/api/openapi.json` yollarını limiter dışına almayı veya daha yüksek limit uygulamayı değerlendirin.

- [ ] Test Temiz Kapanış: Redis istemcisi açık handle bırakabilir
  - Belirti: `tests/integration/helpers.js:1` içinde `stopServer()` Redis’i kapatmıyor; refresh token testleri gerçek Redis’e bağlanırsa jest açık handle uyarısı verebilir.
  - Çözüm Önerisi: Test senaryosu Redis’i kullanıyorsa `disconnectRedis()` çağırın veya Redis’i testlerde mock’layın.

