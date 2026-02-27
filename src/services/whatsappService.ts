import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import { sheetsService } from './sheetsService.js';

let sock: any = null;
let qrCodeDataUrl: string | null = null;
let connectionStatus: 'connecting' | 'open' | 'close' = 'close';

export const whatsappService = {
  async initialize() {
    if (connectionStatus === 'connecting' || connectionStatus === 'open') return;
    
    connectionStatus = 'connecting';
    qrCodeDataUrl = null;

    try {
      const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

      sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
      });

      sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          try {
            qrCodeDataUrl = await QRCode.toDataURL(qr);
            console.log('WhatsApp QR Code generated.');
          } catch (err) {
            console.error('Failed to generate QR code', err);
          }
        }

        if (connection === 'close') {
          connectionStatus = 'close';
          qrCodeDataUrl = null;
          const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log('WhatsApp connection closed. Reconnecting:', shouldReconnect);
          if (shouldReconnect) {
            setTimeout(() => this.initialize(), 5000);
          } else {
             // Logged out, clear auth info? In a real app we'd delete the folder.
             console.log('WhatsApp logged out.');
          }
        } else if (connection === 'open') {
          connectionStatus = 'open';
          qrCodeDataUrl = null;
          console.log('✅ WhatsApp Bot connected successfully!');
        }
      });

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('messages.upsert', async (m: any) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') return;

        const messageContent = msg.message.conversation || 
                               msg.message.extendedTextMessage?.text || "";
        
        if (!messageContent) return;

        const senderNumber = msg.key.remoteJid.split('@')[0];
        console.log(`WhatsApp message from ${senderNumber}: ${messageContent}`);

        try {
          // Handle the message using the same logic as GAS
          const reply = await this.handleIncomingMessage(senderNumber, messageContent);
          if (reply) {
            await sock.sendMessage(msg.key.remoteJid, { text: reply });
          }
        } catch (error: any) {
          console.error('Failed to handle WhatsApp message:', error.message);
        }
      });

    } catch (error) {
      console.error('Failed to initialize WhatsApp bot:', error);
      connectionStatus = 'close';
    }
  },

  async handleIncomingMessage(sender: string, message: string): Promise<string | null> {
    try {
      const msgUpper = message.trim().toUpperCase();
      
      // 1. Check if sender is a registered resident
      const residents = await sheetsService.getResidents() as any[];
      const resident = residents.find(r => r.phone === sender || r.phone === '0' + sender.substring(2));
      
      if (!resident) {
        return 'Maaf, nomor Anda belum terdaftar di sistem RT kami. Silakan hubungi pengurus RT atau daftar melalui aplikasi web.';
      }

      const rtCode = resident.rt || "RT01";

      // 2. Menu Logic
      if (msgUpper === 'MENU' || msgUpper === 'PING') {
        return `Halo Bpk/Ibu *${resident.name}* dari *${rtCode}*.\n\n` +
               `Berikut adalah layanan WhatsApp RT:\n` +
               `1. Ketik *LAPOR [Isi Laporan]* untuk melaporkan keluhan/masalah.\n` +
               `   Contoh: LAPOR Lampu jalan di depan rumah mati\n` +
               `2. Ketik *STATUS LAPORAN* untuk melihat status laporan terakhir Anda.\n` +
               `3. Ketik *INFO* untuk melihat pengumuman terbaru.`;
      }

      // 3. Report Logic
      if (msgUpper.startsWith('LAPOR ')) {
        const reportContent = message.substring(6).trim();
        if (reportContent.length < 5) {
          return 'Laporan terlalu singkat. Mohon jelaskan lebih detail.';
        }

        const newReport = {
          residentId: resident.nik || sender,
          residentName: resident.name,
          title: "[WA] Laporan Warga",
          description: reportContent,
          date: new Date().toISOString().split('T')[0],
          status: "Menunggu",
          rt: rtCode
        };

        await sheetsService.addReport(newReport);
        return `✅ Laporan Anda berhasil diterima dan telah masuk ke sistem web pengurus *${rtCode}*.\n\nKetik *STATUS LAPORAN* untuk mengecek perkembangannya nanti.`;
      }

      // 4. Check Report Status
      if (msgUpper === 'STATUS LAPORAN') {
        const reports = await sheetsService.getReports() as any[];
        const userReports = reports.filter(r => r.residentName === resident.name || String(r.residentId) === String(resident.nik)).reverse();
        
        if (userReports.length === 0) {
          return 'Anda belum memiliki laporan.';
        }

        const latest = userReports[0];
        return `*Status Laporan Terakhir Anda:*\n\nTanggal: ${latest.date}\nLaporan: ${latest.description}\nStatus: *${latest.status}*`;
      }

      // 5. Info Logic
      if (msgUpper === 'INFO') {
        const announcements = await sheetsService.getAnnouncements() as any[];
        const rtAnnouncements = announcements.filter(a => String(a.rt).toUpperCase() === rtCode.toUpperCase()).reverse();
        
        if (rtAnnouncements.length === 0) {
          return `Belum ada pengumuman terbaru untuk ${rtCode}.`;
        }

        const latest = rtAnnouncements[0];
        return `*Pengumuman Terbaru ${rtCode}:*\n\n*${latest.title}*\n${latest.date}\n\n${latest.content}`;
      }

      return `Maaf, perintah tidak dikenali. Ketik *MENU* untuk melihat daftar perintah yang tersedia.`;

    } catch (error: any) {
      console.error("Error handling WA message:", error);
      return "Terjadi kesalahan pada sistem saat memproses pesan Anda.";
    }
  },

  getStatus() {
    return {
      status: connectionStatus,
      qr: qrCodeDataUrl
    };
  },
  
  logout() {
    if (sock) {
      sock.logout();
      connectionStatus = 'close';
      qrCodeDataUrl = null;
    }
  }
};
