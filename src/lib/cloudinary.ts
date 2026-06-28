export const CLOUDINARY_CLOUD_NAME = "dxqxhv012"; // Placeholder or user's cloud name if they provide it. We'll use a public placeholder for now or prompt them.
export const CLOUDINARY_UPLOAD_PRESET = "11players_preset"; // Placeholder upload preset

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
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.secure_url; // the returned image url
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return null;
  }
};
