export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dfvh4jcsh";
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "11players";

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
  // Security checks before transmitting over network
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    console.error(`Invalid image type: ${file.type}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    throw new Error(`Invalid image format (${file.type}). Please upload JPG, PNG, WEBP, or GIF.`);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    console.error(`File exceeds size limit: ${file.size} bytes (Limit: ${MAX_FILE_SIZE_BYTES} bytes)`);
    throw new Error(`File is too large (${Math.round(file.size / (1024 * 1024))}MB). Maximum size is 10MB.`);
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("Cloudinary upload response error:", res.status, errData);
      throw new Error(`Upload failed: ${res.status}`);
    }
    const data = await res.json();
    return data.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
};
