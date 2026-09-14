%%Rotas: /jogadores e /jogadores/{id}
-module(handler_jogadores).

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

%% 2. Tratamento de todos os GETs (Lista, Unico e Historico)
handle_request(<<"GET">>, Req) ->
    %% Extrai o parametro :id da URL. Se nao existir, retorna 'undefined'
    IdBinding = cowboy_req:binding(id, Req),
    %% Pega o caminho completo da URL digitada no front-end
    Path = cowboy_req:path(Req),

    %% Usamos Pattern Matching para descobrir qual GET foi chamado
    case {IdBinding, binary:match(Path, <<"/historico">>)} of
        
        %% Caso 1: GET /jogadores (Sem ID)
        {undefined, nomatch} ->
            %% TODO Futuro: Buscar lista real do ETS ou Mnesia
            ListaMock = [
                #{<<"id">> => <<"j1">>, <<"nome">> => <<"Aria">>, <<"classe">> => <<"guerreiro">>, <<"funcao">> => <<"tank">>},
                #{<<"id">> => <<"j2">>, <<"nome">> => <<"Elara">>, <<"classe">> => <<"sacerdote">>, <<"funcao">> => <<"healer">>}
            ],
            api_util:reply_json(Req, 200, ListaMock);

        %% Caso 2: GET /jogadores/:id/historico
        {IdBin, {_, _}} when IdBin =/= undefined ->
            %% TODO Futuro: Buscar o jogador real e chamar modulo_jogador:obter_resumo(Jogador)
            HistoricoMock = #{
                <<"id">> => IdBin,
                <<"nome">> => <<"Aria">>,
                <<"funcao">> => <<"tank">>,
                <<"total_raids">> => 2,
                <<"total_loots">> => 1,
                <<"loots">> => [<<"Espada Lendária">>]
            },
            api_util:reply_json(Req, 200, HistoricoMock);

        %% Caso 3: GET /jogadores/:id (Sem a palavra historico)
        {IdBin, nomatch} when IdBin =/= undefined ->
            %% TODO Futuro: Buscar o jogador real do sistema
            JogadorMock = #{
                <<"id">> => IdBin,
                <<"nome">> => <<"Aria">>,
                <<"classe">> => <<"guerreiro">>,
                <<"funcao">> => <<"tank">>
            },
            api_util:reply_json(Req, 200, JogadorMock)
    end;

%% 3. Cadastro do Jogador (POST)
handle_request(<<"POST">>, Req) ->
    case api_util:parse_body(Req) of
        {ok, Map, Req2} ->
            IdBin = maps:get(<<"id">>, Map, <<"">>),
            NomeBin = maps:get(<<"nome">>, Map, <<"">>),
            ClasseBin = maps:get(<<"classe">>, Map, <<"">>),
            FuncaoBin = maps:get(<<"funcao">>, Map, <<"">>),

            Nome = binary_to_list(NomeBin),
            Classe = binary_to_list(ClasseBin),
            FuncaoAtomo = converter_funcao(FuncaoBin),

            case modulo_jogador:criar(IdBin, Nome, Classe, FuncaoAtomo) of
                {ok, _JogadorRecord} ->
                    %% TODO Futuro: Salvar o_JogadorRecord no ETS ou BD
                    RespostaJson = #{
                        <<"id">> => IdBin,
                        <<"nome">> => NomeBin,
                        <<"classe">> => ClasseBin,
                        <<"funcao">> => FuncaoBin
                    },
                    api_util:reply_json(Req2, 201, RespostaJson);
                    
                {error, funcao_invalida} ->
                    api_util:reply_error(Req2, 400, <<"funcao_invalida">>, <<"O papel informado deve ser tank, healer ou dps.">>)
            end;
            
        {error, invalid_json, Req2} ->
            api_util:reply_error(Req2, 400, <<"json_invalido">>, <<"O formato enviado não é um JSON válido.">>)
    end;

%% 4. Outros Metodos Nao Suportados
handle_request(_, Req) ->
    api_util:reply_error(Req, 405, <<"metodo_nao_permitido">>, <<"Método HTTP não suportado nesta rota.">>).

%%% ===================================================================
%%% Funcoes Auxiliares Internas
%%% ===================================================================

converter_funcao(<<"tank">>) -> tank;
converter_funcao(<<"healer">>) -> healer;
converter_funcao(<<"dps">>) -> dps;
converter_funcao(_) -> invalida.