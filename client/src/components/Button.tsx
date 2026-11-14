import type { ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';

export type ButtonVariant =
  | 'primary' // filled pill: the main action of a form
  | 'secondary' // frosted, outlined pill: Cancel and other lesser actions
  | 'link' // text-only, underlined
  | 'google' // white "Continue with Google" pill
  | 'chip' // small toggle pill (filters, tags)
  | 'category' // larger toggle tile (workout category grid)
  | 'icon'; // small round icon-only button (edit, delete, repeat)

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: '',
  secondary: 'secondary',
  link: 'link',
  google: 'google',
  chip: 'chip',
  category: 'category-btn',
  icon: 'icon-btn',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Shows a spinner and disables the button while an action is in flight. */
  loading?: boolean;
  /** For toggle variants (chip, category): marks the button as the active choice. */
  selected?: boolean;
}

// The app's single button. Styling lives in index.css, keyed by the classes in VARIANT_CLASS.
export default function Button({
  variant = 'primary',
  loading = false,
  selected,
  className,
  type = 'button',
  disabled,
  children,
  ...rest
}: Props) {
  const classes = [VARIANT_CLASS[variant], selected ? 'is-selected' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <button
      {...rest}
      type={type}
      className={classes || undefined}
      disabled={disabled || loading}
      aria-pressed={selected}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
