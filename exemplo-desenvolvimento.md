# Exemplo para seguir no desenvolvimento

Roteiro único para **C#**, **Erlang** e o **front**. Os dois backends devem produzir o mesmo resultado com estes dados. Caminhos e JSON: [contrato-api.md](contrato-api.md).

Troque só a base:

```bash
# C#
export BASE=http://localhost:5000

# Erlang
export BASE=http://localhost:8080
```

Enquanto a API HTTP não existir, use o mesmo roteiro nos testes de domínio (C#: xUnit; Erlang: funções puras / `raid_server`). O JSON abaixo é o alvo quando a camada HTTP estiver pronta.

---

## Massa de dados

Raid `10` — **1 tank, 1 healer, 1 DPS** (limites pequenos de propósito, para a fila aparecer). Id de jogador e de raid: só números, até 4 dígitos.

| id | nome | classe | funcao |
| --- | --- | --- | --- |
| `1` | Aria | guerreiro | `tank` |
| `2` | Breno | paladino | `tank` |
| `3` | Cora | sacerdote | `healer` |
| `4` | Davi | mago | `dps` |
| `5` | Eva | ladino | `dps` |

`5` entra depois que a vaga de DPS já está ocupada → **fila**. `2` também vai para a fila.

---

## Passo a passo

### 1. Cadastrar jogadores (RF01)

```bash
curl -s -X POST $BASE/jogadores \
  -H 'Content-Type: application/json' \
  -d '{"id":"1","nome":"Aria","classe":"guerreiro","funcao":"tank"}'
```

Repetir para `2`, `3`, `4`, `5`.

Esperado: `201` e o jogador ecoado. Nome vazio → `400`.

### 2. Criar a raid (RF02)

```bash
curl -s -X POST $BASE/raids \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "10",
    "nome": "Naxxramas",
    "data": "2026-09-20T21:00:00",
    "limiteTank": 1,
    "limiteHealer": 1,
    "limiteDps": 1
  }'
```

Esperado: `201`. Limite negativo → `400`.

### 3. Inscrever (RF03, RN01–RN04)

```bash
curl -s -X POST $BASE/raids/10/inscricoes \
  -H 'Content-Type: application/json' \
  -d '{"jogadorId":"1"}'
```

| Ordem | jogadorId | Esperado |
| --- | --- | --- |
| 1 | `1` | `confirmado` |
| 2 | `3` | `confirmado` |
| 3 | `4` | `confirmado` |
| 4 | `5` | `lista_espera` (vaga de DPS cheia) |
| 5 | `2` | `lista_espera` |
| 6 | `1` de novo | `400` `ja_inscrito` |

Resposta de confirmação:

```json
{
  "jogadorId": "1",
  "status": "confirmado"
}
```

Resposta de fila:

```json
{
  "jogadorId": "5",
  "status": "lista_espera"
}
```

Tank **não** ocupa vaga de healer: a função vem do cadastro do jogador, não do request.

### 4. Remover e promover (RF04)

```bash
curl -s -X DELETE $BASE/raids/10/inscricoes/1
```

Esperado: `1` sai dos confirmados; `2` (primeiro tank da fila) vira `confirmado`. A fila de DPS **não** muda.

`GET $BASE/raids/10` depois disso:

- confirmados: `3`, `4`, `2`
- fila: `5`

### 5. Presença (RF06, RN05)

```bash
curl -s -X POST $BASE/raids/10/presenca \
  -H 'Content-Type: application/json' \
  -d '{"jogadorIds":["2","3","4","5"]}'
```

Esperado: participantes efetivos = `2`, `3`, `4`.  
`5` estava só na fila → **não** participa, mesmo tendo sido enviado na lista.

### 6. Loot (RF07, RF08, RN06–RN08)

Cadastrar o item (cenário do documento da N1 — Espada Lendária exige DPS):

```bash
curl -s -X POST $BASE/raids/10/loots \
  -H 'Content-Type: application/json' \
  -d '{"id":"i1","nome":"Espada Lendária","categoria":"arma","funcaoRequerida":"dps"}'
```

Distribuir:

```bash
curl -s -X POST $BASE/raids/10/loots/i1/distribuir
```

Elegíveis: só quem **participou** e é **dps** → `4`.  
`2` participou mas a função não bate. `5` é DPS mas não participou.

```json
{
  "id": "i1",
  "ganhadorId": "4"
}
```

Se no futuro houver dois DPS presentes, ganha quem tem **menos** itens no histórico.

### 7. Histórico (RF09)

```bash
curl -s $BASE/jogadores/4/historico
```

Esperado (formato ilustrativo — os dois backends devem trazer o mesmo conteúdo):

```json
{
  "jogadorId": "4",
  "quantidadeParticipacoes": 1,
  "raids": ["Naxxramas"],
  "itensRecebidos": [{ "id": "i1", "nome": "Espada Lendária" }],
  "situacaoNasRaids": [{ "raid": "Naxxramas", "status": "participou" }]
}
```

`GET $BASE/jogadores/5/historico` → zero participações, nenhum loot, situação `lista_espera`.

---

## O que cada lado faz neste roteiro

| Passo | C# (POO) | Erlang | Front |
| --- | --- | --- | --- |
| 1–2 | classes `Jogador`, `Raid` + menu/API | `modulo_jogador` + spawn do `raid_server` | cadastro / criar raid |
| 3 | `InscreverJogador` | `{inscrever, Jogador, From}` | botão inscrever |
| 4 | `RemoverJogador` + promover fila | `{remover, Id, From}` | cancelar inscrição |
| 5–7 | presença + `ServicoDistribuicaoLoot` | `{registrar_presenca}` / `{distribuir_loot}` | telas de loot e histórico |

Não coloque este roteiro no JavaScript como “regra”. O JS só dispara os `fetch` de `frontend/js/api.js`.

## Conferência rápida (os dois iguais)

- [ ] Tank com vaga confirma
- [ ] DPS extra vai para a fila
- [ ] Inscrição duplicada retorna `ja_inscrito`
- [ ] Remover tank promove o tank da fila, não o DPS
- [ ] Quem está na fila não entra em participantes
- [ ] Item de DPS não vai para tank
- [ ] Histórico do ganhador mostra a raid e o item

Se C# e Erlang divergirem em qualquer item, o núcleo da N1 (RNF04) ainda não está equivalente.
