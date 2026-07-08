const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function importCategories() {
  console.log("Kategóriák beolvasása innen: C:\\AG\\kategoriak.xls...");
  try {
    const workbook = xlsx.readFile('C:\\AG\\kategoriak.xls');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    if (!data || data.length === 0) {
      console.log("Üres az Excel fájl!");
      return;
    }

    console.log(`Fájl beolvasva. Sorok száma: ${data.length}`);
    
    // Töröljük a régi dummy adatokat
    await prisma.category.deleteMany({});
    console.log("Régi kategóriák törölve.");

    // Feltételezzük, hogy a struktúra oszlopok alapján épül fel.
    // pl: Főkategória, Alkategória1, Alkategória2...
    
    const categoryMap = new Map(); // Név alapján tároljuk az ID-kat, hogy megtaláljuk a szülőt
    
    // Kezdjük az 1-es indextől (0 = fejléc)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      let parentId = null;
      
      // Végigmegyünk az oszlopokon (szinteken)
      for (let level = 0; level < row.length; level++) {
        const catName = row[level] ? row[level].toString().trim() : "";
        if (!catName) continue; // Ha üres, átlépjük
        
        const mapKey = `${level}-${catName}-${parentId || 'root'}`;
        
        if (categoryMap.has(mapKey)) {
          parentId = categoryMap.get(mapKey);
        } else {
          // Ha még nincs ilyen a DB-ben, hozzuk létre
          const existing = await prisma.category.findUnique({ where: { name: catName } });
          let catId;
          
          if (existing) {
             catId = existing.id;
             // Lehet, hogy már van ilyen név, de másik szülővel? A findUnique elhasalna ha több lenne, 
             // de most feltételezzük, hogy egyedi nevek vannak az excelben, vagy ha nem, 
             // a schema @unique miatt csak 1 lehet. 
          } else {
            const created = await prisma.category.create({
              data: {
                name: catName,
                parentId: parentId
              }
            });
            catId = created.id;
          }
          
          categoryMap.set(mapKey, catId);
          parentId = catId; // A következő szintnek ez lesz a szülője
        }
      }
    }
    
    console.log("Kategóriák importálása sikeres!");

  } catch (err) {
    console.error("Hiba történt:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

importCategories();
