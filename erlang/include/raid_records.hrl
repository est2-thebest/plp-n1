%% Tipos usados no sistema:
%% Funções: tank | healer | dps
%% Status: confirmado | lista_espera | cancelado

-record(jogador, {
    id :: string(),
    nome :: string(),
    classe :: string(),
    funcao :: tank | healer | dps,
    historico_raids = [] :: list(string()),
    historico_loots = [] :: list()
}).

-record(item_loot, {
    id :: string(),
    nome :: string(),
    funcao_requerida :: tank | healer | dps,
    ganhador_id = undefined :: string() | undefined
}).

-record(inscricao, {
    jogador :: #jogador{},
    timestamp :: integer(),
    status :: confirmado | lista_espera | cancelado
}).

-record(estado_raid, {
    id :: string(),
    nome :: string(),
    data :: string(),
    limites = #{} :: map(),
    confirmados = [] :: list(#inscricao{}),
    fila_espera = [] :: list(#inscricao{}),
    participantes_efetivos = [] :: list(#jogador{}),
    loots = [] :: list(#item_loot{})
}).
