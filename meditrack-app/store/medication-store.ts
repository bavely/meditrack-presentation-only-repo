import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { medicationHistory, upcomingDoses } from "../constants/medications";
import { Medication, MedicationDose, MedicationHistory, ParsedMedication } from "../types/medication";

interface MedicationState {
  medications: Medication[];
  medicationHistory: MedicationHistory[];
  upcomingDoses: MedicationDose[];
  todaysTakenCount: number;
  todaysTotalCount: number;
  adherenceRate: number;
  draft: any;
  parsedMedication: ParsedMedication | null;
  // Actions
  addMedication: (medication: Medication) => void;
  updateMedication: (id: string, medication: Partial<Medication>) => void;
  toggleArchive: (id: string, isArchived: boolean) => void;
  toggleReminder: (id: string, isReminderOn: boolean) => void;
  deleteMedication: (id: string) => void;
  markDoseAsTaken: (doseId: string) => void;
  markDoseAsSkipped: (doseId: string) => void;
  calculateAdherenceRate: () => void;
  refreshUpcomingDoses: () => void;
  setDraft: (draft: any) => void;
  setParsedMedication: (parsedMedication: ParsedMedication) => void;
  setMedications: (medications: Medication[]) => void;
}

export const useMedicationStore = create<MedicationState>()(
  persist(
    (set, get) => ({
      medications: [],
      medicationHistory: medicationHistory,
      upcomingDoses: upcomingDoses,
      todaysTakenCount: 0,
      todaysTotalCount: 0,
      adherenceRate: 0,
      draft: {},
      parsedMedication: null,


      

      setMedications: (medications) => set({ medications }),

      setDraft: (draft) => set({ draft }),

      addMedication: (medication) => {
        set((state) => ({
          medications: [...state.medications, medication],
        }));
        get().refreshUpcomingDoses();
      },

      updateMedication: (id, updatedMedication) => {
        set((state) => ({
          medications: state.medications.map((med) =>
            med.id === id ? { ...med, ...updatedMedication } : med
          ),
        }));
        get().refreshUpcomingDoses();
      },

      toggleArchive: (id, isArchived) => {
        set((state) => ({
          medications: state.medications.map((med) =>
            med.id === id ? { ...med, isArchived } : med
          ),
        }));
      },

      toggleReminder: (id, isReminderOn) => {
        set((state) => ({
          medications: state.medications.map((med) =>
            med.id === id ? { ...med, isReminderOn } : med
          ),
        }));
      },

      deleteMedication: (id) => {
        set((state) => ({
          medications: state.medications.filter((med) => med.id !== id),
          medicationHistory: state.medicationHistory.filter(
            (history) => history.medicationId !== id
          ),
          upcomingDoses: state.upcomingDoses.filter(
            (dose) => dose.medicationId !== id
          ),
        }));
      },

      markDoseAsTaken: (doseId) => {
        const dose = get().upcomingDoses.find((d) => d.id === doseId);
        if (!dose) return;

        const now = new Date();
        const newHistoryEntry: MedicationHistory = {
          id: Date.now().toString(),
          medicationId: dose.medicationId,
          date: now.toISOString().split("T")[0],
          time: now.toTimeString().slice(0, 5),
          status: "taken",
        };

        set((state) => ({
          medicationHistory: [...state.medicationHistory, newHistoryEntry],
          upcomingDoses: state.upcomingDoses.map((d) =>
            d.id === doseId ? { ...d, status: "taken" } : d
          ),
        }));

        get().calculateAdherenceRate();
      },

      markDoseAsSkipped: (doseId) => {
        const dose = get().upcomingDoses.find((d) => d.id === doseId);
        if (!dose) return;

        const now = new Date();
        const newHistoryEntry: MedicationHistory = {
          id: Date.now().toString(),
          medicationId: dose.medicationId,
          date: now.toISOString().split("T")[0],
          time: now.toTimeString().slice(0, 5),
          status: "skipped",
        };

        set((state) => ({
          medicationHistory: [...state.medicationHistory, newHistoryEntry],
          upcomingDoses: state.upcomingDoses.map((d) =>
            d.id === doseId ? { ...d, status: "skipped" } : d
          ),
        }));

        get().calculateAdherenceRate();
      },

      calculateAdherenceRate: () => {
        const today = new Date().toISOString().split("T")[0];
        const todaysHistory = get().medicationHistory.filter(
          (h) => h.date === today
        );
        
        const takenCount = todaysHistory.filter(
          (h) => h.status === "taken"
        ).length;
        
        const totalDoses = get().upcomingDoses.length;
        const adherenceRate = totalDoses > 0 ? (takenCount / totalDoses) * 100 : 0;
        
        set({
          todaysTakenCount: takenCount,
          todaysTotalCount: totalDoses,
          adherenceRate,
        });
      },

      refreshUpcomingDoses: () => {
        // In a real app, this would calculate upcoming doses based on
        // medication schedules and current time
        set({ upcomingDoses });
        get().calculateAdherenceRate();
      },

      setParsedMedication: (parsedMedication) => {
        set({ parsedMedication });
      },
    }),
    {
      name: "medication-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);