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
// 📍 ANI NOKTALARI
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
    {
        id: "tango-gecesi",
        title: "İlk Tangomuz 💃🕺",
        photoUrls: [
            "tango/photo_2026-02-14_12-34-10.jpg",
            "tango/photo_2026-02-14_12-34-12.jpg",
            "tango/photo_2026-02-14_12-34-15.jpg",
        ],
        description:
            "Okulun dans kulübünün verdiği tango eğitiminde birlikte piste çıktığımız anı hiç unutmuyorum. Adımlar bazen karışsa da göz göze geldiğimiz her anda gülüşün her şeyi kolaylaştırdı. O gece müzikle birlikte kalplerimiz de aynı ritimde attı.",
        x: 41.014689,
        y: 28.9054296,
        order: 2,
    },
    {
        id: "swissotel-aksami",
        title: "Swissotel Çatı Maceramız 🌃",
        photoUrls: [
            "swissotel/photo_2026-02-14_12-33-31.jpg",
            "swissotel/photo_2026-02-14_12-33-33.jpg",
        ],
        description:
            "Özel bir günde Swissotel'in çatısındaki restorana gitmiştik. Yemekler ve servis biraz kalbimizi kırdı, hesap da ayrı bir dramdı ama manzara gerçekten her şeyi bir süreliğine unutturdu. O geceyi şimdi gülerek hatırlıyoruz: menü vasat, biz şahane, manzara efsane.",
        x: 41.0411641,
        y: 28.9976787,
        order: 2,
    },
    {
        id: "buyukada-plaj",
        title: "Büyükada'da Deniz Kaçamağı 🌊",
        photoUrls: [
            "buyukada/photo_2026-02-14_12-33-51.jpg",
            "buyukada/photo_2026-02-14_12-33-54.jpg",
        ],
        description:
            "Büyükada'da plaja gidip birlikte yüzdüğümüz o gün tam bir terapi gibiydi. Deniz serin, güneş tatlı, seninle geçen her dakika huzur doluydu. Şehrin karmaşasından uzaklaşıp sadece anın tadını çıkardığımız en güzel kaçamaklardan biri oldu.",
        x: 40.8592605,
        y: 29.1132392,
        order: 2,
    },
    {
        id: "kartal-ev",
        title: "Evde Mini Konserimiz 🎸🏠",
        photoUrls: [
            "kartalev/photo_2026-02-14_12-33-42.jpg",
            "kartalev/photo_2026-02-14_12-33-44.jpg",
        ],
        description:
            "Damla'nın evime geldiği ve birlikte gitar çalmaya çalıştığımız o kısa an benim için çok özel. Belki profesyonel değildik ama birlikte aynı ritmi yakalamaya çalışmak bile çok keyifliydi. Birkaç akor, bol kahkaha ve kalbimde kalan çok tatlı bir anı.",
        x: 40.9144843,
        y: 29.2009153,
        order: 2,
    },
    {
        id: "alsancak-gunbatimi",
        title: "Alsancak'ta Gün Batımı 🌇",
        photoUrls: [
            "alsancak/photo_2026-02-14_12-33-59.jpg",
            "alsancak/photo_2026-02-14_12-34-02.jpg",
        ],
        description:
            "Birlikte İzmir'e gitmişken Alsancak Gündoğdu Meydanı'nı da gezmeye çıkmıştık. Deniz kenarında yan yana oturup gün batımını izlediğimiz o anın huzuru hâlâ aklımda. Şehir başka bir güzeldi ama seninle olunca manzara daha da güzelleşti.",
        x: 38.4358061,
        y: 27.1394477,
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
