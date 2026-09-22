import type { PropsWithChildren } from "react";

type AuthCardProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  image: string;
}>;

export function AuthCard({ title, subtitle, image, children }: AuthCardProps) {
  return (
    <div className="legacy-auth-shell">
      <div className="legacy-container w-full">
        <div className="legacy-panel mx-auto grid w-full max-w-[980px] gap-6 p-3 md:grid-cols-2 md:p-6">
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <img src="/shetu_logo.jpeg" alt="Shetu logo" className="h-14 w-auto rounded-xl bg-white p-1.5 object-contain shadow-sm" />
            <h2 className="mt-4 text-2xl font-extrabold text-[var(--legacy-primary)]">{title}</h2>
            <p className="mt-3 max-w-md text-[15px] text-[var(--legacy-muted)]">{subtitle}</p>
            <img src={image} alt="" className="mt-8 hidden max-w-[280px] md:block" />
          </div>
          <div className="flex items-center justify-center p-2 md:p-6">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
