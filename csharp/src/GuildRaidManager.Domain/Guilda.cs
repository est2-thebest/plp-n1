using GuildRaidManager.Domain.Excecoes;

namespace GuildRaidManager.Domain;

/// <summary>
/// Memória da guilda: jogadores + raids.
/// lock = RNF05 no C# (coleção compartilhada). No Erlang isso é a mailbox do processo.
/// </summary>
public sealed class Guilda
{
    private readonly Dictionary<string, Jogador> _jogadores = [];
    private readonly Dictionary<string, Raid> _raids = [];
    private readonly ServicoDistribuicaoLoot _loot = new();
    private readonly object _cadeado = new();

    public IReadOnlyCollection<Jogador> Jogadores
    {
        get
        {
            lock (_cadeado)
            {
                return _jogadores.Values.ToList();
            }
        }
    }

    public IReadOnlyCollection<Raid> Raids
    {
        get
        {
            lock (_cadeado)
            {
                return _raids.Values.ToList();
            }
        }
    }

    public Jogador CadastrarJogador(Jogador jogador)
    {
        lock (_cadeado)
        {
            if (_jogadores.ContainsKey(jogador.Id))
            {
                throw new RegraNegocioException("ja_cadastrado", "Jogador já cadastrado.");
            }

            _jogadores[jogador.Id] = jogador;
            return jogador;
        }
    }

    public Jogador ObterJogador(string id)
    {
        lock (_cadeado)
        {
            return JogadorOuErro(id);
        }
    }

    public Raid CriarRaid(Raid raid)
    {
        lock (_cadeado)
        {
            if (_raids.ContainsKey(raid.Id))
            {
                throw new RegraNegocioException("ja_cadastrado", "Raid já cadastrada.");
            }

            _raids[raid.Id] = raid;
            return raid;
        }
    }

    public Raid ObterRaid(string id)
    {
        lock (_cadeado)
        {
            return RaidOuErro(id);
        }
    }

    public Inscricao Inscrever(string raidId, string jogadorId)
    {
        lock (_cadeado)
        {
            var raid = RaidOuErro(raidId);
            var jogador = JogadorOuErro(jogadorId);
            return raid.InscreverJogador(jogador);
        }
    }

    public void RemoverInscricao(string raidId, string jogadorId)
    {
        lock (_cadeado)
        {
            RaidOuErro(raidId).RemoverJogador(jogadorId);
        }
    }

    public Raid RegistrarPresenca(string raidId, IEnumerable<string> jogadorIds)
    {
        lock (_cadeado)
        {
            var raid = RaidOuErro(raidId);
            raid.RegistrarPresenca(jogadorIds);
            return raid;
        }
    }

    public ItemLoot RegistrarLoot(string raidId, ItemLoot item)
    {
        lock (_cadeado)
        {
            return RaidOuErro(raidId).RegistrarLoot(item);
        }
    }

    public ItemLoot DistribuirLoot(string raidId, string itemId)
    {
        lock (_cadeado)
        {
            var raid = RaidOuErro(raidId);
            var item = raid.LootPorId(itemId)
                ?? throw new NaoEncontradoException("Item não encontrado.");
            var participantes = raid.ParticipantesEfetivos.Select(JogadorOuErro).ToList();
            return _loot.Distribuir(item, participantes, QuantidadeLoots);
        }
    }

    public HistoricoJogador ObterHistorico(string jogadorId)
    {
        lock (_cadeado)
        {
            JogadorOuErro(jogadorId);
            var participou = _raids.Values
                .Where(raid => raid.ParticipantesEfetivos.Contains(jogadorId))
                .ToList();
            var itens = _raids.Values
                .SelectMany(raid => raid.Loots)
                .Where(item => item.GanhadorId == jogadorId)
                .Select(item => new ItemRecebido(item.Id, item.Nome))
                .ToList();
            var situacoes = _raids.Values
                .Select(raid => (raid.Nome, Status: raid.SituacaoDe(jogadorId)))
                .Where(par => par.Status is not null)
                .Select(par => new SituacaoNaRaid(par.Nome, par.Status!))
                .ToList();
            return new HistoricoJogador(
                jogadorId,
                participou.Select(raid => raid.Nome).ToList(),
                itens,
                situacoes);
        }
    }

    private int QuantidadeLoots(string jogadorId) =>
        _raids.Values.SelectMany(raid => raid.Loots).Count(item => item.GanhadorId == jogadorId);

    private Jogador JogadorOuErro(string id) =>
        _jogadores.TryGetValue(id, out var jogador)
            ? jogador
            : throw new NaoEncontradoException("Jogador não encontrado.");

    private Raid RaidOuErro(string id) =>
        _raids.TryGetValue(id, out var raid)
            ? raid
            : throw new NaoEncontradoException("Raid não encontrada.");
}
