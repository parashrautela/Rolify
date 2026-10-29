/** Cookie that carries "where to go after sign-in" across the OAuth / magic-link round trip. */
export const NEXT_PATH_COOKIE = "rolify_next";

/** Only same-site paths, so a crafted ?next= can't bounce users to another domain. */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  return value;
}
