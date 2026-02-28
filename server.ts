import express from "express";
import { sheetsService } from "./src/services/sheetsService.js";
import path from "path";
import fs from "fs";
import mcache from 'memory-cache';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Helper: Generate Surat Pengantar PDF ---
async function generateSuratPengantarPDF(resident: any, keperluan: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: any[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData.toString('base64'));
        });

        // --- Header ---
        doc.font('Helvetica-Bold').fontSize(14).text(`RUKUN TETANGGA ${resident.rt} / RUKUN WARGA ${resident.rw}`, { align: 'center' });
        doc.text('KELURAHAN [NAMA KELURAHAN]', { align: 'center' });
        doc.text('KECAMATAN [NAMA KECAMATAN]', { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // --- Title ---
        doc.font('Helvetica-Bold').fontSize(16).text('SURAT PENGANTAR', { align: 'center', underline: true });
        doc.fontSize(12).text(`Nomor: .../${resident.rt}/${new Date().getFullYear()}`, { align: 'center' });
        doc.moveDown(2);

        // --- Body ---
        doc.font('Helvetica').fontSize(12).text('Yang bertanda tangan di bawah ini Ketua RT ' + resident.rt + ' RW ' + resident.rw + ', menerangkan bahwa:', { align: 'justify' });
        doc.moveDown(1);

        const startX = 70;
        const labelWidth = 120;
        const valueX = startX + labelWidth;

        function addField(label: string, value: string) {
            const y = doc.y;
            doc.text(label, startX, y);
            doc.text(':', startX + labelWidth - 10, y);
            doc.text(value, valueX, y);
            doc.moveDown(0.5);
        }

        addField('Nama Lengkap', resident.name);
        addField('NIK', resident.nik);
        addField('Jenis Kelamin', resident.gender);
        addField('Status Perkawinan', resident.maritalStatus);
        addField('Pekerjaan', '-'); // Placeholder if not in DB
        addField('Alamat', resident.address);

        doc.moveDown(1);
        doc.text(`Orang tersebut di atas adalah benar-benar warga kami yang berdomisili di lingkungan RT ${resident.rt} RW ${resident.rw}.`, { align: 'justify' });
        doc.moveDown(0.5);
        doc.text(`Surat pengantar ini diberikan untuk keperluan:`, { align: 'justify' });
        doc.font('Helvetica-Bold').text(keperluan, { indent: 20 });
        doc.font('Helvetica').moveDown(1);
        doc.text('Demikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.', { align: 'justify' });
        
        // --- Footer (Signature) ---
        doc.moveDown(3);
        const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const signatureX = 350;
        doc.text(`Jakarta, ${date}`, signatureX, doc.y);
        doc.text(`Ketua RT ${resident.rt}`, signatureX, doc.y + 15);
        doc.moveDown(4);
        doc.text('( .................................... )', signatureX, doc.y);

        doc.end();
    });
}

