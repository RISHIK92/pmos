/**
 * Quick pre-filter to identify potential transaction SMS.
 * The actual parsing is done by the backend using Gemini AI.
 */
export const preFilterSms = (body: string): boolean => {
  const text = body.toLowerCase();

  // Must have money indicator
  const hasMoney = /(?:rs\.?|inr|₹|amt)/i.test(text);
  if (!hasMoney) return false;

  // Must have a number
  const hasNumber = /\d/.test(text);
  if (!hasNumber) return false;

  // Must have transaction indicator
  const hasTransactionWord =
    text.includes("credited") ||
    text.includes("debited") ||
    text.includes("spent") ||
    text.includes("paid") ||
    text.includes("received") ||
    text.includes("sent") ||
    text.includes("refund") ||
    text.includes("transfer");

  if (!hasTransactionWord) return false;

  // Filter out OTP and other non-transaction messages
  if (text.includes("otp") || text.includes("one time password")) return false;
  if (text.includes("request")) return false;

  return true;
};

// Legacy export for backwards compatibility (kept minimal)
export interface ParsedTransaction {
  amount: number;
  type: "debit" | "credit";
  accountNumber: string;
  bank: string;
  merchant: string;
  date: Date;
}

// Deprecated: Use preFilterSms + backend /finance/parse-sms instead
export const parseSms = (
  body: string,
  sender: string
): ParsedTransaction | null => {
  // This function is deprecated - kept for backwards compatibility
  // The actual parsing is now done by the backend using Gemini AI
  if (!preFilterSms(body)) return null;

  // Return a placeholder - the real work happens on the backend
  return {
    amount: 0,
    type: "debit",
    accountNumber: "0000",
    bank: "Unknown",
    merchant: "Processing...",
    date: new Date(),
  };
};
