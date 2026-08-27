import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|admin|ax7-vault-9k4m2|studio|_next|_vercel|.*\\..*).*)",
};
