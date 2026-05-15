const CATEGORIES = [
  { value: "career", label: "Career" },
  { value: "family", label: "Family" },
  { value: "hobby", label: "Hobby" },
  { value: "place", label: "Place" },
  { value: "relationship", label: "Relationship" },
  { value: "other", label: "Other" },
];

export default function MemoryFormRow({
  value,
  category,
  emotionalWeight,
  onChange,
  onRemove,
  canRemove,
  index,
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-semibold text-[var(--color-text)]">
          Memory {index + 1}
        </p>
        {canRemove ? (
          <button
            type="button"
            className="min-h-[52px] rounded-full border border-[var(--color-border)] bg-white px-4 text-base font-semibold text-[var(--color-text)]"
            onClick={() => onRemove(index)}
            aria-label={`Remove memory ${index + 1}`}
          >
            Remove
          </button>
        ) : null}
      </div>

      <label className="mb-2 block text-base font-semibold" htmlFor={`memory-text-${index}`}>
        What should Mia remember?
      </label>
      <textarea
        id={`memory-text-${index}`}
        className="mb-4 w-full min-h-[88px] resize-y rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-4 py-3 text-lg text-[var(--color-text)] outline-none ring-[var(--color-primary)] focus:ring-2"
        rows={3}
        value={value}
        onChange={(e) => onChange(index, { memoryText: e.target.value })}
        placeholder="Write a short, loving detail from their life…"
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-2 block text-base font-semibold" htmlFor={`memory-cat-${index}`}>
            Category
          </label>
          <select
            id={`memory-cat-${index}`}
            className="h-[52px] w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-4 text-lg text-[var(--color-text)] outline-none ring-[var(--color-primary)] focus:ring-2"
            value={category}
            onChange={(e) => onChange(index, { category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="min-w-0 flex-1">
          <legend className="mb-2 text-base font-semibold">Emotional weight</legend>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "positive", label: "😊 Positive" },
              { value: "neutral", label: "😐 Neutral" },
              { value: "sensitive", label: "💙 Sensitive" },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`inline-flex min-h-[52px] cursor-pointer items-center gap-2 rounded-full border px-4 text-base font-semibold ${
                  emotionalWeight === opt.value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-pale)] text-[var(--color-text)]"
                    : "border-[var(--color-border)] bg-white text-[var(--color-text)]"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={`weight-${index}`}
                  value={opt.value}
                  checked={emotionalWeight === opt.value}
                  onChange={() => onChange(index, { emotionalWeight: opt.value })}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
