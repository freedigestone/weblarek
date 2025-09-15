// src/components/Views/ProductPreviewView.ts
import { cloneTemplate } from '../../utils/dom';
import { categoryMap } from '../../utils/constants';
import { IProduct } from '../../types/index';
import { resolveImagePath } from '../../utils/utils';
import { events } from '../base/Events';

export class ProductPreviewView {
  private element: HTMLElement;
  private titleEl: HTMLElement;
  private descriptionEl: HTMLElement;
  private priceEl: HTMLElement;
  private categoryEl: HTMLElement;
  private imageEl: HTMLImageElement;
  private buttonEl: HTMLButtonElement;

  constructor() {
    this.element = cloneTemplate<HTMLElement>('card-preview');
    this.titleEl = this.element.querySelector('.card__title')!;
    this.descriptionEl = this.element.querySelector('.card__text')!;
    this.priceEl = this.element.querySelector('.card__price')!;
    this.categoryEl = this.element.querySelector('.card__category')!;
    this.imageEl = this.element.querySelector('.card__image')!;
    this.buttonEl = this.element.querySelector('.card__button')!;
  }

  /** inCart — находится ли товар уже в корзине (для текста/логики кнопки) */
  render(product: IProduct, inCart: boolean): HTMLElement {
    // Текстовые поля
    this.titleEl.textContent = product.title;
    this.descriptionEl.textContent = product.description || '';

    // Цена и состояние кнопки
    if (product.price === null) {
      this.priceEl.textContent = 'Бесценно';
      this.buttonEl.disabled = true;
      this.buttonEl.textContent = 'Недоступно';
      this.buttonEl.onclick = null;
    } else {
      this.priceEl.textContent = `${product.price} синапсов`;
      this.buttonEl.disabled = false;

      // Перед перевешиванием снимаем прежний хендлер
      this.buttonEl.onclick = null;

      if (inCart) {
        this.buttonEl.textContent = 'Удалить из корзины';
        this.buttonEl.onclick = () => {
          events.emit('cart:remove-by-id', { id: product.id });
        };
      } else {
        this.buttonEl.textContent = 'Купить';
        this.buttonEl.onclick = () => {
          events.emit('cart:add', product);
        };
      }
    }

    // Категория + модификатор
    const entry = Object.values(categoryMap).find(c => c.mod === product.category);
    this.categoryEl.className = `card__category card__category_${product.category}`;
    this.categoryEl.textContent = entry?.label || product.category;

    // Картинка
    this.imageEl.src = resolveImagePath(product.image);
    this.imageEl.alt = product.title;

    return this.element;
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
