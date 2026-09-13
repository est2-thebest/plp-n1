const estado = {
  jogadores: [],
  raids: [],
  raid: null,
  pagina: "jogadores",
  filtros: {
    jogadorBusca: "",
    jogadorFuncao: "",
    jogadorRaid: "",
    raidBusca: "",
  },
};

const el = {
  status: document.getElementById("status"),
  statusAncora: document.querySelector("main"),
  listaJogadores: document.getElementById("lista-jogadores"),
  listaRaids: document.getElementById("lista-raids"),
  raidTitulo: document.getElementById("raid-titulo"),
  raidVagas: document.getElementById("raid-vagas"),
  selectInscricao: document.getElementById("select-inscricao"),
  listaConfirmados: document.getElementById("lista-confirmados"),
  listaFila: document.getElementById("lista-fila"),
  checkPresenca: document.getElementById("check-presenca"),
  listaParticipantes: document.getElementById("lista-participantes"),
  listaLoots: document.getElementById("lista-loots"),
  historico: document.getElementById("historico"),
  historicoTitulo: document.getElementById("titulo-modal-historico"),
  filtroJogadorRaid: document.getElementById("filtro-jogador-raid"),
};

function posicionarBanner() {
  const dialog = document.querySelector("dialog.modal[open]");
  if (dialog) {
    const cabeca = dialog.querySelector(".modal__head");
    if (cabeca) {
      cabeca.after(el.status);
    } else {
      dialog.prepend(el.status);
    }
    return;
  }
  el.statusAncora.before(el.status);
}

function mostrarStatus(mensagem, tipo) {
  posicionarBanner();
  el.status.hidden = !mensagem;
  el.status.textContent = mensagem ?? "";
  el.status.className = tipo ? `banner banner--${tipo}` : "banner";
}

function idDe(item) {
  if (!item) {
    return "";
  }
  if (typeof item === "string") {
    return item;
  }
  return item.jogadorId ?? item.id ?? item.jogador?.id ?? "";
}

function nomeDe(item) {
  const id = idDe(item);
  const jogador = estado.jogadores.find((j) => j.id === id);
  if (jogador) {
    return `${jogador.nome} (${id}, ${jogador.funcao})`;
  }
  return item?.jogador?.nome ? `${item.jogador.nome} (${id})` : id;
}

function dataDaRaid(raid) {
  return String(raid?.data ?? "").slice(0, 10);
}

function inscritosDaRaid(raid) {
  const confirmados = raid.confirmados ?? raid.inscricoesConfirmadas ?? [];
  const fila = raid.fila ?? raid.filaEspera ?? [];
  return [...confirmados, ...fila];
}

function raidsDoJogador(jogadorId) {
  return estado.raids.filter((raid) =>
    inscritosDaRaid(raid).some((item) => idDe(item) === jogadorId),
  );
}

function jogadoresFiltrados() {
  const busca = estado.filtros.jogadorBusca.trim().toLowerCase();
  const funcao = estado.filtros.jogadorFuncao;
  const raidId = estado.filtros.jogadorRaid;

  return estado.jogadores.filter((jogador) => {
    const texto = `${jogador.nome} ${jogador.id}`.toLowerCase();
    if (busca && !texto.includes(busca)) {
      return false;
    }
    if (funcao && jogador.funcao !== funcao) {
      return false;
    }
    if (raidId && !raidsDoJogador(jogador.id).some((raid) => raid.id === raidId)) {
      return false;
    }
    return true;
  });
}

function raidsFiltradas() {
  const busca = estado.filtros.raidBusca.trim().toLowerCase();
  return estado.raids.filter((raid) => {
    const texto = `${raid.nome} ${raid.id} ${dataDaRaid(raid)}`.toLowerCase();
    return !busca || texto.includes(busca);
  });
}

function limparErros(form) {
  form.querySelectorAll(".field").forEach((campo) => {
    campo.classList.remove("field--invalido");
    const aviso = campo.querySelector(".field__error");
    if (aviso) {
      aviso.textContent = "";
    }
  });
}

function marcarErro(controle, mensagem) {
  const campo = controle.closest(".field");
  if (!campo) {
    return;
  }
  campo.classList.add("field--invalido");
  let aviso = campo.querySelector(".field__error");
  if (!aviso) {
    aviso = document.createElement("span");
    aviso.className = "field__error";
    campo.appendChild(aviso);
  }
  aviso.textContent = mensagem;
}

