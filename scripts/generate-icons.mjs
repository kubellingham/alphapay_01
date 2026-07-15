// Generates the PWA icons in public/icons from an inline SVG logo.
// Run with: node scripts/generate-icons.mjs (requires the `sharp` devDependency)
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const logo = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${pad ? 0 : 96}" fill="#0b1220"/>
  <g transform="translate(256 268)">
    <path d="M-92 96 L0 -128 L92 96 L52 96 L0 -34 L-52 96 Z" fill="#34d399"/>
    <rect x="-46" y="28" width="92" height="26" rx="13" fill="#f8fafc"/>
  </g>
  <text x="256" y="448" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#94a3b8" text-anchor="middle">PAY</text>
</svg>`;

await mkdir("public/icons", { recursive: true });
await sharp(Buffer.from(logo(false))).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(Buffer.from(logo(false))).resize(512, 512).png().toFile("public/icons/icon-512.png");
// Maskable: full-bleed background, logo shrunk into the safe zone.
await sharp(Buffer.from(logo(true))).resize(512, 512).png().toFile("public/icons/icon-maskable-512.png");
console.log("Icons written to public/icons/");
