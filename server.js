const express = require('express');
const cors = require('cors');
const path = require('path');
const { inicializarBanco } = require('./database');

const categoriasRoutes = require('./routes/categorias');
const jogosRoutes = require('./routes/jogos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use((req, res, next) => {
  res.charset = 'utf-8';
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === 'admin' && senha === 'admin') {
    return res.json({ usuario: 'admin', perfil: 'admin' });
  }

  res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
});

app.use('/api/categorias', categoriasRoutes);
app.use('/api/jogos', jogosRoutes);

app.get('/api/status', (req, res) => {
  res.json({ mensagem: 'Portal de Jogos API online' });
});

app.use((erro, req, res, next) => {
  if (erro.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'A imagem selecionada é muito grande. Escolha uma imagem menor.' });
  }

  next(erro);
});

inicializarBanco(() => {
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  }
});

module.exports = app;
