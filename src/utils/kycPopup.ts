export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function openKycPopup(url: string): Window | null {
  return window.open(url, "_blank", "width=600,height=800");
}

export function safePopupHref(popup: Window): string | null {
  try {
    return popup.location.href;
  } catch {
    return null;
  }
}

export function isPopupClosed(popup: Window): boolean {
  try {
    return popup.closed;
  } catch {
    return false;
  }
}

export function watchPopup(options: {
  popup: Window;
  isComplete: (url: string) => boolean;
  intervalMs?: number;
  poll?: () => Promise<boolean>;
  pollEveryMs?: number;
  pollDeferFirst?: boolean;
  timeoutMs?: number;
  onComplete: (url: string) => void;
  onClosed: () => void;
  onTimeout?: () => void;
}): () => void {
  const {
    popup,
    isComplete,
    onComplete,
    onClosed,
    onTimeout,
    poll,
    intervalMs = 500,
    pollEveryMs = 1500,
    pollDeferFirst = false,
    timeoutMs = 4 * 60 * 1000,
  } = options;
  let handled = false;
  let timer: number | null = null;
  let pollInFlight = false;
  let lastPollAt = pollDeferFirst ? Date.now() : 0;
  const startedAt = Date.now();

  const finish = (fn: () => void) => {
    if (handled) return;
    handled = true;
    if (timer != null) window.clearInterval(timer);
    fn();
  };

  timer = window.setInterval(() => {
    if (handled) return;

    if (Date.now() - startedAt >= timeoutMs) {
      finish(() => (onTimeout ? onTimeout() : onClosed()));
      return;
    }

    const href = safePopupHref(popup);
    if (href && isComplete(href)) {
      finish(() => onComplete(href));
      return;
    }

    if (isPopupClosed(popup)) {
      finish(onClosed);
      return;
    }

    if (!poll || pollInFlight || Date.now() - lastPollAt < pollEveryMs) {
      return;
    }

    lastPollAt = Date.now();
    pollInFlight = true;
    void poll()
      .then((done) => {
        pollInFlight = false;
        if (done && !handled) {
          finish(() => onComplete(href || ""));
        }
      })
      .catch(() => {
        pollInFlight = false;
      });
  }, intervalMs);

  return () => {
    if (timer != null) window.clearInterval(timer);
    handled = true;
  };
}

export function isFydaaHost(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().includes("fydaa.com");
  } catch {
    return /fydaa\.com/i.test(url);
  }
}

export function getUrlQueryParam(url: string, key: string): string | null {
  try {
    return new URL(url).searchParams.get(key);
  } catch {
    const match = url.match(new RegExp(`[?&]${key}=([^&#]*)`, "i"));
    return match ? decodeURIComponent(match[1]) : null;
  }
}

export function getUrlPath(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function isNonCompliantDigilockerCallback(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes("kyc-digilocker")) return true;
  if (getUrlQueryParam(url, "identity_document") != null) return true;
  return isFydaaHost(url);
}

export const DIGILOCKER_CALLBACK_MESSAGE = "fydaa-digilocker-callback";
export const MODIFY_CALLBACK_MESSAGE = "fydaa-modify-kyc-callback";
export const DIGILOCKER_POSTBACK_URL = "https://fydaa.com";

export function getDigilockerPostbackUrl(): string {
  return DIGILOCKER_POSTBACK_URL;
}

function isTrustedFydaaOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (typeof window !== "undefined" && origin === window.location.origin) {
      return true;
    }
    return host === "fydaa.com" || host.endsWith(".fydaa.com");
  } catch {
    return false;
  }
}

export function notifyDigilockerCallback(): void {
  try {
    window.opener?.postMessage({ type: DIGILOCKER_CALLBACK_MESSAGE }, "*");
  } catch {
    /* ignore */
  }
}

export function notifyModifyCallback(): void {
  try {
    window.opener?.postMessage({ type: MODIFY_CALLBACK_MESSAGE }, "*");
  } catch {
    /* ignore */
  }
}

export type DigilockerWaitReason = "callback" | "closed" | "timeout" | "server";

