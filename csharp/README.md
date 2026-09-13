# Guild Raid Manager — C#

Solução em **C# (POO)** da N1 de Paradigmas de Programação (SENAI FATESG).

## Equipe (C#)

- Gabriella Pio
- Eduarda Corazza

## Pré-requisitos

- [.NET SDK 8](https://dotnet.microsoft.com/download/dotnet/8.0) ou superior

```bash
dotnet --version
```

## Como executar

Na pasta `csharp/`:

```bash
dotnet restore
dotnet build
dotnet test
dotnet run --project src/GuildRaidManager.App
```

## Estrutura

```
src/GuildRaidManager.Domain   # biblioteca de domínio
src/GuildRaidManager.App      # aplicativo console
tests/                        # testes xUnit
```
