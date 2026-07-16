// Generates the PWA icons in public/icons from the AlphaPay logo mark
// (jade rounded square with transfer arrows, on the app's dark ground).
// Run with: node scripts/generate-icons.mjs (requires the `sharp` devDependency)
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const logo = (maskable) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${maskable ? 0 : 96}" fill="#0C1116"/>
  <rect x="${maskable ? 136 : 106}" y="${maskable ? 136 : 106}" width="${maskable ? 240 : 300}" height="${maskable ? 240 : 300}" rx="${maskable ? 64 : 80}" fill="#2FB891"/>
  <g transform="translate(256 256) scale(${maskable ? 8.5 : 10.5}) translate(-12 -12)" stroke="#04140E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M5 9h11l-3-3M19 15H8l3 3"/>
  </g>
</svg>`;

await mkdir("public/icons", { recursive: true });
await sharp(Buffer.from(logo(false))).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(Buffer.from(logo(false))).resize(512, 512).png().toFile("public/icons/icon-512.png");
await sharp(Buffer.from(logo(true))).resize(512, 512).png().toFile("public/icons/icon-maskable-512.png");
console.log("Icons written to public/icons/");
