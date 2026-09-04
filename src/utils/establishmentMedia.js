const mediaUrl = (file) =>
  file?.public_url ||
  file?.full_url ||
  file?.media_url ||
  file?.image_url ||
  file?.url ||
  file?.src ||
  file?.path ||
  null;

const mediaType = (file) =>
  String(
    file?.type ||
      file?.role ||
      file?.kind ||
      file?.collection ||
      file?.category ||
      file?.purpose ||
      ""
  )
    .trim()
    .toLowerCase();

const unique = (values) => [...new Set(values.filter(Boolean))];

const findTypedMedia = (files, types) => {
  if (!Array.isArray(files)) return null;
  const normalizedTypes = types.map((type) => String(type).trim().toLowerCase());
  const exact = files.find((file) => normalizedTypes.includes(mediaType(file)));
  if (exact) return mediaUrl(exact);

  return mediaUrl(
    files.find((file) => {
      const current = mediaType(file);
      return normalizedTypes.some((type) => current.includes(type));
    })
  );
};

const mediaIdentity = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw, "https://media.local");
    return decodeURIComponent(parsed.pathname)
      .replace(/^\/+/, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  } catch {
    return raw
      .split(/[?#]/)[0]
      .replace(/^\/+/, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  }
};

export const collectEstablishmentMediaFiles = (establishment) => {
  if (!establishment) return [];
  const rawImages = establishment.images;

  return [
    ...(Array.isArray(establishment.files) ? establishment.files : []),
    ...(Array.isArray(rawImages) ? rawImages : []),
    ...(Array.isArray(establishment.media) ? establishment.media : []),
  ];
};

export const resolveEstablishmentLogo = (establishment, files = null) => {
  if (!establishment) return null;
  const mediaFiles = files || collectEstablishmentMediaFiles(establishment);
  const images =
    establishment.images &&
    !Array.isArray(establishment.images) &&
    typeof establishment.images === "object"
      ? establishment.images
      : {};

  return (
    findTypedMedia(mediaFiles, ["logo", "avatar", "profile"]) ||
    images.logo ||
    images.logo_url ||
    images.avatar ||
    images.avatar_url ||
    establishment.logo ||
    establishment.logo_url ||
    establishment.avatar ||
    establishment.avatar_url ||
    establishment.image_logo ||
    null
  );
};

export const resolveEstablishmentBackground = (
  establishment,
  files = null,
  logo = null
) => {
  if (!establishment) return null;
  const mediaFiles = files || collectEstablishmentMediaFiles(establishment);
  const images =
    establishment.images &&
    !Array.isArray(establishment.images) &&
    typeof establishment.images === "object"
      ? establishment.images
      : {};
  const resolvedLogo = logo || resolveEstablishmentLogo(establishment, mediaFiles);
  const logoIdentity = mediaIdentity(resolvedLogo);

  // The uploaded file explicitly classified as "background" is authoritative.
  // This mirrors the establishment editor and prevents a stale images.background
  // alias from accidentally reusing the logo as the visual cover.
  const candidates = unique([
    findTypedMedia(mediaFiles, ["background"]),
    establishment.background,
    establishment.background_url,
    establishment.background_image,
    establishment.image_background,
    images.background,
    images.background_url,
    images.background_image,
    findTypedMedia(mediaFiles, ["cover", "banner", "hero", "header"]),
    establishment.cover,
    establishment.cover_url,
    establishment.cover_image,
    establishment.banner,
    establishment.banner_url,
    establishment.banner_image,
    establishment.hero,
    establishment.hero_url,
    images.cover,
    images.cover_url,
    images.cover_image,
    images.banner,
    images.banner_url,
    images.banner_image,
    images.hero,
    images.hero_url,
  ]);

  return (
    candidates.find((candidate) => {
      const identity = mediaIdentity(candidate);
      return identity && (!logoIdentity || identity !== logoIdentity);
    }) || null
  );
};

export { mediaIdentity, mediaType, mediaUrl };
