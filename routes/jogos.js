const express = require('express');
const db = require('../database');

const router = express.Router();

function somenteAdmin(req, res, next) {
  if (req.headers['x-user-role'] !== 'admin') {
    return res.status(403).json({ erro: 'Apenas o administrador pode cadastrar, editar ou excluir jogos.' });
  }

  next();
}

function validarJogo(dados) {
  const anoAtual = new Date().getFullYear() + 1;
  const ano = Number(dados.ano_lancamento);
  const nota = Number(dados.nota);

  if (!dados.titulo || dados.titulo.trim().length < 2) return 'O título deve ter pelo menos 2 caracteres.';
  if (!dados.descricao || dados.descricao.trim().length < 5) return 'A descrição deve ter pelo menos 5 caracteres.';
  if (!dados.genero || dados.genero.trim().length < 2) return 'O gênero é obrigatório.';
  if (!dados.plataforma || dados.plataforma.trim().length < 2) return 'A plataforma é obrigatória.';
  if (!Number.isInteger(ano) || ano < 1970 || ano > anoAtual) return 'Informe um ano de lançamento válido.';
  if (Number.isNaN(nota) || nota < 0 || nota > 10) return 'A nota deve estar entre 0 e 10.';
  if (!dados.categoria_id) return 'Selecione uma categoria.';

  return null;
}

function montarFiltros(query) {
  const filtros = [];
  const valores = [];

  if (query.busca) {
    filtros.push('(j.titulo LIKE ? OR j.descricao LIKE ? OR j.genero LIKE ?)');
    const busca = `%${query.busca}%`;
    valores.push(busca, busca, busca);
  }

  if (query.categoria_id) {
    filtros.push('j.categoria_id = ?');
    valores.push(query.categoria_id);
  }

  if (query.plataforma) {
    filtros.push('j.plataforma LIKE ?');
    valores.push(`%${query.plataforma}%`);
  }

  if (query.nota_min) {
    filtros.push('j.nota >= ?');
    valores.push(Number(query.nota_min));
  }

  return {
    where: filtros.length ? `WHERE ${filtros.join(' AND ')}` : '',
    valores
  };
}

router.get('/', (req, res) => {
  const filtros = montarFiltros(req.query);
  const sql = `
    SELECT j.*, c.nome AS categoria_nome
    FROM jogos j
    JOIN categorias c ON c.id = j.categoria_id
    ${filtros.where}
    ORDER BY j.titulo
  `;

  db.all(sql, filtros.valores, (erro, jogos) => {
    if (erro) return res.status(500).json({ erro: erro.message });
    res.json(jogos);
  });
});

router.get('/:id', (req, res) => {
  const sql = `
    SELECT j.*, c.nome AS categoria_nome
    FROM jogos j
    JOIN categorias c ON c.id = j.categoria_id
    WHERE j.id = ?
  `;

  db.get(sql, [req.params.id], (erro, jogo) => {
    if (erro) return res.status(500).json({ erro: erro.message });
    if (!jogo) return res.status(404).json({ erro: 'Jogo não encontrado.' });
    res.json(jogo);
  });
});

router.post('/', somenteAdmin, (req, res) => {
  const erroValidacao = validarJogo(req.body);
  if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

  salvarJogo(req, res, 'insert');
});

router.put('/:id', somenteAdmin, (req, res) => {
  const erroValidacao = validarJogo(req.body);
  if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

  salvarJogo(req, res, 'update');
});

function salvarJogo(req, res, modo) {
  const dados = prepararDados(req.body);

  db.get('SELECT id FROM categorias WHERE id = ?', [dados.categoria_id], (erro, categoria) => {
    if (erro) return res.status(500).json({ erro: erro.message });
    if (!categoria) return res.status(400).json({ erro: 'A categoria informada não existe.' });

    if (modo === 'insert') {
      const sql = `
        INSERT INTO jogos (titulo, descricao, genero, plataforma, ano_lancamento, nota, imagem_url, categoria_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(sql, Object.values(dados), function (erroInsert) {
        if (erroInsert) return res.status(500).json({ erro: erroInsert.message });
        res.status(201).json({ id: this.lastID, ...dados });
      });

      return;
    }

    const sql = `
      UPDATE jogos
      SET titulo = ?, descricao = ?, genero = ?, plataforma = ?, ano_lancamento = ?, nota = ?, imagem_url = ?, categoria_id = ?
      WHERE id = ?
    `;

    db.run(sql, [...Object.values(dados), req.params.id], function (erroUpdate) {
      if (erroUpdate) return res.status(500).json({ erro: erroUpdate.message });
      if (this.changes === 0) return res.status(404).json({ erro: 'Jogo não encontrado.' });
      res.json({ id: Number(req.params.id), ...dados });
    });
  });
}

function prepararDados(dados) {
  return {
    titulo: dados.titulo.trim(),
    descricao: dados.descricao.trim(),
    genero: dados.genero.trim(),
    plataforma: dados.plataforma.trim(),
    ano_lancamento: Number(dados.ano_lancamento),
    nota: Number(dados.nota),
    imagem_url: dados.imagem_url ? dados.imagem_url.trim() : '',
    categoria_id: Number(dados.categoria_id)
  };
}

router.delete('/:id', somenteAdmin, (req, res) => {
  db.run('DELETE FROM jogos WHERE id = ?', [req.params.id], function (erro) {
    if (erro) return res.status(500).json({ erro: erro.message });
    if (this.changes === 0) return res.status(404).json({ erro: 'Jogo não encontrado.' });
    res.json({ mensagem: 'Jogo excluído com sucesso.' });
  });
});

module.exports = router;
