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
    ['RPG', 'Jogos focados em progressao de personagem e historia.'],
    ['Acao', 'Jogos com combate, aventura e ritmo intenso.'],
    ['Corrida', 'Jogos de carros, motos e competicoes de velocidade.'],
    ['Estrategia', 'Jogos que exigem planejamento e tomada de decisao.']
  ];

  const jogos = [
    ['The Legend of Zelda: Breath of the Wild', 'Aventura em mundo aberto com exploracao, puzzles e combate.', 'Aventura', 'Nintendo Switch', 2017, 9.8, 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80', 'Acao'],
    ['God of War', 'Kratos e Atreus enfrentam criaturas da mitologia nordica.', 'Acao', 'PlayStation / PC', 2018, 9.6, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=80', 'Acao'],
    ['Minecraft', 'Jogo de construcao, sobrevivencia e criatividade em blocos.', 'Sandbox', 'Multiplataforma', 2011, 9.0, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80', 'Estrategia'],
    ['Forza Horizon 5', 'Corridas em mundo aberto com centenas de carros.', 'Corrida', 'Xbox / PC', 2021, 9.2, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80', 'Corrida'],
    ['Baldur\'s Gate 3', 'RPG de fantasia com escolhas, turnos e narrativa profunda.', 'RPG', 'PC / PlayStation / Xbox', 2023, 9.7, 'https://images.unsplash.com/photo-1556438064-2d7646166914?auto=format&fit=crop&w=900&q=80', 'RPG']
  ];

  db.serialize(() => {
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

module.exports = db;
module.exports.inicializarBanco = inicializarBanco;
