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
dotnet run --project src/GuildRaidManager.Api
```

A API sobe em `http://localhost:5000`, com CORS para o front em `http://localhost:5500`. O contrato HTTP está em [`../contrato-api.md`](../contrato-api.md).

O console em `src/GuildRaidManager.App` ainda é um esqueleto; o núcleo da N1 está no domínio + API.

## Estrutura

```
src/GuildRaidManager.Domain   # POO: Jogador, Raid, Guilda, ServicoDistribuicaoLoot
src/GuildRaidManager.Api      # Minimal API HTTP (contrato compartilhado)
src/GuildRaidManager.App      # aplicativo console (esqueleto)
tests/                        # testes xUnit do domínio
```
