#!/usr/bin/env node
/* eslint-disable */
'use strict';

/**
 * WhatsApp Web worker — child process isolated from Next.js.
 * Communication with parent: IPC via process.send / process.on('message')
 * State persistence: .whatsapp-sessions/<unitId>/state.json
 */

const fs   = require('fs');
const path = require('path');

const unitId = process.argv[2];
if (!unitId) { process.stderr.write('unitId required\n'); process.exit(1); }

const sessionsDir = path.join(process.cwd(), '.whatsapp-sessions', unitId);
fs.mkdirSync(sessionsDir, { recursive: true });

const stateFile = path.join(sessionsDir, 'state.json');

function writeState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state), 'utf8');
}

writeState({ status: 'connecting', unitId });

let currentSock = null;

// Maps LID (non-phone WhatsApp identifier) → phone number (digits only).
// Newer WhatsApp multi-device sends @lid JIDs instead of phone-based JIDs.
const lidToPhone = new Map();

// Handler unificado de mensagens IPC do processo pai
process.on('message', async (msg) => {
  if (!msg || !msg.action) return;

  if (msg.action === 'disconnect') {
    if (currentSock) {
      currentSock.logout().catch(() => {}).finally(() => {
        writeState({ status: 'disconnected' });
        process.exit(0);
      });
    } else {
      writeState({ status: 'disconnected' });
      process.exit(0);
    }
  }

  if (msg.action === 'send' && msg.to && msg.text) {
    if (!currentSock) {
      if (process.send) process.send({ ok: false, error: 'not connected' });
      return;
    }
    const jid = msg.to.includes('@') ? msg.to : `${msg.to.replace(/\D/g, '')}@s.whatsapp.net`;
    try {
      await currentSock.sendMessage(jid, { text: msg.text });
      if (process.send) process.send({ ok: true, to: msg.to });
    } catch (err) {
      if (process.send) process.send({ ok: false, error: err.message });
    }
  }

  // Resposta da IA: envia pelo WhatsApp assim que chegar — sem timeout
  if (msg.action === 'ai-reply' && msg.phone && msg.reply) {
    if (!currentSock) return;
    try {
      const jid = `${msg.phone.replace(/\D/g, '')}@s.whatsapp.net`;
      await currentSock.sendMessage(jid, { text: msg.reply });
      await saveOutboundMessage(msg.phone, msg.reply);
    } catch (err) {
      process.stderr.write(`[worker] AI reply send error: ${err.message}\n`);
    }
  }
});

function handleAiResponse(fromPhone, text) {
  // Dispara processamento da IA via IPC — sem esperar resposta aqui.
  // A resposta chega de forma assíncrona via msg.action === 'ai-reply'
  // no handler process.on('message') acima, que envia o WhatsApp diretamente.
  try {
    if (!process.send) return;
    process.send({ action: 'ai-process', unitId, phone: fromPhone, message: text });
  } catch (err) {
    process.stderr.write(`[worker] AI send error: ${err.message}\n`);
  }
}

async function saveOutboundMessage(fromPhone, text) {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const phone = fromPhone.replace(/\D/g, '');
    const phoneWithout55 = phone.replace(/^55/, '');
    const phoneWith55 = phone.startsWith('55') ? phone : `55${phone}`;

    const candidates = await prisma.conversation.findMany({
      where: { unitId, status: { in: ['OPEN', 'PENDING'] } },
      orderBy: { lastMessageAt: 'desc' },
    });

    const conversation = candidates.find(conv => {
      const cp = (conv.guestPhone || '').replace(/\D/g, '');
      const cpWithout55 = cp.replace(/^55/, '');
      return cp === phone || cp === phoneWith55 || cpWithout55 === phoneWithout55;
    }) || null;

    if (conversation) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: text,
          direction: 'OUTBOUND',
          senderName: "Tony's Food IA",
        },
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }

    await prisma.$disconnect();
  } catch (err) {
    process.stderr.write(`[worker] saveOutboundMessage error: ${err.message}\n`);
  }
}

