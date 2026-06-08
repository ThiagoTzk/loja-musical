# BlackTone Music

BlackTone Music é um aplicativo de e-commerce musical desenvolvido com Expo, React Native e Firebase. O projeto simula uma loja real para venda de instrumentos, vinis e produtos musicais, com fluxo de autenticação, catálogo vindo do banco de dados, carrinho, checkout, histórico de compras, dados de perfil e integração com API externa para preenchimento de endereço por CEP.

O app foi pensado seguindo práticas comuns em projetos reais de e-commerce: separação entre interface e serviços, uso de variáveis de ambiente, dados persistidos no Firebase, regras de segurança no Firestore, tratamento de erros, acessibilidade básica, tema claro/escuro e suporte a dois idiomas.

## Alunos

- Thiago José Camêlo Nunes
- Marcela do Nascimento Lima

## Principais funcionalidades

- Autenticação com email e senha usando Firebase Authentication.
- Cadastro e login integrados ao back-end.
- Catálogo de produtos carregado do Cloud Firestore.
- Busca de produtos por nome, categoria, descrição e preço.
- Carrinho de compras.
- Checkout com validação de CPF, endereço e forma de pagamento.
- Simulação de pagamento com cartão, Pix e débito.
- Criação de pedidos no Firestore.
- Histórico de compras no perfil do usuário.
- CRUD de pedidos: listar, atualizar status e excluir histórico.
- Dados pessoais do usuário salvos no Firestore.
- Endereço padrão com preenchimento automático pelo CEP.
- Cartão padrão salvo de forma simplificada, sem armazenar número completo nem CVV.
- Foto de perfil usando câmera do dispositivo.
- Tema claro e escuro.
- Tradução da interface para português e inglês.
- Cuidados básicos de acessibilidade baseados em WCAG, como contraste, labels, hints e área segura.
- Publicação de atualizações com EAS Update.

## Tecnologias utilizadas

- Expo
- React Native
- React
- TypeScript
- Expo Router
- React Context API
- Expo Camera
- Expo Updates / EAS Update
- React Native Safe Area Context
- ESLint

## APIs e serviços externos

Esta seção reúne as integrações que conectam o aplicativo a serviços fora do código local.

- Firebase Authentication: criação de conta e login com email e senha.
- Cloud Firestore: banco de dados usado para produtos, usuários e pedidos.
- Firebase REST API: comunicação HTTP com os serviços do Firebase.
- ViaCEP API: busca automática de endereço a partir do CEP.

### Firebase Authentication

Usado para criar contas e autenticar usuários com email e senha. O app utiliza a API REST do Firebase Authentication para cadastrar e entrar na conta.

Arquivo principal:

```text
src/config/firebase-config.ts
```

Funções principais:

```text
cadastrarUsuarioFirebase
entrarUsuarioFirebase
```

### Cloud Firestore

Usado como banco de dados do aplicativo. O Firestore armazena produtos, usuários e pedidos.

Arquivo principal:

```text
src/services/firestore.ts
```

Coleções usadas:

```text
produtos
usuarios
pedidos
```

Exemplos de dados salvos:

- Produtos: nome, categoria, descrição, preço, imagemLocal, imagemUrl, ativo e ordem.
- Usuários: email, uid, nome, CPF, telefone, enderecoPadrao, cartaoPadrao e perfilCompleto.
- Pedidos: usuarioId, itens, total, formaPagamento, endereço, CPF, status e datas.

### ViaCEP API

Usada para buscar endereço automaticamente ao digitar o CEP. Quando o usuário informa um CEP com 8 dígitos, o app consulta a API ViaCEP e preenche rua, bairro, cidade e UF.

Arquivo principal:

```text
src/services/cep.ts
```

Endpoint usado:

```text
https://viacep.com.br/ws/{cep}/json/
```

Fluxo simplificado:

1. O usuário digita o CEP.
2. O app remove caracteres que não são números.
3. Quando existem 8 dígitos, o app chama a API ViaCEP.
4. A resposta JSON é convertida para o formato usado pelo app.
5. A tela atualiza os campos de endereço automaticamente.

## Estrutura do projeto

```text
app/
  (tabs)/
    index.tsx        Tela inicial e catálogo
    busca.tsx        Busca de produtos
    carrinho.tsx     Carrinho de compras
    perfil.tsx       Perfil, histórico e pedidos
  cadastro.tsx       Criação de conta
  login.tsx          Login
  pagamento.tsx      Checkout e criação de pedidos
  dados-conta.tsx    Dados pessoais, endereço e cartão padrão
  produto/[id].tsx   Detalhes do produto

components/
  accessible-button.tsx
  brand-logo.tsx
  focusable-pressable.tsx
  language-toggle.tsx

src/
  config/
    firebase-config.ts
  context/
    CarrinhoContext.tsx
    LanguageContext.tsx
    ProdutosContext.tsx
    ThemeContext.tsx
    UsuarioContext.tsx
  data/
    produto.ts
  services/
    cep.ts
    firestore.ts
  utils/
    firebase-auth-errors.ts
    preco.ts
```

