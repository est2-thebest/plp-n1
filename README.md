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
csharp/    # solução .NET (Domain + console)
erlang/    # aplicação rebar3
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

Detalhes de cada lado: [csharp/README.md](csharp/README.md) e [erlang/README.md](erlang/README.md).
