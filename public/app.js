const api = {
  categorias: '/api/categorias',
  jogos: '/api/jogos'
};

let categorias = [];
let jogos = [];

const elementos = {
  listaJogos: document.querySelector('#listaJogos'),
  contadorJogos: document.querySelector('#contadorJogos'),
  busca: document.querySelector('#busca'),
  filtroCategoria: document.querySelector('#filtroCategoria'),
  filtroPlataforma: document.querySelector('#filtroPlataforma'),
  filtroNota: document.querySelector('#filtroNota'),
  formJogo: document.querySelector('#formJogo'),
  tituloFormJogo: document.querySelector('#tituloFormJogo'),
  mensagemJogo: document.querySelector('#mensagemJogo'),
  cancelarEdicao: document.querySelector('#cancelarEdicao'),
  formCategoria: document.querySelector('#formCategoria'),
  listaCategorias: document.querySelector('#listaCategorias'),
  mensagemCategoria: document.querySelector('#mensagemCategoria')
};

document.addEventListener('DOMContentLoaded', iniciar);

function iniciar() {
  carregarTudo();

  elementos.busca.addEventListener('input', buscarComAtraso);
  elementos.filtroCategoria.addEventListener('change', carregarJogos);
  elementos.filtroPlataforma.addEventListener('input', buscarComAtraso);
  elementos.filtroNota.addEventListener('input', buscarComAtraso);
  elementos.formJogo.addEventListener('submit', salvarJogo);
  elementos.formCategoria.addEventListener('submit', salvarCategoria);
  elementos.cancelarEdicao.addEventListener('click', limparFormularioJogo);
}

async function carregarTudo() {
  await carregarCategorias();
  await carregarJogos();
}

async function carregarCategorias() {
  categorias = await requisicao(api.categorias);
  preencherSelectsCategorias();
  renderizarCategorias();
}

async function carregarJogos() {
  const params = new URLSearchParams();

  if (elementos.busca.value.trim()) params.append('busca', elementos.busca.value.trim());
  if (elementos.filtroCategoria.value) params.append('categoria_id', elementos.filtroCategoria.value);
  if (elementos.filtroPlataforma.value.trim()) params.append('plataforma', elementos.filtroPlataforma.value.trim());
  if (elementos.filtroNota.value) params.append('nota_min', elementos.filtroNota.value);

  jogos = await requisicao(`${api.jogos}?${params.toString()}`);
  renderizarJogos();
}

function preencherSelectsCategorias() {
  const opcoes = categorias.map((categoria) => `<option value="${categoria.id}">${categoria.nome}</option>`).join('');
  elementos.filtroCategoria.innerHTML = `<option value="">Todas</option>${opcoes}`;
  document.querySelector('#categoria_id').innerHTML = `<option value="">Selecione</option>${opcoes}`;
}

function renderizarJogos() {
  elementos.contadorJogos.textContent = `${jogos.length} ${jogos.length === 1 ? 'jogo' : 'jogos'}`;

  if (!jogos.length) {
    elementos.listaJogos.innerHTML = '<div class="vazio">Nenhum jogo encontrado com os filtros atuais.</div>';
    return;
  }

  elementos.listaJogos.innerHTML = jogos.map((jogo) => `
    <article class="card-jogo">
      <img src="${jogo.imagem_url || imagemPadrao()}" alt="Imagem do jogo ${escapar(jogo.titulo)}">
      <div class="card-conteudo">
        <h3>${escapar(jogo.titulo)}</h3>
        <p>${escapar(jogo.descricao)}</p>
        <ul class="detalhes-jogo">
          <li><strong>Categoria:</strong> ${escapar(jogo.categoria_nome)}</li>
          <li><strong>Genero:</strong> ${escapar(jogo.genero)}</li>
          <li><strong>Modelo:</strong> ${escapar(jogo.plataforma)}</li>
          <li><strong>Ano:</strong> ${jogo.ano_lancamento}</li>
          <li><strong>Nota:</strong> ${Number(jogo.nota).toFixed(1)}</li>
        </ul>
        <div class="acoes-card">
          <button onclick="editarJogo(${jogo.id})">Editar</button>
          <button class="perigo" onclick="excluirJogo(${jogo.id})">Excluir</button>
        </div>
      </div>
    </article>
  `).join('');
}

function renderizarCategorias() {
  elementos.listaCategorias.innerHTML = categorias.map((categoria) => `
    <li>
      <div>
        <strong>${escapar(categoria.nome)}</strong><br>
        <small>${escapar(categoria.descricao || 'Sem descricao')}</small>
      </div>
      <div class="acoes-card">
        <button type="button" onclick="editarCategoria(${categoria.id})">Editar</button>
        <button type="button" class="perigo" onclick="excluirCategoria(${categoria.id})">Excluir</button>
      </div>
    </li>
  `).join('');
}

