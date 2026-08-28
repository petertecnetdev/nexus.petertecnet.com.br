# Nexus

Nexus é a plataforma de criação e publicação de catálogos online da Peter Tecnet.

O fluxo principal do produto é simples:

**Cadastro/Login → Cadastrar empresa → Cadastrar itens → Publicar catálogo → Gerar/compartilhar QR Code e link público.**

A Nexus não é um marketplace. Cada empresa mantém o próprio catálogo e seus itens, enquanto visitantes acessam o catálogo público sem precisar criar conta.

## Arquitetura

- Frontend: React + React Router + React Bootstrap.
- API: API central Peter Tecnet em `https://api.petertecnet.com.br/api`.
- Autenticação: token Bearer compartilhado pelo ecossistema Peter Tecnet.
- Isolamento de domínio: `USER → APP → ESTABLISHMENT → RECURSOS`.
- Identificador padrão da Nexus: `REACT_APP_ID=2` (configurável por ambiente).

Uma conta pode usar vários aplicativos Peter Tecnet, mas empresas e recursos devem permanecer vinculados ao aplicativo em que foram cadastrados.

## Configuração local

Copie `.env.example` para `.env` e ajuste os valores quando necessário:

```env
REACT_APP_API_BASE_URL=https://api.petertecnet.com.br/api
REACT_APP_STORAGE_URL=https://api.petertecnet.com.br/storage
REACT_APP_PUBLIC_URL=https://nexus.petertecnet.com.br
REACT_APP_ID=2
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

Instale as dependências e execute:

```bash
npm install
npm start
```

## Qualidade

Antes de publicar alterações:

```bash
npm run lint
npm test
npm run build
```

O repositório também possui o workflow `Nexus Quality`, que executa lint, testes e build em pull requests e nas branches de auditoria.

## Rotas principais

- `/` — apresentação da Nexus.
- `/login` e `/register` — autenticação.
- `/establishment/my` — empresas/catálogos do usuário na Nexus.
- `/establishment/create` — cadastro inicial de empresa.
- `/establishment/item/:slug` — gerenciamento de itens de uma empresa.
- `/catalog/:slug` — catálogo público.
- `/item/:slug` — detalhes públicos de um item.

## Produção

O catálogo público deve continuar acessível sem autenticação. Operações administrativas de empresa e item devem ser autorizadas pela API, e todas as consultas relevantes devem respeitar o `app_id` da Nexus.

Nunca coloque tokens, chaves privadas ou segredos no bundle React. Variáveis `REACT_APP_*` são públicas por natureza e devem conter apenas configurações que possam ser expostas ao navegador.
