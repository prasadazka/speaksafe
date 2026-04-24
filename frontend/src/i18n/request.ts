import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "ar")) {
    locale = routing.defaultLocale;
  }

  const common = (await import(`../messages/${locale}/common.json`)).default;
  const home = (await import(`../messages/${locale}/home.json`)).default;
  const report = (await import(`../messages/${locale}/report.json`)).default;
  const track = (await import(`../messages/${locale}/track.json`)).default;
  const admin = (await import(`../messages/${locale}/admin.json`)).default;
  const components = (
    await import(`../messages/${locale}/components.json`)
  ).default;

  return {
    locale,
    messages: { common, home, report, track, admin, components },
  };
});
