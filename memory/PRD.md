# Müşteri Ziyaret Takip Uygulaması - PRD

## Problem Statement
Satış temsilcileri için çok kullanıcılı, günlük müşteri ziyaretlerini takip eden, mobil uyumlu Türkçe web uygulaması. Her kullanıcının verileri tamamen izole edilmiş durumda.

## User Personas
- **Saha Satış Temsilcisi**: Mobil cihazından (özellikle iOS) günlük müşteri ziyaretlerini, tahsilatları ve araç giderlerini takip eden kullanıcı
- **Yönetici** (İleride): Ekibin performansını izleyen kullanıcı

## Core Requirements
- Temiz, sade ve gözü yormayan tasarım
- Açık renk arka plan (beyaz/açık gri)
- Tek vurgu rengi: Mavi (#0055FF)
- Mobilde tek elle rahat kullanım
- Türkiye saat dilimi (UTC+3)
- Türkçe gün isimleri ve arayüz
- Kullanıcı bazlı veri izolasyonu (güvenlik)

## Completed Phases

### FAZ 1: Core Features (Tamamlandı)
- [x] Bugün sayfası - günlük ziyaret listesi
- [x] Müşteri CRUD - ekleme, düzenleme, silme
- [x] Ziyaret takibi - durum, not, tahsilat
- [x] Bölge yönetimi
- [x] Takip sistemi (follow-ups)
- [x] Performans analitiği
- [x] PDF rapor oluşturma
- [x] Excel'den toplu müşteri yükleme

### FAZ 2: Visit Quality (Tamamlandı)
- [x] Ziyaret süresi takibi (Başlat/Bitir)
- [x] 1-5 yıldız kalite değerlendirmesi
- [x] Müşteri uyarıları (Kırmızı Bayrak sistemi)
- [x] Kalite metrikleri dashboard'a entegre

### FAZ 3: Multi-User Foundation (Tamamlandı)
- [x] E-posta/şifre authentication sistemi
- [x] Kayıt, giriş, çıkış, şifre sıfırlama
- [x] users tablosu ve JWT token
- [x] Tüm modellere user_id alanı eklendi

### FAZ 3.1: Auth Refinement (Tamamlandı)
- [x] sessionStorage bazlı oturum yönetimi
- [x] Her tarayıcı açılışında yeniden giriş gerekli
- [x] PDF raporunda kullanıcı adı ve e-posta

### FAZ 3.2: User-Based Data Isolation (Tamamlandı - 16 Ocak 2026)
- [x] TÜM backend endpoint'lerine user_id filtresi eklendi
- [x] Müşteriler, bölgeler, ziyaretler, takipler izole
- [x] Araçlar, yakıt kayıtları, günlük KM izole
- [x] Analytics ve PDF rapor izole
- [x] 28/28 test başarılı

### FAZ 4: Vehicle & Cost Tracking (Tamamlandı)
- [x] Araç tanımlama (ad, plaka, yakıt tipi)
- [x] Yakıt kayıtları (litre, tutar, km)
- [x] Günlük KM takibi
- [x] Otomatik tüketim ve maliyet hesaplama
- [x] PDF raporuna günlük araç özeti eklendi
- [x] Yan menü (drawer) navigasyon

### Bugün Ekranı & PDF İyileştirmeleri (Tamamlandı - 17 Ocak 2026)
- [x] 3 durumlu ziyaret sistemi: pending, visited, not_visited
- [x] "Ziyaret Edilmedi" seçildiğinde sebep zorunlu
- [x] "Ziyaret Edilmedi" durumunda tahsilat alanı pasif
- [x] Net durum badge'leri: Gri (Bekliyor), Yeşil (Ziyaret Edildi), Kırmızı (Ziyaret Edilmedi)
- [x] CustomerCard sol kenar rengi status'a göre değişiyor
- [x] PDF raporu kompakt, tablo bazlı format
- [x] Sayfa 1: Yönetici özeti (satış temsilcisi adı dahil)
- [x] Sayfa 2: Ziyaret edilenler tablosu
- [x] Sayfa 3: Ziyaret edilmeyenler tablosu
- [x] Geriye uyumlu migration (eski veriler için)

## Tech Stack
- **Backend**: FastAPI (Python) + MongoDB (Motor async)
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Auth**: JWT + bcrypt + passlib
- **PDF**: FPDF2
- **Excel**: openpyxl

## Key Data Models
- **users**: id, email, name, password_hash, role
- **customers**: id, name, region, phone, address, price_status, visit_days, alerts, user_id
- **visits**: id, customer_id, date, completed, payment info, duration, rating, user_id
- **regions**: id, name, description, user_id
- **follow_ups**: id, customer_id, due_date, status, user_id
- **vehicles**: id, name, plate, fuel_type, user_id
- **fuel_records**: id, vehicle_id, liters, amount, current_km, user_id
- **daily_km_records**: id, vehicle_id, date, start_km, end_km, user_id

## Test Credentials
- **User 1**: test@example.com / test123 (12 müşteri)
- **User 2**: user2@test.com / test456 (1 müşteri)

## Future Tasks
Tüm planlanan fazlar tamamlandı. Yeni özellikler için kullanıcı talebi bekleniyor.

### Olası İyileştirmeler
- Yönetici paneli (tüm kullanıcıları görme)
- Ekip performans karşılaştırması
- Harita entegrasyonu
- Push bildirimleri
- Çevrimdışı mod (PWA)
