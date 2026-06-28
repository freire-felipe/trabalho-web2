# Portal de Jogos

Portal para buscar, filtrar e gerenciar informações de jogos.

O sistema gerencia duas coleções relacionadas:

- Categorias
- Jogos

Cada jogo pertence a uma categoria.

## Funcionalidades

- Listagem de jogos
- Busca de jogos em tempo real
- Filtros por categoria, plataforma e nota mínima
- Login simples de administrador
- Cadastro, edição e exclusão de jogos
- Cadastro, edição e exclusão de categorias
- Validação de dados no front-end e no back-end
- Persistência em banco de dados local
- Dados iniciais cadastrados automaticamente na primeira execução

## Como Executar

Instale as dependencias:

```bash
npm install
```

Inicie o servidor:

```bash
npm start
```

Ou, durante desenvolvimento:

```bash
npm run dev
```

Acesse no navegador:

```txt
http://localhost:3000
```

## Login

Administrador, pode cadastrar, editar e excluir jogos:

```txt
usuário: admin
senha: admin
```

## Rotas Principais Da API

Categorias:

- `GET /api/categorias`
- `GET /api/categorias/:id`
- `POST /api/categorias`
- `PUT /api/categorias/:id`
- `DELETE /api/categorias/:id`

Jogos:

- `GET /api/jogos`
- `GET /api/jogos/:id`
- `POST /api/jogos`
- `PUT /api/jogos/:id`
- `DELETE /api/jogos/:id`

Exemplos de busca e filtro:

- `GET /api/jogos?busca=zelda`
- `GET /api/jogos?categoria_id=1`
- `GET /api/jogos?plataforma=PC`
- `GET /api/jogos?nota_min=8`

## Estrutura

```txt
server.js
database.js
routes/
  categorias.js
  jogos.js
public/
  index.html
  styles.css
  app.js
```
