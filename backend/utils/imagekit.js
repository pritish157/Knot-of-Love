"use strict";
const { ImageKit, toFile } = require("@imagekit/nodejs");

// ─── ImageKit singleton ───────────────────────────────────────────────────────
// Credentials loaded from .env:
//   IMAGEKIT_PUBLIC_KEY    → public_xxxx
//   IMAGEKIT_PRIVATE_KEY   → private_xxxx
//   IMAGEKIT_URL_ENDPOINT  → https://ik.imagekit.io/your_id
const imagekit = new ImageKit({
  publicKey:   process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey:  process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

/**
 * Upload a file buffer to ImageKit.
 *
 * @param {Buffer} buffer     - File buffer from multer memoryStorage
 * @param {string} fileName   - Desired filename (with extension)
 * @param {string} folder     - ImageKit folder, e.g. "/knot/profiles"
 * @returns {Promise<{url: string, fileId: string}>}
 */
async function uploadToImageKit(buffer, fileName, folder = "/knot") {
  const file = await toFile(buffer, fileName);

  const response = await imagekit.files.upload({
    file,
    fileName,
    folder,
    useUniqueFileName: true
  });

  return { url: response.url, fileId: response.fileId };
}

/**
 * Delete a file from ImageKit by fileId (optional — for cleanup).
 * @param {string} fileId
 */
async function deleteFromImageKit(fileId) {
  if (!fileId) return;
  try {
    await imagekit.files.delete(fileId);
  } catch (err) {
    console.warn("[ImageKit] Could not delete file:", fileId, err.message);
  }
}

module.exports = { uploadToImageKit, deleteFromImageKit };
