%% coding: utf-8
-module(handler_raids).

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

%% 2. Criar Raid (POST)
handle_request(<<"POST">>, Req) ->
    case api_util:parse_body(Req) of
        {ok, Map, Req2} ->
            IdBin = maps:get(<<"id">>, Map, <<"">>),
            
            %% Valida a duplicidade e salva no ETS
            case db_ets:salvar_raid(IdBin, Map) of
                {ok, DadosSalvos} ->
                    api_util:reply_json(Req2, 201, DadosSalvos);
                {error, duplicado} ->
                    api_util:reply_error(Req2, 409, <<"id_duplicado">>, <<"O ID desta raid já está em uso."/utf8>>)
            end;
            
        {error, invalid_json, Req2} ->
            api_util:reply_error(Req2, 400, <<"json_invalido">>, <<"O formato enviado não é um JSON válido."/utf8>>)
    end;

%% 3. Listar ou Buscar Raids (GET)
handle_request(<<"GET">>, Req) ->
    %% Extrai o :id da URL (se existir)
    RaidId = cowboy_req:binding(id, Req),

    case RaidId of
        undefined ->
            %% Rota: GET /raids -> Retorna a lista completa
            TodasRaids = db_ets:listar_raids(),
            api_util:reply_json(Req, 200, TodasRaids);
            
        _ ->
            %% Rota: GET /raids/:id -> Busca uma específica
            case db_ets:buscar_raid(RaidId) of
                {ok, DadosRaid} ->
                   Inscricoes = db_ets:buscar_inscricoes_raid(RaidId),
                    
                    %% Filter the inscriptions based on their status
                    Confirmados = [I || I <- Inscricoes, maps:get(<<"status">>, I, <<"">>) == <<"confirmado">>],
                    Fila = [I || I <- Inscricoes, maps:get(<<"status">>, I, <<"">>) == <<"lista_espera">>],
                    
                    %% Merge the separated lists into the Raid map using the keys the frontend expects
                    DadosCompletos = DadosRaid#{
                        <<"confirmados">> => Confirmados,
                        <<"fila">> => Fila
                    },
                    
                    api_util:reply_json(Req, 200, DadosCompletos);
                {error, nao_encontrado} ->
                    api_util:reply_error(Req, 404, <<"nao_encontrado">>, <<"A raid informada não foi encontrada."/utf8>>)
            end
    end;

%% 4. Outros Metodos
handle_request(_, Req) ->
    api_util:reply_error(Req, 405, <<"metodo_nao_permitido">>, <<"Método HTTP não suportado nesta rota."/utf8>>).