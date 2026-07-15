import { useState } from 'react';
import {
  importAppleCalendar,
  type ImportAppleCalendarResult,
} from '../api/calendar';
import { getErrorMessage } from '../utils/errors';

export function useAppleCalendarImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importCalendar = async (
    appleId: string,
    appSpecificPassword: string,
  ): Promise<ImportAppleCalendarResult | null> => {
    setError(null);
    setLoading(true);
    try {
      return await importAppleCalendar({ appleId, appSpecificPassword });
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { importCalendar, loading, error };
}
