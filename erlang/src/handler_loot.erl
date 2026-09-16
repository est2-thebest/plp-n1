-module(handler_loot).

-export([init/2]).

init(Req, State) ->
    Method = cowboy_req:method(Req),
    ReqFinal = handle_request(Method, Req),
    {ok, ReqFinal, State}.

%%% ===================================================================
%%% Tratamento por Metodo HTTP
%%% ===================================================================

handle_request(<<"OPTIONS">>, Req) ->
    cowboy_req:reply(204, api_util:cors_headers(), Req);

%% Registrar/Distribuir Loot (POST)
handle_request(<<"POST">>, Req) ->
    RaidId = cowboy_req:binding(id, Req),
    Path = cowboy_req:path(Req),
    
    %% O roteador nos manda para cá por varias URLs, vamos tratar pelo Path
    case binary:match(Path, <<"loots">>) of
        nomatch ->
            %% Rota de Presenca (POST /raids/:id/presenca)
            api_util:reply_json(Req, 200, #{<<"mensagem">> => <<"Lista de presença processada.">>});
            
        _ ->
            %% Rota de Loots (POST /raids/:id/loots)
            case api_util:parse_body(Req) of
                {ok, Map, Req2} ->
                    ItemIdBin = maps:get(<<"itemId">>, Map, <<"">>),
                    
                    %% Salva o item vinculando à Raid no banco de dados
                    case db_ets:salvar_loot(RaidId, ItemIdBin, Map) of
                        {ok, DadosLoot} ->
                            api_util:reply_json(Req2, 201, DadosLoot);
                        {error, duplicado} ->
                            api_util:reply_error(Req2, 409, <<"loot_duplicado">>, <<"Este item já foi registrado nesta raid.">>)
                    end;
                    
                {error, invalid_json, Req2} ->
                    api_util:reply_error(Req2, 400, <<"json_invalido">>, <<"O formato enviado não é um JSON válido.">>)
            end
    end;

%% Listar Loots da Raid (GET)
handle_request(<<"GET">>, Req) ->
    RaidId = cowboy_req:binding(id, Req),
    
    %% Traz todos os itens (loots) salvos no ETS para esta Raid
    LootsDaRaid = db_ets:buscar_loots_raid(RaidId),
    api_util:reply_json(Req, 200, LootsDaRaid);

handle_request(_, Req) ->
    api_util:reply_error(Req, 405, <<"metodo_nao_permitido">>, <<"Método HTTP não suportado nesta rota.">>).