## Decisões inspiradas em aplicativos reais

- O app separa telas, contextos e serviços para manter o código organizado.
- O Firebase fica isolado em arquivos de configuração e serviço.
- As credenciais ficam em `.env` com prefixo `EXPO_PUBLIC_`, como recomendado em projetos Expo.
- Produtos não ficam fixos apenas na interface; eles podem vir do Firestore.
- Pedidos são persistidos no banco, permitindo histórico e gerenciamento.
- Dados sensíveis de cartão não são salvos por completo.
- O checkout separa dados pessoais, endereço e pagamento, como em e-commerces reais.
- O app possui tratamento de erro para login, cadastro, Firestore e CEP.
- A interface respeita área segura em iOS e Android.
- Acessibilidade foi considerada com contraste, labels, hints e botões com área de toque adequada.
- O app tem suporte a internacionalização, com textos em português e inglês.

## Configuração do ambiente

Crie um arquivo `.env` na raiz do projeto com as variáveis do Firebase. O Expo precisa que variáveis públicas comecem com `EXPO_PUBLIC_`.

Exemplo:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=sua_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=seu_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

O arquivo `.env` não deve ser enviado para o GitHub.

## Como rodar o projeto

Instale as dependências:

```bash
npm install
```

Inicie o Expo:

```bash
npx expo start
```

Rodar no Android:

```bash
npm run android
```

Rodar no iOS:

```bash
npm run ios
```

Rodar no navegador:

```bash
npm run web
```

## Como testar o fluxo principal

1. Criar uma conta em Cadastro.
2. Verificar se o usuário aparece no Firebase Authentication.
3. Entrar com a conta criada.
4. Verificar se o documento do usuário aparece na coleção `usuarios`.
5. Abrir Produtos e conferir os itens carregados do Firestore.
6. Adicionar um produto ao carrinho.
7. Abrir o checkout.
8. Completar CPF, endereço e forma de pagamento.
9. Usar um cartão de teste válido, como `4242 4242 4242 4242`, CVV `123` e validade futura.
10. Finalizar o pedido.
11. Conferir se o pedido foi salvo na coleção `pedidos`.
12. Abrir Perfil e verificar o histórico de compras.

## EAS Update

O projeto está configurado para receber atualizações via EAS Update.

Comando usado para publicar uma atualização:

```bash
npx eas-cli@latest update --channel production --message "Entrega final com Firebase"
```

## Qualidade e validação

Comando para verificar TypeScript:

```bash
npx tsc --noEmit
```

Comando para rodar o lint:

```bash
npm run lint
```

## Próximos passos

- Criar painel administrativo web para gerenciar produtos, pedidos, promoções e usuários.
- Integrar Firebase Storage para imagens dos produtos.
- Criar permissões de administrador no Firestore.
- Adicionar controle de estoque.
- Adicionar cupom de desconto.
- Melhorar persistência local da sessão do usuário.
- Criar status mais completos para pedidos, como pago, enviado, entregue e cancelado.

---

# BlackTone Music - English Version

BlackTone Music is a music e-commerce app built with Expo, React Native and Firebase. The project simulates a real store for musical instruments, vinyl records and music products, including authentication, a database-driven catalog, cart, checkout, purchase history, user profile data and an external API integration for automatic address lookup by ZIP code.

The app was designed using common practices from real e-commerce projects: separation between UI and services, environment variables, data persisted in Firebase, Firestore security rules, error handling, basic accessibility, light/dark theme and bilingual support.

## Students

- Thiago José Camêlo Nunes
- Marcela do Nascimento Lima

## Main features

- Email and password authentication with Firebase Authentication.
- Sign up and login integrated with the back-end.
- Product catalog loaded from Cloud Firestore.
- Product search by name, category, description and price.
- Shopping cart.
- Checkout with CPF, address and payment validation.
- Simulated payment with card, Pix and debit.
- Order creation in Firestore.
- Purchase history in the user profile.
- Order CRUD: list, update status and delete history.
- User personal data saved in Firestore.
- Default address with automatic ZIP code lookup.
- Simplified default card storage without saving the full card number or CVV.
- Profile photo using the device camera.
- Light and dark theme.
- Interface translation between Portuguese and English.
- Basic accessibility practices inspired by WCAG, including contrast, labels, hints and safe area support.
- Updates published with EAS Update.

## Technologies

