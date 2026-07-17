export type Category = "pizzas" | "bebidas" | "sobremesas";

export type Modality = "local" | "retirada" | "entrega";

export type PaymentMethod = "cartao" | "dinheiro" | "pix" | "alimentacao";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
}

export interface GroupedMenu {
  pizzas: MenuItem[];
  bebidas: MenuItem[];
  sobremesas: MenuItem[];
}

export interface CartEntry {
  id: string;
  quantity: number;
}

export interface SummaryLine {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SuggestionLine {
  id: string;
  name: string;
  price: number;
}

export interface OrderSummary {
  items: SummaryLine[];
  suggestions: SuggestionLine[];
  itemCount: number;
  prepTimeMinutes: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface CheckoutPayload {
  items: CartEntry[];
  modality: Modality;
  payment: PaymentMethod;
  changeFor?: number;
}

export interface OrderConfirmation {
  orderId: string;
  modality: Modality;
  payment: PaymentMethod;
  total: number;
  prepTimeMinutes: number;
  changeDue: number;
  createdAt: string;
}
