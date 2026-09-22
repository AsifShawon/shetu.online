import type { PropsWithChildren } from "react";

import { SearchBox } from "./search-box";

type PageBannerProps = PropsWithChildren<{
  title: string;
  description: string;
  image?: string;
  searchAction?: string;
}>;

export function PageBanner({ title, description, image, searchAction, children }: PageBannerProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[var(--legacy-light)]">
      <div className="absolute inset-0 opacity-60">
        <div className="legacy-grid-bg h-full w-full" />
      </div>
      <div className="legacy-container relative grid gap-8 py-14 md:grid-cols-[1.3fr_0.7fr] md:py-20">
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold leading-tight text-[var(--legacy-primary)] md:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--legacy-muted)] md:text-lg">{description}</p>
          {searchAction ? (
            <div className="mt-8 max-w-2xl">
              <SearchBox action={searchAction} />
            </div>
          ) : null}
          {children}
        </div>
        <div className="flex items-center justify-center">
          {image ? <img src={image} alt="" className="max-h-80 w-full max-w-md object-contain" /> : null}
        </div>
      </div>
    </section>
  );
}

