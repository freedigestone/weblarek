import { Api } from '../base/Api';
import { IProduct, IOrder } from '../../types/index';
import { API_URL } from '../../utils/constants'; // <-- путь из constants.ts

interface IApiProductsResponse {
  items: IProduct[];
}

export class Communication {
  private api: Api;

  constructor(api: Api) {
    this.api = api;
  }

  /** Получение массива товаров с сервера */
  async getProductList(): Promise<IProduct[]> {
    try {
      // собираем полный URL для запроса
      const response = await this.api.get<IApiProductsResponse>(`/product/`);
      return response.items || [];
    } catch (error) {
      console.error('Ошибка при получении товаров:', error);
      return [];
    }
  }

  /** Отправка данных заказа на сервер */
  async sendOrder(order: IOrder): Promise<object> {
    try {
      return await this.api.post(`${API_URL}/order/`, order);
    } catch (error) {
      console.error('Ошибка при отправке заказа:', error);
      return {};
    }
  }
}
