"use client";

import { useState, useEffect, useRef } from "react";
import type { DesignTokens } from "@/lib/schema";
import type { HeroDesign } from "@/lib/heroSchema";

const STORAGE_KEY = "openai_api_key";

const TOKEN_LABELS: Record<keyof DesignTokens, string> = {
  primary: "Primary",
  secondary: "Secondary",
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
  neutral: "Neutral",
};

const TOKEN_ORDER: Array<keyof DesignTokens> = [
  "primary",
  "secondary",
  "success",
  "error",
  "warning",
  "info",
  "neutral",
];

function SettingsModal({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void;
  onSave: (key: string) => void;
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(value.trim());
    onClose();
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              OpenAI API Key
            </label>
            <input
              ref={inputRef}
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Stored in browser localStorage. Never sent anywhere except directly to OpenAI via this app&apos;s server.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const QUICK_SITES = [
  "https://www.spafinder.com/",
  "https://www.target.com/",
  "https://www.americangreetings.com/",
  "https://www.officedepot.com/",
  "https://www.usps.com/",
  "https://www.kroger.com/",
  "https://www.pricechopper.com/",
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<DesignTokens | null>(null);
  const [rawLlm, setRawLlm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const [heroLoading, setHeroLoading] = useState(false);
  const [heroDesign, setHeroDesign] = useState<HeroDesign | null>(null);
  const [heroRawLlm, setHeroRawLlm] = useState<string | null>(null);
  const [heroError, setHeroError] = useState<string | null>(null);

  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerHtml, setBannerHtml] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerCopied, setBannerCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) ?? "";
    setApiKey(stored);
    if (!stored) setShowSettings(true);
  }, []);

  function handleSaveKey(key: string) {
    setApiKey(key);
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async function handleQuickSelect(siteUrl: string) {
    setUrl(siteUrl);
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    setLoading(true);
    setError(null);
    setTokens(null);
    setRawLlm(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-OpenAI-Key": apiKey,
        },
        body: JSON.stringify({ url: siteUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        if (data.raw) setRawLlm(data.raw);
      } else {
        setTokens(data.designTokens);
        setRawLlm(data.raw ?? null);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuildBanner() {
    if (!heroDesign) return;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    setBannerLoading(true);
    setBannerError(null);
    setBannerHtml(null);
    try {
      const res = await fetch("/api/banner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-OpenAI-Key": apiKey,
        },
        body: JSON.stringify({ heroDesign, designTokens: tokens }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBannerError(data.error ?? "Something went wrong.");
      } else {
        setBannerHtml(data.html);
      }
    } catch {
      setBannerError("Network error. Check your connection and try again.");
    } finally {
      setBannerLoading(false);
    }
  }

  async function handleGetDesigns() {
    if (!url.trim()) return;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    setHeroLoading(true);
    setHeroError(null);
    setHeroDesign(null);
    setHeroRawLlm(null);
    try {
      const res = await fetch("/api/hero", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-OpenAI-Key": apiKey,
        },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHeroError(data.error ?? "Something went wrong.");
        if (data.raw) setHeroRawLlm(data.raw);
      } else {
        setHeroDesign(data.heroDesign);
        setHeroRawLlm(data.raw ?? null);
      }
    } catch {
      setHeroError("Network error. Check your connection and try again.");
    } finally {
      setHeroLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    setLoading(true);
    setError(null);
    setTokens(null);
    setRawLlm(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-OpenAI-Key": apiKey,
        },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        if (data.raw) setRawLlm(data.raw);
      } else {
        setTokens(data.designTokens);
        setRawLlm(data.raw ?? null);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSave={handleSaveKey}
          initial={apiKey}
        />
      )}

      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-2xl font-semibold text-gray-900">Color Design Tokens</h1>
          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
            className="mt-0.5 rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-8">
          Enter a website URL to extract its brand color tokens using AI.
          {!apiKey && (
            <span className="ml-1 text-amber-600">
              — <button onClick={() => setShowSettings(true)} className="underline underline-offset-2 hover:text-amber-700">Add your OpenAI key</button> to get started.
            </span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-10">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://stripe.com"
            required
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Analyzing…" : "Generate"}
          </button>
          <button
            type="button"
            onClick={handleGetDesigns}
            disabled={heroLoading}
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {heroLoading ? "Extracting…" : "Get Designs"}
          </button>
          <button
            type="button"
            onClick={handleBuildBanner}
            disabled={!heroDesign || bannerLoading}
            title={!heroDesign ? "Run 'Get Designs' first" : undefined}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {bannerLoading ? "Building…" : "Build Banner"}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 -mt-6 mb-8">
          {QUICK_SITES.map((site) => {
            const label = new URL(site).hostname.replace(/^www\./, "");
            return (
              <button
                key={site}
                type="button"
                onClick={() => handleQuickSelect(site)}
                disabled={loading}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-8">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-sm text-gray-400 text-center py-12">
            Analyzing brand colors…
          </div>
        )}

        {tokens && (
          <>
            <section className="mb-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Color Tokens
              </h2>
              <div className="flex flex-col gap-2">
                {TOKEN_ORDER.map((key) => {
                  const token = tokens[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-4 rounded-lg bg-white border border-gray-200 px-4 py-3"
                    >
                      <div
                        className="h-10 w-10 flex-shrink-0 rounded-md border border-black/10"
                        style={{ backgroundColor: token.value }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {TOKEN_LABELS[key]}
                        </div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {token.label}
                        </div>
                      </div>
                      <span className="font-mono text-sm text-gray-600 tabular-nums">
                        {token.value.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Raw JSON
              </h2>
              <pre className="rounded-lg bg-gray-900 text-gray-100 text-xs p-5 overflow-x-auto leading-relaxed">
                {JSON.stringify(tokens, null, 2)}
              </pre>
            </section>
          </>
        )}

        {rawLlm && (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              LLM Raw Output
            </h2>
            <pre className="rounded-lg bg-gray-100 border border-gray-200 text-gray-700 text-xs p-5 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
              {rawLlm}
            </pre>
          </section>
        )}

        {heroError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mt-8">
            {heroError}
          </div>
        )}

        {heroLoading && (
          <div className="text-sm text-gray-400 text-center py-12">
            Extracting design elements…
          </div>
        )}

        {heroDesign && (
          <>
            <section className="mt-10 mb-8">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Hero Design
              </h2>

              <div className="flex flex-col gap-3">
                {/* Logo */}
                <div className="rounded-lg bg-white border border-gray-200 px-4 py-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Logo</div>
                  <p className="text-sm text-gray-900">{heroDesign.logo.description}</p>
                  {heroDesign.logo.colors.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {heroDesign.logo.colors.map((c) => (
                        <div key={c} className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded border border-black/10 flex-shrink-0" style={{ backgroundColor: c }} />
                          <span className="font-mono text-xs text-gray-500">{c.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hero */}
                <div className="rounded-lg bg-white border border-gray-200 px-4 py-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Hero Banner</div>
                  <div className="flex flex-col gap-1.5 text-sm">
                    {heroDesign.hero.headline && (
                      <div><span className="text-gray-400 text-xs">Headline: </span><span className="text-gray-900 font-medium">{heroDesign.hero.headline}</span></div>
                    )}
                    {heroDesign.hero.subheadline && (
                      <div><span className="text-gray-400 text-xs">Subheadline: </span><span className="text-gray-700">{heroDesign.hero.subheadline}</span></div>
                    )}
                    {heroDesign.hero.ctaText && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">CTA: </span>
                        <span className="text-gray-900">{heroDesign.hero.ctaText}</span>
                        <div className="h-4 w-4 rounded border border-black/10" style={{ backgroundColor: heroDesign.hero.ctaColor }} />
                        <span className="font-mono text-xs text-gray-500">{heroDesign.hero.ctaColor.toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">Background: </span>
                      <div className="h-4 w-4 rounded border border-black/10" style={{ backgroundColor: heroDesign.hero.backgroundColor }} />
                      <span className="font-mono text-xs text-gray-500">{heroDesign.hero.backgroundColor.toUpperCase()}</span>
                    </div>
                    {heroDesign.hero.layout && (
                      <div><span className="text-gray-400 text-xs">Layout: </span><span className="text-gray-700">{heroDesign.hero.layout}</span></div>
                    )}
                    {heroDesign.hero.imageDescription && heroDesign.hero.imageDescription !== "none" && (
                      <div><span className="text-gray-400 text-xs">Image: </span><span className="text-gray-700">{heroDesign.hero.imageDescription}</span></div>
                    )}
                  </div>
                </div>

                {/* Taglines */}
                {heroDesign.taglines.length > 0 && (
                  <div className="rounded-lg bg-white border border-gray-200 px-4 py-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Taglines & Mottos</div>
                    <ul className="flex flex-col gap-1">
                      {heroDesign.taglines.map((t, i) => (
                        <li key={i} className="text-sm text-gray-900 italic">&ldquo;{t}&rdquo;</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Typography + Visual Style */}
                <div className="rounded-lg bg-white border border-gray-200 px-4 py-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Typography & Style</div>
                  <div className="flex flex-col gap-1 text-sm">
                    {heroDesign.typography.primaryFont && (
                      <div><span className="text-gray-400 text-xs">Font: </span><span className="text-gray-900">{heroDesign.typography.primaryFont}</span></div>
                    )}
                    {heroDesign.typography.headingStyle && (
                      <div><span className="text-gray-400 text-xs">Heading style: </span><span className="text-gray-700">{heroDesign.typography.headingStyle}</span></div>
                    )}
                    {heroDesign.visualStyle && (
                      <div><span className="text-gray-400 text-xs">Visual mood: </span><span className="text-gray-700">{heroDesign.visualStyle}</span></div>
                    )}
                  </div>
                </div>

                {/* Dominant Colors */}
                {heroDesign.dominantColors.length > 0 && (
                  <div className="rounded-lg bg-white border border-gray-200 px-4 py-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Dominant Colors</div>
                    <div className="flex gap-3">
                      {heroDesign.dominantColors.map((c) => (
                        <div key={c} className="flex items-center gap-1.5">
                          <div className="h-8 w-8 rounded-md border border-black/10" style={{ backgroundColor: c }} />
                          <span className="font-mono text-xs text-gray-600">{c.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Raw JSON (Hero Design)
              </h2>
              <pre className="rounded-lg bg-gray-900 text-gray-100 text-xs p-5 overflow-x-auto leading-relaxed">
                {JSON.stringify(heroDesign, null, 2)}
              </pre>
            </section>
          </>
        )}

        {heroRawLlm && (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              LLM Raw Output (Hero Design)
            </h2>
            <pre className="rounded-lg bg-gray-100 border border-gray-200 text-gray-700 text-xs p-5 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
              {heroRawLlm}
            </pre>
          </section>
        )}

        {bannerError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mt-8">
            {bannerError}
          </div>
        )}

        {bannerLoading && (
          <div className="text-sm text-gray-400 text-center py-12">
            Building banner…
          </div>
        )}

        {bannerHtml && (
          <>
            <section className="mt-10 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Banner Preview
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(bannerHtml);
                    setBannerCopied(true);
                    setTimeout(() => setBannerCopied(false), 2000);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  {bannerCopied ? "Copied!" : "Copy HTML"}
                </button>
              </div>
              <div
                className="rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                dangerouslySetInnerHTML={{ __html: bannerHtml }}
              />
            </section>

            <section className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Raw HTML
              </h2>
              <pre className="rounded-lg bg-gray-900 text-gray-100 text-xs p-5 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {bannerHtml}
              </pre>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
