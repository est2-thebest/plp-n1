function copiar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

function cenarioInicial() {
  const jogadores = [
    { id: "1", nome: "Aria", classe: "guerreiro", funcao: "tank" },
    { id: "2", nome: "Breno", classe: "paladino", funcao: "tank" },
    { id: "3", nome: "Cora", classe: "sacerdote", funcao: "healer" },
    { id: "4", nome: "Davi", classe: "mago", funcao: "dps" },
    { id: "5", nome: "Eva", classe: "ladino", funcao: "dps" },
  ];

  const raid = {
    id: "10",
    nome: "Naxxramas",
    data: "2026-09-20T21:00:00",
    limiteTank: 1,
    limiteHealer: 1,
    limiteDps: 1,
    confirmados: [
      { jogadorId: "1", status: "confirmado" },
      { jogadorId: "3", status: "confirmado" },
      { jogadorId: "4", status: "confirmado" },
    ],
    fila: [
      { jogadorId: "5", status: "lista_espera" },
      { jogadorId: "2", status: "lista_espera" },
    ],
    participantesEfetivos: [],
    loots: [],
  };

  return { jogadores, raids: [raid] };
}

const mock = {
  dados: cenarioInicial(),

  reset() {
    this.dados = cenarioInicial();
  },

  jogador(id) {
    return this.dados.jogadores.find((j) => j.id === id);
  },

  raid(id) {
    const raid = this.dados.raids.find((r) => r.id === id);
    if (!raid) {
      throw new Error("Raid não encontrada.");
    }
    return raid;
  },

  funcaoDe(jogadorId) {
    const jogador = this.jogador(jogadorId);
    if (!jogador) {
      throw new Error("Jogador não encontrado.");
    }
    return jogador.funcao;
  },

  limiteDe(raid, funcao) {
    if (funcao === "tank") {
      return raid.limiteTank;
    }
    if (funcao === "healer") {
      return raid.limiteHealer;
    }
    return raid.limiteDps;
  },

  ocupados(raid, funcao) {
    return raid.confirmados.filter((i) => this.funcaoDe(i.jogadorId) === funcao).length;
  },

  jaInscrito(raid, jogadorId) {
    return (
      raid.confirmados.some((i) => i.jogadorId === jogadorId) ||
      raid.fila.some((i) => i.jogadorId === jogadorId)
    );
  },
};

const mockApi = {
  listarJogadores: () => copiar(mock.dados.jogadores),

  cadastrarJogador(jogador) {
    if (!/^\d{1,4}$/.test(String(jogador.id ?? "").trim())) {
      throw new Error("Id deve ter somente números, no máximo 4 dígitos.");
    }
    if (!jogador.nome?.trim()) {
      throw new Error("Nome do jogador inválido.");
    }
    if (mock.jogador(jogador.id)) {
      throw new Error("Jogador já cadastrado.");
    }
    mock.dados.jogadores.push({ ...jogador });
    return copiar(jogador);
  },

  obterHistorico(id) {
    const jogador = mock.jogador(id);
    if (!jogador) {
      throw new Error("Jogador não encontrado.");
    }
    const participou = mock.dados.raids.filter((raid) =>
      raid.participantesEfetivos.includes(id),
    );
    const itensRecebidos = mock.dados.raids.flatMap((raid) =>
      raid.loots.filter((item) => item.ganhadorId === id),
    );
    const situacaoNasRaids = mock.dados.raids
      .map((raid) => {
        if (raid.participantesEfetivos.includes(id)) {
          return { raid: raid.nome, status: "participou" };
        }
        if (raid.confirmados.some((item) => item.jogadorId === id)) {
          return { raid: raid.nome, status: "confirmado" };
        }
        if (raid.fila.some((item) => item.jogadorId === id)) {
          return { raid: raid.nome, status: "lista_espera" };
        }
        return null;
      })
      .filter(Boolean);

    return {
      jogadorId: id,
      quantidadeParticipacoes: participou.length,
      raids: participou.map((raid) => raid.nome),
      itensRecebidos: itensRecebidos.map((item) => ({ id: item.id, nome: item.nome })),
      situacaoNasRaids,
    };
  },

  listarRaids: () => copiar(mock.dados.raids),
  obterRaid: (id) => copiar(mock.raid(id)),

  criarRaid(raid) {
    if (!/^\d{1,4}$/.test(String(raid.id ?? "").trim())) {
      throw new Error("Id deve ter somente números, no máximo 4 dígitos.");
    }
    if (mock.dados.raids.some((item) => item.id === raid.id)) {
      throw new Error("Raid já cadastrada.");
    }
    if (raid.limiteTank < 0 || raid.limiteHealer < 0 || raid.limiteDps < 0) {
      throw new Error("Limites de vagas não podem ser negativos.");
    }
    const nova = {
      ...raid,
      confirmados: [],
      fila: [],
      participantesEfetivos: [],
      loots: [],
    };
    mock.dados.raids.push(nova);
    return copiar(nova);
  },

  inscrever(raidId, jogadorId) {
    const raid = mock.raid(raidId);
    if (mock.jaInscrito(raid, jogadorId)) {
      throw new Error("O jogador já está inscrito nesta raid.");
    }
    const funcao = mock.funcaoDe(jogadorId);
    const status =
      mock.ocupados(raid, funcao) < mock.limiteDe(raid, funcao)
        ? "confirmado"
        : "lista_espera";
    const inscricao = { jogadorId, status };
    if (status === "confirmado") {
      raid.confirmados.push(inscricao);
    } else {
      raid.fila.push(inscricao);
    }
    return copiar(inscricao);
  },

  removerInscricao(raidId, jogadorId) {
    const raid = mock.raid(raidId);
    const confirmada = raid.confirmados.find((i) => i.jogadorId === jogadorId);
    if (confirmada) {
      const funcao = mock.funcaoDe(jogadorId);
      raid.confirmados = raid.confirmados.filter((i) => i.jogadorId !== jogadorId);
      const proximo = raid.fila.find((i) => mock.funcaoDe(i.jogadorId) === funcao);
      if (proximo) {
        raid.fila = raid.fila.filter((i) => i.jogadorId !== proximo.jogadorId);
        proximo.status = "confirmado";
        raid.confirmados.push(proximo);
      }
      return { ok: true };
    }

    raid.fila = raid.fila.filter((i) => i.jogadorId !== jogadorId);
    return { ok: true };
  },

  registrarPresenca(raidId, jogadorIds) {
    const raid = mock.raid(raidId);
    const confirmados = new Set(raid.confirmados.map((i) => i.jogadorId));
    raid.participantesEfetivos = jogadorIds.filter((id) => confirmados.has(id));
    return copiar(raid);
  },

  registrarLoot(raidId, item) {
    const raid = mock.raid(raidId);
    raid.loots.push({ ...item, ganhadorId: null });
    return copiar(item);
  },

  distribuirLoot(raidId, itemId) {
    const raid = mock.raid(raidId);
    const item = raid.loots.find((i) => i.id === itemId);
    if (!item) {
      throw new Error("Item não encontrado.");
    }
    const historico = (jogadorId) =>
      mock.dados.raids.flatMap((r) => r.loots).filter((l) => l.ganhadorId === jogadorId)
        .length;
    const elegiveis = raid.participantesEfetivos
      .filter((id) => mock.funcaoDe(id) === item.funcaoRequerida)
      .sort((a, b) => historico(a) - historico(b));
    if (elegiveis.length === 0) {
      throw new Error("Nenhum participante elegível encontrado para este item.");
    }
    item.ganhadorId = elegiveis[0];
    return copiar(item);
  },
};