function waitForVendorPopup(
  popup: Window,
  options: {
    isComplete: (url: string) => boolean;
    messageType: string;
    pollComplete?: () => Promise<boolean>;
    pollEveryMs?: number;
  }
): Promise<DigilockerWaitReason> {
  return new Promise((resolve) => {
    let done = false;
    let stopWatch = () => undefined as void;

    const finish = (reason: DigilockerWaitReason) => {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMessage);
      stopWatch();
      closePopupQuietly(popup);
      resolve(reason);
    };

    const onMessage = (event: MessageEvent) => {
      if (!isTrustedFydaaOrigin(event.origin)) return;
      if (
        event.data &&
        typeof event.data === "object" &&
        "type" in event.data &&
        event.data.type === options.messageType
      ) {
        finish("callback");
      }
    };

    window.addEventListener("message", onMessage);
    let serverComplete = false;
    stopWatch = watchPopup({
      popup,
      isComplete: options.isComplete,
      poll: options.pollComplete
        ? async () => {
            const complete = await options.pollComplete!();
            if (complete) serverComplete = true;
            return complete;
          }
        : undefined,
      pollEveryMs: options.pollEveryMs ?? 5000,
      pollDeferFirst: true,
      onComplete: () => finish(serverComplete ? "server" : "callback"),
      onClosed: () => finish("closed"),
      onTimeout: () => finish("timeout"),
    });
  });
}

/**
 * Wait until DigiLocker is done, then close the popup.
 * fydaa.com is cross-origin from localhost, so the URL often cannot be read.
 * `pollComplete` (GET identity-document becoming terminal) is the signal that
 * the vendor has already redirected to fydaa.com — do not wait for a manual close.
 */
export function waitForDigilockerPopup(
  popup: Window,
  options?: {
    pollComplete?: () => Promise<boolean>;
    pollEveryMs?: number;
  }
): Promise<DigilockerWaitReason> {
  return waitForVendorPopup(popup, {
    isComplete: isNonCompliantDigilockerCallback,
    messageType: DIGILOCKER_CALLBACK_MESSAGE,
    pollComplete: options?.pollComplete,
    pollEveryMs: options?.pollEveryMs,
  });
}

/**
 * Wait until modify DigiLocker / Cybrilla e-sign is done, then close the popup.
 * fydaa.com is cross-origin, so `pollComplete` (GET /kyc/kyc-forms/current)
 * is the completion signal — do not wait for a manual close.
 */
export function waitForModifyPopup(
  popup: Window,
  options: {
    isComplete: (url: string) => boolean;
    pollComplete?: () => Promise<boolean>;
    pollEveryMs?: number;
  }
): Promise<DigilockerWaitReason> {
  return waitForVendorPopup(popup, {
    isComplete: options.isComplete,
    messageType: MODIFY_CALLBACK_MESSAGE,
    pollComplete: options.pollComplete,
    pollEveryMs: options.pollEveryMs,
  });
}

export function isModifyProofCallback(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes("kyc-modify") && (lower.includes("proof=") || lower.includes("esign="))) {
    return true;
  }
  if (!isFydaaHost(url)) return false;
  const status = (getUrlQueryParam(url, "status") || "").toLowerCase();
  return (
    getUrlQueryParam(url, "proof") != null ||
    getUrlQueryParam(url, "esign") != null ||
    status === "successful" ||
    status === "success" ||
    getUrlPath(url).includes("successpagedigi")
  );
}

export function isModifyEsignCallback(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes("simulate_esign")) return false;
  if (lower.includes("kyc-modify") && getUrlQueryParam(url, "esign") != null) {
    return true;
  }
  if (!isFydaaHost(url)) return false;
  if (getUrlQueryParam(url, "esign") == null) return false;
  const status = (getUrlQueryParam(url, "status") || "").toLowerCase();
  return status === "successful" || status === "success";
}

export function isNsdlEsignCallback(url: string): boolean {
  if (!isFydaaHost(url)) return false;
  const status = (getUrlQueryParam(url, "status") || "").toLowerCase();
  return (
    getUrlPath(url).includes("successpagensdl") ||
    status === "successful" ||
    status === "success"
  );
}

export function closePopupQuietly(popup: Window | null): void {
  if (!popup) return;
  try {
    if (!popup.closed) popup.close();
  } catch {
    /* ignore */
  }
}
