namespace GuildRaidManager.Domain.Excecoes;

/// <summary>Regra quebrada → a API responde HTTP 400 com { erro, mensagem }.</summary>
public sealed class RegraNegocioException : Exception
{
    public string Codigo { get; }

    public RegraNegocioException(string codigo, string mensagem)
        : base(mensagem)
    {
        Codigo = codigo;
    }
}
