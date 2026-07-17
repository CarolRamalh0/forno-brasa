const state = {
  cart: new Map(),
  modality: "local",
  items: new Map(),
  payment: null,
  needsChange: false,
  view: "modality",
  summary: null
};

let summaryToken = 0;
let trackingTimer = null;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const modalityLabels = {
  local: "Comer no local",
  retirada: "Retirar no balcão",
  entrega: "Entrega"
};

const paymentLabels = {
  cartao: "Cartão",
  pix: "Pix",
  dinheiro: "Dinheiro",
  alimentacao: "Vale-alimentação"
};

const formatMoney = (value) => currency.format(value);

const formatPrepTime = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
};

const el = (selector) => document.querySelector(selector);

const createCard = (item) => {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = item.id;
  card.innerHTML = `
    <div class="card-top">
      <h3 class="card-name">${item.name}</h3>
      <span class="card-price">${formatMoney(item.price)}</span>
    </div>
    <p class="card-desc">${item.description}</p>
    <div class="card-action"></div>
  `;
  card.querySelector(".card-action").appendChild(createCardControl(item.id));
  return card;
};

const createCardControl = (id) => {
  const quantity = state.cart.get(id) ?? 0;

  if (quantity === 0) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "add-btn";
    button.textContent = "Adicionar";
    button.addEventListener("click", () => changeQuantity(id, 1));
    return button;
  }

  const stepper = document.createElement("div");
  stepper.className = "stepper";
  stepper.innerHTML = `
    <button type="button" aria-label="Remover uma unidade">−</button>
    <span>${quantity}</span>
    <button type="button" aria-label="Adicionar uma unidade">+</button>
  `;
  const [minus, , plus] = stepper.children;
  minus.addEventListener("click", () => changeQuantity(id, -1));
  plus.addEventListener("click", () => changeQuantity(id, 1));
  return stepper;
};

const renderMenu = (grouped) => {
  const sections = {
    pizzas: grouped.pizzas,
    bebidas: grouped.bebidas,
    sobremesas: grouped.sobremesas
  };

  Object.entries(sections).forEach(([key, list]) => {
    const grid = el(`[data-grid="${key}"]`);
    grid.innerHTML = "";
    list.forEach((item) => {
      state.items.set(item.id, item);
      grid.appendChild(createCard(item));
    });
  });
};

const refreshCard = (id) => {
  const card = el(`.card[data-id="${id}"]`);
  if (!card) {
    return;
  }
  const action = card.querySelector(".card-action");
  action.innerHTML = "";
  action.appendChild(createCardControl(id));
  card.classList.toggle("in-cart", state.cart.has(id));
};

const changeQuantity = (id, delta) => {
  const current = state.cart.get(id) ?? 0;
  const next = current + delta;

  if (next <= 0) {
    state.cart.delete(id);
  } else {
    state.cart.set(id, next);
  }

  refreshCard(id);
  updateBadge();
  syncSummary();
};

const updateBadge = () => {
  const count = Array.from(state.cart.values()).reduce((sum, qty) => sum + qty, 0);
  el("#cartBadge").textContent = String(count);
};

const buildCartPayload = () =>
  Array.from(state.cart, ([id, quantity]) => ({ id, quantity }));

const renderLineItems = (items) => {
  const container = el("#ticketItems");
  container.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "line-item";
    row.innerHTML = `
      <span class="line-name">${item.name}</span>
      <span class="line-total">${formatMoney(item.lineTotal)}</span>
      <div class="line-controls">
        <button type="button" aria-label="Remover uma unidade">−</button>
        <span>${item.quantity}</span>
        <button type="button" aria-label="Adicionar uma unidade">+</button>
      </div>
    `;
    const [minus, , plus] = row.querySelector(".line-controls").children;
    minus.addEventListener("click", () => changeQuantity(item.id, -1));
    plus.addEventListener("click", () => changeQuantity(item.id, 1));
    container.appendChild(row);
  });
};

