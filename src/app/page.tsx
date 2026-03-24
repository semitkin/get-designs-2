"use client";

import { useState } from "react";
import type { DesignTokens, HeroDesign } from "@/lib/getDesign";

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

const QUICK_SITES = [
  "https://www.spafinder.com/",
  "https://www.target.com/",
  "https://www.americangreetings.com/",
  "https://www.officedepot.com/",
  "https://www.usps.com/",
  "https://www.kroger.com/",
  "https://www.pricechopper.com/",
  "https://www.panerabread.com/",
  "https://www.barkershoes.com/"
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<DesignTokens | null>(null);
  const [rawLlm, setRawLlm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [heroLoading, setHeroLoading] = useState(false);
  const [heroDesign, setHeroDesign] = useState<HeroDesign | null>(null);
  const [heroRawLlm, setHeroRawLlm] = useState<string | null>(null);
  const [heroError, setHeroError] = useState<string | null>(null);

  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerHtml, setBannerHtml] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerCopied, setBannerCopied] = useState(false);

  async function handleQuickSelect(siteUrl: string) {
    setUrl(siteUrl);
    setLoading(true);
    setError(null);
    setTokens(null);
    setRawLlm(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  async function handleGenerateBannerOnly() {
    if (!heroDesign) return;
    setBannerLoading(true);
    setBannerError(null);
    setBannerHtml(null);
    try {
      const res = await fetch("/api/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  async function handleBuildBannerFull() {
    if (!url.trim()) return;

    // Step 1: Get Designs
    setHeroLoading(true);
    setHeroError(null);
    setHeroDesign(null);
    setHeroRawLlm(null);
    setBannerError(null);
    setBannerHtml(null);

    let fetchedHeroDesign: HeroDesign | null = null;
    try {
      const res = await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHeroError(data.error ?? "Something went wrong.");
        if (data.raw) setHeroRawLlm(data.raw);
        return;
      }
      fetchedHeroDesign = data.heroDesign;
      setHeroDesign(data.heroDesign);
      setHeroRawLlm(data.raw ?? null);
    } catch {
      setHeroError("Network error. Check your connection and try again.");
      return;
    } finally {
      setHeroLoading(false);
    }

    // Step 2: Build Banner
    setBannerLoading(true);
    try {
      const res = await fetch("/api/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroDesign: fetchedHeroDesign, designTokens: tokens }),
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setTokens(null);
    setRawLlm(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Color Design Tokens</h1>
        <p className="text-sm text-gray-500 mb-8">
          Enter a website URL to extract its brand color tokens using AI.
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
            {loading ? "Analyzing…" : "Get Colors"}
          </button>
          <button
            type="button"
            onClick={handleBuildBannerFull}
            disabled={heroLoading || bannerLoading}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {heroLoading ? "Extracting…" : bannerLoading ? "Building…" : "Build Banner"}
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
              <details className="group">
                <summary className="cursor-pointer list-none flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Raw JSON</span>
                  <svg className="h-3 w-3 text-gray-400 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </summary>
                <pre className="rounded-lg bg-gray-900 text-gray-100 text-xs p-5 overflow-x-auto leading-relaxed">
                  {JSON.stringify(tokens, null, 2)}
                </pre>
              </details>
            </section>
          </>
        )}

        {rawLlm && (
          <section className="mt-8">
            <details className="group">
              <summary className="cursor-pointer list-none flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">LLM Raw Output</span>
                <svg className="h-3 w-3 text-gray-400 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </summary>
              <pre className="rounded-lg bg-gray-100 border border-gray-200 text-gray-700 text-xs p-5 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                {rawLlm}
              </pre>
            </details>
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
              <details className="group">
              <summary className="cursor-pointer list-none flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Hero Design</span>
                <svg className="h-3 w-3 text-gray-400 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </summary>

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
              </details>
            </section>

            <section>
              <details className="group">
                <summary className="cursor-pointer list-none flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Raw JSON (Hero Design)</span>
                  <svg className="h-3 w-3 text-gray-400 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </summary>
                <pre className="rounded-lg bg-gray-900 text-gray-100 text-xs p-5 overflow-x-auto leading-relaxed">
                  {JSON.stringify(heroDesign, null, 2)}
                </pre>
              </details>
            </section>
          </>
        )}

        {heroRawLlm && (
          <section className="mt-8">
            <details className="group">
              <summary className="cursor-pointer list-none flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">LLM Raw Output (Hero Design)</span>
                <svg className="h-3 w-3 text-gray-400 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </summary>
              <pre className="rounded-lg bg-gray-100 border border-gray-200 text-gray-700 text-xs p-5 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                {heroRawLlm}
              </pre>
            </details>
          </section>
        )}

        {heroDesign && (
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGenerateBannerOnly}
              disabled={bannerLoading}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {bannerLoading ? "Building…" : "Generate Banner"}
            </button>
          </div>
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
              <div className="flex flex-col gap-6">
                {/* Desktop — full-bleed 100% viewport width */}
                <div style={{ width: "100vw", position: "relative", left: "50%", transform: "translateX(-50%)", paddingLeft: 16, paddingRight: 16 }}>
                  <div className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    Desktop <span className="text-gray-300">100%</span>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <iframe
                      srcDoc={bannerHtml}
                      className="border-0 block w-full"
                      style={{ height: 350 }}
                      scrolling="no"
                      onLoad={(e) => {
                        const iframe = e.currentTarget;
                        const contentHeight = iframe.contentDocument?.body.scrollHeight ?? 350;
                        iframe.style.height = contentHeight + "px";
                      }}
                    />
                  </div>
                </div>
                {/* Mobile */}
                <div>
                  <div className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="18" r="0.5" fill="currentColor"/></svg>
                    Mobile <span className="text-gray-300">390px</span>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm w-fit">
                    <iframe
                      srcDoc={bannerHtml}
                      className="border-0 block"
                      style={{ width: 390, height: 300 }}
                      scrolling="no"
                      onLoad={(e) => {
                        const iframe = e.currentTarget;
                        iframe.style.height = iframe.contentDocument?.body.scrollHeight + "px";
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6">
              <details className="group">
                <summary className="cursor-pointer list-none flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Raw HTML</span>
                  <svg className="h-3 w-3 text-gray-400 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </summary>
                <pre className="rounded-lg bg-gray-900 text-gray-100 text-xs p-5 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {bannerHtml}
                </pre>
              </details>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
