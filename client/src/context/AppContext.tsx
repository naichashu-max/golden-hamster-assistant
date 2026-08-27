// 全局状态：加载宠物与记录，并向页面暴露统一的数据与操作入口。
// 页面通过 useApp() 获取数据，所有写入操作都会在完成后刷新本地状态。
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as repo from '../lib/repository';
import type {
  ActivityRecord,
  BathRecord,
  BeddingRecord,
  DrinkingRecord,
  FeedingRecord,
  GrowthPhoto,
  Pet,
  WeightRecord,
} from '../types';
import type {
  ActivityRecordInput,
  BathRecordInput,
  BeddingRecordInput,
  DrinkingRecordInput,
  FeedingRecordInput,
  GrowthPhotoInput,
  PetInput,
  WeightRecordInput,
} from '../lib/repository';

export interface RecordsState {
  weightRecords: WeightRecord[];
  growthPhotos: GrowthPhoto[];
  feedingRecords: FeedingRecord[];
  drinkingRecords: DrinkingRecord[];
  beddingRecords: BeddingRecord[];
  bathRecords: BathRecord[];
  activityRecords: ActivityRecord[];
}

const EMPTY_RECORDS: RecordsState = {
  weightRecords: [],
  growthPhotos: [],
  feedingRecords: [],
  drinkingRecords: [],
  beddingRecords: [],
  bathRecords: [],
  activityRecords: [],
};

