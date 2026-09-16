# plp-n1

Sistema de gerenciamento de guildas e raids (Paradigmas de Programação, SENAI FATESG).

O mesmo núcleo (RF01–RF09, RN01–RN09) existe em dois paradigmas:

- **C#** — programação orientada a objetos (`http://localhost:5000`)
- **Erlang** — programação funcional e concorrente (`http://localhost:8080`)

O front em `http://localhost:5500` fala com um ou com o outro. A regra de vaga, fila e loot **não** fica no JavaScript.

## Equipe

| Parte | Pessoas |
| --- | --- |
| C# | Gabriella Pio, Eduarda Corazza |
| Erlang | Caio de Paula, Luiz Gustavo Rocha |
| Grupo | Caio de Paula, Eduarda Corazza, Gabriella Pio, Luiz Gustavo Rocha |

## Estrutura

```
csharp/                    # Domain (POO) + Minimal API
erlang/                    # rebar3 (em implementação)
frontend/                  # HTML/CSS/JS compartilhado
contrato-api.md            # mesmos endpoints/JSON nos dois backends
exemplo-desenvolvimento.md # roteiro Naxxramas (curl / testes)
```

## Como executar

Três terminais. A API C# precisa estar no ar antes de escolher C# no seletor do front.

**1. C#**

```bash
cd csharp
dotnet restore
dotnet build
dotnet test
dotnet run --project src/GuildRaidManager.Api
```

Sobe em `http://localhost:5000`. `http://localhost:5000` no navegador não tem página HTML — use `http://localhost:5000/jogadores` (lista JSON) ou o front.

`Ctrl+C` encerra. Se a porta estiver ocupada: `fuser -k 5000/tcp`.

**2. Frontend**

```bash
cd frontend
python3 -m http.server 5500
```

Abra `http://localhost:5500`. Seletor: **Mock** (só a tela), **C#** (`:5000`) ou **Erlang** (`:8080`).

**3. Erlang**

```bash
cd erlang
rebar3 compile
rebar3 shell
```

A API HTTP Erlang (`:8080`) ainda não está pronta. Detalhes: [erlang/README.md](erlang/README.md).

Roteiro de teste (cadastro → fila → loot): [exemplo-desenvolvimento.md](exemplo-desenvolvimento.md).
READMEs: [csharp/README.md](csharp/README.md), [frontend/README.md](frontend/README.md), [contrato-api.md](contrato-api.md).
