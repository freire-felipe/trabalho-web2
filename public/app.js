const api = {
  login: '/api/login',
  categorias: '/api/categorias',
  jogos: '/api/jogos'
};

let categorias = [];
let jogos = [];
let usuarioAtual = JSON.parse(localStorage.getItem('usuarioAtual'));
let acaoConfirmada = null;

if (usuarioAtual && usuarioAtual.perfil !== 'admin') {
  usuarioAtual = null;
  localStorage.removeItem('usuarioAtual');
}

const elementos = {
  listaJogos: document.querySelector('#listaJogos'),
  contadorJogos: document.querySelector('#contadorJogos'),
  busca: document.querySelector('#busca'),
  filtroCategoria: document.querySelector('#filtroCategoria'),
  filtroPlataforma: document.querySelector('#filtroPlataforma'),
  filtroNota: document.querySelector('#filtroNota'),
  abrirLogin: document.querySelector('#abrirLogin'),
  modalLogin: document.querySelector('#modalLogin'),
  fecharLogin: document.querySelector('#fecharLogin'),
  formLogin: document.querySelector('#formLogin'),
  mensagemLogin: document.querySelector('#mensagemLogin'),
  usuarioLogado: document.querySelector('#usuarioLogado'),
  btnNovoJogo: document.querySelector('#btnNovoJogo'),
  modalAdmin: document.querySelector('#modalAdmin'),
  fecharModal: document.querySelector('#fecharModal'),
  modalConfirmacao: document.querySelector('#modalConfirmacao'),
  tituloConfirmacao: document.querySelector('#tituloConfirmacao'),
  textoConfirmacao: document.querySelector('#textoConfirmacao'),
  confirmarExclusao: document.querySelector('#confirmarExclusao'),
  cancelarExclusao: document.querySelector('#cancelarExclusao'),
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
  atualizarInterfaceLogin();
  carregarTudo();

  elementos.abrirLogin.addEventListener('click', abrirModalLogin);
  elementos.fecharLogin.addEventListener('click', fecharModalLogin);
  elementos.modalLogin.addEventListener('click', fecharLoginPeloFundo);
  elementos.formLogin.addEventListener('submit', fazerLogin);
  configurarMultiselects();
  document.addEventListener('click', fecharMultiselectsPeloFundo);
  elementos.btnNovoJogo.addEventListener('click', abrirCadastroJogo);
  elementos.fecharModal.addEventListener('click', fecharModalAdmin);
  elementos.modalAdmin.addEventListener('click', fecharModalPeloFundo);
  elementos.confirmarExclusao.addEventListener('click', confirmarAcaoExclusao);
  elementos.cancelarExclusao.addEventListener('click', fecharModalConfirmacao);
  elementos.modalConfirmacao.addEventListener('click', fecharConfirmacaoPeloFundo);
  elementos.busca.addEventListener('input', buscarComAtraso);
  elementos.filtroCategoria.addEventListener('change', carregarJogos);
  elementos.filtroPlataforma.addEventListener('input', buscarComAtraso);
  elementos.filtroNota.addEventListener('input', buscarComAtraso);
  elementos.formJogo.addEventListener('submit', salvarJogo);
  elementos.formCategoria.addEventListener('submit', salvarCategoria);
  elementos.cancelarEdicao.addEventListener('click', limparFormularioJogo);
}

async function fazerLogin(evento) {
  evento.preventDefault();

  const dados = {
    usuario: document.querySelector('#usuarioLogin').value,
    senha: document.querySelector('#senhaLogin').value
  };

  try {
    usuarioAtual = await requisicao(api.login, 'POST', dados);
    localStorage.setItem('usuarioAtual', JSON.stringify(usuarioAtual));
    elementos.formLogin.reset();
    mostrarMensagem(elementos.mensagemLogin, 'Login realizado com sucesso.');
    fecharModalLogin();
    atualizarInterfaceLogin();
    renderizarJogos();
  } catch (erro) {
    mostrarMensagem(elementos.mensagemLogin, erro.message, true);
  }
}

