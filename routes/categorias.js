const express = require('express');
const db = require('../database');

const router = express.Router();

function validarCategoria(dados) {
  if (!dados.nome || dados.nome.trim().length < 2) {
    return 'O nome da categoria deve ter pelo menos 2 caracteres.';
  }

  return null;
}

router.get('/', (req, res) => {
  db.all('SELECT * FROM categorias ORDER BY nome', (erro, categorias) => {
    if (erro) return res.status(500).json({ erro: erro.message });
    res.json(categorias);
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM categorias WHERE id = ?', [req.params.id], (erro, categoria) => {
    if (erro) return res.status(500).json({ erro: erro.message });
    if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada.' });
    res.json(categoria);
  });
});

router.post('/', (req, res) => {
  const erroValidacao = validarCategoria(req.body);
  if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

  const { nome, descricao } = req.body;

  db.run(
    'INSERT INTO categorias (nome, descricao) VALUES (?, ?)',
    [nome.trim(), descricao ? descricao.trim() : ''],
    function (erro) {
      if (erro) return res.status(400).json({ erro: 'Não foi possível cadastrar. Talvez essa categoria já exista.' });
      res.status(201).json({ id: this.lastID, nome, descricao });
    }
  );
});

router.put('/:id', (req, res) => {
  const erroValidacao = validarCategoria(req.body);
  if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

  const { nome, descricao } = req.body;

  db.run(
    'UPDATE categorias SET nome = ?, descricao = ? WHERE id = ?',
    [nome.trim(), descricao ? descricao.trim() : '', req.params.id],
    function (erro) {
      if (erro) return res.status(400).json({ erro: 'Não foi possível atualizar a categoria.' });
      if (this.changes === 0) return res.status(404).json({ erro: 'Categoria não encontrada.' });
      res.json({ id: Number(req.params.id), nome, descricao });
    }
  );
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM categorias WHERE id = ?', [req.params.id], function (erro) {
    if (erro) {
      return res.status(400).json({ erro: 'Não é possível excluir uma categoria que possui jogos cadastrados.' });
    }

    if (this.changes === 0) return res.status(404).json({ erro: 'Categoria não encontrada.' });
    res.json({ mensagem: 'Categoria excluída com sucesso.' });
  });
});

module.exports = router;
