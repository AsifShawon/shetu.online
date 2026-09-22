type SectionTitleProps = {
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionTitle({ title, description, align = "center" }: SectionTitleProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <h2 className="legacy-section-title text-3xl leading-tight md:text-4xl">{title}</h2>
      {description ? <p className="mt-3 text-base text-[var(--legacy-muted)] md:text-lg">{description}</p> : null}
    </div>
  );
}

