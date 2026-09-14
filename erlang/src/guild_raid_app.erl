-module(guild_raid_app).
-behaviour(application).

-export([start/2, stop/1]).

start(_StartType, _StartArgs) ->
    %% 1. Definicao das Rotas da API baseadas no contrato
    Rotas = [
        {"/jogadores", handler_jogadores, []},
        {"/jogadores/:id", handler_jogadores, []},
        {"/jogadores/:id/historico", handler_jogadores, []},
        
        {"/raids", handler_raids, []},
        {"/raids/:id", handler_raids, []},
        
        {"/raids/:id/inscricoes", handler_inscricoes, []},
        {"/raids/:id/inscricoes/:jogadorId", handler_inscricoes, []},
        
        {"/raids/:id/presenca", handler_loot, []},
        {"/raids/:id/loots", handler_loot, []},
        {"/raids/:id/loots/:itemId/distribuir", handler_loot, []}
    ],

    %% 2. Compila as rotas para o formato que o Cowboy entende
    Dispatch = cowboy_router:compile([{'_', Rotas}]),

    %% 3. Inicia o servidor HTTP na porta 8080
    {ok, _} = cowboy:start_clear(http_listener,
        [{port, 8080}],
        #{env => #{dispatch => Dispatch}}
    ),
    
    %% Inicia o supervisor raiz da aplicacao (padrao do OTP)
    guild_raid_sup:start_link().

stop(_State) ->
    %% Para o servidor Cowboy ao desligar
    cowboy:stop_listener(http_listener),
    ok.