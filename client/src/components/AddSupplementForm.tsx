import { useState } from 'react';
import Button from './Button';

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
      <Button type="submit" loading={busy}>
        Add to list
      </Button>
    </form>
  );
}
