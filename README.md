# Forno & Brasa

Site de uma pizzaria de forno a lenha, feito como página única. A pessoa navega pelo cardápio, monta o pedido e fecha tudo por uma comanda que abre num painel lateral. O back-end é onde ficam as contas (preço, taxa, tempo de espera, sugestões) e o front só consome a API e vai atualizando o resumo conforme o carrinho muda.

Fiz o back em Node com Express e TypeScript, e o front em HTML, CSS e JavaScript puro, sem framework nenhum.

## Rodando o projeto

Precisa ter Node instalado (versão 18 pra cima) e o npm.

```bash
npm install
npm run dev
```

Isso sobe o servidor em modo desenvolvimento, que recarrega sozinho quando você salva um arquivo. Depois é só abrir `http://localhost:3000` no navegador.

Pra rodar a versão compilada (produção), o caminho é outro:

```bash
npm run build
npm start
```

Se a porta 3000 estiver ocupada, dá pra trocar:

```bash
PORT=8080 npm start
```

Os três scripts, resumindo: `dev` sobe com recarga automática, `build` compila o TypeScript pra pasta `dist`, e `start` roda o que foi compilado.

## Como o projeto está organizado

```
forno-brasa/
├── src/
│   ├── types.ts          tipos do domínio
│   ├── data.ts           o cardápio e as buscas nele
│   ├── orderService.ts   as regras de negócio
│   ├── routes.ts         as rotas da API
│   └── server.ts         o Express em si
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── package.json
└── tsconfig.json
```

A ideia foi deixar cada arquivo com um trabalho só. O `data.ts` guarda o cardápio e sabe procurar item por id; o `orderService.ts` faz as contas e não sabe nada de HTTP; as rotas só recebem a requisição, chamam o serviço e devolvem a resposta; e o `server.ts` junta tudo e serve a pasta `public` como estático. O TypeScript compila pra `dist`, e é de lá que o Express serve o site.

No front são três arquivos separados mesmo, ligados pelo `<link>` e pelo `<script>` no HTML.

## O que dá pra fazer no site

O cardápio é fixo: 10 pizzas, 8 bebidas e 8 sobremesas, cada uma com nome, descrição e preço. A pessoa vai adicionando itens e o número na comanda vai subindo.

A comanda abre num painel no canto direito (no celular ela ocupa a tela toda) e funciona em três passos, um de cada vez, pra não jogar tudo na cara de uma vez:

1. **Como quer receber** — comer no local, retirar no balcão ou entrega. Só a entrega cobra taxa, R$ 10 fixos.
2. **Conferir o pedido** — a lista de itens com os controles de quantidade, uma sugestão de "que tal adicionar?" com coisas que ainda não estão no carrinho, e o total.
3. **Pagamento** — cartão, pix, dinheiro ou vale-alimentação, junto com o tempo de espera estimado. Se escolher dinheiro, aparece a pergunta do troco; respondendo que precisa, tem um campo pra dizer troco pra quanto, e o valor do troco é calculado ali mesmo.

Depois de confirmar, se o pedido for pra entrega, cai numa tela de acompanhamento com o número do pedido e as etapas do preparo até sair pra entrega. Nas outras modalidades mostra a confirmação com os dados do pedido. Dá pra começar um pedido novo a qualquer momento.

Dá pra voltar um passo quando quiser, pelo botão de voltar.

## As regras de negócio

Ficam todas no `orderService.ts`, e são estas:

O **tempo de espera** é 10 minutos de base mais 5 por item no carrinho. Três itens dão 25 minutos, por exemplo. Carrinho vazio não mostra tempo.

A **taxa de entrega** é R$ 10 e só entra quando a modalidade é entrega e existe pelo menos um item.

As **sugestões** são sempre 3 itens do cardápio que a pessoa ainda não pôs no carrinho, e mudam conforme ela adiciona coisas.

O **troco** só é cobrado quando o pagamento é em dinheiro e a pessoa disse que precisa. O valor informado tem que ser maior ou igual ao total — se for menor, o pedido é recusado com uma mensagem explicando.

