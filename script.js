const SENHA_MESTRE = "282316"; // Mude a senha aqui se quiser
const STORAGE_KEY = "robocoin-alunos";
const PONTOS_ATIVIDADE = 10;

// Elementos da Tela de Senha
const telaSenhaEl = document.getElementById("tela-senha");
const formSenhaEl = document.getElementById("form-senha");
const campoSenhaEl = document.getElementById("campo-senha");
const erroSenhaEl = document.getElementById("erro-senha");

// Lógica de Autenticação por Senha
if (sessionStorage.getItem("robocoin-autenticado") === "true") {
  if (telaSenhaEl) {
    telaSenhaEl.hidden = true;
    telaSenhaEl.style.display = "none";
  }
}

if (formSenhaEl) {
  formSenhaEl.addEventListener("submit", (e) => {
    e.preventDefault();
    if (campoSenhaEl.value.trim() === SENHA_MESTRE) {
      if (telaSenhaEl) {
        telaSenhaEl.hidden = true;
        telaSenhaEl.style.display = "none";
      }
      sessionStorage.setItem("robocoin-autenticado", "true");
    } else {
      if (erroSenhaEl) erroSenhaEl.hidden = false;
      campoSenhaEl.value = "";
      campoSenhaEl.focus();
    }
  });
}

const exemplos = [
  { id: "ex-ana", nome: "Ana Silva", turma: "Terça · 14h", saldo: 12, atividades: atividadesVazias() },
  { id: "ex-pedro", nome: "Pedro Costa", turma: "Sábado · 10h", saldo: 8, atividades: atividadesVazias() },
];

const listaEl = document.getElementById("lista-alunos");
const vazioEl = document.getElementById("estado-vazio");
const statAlunos = document.getElementById("stat-alunos");
const statTotal = document.getElementById("stat-total");
const modalAluno = document.getElementById("modal-aluno");
const modalPainel = document.getElementById("modal-painel");
const formAluno = document.getElementById("form-aluno");
const checks = [...document.querySelectorAll("#modal-painel [data-atividade]")];
const btnExcluirSelecionados = document.getElementById("btn-excluir-selecionados");
const contadorSelecionadosEl = document.getElementById("contador-selecionados");

let alunos = carregar();
let alunoSelecionadoId = null;

// Web Audio API (Efeitos Sonoros)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function tocarSomMoeda() {
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(987.77, audioCtx.currentTime);
  osc.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}

function atividadesVazias() {
  return { montagem: false, programacao: false, organizacao: false };
}

function normalizarAluno(aluno) {
  return {
    ...aluno,
    saldo: Number(aluno.saldo) || 0,
    atividades: { ...atividadesVazias(), ...(aluno.atividades || {}) },
  };
}

function carregar() {
  const bruto = localStorage.getItem(STORAGE_KEY);
  if (!bruto) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exemplos));
    return structuredClone(exemplos);
  }
  try {
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? dados.map(normalizarAluno) : structuredClone(exemplos);
  } catch {
    return structuredClone(exemplos);
  }
}

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alunos));
}

function alunoAtual() {
  return alunos.find((item) => item.id === alunoSelecionadoId);
}

function atualizarBotaoExcluir() {
  const selecionados = document.querySelectorAll(".card-select:checked");
  const qtd = selecionados.length;
  contadorSelecionadosEl.textContent = qtd;
  btnExcluirSelecionados.hidden = qtd === 0;
}

function renderizar() {
  listaEl.innerHTML = "";
  vazioEl.hidden = alunos.length > 0;
  statAlunos.textContent = String(alunos.length);
  statTotal.textContent = String(alunos.reduce((soma, aluno) => soma + Number(aluno.saldo || 0), 0));

  for (const aluno of alunos) {
    const card = document.createElement("article");
    card.className = "card";
    
    card.innerHTML = `
      <div class="card-header">
        <div>
          <h3>${escapar(aluno.nome)}</h3>
          <p class="turma">${escapar(aluno.turma)}</p>
        </div>
        <input type="checkbox" class="card-select" data-id="${aluno.id}" aria-label="Selecionar ${aluno.nome}" />
      </div>
      <div class="saldo" data-painel="${aluno.id}" style="cursor: pointer;">
        <span class="coin" aria-hidden="true">🪙</span>
        <div>
          <span class="stat-label">Saldo RoboCoin</span>
          <strong>${Number(aluno.saldo)}</strong>
        </div>
      </div>
      <button type="button" class="btn-painel" data-painel="${aluno.id}">Painel de Controle</button>
    `;
    listaEl.appendChild(card);
  }

  atualizarBotaoExcluir();
}

