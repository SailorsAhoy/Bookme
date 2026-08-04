import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

export async function getLocale(fallback?: string): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = jar.get("NEXT_LOCALE")?.value;
  if (fromCookie && locales.includes(fromCookie as Locale)) {
    return fromCookie as Locale;
  }
  if (fallback && locales.includes(fallback as Locale)) {
    return fallback as Locale;
  }
  return defaultLocale;
}
