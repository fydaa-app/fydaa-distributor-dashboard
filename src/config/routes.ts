export const publicPaths = [
  "/signin",
  "/forgotpassword",
  "/signup",
  "/impersonate",
  "/kyc-digilocker",
  "/kyc-modify",
  "/kyc-esign",
];

export const reminderHiddenPaths = [
  "/arn-onboard",
  "/kyc-modify",
  "/kyc-digilocker",
  "/kyc-esign",
  "/arn-goal-setup",
  "/arn-financial-plan",
  "/profile",
  "/reset-password",
];

export function isPathHidden(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isReminderHidden(pathname: string) {
  return isPathHidden(pathname, reminderHiddenPaths);
}
