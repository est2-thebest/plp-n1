-module(handler_inscricoes).

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

%% 2. Inscrever Jogador (POST)
handle_request(<<"POST">>, Req) ->
    %% Extrai o ID da raid diretamente da URL (ex: /raids/r1/inscricoes)
    RaidId = cowboy_req:binding(id, Req),

    case api_util:parse_body(Req) of
        {ok, Map, Req2} ->
            %% O contrato exige a chave camelCase no JSON
            JogadorId = maps:get(<<"jogadorId">>, Map, <<"">>),

            %% TODO Futuro com o colega:
            %% 1. Procurar o Pid da raid 'RaidId'
            %% 2. Enviar a mensagem para o processo concorrente:
            %%    Pid ! {inscrever, JogadorId, self()}
            %% 3. Fazer o receive aguardando a resposta para saber se entrou ou foi pra fila

            %% Mock temporário: Simulando que o jogador entrou na vaga principal
            %% Mude para <<"lista_espera">> para testar a interface visual do front-end
            RespostaJson = #{
                <<"status">> => <<"confirmado">>
            },
            api_util:reply_json(Req2, 200, RespostaJson);

        {error, invalid_json, Req2} ->
            api_util:reply_error(Req2, 400, <<"json_invalido">>, <<"O formato enviado não é um JSON válido.">>)
    end;

%% 3. Cancelar/Remover Inscrição (DELETE)
handle_request(<<"DELETE">>, Req) ->
    %% Aqui extraimos AMBOS os parametros que mapeamos no guild_raid_app.erl
    RaidId = cowboy_req:binding(id, Req),
    JogadorId = cowboy_req:binding(jogadorId, Req),

    %% Evita erro caso a pessoa chame o DELETE sem o ID do jogador na URL
    case JogadorId of
        undefined ->
            api_util:reply_error(Req, 400, <<"falta_id_jogador">>, <<"O ID do jogador é obrigatório na URL.">>);
        _ ->
            %% TODO Futuro com o colega:
            %% 1. Enviar mensagem: Pid ! {remover, JogadorId, self()}
            %% 2. O servidor da raid cuida sozinho de puxar o próximo da fila
            
            %% Como é uma deleção bem-sucedida, retornamos um 200 OK genérico
            api_util:reply_json(Req, 200, #{<<"mensagem">> => <<"Jogador removido com sucesso.">>})
    end;

%% 4. Outros Metodos Nao Suportados
handle_request(_, Req) ->
    api_util:reply_error(Req, 405, <<"metodo_nao_permitido">>, <<"Método HTTP não suportado nesta rota.">>).