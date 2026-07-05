export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dfvh4jcsh";
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "11players";

export const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
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
    return null;
  }
};
