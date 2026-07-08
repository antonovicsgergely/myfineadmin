const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFinal() {
  console.log("Kategóriák és Régiók újratöltése a screenshotok alapján...");

  try {
    // Törlés
    await prisma.category.deleteMany({});
    await prisma.region.deleteMany({});
    console.log("Régi adatok törölve.");

    // KATEGÓRIÁK
    const categoryData = {
      "Alapanyagok és Kamra": ["Tészták", "Lisztek", "Rizsek és Gabonák", "Olajok", "Ecetek", "Magkrémek", "Aszalványok", "Savanyúságok", "Konzervált különlegességek"],
      "Lekvárok és Édességek": ["Lekvárok", "Gyümölcskrémek", "Mézek", "Csokoládék", "Bonbonok", "Kekszek", "Mézeskalácsok", "Cukorkák"],
      "Szarvasgomba és Gourmet": ["Szarvasgombás termékek", "Erdei gombák", "Gourmet krémek", "Pástétomok", "Chutney-k", "Gourmet különlegességek"],
      "Szószok és Krémek": ["Chili szószok", "Gourmet szószok", "Krémek", "Mustárok", "Szendvicskrémek", "Mártások"],
      "Fűszerek": ["Fűszerpaprika", "Chili termékek", "Fűszerkeverékek", "Sók", "Grillfűszerek"],
      "Kézműves italok": ["Szörpök", "Gyümölcsitalok", "Kézműves üdítők"],
      "Kávé és Tea": ["Kávék", "Specialty kávék", "Teák", "Gyógyteák", "Gyümölcsteák"],
      "Kiegészítők": []
    };

    for (const [main, subs] of Object.entries(categoryData)) {
      const parent = await prisma.category.create({ data: { name: main } });
      for (const sub of subs) {
        await prisma.category.create({
          data: {
            name: sub,
            parentId: parent.id
          }
        });
      }
    }
    console.log("Új kategóriák sikeresen létrehozva.");

    // RÉGIÓK
    const regions = ["Erdély", "Felvidék", "Őrség", "Balaton-felvidék", "Kárpátalja", "Vajdaság"];
    for (const r of regions) {
      await prisma.region.create({ data: { name: r } });
    }
    console.log("Új régiók sikeresen létrehozva.");

  } catch (e) {
    console.error("Hiba történt:", e);
  } finally {
    await prisma.$disconnect();
  }
}

seedFinal();
