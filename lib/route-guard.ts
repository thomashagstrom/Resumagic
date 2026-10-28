export function shouldRedirectToSignIn(
  pathname: string,
  isAuthenticated: boolean,
): boolean {
  return !isAuthenticated && pathname.startsWith("/dashboard");
}
