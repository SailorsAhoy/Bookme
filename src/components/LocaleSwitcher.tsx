"use client";

import { useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";

type Props = {
  current: string;
  enabledLocales?: string[];
  className?: string;
};

export function LocaleSwitcher({ current, enabledLocales, className }: Props) {
  const router = useRouter();
  const available = (enabledLocales?.length
    ? locales.filter((l) => enabledLocales.includes(l))
    : locales) as Locale[];

  function change(locale: string) {
    // Store preference in cookie (1 year)
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  }

  return (
    <select
      value={current}
      onChange={(e) => change(e.target.value)}
      className={
        className ||
        "text-sm border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-700"
      }
      aria-label="Language"
    >
      {available.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}
