document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("input", (evento) => {
    const campo = evento.target.closest(".field");
    if (!campo) {
      return;
    }
    campo.classList.remove("field--invalido");
    const aviso = campo.querySelector(".field__error");
    if (aviso) {
      aviso.textContent = "";
    }
  });
});

async function carregarJogadores() {
  const dados = await api.listarJogadores();
  estado.jogadores = Array.isArray(dados) ? dados : dados?.jogadores ?? [];
  renderJogadores();
  renderInscricaoOptions();
}

async function carregarRaids() {
  const dados = await api.listarRaids();
  estado.raids = Array.isArray(dados) ? dados : dados?.raids ?? [];
  renderFiltroRaids();
  renderRaids();
  renderJogadores();
}

async function entrarNaRaid(id) {
  estado.raid = await api.obterRaid(id);
  renderRaid();
  abrirModal("detalhe-raid");
}

async function recarregarTudo() {
  if (backendAtual() === "mock") {
    mock.reset();
  }

  const raidAberta = modalAberto("detalhe-raid") ? estado.raid?.id : null;

  await comErro(async () => {
    await carregarJogadores();
    await carregarRaids();
    irPara(estado.pagina);
    if (raidAberta) {
      await entrarNaRaid(raidAberta);
    }
    mostrarStatus(`Conectado em ${apiBase()}.`, "ok");
  });

  if (el.status.classList.contains("banner--erro")) {
    estado.jogadores = [];
    estado.raids = [];
    estado.raid = null;
    fecharTodosOsModais();
    renderFiltroRaids();
    renderJogadores();
    renderRaids();
    irPara("jogadores");
  }
}

document.getElementById("backend").addEventListener("change", () => {
  estado.raid = null;
  estado.pagina = "jogadores";
  fecharTodosOsModais();
  recarregarTudo();
});

document.getElementById("filtro-jogador-busca").addEventListener("input", (evento) => {
  estado.filtros.jogadorBusca = evento.target.value;
  renderJogadores();
});

document.getElementById("filtro-jogador-funcao").addEventListener("change", (evento) => {
  estado.filtros.jogadorFuncao = evento.target.value;
  renderJogadores();
});

document.getElementById("filtro-jogador-raid").addEventListener("change", (evento) => {
  estado.filtros.jogadorRaid = evento.target.value;
  renderJogadores();
});

document.getElementById("filtro-raid-busca").addEventListener("input", (evento) => {
  estado.filtros.raidBusca = evento.target.value;
  renderRaids();
});

document.getElementById("limpar-filtros-jogador").addEventListener("click", () => {
  estado.filtros.jogadorBusca = "";
  estado.filtros.jogadorFuncao = "";
  estado.filtros.jogadorRaid = "";
  document.getElementById("filtro-jogador-busca").value = "";
  document.getElementById("filtro-jogador-funcao").value = "";
  document.getElementById("filtro-jogador-raid").value = "";
  renderJogadores();
});

document.getElementById("limpar-filtros-raid").addEventListener("click", () => {
  estado.filtros.raidBusca = "";
  document.getElementById("filtro-raid-busca").value = "";
  renderRaids();
});

document.getElementById("form-jogador").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const form = evento.target;
  if (!formularioValido(form)) {
    return;
  }
  const jogador = {
    id: form.id.value.trim(),
    nome: form.nome.value.trim(),
    classe: form.classe.value,
    funcao: form.funcao.value,
  };
  comErro(async () => {
    await api.cadastrarJogador(jogador);
    form.reset();
    limparErros(form);
    await carregarJogadores();
    fecharModal("jogador");
    mostrarStatus("Jogador cadastrado.", "ok");
  });
});

document.getElementById("form-raid").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const form = evento.target;
  if (!formularioValido(form)) {
    return;
  }
  const raid = {
    id: form.id.value.trim(),
    nome: form.nome.value.trim(),
    data: form.data.value ? `${form.data.value}T21:00:00` : "",
    limiteTank: Number(form.limiteTank.value),
    limiteHealer: Number(form.limiteHealer.value),
    limiteDps: Number(form.limiteDps.value),
  };
  comErro(async () => {
    await api.criarRaid(raid);
    form.reset();
    limparErros(form);
    await carregarRaids();
    fecharModal("raid");
    mostrarStatus("Raid criada.", "ok");
  });
});

el.listaJogadores.addEventListener("click", (evento) => {
  const id = evento.target.dataset.historico;
  if (!id) {
    return;
  }
  comErro(async () => {
    const dados = await api.obterHistorico(id);
    const jogador = estado.jogadores.find((item) => item.id === id);
    renderHistorico(dados, jogador);
    abrirModal("historico");
    mostrarStatus("Histórico carregado.", "ok");
  });
});

el.listaRaids.addEventListener("click", (evento) => {
  const id = evento.target.dataset.entrar;
  if (!id) {
    return;
  }
  comErro(() => entrarNaRaid(id));
});

document.getElementById("form-inscricao").addEventListener("submit", (evento) => {
  evento.preventDefault();
  if (!formularioValido(evento.target)) {
    return;
  }
  const jogadorId = evento.target.jogadorId.value;
  const raidId = estado.raid?.id;
  if (!raidId) {
    return;
  }
  comErro(async () => {
    const resultado = await api.inscrever(raidId, jogadorId);
    await carregarRaids();
    await entrarNaRaid(raidId);
    mostrarStatus(`Inscrição: ${resultado?.status ?? "ok"}.`, "ok");
  });
});

document.getElementById("modal-detalhe-raid").addEventListener("click", (evento) => {
  const remover = evento.target.dataset.remover;
  const distribuir = evento.target.dataset.distribuir;
  const raidId = evento.target.dataset.raid ?? estado.raid?.id;

  if (remover && raidId) {
    comErro(async () => {
      await api.removerInscricao(raidId, remover);
      await carregarRaids();
      await entrarNaRaid(raidId);
      mostrarStatus("Inscrição removida.", "ok");
    });
  }

  if (distribuir && raidId) {
    comErro(async () => {
      const resultado = await api.distribuirLoot(raidId, distribuir);
      await entrarNaRaid(raidId);
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
    await entrarNaRaid(raidId);
    mostrarStatus("Presença registrada.", "ok");
  });
});

document.getElementById("form-loot").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const form = evento.target;
  if (!formularioValido(form)) {
    return;
  }
  const raidId = estado.raid?.id;
  if (!raidId) {
    return;
  }
  const item = {
    id: form.id.value.trim(),
    nome: form.nome.value.trim(),
    categoria: form.categoria.value,
    funcaoRequerida: form.funcaoRequerida.value,
  };
  comErro(async () => {
    await api.registrarLoot(raidId, item);
    form.reset();
    limparErros(form);
    await entrarNaRaid(raidId);
    mostrarStatus("Item registrado.", "ok");
  });
});

document.getElementById("modal-detalhe-raid").addEventListener("close", () => {
  estado.raid = null;
});

recarregarTudo();
