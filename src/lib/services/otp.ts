export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOtp(email: string): Promise<string> {
  const code = generateOtpCode();
  // TODO: Store OTP in database with expiry
  console.log(`[OTP Stub] Code for ${email}: ${code}`);
  return code;
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  // TODO: Verify against database
  console.log(`[OTP Stub] Verifying ${code} for ${email}`);
  return false;
}
