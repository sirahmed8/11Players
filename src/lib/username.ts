import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Normalizes username input: lowercase, strips @ prefix, removes invalid characters (allows a-z, 0-9, _).
 * Truncates to maximum 20 characters.
 */
export function cleanUsername(input: string): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

/**
 * Validates format of username string.
 * Must be 3 to 20 characters, containing only a-z, 0-9, and _.
 */
export function validateUsernameFormat(username: string): { valid: boolean; errorEn?: string; errorAr?: string } {
  const cleaned = cleanUsername(username);

  if (!cleaned || cleaned.length < 3) {
    return {
      valid: false,
      errorEn: "Username must be at least 3 characters long",
      errorAr: "اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل",
    };
  }

  if (cleaned.length > 20) {
    return {
      valid: false,
      errorEn: "Username cannot exceed 20 characters",
      errorAr: "اسم المستخدم لا يمكن أن يتجاوز 20 حرفاً",
    };
  }

  const regex = /^[a-z0-9_]{3,20}$/;
  if (!regex.test(cleaned)) {
    return {
      valid: false,
      errorEn: "Only lowercase letters, numbers, and underscores allowed",
      errorAr: "مسموح فقط بأحرف صغيرة، أرقام، وشرطة سفيلية (_)",
    };
  }

  const reservedWords = ["admin", "administrator", "system", "official", "11players", "hagoozat", "mod", "owner", "null", "undefined"];
  if (reservedWords.includes(cleaned)) {
    return {
      valid: false,
      errorEn: "This username is reserved by system",
      errorAr: "اسم المستخدم هذا محجوز من قبل النظام",
    };
  }

  return { valid: true };
}

/**
 * Asynchronously checks if a username is available in Firestore players collection.
 */
export async function checkUsernameAvailability(username: string, currentUid?: string): Promise<{ available: boolean; errorEn?: string; errorAr?: string }> {
  const formatResult = validateUsernameFormat(username);
  if (!formatResult.valid) {
    return { available: false, errorEn: formatResult.errorEn, errorAr: formatResult.errorAr };
  }

  const cleaned = cleanUsername(username);

  try {
    const q = query(collection(db, "players"), where("username", "==", cleaned));
    const snap = await getDocs(q);

    if (snap.empty) {
      return { available: true };
    }

    // If matches belong to current user, it's available for them
    const isOwnedByCurrent = snap.docs.every((d) => d.id === currentUid || d.data().uid === currentUid);
    if (isOwnedByCurrent) {
      return { available: true };
    }

    return {
      available: false,
      errorEn: "This username is already taken",
      errorAr: "اسم المستخدم هذا مأخوذ بالفعل",
    };
  } catch (err) {
    console.error("Failed to check username availability:", err);
    return { available: false, errorEn: "Error checking availability", errorAr: "خطأ أثناء التحقق من المتاحية" };
  }
}

/**
 * Generates smart username suggestions based on full name, card name, or email.
 */
export function generateUsernameSuggestions(name?: string, cardName?: string, email?: string): string[] {
  const baseSeeds: string[] = [];

  if (cardName) {
    baseSeeds.push(cleanUsername(cardName));
  }
  if (name) {
    const parts = name.split(" ").map((p) => cleanUsername(p)).filter(Boolean);
    if (parts.length >= 2) {
      baseSeeds.push(`${parts[0]}_${parts[1]}`);
      baseSeeds.push(`${parts[0]}${parts[1]}`);
    } else if (parts.length === 1) {
      baseSeeds.push(parts[0]);
    }
  }
  if (email) {
    const prefix = email.split("@")[0];
    baseSeeds.push(cleanUsername(prefix));
  }

  const finalSuggestions = new Set<string>();
  const suffixes = ["", "_7", "10", "99", "_pro", "_11", "07"];

  for (const seed of baseSeeds) {
    if (!seed || seed.length < 2) continue;
    for (const suffix of suffixes) {
      const candidate = cleanUsername(`${seed}${suffix}`);
      if (candidate.length >= 3 && candidate.length <= 20) {
        finalSuggestions.add(candidate);
        if (finalSuggestions.size >= 4) break;
      }
    }
    if (finalSuggestions.size >= 4) break;
  }

  if (finalSuggestions.size === 0) {
    finalSuggestions.add("player_11");
    finalSuggestions.add("captain_7");
  }

  return Array.from(finalSuggestions).slice(0, 4);
}
