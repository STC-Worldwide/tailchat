import { getStorage } from 'tailchat-shared';
import { create } from 'zustand';

export type MessageDensity = 'comfortable' | 'compact';

const STORAGE_KEY = 'messageDensity';

interface MessageDensityState {
  density: MessageDensity;
  setDensity: (density: MessageDensity) => void;
}

/**
 * 消息密度设置 (facelift): 舒适(默认) / 紧凑
 * 通过 .density-compact 类切换 --tc-msg-* 间距变量
 *
 * 用 zustand 而非 useStorage: useStorage 的状态是组件私有的,
 * 设置页里的修改不会通知 AppContainer; 密度切换需要立即生效
 */
const useMessageDensityStore = create<MessageDensityState>((set) => ({
  density: 'comfortable',
  setDensity: (density) => {
    set({ density });
    getStorage().save(STORAGE_KEY, density);
  },
}));

getStorage()
  .get(STORAGE_KEY)
  .then((value) => {
    if (value === 'compact' || value === 'comfortable') {
      useMessageDensityStore.setState({ density: value });
    }
  });

export function useMessageDensity() {
  const density = useMessageDensityStore((state) => state.density);
  const setDensity = useMessageDensityStore((state) => state.setDensity);

  return { density, setDensity };
}
