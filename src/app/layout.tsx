import { Manrope, Playfair_Display } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});
const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const themeScript = `(()=>{try{const s=localStorage.getItem('ax7-theme');const m=matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.dataset.theme=s||(m?'dark':'light')}catch(e){document.documentElement.dataset.theme='dark'}})()`;
  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
      <body id="top" className={`${sans.variable} ${display.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
