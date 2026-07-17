import { GroupedMenu, MenuItem } from "./types";

const menu: MenuItem[] = [
  {
    id: "pz-margherita",
    name: "Margherita da Casa",
    description: "Molho de tomate San Marzano, muçarela de búfala, manjericão fresco e azeite extravirgem.",
    price: 52,
    category: "pizzas"
  },
  {
    id: "pz-calabresa",
    name: "Calabresa Artesanal",
    description: "Calabresa curada na casa, cebola roxa, muçarela e orégano da serra.",
    price: 54,
    category: "pizzas"
  },
  {
    id: "pz-pepperoni",
    name: "Pepperoni Defumado",
    description: "Pepperoni italiano, muçarela e um fio de mel de pimenta.",
    price: 58,
    category: "pizzas"
  },
  {
    id: "pz-quatro-queijos",
    name: "Quatro Queijos",
    description: "Muçarela, gorgonzola, parmesão curado e provolone defumado.",
    price: 59,
    category: "pizzas"
  },
  {
    id: "pz-portuguesa",
    name: "Portuguesa",
    description: "Presunto, ovo, cebola, ervilha, azeitona preta e muçarela.",
    price: 56,
    category: "pizzas"
  },
  {
    id: "pz-frango-catupiry",
    name: "Frango com Catupiry",
    description: "Frango desfiado temperado, catupiry original e milho doce.",
    price: 55,
    category: "pizzas"
  },
  {
    id: "pz-trufada",
    name: "Marguerita Trufada",
    description: "Creme de trufa negra, muçarela de búfala e rúcula fresca. Pizza de autor.",
    price: 68,
    category: "pizzas"
  },
  {
    id: "pz-napolitana",
    name: "Napolitana",
    description: "Muçarela, rodelas de tomate, parmesão, anchovas e alho confitado.",
    price: 57,
    category: "pizzas"
  },
  {
    id: "pz-vegetariana",
    name: "Vegetariana da Horta",
    description: "Abobrinha, berinjela, pimentão assado, tomate seco e muçarela.",
    price: 54,
    category: "pizzas"
  },
  {
    id: "pz-diavola",
    name: "Diavola Picante",
    description: "Salame picante, 'nduja calabresa, pimenta dedo-de-moça e muçarela.",
    price: 61,
    category: "pizzas"
  },

  {
    id: "bb-chopp-pilsen",
    name: "Chopp Artesanal Pilsen 500ml",
    description: "Leve, cítrico e bem gelado, direto da torneira.",
    price: 18,
    category: "bebidas"
  },
  {
    id: "bb-vinho-malbec",
    name: "Vinho Tinto Malbec — Taça",
    description: "Encorpado e aveludado, perfeito para acompanhar as pizzas de autor.",
    price: 26,
    category: "bebidas"
  },
  {
    id: "bb-refrigerante",
    name: "Refrigerante Lata 350ml",
    description: "Cola, guaraná ou limão. Sempre servido no gelo.",
    price: 8,
    category: "bebidas"
  },
  {
    id: "bb-suco-laranja",
    name: "Suco Natural de Laranja 400ml",
    description: "Laranjas espremidas na hora, sem açúcar adicionado.",
    price: 12,
    category: "bebidas"
  },
  {
    id: "bb-agua-gas",
    name: "Água com Gás 500ml",
    description: "Água mineral gaseificada, servida gelada.",
    price: 7,
    category: "bebidas"
  },
  {
    id: "bb-agua",
    name: "Água Mineral 500ml",
    description: "Água mineral natural, sem gás.",
    price: 6,
    category: "bebidas"
  },
  {
    id: "bb-limonada",
    name: "Limonada Suíça 400ml",
    description: "Limão batido com a casca, cremosa e refrescante.",
    price: 13,
    category: "bebidas"
  },
  {
    id: "bb-ipa",
    name: "Cerveja Long Neck IPA",
    description: "Aromática e amarga na medida, com notas de lúpulo cítrico.",
    price: 16,
    category: "bebidas"
  },

  {
    id: "sb-petit-gateau",
    name: "Petit Gâteau com Sorvete",
    description: "Bolo quente de chocolate com centro derretido e sorvete de creme.",
    price: 28,
    category: "sobremesas"
  },
  {
    id: "sb-tiramisu",
    name: "Tiramisù da Casa",
    description: "Camadas de biscoito ao café, mascarpone e cacau amargo.",
    price: 26,
    category: "sobremesas"
  },
  {
    id: "sb-pizza-nutella",
    name: "Pizza Doce de Nutella com Morango",
    description: "Massa fina coberta com Nutella e morangos frescos fatiados.",
    price: 42,
    category: "sobremesas"
  },
  {
    id: "sb-cannoli",
    name: "Cannoli Siciliano — 2 unidades",
    description: "Massa crocante recheada com ricota doce e gotas de chocolate.",
    price: 24,
    category: "sobremesas"
  },
  {
    id: "sb-panna-cotta",
    name: "Panna Cotta de Frutas Vermelhas",
    description: "Creme italiano gelado com calda de frutas vermelhas.",
    price: 22,
    category: "sobremesas"
  },
  {
    id: "sb-brownie",
    name: "Brownie com Doce de Leite",
    description: "Brownie denso de chocolate meio amargo com doce de leite.",
    price: 20,
    category: "sobremesas"
  },
  {
    id: "sb-cheesecake",
    name: "Cheesecake de Goiabada",
    description: "Base crocante, creme de cream cheese e calda de goiabada cascão.",
    price: 23,
    category: "sobremesas"
  },
  {
    id: "sb-sorvete",
    name: "Sorvete Artesanal — 2 bolas",
    description: "Sabores do dia produzidos na casa. Consulte o balcão.",
    price: 16,
    category: "sobremesas"
  }
];

const menuIndex = new Map<string, MenuItem>(menu.map((item) => [item.id, item]));

export const getMenu = (): MenuItem[] => menu;

export const findMenuItem = (id: string): MenuItem | undefined => menuIndex.get(id);

export const getGroupedMenu = (): GroupedMenu => ({
  pizzas: menu.filter((item) => item.category === "pizzas"),
  bebidas: menu.filter((item) => item.category === "bebidas"),
  sobremesas: menu.filter((item) => item.category === "sobremesas")
});
