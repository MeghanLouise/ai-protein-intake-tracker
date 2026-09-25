import { useState } from 'react';

interface Props {
  busy: boolean;
  onSubmit: (text: string, file?: File) => void;
  onInvalid: (message: string) => void;
}

export default function EstimateForm({ busy, onSubmit, onInvalid }: Props) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | undefined>();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() && !file) return onInvalid('Enter a description or choose a photo.');
    onSubmit(text.trim(), file);
  };

  return (
    <form className="estimate-form" onSubmit={submit}>
      <textarea
        rows={3}
        placeholder="e.g. two eggs and a chicken breast"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <label className="file-pick">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0])} />
        <span className="file-pick-label">{file ? file.name : 'Add a photo'}</span>
      </label>
      <button type="submit" disabled={busy}>
        {busy ? 'Estimating…' : 'Estimate protein'}
      </button>
    </form>
  );
}
