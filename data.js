// ==========================================
// 📝 KİŞİSELLEŞTİRME ALANI
// Bu dosyayı düzenleyerek projeyi kendinize uyarlayın
// ==========================================

const config = {
    benimAd: "Emir",
    seninAd: "Damla",
    // Character spawn location (Maltepe)
    charSpawn: { x: 40.94825, y: 29.130882 },
};

// ==========================================
// 📍 ANI NOKTALARI (Tümü İstanbul)
// Her anı için: id, baslik, tarih, metin, lat, lng, photoUrls, order
//   - order: 1 = ilk gidilecek yer (okul), 2+ = sonra hepsi açılır
//   - photoUrls: fotoğraf dizisi (birden fazla olabilir)
//   - Sırayı değiştirmek için order değerlerini güncelleyin
// ==========================================
const locations = [
    {
        id: "ilk-tanisma",
        title: "İlk Tanıştığımız Gün ☕",
        photoUrls: ["1ilktanışma.jpeg"],
        description:
            "İyi ki o gün o bahçeye çıkmışım, iyi ki seni görmüşüm. O an hayatımın en güzel tesadüfü oldu. Gözlerine baktığım ilk an, kalbimin sana ait olacağını biliyordum. Her şey o anda başladı... Seninle tanıştığım o bahçe, benim için dünyanın en özel yeri oldu.",
        date: "27 Ekim 2024",
        x: 41.1052707,
        y: 28.9858336,
        order: 1,
    },
    {
        id: "kiz-kulesi",
        title: "Kız Kulesi Gecemiz 🌙🏰",
        photoUrls: [
            "kizkulesi/photo_2026-02-14_12-32-46.jpg",
            "kizkulesi/photo_2026-02-14_12-33-24.jpg",
        ],
        description:
            "O gece seni arabayla Kız Kulesi'nin önüne götürmüştüm. Şehrin ışıkları suya vururken yan yana oturup uzun uzun konuştuk. Sessizlik bile o kadar güzeldi ki, sanki zaman sadece ikimiz için yavaşladı. O an kalbimde hep saklayacağım en tatlı anılardan biri oldu.",
        x: 41.021872,
        y: 29.0080142,
        order: 2,
    },
];

// ==========================================
// 🌟 FİNAL NOKTASI
// Tüm anılar keşfedildikten sonra ortaya çıkar
// Koordinatları değiştirmek için x ve y değerlerini güncelleyin
// ==========================================
const finaleLocation = {
    id: "finale",
    title: "Son Durak ✨",
    x: 41.0586,
    y: 29.0337,
};

// ==========================================
// 💌 FİNAL MESAJI
// Dünya haritası sahnesinde gösterilir
// ==========================================
const finalMesaj = `Damla, seni tanıdığım günden beri hayatım bambaşka bir anlam kazandı. Seninle geçirdiğim her an, bir hazine gibi kalbimde saklı. Gülüşün en kötü günlerimi bile aydınlatıyor, varlığın bana huzur veriyor.

Bazen düşünüyorum da, seni bulmak için tüm o yolları yürümek ne kadar değermiş. Her anımız, her kahkaha, her paylaştığımız sessizlik bile çok kıymetli.

Bu küçük dünyamızda seninle büyüyorum, seninle öğreniyorum, seninle yaşıyorum. Geleceğe dair tek bildiğim, seninle olacağı. Ve bu beni dünyanın en şanslı insanı yapıyor.

Seni çok seviyorum, bugün ve her gün. 💛`;
