function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById("YOUR_SPREADSHEET_ID"); // GANTI DENGAN ID SPREADSHEET ANDA

  if (action == "getResidents") {
    const ws = ss.getSheetByName("Warga");
    const data = ws.getRange(2, 1, ws.getLastRow() - 1, 9).getValues();
    const residents = data.map(r => ({
      id: r[0],
      name: r[1],
      nik: r[2],
      address: r[3],
      rt: r[4],
      rw: r[5],
      status: r[6],
      phone: r[7],
      gender: r[8]
    }));
    return ContentService.createTextOutput(JSON.stringify(residents)).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Tambahkan fungsi lain (getAnnouncements, getLetters, etc.) di sini

  return ContentService.createTextOutput(JSON.stringify({error: "Action not found"})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById("YOUR_SPREADSHEET_ID"); // GANTI DENGAN ID SPREADSHEET ANDA
  const body = JSON.parse(e.postData.contents);

  if (action == "addResident") {
    const ws = ss.getSheetByName("Warga");
    const newId = ws.getLastRow() + 1;
    ws.appendRow([
      newId,
      body.name,
      body.nik,
      body.address,
      body.rt,
      body.rw,
      body.status,
      body.phone,
      body.gender
    ]);
    return ContentService.createTextOutput(JSON.stringify({status: "success", id: newId})).setMimeType(ContentService.MimeType.JSON);
  }

  // Tambahkan fungsi lain (addAnnouncement, updateResident, etc.) di sini

  return ContentService.createTextOutput(JSON.stringify({error: "Action not found"})).setMimeType(ContentService.MimeType.JSON);
}
