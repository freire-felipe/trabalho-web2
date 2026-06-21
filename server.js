const express = require('express');
const cors = require('cors');
const path = require('path');
const { inicializarBanco } = require('./database');

const categoriasRoutes = require('./routes/categorias');
const jogosRoutes = require('./routes/jogos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/categorias', categoriasRoutes);
app.use('/api/jogos', jogosRoutes);

app.get('/api/status', (req, res) => {
  res.json({ mensagem: 'Portal de Jogos API online' });
});

inicializarBanco(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
});