- Expo
- React Native
- React
- TypeScript
- Expo Router
- React Context API
- Expo Camera
- Expo Updates / EAS Update
- React Native Safe Area Context
- ESLint

## External APIs and services

This section lists the integrations that connect the app to services outside the local codebase.

- Firebase Authentication: account creation and email/password login.
- Cloud Firestore: database used for products, users and orders.
- Firebase REST API: HTTP communication with Firebase services.
- ViaCEP API: automatic address lookup from a ZIP code.

### Firebase Authentication

Used to create accounts and authenticate users with email and password. The app uses the Firebase Authentication REST API for sign up and login.

Main file:

```text
src/config/firebase-config.ts
```

Main functions:

```text
cadastrarUsuarioFirebase
entrarUsuarioFirebase
```

### Cloud Firestore

Used as the app database. Firestore stores products, users and orders.

Main file:

```text
src/services/firestore.ts
```

Collections:

```text
produtos
usuarios
pedidos
```

Examples of stored data:

- Products: name, category, description, price, local image id, image URL, active status and display order.
- Users: email, uid, name, CPF, phone, default address, default card and profile completion status.
- Orders: userId, items, total, payment method, address, CPF, status and timestamps.

### ViaCEP API

Used to automatically fetch address data from a ZIP code. When the user enters an 8-digit CEP, the app calls ViaCEP and fills street, neighborhood, city and state.

Main file:

```text
src/services/cep.ts
```

Endpoint:

```text
https://viacep.com.br/ws/{cep}/json/
```

Simplified flow:

1. The user types the ZIP code.
2. The app removes non-numeric characters.
3. When there are 8 digits, the app calls the ViaCEP API.
4. The JSON response is mapped to the app address format.
5. The screen automatically updates the address fields.

## Project structure

```text
app/
  (tabs)/
    index.tsx        Home screen and catalog
    busca.tsx        Product search
    carrinho.tsx     Shopping cart
    perfil.tsx       Profile, history and orders
  cadastro.tsx       Account creation
  login.tsx          Login
  pagamento.tsx      Checkout and order creation
  dados-conta.tsx    Personal data, address and default card
  produto/[id].tsx   Product details

components/
  accessible-button.tsx
  brand-logo.tsx
  focusable-pressable.tsx
  language-toggle.tsx

src/
  config/
    firebase-config.ts
  context/
    CarrinhoContext.tsx
    LanguageContext.tsx
    ProdutosContext.tsx
    ThemeContext.tsx
    UsuarioContext.tsx
  data/
    produto.ts
  services/
    cep.ts
    firestore.ts
  utils/
    firebase-auth-errors.ts
    preco.ts
```

## Decisions inspired by real apps

- Screens, contexts and services are separated to keep the code organized.
- Firebase logic is isolated in configuration and service files.
- Credentials are stored in `.env` with the `EXPO_PUBLIC_` prefix, as expected in Expo projects.
- Products are not only hardcoded in the UI; they can be loaded from Firestore.
- Orders are persisted in the database, enabling history and management.
- Sensitive card data is not fully stored.
- Checkout separates personal data, delivery and payment, similar to real e-commerce apps.
- The app handles errors for login, sign up, Firestore and ZIP code lookup.
- The interface respects safe areas on iOS and Android.
- Accessibility is considered through contrast, labels, hints and touch target size.
- The app supports internationalization with Portuguese and English texts.

## Environment setup

Create a `.env` file in the project root with your Firebase variables. Expo public variables must use the `EXPO_PUBLIC_` prefix.

Example:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

The `.env` file should not be committed to GitHub.

## How to run

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run on web:

```bash
npm run web
```

## How to test the main flow

1. Create an account on the sign-up screen.
2. Check if the user appears in Firebase Authentication.
3. Login with the created account.
4. Check if the user document appears in the `usuarios` collection.
5. Open Products and confirm that items are loaded from Firestore.
6. Add a product to the cart.
7. Open checkout.
8. Complete CPF, address and payment method.
9. Use a valid test card, such as `4242 4242 4242 4242`, CVV `123` and a future expiration date.
10. Finish the order.
11. Check if the order was saved in the `pedidos` collection.
12. Open Profile and verify the purchase history.

## EAS Update

The project is configured to receive updates through EAS Update.

Command used to publish an update:

```bash
npx eas-cli@latest update --channel production --message "Entrega final com Firebase"
```

## Quality checks

TypeScript check:

```bash
npx tsc --noEmit
```

Lint:

```bash
npm run lint
```

## Next steps

- Create a web admin panel to manage products, orders, promotions and users.
- Integrate Firebase Storage for product images.
- Create administrator permissions in Firestore.
- Add stock control.
- Add discount coupons.
- Improve local session persistence.
- Create more complete order statuses, such as paid, shipped, delivered and canceled.