Tem também uma validação defensiva: se chegar um item que não existe no cardápio ou uma quantidade zoada, ele é ignorado no cálculo em vez de quebrar a requisição.

## A API

Tudo embaixo de `/api`.

**`GET /api/menu`** devolve o cardápio já separado em pizzas, bebidas e sobremesas.

**`POST /api/order/summary`** recebe os itens e a modalidade e devolve o resumo com subtotal, taxa, total, tempo e sugestões. É o que o front chama toda vez que o carrinho muda.

```json
{
  "items": [{ "id": "pz-margherita", "quantity": 2 }],
  "modality": "entrega"
}
```

**`POST /api/order/checkout`** fecha o pedido. Recebe também a forma de pagamento e, no caso do dinheiro com troco, o valor pra troco. Se der tudo certo, responde com `201` e os dados do pedido, incluindo um número gerado e o troco a devolver.

```json
{
  "items": [{ "id": "pz-margherita", "quantity": 1 }],
  "modality": "entrega",
  "payment": "dinheiro",
  "changeFor": 100
}
```

Sobre os erros: dados inválidos (modalidade ou pagamento errados, comanda vazia, troco menor que o total) voltam `400`; rota que não existe volta `404`; e qualquer falha inesperada cai num `500`. Em todos os casos a resposta é um JSON no formato `{ "error": "mensagem" }`.

## O cardápio

Pizzas: Margherita da Casa, Calabresa Artesanal, Pepperoni Defumado, Quatro Queijos, Portuguesa, Frango com Catupiry, Marguerita Trufada, Napolitana, Vegetariana da Horta e Diavola Picante.

Bebidas: Chopp Artesanal Pilsen, Vinho Tinto Malbec em taça, Refrigerante Lata, Suco Natural de Laranja, Água com Gás, Água Mineral, Limonada Suíça e Cerveja Long Neck IPA.

Sobremesas: Petit Gâteau com Sorvete, Tiramisù da Casa, Pizza Doce de Nutella com Morango, Cannoli Siciliano, Panna Cotta de Frutas Vermelhas, Brownie com Doce de Leite, Cheesecake de Goiabada e Sorvete Artesanal.

Pra mexer em item ou preço, é no array do `data.ts`.

## Sobre o visual

A pegada é a "boca do forno": fundo escuro grafite com um gradiente leve de brasa puxando pro âmbar e terracota, que dá um clima mais quente sem poluir a tela. As fontes são a Fraunces nos títulos (aquela serifada mais marcante), a Instrument Sans no texto corrido e a Space Mono nos preços e nos tempos.

O detalhe que amarra tudo é a comanda, desenhada como uma ficha de cozinha em papel creme, com as perfurações tracejadas e uma barrinha de brasa mostrando o tempo de espera. As cores estão todas em variáveis no `:root` do CSS, então mudar a paleta é mexer num lugar só.

Sobre acessibilidade e responsividade: os grupos de escolha (modalidade, pagamento, troco) usam `role="radiogroup"` com o `aria-checked` acompanhando a seleção; o foco de teclado é visível e dá pra fechar a comanda no Esc; quem tem `prefers-reduced-motion` ligado não vê as animações; e o layout se ajusta do desktop ao celular, onde a comanda passa a ocupar a tela inteira.

## Padrão de código

<<<<<<< HEAD
Deixei o código sem comentários, apostando em nomes que se explicam. As funções são curtas e cada uma faz uma coisa. O TypeScript está no modo `strict`, com as flags que reclamam de variável e parâmetro sem uso, então descuido de tipo aparece já na compilação. E todas as rotas têm o tratamento de erro básico pra não derrubar o servidor.
=======
Deixei o código sem comentários, apostando em nomes que se explicam. As funções são curtas e cada uma faz uma coisa. O TypeScript está no modo `strict`, com as flags que reclamam de variável e parâmetro sem uso, então descuido de tipo aparece já na compilação. E todas as rotas têm o tratamento de erro básico pra não derrubar o servidor.
>>>>>>> 876a65eee14c607fc50382d61c937c2fab0fb3ec
