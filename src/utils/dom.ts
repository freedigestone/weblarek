// src/utils/dom.ts
/**
 * Утилита: клонирует содержимое <template id="..."> и возвращает HTMLElement.
 * Бросает ошибку, если шаблон не найден или пуст.
 */
export function cloneTemplate<T extends HTMLElement = HTMLElement>(id: string): T {
  const tpl = document.getElementById(id) as HTMLTemplateElement | null;
  if (!tpl) {
    throw new Error(`Template with id "${id}" not found`);
  }
  const node = tpl.content.firstElementChild?.cloneNode(true) as T | undefined;
  if (!node) {
    throw new Error(`Template with id "${id}" is empty`);
  }
  return node;
}
