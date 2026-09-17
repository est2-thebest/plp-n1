-module(guild_raid_app).
-behaviour(application).

-export([start/2, stop/1]).

start(_StartType, _StartArgs) ->
    %% 1. Inicializacao do Schema (Tabelas ETS)
    %% set: ID unico. public: acessivel por qualquer processo. named_table: nome fixo.
    ets:new(tb_jogadores, [set, public, named_table]),
    ets:new(tb_raids, [set, public, named_table]),
    ets:new(tb_inscricoes, [set, public, named_table]),
    ets:new(tb_loots, [set, public, named_table]),

    %% 2. Configuracao do Roteador Cowboy
    Dispatch = cowboy_router:compile([
        {'_', [  %% <-- O "Host Match" obrigatorio do Cowboy entra aqui!
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
        ]} %% <-- Fecha a lista de rotas do Host
    ]),

    %% 3. Iniciar o servidor HTTP (Cowboy) na porta 8080
    {ok, _} = cowboy:start_clear(http_listener,
        [{port, 8080}],
        #{env => #{dispatch => Dispatch}}
    ),

    %% 4. Iniciar o Supervisor principal da aplicacao OTP
    guild_raid_sup:start_link().

stop(_State) ->
    %% Para o servidor Cowboy ao desligar
    cowboy:stop_listener(http_listener),
    ok.