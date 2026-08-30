const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'src');
const extensions = new Set(['.js', '.jsx']);
const violations = [];

const forbidden = [
  { re: /\|\|\s*["']\/images\/logo\.png["']/g, label: 'logo Nexus usado como fallback de entidade' },
  { re: /(?:PLACEHOLDER|FALLBACK|DEFAULT_IMAGE)\s*=\s*["']\/images\/logo\.png["']/g, label: 'logo Nexus definido como placeholder de entidade' },
  { re: /["']\/images\/placeholder\.(?:png|jpe?g|webp)["']/gi, label: 'placeholder genérico em vez de iniciais' },
  { re: /item[-_]?default\.(?:png|jpe?g|webp)/gi, label: 'placeholder genérico de item' },
  { re: /establishment[-_]?default\.(?:png|jpe?g|webp)/gi, label: 'placeholder genérico de empresa' },
  { re: /menu-cover-placeholder\.(?:png|jpe?g|webp)/gi, label: 'placeholder genérico de catálogo' },
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name))) inspect(full);
  }
}

function inspect(file) {
  const text = fs.readFileSync(file, 'utf8');
  for (const rule of forbidden) {
    rule.re.lastIndex = 0;
    let match;
    while ((match = rule.re.exec(text))) {
      const line = text.slice(0, match.index).split('\n').length;
      violations.push(`${path.relative(process.cwd(), file)}:${line} - ${rule.label}: ${match[0]}`);
    }
  }
}

walk(root);

if (violations.length) {
  console.error('\nEntity image audit failed. Empresas e itens sem imagem devem mostrar suas iniciais.\n');
  violations.forEach((violation) => console.error(`- ${violation}`));
  process.exit(1);
}

console.log('Entity image audit passed: no generic company/item image fallbacks found.');
