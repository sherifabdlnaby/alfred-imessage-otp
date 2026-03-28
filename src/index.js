'use strict';

const path = require('path');
const Database = require('better-sqlite3');
const alfred = require('./utils/alfred-simple');

const CHAT_DB = path.join(process.env.HOME, 'Library/Messages/chat.db');

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
    // "code is: 123456", "code: 123456", "code 123456"
    /\b(?:code|verification code|passcode|otp|pin)\s*(?:is|:)?\s*[:：]?\s*(\d{4,8})\b/gi,
    // "123456 is your verification code"
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
    // Filter out years (19xx, 20xx) and round numbers
    if (/^(19|20)\d{2}$/.test(num)) continue;
    if (n % 1000 === 0) continue;
    codes.push(num);
  }

  return [...new Set(codes)];
}

function run() {
  let db;
  try {
    db = new Database(CHAT_DB, { readonly: true, fileMustExist: true });
  } catch (err) {
    if (err.code === 'SQLITE_CANTOPEN' || err.message.includes('unable to open')) {
      alfred.output([{
        title: 'Full Disk Access required',
        subtitle: 'Grant Full Disk Access to Alfred in System Settings → Privacy & Security',
        valid: false,
        icon: { path: alfred.icons.warning },
      }]);
      return;
    }
    throw err;
  }

  const query = `
    SELECT
      message.date / 1000000000 + 978307200 AS unix_timestamp,
      message.text
    FROM message
    WHERE message.is_from_me = 0
      AND message.text IS NOT NULL
      AND message.text != ''
      AND message.date > (strftime('%s', 'now') - 978307200 - 86400) * 1000000000
    ORDER BY message.date DESC
    LIMIT 50
  `;

  const rows = db.prepare(query).all();
  db.close();

  const items = [];

  for (const row of rows) {
    if (items.length >= 5) break;
    const codes = extractCodes(row.text);
    for (const code of codes) {
      if (items.length >= 5) break;
      if (items.some(i => i.arg === code)) continue;
      items.push({
        title: code,
        subtitle: timeAgo(row.unix_timestamp),
        arg: code,
        text: {
          copy: code,
          largetype: `${code}\n\n${row.text}`,
        },
      });
    }
  }

  if (items.length === 0) {
    items.push({
      title: 'No verification codes found',
      subtitle: 'No codes detected in messages from the last 24 hours',
      valid: false,
    });
  }

  alfred.output(items, { rerun: 0 });
}

run();
