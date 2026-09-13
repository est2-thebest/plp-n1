# plp-n1

Sistema de gerenciamento de guildas e raids (N1 — Paradigmas de Programação, SENAI FATESG).

O mesmo núcleo funcional é implementado em dois paradigmas:

- **C#** — programação orientada a objetos
- **Erlang** — programação funcional e concorrente (modelo de atores)

## Equipe

| Parte | Pessoas |
| --- | --- |
| C# | Gabriella Pio, Eduarda Corazza |
| Erlang | Caio de Paula, Luiz Gustavo Rocha |
| Grupo | Caio de Paula, Eduarda Corazza, Gabriella Pio, Luiz Gustavo Rocha |

## Estrutura

```
csharp/                    # solução .NET (Domain + console)
erlang/                    # aplicação rebar3
frontend/                  # HTML/CSS/JS compartilhado (C# ou Erlang)
contrato-api.md            # mesmos endpoints/JSON para os dois backends
exemplo-desenvolvimento.md # roteiro e JSON de exemplo para seguir
```

## C#

```bash
cd csharp
dotnet restore
dotnet build
dotnet run --project src/GuildRaidManager.App
```

## Erlang

```bash
cd erlang
rebar3 compile
rebar3 shell
```

## Frontend

```bash
cd frontend
python3 -m http.server 5500
```

Detalhes: [csharp/README.md](csharp/README.md), [erlang/README.md](erlang/README.md), [frontend/README.md](frontend/README.md), [contrato-api.md](contrato-api.md) e [exemplo-desenvolvimento.md](exemplo-desenvolvimento.md).
