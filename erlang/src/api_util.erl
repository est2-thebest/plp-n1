%%Utilitário para parse JSON, CORS e respostas padronizadas
-module(api_util).

%% Exporta as funcoes para serem usadas nos handlers
-export([
    cors_headers/0,
    reply_json/3,
    reply_error/4,
    parse_body/1
]).

%%% ===================================================================
%%% Funcoes Utilitarias para HTTP, JSON e CORS
%%% ===================================================================

%% @doc Retorna os cabecalhos de CORS exigidos pelo front-end (localhost:5500)
cors_headers() ->
    #{
        <<"access-control-allow-origin">> => <<"http://localhost:5500">>,
        <<"access-control-allow-methods">> => <<"GET, POST, DELETE, OPTIONS">>,
        <<"access-control-allow-headers">> => <<"content-type">>
    }.

%% @doc Formata e responde um JSON de sucesso (Ex: 200 OK, 201 Created)
%% O parametro BodyMap eh um mapa do Erlang (ex: #{<<"nome">> => <<"Aria">>})
reply_json(Req, StatusCode, BodyMap) ->
    %% Usa o thoas para converter o mapa Erlang em JSON
    JsonBinary = thoas:encode(BodyMap),
    
    %% Junta os headers de CORS com o Content-Type de JSON
    Headers = maps:merge(cors_headers(), #{<<"content-type">> => <<"application/json">>}),
    
    %% Dispara a resposta para o cliente usando o Cowboy
    cowboy_req:reply(StatusCode, Headers, JsonBinary, Req).

%% @doc Formata a resposta de erro exatamente no padrao do contrato
%% Exemplo: api_util:reply_error(Req, 400, <<"ja_inscrito">>, <<"O jogador já está inscrito...">>)
reply_error(Req, StatusCode, ErroCode, Mensagem) ->
    ErrorBody = #{
        <<"erro">> => ErroCode,
        <<"mensagem">> => Mensagem
    },
    %% Reaproveita a funcao reply_json para enviar o erro
    reply_json(Req, StatusCode, ErrorBody).

%% @doc Le o corpo da requisicao (body) e converte de JSON para um Mapa Erlang
parse_body(Req) ->
    {ok, BodyBinary, Req2} = cowboy_req:read_body(Req),
    case BodyBinary of
        <<>> -> 
            %% Se o body vier vazio, devolvemos um mapa vazio
            {ok, #{}, Req2};
        _ ->
            %% Usa o thoas para converter o JSON que veio do front-end
            case thoas:decode(BodyBinary) of
                {ok, Map} -> {ok, Map, Req2};
                {error, _} -> {error, invalid_json, Req2}
            end
    end.