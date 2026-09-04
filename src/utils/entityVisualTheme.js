const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const paletteCache = new Map();

export const DEFAULT_ENTITY_VISUAL_THEME = Object.freeze({
  primary: [0, 194, 255],
  accent: [86, 117, 255],
  source: "fallback",
});

const rgbToHsl = ([r, g, b]) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) return [0, 0, lightness];

  const delta = max - min;
  const saturation =
    lightness > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);

  let hue;
  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return [(hue / 6) * 360, saturation, lightness];
};

const hslToRgb = ([h, s, l]) => {
  const hue = ((h % 360) + 360) % 360 / 360;

  if (s === 0) {
    const value = Math.round(l * 255);
    return [value, value, value];
  }

  const hueToRgb = (p, q, t) => {
    let next = t;
    if (next < 0) next += 1;
    if (next > 1) next -= 1;
    if (next < 1 / 6) return p + (q - p) * 6 * next;
    if (next < 1 / 2) return q;
    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, hue) * 255),
    Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  ];
};

const normalizeForDarkUi = (rgb, lightnessOffset = 0) => {
  const [h, s, l] = rgbToHsl(rgb);
  return hslToRgb([
    h,
    clamp(Math.max(s, 0.38), 0.38, 0.84),
    clamp(l + lightnessOffset, 0.46, 0.64),
  ]);
};

const rotateHue = (rgb, degrees) => {
  const [h, s, l] = rgbToHsl(rgb);
  return hslToRgb([
    h + degrees,
    clamp(Math.max(s, 0.48), 0.48, 0.88),
    clamp(l + 0.05, 0.5, 0.66),
  ]);
};

const colorDistance = (left, right) =>
  Math.sqrt(
    (left[0] - right[0]) ** 2 +
      (left[1] - right[1]) ** 2 +
      (left[2] - right[2]) ** 2
  );

const rankPalette = (imageData) => {
  const buckets = new Map();

  for (let index = 0; index < imageData.length; index += 4) {
    const alpha = imageData[index + 3];
    if (alpha < 180) continue;

    const red = imageData[index];
    const green = imageData[index + 1];
    const blue = imageData[index + 2];
    const [hue, saturation, lightness] = rgbToHsl([red, green, blue]);

    if (lightness < 0.07 || lightness > 0.93) continue;

    const key = [red, green, blue]
      .map((channel) => Math.min(255, Math.round(channel / 32) * 32))
      .join("-");

    const current = buckets.get(key) || {
      count: 0,
      red: 0,
      green: 0,
      blue: 0,
      score: 0,
      hue,
    };

    current.count += 1;
    current.red += red;
    current.green += green;
    current.blue += blue;
    current.score += 0.4 + saturation * 1.35 + (1 - Math.abs(lightness - 0.5)) * 0.25;
    buckets.set(key, current);
  }

  return [...buckets.values()]
    .map((bucket) => ({
      rgb: [
        Math.round(bucket.red / bucket.count),
        Math.round(bucket.green / bucket.count),
        Math.round(bucket.blue / bucket.count),
      ],
      score: bucket.score,
      hue: bucket.hue,
    }))
    .sort((left, right) => right.score - left.score);
};

const buildPaletteFromPixels = (imageData) => {
  const ranked = rankPalette(imageData);
  if (!ranked.length) return DEFAULT_ENTITY_VISUAL_THEME;

  const primary = normalizeForDarkUi(ranked[0].rgb);
  const secondaryCandidate = ranked.find(
    (candidate) => colorDistance(candidate.rgb, ranked[0].rgb) >= 72
  );
  const accent = secondaryCandidate
    ? normalizeForDarkUi(secondaryCandidate.rgb, 0.04)
    : rotateHue(primary, 36);

  return {
    primary,
    accent,
    source: "image",
  };
};

const readImagePalette = (imageUrl) =>
  new Promise((resolve) => {
    if (
      !imageUrl ||
      typeof document === "undefined" ||
      typeof Image === "undefined"
    ) {
      resolve(DEFAULT_ENTITY_VISUAL_THEME);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          resolve(DEFAULT_ENTITY_VISUAL_THEME);
          return;
        }

        const sampleSize = 48;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        context.drawImage(image, 0, 0, sampleSize, sampleSize);
        const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data;
        resolve(buildPaletteFromPixels(pixels));
      } catch {
        // Cross-origin images without CORS can still be displayed as a background.
        // In that case we preserve the image ambience and use the neutral Nexus palette.
        resolve(DEFAULT_ENTITY_VISUAL_THEME);
      }
    };

    image.onerror = () => resolve(DEFAULT_ENTITY_VISUAL_THEME);
    image.src = imageUrl;
  });

export const extractEntityVisualTheme = (imageUrl) => {
  if (!imageUrl) return Promise.resolve(DEFAULT_ENTITY_VISUAL_THEME);
  if (!paletteCache.has(imageUrl)) {
    paletteCache.set(imageUrl, readImagePalette(imageUrl));
  }
  return paletteCache.get(imageUrl);
};

export const entityThemeStyle = (theme, imageUrl = null) => {
  const nextTheme = theme || DEFAULT_ENTITY_VISUAL_THEME;
  const primary = nextTheme.primary || DEFAULT_ENTITY_VISUAL_THEME.primary;
  const accent = nextTheme.accent || DEFAULT_ENTITY_VISUAL_THEME.accent;
  const escapedImageUrl = imageUrl
    ? String(imageUrl).replace(/(["\\])/g, "\\$1")
    : null;

  return {
    "--entity-primary-rgb": primary.join(", "),
    "--entity-accent-rgb": accent.join(", "),
    "--entity-ambient-image": escapedImageUrl
      ? `url("${escapedImageUrl}")`
      : "none",
  };
};
