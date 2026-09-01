import { useEffect, useState } from 'react';

/**
 * #tailchat-app 节点在组件的 render 阶段还未挂载到 DOM (React 先执行完整棵树的
 * render 才 commit), 直接在渲染函数体内 document.getElementById 会拿到 null 且
 * 组件此后大多不会再重渲染, 导致 Base UI 的 Portal container 永远回退到
 * document.body —— 脱离 Tailwind `important: '#app'` 作用域, 所有 utility class
 * 失效。改为 mount 后 (commit 完成, 节点保证存在) 用 effect 取一次再 setState 触发
 * 一次重渲染。#tailchat-app 常驻不会卸载, 单次读取即可。
 */
export function useAppPortalContainer(): HTMLElement | null {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.getElementById('tailchat-app'));
  }, []);

  return container;
}
