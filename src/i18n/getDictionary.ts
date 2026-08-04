import type { Locale } from "./config";
import { defaultLocale } from "./config";

const dictionaries = {
  en: () => import("../../messages/en.json").then((m) => m.default),
  es: () => import("../../messages/es.json").then((m) => m.default),
  // Fallbacks for other locales until full translations exist
  it: () => import("../../messages/en.json").then((m) => m.default),
  fr: () => import("../../messages/en.json").then((m) => m.default),
  de: () => import("../../messages/en.json").then((m) => m.default),
} as const;

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["en"]>>;

export async function getDictionary(locale: string): Promise<Dictionary> {
  const key = (locale in dictionaries ? locale : defaultLocale) as Locale;
  return dictionaries[key]();
}

/**
 * Simple client-side interpolator: "Hello {name}" + { name: "Ada" } → "Hello Ada"
 */
export function t(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    template
  );
}
