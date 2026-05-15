export default function MicButton({
  disabled,
  listening,
  processing,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
}) {
  const label = processing
    ? "Mia is thinking"
    : listening
      ? "Listening—release when you are finished"
      : "Talk to Mia";

  return (
    <button
      type="button"
      className={`mic-button flex items-center justify-center gap-2 px-8 ${
        listening ? "listening ring-4 ring-[var(--color-primary-light)]" : ""
      } ${processing ? "opacity-80" : ""}`}
      disabled={disabled || processing}
      aria-pressed={listening}
      aria-busy={processing}
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      <span aria-hidden>🎤</span>
      <span>{processing ? "Mia is thinking…" : listening ? "Listening…" : "Talk to Mia"}</span>
    </button>
  );
}
