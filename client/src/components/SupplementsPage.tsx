import { useCallback, useEffect, useState } from 'react';
import {
  addSupplement,
  errorMessage,
  getSupplementChecks,
  getSupplements,
  removeSupplement,
  setSupplementCheck,
  todayDate,
} from '../api';
import AddSupplementForm from './AddSupplementForm';
import Spinner from './Spinner';
import SupplementChecklist from './SupplementChecklist';

// The signed-in supplements view: a personal to-take list, and today's checklist against it.
export default function SupplementsPage() {
  const [supplements, setSupplements] = useState<string[] | null>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [list, checks] = await Promise.all([getSupplements(), getSupplementChecks(todayDate())]);
      setSupplements(list.supplements);
      setTaken(checks.taken);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = async (name: string, checked: boolean) => {
    // Optimistic: a checklist should feel instant. Roll back by re-fetching if the save fails.
    setTaken((prev) => (checked ? [...prev, name] : prev.filter((n) => n !== name)));
    try {
      await setSupplementCheck(name, checked);
    } catch (err) {
      setError(errorMessage(err));
      await refresh();
    }
  };

  const add = async (name: string) => {
    setBusy(true);
    try {
      setSupplements((await addSupplement(name)).supplements);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (name: string) => {
    try {
      setSupplements((await removeSupplement(name)).supplements);
      setTaken((prev) => prev.filter((n) => n !== name));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const total = supplements?.length ?? 0;
  const done = taken.length;
  const percent = total > 0 ? Math.min(100, (done / total) * 100) : 0;

  return (
    <>
      {error && <p className="error" role="alert">{error}</p>}
      {supplements ? (
        <div className="layout">
          <div className="column">
            <section className="card progress">
              <p className="eyebrow">Today's supplements</p>
              <div className="totals">
                <span className="total">{done}</span>
                <span className="goal-of">of {total} taken</span>
              </div>
              {total > 0 && (
                <div
                  className="bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={done}
                >
                  <div className="bar-fill" style={{ width: `${percent}%` }} />
                </div>
              )}
            </section>
            <section className="card">
              <h2>Checklist</h2>
              <SupplementChecklist
                supplements={supplements}
                taken={taken}
                onToggle={toggle}
                onRemove={remove}
              />
            </section>
          </div>
          <div className="column">
            <section className="card">
              <h2>Manage your list</h2>
              <AddSupplementForm busy={busy} onAdd={add} />
            </section>
          </div>
        </div>
      ) : !error ? (
        <Spinner label="Loading your supplements…" />
      ) : null}
    </>
  );
}
