type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-5 sm:pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-[650px]">
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base sm:leading-7">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
