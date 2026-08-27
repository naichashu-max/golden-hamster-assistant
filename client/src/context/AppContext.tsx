// 全局状态：账号登录状态 + 当前用户数据。
// 数据读写统一走 cloudRepo（Supabase），并按账号天然隔离。
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as repo from '../lib/cloudRepo';
import { supabase, translateAuthError } from '../lib/supabase';
import type {
  ActivityRecord,
  BeddingRecord,
  CleaningRecord,
  DrinkingRecord,
  FeedingRecord,
  GrowthPhoto,
  Pet,
  WeightRecord,
} from '../types';
import type {
  ActivityRecordInput,
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
  cleaningRecords: CleaningRecord[];
  activityRecords: ActivityRecord[];
}

export interface AppUser {
  id: string;
  email: string | null;
}

const EMPTY_RECORDS: RecordsState = {
  weightRecords: [],
  growthPhotos: [],
  feedingRecords: [],
  drinkingRecords: [],
  beddingRecords: [],
  cleaningRecords: [],
  activityRecords: [],
};

interface AppContextValue {
  user: AppUser | null;
  authLoading: boolean;
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
  addCleaningRecord: (input: repo.CleaningRecordInput) => Promise<void>;
  addActivityRecord: (input: ActivityRecordInput) => Promise<void>;
  deleteRecord: (store: string, id: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetDemo: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

async function loadRecords(petId: string): Promise<RecordsState> {
  // 单个表读取失败时降级为空列表，避免某一类记录异常拖垮整个首页。
  const safe = async <T,>(read: () => Promise<T[]>): Promise<T[]> => {
    try {
      return await read();
    } catch (error) {
      console.warn('加载记录失败，已按空数据处理', error);
      return [];
    }
  };
  const [
    weightRecords,
    growthPhotos,
    feedingRecords,
    drinkingRecords,
    beddingRecords,
    cleaningRecords,
    activityRecords,
  ] = await Promise.all([
    safe(() => repo.listWeightRecords(petId)),
    safe(() => repo.listGrowthPhotos(petId)),
    safe(() => repo.listFeedingRecords(petId)),
    safe(() => repo.listDrinkingRecords(petId)),
    safe(() => repo.listBeddingRecords(petId)),
    safe(() => repo.listCleaningRecords(petId)),
    safe(() => repo.listActivityRecords(petId)),
  ]);
  return {
    weightRecords,
    growthPhotos,
    feedingRecords,
    drinkingRecords,
    beddingRecords,
    cleaningRecords,
    activityRecords,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [records, setRecords] = useState<RecordsState>(EMPTY_RECORDS);
  const [loading, setLoading] = useState(false);

  // 重新加载宠物列表，并选中指定（或第一只）宠物。
  const reload = useCallback(async (preferredId?: string) => {
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
  }, []);

  // 监听登录状态：登录后加载云端数据，退出后清空本地状态。
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      if (!mounted) return;
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? null } : null);
      if (sessionUser) {
        setLoading(true);
        await reload();
        setLoading(false);
      }
      setAuthLoading(false);
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? null } : null);
      if (sessionUser) {
        setLoading(true);
        void reload().finally(() => setLoading(false));
      } else {
        setPets([]);
        setRecords(EMPTY_RECORDS);
        setActivePetId(null);
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [reload]);

  const refreshRecords = useCallback(async (petId: string) => {
    setRecords(await loadRecords(petId));
  }, []);

  const selectPet = useCallback(async (id: string) => {
    setActivePetId(id);
    setRecords(await loadRecords(id));
  }, []);

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

  const addCleaningRecord = useCallback(
    async (input: repo.CleaningRecordInput) => {
      await repo.addCleaningRecord(input);
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

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translateAuthError(error.message));
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(translateAuthError(error.message));
    return { needsEmailConfirmation: Boolean(data.user && !data.session) };
  }, []);

  const signOut = useCallback(async () => {
    // 记住本次邮箱，方便下次（或切换账号时）自动填充。
    if (user?.email) localStorage.setItem('hamster-last-email', user.email);
    await supabase.auth.signOut();
    setUser(null);
    setPets([]);
    setRecords(EMPTY_RECORDS);
    setActivePetId(null);
  }, [user]);

  const resetDemo = useCallback(async () => {
    await repo.clearAllData();
    await repo.seedDemoData();
    await reload();
  }, [reload]);

  const activePet = useMemo(() => pets.find((p) => p.id === activePetId), [pets, activePetId]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authLoading,
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
      addCleaningRecord,
      addActivityRecord,
      deleteRecord,
      signIn,
      signUp,
      signOut,
      resetDemo,
    }),
    [
      user,
      authLoading,
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
      addCleaningRecord,
      addActivityRecord,
      deleteRecord,
      signIn,
      signUp,
      signOut,
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