async function saveInboundMessage(fromPhone, text) {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const phone = fromPhone.replace(/\D/g, '');
    const phoneWithout55 = phone.replace(/^55/, '');
    const phoneWith55 = phone.startsWith('55') ? phone : `55${phone}`;

    // Fetch open/pending conversations and match in JS so we can normalize
    // both sides (guestPhone may be stored with formatting chars like "(44) 9xxxx-xxxx").
    const candidates = await prisma.conversation.findMany({
      where: {
        unitId,
        status: { in: ['OPEN', 'PENDING'] },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    let conversation = candidates.find(conv => {
      const cp = (conv.guestPhone || '').replace(/\D/g, '');
      const cpWithout55 = cp.replace(/^55/, '');
      return (
        cp === phone ||
        cp === phoneWith55 ||
        cpWithout55 === phoneWithout55
      );
    }) || null;

    // No open conversation — create one
    if (!conversation) {
      const customer = await prisma.customer.findFirst({
        where: {
          unitId,
          phone: { in: [phone, `55${phone}`, phone.replace(/^55/, '')] },
        },
      });

      conversation = await prisma.conversation.create({
        data: {
          unitId,
          guestPhone: fromPhone,
          guestName: customer?.name ?? null,
          customerId: customer?.id ?? null,
          channel: 'whatsapp',
          status: 'OPEN',
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: text,
        direction: 'INBOUND',
        senderName: conversation.guestName ?? fromPhone,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), status: 'OPEN' },
    });

    await prisma.$disconnect();
  } catch (err) {
    process.stderr.write(`[worker] saveInboundMessage error: ${err.message}\n`);
  }
}

async function start() {
  const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } =
    require('@whiskeysockets/baileys');
  const pino   = require('pino');
  const QRCode = require('qrcode');

  const { state: authState, saveCreds } = await useMultiFileAuthState(sessionsDir);

  let version;
  try {
    const res = await fetchLatestBaileysVersion();
    version = res.version;
  } catch {
    version = [2, 3000, 1015901307];
  }

  const sock = makeWASocket({
    version,
    auth: authState,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ["Tony's Food", 'Chrome', '1.0.0'],
    connectTimeoutMs: 60000,
  });

  currentSock = sock;

  // Pre-populate lidToPhone from Baileys' persisted lid-mapping-*_reverse.json files.
  // These files map LID → phone and survive across restarts.
  try {
    for (const file of fs.readdirSync(sessionsDir)) {
      if (!file.endsWith('_reverse.json') || !file.startsWith('lid-mapping-')) continue;
      const lid = file.replace('lid-mapping-', '').replace('_reverse.json', '');
      const phone = JSON.parse(fs.readFileSync(path.join(sessionsDir, file), 'utf8'));
      if (typeof phone === 'string' && phone.length > 5) {
        lidToPhone.set(lid, phone);
      }
    }
  } catch {}

  sock.ev.on('creds.update', saveCreds);

  // Build LID → phone map so we can resolve @lid JIDs back to real phone numbers.
  function indexContacts(list) {
    if (!Array.isArray(list)) return;
    for (const c of list) {
      if (c && c.id && c.lid) {
        const phoneJid = c.id.split('@')[0];
        const lid      = c.lid.split('@')[0];
        lidToPhone.set(lid, phoneJid);
      }
    }
  }

  sock.ev.on('contacts.set',    ({ contacts }) => { try { indexContacts(contacts); } catch {} });
  sock.ev.on('contacts.upsert', (contacts)     => { try { indexContacts(contacts); } catch {} });
  sock.ev.on('contacts.update', (updates)      => { try { indexContacts(updates);  } catch {} });

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      try {
        const dataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
        writeState({ status: 'qr', qr: dataUrl, unitId });
      } catch {
        writeState({ status: 'qr', unitId });
      }
    }

    if (connection === 'open') {
      const info = sock.user;
      writeState({
        status: 'connected',
        phone: info?.id?.split(':')[0] ?? info?.id?.split('@')[0] ?? '',
        name: info?.name ?? '',
        unitId,
      });
    }

    if (connection === 'close') {
      currentSock = null;
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        // Clear stale credentials so next start() generates a fresh QR
        try {
          const files = fs.readdirSync(sessionsDir).filter(f => f !== 'state.json');
          files.forEach(f => { try { fs.unlinkSync(path.join(sessionsDir, f)); } catch {} });
        } catch {}
        writeState({ status: 'disconnected' });
        process.exit(0);
      } else {
        writeState({ status: 'connecting', unitId });
        setTimeout(() => start(), 5000);
      }
    }
  });

  // Handle inbound messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      const remoteJid = msg.key.remoteJid || '';

      // Skip: own messages, status broadcasts, group messages
      if (msg.key.fromMe) continue;
      if (remoteJid === 'status@broadcast') continue;
      if (remoteJid.endsWith('@g.us')) continue;

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        null;

      if (!text) continue;

      const jidId     = remoteJid.split('@')[0];
      const jidSuffix = remoteJid.split('@')[1];

      let fromPhone = jidId;

      // Resolve @lid JIDs to real phone numbers (WhatsApp multi-device)
      if (jidSuffix === 'lid') {
        // 1. Pre-built map from contacts events
        const fromMap = lidToPhone.get(jidId);

        // 2. Scan sock.contacts for a contact whose .lid matches
        let fromScan = null;
        if (!fromMap && sock.contacts) {
          for (const [key, contact] of Object.entries(sock.contacts)) {
            if (contact?.lid?.split('@')[0] === jidId && key.endsWith('@s.whatsapp.net')) {
              fromScan = key.split('@')[0];
              lidToPhone.set(jidId, fromScan);
              break;
            }
          }
        }

        // 3. Direct lookup if Baileys keys contacts by LID
        const contactDirect = sock.contacts?.[remoteJid];
        const fromDirect = contactDirect?.id?.endsWith('@s.whatsapp.net')
          ? contactDirect.id.split('@')[0]
          : null;

        fromPhone = fromMap || fromScan || fromDirect || jidId;
      }

      await saveInboundMessage(fromPhone, text);
      handleAiResponse(fromPhone, text);
    }
  });
}

start().catch(err => {
  writeState({ status: 'disconnected', error: err.message });
  process.exit(1);
});
