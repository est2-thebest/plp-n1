using GuildRaidManager.Domain.Excecoes;

namespace GuildRaidManager.Domain;

/// <summary>Id de jogador e de raid: somente dígitos, no máximo 4.</summary>
public static class Identificador
{
    public static string Validar(string? id)
    {
        var valor = (id ?? "").Trim();
        if (valor.Length is < 1 or > 4 || !valor.All(c => c is >= '0' and <= '9'))
        {
            throw new RegraNegocioException(
                "id_invalido",
                "Id deve ter somente números, no máximo 4 dígitos.");
        }

        return valor;
    }
}
