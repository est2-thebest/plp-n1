-module(db_ets).

%% Exportando todas as funcoes
-export([
    %% Jogadores
    salvar_jogador/2, buscar_jogador/1, listar_jogadores/0,
    
    %% Raids
    salvar_raid/2, buscar_raid/1, listar_raids/0,
    
    %% Inscricoes
    salvar_inscricao/3, remover_inscricao/2, buscar_inscricoes_raid/1,
    
    %% Loots
    salvar_loot/3, buscar_loots_raid/1
]).

%%% ===================================================================
%%% 1. JOGADORES
%%% ===================================================================

salvar_jogador(IdBin, DadosMap) ->
    case ets:lookup(tb_jogadores, IdBin) of
        [] -> 
            ets:insert(tb_jogadores, {IdBin, DadosMap}),
            {ok, DadosMap};
        [_JaExiste] -> 
            {error, duplicado}
    end.

buscar_jogador(IdBin) ->
    case ets:lookup(tb_jogadores, IdBin) of
        [{IdBin, DadosMap}] -> {ok, DadosMap};
        [] -> {error, nao_encontrado}
    end.

listar_jogadores() ->
    [DadosMap || {_Id, DadosMap} <- ets:tab2list(tb_jogadores)].


%%% ===================================================================
%%% 2. RAIDS
%%% ===================================================================

salvar_raid(IdBin, DadosMap) ->
    case ets:lookup(tb_raids, IdBin) of
        [] -> 
            ets:insert(tb_raids, {IdBin, DadosMap}),
            {ok, DadosMap};
        [_JaExiste] -> 
            {error, duplicado}
    end.

buscar_raid(IdBin) ->
    case ets:lookup(tb_raids, IdBin) of
        [{IdBin, DadosMap}] -> {ok, DadosMap};
        [] -> {error, nao_encontrado}
    end.

listar_raids() ->
    [DadosMap || {_Id, DadosMap} <- ets:tab2list(tb_raids)].


%%% ===================================================================
%%% 3. INSCRICOES
%%% ===================================================================

%% @doc Salva usando Chave Composta {RaidId, JogadorId}
salvar_inscricao(RaidId, JogadorId, Status) ->
    Chave = {RaidId, JogadorId},
    case ets:lookup(tb_inscricoes, Chave) of
        [] -> 
            DadosMap = #{
                <<"raidId">> => RaidId, 
                <<"jogadorId">> => JogadorId, 
                <<"status">> => Status
            },
            ets:insert(tb_inscricoes, {Chave, DadosMap}),
            {ok, DadosMap};
        [_JaExiste] -> 
            {error, duplicado}
    end.

%% @doc Remove uma inscricao e retorna 'ok'
remover_inscricao(RaidId, JogadorId) ->
    Chave = {RaidId, JogadorId},
    ets:delete(tb_inscricoes, Chave),
    ok.

%% @doc Busca todas as inscricoes de uma Raid usando Pattern Matching (Filtro)
buscar_inscricoes_raid(RaidId) ->
    %% O '_' (underline) significa "qualquer valor". 
    %% Funciona como: SELECT * FROM tb_inscricoes WHERE raidId = RaidId
    Padrao = {{RaidId, '_'}, '_'},
    Objetos = ets:match_object(tb_inscricoes, Padrao),
    [DadosMap || {_Chave, DadosMap} <- Objetos].


%%% ===================================================================
%%% 4. LOOTS
%%% ===================================================================

%% @doc Salva o item vinculando ele diretamente a uma Raid {RaidId, ItemId}
salvar_loot(RaidId, ItemId, DadosMap) ->
    Chave = {RaidId, ItemId},
    case ets:lookup(tb_loots, Chave) of
        [] ->
            ets:insert(tb_loots, {Chave, DadosMap}),
            {ok, DadosMap};
        [_JaExiste] ->
            {error, duplicado}
    end.

%% @doc Busca todos os itens cadastrados em uma Raid especifica
buscar_loots_raid(RaidId) ->
    Padrao = {{RaidId, '_'}, '_'},
    Objetos = ets:match_object(tb_loots, Padrao),
    [DadosMap || {_Chave, DadosMap} <- Objetos].