import fetch from 'node-fetch';

const getScriptUrl = () => {
  const url = process.env.VITE_GOOGLE_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL;
  if (!url) {
    throw new Error("GOOGLE_SCRIPT_URL environment variable not set");
  }
  return url;
};

// --- Residents --- //

async function getResidents() {
  const response = await fetch(`${getScriptUrl()}?action=getResidents`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch residents: ${errorText}`);
  }
  return response.json();
}

async function addResident(resident: any) {
  const response = await fetch(getScriptUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addResident', data: resident }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add resident: ${errorText}`);
  }
  return response.json();
}

// --- Announcements --- //

async function getAnnouncements() {
  const response = await fetch(`${getScriptUrl()}?action=getAnnouncements`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch announcements: ${errorText}`);
  }
  return response.json();
}

async function addAnnouncement(announcement: any) {
  const response = await fetch(getScriptUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addAnnouncement', data: announcement }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add announcement: ${errorText}`);
  }
  return response.json();
}

// --- Letters --- //

async function getLetters() {
  const response = await fetch(`${getScriptUrl()}?action=getLetters`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch letters: ${errorText}`);
  }
  return response.json();
}

async function addLetter(letter: any) {
  const response = await fetch(getScriptUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addLetter', data: letter }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add letter: ${errorText}`);
  }
  return response.json();
}


// --- Transactions --- //

async function getTransactions() {
  const response = await fetch(`${getScriptUrl()}?action=getTransactions`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch transactions: ${errorText}`);
  }
  return response.json();
}

async function addTransaction(transaction: any) {
  const response = await fetch(getScriptUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addTransaction', data: transaction }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add transaction: ${errorText}`);
  }
  return response.json();
}


// --- Reports --- //

async function getReports() {
  const response = await fetch(`${getScriptUrl()}?action=getReports`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch reports: ${errorText}`);
  }
  return response.json();
}

async function addReport(report: any) {
  const response = await fetch(getScriptUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addReport', data: report }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add report: ${errorText}`);
  }
  return response.json();
}

async function updateReportStatus(id: number, status: string) {
  const response = await fetch(getScriptUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateReportStatus', data: { id, status } }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update report status: ${errorText}`);
  }
  return response.json();
}

// --- Admins --- //

async function getAdmins() {
  const response = await fetch(`${getScriptUrl()}?action=getAdmins`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch admins: ${errorText}`);
  }
  return response.json();
}

export const sheetsService = {
  getResidents,
  addResident,
  getAnnouncements,
  addAnnouncement,
  getLetters,
  addLetter,
  getTransactions,
  addTransaction,
  getReports,
  addReport,
  updateReportStatus,
  getAdmins,
};
