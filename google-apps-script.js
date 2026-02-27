const SHEETS = {
  RESIDENTS: 'Residents',
  ANNOUNCEMENTS: 'Announcements',
  LETTERS: 'Letters',
  TRANSACTIONS: 'Transactions',
  REPORTS: 'Reports'
};

const HEADERS = {
  [SHEETS.RESIDENTS]: ['id', 'name', 'nik', 'familyCardNumber', 'address', 'rt', 'rw', 'status', 'phone', 'gender', 'maritalStatus', 'familyRelationship'],
  [SHEETS.ANNOUNCEMENTS]: ['id', 'title', 'date', 'content'],
  [SHEETS.LETTERS]: ['id', 'type', 'resident', 'date', 'status', 'content'],
  [SHEETS.TRANSACTIONS]: ['id', 'type', 'amount', 'date', 'description', 'category'],
  [SHEETS.REPORTS]: ['id', 'residentId', 'residentName', 'title', 'description', 'date', 'status']
};

// Fungsi ini akan dipanggil otomatis untuk membuat sheet dan header jika belum ada
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  for (const sheetName of Object.values(SHEETS)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Cek apakah header sudah ada
    const headers = HEADERS[sheetName];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      // Format header menjadi tebal (bold) dan background abu-abu
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    }
  }
}

function doGet(e) {
  initSheets(); // Pastikan sheet dan header sudah ada
  
  const action = e.parameter.action;
  
  try {
    if (action === 'getResidents') {
      return createJsonResponse(getData(SHEETS.RESIDENTS));
    } else if (action === 'getAnnouncements') {
      return createJsonResponse(getData(SHEETS.ANNOUNCEMENTS));
    } else if (action === 'getLetters') {
      return createJsonResponse(getData(SHEETS.LETTERS));
    } else if (action === 'getTransactions') {
      return createJsonResponse(getData(SHEETS.TRANSACTIONS));
    } else if (action === 'getReports') {
      return createJsonResponse(getData(SHEETS.REPORTS));
    } else {
      return createJsonResponse({ error: 'Unknown action' }, 400);
    }
  } catch (error) {
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

function doPost(e) {
  initSheets(); // Pastikan sheet dan header sudah ada
  
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const data = postData.data;
    
    if (action === 'addResident') {
      return createJsonResponse(addData(SHEETS.RESIDENTS, data));
    } else if (action === 'addAnnouncement') {
      return createJsonResponse(addData(SHEETS.ANNOUNCEMENTS, data));
    } else if (action === 'addLetter') {
      return createJsonResponse(addData(SHEETS.LETTERS, data));
    } else if (action === 'addTransaction') {
      return createJsonResponse(addData(SHEETS.TRANSACTIONS, data));
    } else if (action === 'addReport') {
      return createJsonResponse(addData(SHEETS.REPORTS, data));
    } else if (action === 'updateReportStatus') {
      return createJsonResponse(updateReportStatus(data.id, data.status));
    } else {
      return createJsonResponse({ error: 'Unknown action' }, 400);
    }
  } catch (error) {
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

function getData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  if (values.length <= 1) return []; // Hanya ada header atau kosong
  
  const headers = values[0];
  const rows = values.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function addData(sheetName, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = HEADERS[sheetName];
  
  // Generate ID otomatis
  const lastRow = sheet.getLastRow();
  let newId = 1;
  if (lastRow > 1) {
    const lastId = sheet.getRange(lastRow, 1).getValue();
    newId = Number(lastId) + 1;
  }
  
  data.id = newId;
  
  const rowData = headers.map(header => {
    return data[header] !== undefined ? data[header] : '';
  });
  
  sheet.appendRow(rowData);
  return data;
}

function updateReportStatus(id, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.REPORTS);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // Find the row with the matching ID
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      // Status is the 7th column (index 6)
      sheet.getRange(i + 1, 7).setValue(status);
      return { success: true, id: id, status: status };
    }
  }
  
  return { error: 'Report not found' };
}

function createJsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