function sair() {
  usuarioAtual = null;
  localStorage.removeItem('usuarioAtual');
  limparFormularioJogo();
  fecharModalLogin();
  fecharModalAdmin();
  fecharModalConfirmacao();
  atualizarInterfaceLogin();
  renderizarJogos();
}

function abrirModalLogin() {
  elementos.modalLogin.classList.remove('escondido');
  atualizarScrollDaPagina();
  elementos.mensagemLogin.textContent = '';
  elementos.mensagemLogin.classList.remove('erro');
}

function fecharModalLogin() {
  elementos.modalLogin.classList.add('escondido');
  atualizarScrollDaPagina();
}

function fecharLoginPeloFundo(evento) {
  if (evento.target === elementos.modalLogin) {
    fecharModalLogin();
  }
}

function atualizarInterfaceLogin() {
  const admin = usuarioAtual && usuarioAtual.perfil === 'admin';

  elementos.btnNovoJogo.classList.toggle('escondido', !admin);
  elementos.usuarioLogado.classList.toggle('escondido', !usuarioAtual);
  elementos.abrirLogin.classList.toggle('escondido', admin);
  if (!admin) fecharModalAdmin();

  if (!usuarioAtual) {
    elementos.usuarioLogado.innerHTML = '';
    elementos.mensagemLogin.textContent = '';
    elementos.mensagemLogin.classList.remove('erro');
    return;
  }

  elementos.usuarioLogado.innerHTML = `
    <span>Admin conectado</span>
    <button type="button" class="secundario" onclick="sair()">Sair</button>
  `;
}

function abrirCadastroJogo() {
  if (!usuarioAtual || usuarioAtual.perfil !== 'admin') return;

  limparFormularioJogo();
  abrirModalAdmin();
}

function abrirModalAdmin() {
  if (!usuarioAtual || usuarioAtual.perfil !== 'admin') return;

  elementos.modalAdmin.classList.remove('escondido');
  atualizarScrollDaPagina();
}

function fecharModalAdmin() {
  elementos.modalAdmin.classList.add('escondido');
  atualizarScrollDaPagina();
}

function atualizarScrollDaPagina() {
  const algumaModalAberta =
    !elementos.modalLogin.classList.contains('escondido') ||
    !elementos.modalAdmin.classList.contains('escondido') ||
    !elementos.modalConfirmacao.classList.contains('escondido');

  document.body.classList.toggle('modal-aberta', algumaModalAberta);
}

function abrirModalConfirmacao(titulo, texto, acao) {
  elementos.tituloConfirmacao.textContent = titulo;
  elementos.textoConfirmacao.textContent = texto;
  acaoConfirmada = acao;
  elementos.modalConfirmacao.classList.remove('escondido');
  atualizarScrollDaPagina();
}

function fecharModalConfirmacao() {
  elementos.modalConfirmacao.classList.add('escondido');
  acaoConfirmada = null;
  atualizarScrollDaPagina();
}

function fecharConfirmacaoPeloFundo(evento) {
  if (evento.target === elementos.modalConfirmacao) {
    fecharModalConfirmacao();
  }
}

async function confirmarAcaoExclusao() {
  if (!acaoConfirmada) return;

  const acao = acaoConfirmada;
  fecharModalConfirmacao();
  await acao();
}

function fecharModalPeloFundo(evento) {
  if (evento.target === elementos.modalAdmin) {
    fecharModalAdmin();
  }
}

function configurarMultiselects() {
  document.querySelectorAll('.multi-select').forEach((multiSelect) => {
    const botao = multiSelect.querySelector('.multi-select-botao');

    botao.addEventListener('click', () => {
      document.querySelectorAll('.multi-select.aberto').forEach((aberto) => {
        if (aberto !== multiSelect) aberto.classList.remove('aberto');
      });

      multiSelect.classList.toggle('aberto');
    });

    multiSelect.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => atualizarTextoMultiselect(multiSelect));
    });

    atualizarTextoMultiselect(multiSelect);
  });
}

