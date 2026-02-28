// --- KONFIGURASI ---
// Ganti ID Spreadsheet ini dengan ID Spreadsheet Anda yang sebenarnya
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID"; 
// Ganti ID Folder Drive ini dengan ID Folder tempat menyimpan foto laporan (Opsional, jika kosong akan di root)
const UPLOAD_FOLDER_ID = ""; 

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  if (action == "getResidents") {
    return getData(ss, "Warga");
  } else if (action == "getAnnouncements") {
    return getData(ss, "Pengumuman");
  } else if (action == "getLetters") {
    return getData(ss, "Surat");
  } else if (action == "getTransactions") {
    return getData(ss, "Keuangan");
  } else if (action == "getReports") {
    return getData(ss, "Laporan");
  } else if (action == "getAdmins") {
    return getData(ss, "Admin");
  }

  return responseJSON({ error: "Action not found" });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const data = body.data;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action == "addResident") {
      return addRow(ss, "Warga", data);
    } else if (action == "updateResidentPhone") {
      return updateResidentPhone(ss, data.nik, data.phone);
    } else if (action == "addAnnouncement") {
      return addRow(ss, "Pengumuman", data);
    } else if (action == "addLetter") {
      return addRow(ss, "Surat", data);
    } else if (action == "addTransaction") {
      return addRow(ss, "Keuangan", data);
    } else if (action == "addReport") {
      return addReport(ss, data);
    } else if (action == "updateReportStatus") {
      return updateReportStatus(ss, data.id, data.status);
    }

    return responseJSON({ error: "Action not found" });
  } catch (error) {
    return responseJSON({ error: error.toString() });
  }
}

// --- HELPER FUNCTIONS ---

function getData(ss, sheetName) {
  const ws = ss.getSheetByName(sheetName);
  if (!ws) return responseJSON([]);
  
  const lastRow = ws.getLastRow();
  if (lastRow < 2) return responseJSON([]); // No data (only header)

  const headers = ws.getRange(1, 1, 1, ws.getLastColumn()).getValues()[0];
  const data = ws.getRange(2, 1, lastRow - 1, ws.getLastColumn()).getValues();

  const result = data.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      // Convert header to camelCase key (e.g., "Nama Lengkap" -> "namaLengkap")
      // Simple conversion: lowercase and remove spaces for simplicity in this example
      // Ideally, match headers to expected keys.
      // For this example, we assume headers in sheet match keys or we map by index.
      // Let's map by index based on standard schema.
      obj[getHeaderKey(sheetName, index)] = row[index];
    });
    return obj;
  });

  return responseJSON(result);
}

function getHeaderKey(sheetName, index) {
  // Mapping index to key based on sheet
  const schemas = {
    "Warga": ["id", "name", "nik", "address", "rt", "rw", "status", "phone", "gender", "maritalStatus"],
    "Pengumuman": ["id", "title", "content", "date", "rt"],
    "Surat": ["id", "residentName", "type", "status", "date", "rt"],
    "Keuangan": ["id", "type", "amount", "category", "description", "date", "rt"],
    "Laporan": ["id", "residentId", "residentName", "title", "description", "date", "status", "rt", "image"],
    "Admin": ["id", "username", "password", "role", "rtId", "name"]
  };
  
  const keys = schemas[sheetName] || [];
  return keys[index] || `col${index}`;
}

function addRow(ss, sheetName, data) {
  const ws = ss.getSheetByName(sheetName);
  const newId = ws.getLastRow() == 0 ? 1 : (ws.getLastRow() < 2 ? 1 : ws.getRange(ws.getLastRow(), 1).getValue() + 1);
  
  // Prepare row data based on schema
  const keys = getHeaderKey(sheetName, -1); // Dummy call to get schema keys logic if needed, but here we construct array
  // Better: construct array based on schema order
  const schema = {
    "Warga": ["name", "nik", "address", "rt", "rw", "status", "phone", "gender", "maritalStatus"],
    "Pengumuman": ["title", "content", "date", "rt"],
    "Surat": ["residentName", "type", "status", "date", "rt"],
    "Keuangan": ["type", "amount", "category", "description", "date", "rt"],
    // Laporan handled separately
  };

  if (!schema[sheetName]) return responseJSON({ error: "Schema not found" });

  const rowData = [newId];
  schema[sheetName].forEach(key => {
    rowData.push(data[key] || "");
  });

  ws.appendRow(rowData);
  return responseJSON({ status: "success", id: newId });
}

function addReport(ss, data) {
  const ws = ss.getSheetByName("Laporan");
  // If ID is not number (e.g. header), start at 1
  let lastId = 0;
  if (ws.getLastRow() > 1) {
      lastId = Number(ws.getRange(ws.getLastRow(), 1).getValue()) || 0;
  }
  const newId = lastId + 1;

  let imageUrl = "";
  if (data.image) {
    try {
      // Decode Base64
      const blob = Utilities.newBlob(Utilities.base64Decode(data.image), "image/jpeg", `report_${newId}.jpg`);
      
      // Save to Drive
      let folder;
      if (UPLOAD_FOLDER_ID) {
        folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
      } else {
        folder = DriveApp.getRootFolder();
      }
      
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      imageUrl = file.getDownloadUrl(); // Or file.getUrl() for viewer link
    } catch (e) {
      imageUrl = "Error saving image: " + e.toString();
    }
  }

  ws.appendRow([
    newId,
    data.residentId,
    data.residentName,
    data.title,
    data.description,
    data.date,
    data.status,
    data.rt,
    imageUrl // Column 9
  ]);

  return responseJSON({ status: "success", id: newId, imageUrl: imageUrl });
}

function updateReportStatus(ss, id, status) {
  const ws = ss.getSheetByName("Laporan");
  const data = ws.getDataRange().getValues();
  
  // Find row with ID (Column 0)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      // Status is at index 6 (Column G -> 7th column)
      ws.getRange(i + 1, 7).setValue(status);
      return responseJSON({ status: "success" });
    }
  }
  return responseJSON({ error: "Report not found" });
}

function updateResidentPhone(ss, nik, newPhone) {
  const ws = ss.getSheetByName("Warga");
  const data = ws.getDataRange().getValues();
  
  // Find row with NIK (Column 2 -> Index 2)
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] == nik) {
      // Phone is at index 7 (Column H -> 8th column)
      ws.getRange(i + 1, 8).setValue(newPhone);
      return responseJSON({ status: "success" });
    }
  }
  return responseJSON({ error: "Resident not found" });
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
