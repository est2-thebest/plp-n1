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
    RaidId = cowboy_req:binding(id, Req),

    case api_util:parse_body(Req) of
        {ok, Map, Req2} ->
            JogadorId = maps:get(<<"jogadorId">>, Map, <<"">>),

            %% Chama a camada de persistência. 
            %% Nota: Temporariamente assumimos "confirmado" até a lógica de limite 
            %% de vagas (do raid_server) ser conectada no futuro.
            case db_ets:salvar_inscricao(RaidId, JogadorId, <<"confirmado">>) of
                {ok, DadosInscricao} ->
                    api_util:reply_json(Req2, 201, DadosInscricao);
                
                {error, duplicado} ->
                    %% A nossa Chave Composta do ETS barrou a duplicidade perfeitamente!
                    api_util:reply_error(Req2, 409, <<"inscricao_duplicada">>, <<"O jogador já está inscrito nesta raid.">>)
            end;

        {error, invalid_json, Req2} ->
            api_util:reply_error(Req2, 400, <<"json_invalido">>, <<"O formato enviado não é um JSON válido.">>)
    end;

%% 3. Cancelar/Remover Inscrição (DELETE)
handle_request(<<"DELETE">>, Req) ->
    RaidId = cowboy_req:binding(id, Req),
    JogadorId = cowboy_req:binding(jogadorId, Req),

    case JogadorId of
        undefined ->
            api_util:reply_error(Req, 400, <<"falta_id_jogador">>, <<"O ID do jogador é obrigatório na URL.">>);
        _ ->
            %% Chama o repositório para deletar a chave composta {RaidId, JogadorId}
            db_ets:remover_inscricao(RaidId, JogadorId),
            
            api_util:reply_json(Req, 200, #{<<"mensagem">> => <<"Inscrição removida com sucesso.">>})
    end;

%% 4. Outros Metodos Nao Suportados
handle_request(_, Req) ->
    api_util:reply_error(Req, 405, <<"metodo_nao_permitido">>, <<"Método HTTP não suportado nesta rota.">>).