function fecharMultiselectsPeloFundo(evento) {
  if (evento.target.closest('.multi-select')) return;

  document.querySelectorAll('.multi-select.aberto').forEach((multiSelect) => {
    multiSelect.classList.remove('aberto');
  });
}

function atualizarTextoMultiselect(multiSelect) {
  const valores = lerMultiselect(multiSelect.dataset.campo);
  const botao = multiSelect.querySelector('.multi-select-botao');

  botao.textContent = valores.length ? valores.join(', ') : 'Selecione';
  botao.classList.toggle('vazio', !valores.length);
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
}

function renderizarJogos() {
  elementos.contadorJogos.textContent = `${jogos.length} ${jogos.length === 1 ? 'jogo' : 'jogos'}`;
  const admin = usuarioAtual && usuarioAtual.perfil === 'admin';

  if (!jogos.length) {
    elementos.listaJogos.innerHTML = '<div class="vazio">Nenhum jogo encontrado com os filtros atuais.</div>';
    return;
  }

  elementos.listaJogos.innerHTML = jogos.map((jogo) => `
    <article class="card-jogo">
      <img src="${escapar(jogo.imagem_url || imagemPadrao())}" alt="Imagem do jogo ${escapar(jogo.titulo)}">
      <div class="card-conteudo">
        <h3>${escapar(jogo.titulo)}</h3>
        <p>${escapar(jogo.descricao)}</p>
        <ul class="detalhes-jogo">
          <li><strong>Gênero:</strong> ${escapar(jogo.genero)}</li>
          <li><strong>Plataforma:</strong> ${escapar(jogo.plataforma)}</li>
          <li><strong>Ano:</strong> ${jogo.ano_lancamento}</li>
          <li><strong>Nota:</strong> ${Number(jogo.nota).toFixed(1)}</li>
        </ul>
        <div class="acoes-card ${admin ? '' : 'escondido'}">
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
        <small>${escapar(categoria.descricao || 'Sem descrição')}</small>
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

  if (!usuarioAtual || usuarioAtual.perfil !== 'admin') {
    mostrarMensagem(elementos.mensagemJogo, 'Apenas o administrador pode salvar jogos.', true);
    return;
  }

  const id = document.querySelector('#jogoId').value;
  let dados;

  try {
    dados = await lerFormularioJogo(id);
  } catch (erroArquivo) {
    mostrarMensagem(elementos.mensagemJogo, erroArquivo.message, true);
    return;
  }

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
    fecharModalAdmin();
  } catch (erroRequisicao) {
    mostrarMensagem(elementos.mensagemJogo, erroRequisicao.message, true);
  }
}

async function lerFormularioJogo(id) {
  const generos = lerMultiselect('genero');
  const plataformas = lerMultiselect('plataforma');
  const arquivoImagem = document.querySelector('#imagem_arquivo').files[0];
  const jogoAtual = id ? jogos.find((item) => item.id === Number(id)) : null;

  return {
    titulo: document.querySelector('#titulo').value,
    descricao: document.querySelector('#descricao').value,
    genero: generos.join(', '),
    plataforma: plataformas.join(', '),
    ano_lancamento: document.querySelector('#ano_lancamento').value,
    nota: document.querySelector('#nota').value,
    imagem_url: arquivoImagem ? await lerArquivoImagem(arquivoImagem) : (jogoAtual ? jogoAtual.imagem_url : ''),
    categoria_id: obterCategoriaPeloGenero(generos[0])
  };
}

function lerArquivoImagem(arquivo) {
  const tiposPermitidos = ['image/jpeg', 'image/png'];

  if (!tiposPermitidos.includes(arquivo.type)) {
    return Promise.reject(new Error('Selecione uma imagem JPG ou PNG.'));
  }

  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
    leitor.readAsDataURL(arquivo);
  });
}

function lerMultiselect(campo) {
  return Array.from(document.querySelectorAll(`.multi-select[data-campo="${campo}"] input:checked`)).map((opcao) => opcao.value);
}

function selecionarOpcoes(campo, valores) {
  const valoresNormalizados = valores.map((valor) => valor.trim());
  const multiSelect = document.querySelector(`.multi-select[data-campo="${campo}"]`);

  multiSelect.querySelectorAll('input[type="checkbox"]').forEach((opcao) => {
    opcao.checked = valoresNormalizados.includes(opcao.value);
  });

  atualizarTextoMultiselect(multiSelect);
}

function obterCategoriaPeloGenero(genero) {
  const categoria = categorias.find((item) => item.nome === genero) || categorias[0];
  return categoria ? categoria.id : '';
}

function validarJogoNoFront(dados) {
  const nota = Number(dados.nota);
  const ano = Number(dados.ano_lancamento);

  if (dados.titulo.trim().length < 2) return 'Título muito curto.';
  if (dados.descricao.trim().length < 5) return 'Descrição muito curta.';
  if (!dados.genero) return 'Selecione pelo menos um gênero.';
  if (!dados.plataforma) return 'Selecione pelo menos uma plataforma.';
  if (!dados.categoria_id) return 'Nenhuma categoria foi encontrada.';
  if (ano < 1970 || ano > new Date().getFullYear() + 1) return 'Ano inválido.';
  if (nota < 0 || nota > 10) return 'Nota deve estar entre 0 e 10.';

  return null;
}

function editarJogo(id) {
  if (!usuarioAtual || usuarioAtual.perfil !== 'admin') {
    alert('Apenas o administrador pode editar jogos.');
    return;
  }

  const jogo = jogos.find((item) => item.id === id);
  if (!jogo) return;

  document.querySelector('#jogoId').value = jogo.id;
  document.querySelector('#titulo').value = jogo.titulo;
  document.querySelector('#descricao').value = jogo.descricao;
  selecionarOpcoes('genero', jogo.genero.split(','));
  selecionarOpcoes('plataforma', jogo.plataforma.split(','));
  document.querySelector('#ano_lancamento').value = jogo.ano_lancamento;
  document.querySelector('#nota').value = jogo.nota;
  document.querySelector('#categoria_id').value = jogo.categoria_id;
  elementos.tituloFormJogo.textContent = 'Editar jogo';
  elementos.cancelarEdicao.classList.remove('escondido');
  abrirModalAdmin();
}

function limparFormularioJogo() {
  elementos.formJogo.reset();
  document.querySelector('#jogoId').value = '';
  selecionarOpcoes('genero', []);
  selecionarOpcoes('plataforma', []);
  elementos.tituloFormJogo.textContent = 'Cadastrar jogo';
  elementos.cancelarEdicao.classList.add('escondido');
}

async function excluirJogo(id) {
  if (!usuarioAtual || usuarioAtual.perfil !== 'admin') {
    alert('Apenas o administrador pode excluir jogos.');
    return;
  }

  abrirModalConfirmacao('Excluir jogo', 'Deseja realmente excluir este jogo?', async () => {
    try {
      await requisicao(`${api.jogos}/${id}`, 'DELETE');
      await carregarJogos();
    } catch (erro) {
      alert(erro.message);
    }
  });
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
  abrirModalConfirmacao('Excluir categoria', 'Deseja excluir esta categoria? Ela não pode ter jogos vinculados.', async () => {
    try {
      await requisicao(`${api.categorias}/${id}`, 'DELETE');
      await carregarCategorias();
    } catch (erro) {
      alert(erro.message);
    }
  });
}

let tempoBusca;
function buscarComAtraso() {
  clearTimeout(tempoBusca);
  tempoBusca = setTimeout(carregarJogos, 300);
}

async function requisicao(url, metodo = 'GET', dados = null) {
  const opcoes = { method: metodo, headers: {} };

  if (usuarioAtual) {
    opcoes.headers['X-User-Role'] = usuarioAtual.perfil;
  }

  if (dados) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(dados);
  }

  const resposta = await fetch(url, opcoes);
  const tipoConteudo = resposta.headers.get('content-type') || '';
  const conteudo = tipoConteudo.includes('application/json') ? await resposta.json() : { erro: await resposta.text() };

  if (!resposta.ok) {
    throw new Error(conteudo.erro || 'Erro na requisição.');
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
