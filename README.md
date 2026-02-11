# Bizim Küçük Dünyamız 🌍💛

Sevgililer günü için hazırlanmış, harita üzerinde anıları keşfetmeye dayalı romantik ve etkileşimli bir web deneyimi.

## 🎯 Özellikler

- 📍 **Anı Haritası** — Leaflet haritası üzerinde anı noktaları
- 💑 **Sürüklenebilir Karakter** — Karakteri sürükleyerek anıları keşfet
- 🎴 **Anı Kartları** — Her noktaya yaklaşınca otomatik açılan kartlar
- 💌 **Sürpriz Final** — Typewriter efektli romantik mesaj
- 📱 **Mobil Uyumlu** — Touch destekli, responsive tasarım
- 🎨 **Pastel Tema** — Modern, romantik ve performanslı arayüz

## 🛠 Kişiselleştirme

### `data.js` Dosyasını Düzenle

1. **İsimlerinizi değiştirin:**
```javascript
const config = {
  benimAd: "Senin Adın",
  seninAd: "Sevgilinin Adı",
};
```

2. **Anı noktalarını düzenleyin:**
```javascript
const anilar = [
  {
    id: 1,
    baslik: "Anı Başlığı",
    tarih: "1 Ocak 2024",       // opsiyonel, null yazabilirsiniz
    metin: "Anı metni...",
    lat: 41.0082,                // Google Maps'ten alın
    lng: 28.9784,
    foto: "foto1.jpg",           // opsiyonel, null yazabilirsiniz
    // surpriz: true              // Son nokta için ekleyin
  }
];
```

3. **Final mesajını yazın:**
```javascript
const finalMesaj = `Romantik mesajınız buraya...`;
```

### 📸 Fotoğraf Ekleme

1. Fotoğrafları `assets/` klasörüne koyun
2. `data.js`'de `foto` alanına dosya adını yazın (örn: `"foto1.jpg"`)
3. Fotoğraf yoksa `null` bırakın — otomatik placeholder gösterilir

### 📍 Koordinat Bulma

[Google Maps](https://maps.google.com)'te istediğiniz konuma sağ tıklayın → koordinatları kopyalayın.

## 🚀 Canlı Demo

👉 [GitHub Pages'de Görüntüle](https://emiryilmazb.github.io/bizim-kucuk-dunyamiz/)

## 📦 Teknolojiler

- HTML5, CSS3, Vanilla JavaScript
- [Leaflet](https://leafletjs.com/) — Harita kütüphanesi
- [OpenStreetMap](https://www.openstreetmap.org/) — Harita verileri
- Tamamen statik — Backend gerektirmez

## 📱 Mobil Uyumluluk

- Touch destekli sürükleme
- Responsive tasarım (320px — 1920px+)
- Mobilde optimize edilmiş harita yüksekliği

## 📄 Lisans

Bu proje kişisel kullanım amacıyla oluşturulmuştur. ❤️