const renderSuggestions = (suggestions) => {
  const section = el("#suggestions");
  const list = el("#suggestionList");

  if (state.cart.size === 0 || suggestions.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  list.innerHTML = "";

  suggestions.forEach((item) => {
    const row = document.createElement("div");
    row.className = "suggestion";
    row.innerHTML = `
      <div class="suggestion-info">
        <b>${item.name}</b>
        <small>${formatMoney(item.price)}</small>
      </div>
      <button type="button" class="suggestion-add">Adicionar</button>
    `;
    row.querySelector(".suggestion-add").addEventListener("click", () => changeQuantity(item.id, 1));
    list.appendChild(row);
  });
};

const renderPrep = (minutes) => {
  const block = el("#prepBlock");

  if (minutes === 0) {
    block.hidden = true;
    return;
  }

  block.hidden = false;
  el("#prepValue").textContent = formatPrepTime(minutes);
  const fill = Math.min(100, (minutes / 60) * 100);
  el("#prepBar").style.width = `${fill}%`;
};

const renderSummary = (summary) => {
  state.summary = summary;
  const hasItems = summary.items.length > 0;

  renderLineItems(summary.items);
  renderSuggestions(summary.suggestions);
  renderPrep(summary.prepTimeMinutes);

  el("#emptyState").hidden = hasItems;
  el("#subtotal").textContent = formatMoney(summary.subtotal);
  el("#total").textContent = formatMoney(summary.total);

  const feeLine = el("#feeLine");
  feeLine.hidden = summary.deliveryFee === 0;
  el("#deliveryFee").textContent = formatMoney(summary.deliveryFee);

  el("#reviewContinue").disabled = !hasItems;

  el("#paySubtotal").textContent = formatMoney(summary.subtotal);
  el("#payTotal").textContent = formatMoney(summary.total);
  const payFeeLine = el("#payFeeLine");
  payFeeLine.hidden = summary.deliveryFee === 0;
  el("#payFee").textContent = formatMoney(summary.deliveryFee);

  if (state.view === "payment") {
    if (!hasItems) {
      showView("review");
    } else {
      validateChange();
    }
  }
};

const syncSummary = async () => {
  const token = ++summaryToken;

  try {
    const response = await fetch("/api/order/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: buildCartPayload(),
        modality: state.modality
      })
    });

    if (!response.ok) {
      throw new Error("Falha ao calcular o pedido.");
    }

    const summary = await response.json();

    if (token === summaryToken) {
      renderSummary(summary);
    }
  } catch (error) {
    console.error(error);
  }
};

const showView = (view) => {
  state.view = view;
  el("#stepModality").hidden = view !== "modality";
  el("#stepReview").hidden = view !== "review";
  el("#stepPayment").hidden = view !== "payment";
  el("#trackingView").hidden = view !== "tracking";

  const ticket = el("#ticket");
  if (ticket.classList.contains("is-open")) {
    ticket.scrollTop = 0;
  }

  if (view === "payment") {
    validateChange();
  }
};

const openTicket = () => {
  const ticket = el("#ticket");
  const scrim = el("#scrim");

  if (state.view !== "tracking") {
    showView("modality");
  }

  ticket.classList.add("is-open");
  ticket.setAttribute("aria-hidden", "false");
  el("#cartToggle").setAttribute("aria-expanded", "true");
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add("is-visible"));
};

const closeTicket = () => {
  const ticket = el("#ticket");
  const scrim = el("#scrim");
  ticket.classList.remove("is-open");
  ticket.setAttribute("aria-hidden", "true");
  el("#cartToggle").setAttribute("aria-expanded", "false");
  scrim.classList.remove("is-visible");
  setTimeout(() => (scrim.hidden = true), 350);
};

const setupTicketToggle = () => {
  const scrim = el("#scrim");

  el("#cartToggle").addEventListener("click", openTicket);

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", closeTicket);
  });

  scrim.addEventListener("click", closeTicket);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeTicket();
    }
  });
};

const setupModality = () => {
  const options = document.querySelectorAll(".modality-btn");
  options.forEach((button) => {
    button.addEventListener("click", () => {
      options.forEach((other) => {
        const active = other === button;
        other.classList.toggle("is-active", active);
        other.setAttribute("aria-checked", String(active));
      });
      state.modality = button.dataset.modality;
      syncSummary();
    });
  });

  el("#modalityContinue").addEventListener("click", () => showView("review"));
};

