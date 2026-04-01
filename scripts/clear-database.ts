import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log("🧹 Veritabanını temizleniyor...");

  try {
    // Tüm verileri sil
    await prisma.trade.deleteMany({});
    await prisma.journalEntry.deleteMany({});
    await prisma.strategy.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("✅ Tüm veriler silindi");

    // Demo kullanıcıyı yeniden oluştur
    const user = await prisma.user.create({
      data: {
        id: "demo",
        name: "Demo Kullanıcı",
        email: "demo@tradediwan.com"
      }
    });

    console.log("👤 Demo kullanıcı yeniden oluşturuldu:", user.name);

    // Temel stratejileri yeniden oluştur
    const strategies = [
      {
        name: "Breakout",
        description: "Fiyat kırılımlarını takip eden strateji",
        rules: "Destek/direnç seviyelerinin kırılmasını bekle, hacim onayı al",
      },
      {
        name: "Scalping", 
        description: "Kısa vadeli hızlı işlemler",
        rules: "1-5 dakikalık işlemler, sıkı stop loss, yüksek kazanma oranı",
      },
      {
        name: "Swing Trading",
        description: "Orta vadeli trend takibi",
        rules: "Günlük/haftalık grafik analizi, geniş stop loss",
      },
      {
        name: "Momentum",
        description: "Güçlü hareket yönünde pozisyon alma",
        rules: "Trend doğrultusunda pullback'lerde giriş, hacim takibi",
      },
    ];

    for (const strategy of strategies) {
      await prisma.strategy.create({
        data: strategy
      });
    }

    console.log("📚 Temel stratejiler oluşturuldu");
    console.log("\n🎉 Veritabanı temizlendi ve hazırlandı!");
    console.log("Uygulama artık sıfırdan başlayacak.");

  } catch (error) {
    console.error("❌ Temizleme sırasında hata:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
