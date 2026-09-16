namespace GuildRaidManager.Domain;

/// <summary>RF09 / RN09 — consulta: participações, itens e situação em cada raid (confirmado, fila ou participou).</summary>
public sealed class HistoricoJogador
{
    public string JogadorId { get; }
    public int QuantidadeParticipacoes { get; }
    public IReadOnlyList<string> Raids { get; }
    public IReadOnlyList<ItemRecebido> ItensRecebidos { get; }
    public IReadOnlyList<SituacaoNaRaid> SituacaoNasRaids { get; }

    public HistoricoJogador(
        string jogadorId,
        IReadOnlyList<string> raids,
        IReadOnlyList<ItemRecebido> itensRecebidos,
        IReadOnlyList<SituacaoNaRaid> situacaoNasRaids)
    {
        JogadorId = jogadorId;
        Raids = raids;
        ItensRecebidos = itensRecebidos;
        SituacaoNasRaids = situacaoNasRaids;
        QuantidadeParticipacoes = raids.Count;
    }
}

public sealed record ItemRecebido(string Id, string Nome);

public sealed record SituacaoNaRaid(string Raid, string Status);
