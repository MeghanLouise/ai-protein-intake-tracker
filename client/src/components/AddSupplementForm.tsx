import { useState } from 'react';
import Spinner from './Spinner';

interface Props {
  busy: boolean;
  onAdd: (name: string) => void;
}

// A small form to add a new item to the supplement list.
export default function AddSupplementForm({ busy, onAdd }: Props) {
  const [name, setName] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
  };

  return (
    <form className="add-supplement-form" onSubmit={submit}>
      <label>
        Add a supplement
        <input
          type="text"
          placeholder="e.g. Vitamin D"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <button type="submit" disabled={busy}>
        {busy && <Spinner />}
        Add to list
      </button>
    </form>
  );
}
