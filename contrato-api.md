# Contrato da API (C# e Erlang)

O frontend fala **só por HTTP + JSON**. C# e Erlang expõem **os mesmos caminhos e o mesmo formato**. A regra de negócio (vaga, fila, loot) fica em cada backend, não no JS.

A API C# já está neste contrato (`csharp/src/GuildRaidManager.Api`). A HTTP Erlang ainda não. Roteiro com JSON de exemplo: [exemplo-desenvolvimento.md](exemplo-desenvolvimento.md).

## URLs

| Backend | Base | Quem sobe |
| --- | --- | --- |
| C# | `http://localhost:5000` | `dotnet run --project src/GuildRaidManager.Api` em `csharp/` |
| Erlang | `http://localhost:8080` | HTTP na frente do `raid_server` (ainda não criado) |
| Front | `http://localhost:5500` | `python3 -m http.server 5500` em `frontend/` |

Os dois backends precisam liberar CORS para `http://localhost:5500` (browser bloqueia senão).

JSON em UTF-8. Id de **jogador** e de **raid**: somente números, 1 a 4 dígitos (`1`, `10`, `9999`). Enums **sempre em minúsculo** no JSON, nos dois lados:

- função: `tank` | `healer` | `dps`
- status: `confirmado` | `lista_espera` | `cancelado`
- categoria de item: `armadura` | `arma` | `acessorio`

Erro padrão:

```json
{ "erro": "ja_inscrito", "mensagem": "O jogador já está inscrito nesta raid." }
```

Códigos: `200` ok, `201` criado, `400` regra de negócio / validação, `404` não encontrado.

## Endpoints

### Jogadores (RF01, RF09)

`POST /jogadores`

```json
{ "id": "1", "nome": "Aria", "classe": "guerreiro", "funcao": "tank" }
```

Resposta `201`: o jogador criado.

`GET /jogadores` — lista  
`GET /jogadores/{id}` — um jogador  
`GET /jogadores/{id}/historico` — raids participadas, quantidade, itens recebidos e `situacaoNasRaids` (`participou` / `confirmado` / `lista_espera`)

### Raids (RF02)

`POST /raids`

```json
{
  "id": "10",
  "nome": "Naxxramas",
  "data": "2026-09-20T21:00:00",
  "limiteTank": 2,
  "limiteHealer": 2,
  "limiteDps": 6
}
```

`GET /raids`  
`GET /raids/{id}` — inclui confirmados, fila, participantes e loots

### Inscrição e fila (RF03–RF05, RN01–RN04)

`POST /raids/{id}/inscricoes`

```json
{ "jogadorId": "1" }
```

Resposta: inscrição com `status` `confirmado` ou `lista_espera`.  
Se já inscrito: `400` com `erro: "ja_inscrito"`.

`DELETE /raids/{id}/inscricoes/{jogadorId}` — remove; se era confirmado, promove o próximo da **mesma função** na fila.

### Presença (RF06, RN05)

`POST /raids/{id}/presenca`

```json
{ "jogadorIds": ["1", "2"] }
```

Só confirmados viram participantes efetivos.

### Loot (RF07, RF08, RN06–RN08)

`POST /raids/{id}/loots`

```json
{ "id": "i1", "nome": "Espada Lendária", "categoria": "arma", "funcaoRequerida": "dps" }
```

`POST /raids/{id}/loots/{itemId}/distribuir` — escolhe o ganhador (participou + função compatível + menos loots).

## Ordem de implementação

1. Domínio (C#: classes; Erlang: `regras_raid` + `raid_server`) com as regras da N1.
2. Camada HTTP fina em **cada** backend, traduzindo JSON → domínio, no contrato deste arquivo.
3. Ligar o seletor do front (`frontend/js/app.js`): mesma tela, só muda `localhost:5000` vs `8080`.

Não copiar regra de vaga/fila/loot para o JavaScript. Se C# e Erlang divergirem no JSON, o front quebra e a comparação da N1 deixa de valer.

O `fetch` está em `frontend/js/api.js`. Com o seletor em C# e a API no ar, os caminhos deste arquivo já funcionam. Erlang ainda precisa da camada HTTP (`:8080`).

## Cabe nas duas linguagens?

Sim. Este contrato **não descreve o paradigma** — só o que entra e sai pela porta HTTP. O documento da N1 manda o mesmo núcleo (RF01–RF09, RN01–RN09); a diferença é *por dentro*.

| No JSON / HTTP | Em C# (POO) | Em Erlang (funcional + atores) |
| --- | --- | --- |
| `POST /raids/{id}/inscricoes` | `raid.InscreverJogador(jogador)` na instância mutável | `PidRaid ! {inscrever, Jogador, From}` e `loop(NovoEstado)` |
| `tank` / `healer` / `dps` | enum `Funcao` (serializar em minúsculo) | átomos `tank \| healer \| dps` |
| `id` da raid na URL | `Raid.Id` | chave para achar o **Pid** (o Pid **não** vai no JSON) |
| corpo da inscrição | altera `List` / `Queue` encapsuladas | `regras_raid:tentar_inscrever/2` devolve novo `#estado_raid{}` |
| várias inscrições ao mesmo tempo | pode precisar de `lock` nas coleções (limitação POO do PDF) | a mailbox do processo já serializa (RNF05) |

O que **não** pode vazar para o front:

- C#: tipo `DateTime`, `Guid`, nome de classe, `InvalidOperationException`
- Erlang: `Pid`, `-record`, tuplas `{ok, lista_espera, Estado}`

A borda HTTP traduz isso. Exemplo Erlang: Cowboy/`cowboy_req` lê o JSON, manda a mensagem ao `raid_server`, espera a resposta e devolve o JSON do contrato. As funções puras de `regras_raid.erl` nem sabem que existe HTTP.

`limiteTank` / `jogadorId` (camelCase) são o dialeto do JSON, igual no JS. No Erlang isso vira mapa/record na borda (`limite_tank`, `jogador_id`); no C#, propriedades `LimiteTank` com serialização camelCase. Nenhum dos dois é obrigado a usar camelCase *dentro* do domínio.

