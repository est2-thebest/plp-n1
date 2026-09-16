using GuildRaidManager.Domain.Enums;
using GuildRaidManager.Domain.Excecoes;

namespace GuildRaidManager.Domain;

/// <summary>RF01 — cadastro do membro. A função (Tank/Healer/DPS) decide em qual vaga ele cabe.</summary>
public sealed class Jogador
{
    public string Id { get; }
    public string Nome { get; }
    public string Classe { get; }
    public Funcao Funcao { get; }

    private Jogador(string id, string nome, string classe, Funcao funcao)
    {
        Id = id;
        Nome = nome;
        Classe = classe;
        Funcao = funcao;
    }

    public static Jogador Criar(string id, string nome, string classe, Funcao funcao)
    {
        if (string.IsNullOrWhiteSpace(nome))
        {
            throw new RegraNegocioException("nome_invalido", "Nome do jogador inválido.");
        }

        if (string.IsNullOrWhiteSpace(classe))
        {
            throw new RegraNegocioException("classe_invalida", "Classe do jogador inválida.");
        }

        return new Jogador(Identificador.Validar(id), nome.Trim(), classe.Trim(), funcao);
    }
}
