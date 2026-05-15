import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MemoryFormRow from "../components/MemoryFormRow.jsx";
import { getMemories, getStatus, postSetup } from "../services/api.js";

function blankRow() {
  return {
    memoryText: "",
    category: "other",
    emotionalWeight: "positive",
  };
}

export default function SetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = Boolean(location.state?.editSetup);

  const [preferredName, setPreferredName] = useState("");
  const [rows, setRows] = useState(() =>
    Array.from({ length: 5 }, () => blankRow())
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const status = await getStatus();
        if (cancelled) return;

        if (status.setupComplete && !editMode) {
          navigate("/home", { replace: true });
          return;
        }

        if (status.setupComplete && editMode) {
          setPreferredName(status.preferredName || "");
          const memories = await getMemories();
          const mapped = (memories || []).map((m) => ({
            memoryText: m.memory_text || "",
            category: m.category || "other",
            emotionalWeight: m.emotional_weight || "positive",
          }));

          const padded =
            mapped.length >= 5
              ? mapped
              : [
                  ...mapped,
                  ...Array.from({ length: 5 - mapped.length }, () => blankRow()),
                ];

          setRows(padded);
        }
      } catch (e) {
        if (!cancelled) {
          setFormError(
            e?.response?.data?.error ||
              e?.message ||
              "Could not load setup. Please check your connection."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editMode, navigate, location.key]);

  const filledRows = useMemo(
    () => rows.filter((r) => r.memoryText.trim().length > 0),
    [rows]
  );

  const updateRow = (index, patch) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, blankRow()]);
  };

  const removeRow = (index) => {
    setRows((prev) => {
      if (prev.length <= 5) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (filledRows.length < 5) {
      setFormError("Please enter at least five meaningful memories.");
      return;
    }

    if (!preferredName.trim()) {
      setFormError("Please enter the name Mia should use.");
      return;
    }

    setSaving(true);
    try {
      await postSetup({
        preferredName: preferredName.trim(),
        memories: filledRows.map((r) => ({
          memoryText: r.memoryText.trim(),
          category: r.category,
          emotionalWeight: r.emotionalWeight,
        })),
      });
      navigate("/home", { replace: true });
    } catch (err) {
      const details = err?.response?.data?.details;
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Could not save setup. Please try again.";
      setFormError(
        Array.isArray(details)
          ? `${msg}: ${details.map((d) => d.message).join(" ")}`
          : msg
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <p className="text-lg text-[var(--color-text-muted)]">Loading setup…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          MemoryBridge
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[var(--color-text)] sm:text-4xl">
          Set up Mia for your loved one
        </h1>
        <p className="mt-3 text-lg text-[var(--color-text-muted)]">
          Gentle, one-time setup. After this, they can simply open MemoryBridge and talk with Mia.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm sm:p-8"
      >
        <div>
          <label className="mb-2 block text-lg font-semibold" htmlFor="preferredName">
            What should Mia call them?
          </label>
          <input
            id="preferredName"
            className="h-[52px] w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-4 text-lg text-[var(--color-text)] outline-none ring-[var(--color-primary)] focus:ring-2"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            autoComplete="off"
            placeholder="For example: Maria"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">Life memories</h2>
            <button
              type="button"
              className="min-h-[52px] rounded-full border border-[var(--color-border)] bg-white px-5 text-base font-semibold text-[var(--color-text)]"
              onClick={addRow}
              aria-label="Add another memory"
            >
              + Add memory
            </button>
          </div>
          <p className="text-base text-[var(--color-text-muted)]">
            Add at least five memories. More detail helps Mia feel like a lifelong friend.
          </p>

          {rows.map((row, index) => (
            <MemoryFormRow
              key={index}
              index={index}
              value={row.memoryText}
              category={row.category}
              emotionalWeight={row.emotionalWeight}
              onChange={updateRow}
              onRemove={removeRow}
              canRemove={rows.length > 5}
            />
          ))}
        </div>

        {formError ? (
          <p className="rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-3 text-base text-red-900">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          className="min-h-[52px] w-full rounded-full bg-[var(--color-primary)] text-lg font-bold text-white shadow-md transition hover:bg-[var(--color-primary-light)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          aria-label="Save memories and start Mia"
        >
          {saving ? "Saving…" : "Save & Start Mia →"}
        </button>
      </form>
    </div>
  );
}
