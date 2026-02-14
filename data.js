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
        date: "14 Şubat 2023",
        x: 41.1052707,
        y: 28.9858336,
        order: 1,
    },
    {
        id: "bogaz-yuruyusu",
        title: "Boğaz'da İlk Yürüyüşümüz 🌅",
        photoUrls: [],
        description:
            "Bebek sahilinde yürürken güneş batıyordu. Ellerini ilk kez tuttum ve kalbimin ne kadar hızlı attığını hissettim. O an sonsuza kadar sürsün istedim.",
        date: "3 Mart 2023",
        x: 41.0797,
        y: 29.0451,
        order: 2,
    },
    {
        id: "balat-sokaklar",
        title: "Balat'ta Renkli Sokaklar 🎨",
        photoUrls: [],
        description:
            "Balat'ın renkli sokaklarında saatlerce kayboldum seninle. Her köşe başı yeni bir sürprizdi. Kahvemizi yudumlarken dünya sadece ikimize aitti.",
        date: "15 Haziran 2023",
        x: 41.0295,
        y: 28.9487,
        order: 2,
    },
    {
        id: "kadikoy-sokaklar",
        title: "Kadıköy Sokaklarında Kaybolmak 🎭",
        photoUrls: [],
        description:
            "Kadıköy'ün renkli sokaklarında saatlerce yürüdük. Sokak müzisyenlerini dinledik, vintage dükkanları keşfettik. Seninle kaybolmak bile bir macera.",
        date: "20 Ağustos 2023",
        x: 40.9903,
        y: 29.0244,
        order: 2,
    },
    {
        id: "kiz-kulesi",
        title: "Kız Kulesi Manzarası 🏰",
        photoUrls: [],
        description:
            "Yeni yılı Üsküdar sahilinde karşıladık. Kız Kulesi'nin ışıkları suya yansırken yeni bir yılın ilk dakikalarını birlikte yaşadık. En güzel başlangıçtı.",
        date: "1 Ocak 2024",
        x: 41.0211,
        y: 29.004,
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
