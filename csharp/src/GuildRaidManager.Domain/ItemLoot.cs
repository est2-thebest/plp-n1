using GuildRaidManager.Domain.Enums;
using GuildRaidManager.Domain.Excecoes;

namespace GuildRaidManager.Domain;

/// <summary>RF07 / RN08 — item da raid. Ganhador só entra por Atribuir, e só uma vez.</summary>
public sealed class ItemLoot
{
    public string Id { get; }
    public string Nome { get; }
    public CategoriaItem Categoria { get; }
    public Funcao FuncaoRequerida { get; }
    public string? GanhadorId { get; private set; }

    public ItemLoot(string id, string nome, CategoriaItem categoria, Funcao funcaoRequerida)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new RegraNegocioException("id_invalido", "Id do item inválido.");
        }

        if (string.IsNullOrWhiteSpace(nome))
        {
            throw new RegraNegocioException("nome_invalido", "Nome do item inválido.");
        }

        Id = id.Trim();
        Nome = nome.Trim();
        Categoria = categoria;
        FuncaoRequerida = funcaoRequerida;
    }

    public void Atribuir(string jogadorId)
    {
        if (GanhadorId is not null)
        {
            throw new RegraNegocioException("ja_distribuido", "Este item já foi distribuído.");
        }

        GanhadorId = jogadorId;
    }
}