// --- Google Sheets API Routes ---

  app.get("/api/residents", async (req, res) => {
    try {
      console.log("API_LOG: Fetching all residents from Google Sheets");
      const residents = await sheetsService.getResidents() as any[];
      console.log(`API_LOG: Successfully fetched ${residents.length} residents`);
      res.json(residents);
    } catch (error: any) {
      console.error("API_LOG_ERROR: Failed to fetch residents from Google Sheets:", error);
      res.status(500).json({ error: "Failed to fetch residents", details: error.message || String(error) });
    }
  });

  app.post("/api/residents", async (req, res) => {
    try {
      console.log("API_LOG: Adding new resident to Google Sheets");
      const newResident = req.body;
      const result = await sheetsService.addResident(newResident);
      console.log("API_LOG: Successfully added resident");
      res.json(result);
    } catch (error: any) {
      console.error("API_LOG_ERROR: Failed to add resident to Google Sheets:", error);
      res.status(500).json({ error: "Failed to add resident", details: error.message || String(error) });
    }
  });

  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await sheetsService.getAnnouncements();
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch announcements", details: error.message });
    }
  });

  app.post("/api/announcements", async (req, res) => {
    try {
      const newAnnouncement = req.body;
      const result = await sheetsService.addAnnouncement(newAnnouncement);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to add announcement", details: error.message });
    }
  });

  app.get("/api/letters", async (req, res) => {
    try {
      const letters = await sheetsService.getLetters();
      res.json(letters);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch letters", details: error.message });
    }
  });

  app.post("/api/letters", async (req, res) => {
    try {
      const newLetter = req.body;
      const result = await sheetsService.addLetter(newLetter);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to add letter", details: error.message });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await sheetsService.getTransactions();
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch transactions", details: error.message });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const newTransaction = req.body;
      const result = await sheetsService.addTransaction(newTransaction);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to add transaction", details: error.message });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await sheetsService.getReports();
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch reports", details: error.message });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const newReport = { ...req.body, status: 'Menunggu' };
      const result = await sheetsService.addReport(newReport);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to add report", details: error.message });
    }
  });

  app.patch("/api/reports/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await sheetsService.updateReportStatus(Number(id), status);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update report status", details: error.message });
    }
  });

  app.get("/api/admins", async (req, res) => {
    try {
      const admins = await sheetsService.getAdmins();
      res.json(admins);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch admins", details: error.message });
    }
  });

  // --- WhatsApp Bot Routes (Proxy to VPS) ---
  
  // Use environment variable for Vercel, fallback to in-memory for local dev
  let currentVpsWaUrl = process.env.VITE_VPS_URL || process.env.VPS_WA_URL || '';

  app.get("/api/vps-url", (req, res) => {
    res.json({ url: currentVpsWaUrl });
  });

  app.post("/api/vps-url", (req, res) => {
    const { url } = req.body;
    currentVpsWaUrl = url;
    // Note: This won't persist across Vercel serverless function cold starts.
    // Users MUST set VITE_VPS_URL in their Vercel dashboard.
    res.json({ message: "URL VPS WhatsApp berhasil disimpan sementara. Untuk permanen, atur VITE_VPS_URL di Vercel." });
  });

  app.post("/api/whatsapp/start", async (req, res) => {
    const targetUrl = currentVpsWaUrl || process.env.VITE_VPS_URL;
    console.log(`[API] Starting WhatsApp Bot. Target URL: ${targetUrl}`);
    
    if (!targetUrl) {
        console.error('[API] Error: URL VPS belum diatur');
        return res.status(400).json({ error: 'URL VPS belum diatur' });
    }

    try {
      const baseUrl = targetUrl.replace(/\/$/, '');
      
      // Determine unique session ID for this deployment
      // Priority: Env Var > Hostname > Default 'session_default'
      let sessionId = process.env.WA_SESSION_ID;
      if (!sessionId && req.headers.host) {
          sessionId = req.headers.host.replace(/[^a-zA-Z0-9]/g, '_'); // Sanitize hostname
      }
      if (!sessionId) sessionId = 'session_default';

      // Determine this app's webhook URL
      // Priority: Env Var > Constructed from Host header
      let webhookUrl = process.env.APP_URL;
      if (!webhookUrl && req.headers.host) {
          const protocol = req.headers.host.includes('localhost') ? 'http' : 'https';
          webhookUrl = `${protocol}://${req.headers.host}`;
      }
      webhookUrl = `${webhookUrl}/api/whatsapp/webhook`;

      console.log(`[API] Initializing session: ${sessionId}`);
      console.log(`[API] Webhook URL: ${webhookUrl}`);
      console.log(`[API] Sending POST request to: ${baseUrl}/session/start`);
      
      const response = await fetch(`${baseUrl}/session/start`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              sessionId: sessionId,
              webhookUrl: webhookUrl
          })
      });
      
      console.log(`[API] VPS Response Status: ${response.status}`);
      
      if (!response.ok) {
          const errorText = await response.text();
          console.error(`[API] VPS Error Response: ${errorText}`);
          throw new Error(`VPS returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`[API] VPS Success Response:`, data);
      res.json(data);
    } catch (error: any) {
      console.error(`[API] Failed to start bot:`, error);
      res.status(500).json({ error: `Gagal memulai bot di VPS: ${error.message}` });
    }
  });

  app.get("/api/whatsapp/status", async (req, res) => {
    const targetUrl = currentVpsWaUrl || process.env.VITE_VPS_URL;
    if (!targetUrl) return res.json({ status: 'close', qr: null });
    
    try {
      const baseUrl = targetUrl.replace(/\/$/, '');
      
      // Determine unique session ID (same logic as start)
      let sessionId = process.env.WA_SESSION_ID;
      if (!sessionId && req.headers.host) {
          sessionId = req.headers.host.replace(/[^a-zA-Z0-9]/g, '_');
      }
      if (!sessionId) sessionId = 'session_default';

      // Call session-specific status endpoint
      const response = await fetch(`${baseUrl}/session/${sessionId}/status`);
      
      if (!response.ok) {
          // Fallback to global status if session endpoint fails (backward compatibility)
          const fallbackResponse = await fetch(`${baseUrl}/status`);
          if (fallbackResponse.ok) {
              const data = await fallbackResponse.json();
              return res.json(data);
          }
          throw new Error(`VPS returned ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.json({ status: 'error', qr: null, message: `Gagal terhubung ke VPS: ${error.message}` });
    }
  });

  app.post("/api/whatsapp/logout", async (req, res) => {
    const targetUrl = currentVpsWaUrl || process.env.VITE_VPS_URL;
    if (!targetUrl) return res.status(400).json({ error: 'URL VPS belum diatur' });
    
    try {
      const baseUrl = targetUrl.replace(/\/$/, '');
      
      // Determine unique session ID
      let sessionId = process.env.WA_SESSION_ID;
      if (!sessionId && req.headers.host) {
          sessionId = req.headers.host.replace(/[^a-zA-Z0-9]/g, '_');
      }
      if (!sessionId) sessionId = 'session_default';

      const response = await fetch(`${baseUrl}/session/${sessionId}/logout`, { method: 'POST' });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: `Gagal logout bot di VPS: ${error.message}` });
    }
  });

  // --- Webhook from VPS ---
  app.post("/api/whatsapp/webhook", async (req, res) => {
    console.log("Received webhook from VPS:", req.body);
    try {
      const { sender, message } = req.body;
      if (!sender || !message) {
        console.error("Invalid payload received:", req.body);
        return res.status(400).json({ error: "Invalid payload" });
      }

      const msgUpper = message.trim().toUpperCase();
      console.log(`Processing message from ${sender}: '${msgUpper}'`);
      
      const residents = await sheetsService.getResidents() as any[];
      
      // Clean sender number (remove linked device ID like :1, :2, and non-digits)
      let cleanSender = String(sender).split(':')[0].replace(/\D/g, '');
      
      // Handle case where sender starts with '2' but is actually '62' (some providers/devices weirdness)
      // OR handle if it's a different country code.
      // Based on logs: 210243044823113 -> This looks like a very long number or a specific ID.
      // If it's a WhatsApp ID that doesn't match phone number directly, we might need to rely on registration.
      
      // Standardize to 62 format if possible
      if (cleanSender.startsWith('0')) {
          cleanSender = '62' + cleanSender.substring(1);
      }

      const senderAsZero = cleanSender.startsWith('62') ? '0' + cleanSender.substring(2) : cleanSender;
      const senderAs62 = cleanSender.startsWith('0') ? '62' + cleanSender.substring(1) : cleanSender;

      console.log(`Debug Phone Matching:
        - Original Sender: ${sender}
        - Clean Sender: ${cleanSender}
        - As Zero: ${senderAsZero}
        - As 62: ${senderAs62}
      `);

      // --- CEKID Command (Available for Unregistered Users) ---
      if (msgUpper === 'CEKID') {
          return res.json({ reply: `ID WhatsApp Anda: ${cleanSender}\n\nSilakan salin ID ini dan masukkan ke kolom 'phone' di data warga jika nomor biasa tidak terdeteksi.` });
      }

      const resident = residents.find(r => {
        if (!r.phone) return false;
        
        // Support multiple numbers separated by comma
        const dbPhones = String(r.phone).split(',').map(p => {
            const raw = p.trim();
            const clean = raw.replace(/\D/g, '');
            // Standardize to 62 format
            if (clean.startsWith('0')) return '62' + clean.substring(1);
            return clean;
        });

        // Check if ANY of the numbers match the sender
        const match = dbPhones.some(dbPhone => {
             // Exact match
             if (dbPhone === cleanSender || dbPhone === senderAsZero || dbPhone === senderAs62) return true;
             
             // Fuzzy match for LIDs (sometimes they have extra digits or suffix)
             // Check if one contains the other (only if length > 10 to avoid false positives with short numbers)
             if (cleanSender.length > 10 && dbPhone.length > 10) {
                 return cleanSender.includes(dbPhone) || dbPhone.includes(cleanSender);
             }
             return false;
        });
        
        if (match) {
            console.log(`Match Found! Resident: ${r.name}`);
        }
        return match;
      });

      if (!resident) {
        console.log(`Unregistered number: ${sender}`);
        
        // Check if message is a phone number (for verification)
        const potentialPhone = message.replace(/\D/g, '');
        if (potentialPhone.length >= 10 && potentialPhone.length <= 15) {
            // Try to find resident with this phone number
            const targetResident = residents.find(r => {
                if (!r.phone) return false;
                const dbPhones = String(r.phone).split(',').map(p => p.trim().replace(/\D/g, ''));
                
                let checkPhone = potentialPhone;
                if (checkPhone.startsWith('0')) checkPhone = '62' + checkPhone.substring(1);
                
                return dbPhones.some(dbPhone => {
                    let normDb = dbPhone;
                    if (normDb.startsWith('0')) normDb = '62' + normDb.substring(1);
                    return normDb === checkPhone;
                });
            });

            if (targetResident) {
                // Update resident phone with new sender ID
                try {
                    const newPhoneList = `${targetResident.phone}, ${cleanSender}`;
                    await sheetsService.updateResidentPhone(targetResident.nik, newPhoneList);
                    return res.json({ reply: `✅ Terima kasih Bpk/Ibu *${targetResident.name}*. Nomor WhatsApp Anda (${cleanSender}) telah berhasil ditautkan.\n\nSekarang Anda bisa menggunakan layanan bot ini. Ketik *MENU* untuk memulai.` });
                } catch (err) {
                    console.error("Failed to update phone:", err);
                    return res.json({ reply: "Maaf, terjadi kesalahan saat menyimpan data. Silakan coba lagi nanti." });
                }
            }
        }

        return res.json({ reply: `Maaf, nomor WhatsApp ini (${cleanSender}) belum terdaftar.\n\nJika Anda warga RT kami, silakan balas pesan ini dengan mengetik **Nomor HP Anda yang terdaftar** (contoh: 08123456789) untuk verifikasi otomatis.` });
      }

      const rtCode = resident.rt || "RT01";
      console.log(`Resident found: ${resident.name} (${rtCode})`);

      if (msgUpper === 'MENU' || msgUpper === 'PING') {
        return res.json({ reply: `Halo Bpk/Ibu *${resident.name}* dari *${rtCode}*.\n\nBerikut adalah layanan WhatsApp RT:\n1. Ketik *LAPOR [Isi Laporan]* untuk melaporkan keluhan/masalah.\n2. Ketik *STATUS LAPORAN* untuk melihat status laporan terakhir Anda.\n3. Ketik *SURAT [Keperluan]* untuk membuat Surat Pengantar otomatis.\n4. Ketik *INFO* untuk melihat pengumuman terbaru.` });
      }

      // Handle SURAT command (more robust matching)
      if (msgUpper.startsWith('SURAT')) {
        // Remove 'SURAT' and trim any leading non-alphanumeric chars (like space, newline, :)
        let keperluan = message.substring(5).trim();
        // Remove potential separator like ':' if user typed 'SURAT: ...'
        if (keperluan.startsWith(':')) keperluan = keperluan.substring(1).trim();

        if (keperluan.length < 3) {
            return res.json({ reply: 'Mohon jelaskan keperluan surat pengantar. Contoh: SURAT Pembuatan KTP' });
        }

        try {
            console.log(`Generating PDF for ${resident.name}, keperluan: ${keperluan}`);
            const pdfBase64 = await generateSuratPengantarPDF(resident, keperluan);
            const fileName = `Surat_Pengantar_${resident.name.replace(/\s+/g, '_')}.pdf`;
            
            return res.json({
                reply: `✅ Surat Pengantar Anda telah berhasil dibuat.\n\nSilakan unduh dokumen berikut dan cetak untuk ditandatangani oleh Ketua RT/RW.`,
                document: pdfBase64,
                fileName: fileName,
                mimeType: 'application/pdf'
            });
        } catch (error: any) {
            console.error('Error generating PDF:', error);
            return res.json({ reply: 'Maaf, terjadi kesalahan saat membuat surat pengantar. Silakan coba lagi nanti.' });
        }
      }

      // Handle Image Messages (Treat as Report automatically if image is present)
      if (req.body.image) {
        console.log("Image received. Processing as report...");
        let reportContent = message;
        
        // Remove 'LAPOR' prefix if present to avoid duplication
        if (msgUpper.startsWith('LAPOR ')) {
            reportContent = message.substring(6).trim();
        } else if (msgUpper === '[FOTO]') {
            reportContent = ""; // Default to empty if just [Foto] placeholder
        }

        const newReport = {
          residentId: resident.nik || sender,
          residentName: resident.name,
          title: "[WA] Laporan Foto",
          description: reportContent || "[Melampirkan Foto]",
          date: new Date().toISOString().split('T')[0],
          status: "Menunggu",
          rt: rtCode,
          image: req.body.image
        };
        
        console.log("Adding new report with image");
        try {
            await sheetsService.addReport(newReport);
            return res.json({ reply: `✅ Foto laporan Anda berhasil diterima dan telah masuk ke sistem web pengurus *${rtCode}*.\n\nKetik *STATUS LAPORAN* untuk mengecek perkembangannya nanti.` });
        } catch (err: any) {
            console.error("Failed to add image report:", err);
            return res.json({ reply: `Maaf, terjadi kesalahan saat menyimpan foto laporan Anda. Pastikan sistem Google Sheet telah diperbarui.\nError: ${err.message}` });
        }
      }

      if (msgUpper.startsWith('LAPOR ')) {
        const reportContent = message.substring(6).trim();
        if (reportContent.length < 5) {
            return res.json({ reply: 'Laporan terlalu singkat. Mohon jelaskan lebih detail.' });
        }

        const newReport = {
          residentId: resident.nik || sender,
          residentName: resident.name,
          title: "[WA] Laporan Warga",
          description: reportContent,
          date: new Date().toISOString().split('T')[0],
          status: "Menunggu",
          rt: rtCode,
          image: "" 
        };
        
        console.log("Adding new report (text only)");
        try {
            await sheetsService.addReport(newReport);
            return res.json({ reply: `✅ Laporan Anda berhasil diterima dan telah masuk ke sistem web pengurus *${rtCode}*.\n\nKetik *STATUS LAPORAN* untuk mengecek perkembangannya nanti.` });
        } catch (err: any) {
            console.error("Failed to add text report:", err);
            return res.json({ reply: `Maaf, terjadi kesalahan saat menyimpan laporan Anda.\nError: ${err.message}` });
        }
      }

      if (msgUpper === 'STATUS LAPORAN') {
        const reports = await sheetsService.getReports() as any[];
        const userReports = reports.filter(r => r.residentName === resident.name || String(r.residentId) === String(resident.nik)).reverse();
        if (userReports.length === 0) return res.json({ reply: 'Anda belum memiliki laporan.' });
        const latest = userReports[0];
        return res.json({ reply: `*Status Laporan Terakhir Anda:*\n\nTanggal: ${latest.date}\nLaporan: ${latest.description}\nStatus: *${latest.status}*` });
      }

      if (msgUpper === 'INFO') {
        const announcements = await sheetsService.getAnnouncements() as any[];
        const rtAnnouncements = announcements.filter(a => String(a.rt).toUpperCase() === rtCode.toUpperCase()).reverse();
        if (rtAnnouncements.length === 0) return res.json({ reply: `Belum ada pengumuman terbaru untuk ${rtCode}.` });
        const latest = rtAnnouncements[0];
        return res.json({ reply: `*Pengumuman Terbaru ${rtCode}:*\n\n*${latest.title}*\n${latest.date}\n\n${latest.content}` });
      }

      return res.json({ reply: `Maaf, perintah tidak dikenali. Ketik *MENU* untuk melihat daftar perintah yang tersedia.` });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- Configuration Routes ---
  
  // Use environment variable for Vercel, fallback to in-memory for local dev
  let currentGoogleScriptUrl = process.env.VITE_GOOGLE_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL || '';

  app.get("/api/script-url", (req, res) => {
    res.json({ url: currentGoogleScriptUrl });
  });

  app.post("/api/script-url", (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Google Apps Script URL is required" });
    }
    currentGoogleScriptUrl = url;
    process.env.GOOGLE_SCRIPT_URL = url; // Set for the current session
    // Note: This won't persist across Vercel serverless function cold starts.
    // Users MUST set VITE_GOOGLE_SCRIPT_URL in their Vercel dashboard.
    res.json({ message: "URL berhasil disimpan sementara. Untuk permanen, atur VITE_GOOGLE_SCRIPT_URL di Vercel." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    import('vite').then(async ({ createServer: createViteServer }) => {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);

      const PORT = 3000;
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    });
  } else {
    // Serve React App in production
    const clientBuildPath = path.join(__dirname, 'dist');
    if (fs.existsSync(clientBuildPath)) {
      app.use(express.static(clientBuildPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
      });
    }
  }

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

export default app;






