interface AppContextValue {
  pets: Pet[];
  activePet: Pet | undefined;
  records: RecordsState;
  loading: boolean;
  reload: () => Promise<void>;
  selectPet: (id: string) => Promise<void>;
  savePet: (input: PetInput) => Promise<Pet>;
  deletePet: (id: string) => Promise<void>;
  addWeightRecord: (input: WeightRecordInput) => Promise<void>;
  addGrowthPhoto: (input: GrowthPhotoInput) => Promise<void>;
  addFeedingRecord: (input: FeedingRecordInput) => Promise<void>;
  addDrinkingRecord: (input: DrinkingRecordInput) => Promise<void>;
  addBeddingRecord: (input: BeddingRecordInput) => Promise<void>;
  addBathRecord: (input: BathRecordInput) => Promise<void>;
  addActivityRecord: (input: ActivityRecordInput) => Promise<void>;
  deleteRecord: (store: string, id: string) => Promise<void>;
  resetDemo: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

async function loadRecords(petId: string): Promise<RecordsState> {
  const [
    weightRecords,
    growthPhotos,
    feedingRecords,
    drinkingRecords,
    beddingRecords,
    bathRecords,
    activityRecords,
  ] = await Promise.all([
    repo.listWeightRecords(petId),
    repo.listGrowthPhotos(petId),
    repo.listFeedingRecords(petId),
    repo.listDrinkingRecords(petId),
    repo.listBeddingRecords(petId),
    repo.listBathRecords(petId),
    repo.listActivityRecords(petId),
  ]);
  return {
    weightRecords,
    growthPhotos,
    feedingRecords,
    drinkingRecords,
    beddingRecords,
    bathRecords,
    activityRecords,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [records, setRecords] = useState<RecordsState>(EMPTY_RECORDS);
  const [loading, setLoading] = useState(true);

  // 重新加载宠物列表，并选中指定（或第一只）宠物。
  const reload = useCallback(
    async (preferredId?: string) => {
      const all = await repo.listPets();
      setPets(all);
      if (all.length === 0) {
        setActivePetId(null);
        setRecords(EMPTY_RECORDS);
        return;
      }
      const nextId = preferredId && all.some((p) => p.id === preferredId) ? preferredId : all[0].id;
      setActivePetId(nextId);
      setRecords(await loadRecords(nextId));
    },
    [],
  );

  useEffect(() => {
    (async () => {
      let all = await repo.listPets();
      // 首次进入且没有任何档案时，载入一份示例数据，方便直接体验完整界面。
      if (all.length === 0 && !localStorage.getItem('hamster-seeded')) {
        await repo.seedDemoData();
        localStorage.setItem('hamster-seeded', '1');
        all = await repo.listPets();
      }
      setPets(all);
      if (all.length > 0) {
        setActivePetId(all[0].id);
        setRecords(await loadRecords(all[0].id));
      }
      setLoading(false);
    })();
  }, []);

  const refreshRecords = useCallback(async (petId: string) => {
    setRecords(await loadRecords(petId));
  }, []);

  const selectPet = useCallback(
    async (id: string) => {
      setActivePetId(id);
      setRecords(await loadRecords(id));
    },
    [],
  );

  const savePet = useCallback(
    async (input: PetInput) => {
      const pet = await repo.savePet(input);
      await reload(pet.id);
      return pet;
    },
    [reload],
  );

  const deletePet = useCallback(
    async (id: string) => {
      await repo.deletePet(id);
      await reload();
    },
    [reload],
  );

  const addWeightRecord = useCallback(
    async (input: WeightRecordInput) => {
      await repo.addWeightRecord(input);
      if (activePetId) await refreshRecords(activePetId);
    },
    [activePetId, refreshRecords],
  );

  const addGrowthPhoto = useCallback(
    async (input: GrowthPhotoInput) => {
      await repo.addGrowthPhoto(input);
      if (activePetId) await refreshRecords(activePetId);
    },
    [activePetId, refreshRecords],
  );

  const addFeedingRecord = useCallback(
    async (input: FeedingRecordInput) => {
      await repo.addFeedingRecord(input);
      if (activePetId) await refreshRecords(activePetId);
    },
    [activePetId, refreshRecords],
  );

  const addDrinkingRecord = useCallback(
    async (input: DrinkingRecordInput) => {
      await repo.addDrinkingRecord(input);
      if (activePetId) await refreshRecords(activePetId);
    },
    [activePetId, refreshRecords],
  );

  const addBeddingRecord = useCallback(
    async (input: BeddingRecordInput) => {
      await repo.addBeddingRecord(input);
      if (activePetId) await refreshRecords(activePetId);
    },
    [activePetId, refreshRecords],
  );

  const addBathRecord = useCallback(
    async (input: BathRecordInput) => {
      await repo.addBathRecord(input);
      if (activePetId) await refreshRecords(activePetId);
    },
    [activePetId, refreshRecords],
  );

  const addActivityRecord = useCallback(
    async (input: ActivityRecordInput) => {
      await repo.addActivityRecord(input);
      if (activePetId) await refreshRecords(activePetId);
    },
    [activePetId, refreshRecords],
  );

  const deleteRecord = useCallback(
    async (store: string, id: string) => {
      await repo.deleteRecord(store, id);
      if (activePetId) await refreshRecords(activePetId);
    },
    [activePetId, refreshRecords],
  );

  const resetDemo = useCallback(async () => {
    await repo.resetAllData();
    await repo.seedDemoData();
    localStorage.setItem('hamster-seeded', '1');
    await reload();
  }, [reload]);

  const activePet = useMemo(
    () => pets.find((p) => p.id === activePetId),
    [pets, activePetId],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      pets,
      activePet,
      records,
      loading,
      reload,
      selectPet,
      savePet,
      deletePet,
      addWeightRecord,
      addGrowthPhoto,
      addFeedingRecord,
      addDrinkingRecord,
      addBeddingRecord,
      addBathRecord,
      addActivityRecord,
      deleteRecord,
      resetDemo,
    }),
    [
      pets,
      activePet,
      records,
      loading,
      reload,
      selectPet,
      savePet,
      deletePet,
      addWeightRecord,
      addGrowthPhoto,
      addFeedingRecord,
      addDrinkingRecord,
      addBeddingRecord,
      addBathRecord,
      addActivityRecord,
      deleteRecord,
      resetDemo,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp 必须在 AppProvider 内使用');
  }
  return context;
}
