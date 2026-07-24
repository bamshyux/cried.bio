export const HUMAN_VERIFICATION_REQUIRED_MESSAGE =
  "Please complete human verification before continuing.";

export function isHumanVerificationRequired(error: string | null | undefined): boolean {
  return error === HUMAN_VERIFICATION_REQUIRED_MESSAGE;
}
