# Guild Raid Manager — Erlang

Solução em **Erlang** (funcional + concorrente) da N1 de Paradigmas de Programação (SENAI FATESG).

## Equipe (Erlang)

- Caio de Paula
- Luiz Gustavo Rocha

## Pré-requisitos

- [Erlang/OTP](https://www.erlang.org/downloads)
- [rebar3](https://rebar3.org/)

```bash
erl -eval 'erlang:display(erlang:system_info(otp_release)), halt().' -noshell
rebar3 --version
```

## Como executar

Na pasta `erlang/`:

```bash
rebar3 compile
rebar3 shell
```

No shell:

```erlang
guild_raid:hello().
```

## Estrutura prevista

```
include/raid_records.hrl   # records (#jogador{}, #estado_raid{}, #item_loot{}, #inscricao{})
src/modulo_jogador.erl     # criação e validação do jogador (RF01, RF09)
src/regras_raid.erl        # funções puras de inscrição, fila, presença e loot
src/raid_server.erl        # processo da raid (mailbox / modelo de atores)
```

Os módulos de regra e servidor ainda não estão implementados — este diretório é o ponto de partida da dupla Erlang.
