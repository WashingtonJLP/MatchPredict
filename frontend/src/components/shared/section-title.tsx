type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  return (
    <div className="max-w-[650px]">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase text-emerald-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-7 text-slate-600">
          {description}
        </p>
      ) : null}
    </div>
  );
}
