import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { api, isUnauthorizedError } from "../../lib/api";
import type { Competition } from "../../lib/types";

type AppDataContextValue = {
  competitions: Competition[];
  selectedCompetitionId: number | null;
  selectedCompetition: Competition | null;
  setSelectedCompetitionId: (competitionId: number | null) => void;
  refreshCompetitions: () => Promise<void>;
  loading: boolean;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);
const STORAGE_KEY = "certificationflow.selectedCompetitionId";

export function AppDataProvider({ children }: PropsWithChildren) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionIdState] = useState<number | null>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshCompetitions = async () => {
    setLoading(true);
    try {
      const items = await api.fetchCompetitions();
      setCompetitions(items);
      if (!items.length) {
        setSelectedCompetitionIdState(null);
        return;
      }
      setSelectedCompetitionIdState((current) => {
        const next = current && items.some((item) => item.id === current) ? current : items[0].id;
        window.localStorage.setItem(STORAGE_KEY, String(next));
        return next;
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setCompetitions([]);
        setSelectedCompetitionIdState(null);
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshCompetitions();
  }, []);

  const setSelectedCompetitionId = (competitionId: number | null) => {
    setSelectedCompetitionIdState(competitionId);
    if (competitionId === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, String(competitionId));
    }
  };

  const value = useMemo(
    () => ({
      competitions,
      selectedCompetitionId,
      selectedCompetition: competitions.find((competition) => competition.id === selectedCompetitionId) ?? null,
      setSelectedCompetitionId,
      refreshCompetitions,
      loading,
    }),
    [competitions, loading, selectedCompetitionId],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
