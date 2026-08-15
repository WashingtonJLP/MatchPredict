type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-border pb-6 sm:pb-7 md:flex-row md:items-end md:justify-between">
      <div className="max-w-[650px]">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground sm:mt-4 sm:text-lg sm:leading-8">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