const setupSteps = () => {
  el("#reviewBack").addEventListener("click", () => showView("modality"));
  el("#reviewContinue").addEventListener("click", () => {
    if (state.summary && state.summary.items.length > 0) {
      showView("payment");
    }
  });
  el("#paymentBack").addEventListener("click", () => showView("review"));
};

const parseChangeValue = () => {
  const raw = el("#changeFor").value.replace(",", ".").trim();
  const value = Number(raw);
  return Number.isFinite(value) && raw !== "" ? value : null;
};

const validateChange = () => {
  const confirmButton = el("#confirmOrder");
  const hint = el("#changeHint");
  const summary = state.summary;

  if (!summary || summary.items.length === 0 || !state.payment) {
    confirmButton.disabled = true;
    return;
  }

  if (state.payment === "dinheiro" && state.needsChange) {
    const value = parseChangeValue();

    if (value === null || value < summary.total) {
      hint.textContent = value === null
        ? "Informe o valor para calcular o troco."
        : "O valor deve ser maior ou igual ao total.";
      hint.className = "change-hint is-error";
      confirmButton.disabled = true;
      return;
    }

    hint.textContent = `Troco: ${formatMoney(value - summary.total)}`;
    hint.className = "change-hint is-ok";
  }

  confirmButton.disabled = false;
};

const setupPayment = () => {
  const methods = document.querySelectorAll(".pay-btn");
  methods.forEach((button) => {
    button.addEventListener("click", () => {
      methods.forEach((other) => {
        const active = other === button;
        other.classList.toggle("is-active", active);
        other.setAttribute("aria-checked", String(active));
      });
      state.payment = button.dataset.payment;
      el("#changeBlock").hidden = state.payment !== "dinheiro";
      el("#payError").hidden = true;
      validateChange();
    });
  });

  const changeOptions = document.querySelectorAll(".change-opt");
  changeOptions.forEach((button) => {
    button.addEventListener("click", () => {
      changeOptions.forEach((other) => {
        const active = other === button;
        other.classList.toggle("is-active", active);
        other.setAttribute("aria-checked", String(active));
      });
      state.needsChange = button.dataset.change === "yes";
      el("#changeInput").hidden = !state.needsChange;
      validateChange();
    });
  });

  el("#changeFor").addEventListener("input", validateChange);
  el("#confirmOrder").addEventListener("click", submitOrder);
  el("#newOrder").addEventListener("click", resetOrder);
};

const setupNav = () => {
  const links = document.querySelectorAll(".menu-nav a");
  const sections = Array.from(links).map((link) => el(`#${link.dataset.target}`));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((link) =>
            link.classList.toggle("is-active", link.dataset.target === entry.target.id)
          );
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((section) => section && observer.observe(section));
};

const submitOrder = async () => {
  const summary = state.summary;
  if (!summary || summary.items.length === 0 || !state.payment) {
    return;
  }

  const payload = {
    items: buildCartPayload(),
    modality: state.modality,
    payment: state.payment
  };

  if (state.payment === "dinheiro" && state.needsChange) {
    payload.changeFor = parseChangeValue();
  }

  const errorBox = el("#payError");
  const button = el("#confirmOrder");
  button.disabled = true;

  try {
    const response = await fetch("/api/order/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Não foi possível registrar o pedido.");
    }

    errorBox.hidden = true;
    showTracking(data);
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
    button.disabled = false;
  }
};

const trackingStagesByModality = (modality) => {
  if (modality === "entrega") {
    return [
      { title: "Pedido recebido", note: "Confirmamos sua comanda." },
      { title: "Na bancada", note: "Preparando a massa e os ingredientes." },
      { title: "No forno a lenha", note: "Assando a 400 °C." },
      { title: "Saiu para entrega", note: "O motoboy está a caminho." },
      { title: "Entregue", note: "Bom apetite!" }
    ];
  }

  const lastNote = modality === "retirada"
    ? "Pode retirar no balcão."
    : "Servido na sua mesa.";

  return [
    { title: "Pedido recebido", note: "Confirmamos sua comanda." },
    { title: "Na bancada", note: "Preparando a massa e os ingredientes." },
    { title: "No forno a lenha", note: "Assando a 400 °C." },
    { title: "Pronto", note: lastNote }
  ];
};

