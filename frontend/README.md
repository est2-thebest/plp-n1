# Frontend

Interface web compartilhada. Fala com a API em **C#** (`localhost:5000`) ou **Erlang** (`localhost:8080`). Vaga, fila e loot ficam no backend, não no JS.

HTML, CSS e JS estáticos. Sem framework.

## Como abrir

```bash
cd frontend
python3 -m http.server 5500
```

Abra http://localhost:5500

Para usar o C#, a API precisa estar rodando (`dotnet run --project src/GuildRaidManager.Api` em `csharp/`). No seletor do topo escolha **C# · localhost:5000**. O banner deve dizer `Conectado em http://localhost:5000`.

A API não serve HTML: `http://localhost:5000` sozinho dá 404. A tela é esta, na porta 5500.

## Seletor de backend

| Opção | O que faz |
| --- | --- |
| Mock · demo da tela | Dados locais em `js/mock.js` (Aria, Breno…). Serve para ver a UI. **Não** testa C# nem Erlang. Id de jogador e de raid: só números, até 4 dígitos. |
| C# · localhost:5000 | `fetch` na Minimal API. A guilda começa vazia — cadastre jogadores pela tela. |
| Erlang · localhost:8080 | Mesmo contrato HTTP, quando a API Erlang existir. |

## Estrutura

```
js/mock.js        # demo da tela (não é backend)
js/api.js         # fetch C# / Erlang / mock
js/ui.js          # listas, filtros, histórico
js/modais.js      # cadastro e detalhe da raid
js/navegacao.js   # abas Jogadores e Raids
js/app.js         # liga formulários e API
```

Listas nas abas. Cadastro, histórico e detalhe da raid abrem em modal.

Contrato (caminhos, JSON, CORS): [`../contrato-api.md`](../contrato-api.md). Roteiro: [`../exemplo-desenvolvimento.md`](../exemplo-desenvolvimento.md).
