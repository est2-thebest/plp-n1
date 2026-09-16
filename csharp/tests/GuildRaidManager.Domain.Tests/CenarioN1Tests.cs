using GuildRaidManager.Domain.Enums;
using GuildRaidManager.Domain.Excecoes;
using Xunit;

namespace GuildRaidManager.Domain.Tests;

public class CenarioN1Tests
{
    private static Guilda GuildaComElenco()
    {
        var guilda = new Guilda();
        guilda.CadastrarJogador(Jogador.Criar("1", "Lina", "guerreiro", Funcao.Tank));
        guilda.CadastrarJogador(Jogador.Criar("2", "Otavio", "paladino", Funcao.Tank));
        guilda.CadastrarJogador(Jogador.Criar("3", "Selene", "sacerdote", Funcao.Healer));
        guilda.CadastrarJogador(Jogador.Criar("4", "Ruan", "mago", Funcao.Dps));
        guilda.CadastrarJogador(Jogador.Criar("5", "Tess", "ladino", Funcao.Dps));
        guilda.CriarRaid(new Raid("10", "Naxxramas", new DateTime(2026, 9, 20, 21, 0, 0), 1, 1, 1));
        return guilda;
    }

    [Fact]
    public void NomeVazio_DeveFalhar()
    {
        var ex = Assert.Throws<RegraNegocioException>(() =>
            Jogador.Criar("1", "  ", "mago", Funcao.Dps));
        Assert.Equal("nome_invalido", ex.Codigo);
    }

    [Fact]
    public void IdComLetra_DeveFalhar()
    {
        var ex = Assert.Throws<RegraNegocioException>(() =>
            Jogador.Criar("a1", "Lina", "guerreiro", Funcao.Tank));
        Assert.Equal("id_invalido", ex.Codigo);
    }

    [Fact]
    public void IdComCincoDigitos_DeveFalhar()
    {
        Assert.Throws<RegraNegocioException>(() =>
            Jogador.Criar("12345", "Lina", "guerreiro", Funcao.Tank));
        Assert.Throws<RegraNegocioException>(() =>
            new Raid("12345", "Naxxramas", DateTime.Today, 1, 1, 1));
    }

    [Fact]
    public void Inscricao_SegueVagasEFilaDoRoteiro()
    {
        var guilda = GuildaComElenco();

        Assert.Equal(StatusInscricao.Confirmado, guilda.Inscrever("10", "1").Status);
        Assert.Equal(StatusInscricao.Confirmado, guilda.Inscrever("10", "3").Status);
        Assert.Equal(StatusInscricao.Confirmado, guilda.Inscrever("10", "4").Status);
        Assert.Equal(StatusInscricao.ListaEspera, guilda.Inscrever("10", "5").Status);
        Assert.Equal(StatusInscricao.ListaEspera, guilda.Inscrever("10", "2").Status);

        var duplicado = Assert.Throws<RegraNegocioException>(() => guilda.Inscrever("10", "1"));
        Assert.Equal("ja_inscrito", duplicado.Codigo);
    }

    [Fact]
    public void RemoverTank_PromoveTankDaFila_NaoDps()
    {
        var guilda = GuildaComElenco();
        guilda.Inscrever("10", "1");
        guilda.Inscrever("10", "3");
        guilda.Inscrever("10", "4");
        guilda.Inscrever("10", "5");
        guilda.Inscrever("10", "2");

        guilda.RemoverInscricao("10", "1");

        var raid = guilda.ObterRaid("10");
        Assert.Equal(new[] { "3", "4", "2" }, raid.Confirmados.Select(i => i.JogadorId));
        Assert.Equal(new[] { "5" }, raid.Fila.Select(i => i.JogadorId));
    }

    [Fact]
    public void Presenca_IgnoraQuemEstaNaFila()
    {
        var guilda = GuildaComElenco();
        guilda.Inscrever("10", "1");
        guilda.Inscrever("10", "3");
        guilda.Inscrever("10", "4");
        guilda.Inscrever("10", "5");
        guilda.Inscrever("10", "2");
        guilda.RemoverInscricao("10", "1");

        var raid = guilda.RegistrarPresenca("10", ["2", "3", "4", "5"]);
        Assert.Equal(new[] { "2", "3", "4" }, raid.ParticipantesEfetivos);
    }

    [Fact]
    public void LootDps_VaiParaQuemParticipouComAFuncao()
    {
        var guilda = GuildaComElenco();
        guilda.Inscrever("10", "1");
        guilda.Inscrever("10", "3");
        guilda.Inscrever("10", "4");
        guilda.Inscrever("10", "5");
        guilda.Inscrever("10", "2");
        guilda.RemoverInscricao("10", "1");
        guilda.RegistrarPresenca("10", ["2", "3", "4", "5"]);
        guilda.RegistrarLoot("10", new ItemLoot("i1", "Espada Lendária", CategoriaItem.Arma, Funcao.Dps));

        var item = guilda.DistribuirLoot("10", "i1");
        Assert.Equal("4", item.GanhadorId);

        var historico = guilda.ObterHistorico("4");
        Assert.Equal(1, historico.QuantidadeParticipacoes);
        Assert.Contains("Naxxramas", historico.Raids);
        Assert.Contains(historico.ItensRecebidos, i => i.Id == "i1");
        Assert.Contains(historico.SituacaoNasRaids, s => s.Raid == "Naxxramas" && s.Status == "participou");

        var tess = guilda.ObterHistorico("5");
        Assert.Equal(0, tess.QuantidadeParticipacoes);
        Assert.Empty(tess.ItensRecebidos);
        Assert.Contains(tess.SituacaoNasRaids, s => s.Status == "lista_espera");
    }

    [Fact]
    public void LimiteNegativo_DeveFalhar()
    {
        Assert.Throws<RegraNegocioException>(() =>
            new Raid("11", "Teste", DateTime.Today, -1, 1, 1));
    }
}
