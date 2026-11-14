interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  /** Disabled first option shown while nothing is chosen yet. */
  placeholder?: string;
  required?: boolean;
}

// The app's single dropdown. Styling (custom chevron, inset from the edge) lives on `select` in index.css.
export default function Select({ label, value, onChange, options, placeholder, required }: Props) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
