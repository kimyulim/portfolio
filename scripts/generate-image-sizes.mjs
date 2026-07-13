// public/images/portfolio_N.png 의 실제 픽셀 치수를 읽어
// app/portfolio-image-sizes.ts 를 생성합니다.
// 이미지를 추가/교체한 뒤에는 `node scripts/generate-image-sizes.mjs` 를 다시 실행하세요.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const imagesDir = join(root, "public", "images");

function pngSize(filePath) {
  // PNG IHDR: 시그니처(8) + 길이(4) + "IHDR"(4) 다음에 width, height가 각각 big-endian 4바이트
  const buf = readFileSync(filePath);
  if (buf.readUInt32BE(12) !== 0x49484452 && buf.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error(`IHDR chunk not found: ${filePath}`);
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const pages = readdirSync(imagesDir)
  .map((name) => /^portfolio_(\d+)\.png$/.exec(name))
  .filter(Boolean)
  .map((match) => Number(match[1]))
  .sort((a, b) => a - b);

if (pages.length === 0) {
  throw new Error(`No portfolio_N.png files in ${imagesDir}`);
}

const sizes = pages.map((page) => {
  const { width, height } = pngSize(join(imagesDir, `portfolio_${page}.png`));
  return `  [${width}, ${height}], // portfolio_${page}.png`;
});

const output = `// 자동 생성 파일 — 직접 수정하지 마세요.
// 재생성: node scripts/generate-image-sizes.mjs
// [width, height] (픽셀), 인덱스 = page - 1

export const PORTFOLIO_IMAGE_SIZES: ReadonlyArray<readonly [number, number]> = [
${sizes.join("\n")}
];
`;

writeFileSync(join(root, "app", "portfolio-image-sizes.ts"), output);
console.log(`Wrote app/portfolio-image-sizes.ts (${pages.length} images)`);
