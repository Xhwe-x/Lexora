import Image from "next/image";

import { translate } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

const languages = [
  ["hr.svg", "languages.croatian"],
  ["es.svg", "languages.spanish"],
  ["fr.svg", "languages.french"],
  ["it.svg", "languages.italian"],
  ["jp.svg", "languages.japanese"],
] as const;

export const Footer = async () => {
  const locale = await getRequestLocale();

  return (
    <div className="hidden h-20 w-full border-t-2 border-slate-200 p-2 lg:block">
      <ul className="mx-auto flex h-full max-w-screen-lg items-center justify-evenly">
        {languages.map(([icon, key]) => {
          const label = translate(locale, key);

          return (
            <li
              key={key}
              className="flex w-full items-center justify-center px-3 py-2 text-sm font-bold text-slate-500"
            >
              <Image
                src={`/${icon}`}
                alt=""
                aria-hidden="true"
                height={30}
                width={40}
                className="mr-4 rounded-md"
              />
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
