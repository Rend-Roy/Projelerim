# Müşteri Ziyaret Takip Uygulaması - PRD

## Problem Statement
Günlük müşteri ziyaretlerini takip etmek için kullanılan, mobil uyumlu (özellikle iOS) bir Türkçe web uygulaması.

## User Personas
- **Saha Satış Temsilcisi**: Mobil cihazından (özellikle iOS) tek elle kullanacak, günlük müşteri ziyaretlerini takip edecek kullanıcı

## Core Requirements (Static)
- Temiz, sade ve gözü yormayan tasarım
- Açık renk arka plan (beyaz/açık gri)
- Tek vurgu rengi: Mavi (#0055FF)
- Mobilde tek elle rahat kullanım
- Türkiye saat dilimi (UTC+3)
- Türkçe gün isimleri ve arayüz

## User Choices
- Vurgu rengi: Mavi
- Örnek verilerle başla
- Müşteri yönetimi ekranı olsun
- Giriş sistemi yok

## What's Been Implemented (06 Ocak 2026)

### Backend (FastAPI + MongoDB)
- Müşteri CRUD API'leri (/api/customers)
- Ziyaret takip API'leri (/api/visits)
- Günlük müşteri filtreleme (/api/customers/today/{day_name})
- Örnek veri seed endpoint'i (/api/seed)

### Frontend (React + Tailwind + Shadcn UI)
- **Bugün Sayfası**: Günün Türkçe ismi, tarih, ilerleme çubuğu, ziyaret edilecek müşteri kartları
- **Müşteri Detay Sayfası**: Ziyaret durumu işaretleme, not alanı, kaydet butonu
- **Müşteriler Sayfası**: Bölgelere göre gruplandırılmış liste, arama fonksiyonu
- **Müşteri Formu**: Ekleme/düzenleme/silme işlevselliği
- **Bottom Navigation**: Mobil uyumlu glassmorphism efektli navigasyon

### Tasarım
- Manrope (başlıklar) + Inter (gövde) fontları
- Mavi (#0055FF) vurgu rengi
- Yuvarlatılmış kartlar ve butonlar
- Mobil öncelikli responsive tasarım

## Prioritized Backlog

### P0 (Tamamlandı)
- [x] Bugün sayfası
- [x] Müşteri kartları ve ziyaret durumu
- [x] Ziyaret detay sayfası
- [x] Müşteri yönetimi

### P1 (Gelecek)
- [ ] Geçmiş ziyaretler raporu
- [ ] Haftalık/aylık özet görünümü
- [ ] Müşteri konumu (harita entegrasyonu)

### P2 (İleride)
- [ ] PDF/Excel rapor dışa aktarma
- [ ] Çevrimdışı mod (offline support)
- [ ] Push bildirimleri

## Next Tasks
1. Geçmiş ziyaretleri görüntüleme ekranı
2. Haftalık takvim görünümü
3. Rapor özellikleri
