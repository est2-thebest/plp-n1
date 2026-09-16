namespace GuildRaidManager.Domain.Excecoes;

/// <summary>Jogador, raid ou item inexistente → HTTP 404.</summary>
public sealed class NaoEncontradoException : Exception
{
    public NaoEncontradoException(string mensagem)
        : base(mensagem)
    {
    }
}
