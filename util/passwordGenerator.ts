import crypto from "crypto";

/** Generates a cryptographically random password that satisfies the app's
 *  password policy: min 8 chars, uppercase, lowercase, digit, special char.
 *  Omits visually ambiguous characters (0, O, I, l, 1). */
export function generatePassword(length: number): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%";
  const all = upper + lower + digits + special;

  const randomChar = (charset: string) => {
    const bytes = crypto.randomBytes(1);
    return charset[bytes[0] % charset.length];
  };

  // Guarantee one character from each required category
  const required = [
    randomChar(upper),
    randomChar(lower),
    randomChar(digits),
    randomChar(special),
  ];

  // Fill the remaining slots from the full charset
  const rest = Array.from({ length: length - required.length }, () =>
    randomChar(all),
  );

  // Shuffle so the required chars aren't always at fixed positions
  const all_chars = [...required, ...rest];
  for (let i = all_chars.length - 1; i > 0; i--) {
    const j = crypto.randomBytes(1)[0] % (i + 1);
    [all_chars[i], all_chars[j]] = [all_chars[j], all_chars[i]];
  }

  return all_chars.join("");
}
