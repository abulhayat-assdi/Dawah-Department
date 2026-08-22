"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";

/** Chrome/Edge/Samsung fire this so the page can defer the install UI. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "adims:install-dismissed-at";
const DISMISS_DAYS = 7;

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Boolean(at) && Date.now() - at < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

/** True once launched from the home screen — nothing to advertise then. */
function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari predates display-mode and exposes its own flag.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS 13+ reports itself as a Mac; the touch points give it away.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Registers the service worker and offers the install banner.
 *
 * Mount once, in the root layout. Renders nothing at all when the app is
 * already installed, when the user dismissed the banner this week, or on
 * browsers that cannot install.
 */
export function PwaProvider() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // In development, we pass a query param so the worker knows not to cache HMR bundles.
    const swUrl = process.env.NODE_ENV !== "production" ? "/sw.js?dev=1" : "/sw.js";
    const register = () => {
      navigator.serviceWorker.register(swUrl).catch((error) => {
        console.error("[pwa] service worker registration failed", error);
      });
    };
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  useEffect(() => {
    if (isStandalone() || dismissedRecently()) return;

    const onPrompt = (event: Event) => {
      // Holding the event back is what lets us show our own banner later.
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setIosHint(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt, so Safari users get instructions
    // instead of a button. Delayed so it does not race the first paint.
    const timer = isIos() ? window.setTimeout(() => setIosHint(true), 2500) : 0;

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private mode with storage blocked — the banner simply returns next visit.
    }
    setPromptEvent(null);
    setIosHint(false);
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    // The event is single-use; a declined prompt must not be re-fired.
    setPromptEvent(null);
    if (outcome === "dismissed") dismiss();
  }, [promptEvent, dismiss]);

  if (!promptEvent && !iosHint) return null;

  return (
    <div
      role="dialog"
      aria-label="অ্যাপ ইনস্টল করুন"
      // Sits clear of the phone tab bar (and the home indicator below it);
      // on desktop there is no tab bar, so it tucks into the corner.
      className="fixed inset-x-0 bottom-[calc(var(--tab-bar-h)+var(--safe-bottom))] z-[60] p-3 sm:left-auto sm:right-4 sm:w-[380px] lg:bottom-4"
    >
      <div className="animate-fade-up flex items-start gap-3 rounded-2xl border border-brand-700/40 bg-white p-3.5 shadow-[0_18px_40px_-16px_rgba(4,36,23,0.65)]">
        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={44}
            height={44}
            className="size-11"
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">
            ADIMS অ্যাপ ইনস্টল করুন
          </p>

          {promptEvent ? (
            <>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                হোম স্ক্রিনে যুক্ত করে ব্রাউজার ছাড়াই দ্রুত ব্যবহার করুন।
              </p>
              <button
                onClick={install}
                className="mt-2.5 inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition active:scale-[0.98]"
              >
                <Download size={16} strokeWidth={2.4} />
                ইনস্টল করুন
              </button>
            </>
          ) : (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs leading-relaxed text-slate-600">
              Safari-তে
              <Share size={14} className="text-brand-600" aria-hidden />
              <span className="font-semibold text-slate-800">Share</span>
              বাটনে চাপ দিন, তারপর
              <SquarePlus size={14} className="text-brand-600" aria-hidden />
              <span className="font-semibold text-slate-800">
                Add to Home Screen
              </span>
              বেছে নিন।
            </p>
          )}
        </div>

        <button
          onClick={dismiss}
          aria-label="বন্ধ করুন"
          className="-m-1 grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
