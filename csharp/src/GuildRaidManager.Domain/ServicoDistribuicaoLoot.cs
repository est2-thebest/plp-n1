using GuildRaidManager.Domain.Excecoes;

namespace GuildRaidManager.Domain;

/// <summary>
/// RF08 / RN06–RN08 — serviço de domínio: a Raid não escolhe o ganhador sozinha.
/// Elegível = participou + função do item. Empate: quem tem menos loots na guilda.
/// </summary>
public sealed class ServicoDistribuicaoLoot
{
    public ItemLoot Distribuir(
        ItemLoot item,
        IReadOnlyList<Jogador> participantesEfetivos,
        Func<string, int> quantidadeLoots)
    {
        var elegiveis = participantesEfetivos
            .Where(jogador => jogador.Funcao == item.FuncaoRequerida)
            .OrderBy(jogador => quantidadeLoots(jogador.Id))
            .ThenBy(jogador => jogador.Id, StringComparer.Ordinal)
            .ToList();

        if (elegiveis.Count == 0)
        {
            throw new RegraNegocioException(
                "sem_elegivel",
                "Nenhum participante elegível encontrado para este item.");
        }

        item.Atribuir(elegiveis[0].Id);
        return item;
    }
}
