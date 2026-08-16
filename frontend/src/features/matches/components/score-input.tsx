type ScoreInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function ScoreInput({ label, value, onChange }: ScoreInputProps) {
  return (
    <label className="block min-w-0 text-sm font-bold text-foreground sm:text-base">
      <span className="block truncate">{label}</span>
      <input
        type="number"
        min={0}
        aria-label={`Placar de ${label}`}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-14 w-full rounded-xl border border-input bg-background px-4 text-center text-2xl font-extrabold text-foreground outline-none transition hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
      />
    </label>
  );
}
