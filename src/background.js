import { defaultOptions } from "@jsquash/avif/meta.js";
import { initEmscriptenModule } from "@jsquash/avif/utils.js";
import avifEncFactory from "@jsquash/avif/codec/enc/avif_enc.js";

let emscriptenModule;

async function ensureEncoder() {
  if (emscriptenModule) return;
  const wasmUrl = chrome.runtime.getURL("dist/avif_enc.wasm");
  const wasmResponse = await fetch(wasmUrl);
  const wasmBytes = await wasmResponse.arrayBuffer();
  const wasmModule = await WebAssembly.compile(wasmBytes);
  emscriptenModule = await initEmscriptenModule(avifEncFactory, wasmModule);
}

async function encode(imageData, options = {}) {
  await ensureEncoder();
  const module = await emscriptenModule;
  const opts = { ...defaultOptions, ...options };
  const output = module.encode(
    new Uint8Array(imageData.data.buffer),
    imageData.width,
    imageData.height,
    opts
  );
  if (!output) throw new Error("Encoding error.");
  return output.buffer;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveAsAvif",
    title: "Save image as AVIF",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "saveAsAvif") {
    convertAndDownload(info.srcUrl, info.pageUrl);
  }
});

async function convertAndDownload(srcUrl, pageUrl) {
  try {
    await ensureEncoder();

    const response = await fetch(srcUrl);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    canvas.getContext("2d").drawImage(bitmap, 0, 0);
    const imageData = canvas
      .getContext("2d")
      .getImageData(0, 0, bitmap.width, bitmap.height);

    const avifBuffer = await encode(imageData, { quality: 60 });

    const bytes = new Uint8Array(avifBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    const dataUrl = `data:image/avif;base64,${btoa(binary)}`;

    const filename = deriveName(srcUrl, pageUrl) + ".avif";
    chrome.downloads.download({ url: dataUrl, filename });
  } catch (err) {
    console.error("AVIF conversion failed:", err);
  }
}

function deriveName(srcUrl, pageUrl) {
  if (pageUrl) {
    const page = new URL(pageUrl);
    if (page.hostname.includes("google.") && page.searchParams.has("q")) {
      return page.searchParams
        .get("q")
        .replace(/\s+/g, "_")
        .replace(/[\\/:*?"<>|]/g, "");
    }
  }
  return (
    new URL(srcUrl).pathname.split("/").pop().replace(/\.[^.]+$/, "") || "image"
  );
}
