import { build } from "esbuild";
import { copyFileSync, mkdirSync } from "fs";

mkdirSync("dist", { recursive: true });

// Copy WASM files to dist
copyFileSync(
  "node_modules/@jsquash/avif/codec/enc/avif_enc.wasm",
  "dist/avif_enc.wasm"
);

await build({
  entryPoints: ["src/background.js"],
  bundle: true,
  outfile: "dist/background.js",
  format: "esm",
  target: "esnext",
  external: ["./avif_enc.wasm"],
});

console.log("Build complete → dist/");