function formularioValido(form) {
  limparErros(form);
  let valido = true;

  form.querySelectorAll("[required]").forEach((controle) => {
    const vazio =
      controle.type === "number" ? controle.value === "" : !String(controle.value).trim();
    if (vazio) {
      marcarErro(controle, "Preencha este campo.");
      valido = false;
    } else if (controle.type === "number" && Number(controle.value) < 0) {
      marcarErro(controle, "Não pode ser negativo.");
      valido = false;
    }
  });

  return valido;
}

async function comErro(acao) {
  try {
    await acao();
  } catch (erro) {
    mostrarStatus(erro.message, "erro");
  }
}

function atualizarBotoesLimpar() {
  document.getElementById("limpar-filtros-jogador").hidden = !(
    estado.filtros.jogadorBusca.trim() ||
    estado.filtros.jogadorFuncao ||
    estado.filtros.jogadorRaid
  );
  document.getElementById("limpar-filtros-raid").hidden = !estado.filtros.raidBusca.trim();
}

function renderFiltroRaids() {
  const atual = estado.filtros.jogadorRaid;
  el.filtroJogadorRaid.innerHTML =
    '<option value="">Todas as raids</option>' +
    estado.raids.map((raid) => `<option value="${raid.id}">${raid.nome}</option>`).join("");
  el.filtroJogadorRaid.value = estado.raids.some((raid) => raid.id === atual) ? atual : "";
  estado.filtros.jogadorRaid = el.filtroJogadorRaid.value;
}

function renderJogadores() {
  atualizarBotoesLimpar();
  const jogadores = jogadoresFiltrados();
  if (estado.jogadores.length === 0) {
    el.listaJogadores.innerHTML = '<p class="empty">Nenhum jogador cadastrado.</p>';
    return;
  }
  if (jogadores.length === 0) {
    el.listaJogadores.innerHTML = '<p class="empty">Nenhum jogador encontrado.</p>';
    return;
  }

  el.listaJogadores.innerHTML = jogadores
    .map((jogador) => {
      const raids = raidsDoJogador(jogador.id)
        .map((raid) => raid.nome)
        .join(", ");
      const extra = raids ? ` · ${raids}` : "";
      return `<div class="row"><span>${jogador.nome} — ${jogador.id} · ${jogador.classe}<span class="tag tag--${jogador.funcao}">${jogador.funcao}</span>${extra}</span><button class="btn btn--ghost" type="button" data-historico="${jogador.id}">Histórico</button></div>`;
    })
    .join("");
}

function renderRaids() {
  atualizarBotoesLimpar();
  const raids = raidsFiltradas();
  if (estado.raids.length === 0) {
    el.listaRaids.innerHTML = '<p class="empty">Nenhuma raid criada.</p>';
    return;
  }
  if (raids.length === 0) {
    el.listaRaids.innerHTML = '<p class="empty">Nenhuma raid encontrada.</p>';
    return;
  }

  el.listaRaids.innerHTML = raids
    .map((raid) => {
      const data = dataDaRaid(raid);
      const extra = data ? ` · ${data}` : "";
      return `<div class="row"><span>${raid.nome} — ${raid.id}${extra}</span><button class="btn btn--primary" type="button" data-entrar="${raid.id}">Entrar</button></div>`;
    })
    .join("");
}

function renderInscricaoOptions() {
  const inscritos = new Set(estado.raid ? inscritosDaRaid(estado.raid).map(idDe) : []);
  const disponiveis = estado.jogadores.filter((jogador) => !inscritos.has(jogador.id));
  const botao = document.querySelector("#form-inscricao button[type=submit]");

  if (disponiveis.length === 0) {
    el.selectInscricao.innerHTML = '<option value="">Nenhum jogador disponível</option>';
    el.selectInscricao.disabled = true;
    if (botao) {
      botao.disabled = true;
    }
    return;
  }

  el.selectInscricao.disabled = false;
  if (botao) {
    botao.disabled = false;
  }
  el.selectInscricao.innerHTML = disponiveis
    .map((jogador) => `<option value="${jogador.id}">${jogador.nome} (${jogador.funcao})</option>`)
    .join("");
}

