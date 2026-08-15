type ScoreInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function ScoreInput({ label, value, onChange }: ScoreInputProps) {
  return (
    <label className="block min-w-0 text-sm font-semibold text-foreground">
      <span className="block truncate">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-14 w-full rounded-2xl border border-input bg-background px-4 text-center text-2xl font-bold text-foreground outline-none transition hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
      />
    </label>
  );
}
