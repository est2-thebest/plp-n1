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

%% 2. Listagem de Raids (GET)
handle_request(<<"GET">>, Req) ->
    %% Verifica se existe um ID na URL (ex: /raids/r1)
    IdBinding = cowboy_req:binding(id, Req),
    
    case IdBinding of
        %% Caso 1: GET /raids (Sem ID, Lista todas)
        undefined ->
            %% TODO Futuro: Consultar o gerenciador central de raids para listar processos ativos
            ListaMock = [
                #{<<"id">> => <<"r1">>, <<"nome">> => <<"Naxxramas">>, <<"data">> => <<"2026-09-20T21:00:00">>},
                #{<<"id">> => <<"r2">>, <<"nome">> => <<"Molten Core">>, <<"data">> => <<"2026-09-25T20:00:00">>}
            ],
            api_util:reply_json(Req, 200, ListaMock);

        %% Caso 2: GET /raids/:id (Traz os detalhes de uma raid especifica)
        IdBin ->
            %% TODO Futuro: Buscar o Pid da Raid, mandar a mensagem {obter_estado, self()} e formatar a resposta
            RaidMock = #{
                <<"id">> => IdBin,
                <<"nome">> => <<"Naxxramas">>,
                <<"data">> => <<"2026-09-20T21:00:00">>,
                <<"limiteTank">> => 2,
                <<"limiteHealer">> => 2,
                <<"limiteDps">> => 6,
                %% Arrays internos gerenciados pela concorrencia
                <<"confirmados">> => [],
                <<"lista_espera">> => [],
                <<"participantes">> => [],
                <<"loots">> => []
            },
            api_util:reply_json(Req, 200, RaidMock)
    end;

%% 3. Criacao da Raid (POST)
handle_request(<<"POST">>, Req) ->
    case api_util:parse_body(Req) of
        {ok, Map, Req2} ->
            %% Extraindo as chaves camelCase conforme o contrato da API
            IdBin = maps:get(<<"id">>, Map, <<"">>),
            NomeBin = maps:get(<<"nome">>, Map, <<"">>),
            DataBin = maps:get(<<"data">>, Map, <<"">>),
            LimTank = maps:get(<<"limiteTank">>, Map, 0),
            LimHealer = maps:get(<<"limiteHealer">>, Map, 0),
            LimDps = maps:get(<<"limiteDps">>, Map, 0),

            %% TODO Futuro: Integracao com o colega
            %% Limites = #{tank => LimTank, healer => LimHealer, dps => LimDps},
            %% raid_server:start(IdBin, NomeBin, Limites),

            %% Devolvemos o JSON para confirmar que o cadastro funcionou
            RespostaJson = #{
                <<"id">> => IdBin,
                <<"nome">> => NomeBin,
                <<"data">> => DataBin,
                <<"limiteTank">> => LimTank,
                <<"limiteHealer">> => LimHealer,
                <<"limiteDps">> => LimDps
            },
            api_util:reply_json(Req2, 201, RespostaJson);
            
        {error, invalid_json, Req2} ->
            api_util:reply_error(Req2, 400, <<"json_invalido">>, <<"O formato enviado não é um JSON válido.">>)
    end;

%% 4. Outros Metodos Nao Suportados
handle_request(_, Req) ->
    api_util:reply_error(Req, 405, <<"metodo_nao_permitido">>, <<"Método HTTP não suportado nesta rota.">>).