import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public", "tesseract");
const langDir = join(publicDir, "lang");

const workerSrc = join(root, "node_modules", "tesseract.js", "dist", "worker.min.js");
const coreSrc = join(
  root,
  "node_modules",
  "tesseract.js-core",
  "tesseract-core-lstm.wasm.js",
);

const LANGS = ["eng", "spa", "fra", "deu"];
const LANG_CDN = "https://cdn.jsdelivr.net/npm/@tesseract.js-data";

function copyAsset(src, dest, label) {
  if (!existsSync(src)) {
    console.warn(`[copy-tesseract-assets] ${label} not found, skipping.`);
    return false;
  }

  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  return true;
}

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          download(response.headers.location).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

mkdirSync(langDir, { recursive: true });

const copiedWorker = copyAsset(workerSrc, join(publicDir, "worker.min.js"), "worker");
const copiedCore = copyAsset(
  coreSrc,
  join(publicDir, "tesseract-core-lstm.wasm.js"),
  "core",
);

if (copiedWorker && copiedCore) {
  console.log("[copy-tesseract-assets] Copied worker and core to public/tesseract/");
}

for (const lang of LANGS) {
  const dest = join(langDir, `${lang}.traineddata.gz`);
  if (existsSync(dest)) {
    continue;
  }

  const url = `${LANG_CDN}/${lang}/4.0.0_best_int/${lang}.traineddata.gz`;

  try {
    const data = await download(url);
    writeFileSync(dest, data);
    console.log(`[copy-tesseract-assets] Downloaded ${lang}.traineddata.gz`);
  } catch (err) {
    console.warn(
      `[copy-tesseract-assets] Could not download ${lang}.traineddata.gz:`,
      err instanceof Error ? err.message : err,
    );
  }
}
