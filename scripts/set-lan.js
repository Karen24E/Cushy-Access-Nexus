const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

const interfaces = os.networkInterfaces();
const candidates = [];

for (const [name, entries] of Object.entries(interfaces)) {
  for (const entry of entries || []) {
    if (entry.family === 'IPv4' && !entry.internal) {
      candidates.push({ name, address: entry.address });
    }
  }
}

function score(address, name) {
  let s = 0;
  if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(address)) s += 10;
  if (/wi-?fi|wireless/i.test(name)) s += 5;
  if (/ethernet/i.test(name)) s += 3;
  return s;
}

candidates.sort((a,b) => score(b.address,b.name)-score(a.address,a.name));
const chosen = candidates[0];
if (!chosen) {
  console.error('Could not find a non-internal IPv4 address. Run ipconfig and configure .env manually.');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const line = `EXPO_PUBLIC_API_URL=http://${chosen.address}:4000`;
let next;
if (/^EXPO_PUBLIC_API_URL=.*$/m.test(current)) {
  next = current.replace(/^EXPO_PUBLIC_API_URL=.*$/m, line);
} else {
  next = (current.trim() ? current.trim() + '\n' : '') + line + '\n';
}
fs.writeFileSync(envPath, next);
console.log(`Nexus mobile API URL set to: ${line}`);
console.log(`Detected interface: ${chosen.name}`);
console.log('Restart Expo with: npx expo start -c');
