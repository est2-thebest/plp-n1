-module(handler_jogadores).

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

%% Cadastrar Jogador (POST)
handle_request(<<"POST">>, Req) ->
    case api_util:parse_body(Req) of
        {ok, Map, Req2} ->
            IdBin = maps:get(<<"id">>, Map, <<"">>),
            
            case db_ets:salvar_jogador(IdBin, Map) of
                {ok, DadosSalvos} ->
                    api_util:reply_json(Req2, 201, DadosSalvos);
                {error, duplicado} ->
                    api_util:reply_error(Req2, 409, <<"id_duplicado">>, <<"O ID do jogador já está em uso.">>)
            end;
        {error, invalid_json, Req2} ->
            api_util:reply_error(Req2, 400, <<"json_invalido">>, <<"O formato enviado não é um JSON válido.">>)
    end;

%% Listar ou Buscar Jogadores (GET)
handle_request(<<"GET">>, Req) ->
    JogadorId = cowboy_req:binding(id, Req),

    case JogadorId of
        undefined ->
            %% GET /jogadores (Lista todos)
            TodosJogadores = db_ets:listar_jogadores(),
            api_util:reply_json(Req, 200, TodosJogadores);
            
        _ ->
            %% GET /jogadores/:id (Busca um especifico)
            case db_ets:buscar_jogador(JogadorId) of
                {ok, DadosJogador} ->
                    api_util:reply_json(Req, 200, DadosJogador);
                {error, nao_encontrado} ->
                    api_util:reply_error(Req, 404, <<"nao_encontrado">>, <<"Jogador não encontrado.">>)
            end
    end;

handle_request(_, Req) ->
    api_util:reply_error(Req, 405, <<"metodo_nao_permitido">>, <<"Método HTTP não suportado nesta rota.">>).