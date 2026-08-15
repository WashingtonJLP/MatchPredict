type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-[650px]">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
