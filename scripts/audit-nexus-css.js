const fs = require('fs');
const path = require('path');

const root = path.resolve(process.cwd(), 'src');

const banned = [
  { label: 'Inkap/Rasoio name', re: /\b(?:inkap|rasoio)\b/i },
  { label: 'legacy purple', re: /#(?:b46cff|9f4dff|7b2cff|4b0fb3|b966ff|c084fc|d6b4ff|9b7fc2|c5addf|f4eaff|7a5aa8|2a1f3d|1a0b2e|0c0816|05030a)\b/i },
  { label: 'legacy purple rgb', re: /rgba?\(\s*(?:180\s*,\s*108\s*,\s*255|123\s*,\s*44\s*,\s*255|159\s*,\s*77\s*,\s*255|185\s*,\s*102\s*,\s*255|75\s*,\s*15\s*,\s*179)/i },
  { label: 'legacy lime brand', re: /#(?:b7f20c|c9f84b|dbff72|efffc3|d9ff71)\b/i },
  { label: 'legacy lime rgb', re: /rgba?\(\s*183\s*,\s*242\s*,\s*12/i },
  { label: 'legacy green brand rgb', re: /rgba?\(\s*(?:75\s*,\s*215\s*,\s*145|34\s*,\s*185\s*,\s*95)/i },
  { label: 'legacy neon purple variable', re: /--neon-purple\b/i },
];

function collect(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, out);
    else if (entry.isFile() && entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

const files = collect(root).sort();
const failures = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    banned.forEach(({ label, re }) => {
      if (re.test(line)) {
        failures.push(`${path.relative(process.cwd(), file)}:${index + 1} [${label}] ${line.trim()}`);
      }
    });
  });
}

console.log(`Nexus CSS audit: scanned ${files.length} CSS files.`);
if (failures.length) {
  console.error(`Found ${failures.length} legacy palette/theme occurrence(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Nexus CSS audit passed: no known Inkap/Rasoio/legacy brand palette remains.');
