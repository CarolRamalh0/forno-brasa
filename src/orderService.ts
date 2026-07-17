import { findMenuItem, getMenu } from "./data";
import {
  CartEntry,
  CheckoutPayload,
  Modality,
  OrderConfirmation,
  OrderSummary,
  PaymentMethod,
  SuggestionLine,
  SummaryLine
} from "./types";

const BASE_PREP_MINUTES = 10;
const MINUTES_PER_ITEM = 5;
const DELIVERY_FEE = 10;
const SUGGESTION_COUNT = 3;
const VALID_MODALITIES: Modality[] = ["local", "retirada", "entrega"];
const VALID_PAYMENTS: PaymentMethod[] = ["cartao", "dinheiro", "pix", "alimentacao"];

const round = (value: number): number => Math.round(value * 100) / 100;

const normalizeCart = (entries: CartEntry[]): Map<string, number> => {
  const cart = new Map<string, number>();

  entries.forEach((entry) => {
    const item = findMenuItem(entry.id);
    const quantity = Math.trunc(entry.quantity);

    if (!item || !Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    cart.set(entry.id, (cart.get(entry.id) ?? 0) + quantity);
  });

  return cart;
};

const buildLines = (cart: Map<string, number>): SummaryLine[] => {
  const lines: SummaryLine[] = [];

  cart.forEach((quantity, id) => {
    const item = findMenuItem(id);
    if (!item) {
      return;
    }

    lines.push({
      id: item.id,
      name: item.name,
      quantity,
      unitPrice: item.price,
      lineTotal: round(item.price * quantity)
    });
  });

  return lines;
};

const buildSuggestions = (cart: Map<string, number>): SuggestionLine[] =>
  getMenu()
    .filter((item) => !cart.has(item.id))
    .slice(0, SUGGESTION_COUNT)
    .map((item) => ({ id: item.id, name: item.name, price: item.price }));

const isDelivery = (modality: Modality): boolean => modality === "entrega";

export const isValidModality = (value: unknown): value is Modality =>
  typeof value === "string" && VALID_MODALITIES.includes(value as Modality);

export const isValidPayment = (value: unknown): value is PaymentMethod =>
  typeof value === "string" && VALID_PAYMENTS.includes(value as PaymentMethod);

export const buildSummary = (entries: CartEntry[], modality: Modality): OrderSummary => {
  const cart = normalizeCart(entries);
  const items = buildLines(cart);
  const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = round(items.reduce((sum, line) => sum + line.lineTotal, 0));
  const deliveryFee = isDelivery(modality) && itemCount > 0 ? DELIVERY_FEE : 0;
  const prepTimeMinutes = itemCount > 0 ? BASE_PREP_MINUTES + MINUTES_PER_ITEM * itemCount : 0;

  return {
    items,
    suggestions: buildSuggestions(cart),
    itemCount,
    prepTimeMinutes,
    subtotal,
    deliveryFee,
    total: round(subtotal + deliveryFee)
  };
};

const generateOrderId = (): string => {
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0");
  return `FB-${stamp}${random}`;
};

export const registerOrder = (payload: CheckoutPayload): OrderConfirmation => {
  const summary = buildSummary(payload.items, payload.modality);

  if (summary.itemCount === 0) {
    throw new Error("A comanda está vazia.");
  }

  if (!isValidPayment(payload.payment)) {
    throw new Error("Forma de pagamento inválida.");
  }

  let changeDue = 0;

  if (payload.payment === "dinheiro" && payload.changeFor !== undefined) {
    const changeFor = Number(payload.changeFor);

    if (!Number.isFinite(changeFor) || changeFor < summary.total) {
      throw new Error("O valor para troco deve ser maior ou igual ao total.");
    }

    changeDue = round(changeFor - summary.total);
  }

  return {
    orderId: generateOrderId(),
    modality: payload.modality,
    payment: payload.payment,
    total: summary.total,
    prepTimeMinutes: summary.prepTimeMinutes,
    changeDue,
    createdAt: new Date().toISOString()
  };
};
