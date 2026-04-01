# Save Image as AVIF

Chrome extension that adds a right-click context menu to download any image converted to AVIF format.

## Features

- Right-click any image → "Save image as AVIF"
- Client-side AVIF encoding via [@jsquash/avif](https://github.com/niclasmattsson/jsquash) (WASM)
- Smart filename: uses Google search query on Google Images pages, otherwise the original image name

## Build

```bash
npm install
npm run build
```

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this project folder

## License

[MIT](LICENSE)
