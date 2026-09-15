-module(handler_loot).

-export([init/2]).

init(Req, State) ->
    Method = cowboy_req:method(Req),
    ReqFinal = handle_request(Method, Req),
    {ok, ReqFinal, State}.

%%% ===================================================================
%%% Tratamento por Metodo HTTP
%%% ===================================================================

%% 1. Preflight do CORS
handle_request(<<"OPTIONS">>, Req) ->
    cowboy_req:reply(204, api_util:cors_headers(), Req);

%% 2. Roteamento interno dos POSTs
handle_request(<<"POST">>, Req) ->
    %% Pegamos a URL para saber qual dos 3 endpoints de loot/presenca foi chamado
    Path = cowboy_req:path(Req),

    %% Identifica qual rota foi chamada usando Pattern Matching com binary:match
    case {binary:match(Path, <<"/presenca">>), binary:match(Path, <<"/distribuir">>)} of
        
        %% Caso 1: Termina com /presenca
        {{_, _}, nomatch} ->
            processar_presenca(Req);

        %% Caso 2: Termina com /distribuir
        {nomatch, {_, _}} ->
            processar_distribuir(Req);

        %% Caso 3: Nao eh presenca nem distribuir, entao eh o POST base /loots
        {nomatch, nomatch} ->
            processar_criar_loot(Req)
    end;

%% 3. Outros Metodos Nao Suportados
handle_request(_, Req) ->
    api_util:reply_error(Req, 405, <<"metodo_nao_permitido">>, <<"Método HTTP não suportado nesta rota.">>).

%%% ===================================================================
%%% Controladores Especificos
%%% ===================================================================

%% @doc Processa POST /raids/{id}/presenca
processar_presenca(Req) ->
    case api_util:parse_body(Req) of
        {ok, Map, Req2} ->
            %% O contrato define o envio de um array de IDs: { "jogadorIds": ["j1", "j2"] }
            JogadorIds = maps:get(<<"jogadorIds">>, Map, []),
            
            %% TODO Futuro: 
            %% RaidId = cowboy_req:binding(id, Req),
            %% Pid ! {registrar_presenca, JogadorIds, self()}
            
            api_util:reply_json(Req2, 200, #{
                <<"mensagem">> => <<"Presença registrada com sucesso.">>,
                <<"total">> => length(JogadorIds)
            });
            
        {error, invalid_json, Req2} ->
            api_util:reply_error(Req2, 400, <<"json_invalido">>, <<"O formato enviado não é um JSON válido.">>)
    end.

%% @doc Processa POST /raids/{id}/loots
processar_criar_loot(Req) ->
    case api_util:parse_body(Req) of
        {ok, Map, Req2} ->
            %% Extrai as chaves camelCase conforme o contrato
            IdBin = maps:get(<<"id">>, Map, <<"">>),
            NomeBin = maps:get(<<"nome">>, Map, <<"">>),
            CategoriaBin = maps:get(<<"categoria">>, Map, <<"">>),
            FuncaoReqBin = maps:get(<<"funcaoRequerida">>, Map, <<"">>),
            
            %% TODO Futuro: 
            %% RaidId = cowboy_req:binding(id, Req),
            %% Pid ! {cadastrar_loot, ItemRecord, self()}
            
            %% Retorna o mesmo objeto para confirmar a criacao (201 Created)
            api_util:reply_json(Req2, 201, #{
                <<"id">> => IdBin,
                <<"nome">> => NomeBin,
                <<"categoria">> => CategoriaBin,
                <<"funcaoRequerida">> => FuncaoReqBin
            });
            
        {error, invalid_json, Req2} ->
            api_util:reply_error(Req2, 400, <<"json_invalido">>, <<"O formato enviado não é um JSON válido.">>)
    end.

%% @doc Processa POST /raids/{id}/loots/{itemId}/distribuir
processar_distribuir(Req) ->
    %% O itemId vem da propria URL definida no roteador
    ItemId = cowboy_req:binding(itemId, Req),
    
    case ItemId of
        undefined ->
            api_util:reply_error(Req, 400, <<"falta_id_item">>, <<"O ID do item é obrigatório na URL.">>);
        _ ->
            %% TODO Futuro: 
            %% RaidId = cowboy_req:binding(id, Req),
            %% Pid ! {distribuir_loot, ItemId, self()}
            
            %% Mock: Simulando que o Erlang aplicou as regras de desempate e escolheu um ganhador
            GanhadorMock = #{
                <<"id">> => <<"j1">>,
                <<"nome">> => <<"Aria">>
            },
            
            api_util:reply_json(Req, 200, #{
                <<"mensagem">> => <<"Loot distribuído com sucesso.">>,
                <<"ganhador">> => GanhadorMock
            })
    end.