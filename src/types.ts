export interface Item {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface BasketItem extends Item {
  basketQuantity: number;
}