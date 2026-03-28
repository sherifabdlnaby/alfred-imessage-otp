'use strict';

const { execFileSync } = require('child_process');
const path = require('path');
const alfred = require('./utils/alfred-simple');

const CHAT_DB = path.join(process.env.HOME, 'Library/Messages/chat.db');
const LOOKBACK_HOURS = parseInt(process.env.LOOKBACK_HOURS, 10) || 24;
const MAX_MESSAGES = parseInt(process.env.MAX_MESSAGES, 10) || 50;

function timeAgo(unixTimestamp) {
  const seconds = Math.floor(Date.now() / 1000 - unixTimestamp);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function extractCodes(text) {
  const codes = [];

  // Pass 1: keyword-anchored codes
  const keywordPatterns = [
    /\b(?:code|verification code|passcode|otp|pin)\s*(?:is|:)?\s*[:：]?\s*(\d{4,8})\b/gi,
    /\b(\d{4,8})\s+(?:is your|is the)\s+(?:verification\s+)?(?:code|otp|pin|passcode)\b/gi,
  ];

  for (const pattern of keywordPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      codes.push(match[1]);
    }
  }

  if (codes.length > 0) return [...new Set(codes)];

  // Pass 2: broad fallback - any 4-8 digit number
  const broadPattern = /\b(\d{4,8})\b/g;
  let match;
  while ((match = broadPattern.exec(text)) !== null) {
    const num = match[1];
    const n = parseInt(num, 10);
    if (/^(19|20)\d{2}$/.test(num)) continue;
    if (n % 1000 === 0) continue;
    codes.push(num);
  }

  return [...new Set(codes)];
}

function queryMessages() {
  const lookbackSeconds = LOOKBACK_HOURS * 3600;

  // Use a Swift helper to extract text from attributedBody blobs,
  // since sqlite3 CLI can't parse NSArchiver data.
  // We query with sqlite3 CLI to avoid native Node module issues with iCloud Drive.
  const query = `
    SELECT
      message.date / 1000000000 + 978307200,
      COALESCE(message.text, ''),
      hex(message.attributedBody)
    FROM message
    WHERE message.is_from_me = 0
      AND (message.text IS NOT NULL OR message.attributedBody IS NOT NULL)
      AND message.date > (strftime('%s', 'now') - 978307200 - ${lookbackSeconds}) * 1000000000
    ORDER BY message.date DESC
    LIMIT ${MAX_MESSAGES};
  `;

  try {
    const output = execFileSync('sqlite3', ['-separator', '\x1f', CHAT_DB, query], {
      encoding: 'utf-8',
      timeout: 5000,
    });
    return output.trim();
  } catch (err) {
    if (err.message.includes('unable to open') || err.message.includes('not a database')) {
      alfred.output([{
        title: 'Full Disk Access required',
        subtitle: 'Grant Full Disk Access to Alfred in System Settings → Privacy & Security',
        valid: false,
        icon: { path: alfred.icons.warning },
      }]);
      process.exit(0);
    }
    throw err;
  }
}

function extractTextFromAttributedBodyHex(hex) {
  if (!hex) return null;
  const buf = Buffer.from(hex, 'hex');
  const marker = Buffer.from('NSString');
  const idx = buf.indexOf(marker);
  if (idx === -1) return null;

  let pos = idx + 8;
  while (pos < buf.length && buf[pos] !== 0x2b) pos++;
  if (pos >= buf.length) return null;
  pos++;

  let len;
  if (buf[pos] < 0x80) {
    len = buf[pos];
    pos++;
  } else {
    const numBytes = buf[pos] & 0x7f;
    pos++;
    len = 0;
    for (let i = 0; i < numBytes; i++) {
      len = (len << 8) | buf[pos];
      pos++;
    }
  }

  while (pos < buf.length && buf[pos] === 0x00) pos++;
  return buf.slice(pos, pos + len).toString('utf-8');
}

function run() {
  const output = queryMessages();
  if (!output) {
    alfred.output([{
      title: 'No verification codes found',
      subtitle: `No codes detected in the last ${LOOKBACK_HOURS}h (${MAX_MESSAGES} messages)`,
      valid: false,
    }], { rerun: 0 });
    return;
  }

  const rows = output.split('\n').map(line => {
    const [timestamp, text, attrHex] = line.split('\x1f');
    return { unix_timestamp: parseInt(timestamp, 10), text, attrHex };
  });

  const items = [];

  for (const row of rows) {
    if (items.length >= 5) break;
    const text = row.text || extractTextFromAttributedBodyHex(row.attrHex);
    if (!text) continue;
    const codes = extractCodes(text);
    for (const code of codes) {
      if (items.length >= 5) break;
      if (items.some(i => i.arg === code)) continue;
      items.push({
        title: code,
        subtitle: `(${timeAgo(row.unix_timestamp)}) ${text}`,
        arg: code,
        text: {
          copy: code,
          largetype: `${code}\n\n${text}`,
        },
      });
    }
  }

  if (items.length === 0) {
    items.push({
      title: 'No verification codes found',
      subtitle: `No codes detected in the last ${LOOKBACK_HOURS}h (${MAX_MESSAGES} messages)`,
      valid: false,
    });
  }

  alfred.output(items, { rerun: 0 });
}

run();
