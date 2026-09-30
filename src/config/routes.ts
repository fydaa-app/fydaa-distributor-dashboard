export const publicPaths = [
  "/signin",
  "/forgotpassword",
  "/signup",
  "/impersonate",
];

export const reminderHiddenPaths = [
  "/arn-onboard",
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
