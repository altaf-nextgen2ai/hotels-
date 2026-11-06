const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const TARGET_DATA_URL_CHARS = 900000;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image'));
    };
    img.src = url;
  });
}

function drawJpeg(img, maxWidth, quality) {
  const scale = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function compressImageFile(file, {
  maxWidth = 1400,
  quality = 0.72,
  maxInputBytes = MAX_INPUT_BYTES,
} = {}) {
  if (!file) throw new Error('No file selected');
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Please choose an image file');
  }
  if (file.size > maxInputBytes) {
    throw new Error(`${file.name} is too large (max 12MB)`);
  }

  const img = await loadImage(file);
  let width = maxWidth;
  let currentQuality = quality;
  let dataUrl = drawJpeg(img, width, currentQuality);

  for (let i = 0; i < 6 && dataUrl.length > TARGET_DATA_URL_CHARS; i += 1) {
    width = Math.max(640, Math.round(width * 0.82));
    currentQuality = Math.max(0.42, currentQuality - 0.08);
    dataUrl = drawJpeg(img, width, currentQuality);
  }

  return dataUrl;
}

export async function compressImageFiles(files, options) {
  const results = [];
  for (const file of files) {
    results.push(await compressImageFile(file, options));
  }
  return results;
}
