import { Router } from "express";
import { getGroupedMenu } from "./data";
import { buildSummary, isValidModality, registerOrder } from "./orderService";
import { CartEntry, CheckoutPayload } from "./types";

const router = Router();

const parseCart = (value: unknown): CartEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is CartEntry => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      id: String((entry as CartEntry).id ?? ""),
      quantity: Number((entry as CartEntry).quantity ?? 0)
    }));
};

router.get("/menu", (_req, res) => {
  res.json(getGroupedMenu());
});

router.post("/order/summary", (req, res) => {
  const modality = req.body?.modality;

  if (!isValidModality(modality)) {
    return res.status(400).json({ error: "Modalidade inválida." });
  }

  const summary = buildSummary(parseCart(req.body?.items), modality);
  return res.json(summary);
});

router.post("/order/checkout", (req, res) => {
  const modality = req.body?.modality;
  const payment = req.body?.payment;

  if (!isValidModality(modality)) {
    return res.status(400).json({ error: "Modalidade inválida." });
  }

  const payload: CheckoutPayload = {
    items: parseCart(req.body?.items),
    modality,
    payment,
    changeFor: req.body?.changeFor !== undefined ? Number(req.body.changeFor) : undefined
  };

  try {
    const confirmation = registerOrder(payload);
    return res.status(201).json(confirmation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível registrar o pedido.";
    return res.status(400).json({ error: message });
  }
});

export default router;
