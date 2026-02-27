import fetch from 'node-fetch';

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || '';

async function callAppsScript(action: string, method: 'GET' | 'POST' = 'GET', body: any = null) {
  if (!SCRIPT_URL) {
    throw new Error("Google Apps Script URL is not configured. Please set GOOGLE_SCRIPT_URL in your environment variables.");
  }

  const url = `${SCRIPT_URL}?action=${action}`;
  
  try {
    const options: any = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST' && body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Apps Script request failed with status ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Error calling Google Apps Script action '${action}':`, error);
    throw new Error(`Failed to communicate with Google Sheets: ${error.message}`);
  }
}

export const sheetsService = {
  getResidents: () => callAppsScript('getResidents'),
  addResident: (resident: any) => callAppsScript('addResident', 'POST', resident),
  // Tambahkan fungsi lain di sini (getAnnouncements, addLetter, etc.)
};