function renderListaInscritos(destino, inscritos, vazio) {
  if (!inscritos || inscritos.length === 0) {
    destino.innerHTML = `<p class="empty">${vazio}</p>`;
    return;
  }

  const raidId = estado.raid.id;
  destino.innerHTML = inscritos
    .map((item) => {
      const jogadorId = idDe(item);
      const status = item.status ? ` · ${item.status}` : "";
      return `<div class="row"><span>${nomeDe(item)}${status}</span><button class="btn btn--danger" type="button" data-remover="${jogadorId}" data-raid="${raidId}">Remover</button></div>`;
    })
    .join("");
}

function renderPresenca(confirmados) {
  if (!confirmados || confirmados.length === 0) {
    el.checkPresenca.innerHTML = '<p class="empty">Ninguém confirmado.</p>';
    return;
  }

  el.checkPresenca.innerHTML = confirmados
    .map((item) => {
      const id = idDe(item);
      return `<label class="row"><span>${nomeDe(item)}</span><input type="checkbox" name="presente" value="${id}" checked /></label>`;
    })
    .join("");
}

function renderLoots(loots) {
  if (!loots || loots.length === 0) {
    el.listaLoots.innerHTML = '<p class="empty">Nenhum item registrado.</p>';
    return;
  }

  const raidId = estado.raid.id;
  el.listaLoots.innerHTML = loots
    .map((item) => {
      const ganhador = item.ganhadorId ?? item.ganhador?.id;
      const acao = ganhador
        ? `<span class="empty">→ ${ganhador}</span>`
        : `<button class="btn btn--ghost" type="button" data-distribuir="${item.id}" data-raid="${raidId}">Distribuir</button>`;
      return `<div class="row"><span>${item.nome} (${item.id}) · ${item.funcaoRequerida ?? ""}</span>${acao}</div>`;
    })
    .join("");
}

function renderHistorico(dados, jogador) {
  const nome = jogador?.nome ?? dados?.jogadorId ?? "jogador";
  el.historicoTitulo.textContent = `Histórico · ${nome}`;
  const raids = dados?.raids ?? [];
  const itens = dados?.itensRecebidos ?? [];
  const participacoes = dados?.quantidadeParticipacoes ?? 0;
  el.historico.innerHTML = `<p>Participações: ${participacoes}</p><p>Raids: ${raids.length ? raids.join(", ") : "—"}</p><p>Itens: ${itens.length ? itens.map((item) => item.nome ?? item.id).join(", ") : "—"}</p>`;
}

function funcaoDoItem(item) {
  const jogador = estado.jogadores.find((j) => j.id === idDe(item));
  return jogador?.funcao ?? item.funcao ?? "";
}

function ocupadosNaFuncao(confirmados, funcao) {
  return confirmados.filter((item) => funcaoDoItem(item) === funcao).length;
}

function renderVagas(raid, confirmados) {
  const funcoes = [
    { chave: "tank", limite: raid.limiteTank },
    { chave: "healer", limite: raid.limiteHealer },
    { chave: "dps", limite: raid.limiteDps },
  ];

  el.raidVagas.innerHTML = funcoes
    .map(({ chave, limite }) => {
      const usados = ocupadosNaFuncao(confirmados, chave);
      const cheia = limite != null && usados >= Number(limite);
      return `<div class="vaga${cheia ? " vaga--cheia" : ""}"><span class="vaga__papel">${chave}</span><strong class="vaga__conta">${usados}/${limite ?? "?"}</strong><span class="vaga__legenda">confirmados</span></div>`;
    })
    .join("");
}

function renderRaid() {
  const raid = estado.raid;
  if (!raid) {
    return;
  }

  el.raidTitulo.textContent = `${raid.nome} (${raid.id})`;

  const confirmados = raid.confirmados ?? raid.inscricoesConfirmadas ?? [];
  const fila = raid.fila ?? raid.filaEspera ?? [];
  const participantes = raid.participantesEfetivos ?? raid.participantes ?? [];
  const loots = raid.loots ?? raid.itensLoot ?? [];

  renderVagas(raid, confirmados);
  renderInscricaoOptions();
  renderListaInscritos(el.listaConfirmados, confirmados, "Ninguém confirmado.");
  renderListaInscritos(el.listaFila, fila, "Fila vazia.");
  renderPresenca(confirmados);
  renderLoots(loots);

  el.listaParticipantes.textContent =
    participantes.length === 0 ? "—" : participantes.map((p) => nomeDe(p)).join(", ");
}
