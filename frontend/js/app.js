const estado = {
  jogadores: [],
  raids: [],
  raid: null,
};

const el = {
  status: document.getElementById("status"),
  listaJogadores: document.getElementById("lista-jogadores"),
  listaRaids: document.getElementById("lista-raids"),
  painelRaid: document.getElementById("painel-raid"),
  raidTitulo: document.getElementById("raid-titulo"),
  raidResumo: document.getElementById("raid-resumo"),
  selectInscricao: document.getElementById("select-inscricao"),
  listaConfirmados: document.getElementById("lista-confirmados"),
  listaFila: document.getElementById("lista-fila"),
  checkPresenca: document.getElementById("check-presenca"),
  listaParticipantes: document.getElementById("lista-participantes"),
  listaLoots: document.getElementById("lista-loots"),
  historico: document.getElementById("historico"),
};

function mostrarStatus(mensagem, tipo) {
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

async function comErro(acao) {
  try {
    await acao();
    mostrarStatus("", "");
  } catch (erro) {
    mostrarStatus(erro.message, "erro");
  }
}

function renderJogadores() {
  if (estado.jogadores.length === 0) {
    el.listaJogadores.innerHTML = '<p class="empty">Nenhum jogador cadastrado.</p>';
    return;
  }

  el.listaJogadores.innerHTML = estado.jogadores
    .map(
      (j) =>
        `<div class="row"><span>${j.nome} — ${j.id} · ${j.classe}<span class="tag tag--${j.funcao}">${j.funcao}</span></span></div>`,
    )
    .join("");
}

function renderRaids() {
  if (estado.raids.length === 0) {
    el.listaRaids.innerHTML = '<p class="empty">Nenhuma raid criada.</p>';
    return;
  }

  el.listaRaids.innerHTML = estado.raids
    .map((r) => {
      const id = r.id;
      return `<div class="row"><span>${r.nome} — ${id}</span><button class="btn btn--ghost" type="button" data-abrir="${id}">Abrir</button></div>`;
    })
    .join("");
}

function renderInscricaoOptions() {
  el.selectInscricao.innerHTML = estado.jogadores
    .map((j) => `<option value="${j.id}">${j.nome} (${j.funcao})</option>`)
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

function renderRaid() {
  const raid = estado.raid;
  if (!raid) {
    el.painelRaid.hidden = true;
    return;
  }

  el.painelRaid.hidden = false;
  el.raidTitulo.textContent = `${raid.nome} (${raid.id})`;
  el.raidResumo.textContent = `Vagas tank ${raid.limiteTank ?? "?"} · healer ${raid.limiteHealer ?? "?"} · dps ${raid.limiteDps ?? "?"}`;

  const confirmados = raid.confirmados ?? raid.inscricoesConfirmadas ?? [];
  const fila = raid.fila ?? raid.filaEspera ?? [];
  const participantes = raid.participantesEfetivos ?? raid.participantes ?? [];
  const loots = raid.loots ?? raid.itensLoot ?? [];

  renderInscricaoOptions();
  renderListaInscritos(el.listaConfirmados, confirmados, "Ninguém confirmado.");
  renderListaInscritos(el.listaFila, fila, "Fila vazia.");
  renderPresenca(confirmados);
  renderLoots(loots);

  el.listaParticipantes.textContent =
    participantes.length === 0 ? "—" : participantes.map((p) => nomeDe(p)).join(", ");
}

async function carregarJogadores() {
  const dados = await api.listarJogadores();
  estado.jogadores = Array.isArray(dados) ? dados : dados?.jogadores ?? [];
  renderJogadores();
  renderInscricaoOptions();
}

async function carregarRaids() {
  const dados = await api.listarRaids();
  estado.raids = Array.isArray(dados) ? dados : dados?.raids ?? [];
  renderRaids();
}

async function abrirRaid(id) {
  estado.raid = await api.obterRaid(id);
  renderRaid();
}

async function recarregarTudo() {
  await comErro(async () => {
    await carregarJogadores();
    await carregarRaids();
    if (estado.raid?.id) {
      await abrirRaid(estado.raid.id);
    }
    mostrarStatus(`Conectado em ${apiBase()}.`, "ok");
  });

  if (el.status.classList.contains("banner--erro")) {
    estado.jogadores = [];
    estado.raids = [];
    renderJogadores();
    renderRaids();
    el.painelRaid.hidden = true;
  }
}

document.getElementById("backend").addEventListener("change", recarregarTudo);

document.getElementById("form-jogador").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const form = evento.target;
  const jogador = {
    id: form.id.value.trim(),
    nome: form.nome.value.trim(),
    classe: form.classe.value,
    funcao: form.funcao.value,
  };
  comErro(async () => {
    await api.cadastrarJogador(jogador);
    form.reset();
    await carregarJogadores();
    mostrarStatus("Jogador cadastrado.", "ok");
  });
});

