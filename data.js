// ==========================================
// 📝 KİŞİSELLEŞTİRME ALANI
// Bu dosyayı düzenleyerek projeyi kendinize uyarlayın
// ==========================================

const config = {
    benimAd: "Emir",
    seninAd: "Damla",
};

// ==========================================
// 📍 ANI NOKTALARI
// Her anı için: baslik, tarih, metin, lat, lng, foto
// Foto opsiyoneldir — yoksa null yazın
// ==========================================
const anilar = [
    {
        id: 1,
        baslik: "İlk Tanıştığımız Gün ☕",
        tarih: "14 Şubat 2023",
        metin:
            "O gün bir kafede tesadüfen karşılaştık. Sen kahveni alırken gözlerimiz buluştu ve dünya bir an durdu. O andan itibaren her şey değişti.",
        lat: 41.0369,
        lng: 28.985,
        foto: null,
    },
    {
        id: 2,
        baslik: "Boğaz'da İlk Yürüyüşümüz 🌅",
        tarih: "3 Mart 2023",
        metin:
            "Bebek sahilinde yürürken güneş batıyordu. Ellerini ilk kez tuttum ve kalbimin ne kadar hızlı attığını hissettim. O an sonsuza kadar sürsün istedim.",
        lat: 41.0797,
        lng: 29.0451,
        foto: null,
    },
    {
        id: 3,
        baslik: "İzmir Kordon'da Akşamüstü 🎡",
        tarih: "15 Haziran 2023",
        metin:
            "İzmir'e ilk birlikte gittiğimiz gün. Kordon'da dondurma yedik, martılara ekmek attık. Gülüşlerin deniz sesine karışıyordu, dünyanın en güzel melodisiydi.",
        lat: 38.4322,
        lng: 27.1384,
        foto: null,
    },
    {
        id: 4,
        baslik: "Kadıköy Sokaklarında Kaybolmak 🎨",
        tarih: "20 Ağustos 2023",
        metin:
            "Kadıköy'ün renkli sokaklarında saatlerce yürüdük. Sokak müzisyenlerini dinledik, vintage dükkanları keşfettik. Seninle kaybolmak bile bir macera.",
        lat: 40.9903,
        lng: 29.0244,
        foto: null,
    },
    {
        id: 5,
        baslik: "Kız Kulesi Manzarası 🏰",
        tarih: "1 Ocak 2024",
        metin:
            "Yeni yılı Üsküdar sahilinde karşıladık. Kız Kulesi'nin ışıkları suya yansırken yeni bir yılın ilk dakikalarını birlikte yaşadık. En güzel başlangıçtı.",
        lat: 41.0211,
        lng: 29.004,
        foto: null,
    },
    {
        id: 6,
        baslik: "Gelecekte Gideceğimiz Yer ✨",
        tarih: null,
        metin:
            "Burası bizim geleceğimiz. Birlikte keşfedeceğimiz yerler, yaşayacağımız anılar ve yazacağımız hikayeler... Hepsi burada başlıyor.",
        lat: 38.4192,
        lng: 27.1287,
        foto: null,
        surpriz: true,
    },
];

// ==========================================
// 💌 FİNAL MESAJI
// Sürpriz noktasında typewriter efektiyle gösterilir
// ==========================================
const finalMesaj = `Damla, seni tanıdığım günden beri hayatım bambaşka bir anlam kazandı. Seninle geçirdiğim her an, bir hazine gibi kalbimde saklı. Gülüşün en kötü günlerimi bile aydınlatıyor, varlığın bana huzur veriyor.

Bazen düşünüyorum da, seni bulmak için tüm o yolları yürümek ne kadar değermiş. Her anımız, her kahkaha, her paylaştığımız sessizlik bile çok kıymetli.

Bu küçük dünyamızda seninle büyüyorum, seninle öğreniyorum, seninle yaşıyorum. Geleceğe dair tek bildiğim, seninle olacağı. Ve bu beni dünyanın en şanslı insanı yapıyor.

Seni çok seviyorum, bugün ve her gün. 💛`;
