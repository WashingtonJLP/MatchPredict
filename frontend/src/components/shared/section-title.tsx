type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  return (
    <div className="max-w-[720px]">
      {eyebrow ? (
        <p className="text-sm font-bold uppercase tracking-wide text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          {description}
        </p>
      ) : null}
    </div>
  );
}
