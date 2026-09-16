using GuildRaidManager.Domain.Enums;

namespace GuildRaidManager.Domain;

/// <summary>Vínculo jogador ↔ raid. Status muda só por método (encapsulamento), não por atribuição solta.</summary>
public sealed class Inscricao
{
    public string JogadorId { get; }
    public Funcao Funcao { get; }
    public StatusInscricao Status { get; private set; }

    public Inscricao(string jogadorId, Funcao funcao, StatusInscricao status)
    {
        JogadorId = jogadorId;
        Funcao = funcao;
        Status = status;
    }

    /// <summary>RF04 — usado quando uma vaga abre e este jogador sai da fila.</summary>
    public void Confirmar()
    {
        Status = StatusInscricao.Confirmado;
    }
}
