// A small loading spinner. Pass `label` for a full-section loading state (e.g. a page still
// fetching its data); omit it to use just the spinning dot, e.g. inside a busy button.
export default function Spinner({ label }: { label?: string }) {
  // Without a label (e.g. inside a busy button), just the dot: no row padding, decorative only.
  if (!label) return <span className="spinner" aria-hidden="true" />;

  return (
    <span className="spinner-row" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