async function salvarJogo(evento) {
  evento.preventDefault();
  const id = document.querySelector('#jogoId').value;
  const dados = lerFormularioJogo();
  const erro = validarJogoNoFront(dados);

  if (erro) {
    mostrarMensagem(elementos.mensagemJogo, erro, true);
    return;
  }

  const url = id ? `${api.jogos}/${id}` : api.jogos;
  const metodo = id ? 'PUT' : 'POST';

  try {
    await requisicao(url, metodo, dados);
    mostrarMensagem(elementos.mensagemJogo, 'Jogo salvo com sucesso.');
    limparFormularioJogo();
    await carregarJogos();
  } catch (erroRequisicao) {
    mostrarMensagem(elementos.mensagemJogo, erroRequisicao.message, true);
  }
}

function lerFormularioJogo() {
  return {
    titulo: document.querySelector('#titulo').value,
    descricao: document.querySelector('#descricao').value,
    genero: document.querySelector('#genero').value,
    plataforma: document.querySelector('#plataforma').value,
    ano_lancamento: document.querySelector('#ano_lancamento').value,
    nota: document.querySelector('#nota').value,
    imagem_url: document.querySelector('#imagem_url').value,
    categoria_id: document.querySelector('#categoria_id').value
  };
}

function validarJogoNoFront(dados) {
  const nota = Number(dados.nota);
  const ano = Number(dados.ano_lancamento);

  if (dados.titulo.trim().length < 2) return 'Titulo muito curto.';
  if (dados.descricao.trim().length < 5) return 'Descricao muito curta.';
  if (!dados.categoria_id) return 'Selecione uma categoria.';
  if (ano < 1970 || ano > new Date().getFullYear() + 1) return 'Ano invalido.';
  if (nota < 0 || nota > 10) return 'Nota deve estar entre 0 e 10.';

  return null;
}

function editarJogo(id) {
  const jogo = jogos.find((item) => item.id === id);
  if (!jogo) return;

  document.querySelector('#jogoId').value = jogo.id;
  document.querySelector('#titulo').value = jogo.titulo;
  document.querySelector('#descricao').value = jogo.descricao;
  document.querySelector('#genero').value = jogo.genero;
  document.querySelector('#plataforma').value = jogo.plataforma;
  document.querySelector('#ano_lancamento').value = jogo.ano_lancamento;
  document.querySelector('#nota').value = jogo.nota;
  document.querySelector('#imagem_url').value = jogo.imagem_url || '';
  document.querySelector('#categoria_id').value = jogo.categoria_id;
  elementos.tituloFormJogo.textContent = 'Editar jogo';
  elementos.cancelarEdicao.classList.remove('escondido');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limparFormularioJogo() {
  elementos.formJogo.reset();
  document.querySelector('#jogoId').value = '';
  elementos.tituloFormJogo.textContent = 'Cadastrar jogo';
  elementos.cancelarEdicao.classList.add('escondido');
}

async function excluirJogo(id) {
  if (!confirm('Deseja excluir este jogo?')) return;

  try {
    await requisicao(`${api.jogos}/${id}`, 'DELETE');
    await carregarJogos();
  } catch (erro) {
    alert(erro.message);
  }
}

async function salvarCategoria(evento) {
  evento.preventDefault();

  const id = document.querySelector('#categoriaEditId').value;
  const dados = {
    nome: document.querySelector('#nomeCategoria').value,
    descricao: document.querySelector('#descricaoCategoria').value
  };

  const url = id ? `${api.categorias}/${id}` : api.categorias;
  const metodo = id ? 'PUT' : 'POST';

  try {
    await requisicao(url, metodo, dados);
    elementos.formCategoria.reset();
    document.querySelector('#categoriaEditId').value = '';
    mostrarMensagem(elementos.mensagemCategoria, 'Categoria salva com sucesso.');
    await carregarCategorias();
    await carregarJogos();
  } catch (erro) {
    mostrarMensagem(elementos.mensagemCategoria, erro.message, true);
  }
}

function editarCategoria(id) {
  const categoria = categorias.find((item) => item.id === id);
  if (!categoria) return;

  document.querySelector('#categoriaEditId').value = categoria.id;
  document.querySelector('#nomeCategoria').value = categoria.nome;
  document.querySelector('#descricaoCategoria').value = categoria.descricao || '';
}

async function excluirCategoria(id) {
  if (!confirm('Deseja excluir esta categoria? Ela nao pode ter jogos vinculados.')) return;

  try {
    await requisicao(`${api.categorias}/${id}`, 'DELETE');
    await carregarCategorias();
  } catch (erro) {
    alert(erro.message);
  }
}

let tempoBusca;
function buscarComAtraso() {
  clearTimeout(tempoBusca);
  tempoBusca = setTimeout(carregarJogos, 300);
}

async function requisicao(url, metodo = 'GET', dados = null) {
  const opcoes = { method: metodo, headers: {} };

  if (dados) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(dados);
  }

  const resposta = await fetch(url, opcoes);
  const conteudo = await resposta.json();

  if (!resposta.ok) {
    throw new Error(conteudo.erro || 'Erro na requisicao.');
  }

  return conteudo;
}

function mostrarMensagem(elemento, texto, erro = false) {
  elemento.textContent = texto;
  elemento.classList.toggle('erro', erro);
}

function imagemPadrao() {
  return 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80';
}

function escapar(valor) {
  return String(valor || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
