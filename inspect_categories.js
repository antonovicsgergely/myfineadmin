const xlsx = require('xlsx');

function checkFile() {
  try {
    const workbook = xlsx.readFile('C:\\AG\\kategoriak.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("Headers:", data[0]);
    console.log("First row:", data[1]);
    console.log("Second row:", data[2]);
    console.log("Third row:", data[3]);
  } catch (err) {
    console.error("Error reading file:", err.message);
  }
}

checkFile();
