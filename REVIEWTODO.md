Backend Developer · Case Study
Genel Bilgilendirme
Bu proje kapsamında, kullanıcıların birbiriyle gerçek zamanlı mesajlaşabileceği basit bir kullanıcı sistemi geliştirilecektir. Sistem, modern web teknolojileri kullanılarak ölçeklenebilir ve performanslı bir yapıda tasarlanacaktır.

Proje Gereksinimleri
1. Veri Modelleri
Sistemde aşağıdaki veri modelleri oluşturulacaktır:
- [ ] User - Kullanıcı bilgileri
- [ ] Conversation - Konuşma bilgileri
- [ ] Message - Mesaj bilgileri
- [ ] AutoMessage - Otomatik mesaj bilgileri

2. Kullanıcı Yönetimi API'leri
I. Kimlik Doğrulama Endpoint'leri
- [ ] POST /api/auth/register - Yeni kullanıcı kaydı
- [ ] POST /api/auth/login - Kullanıcı giriş işlemi
- [ ] POST /api/auth/refresh - Access token yenileme
- [ ] POST /api/auth/logout - Kullanıcı çıkış işlemi
- [ ] GET /api/user/list - Sistemdeki kullanıcıları listeleme
- [ ] GET /api/auth/me - Kullanıcı profil bilgilerini görüntüleme

3. Mesajlaşma API'leri
I. Mesaj Yönetimi Endpoint'leri
- [ ] Ürünün tasarım yönlendirmesi
- [ ] Ton, renk, UX öncelikleri

4. Socket.IO Event'leri
I. Gerçek Zamanlı İletişim Event'leri
- [ ] connection - Kullanıcının sisteme bağlanması
- [ ] join_room - Belirli bir konuşma odasına katılma
- [ ] send_message - Gerçek zamanlı mesaj gönderme
- [ ] message_received - Mesaj alındı bildirimi
- [ ] user_online - Kullanıcının online durumu bildirimi
- [ ] disconnect - Kullanıcının sistemden ayrılması

PROJE Real-Time Mesajlaşma Sistemi Proje Dokümantasyonu
Bu proje tamamen kurgusaldır. Gerçek bir ürün için kullanılmayacaktır. Çalışmalarınız yalnızca değerlendirme amacıyla incelenecek ve ticari bir çalışmada yer almayacaktır.

Kullanılacak Teknolojiler
Bu projede aşağıdaki teknolojilerin aktif olarak kullanılması gerekmektedir:
- [ ] Node.js — Sunucu tarafı JavaScript çalışma ortamı
- [ ] Express.js — Web uygulama framework’ü
- [ ] MongoDB — NoSQL veritabanı
- [ ] RabbitMQ — Mesaj kuyruğu sistemi
- [ ] Redis — In-memory veri yapısı deposu
- [ ] JWT — JSON Web Token kimlik doğrulama
- [ ] Socket.IO — Gerçek zamanlı iletişim kütüphanesi
- [ ] Cron — Zamanlanmış görev yöneticisi

Geliştirme Gereksinimleri
1. Authentication Middleware
Güvenli API erişimi için aşağıdaki özellikleri içeren middleware:
- [ ] JWT token doğrulama mekanizması
- [ ] Authorization header’dan token çıkarma
- [ ] Doğrulanmış kullanıcı bilgilerini request nesnesine ekleme
- [ ] Hata durumlarında uygun HTTP status kodları döndürme

2. RabbitMQ Kuyruk Sistemi
Asenkron mesaj işleme için:
- [ ] Otomatik mesajlar için özel kuyruk yapısı
- [ ] Message producer (üretici) ve consumer (tüketici) servisleri
- [ ] Hata yönetimi ve tekrar deneme (retry) mekanizması

3. Cron Job Otomatik Mesaj Sistemi
Zamanlanmış görev yönetimi için:
- [ ] Her gece saat 02:00’da çalışan otomatik görev
- [ ] Rastgele kullanıcı eşleştirme algoritması
- [ ] Mesaj içeriği üretimi ve veritabanına kaydetme
- [ ] RabbitMQ kuyruğuna mesaj ekleme

4. Redis Servisleri
Performans için cache sistemleri:
- [ ] Kullanıcı online/offline durumu takibi
- [ ] Konuşma verilerinin cache’lenmesi
- [ ] Session yönetimi
- [ ] Geçici veri saklama mekanizması

5. Socket.IO Implementasyonu
Gerçek zamanlı iletişim için:
- [ ] JWT tabanlı kullanıcı kimlik doğrulaması
- [ ] Gerçek zamanlı mesaj gönderim sistemi
- [ ] Kullanıcı online durumu takibi
- [ ] Oda (room) yönetimi ve kullanıcı gruplama

Sistem Akışı ve Otomasyon
Bu bölümde kullanıcıların gerçekleştirebileceği temel işlemler ve sistemin arka planda otomatik olarak yürüteceği süreçler detaylandırılmıştır.

1. Kullanıcı İşlemleri
I. Kayıt ve Kimlik Doğrulama
Kullanıcılar username, email ve password ile sisteme kayıt olabilir. Başarılı giriş sonrası JWT tabanlı Access Token ve Refresh Token alırlar.

