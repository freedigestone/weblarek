// src/components/Presenter/AppPresenter.ts
import { Api } from '../base/Api';
import { Communication } from '../Models/Communication';
import { Catalog } from "../Models/Catalog";
import { Cart } from "../Models/Cart";
import { Buyer } from "../Models/Buyer";

import { API_URL, categoryMap } from "../../utils/constants";

import { ModalView } from '../Views/ModalView';
import { ProductPreviewView } from '../Views/ProductPreviewView';
import { CatalogView } from '../Views/CatalogView';
import { CartView, CartItemData } from '../Views/CartView';
import { OrderFormView } from '../Views/OrderFormView';
import { ContactsFormView } from '../Views/ContactsFormView';
import { SuccessView } from '../Views/SuccessView';

import { IProduct } from '../../types';
import { CardViewData } from '../Views/CardView';
import { events } from '../base/Events';

export class AppPresenter {
  private catalog = new Catalog();
  private cart = new Cart();
  private buyer = new Buyer();

  private api = new Api(API_URL);
  private communication = new Communication(this.api);

  private catalogView = new CatalogView('.gallery');
  private cartView = new CartView();
  private modal = new ModalView('#modal-container');

  // ==== Утилиты ====
  private normalizeCategory(raw: string): string {
    return categoryMap[raw]?.mod || 'other';
  }

  private toCardViewData(products: IProduct[]): CardViewData[] {
    return products.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price ?? null,
      category: this.normalizeCategory(p.category),
      image: p.image,
    }));
  }

  private toCartItemData(items: IProduct[]): CartItemData[] {
    return items.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price ?? 0,
    }));
  }

  // ==== Инициализация ====
  public init() {
    this.loadProducts();
    this.initEvents();
    this.updateBasketCounter();
  }

  // ==== Загрузка каталога ====
  private async loadProducts() {
    try {
      const productlist = await this.communication.getProductList();
      this.catalog.setProducts(productlist);
      this.catalogView.render(this.toCardViewData(productlist));
    } catch (err) {
      console.error('Ошибка загрузки каталога:', err);
    }
  }

  // ==== События ====
  private initEvents() {
    // карточка товара
   events.on<{ id: string }>('card:select', ({ id }) => {
  const product = this.catalog.getProductById(id);
  if (!product) return;

      const normalizedProduct = {
        ...product,
        category: this.normalizeCategory(product.category),
      };

      const previewView = new ProductPreviewView();
      const inCart = this.cart.hasItem(product.id);
      this.modal.open(previewView.render(normalizedProduct, inCart));
    });

    // открыть корзину
    const basketButton = document.querySelector<HTMLButtonElement>('.header__basket');
    if (basketButton) {
      basketButton.addEventListener('click', () => {
        this.modal.open(this.cartView.getElement());
      });
    }

    // добавить товар
   events.on<IProduct>('cart:add', (product) => {
    this.cart.addItem(product);
    this.cartView.render(this.toCartItemData(this.cart.getItems()));
    this.updateBasketCounter();
    
  });

// удалить товар (по индексу)
  events.on<{ index: number }>('cart:remove', ({ index }) => {
    const items = this.cart.getItems();
    items.splice(index, 1);

    this.cart.clear();
    items.forEach(item => this.cart.addItem(item));

    this.cartView.render(this.toCartItemData(this.cart.getItems()));
    this.updateBasketCounter();
  });

  // удалить товар (по id) — для кнопки в превью
events.on<{ id: string }>('cart:remove-by-id', ({ id }) => {
  this.cart.removeItem({ id } as any);
  this.cartView.render(this.toCartItemData(this.cart.getItems()));
  this.updateBasketCounter();
});

    // оформить заказ (шаг 1)
  events.on('cart:order', () => {
    const orderForm = new OrderFormView(this.buyer.getData());
    this.modal.open(orderForm.getElement());
  });

  // шаг 1 → шаг 2
  events.on<{ payment: Buyer['payment']; address: string }>('order:next', ({ payment, address }) => {
    this.buyer.setData({ payment, address });

    const contactsForm = new ContactsFormView();
    this.modal.open(contactsForm.getElement());
  });

    // шаг 2 → подтверждение
  events.on<{ email: string; phone: string }>('order:confirm', async ({ email, phone }) => {
    this.buyer.setData({ email, phone });

      const order = {
        ...this.buyer.getData(),
        items: this.cart.getItems().map((p) => p.id),
        total: this.cart.getTotalPrice(),
      };

      try {
        const result: { total: number } = await this.communication.sendOrder(order);
        const success = new SuccessView();
        this.modal.open(success.render(result.total));

        this.cart.clear();
        this.cartView.render([]);
        this.updateBasketCounter();
      } catch (err) {
        console.error('Ошибка при заказе:', err);
      }
    });

    // закрытие success
  events.on('success:close', () => {
    this.modal.close();
  });
  }

  // ==== Счётчик корзины ====
  private updateBasketCounter() {
    const counter = document.querySelector<HTMLElement>('.header__basket-counter');
    if (!counter) return;
    const count = this.cart.getCount();
    counter.textContent = String(count);
    counter.style.display = 'flex'; 
  }
}
