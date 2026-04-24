import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { LocaleSync } from "@/components/locale-sync";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = (await import(`@/messages/${locale}/common.json`)).default;
  const home = (await import(`@/messages/${locale}/home.json`)).default;
  const report = (await import(`@/messages/${locale}/report.json`)).default;
  const track = (await import(`@/messages/${locale}/track.json`)).default;
  const admin = (await import(`@/messages/${locale}/admin.json`)).default;
  const components = (await import(`@/messages/${locale}/components.json`))
    .default;

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{
        common: messages,
        home,
        report,
        track,
        admin,
        components,
      }}
    >
      <LocaleSync />
      {children}
    </NextIntlClientProvider>
  );
}