const renderTrackingSteps = (stages) => {
  const list = el("#trackSteps");
  list.innerHTML = "";

  stages.forEach((stage) => {
    const item = document.createElement("li");
    item.className = "track-step";
    item.innerHTML = `<b>${stage.title}</b><small>${stage.note}</small>`;
    list.appendChild(item);
  });
};

const advanceTracking = (stages) => {
  const steps = Array.from(document.querySelectorAll(".track-step"));
  let index = 0;

  const paint = () => {
    steps.forEach((step, position) => {
      step.classList.toggle("is-done", position < index);
      step.classList.toggle("is-active", position === index);
    });
  };

  paint();

  if (trackingTimer) {
    clearInterval(trackingTimer);
  }

  trackingTimer = setInterval(() => {
    index += 1;

    if (index >= stages.length) {
      steps.forEach((step) => {
        step.classList.remove("is-active");
        step.classList.add("is-done");
      });
      clearInterval(trackingTimer);
      trackingTimer = null;
      return;
    }

    paint();
  }, 2600);
};

const renderOrderRecap = (order) => {
  const recap = el("#orderRecap");
  const rows = [
    ["Modalidade", modalityLabels[order.modality]],
    ["Pagamento", paymentLabels[order.payment]],
    ["Tempo estimado", formatPrepTime(order.prepTimeMinutes)],
    ["Total", formatMoney(order.total)]
  ];

  if (order.payment === "dinheiro" && order.changeDue > 0) {
    rows.push(["Troco", formatMoney(order.changeDue)]);
  }

  recap.innerHTML = rows
    .map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
};

const showTracking = (order) => {
  const isDelivery = order.modality === "entrega";
  const stages = trackingStagesByModality(order.modality);

  el("#orderId").textContent = order.orderId;
  el("#trackingKicker").textContent = isDelivery ? "Acompanhe seu pedido" : "Pedido confirmado";
  el("#trackingTitle").textContent = isDelivery
    ? "Acompanhe seu pedido"
    : modalityLabels[order.modality];

  renderTrackingSteps(stages);
  renderOrderRecap(order);
  advanceTracking(stages);

  showView("tracking");
  openTicket();
};

const resetOrder = () => {
  if (trackingTimer) {
    clearInterval(trackingTimer);
    trackingTimer = null;
  }

  state.cart.forEach((_, id) => refreshCard(id));
  state.cart.clear();
  state.payment = null;
  state.needsChange = false;

  document.querySelectorAll(".pay-btn").forEach((button) => {
    button.classList.remove("is-active");
    button.setAttribute("aria-checked", "false");
  });

  document.querySelectorAll(".change-opt").forEach((button, position) => {
    const isNo = position === 0;
    button.classList.toggle("is-active", isNo);
    button.setAttribute("aria-checked", String(isNo));
  });

  el("#changeBlock").hidden = true;
  el("#changeInput").hidden = true;
  el("#changeFor").value = "";
  el("#payError").hidden = true;

  updateBadge();
  showView("modality");
  syncSummary();
  closeTicket();
};

const loadMenu = async () => {
  try {
    const response = await fetch("/api/menu");
    if (!response.ok) {
      throw new Error("Falha ao carregar o cardápio.");
    }
    const grouped = await response.json();
    renderMenu(grouped);
  } catch (error) {
    console.error(error);
    el("#cardapio").insertAdjacentHTML(
      "afterbegin",
      '<p style="color:var(--cream-dim)">Não foi possível carregar o cardápio. Recarregue a página.</p>'
    );
  }
};

const init = async () => {
  setupModality();
  setupSteps();
  setupTicketToggle();
  setupPayment();
  setupNav();
  await loadMenu();
  await syncSummary();
};

init();