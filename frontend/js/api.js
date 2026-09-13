const backends = {
  csharp: "http://localhost:5000",
  erlang: "http://localhost:8080",
};

function backendAtual() {
  return document.getElementById("backend")?.value ?? "mock";
}

function apiBase() {
  if (backendAtual() === "mock") {
    return "mock (só a tela — não é C# nem Erlang)";
  }
  return backends[backendAtual()];
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${apiBase()}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
  } catch {
    throw new Error(`Não conectou em ${apiBase()}. A API ainda não está no ar.`);
  }

  const texto = await response.text();
  let body = null;
  if (texto) {
    try {
      body = JSON.parse(texto);
    } catch {
      body = texto;
    }
  }

  if (!response.ok) {
    const mensagem =
      (body && body.mensagem) || (typeof body === "string" && body) || `HTTP ${response.status}`;
    throw new Error(mensagem);
  }

  return body;
}

function chamar(nome, ...args) {
  if (backendAtual() === "mock") {
    return Promise.resolve().then(() => mockApi[nome](...args));
  }
  return null;
}

const api = {
  listarJogadores: () => chamar("listarJogadores") ?? request("/jogadores"),
  cadastrarJogador: (jogador) =>
    chamar("cadastrarJogador", jogador) ??
    request("/jogadores", { method: "POST", body: JSON.stringify(jogador) }),
  obterHistorico: (id) =>
    chamar("obterHistorico", id) ?? request(`/jogadores/${id}/historico`),

  listarRaids: () => chamar("listarRaids") ?? request("/raids"),
  criarRaid: (raid) =>
    chamar("criarRaid", raid) ??
    request("/raids", { method: "POST", body: JSON.stringify(raid) }),
  obterRaid: (id) => chamar("obterRaid", id) ?? request(`/raids/${id}`),

  inscrever: (raidId, jogadorId) =>
    chamar("inscrever", raidId, jogadorId) ??
    request(`/raids/${raidId}/inscricoes`, {
      method: "POST",
      body: JSON.stringify({ jogadorId }),
    }),
  removerInscricao: (raidId, jogadorId) =>
    chamar("removerInscricao", raidId, jogadorId) ??
    request(`/raids/${raidId}/inscricoes/${jogadorId}`, { method: "DELETE" }),

  registrarPresenca: (raidId, jogadorIds) =>
    chamar("registrarPresenca", raidId, jogadorIds) ??
    request(`/raids/${raidId}/presenca`, {
      method: "POST",
      body: JSON.stringify({ jogadorIds }),
    }),

  registrarLoot: (raidId, item) =>
    chamar("registrarLoot", raidId, item) ??
    request(`/raids/${raidId}/loots`, { method: "POST", body: JSON.stringify(item) }),
  distribuirLoot: (raidId, itemId) =>
    chamar("distribuirLoot", raidId, itemId) ??
    request(`/raids/${raidId}/loots/${itemId}/distribuir`, { method: "POST" }),
};
