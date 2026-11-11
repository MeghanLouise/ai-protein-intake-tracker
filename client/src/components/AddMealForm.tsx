import { useState } from 'react';
import { errorMessage, estimateNutrition, readImage, saveEntry, saveMealConfig } from '../api';
import type { Estimate, SavedMeal } from '../types';
import ConfirmForm, { type SaveAsMeal } from './ConfirmForm';
import EstimateForm from './EstimateForm';
import SavedMealsPicker from './SavedMealsPicker';

interface Props {
  onSaved: () => void;
}

// Two steps: describe the meal (or pick a saved one) -> review the estimate and save.
export default function AddMealForm({ onSaved }: Props) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [savedMealsVersion, setSavedMealsVersion] = useState(0);

  const runEstimate = async (text: string, file?: File) => {
    setBusy(true);
    setStatus('Estimating…');
    try {
      const image = file ? await readImage(file) : undefined;
      setEstimate(await estimateNutrition(text, image));
      setStatus('');
    } catch (err) {
      setStatus(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const save = async (
    description: string,
    grams: number,
    calories: number,
    fiber: number,
    saveAsMeal?: SaveAsMeal,
  ) => {
    setBusy(true);
    try {
      await saveEntry(description, grams, calories, fiber);
      if (saveAsMeal) {
        try {
          await saveMealConfig(saveAsMeal.name, saveAsMeal.tag, description, grams, calories, fiber);
          setSavedMealsVersion((v) => v + 1);
        } catch (err) {
          setStatus(`Logged, but couldn't save it for later: ${errorMessage(err)}`);
        }
      }
      setEstimate(null);
      if (!saveAsMeal) setStatus('');
      onSaved();
    } catch (err) {
      setStatus(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const useSavedMeal = (meal: SavedMeal) => {
    setStatus('');
    setEstimate({
      description: meal.description,
      protein_g: meal.protein_g,
      calories: meal.calories,
      fiber_g: meal.fiber_g,
      breakdown: `From your saved "${meal.name}" (${meal.tag}).`,
    });
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
        <>
          <EstimateForm busy={busy} onSubmit={runEstimate} onInvalid={setStatus} />
          <SavedMealsPicker refreshKey={savedMealsVersion} onUse={useSavedMeal} />
        </>
      )}
      <p className="status" role="status">{status}</p>
    </section>
  );
}