II. Profil Yönetimi
Kullanıcılar kimlik doğrulaması gerektiren endpoint’ler ile profil bilgilerini görüntüleyip güncelleyebilir.

III. Gerçek Zamanlı Mesajlaşma
- [ ] Socket.IO ile anlık mesaj gönderme/alma
- [ ] Karşı tarafın yazma durumunu gösteren typing event
- [ ] Mesaj okundu bilgisi ve anlık bildirimler

IV. Mesaj Geçmişi Yönetimi
Önceki konuşmalar ve mesajlar RESTful API endpoint’leri ile görüntülenebilir.

V. Güvenli Oturum Sonlandırma
Çıkış sırasında JWT token’ların geçersiz kılınması ve güvenli oturum sonlandırma.

2. Otomatik Sistem Süreçleri
Üç aşamada çalışır: Planlama, Kuyruğa Alma ve İşleme.

1) Mesaj Planlama Servisi (Cron Job — Gece 02:00)
Amaç: Aktif kullanıcıları otomatik eşleştirip gönderilecek mesajları toplu hazırlamak.
Süreç:
- [ ] Her gece 02:00’da tetiklenir
- [ ] Veritabanındaki aktif kullanıcılar çekilir
- [ ] Liste rastgele karıştırılır (shuffle)
- [ ] İkişerli gruplar (gönderici, alıcı) oluşturulur
- [ ] Her çift için rastgele mesaj içeriği hazırlanır
- [ ] Gelecek tarih (sendDate) belirlenir
- [ ] Tüm bilgiler AutoMessage koleksiyonuna kaydedilir

2) Kuyruk Yönetimi Servisi (Worker Cron Job — Dakikada Bir)
Amaç: Zamanı gelen mesajları RabbitMQ’ya yönlendirmek.
Süreç:
- [ ] Her dakika çalışır
- [ ] AutoMessage’da sendDate’i geçmiş ve isQueued: false olanlar bulunur
- [ ] message_sending_queue kuyruğuna gönderilir
- [ ] Aynı mesajın tekrar işlenmemesi için isQueued: true yapılır

3) Mesaj Dağıtım Servisi (RabbitMQ Consumer)
Amaç: Kuyruktaki mesajları işleyip alıcılara ulaştırmak.
Süreç:
- [ ] message_sending_queue dinlenir
- [ ] Gelen görevler anında işlenir
- [ ] Göreve göre yeni Message dokümanı oluşturulup veritabanına kaydedilir
- [ ] Socket.IO üzerinden alıcıya message_received olayı ile bildirim gönderilir
- [ ] AutoMessage kaydı isSent: true yapılır

Sistem Avantajları
Bu üç aşamalı yapı; zamanlama, işleme adayı tespiti ve gerçek gönderimi ayrıştırır. Ölçeklenebilir, hataya dayanıklı ve yönetilebilir bir otomatik mesajlaşma sistemi sağlar.

3. Online Kullanıcı Takip Sistemi
Socket.IO ve Redis ile kullanıcıların online durumları gerçek zamanlı takip edilir.

I. Kullanıcı Bağlantı Yönetimi
- [ ] Kullanıcı bağlantısı Socket.IO’da JWT ile doğrulanır
- [ ] Başarılı kimlik doğrulama sonrası kullanıcı Redis’teki online Set’ine eklenir
- [ ] Diğer kullanıcılara online bilgisi broadcast edilir

Kullanıcı Ayrıldığında (disconnect)
- [ ] Kimlik Redis online listesinden kaldırılır
- [ ] Diğer kullanıcılara offline bilgisi iletilir

II. Online Durum Sorguları
- [ ] Anlık Online Kullanıcı Sayısı: Redis Set eleman sayısı
- [ ] Belirli Kullanıcı Online mı: Set içinde kullanıcı ID’si var mı kontrolü
- [ ] Online Kullanıcı Listesi: Test endpoint’iyle tüm online ID’ler listelenir

Değerlendirilecek Noktalar
- [ ] Backend Geliştirme: Node.js & Express.js ile API becerileri
- [ ] Veritabanı: MongoDB ile NoSQL tasarım/işlemler
- [ ] Güvenlik: JWT tabanlı kimlik doğrulama & yetkilendirme
- [ ] Gerçek Zamanlı İletişim: Socket.IO
- [ ] Asenkron İşlemler: RabbitMQ ile message queue
- [ ] Cache Yönetimi: Redis ile performans
- [ ] Zamanlanmış Görevler: Cron job’lar
- [ ] Kod Kalitesi: Temiz kod ve best practices

Bonus Kriterler
- [ ] Logger (Winston, Pino vs.)
- [ ] ElasticSearch (mesaj arama, indeksleme)
- [ ] Swagger/OpenAPI (API dokümantasyonu)
- [ ] Error Yakalama (Sentry vs.)

Güvenlik ve Performans
- [ ] Rate Limiting middleware
- [ ] Input Validation ve sanitization
- [ ] Database indexing ve optimizasyon
- [ ] Redis caching stratejileri
- [ ] Security headers (Helmet vs.)
