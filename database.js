const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'portal-jogos.db');
const db = new sqlite3.Database(dbPath);

function inicializarBanco(callback) {
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');

    db.run(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE,
        descricao TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS jogos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        genero TEXT NOT NULL,
        plataforma TEXT NOT NULL,
        ano_lancamento INTEGER NOT NULL,
        nota REAL NOT NULL,
        imagem_url TEXT,
        categoria_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
      )
    `);

    inserirDadosIniciais(callback);
  });
}

function inserirDadosIniciais(callback) {
  const categorias = [
    ['RPG', 'Jogos focados em progressão de personagem e história.'],
    ['Ação', 'Jogos com combate, aventura e ritmo intenso.'],
    ['Corrida', 'Jogos de carros, motos e competições de velocidade.'],
    ['Estratégia', 'Jogos que exigem planejamento e tomada de decisão.']
  ];

  const jogos = [
    ['The Legend of Zelda: Breath of the Wild', 'Aventura em mundo aberto com exploração, puzzles e combate.', 'Aventura', 'Nintendo Switch', 2017, 9.8, '/capas/zelda-breath-of-the-wild.jpg', 'Ação'],
    ['God of War', 'Kratos e Atreus enfrentam criaturas da mitologia nórdica.', 'Ação', 'PlayStation / PC', 2018, 9.6, '/capas/god-of-war.jpg', 'Ação'],
    ['Minecraft', 'Jogo de construção, sobrevivência e criatividade em blocos.', 'Sandbox', 'Multiplataforma', 2011, 9.0, '/capas/minecraft.jpg', 'Estratégia'],
    ['Forza Horizon 5', 'Corridas em mundo aberto com centenas de carros.', 'Corrida', 'Xbox / PC', 2021, 9.2, '/capas/forza-horizon-5.jpg', 'Corrida'],
    ['Baldur\'s Gate 3', 'RPG de fantasia com escolhas, turnos e narrativa profunda.', 'RPG', 'PC / PlayStation / Xbox', 2023, 9.7, '/capas/baldurs-gate-3.jpg', 'RPG']
  ];

  db.serialize(() => {
    atualizarDadosAntigos();

    const inserirCategoria = db.prepare('INSERT OR IGNORE INTO categorias (nome, descricao) VALUES (?, ?)');
    categorias.forEach((categoria) => inserirCategoria.run(categoria));
    inserirCategoria.finalize();

    const inserirJogo = db.prepare(`
      INSERT INTO jogos (titulo, descricao, genero, plataforma, ano_lancamento, nota, imagem_url, categoria_id)
      SELECT ?, ?, ?, ?, ?, ?, ?, c.id
      FROM categorias c
      WHERE c.nome = ?
      AND NOT EXISTS (SELECT 1 FROM jogos WHERE titulo = ?)
    `);

    jogos.forEach((jogo) => {
      const [titulo, descricao, genero, plataforma, ano, nota, imagem, categoriaNome] = jogo;
      inserirJogo.run([titulo, descricao, genero, plataforma, ano, nota, imagem, categoriaNome, titulo]);
    });

    inserirJogo.finalize(callback);
  });
}

function atualizarDadosAntigos() {
  db.run("UPDATE categorias SET nome = 'Ação' WHERE nome = 'Acao'");
  db.run("UPDATE categorias SET nome = 'Estratégia' WHERE nome = 'Estrategia'");
  db.run("UPDATE jogos SET genero = 'Ação' WHERE genero = 'Acao'");
  db.run("UPDATE categorias SET descricao = 'Jogos focados em progressão de personagem e história.' WHERE nome = 'RPG'");
  db.run("UPDATE categorias SET descricao = 'Jogos de carros, motos e competições de velocidade.' WHERE nome = 'Corrida'");
  db.run("UPDATE categorias SET descricao = 'Jogos que exigem planejamento e tomada de decisão.' WHERE nome = 'Estratégia'");
  db.run("UPDATE jogos SET descricao = 'Aventura em mundo aberto com exploração, puzzles e combate.' WHERE titulo = 'The Legend of Zelda: Breath of the Wild'");
  db.run("UPDATE jogos SET descricao = 'Kratos e Atreus enfrentam criaturas da mitologia nórdica.' WHERE titulo = 'God of War'");
  db.run("UPDATE jogos SET descricao = 'Jogo de construção, sobrevivência e criatividade em blocos.' WHERE titulo = 'Minecraft'");
  db.run("UPDATE jogos SET imagem_url = '/capas/zelda-breath-of-the-wild.jpg' WHERE titulo = 'The Legend of Zelda: Breath of the Wild'");
  db.run("UPDATE jogos SET imagem_url = '/capas/god-of-war.jpg' WHERE titulo = 'God of War'");
  db.run("UPDATE jogos SET imagem_url = '/capas/minecraft.jpg' WHERE titulo = 'Minecraft'");
  db.run("UPDATE jogos SET imagem_url = '/capas/forza-horizon-5.jpg' WHERE titulo = 'Forza Horizon 5'");
  db.run("UPDATE jogos SET imagem_url = '/capas/baldurs-gate-3.jpg' WHERE titulo = 'Baldur''s Gate 3'");
}

module.exports = db;
module.exports.inicializarBanco = inicializarBanco;
