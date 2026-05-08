// Gera icon.png e adaptive-icon.png a partir do SVG do ictus
// Usa sharp (instalado temporariamente)
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', 'assets');

// Instala sharp se não existir
try {
  await import('sharp');
} catch {
  console.log('Instalando sharp...');
  execSync('npm install --no-save sharp', { cwd: join(__dirname, '..'), stdio: 'inherit' });
}

const { default: sharp } = await import('sharp');

// SVG do ictus (peixe cristão) — fundo preto, peixe ciano
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Fundo preto com cantos arredondados -->
  <rect width="1024" height="1024" rx="220" fill="#000000"/>

  <!-- Corpo do peixe (ichthys) — outline ciano -->
  <g fill="none" stroke="#00C8D7" stroke-width="52" stroke-linecap="round" stroke-linejoin="round">

    <!-- Arco superior do corpo -->
    <path d="M 155,512 C 190,330 430,250 670,512"/>

    <!-- Arco inferior do corpo -->
    <path d="M 670,512 C 430,774 190,694 155,512"/>

    <!-- Cauda: X cruzado -->
    <line x1="640" y1="355" x2="860" y2="650"/>
    <line x1="640" y1="669" x2="860" y2="374"/>

  </g>

  <!-- Olho do peixe -->
  <circle cx="360" cy="498" r="40" fill="#00C8D7"/>
</svg>`;

const svgBuf = Buffer.from(svg);

// icon.png — 1024x1024
await sharp(svgBuf).resize(1024, 1024).png().toFile(join(assetsDir, 'icon.png'));
console.log('✔ icon.png gerado');

// adaptive-icon.png — 1024x1024 (fundo transparente para o adaptive icon do Android)
const svgAdaptive = svg.replace('fill="#000000"', 'fill="transparent"');
await sharp(Buffer.from(svgAdaptive)).resize(1024, 1024).png().toFile(join(assetsDir, 'adaptive-icon.png'));
console.log('✔ adaptive-icon.png gerado');

// splash-icon.png — mesmo ícone
await sharp(svgBuf).resize(200, 200).png().toFile(join(assetsDir, 'splash-icon.png'));
console.log('✔ splash-icon.png gerado');

console.log('\nÍcones gerados com sucesso em assets/');
