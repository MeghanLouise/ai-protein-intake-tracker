import { useState } from 'react';
import { errorMessage, estimateProtein, readImage, saveEntry } from '../api';
import type { Estimate } from '../types';
import ConfirmForm from './ConfirmForm';
import EstimateForm from './EstimateForm';

interface Props {
  onSaved: () => void;
}

// Two steps: describe the meal -> review the AI's estimate and save.
export default function AddMealForm({ onSaved }: Props) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const runEstimate = async (text: string, file?: File) => {
    setBusy(true);
    setStatus('Estimating…');
    try {
      const image = file ? await readImage(file) : undefined;
      setEstimate(await estimateProtein(text, image));
      setStatus('');
    } catch (err) {
      setStatus(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const save = async (description: string, grams: number) => {
    setBusy(true);
    try {
      await saveEntry(description, grams);
      setEstimate(null);
      setStatus('');
      onSaved();
    } catch (err) {
      setStatus(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card add-meal">
      <h2>What did you eat?</h2>
      {estimate ? (
        <ConfirmForm
          estimate={estimate}
          busy={busy}
          onSave={save}
          onCancel={() => setEstimate(null)}
        />
      ) : (
        <EstimateForm busy={busy} onSubmit={runEstimate} onInvalid={setStatus} />
      )}
      <p className="status" role="status">{status}</p>
    </section>
  );
}
