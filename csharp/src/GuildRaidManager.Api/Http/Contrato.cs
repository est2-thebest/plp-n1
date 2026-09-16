using GuildRaidManager.Domain;
using GuildRaidManager.Domain.Enums;
using GuildRaidManager.Domain.Excecoes;
using FuncaoJogador = GuildRaidManager.Domain.Enums.Funcao;

namespace GuildRaidManager.Api.Http;

// Borda HTTP: o front só vê camelCase e enums em minúsculo (lista_espera, não listaEspera).

public sealed record CadastroJogadorRequest(string? Id, string? Nome, string? Classe, string? Funcao);

public sealed record CadastroRaidRequest(
    string? Id,
    string? Nome,
    DateTime? Data,
    int? LimiteTank,
    int? LimiteHealer,
    int? LimiteDps);

public sealed record InscricaoRequest(string? JogadorId);

public sealed record PresencaRequest(IReadOnlyList<string>? JogadorIds);

public sealed record CadastroLootRequest(string? Id, string? Nome, string? Categoria, string? FuncaoRequerida);

public sealed record ErroResposta(string Erro, string Mensagem);

public static class Contrato
{
    public static object Jogador(Jogador jogador) => new
    {
        id = jogador.Id,
        nome = jogador.Nome,
        classe = jogador.Classe,
        funcao = Texto(jogador.Funcao)
    };

    public static object Inscricao(Inscricao inscricao) => new
    {
        jogadorId = inscricao.JogadorId,
        funcao = Texto(inscricao.Funcao),
        status = Texto(inscricao.Status)
    };

    public static object Raid(Raid raid) => new
    {
        id = raid.Id,
        nome = raid.Nome,
        data = raid.Data.ToString("yyyy-MM-ddTHH:mm:ss"),
        limiteTank = raid.LimiteTank,
        limiteHealer = raid.LimiteHealer,
        limiteDps = raid.LimiteDps,
        confirmados = raid.Confirmados.Select(Inscricao).ToList(),
        fila = raid.Fila.Select(Inscricao).ToList(),
        participantesEfetivos = raid.ParticipantesEfetivos.ToList(),
        loots = raid.Loots.Select(Loot).ToList()
    };

    public static object Loot(ItemLoot item) => new
    {
        id = item.Id,
        nome = item.Nome,
        categoria = Texto(item.Categoria),
        funcaoRequerida = Texto(item.FuncaoRequerida),
        ganhadorId = item.GanhadorId
    };

    public static object Historico(HistoricoJogador historico) => new
    {
        jogadorId = historico.JogadorId,
        quantidadeParticipacoes = historico.QuantidadeParticipacoes,
        raids = historico.Raids,
        itensRecebidos = historico.ItensRecebidos.Select(item => new { id = item.Id, nome = item.Nome }),
        situacaoNasRaids = historico.SituacaoNasRaids.Select(item => new { raid = item.Raid, status = item.Status })
    };

    public static FuncaoJogador Funcao(string? valor) =>
        valor?.Trim().ToLowerInvariant() switch
        {
            "tank" => FuncaoJogador.Tank,
            "healer" => FuncaoJogador.Healer,
            "dps" => FuncaoJogador.Dps,
            _ => throw new RegraNegocioException("funcao_invalida", "Função inválida.")
        };

    public static CategoriaItem Categoria(string? valor) =>
        valor?.Trim().ToLowerInvariant() switch
        {
            "arma" => CategoriaItem.Arma,
            "armadura" => CategoriaItem.Armadura,
            "acessorio" => CategoriaItem.Acessorio,
            _ => throw new RegraNegocioException("categoria_invalida", "Categoria de item inválida.")
        };

    private static string Texto(FuncaoJogador funcao) =>
        funcao switch
        {
            FuncaoJogador.Tank => "tank",
            FuncaoJogador.Healer => "healer",
            _ => "dps"
        };

    private static string Texto(StatusInscricao status) =>
        status switch
        {
            StatusInscricao.ListaEspera => "lista_espera",
            StatusInscricao.Cancelado => "cancelado",
            _ => "confirmado"
        };

    private static string Texto(CategoriaItem categoria) =>
        categoria switch
        {
            CategoriaItem.Armadura => "armadura",
            CategoriaItem.Acessorio => "acessorio",
            _ => "arma"
        };
}
