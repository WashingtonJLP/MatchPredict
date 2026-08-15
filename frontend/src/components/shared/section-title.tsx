type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  return (
    <div className="max-w-[650px]">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {description}
        </p>
      ) : null}
    </div>
  );
}