function escapar(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function atualizarSaldoVisivel(saldo) {
  document.getElementById("painel-saldo").textContent = String(saldo);
  renderizar();
}

function abrirPainel(id) {
  const aluno = alunos.find((item) => item.id === id);
  if (!aluno) return;
  alunoSelecionadoId = id;
  document.getElementById("painel-nome").textContent = aluno.nome;
  document.getElementById("painel-turma").textContent = aluno.turma;
  document.getElementById("painel-saldo").textContent = String(aluno.saldo);
  
  for (const check of checks) {
    check.checked = Boolean(aluno.atividades[check.dataset.atividade]);
  }
  modalPainel.showModal();
}

function aplicarCheckbox(check) {
  const aluno = alunoAtual();
  if (!aluno) return;

  const chave = check.dataset.atividade;
  const jaMarcada = Boolean(aluno.atividades[chave]);
  const marcada = check.checked;

  if (marcada === jaMarcada) return;

  aluno.atividades[chave] = marcada;
  aluno.saldo = Math.max(0, aluno.saldo + (marcada ? PONTOS_ATIVIDADE : -PONTOS_ATIVIDADE));
  if (marcada) tocarSomMoeda();
  salvar();
  atualizarSaldoVisivel(aluno.saldo);
}

function ajustarSaldoManual(valorDelta) {
  const aluno = alunoAtual();
  if (!aluno) return;
  aluno.saldo = Math.max(0, aluno.saldo + valorDelta);
  if (valorDelta > 0) tocarSomMoeda();
  salvar();
  atualizarSaldoVisivel(aluno.saldo);
}

function confirmarAula() {
  const aluno = alunoAtual();
  if (!aluno) return;

  aluno.atividades = atividadesVazias();
  salvar();
  for (const check of checks) check.checked = false;
  atualizarSaldoVisivel(aluno.saldo);
  modalPainel.close();
}

// Event Listeners
document.getElementById("btn-novo-aluno").addEventListener("click", () => {
  formAluno.reset();
  modalAluno.showModal();
  document.getElementById("campo-nome").focus();
});

document.getElementById("btn-cancelar-aluno").addEventListener("click", () => {
  modalAluno.close();
});

formAluno.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const nome = document.getElementById("campo-nome").value.trim();
  const turma = document.getElementById("campo-turma").value.trim();
  if (!nome || !turma) return;

  alunos.push({
    id: crypto.randomUUID(),
    nome,
    turma,
    saldo: 0,
    atividades: atividadesVazias(),
  });
  salvar();
  renderizar();
  modalAluno.close();
});

listaEl.addEventListener("click", (evento) => {
  if (evento.target.classList.contains("card-select")) {
    atualizarBotaoExcluir();
    return;
  }

  const alvo = evento.target.closest("[data-painel]");
  if (alvo) {
    abrirPainel(alvo.dataset.painel);
  }
});

btnExcluirSelecionados.addEventListener("click", () => {
  const checkboxes = document.querySelectorAll(".card-select:checked");
  if (checkboxes.length === 0) return;

  const idsParaExcluir = Array.from(checkboxes).map((cb) => cb.dataset.id);
  const msg = idsParaExcluir.length === 1 
    ? "Deseja realmente excluir o aluno selecionado?" 
    : `Deseja realmente excluir os ${idsParaExcluir.length} alunos selecionados?`;

  if (confirm(msg)) {
    alunos = alunos.filter((aluno) => !idsParaExcluir.includes(aluno.id));
    salvar();
    renderizar();
  }
});

for (const check of checks) {
  check.addEventListener("change", () => aplicarCheckbox(check));
}

document.querySelectorAll(".btn-ajuste").forEach((b) => {
  b.addEventListener("click", () => {
    const delta = parseInt(b.dataset.ajuste, 10);
    ajustarSaldoManual(delta);
  });
});

document.getElementById("btn-confirmar-aula").addEventListener("click", confirmarAula);

document.getElementById("btn-fechar-painel").addEventListener("click", () => {
  modalPainel.close();
});

renderizar();