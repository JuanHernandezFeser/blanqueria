import { create } from 'zustand';
import { api } from '@/services/api';

export type HeroSlideType = 'image' | 'video' | 'product';

export interface HeroSlide {
  id: string;
  type: HeroSlideType;
  image: string;
  videoUrl?: string;
  productId?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  order: number;
}

interface HeroState {
  slides: HeroSlide[];
  loading: boolean;
  fetchSlides: () => Promise<void>;
  addSlide: (slide: Omit<HeroSlide, 'id' | 'order'>) => Promise<void>;
  updateSlide: (id: string, data: Partial<HeroSlide>) => Promise<void>;
  deleteSlide: (id: string) => Promise<void>;
  reorderSlides: (fromIndex: number, toIndex: number) => Promise<void>;
}

export const useHeroStore = create<HeroState>((set, get) => ({
  slides: [],
  loading: true,
  fetchSlides: async () => {
    try {
      const slides = await api.getHeroSlides<HeroSlide[]>();
      set({ slides, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  addSlide: async (slide) => {
    const created = await api.createHeroSlide(slide);
    set({ slides: [...get().slides, created] });
  },
  updateSlide: async (id, data) => {
    const updated = await api.updateHeroSlide(id, data);
    set({ slides: get().slides.map((s) => (s.id === id ? updated : s)) });
  },
  deleteSlide: async (id) => {
    await api.deleteHeroSlide(id);
    set({ slides: get().slides.filter((s) => s.id !== id) });
  },
  reorderSlides: async (fromIndex, toIndex) => {
    const slides = [...get().slides];
    const [moved] = slides.splice(fromIndex, 1);
    slides.splice(toIndex, 0, moved);
    const reordered = slides.map((s, i) => ({ ...s, order: i }));
    set({ slides: reordered });
    await api.reorderHeroSlides(reordered.map(({ id, order }) => ({ id, order })));
  },
}));