document.getElementById("form-raid").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const form = evento.target;
  const dataLocal = form.data.value;
  const raid = {
    id: form.id.value.trim(),
    nome: form.nome.value.trim(),
    data: dataLocal ? new Date(dataLocal).toISOString() : "",
    limiteTank: Number(form.limiteTank.value),
    limiteHealer: Number(form.limiteHealer.value),
    limiteDps: Number(form.limiteDps.value),
  };
  comErro(async () => {
    await api.criarRaid(raid);
    form.reset();
    await carregarRaids();
    mostrarStatus("Raid criada.", "ok");
  });
});

el.listaRaids.addEventListener("click", (evento) => {
  const id = evento.target.dataset.abrir;
  if (!id) {
    return;
  }
  comErro(() => abrirRaid(id));
});

document.getElementById("form-inscricao").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const jogadorId = evento.target.jogadorId.value;
  const raidId = estado.raid?.id;
  if (!raidId) {
    return;
  }
  comErro(async () => {
    const resultado = await api.inscrever(raidId, jogadorId);
    await abrirRaid(raidId);
    mostrarStatus(`Inscrição: ${resultado?.status ?? "ok"}.`, "ok");
  });
});

el.painelRaid.addEventListener("click", (evento) => {
  const remover = evento.target.dataset.remover;
  const distribuir = evento.target.dataset.distribuir;
  const raidId = evento.target.dataset.raid ?? estado.raid?.id;

  if (remover && raidId) {
    comErro(async () => {
      await api.removerInscricao(raidId, remover);
      await abrirRaid(raidId);
      mostrarStatus("Inscrição removida.", "ok");
    });
  }

  if (distribuir && raidId) {
    comErro(async () => {
      const resultado = await api.distribuirLoot(raidId, distribuir);
      await abrirRaid(raidId);
      mostrarStatus(`Loot para ${resultado?.ganhadorId ?? "ganhador definido"}.`, "ok");
    });
  }
});

document.getElementById("form-presenca").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const raidId = estado.raid?.id;
  if (!raidId) {
    return;
  }
  const jogadorIds = [...evento.target.querySelectorAll("input[name=presente]:checked")].map(
    (input) => input.value,
  );
  comErro(async () => {
    await api.registrarPresenca(raidId, jogadorIds);
    await abrirRaid(raidId);
    mostrarStatus("Presença registrada.", "ok");
  });
});

document.getElementById("form-loot").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const raidId = estado.raid?.id;
  if (!raidId) {
    return;
  }
  const form = evento.target;
  const item = {
    id: form.id.value.trim(),
    nome: form.nome.value.trim(),
    categoria: form.categoria.value,
    funcaoRequerida: form.funcaoRequerida.value,
  };
  comErro(async () => {
    await api.registrarLoot(raidId, item);
    form.reset();
    await abrirRaid(raidId);
    mostrarStatus("Item registrado.", "ok");
  });
});

document.getElementById("form-historico").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const jogadorId = evento.target.jogadorId.value.trim();
  comErro(async () => {
    const dados = await api.obterHistorico(jogadorId);
    el.historico.textContent = JSON.stringify(dados, null, 2);
    mostrarStatus("Histórico carregado.", "ok");
  });
});

recarregarTudo();
