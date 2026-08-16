import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  total,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const safeTotalPages = totalPages || 1;

  return (
    <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-4 shadow-sm shadow-primary/5 sm:flex-row sm:items-center sm:px-5">
      <p className="text-center text-base font-medium text-muted-foreground sm:text-left">
        Pagina {page} de {safeTotalPages} - {total} partidas
      </p>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button
          type="button"
          variant="outline"
          aria-label="Ir para a pagina anterior"
          className="h-11 rounded-xl font-semibold"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          aria-label="Ir para a proxima pagina"
          className="h-11 rounded-xl font-semibold"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Proxima
        </Button>
      </div>
    </div>
  );
}
