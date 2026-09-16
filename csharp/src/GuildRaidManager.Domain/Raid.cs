using GuildRaidManager.Domain.Enums;
using GuildRaidManager.Domain.Excecoes;

namespace GuildRaidManager.Domain;

/// <summary>
/// Agregador da raid (POO): listas privadas, regras nos métodos.
/// RF02–RF07, RN01–RN05 — vaga por função, fila e promoção da mesma função.
/// </summary>
public sealed class Raid
{
    private readonly List<Inscricao> _confirmados = [];
    private readonly List<Inscricao> _fila = [];
    private readonly List<string> _participantesEfetivos = [];
    private readonly List<ItemLoot> _loots = [];

    public string Id { get; }
    public string Nome { get; }
    public DateTime Data { get; }
    public int LimiteTank { get; }
    public int LimiteHealer { get; }
    public int LimiteDps { get; }
    public IReadOnlyList<Inscricao> Confirmados => _confirmados;
    public IReadOnlyList<Inscricao> Fila => _fila;
    public IReadOnlyList<string> ParticipantesEfetivos => _participantesEfetivos;
    public IReadOnlyList<ItemLoot> Loots => _loots;

    public Raid(string id, string nome, DateTime data, int limiteTank, int limiteHealer, int limiteDps)
    {
        if (string.IsNullOrWhiteSpace(nome))
        {
            throw new RegraNegocioException("nome_invalido", "Nome da raid inválido.");
        }

        if (limiteTank < 0 || limiteHealer < 0 || limiteDps < 0)
        {
            throw new RegraNegocioException("limite_invalido", "Limites de vagas não podem ser negativos.");
        }

        Id = Identificador.Validar(id);
        Nome = nome.Trim();
        Data = data;
        LimiteTank = limiteTank;
        LimiteHealer = limiteHealer;
        LimiteDps = limiteDps;
    }

    /// <summary>RF03 / RN01–RN04 — Tank não ocupa vaga de Healer. Sem vaga da função → fila.</summary>
    public Inscricao InscreverJogador(Jogador jogador)
    {
        if (JaInscrito(jogador.Id))
        {
            throw new RegraNegocioException("ja_inscrito", "O jogador já está inscrito nesta raid.");
        }

        var status = Ocupados(jogador.Funcao) < LimiteDe(jogador.Funcao)
            ? StatusInscricao.Confirmado
            : StatusInscricao.ListaEspera;
        var inscricao = new Inscricao(jogador.Id, jogador.Funcao, status);
        if (status == StatusInscricao.Confirmado)
        {
            _confirmados.Add(inscricao);
        }
        else
        {
            _fila.Add(inscricao);
        }

        return inscricao;
    }

    /// <summary>RF04 / RF05 — sai um confirmado, entra o primeiro da fila com a mesma função.</summary>
    public void RemoverJogador(string jogadorId)
    {
        var confirmada = _confirmados.FirstOrDefault(i => i.JogadorId == jogadorId);
        if (confirmada is not null)
        {
            _confirmados.Remove(confirmada);
            var proximo = _fila.FirstOrDefault(i => i.Funcao == confirmada.Funcao);
            if (proximo is not null)
            {
                _fila.Remove(proximo);
                proximo.Confirmar();
                _confirmados.Add(proximo);
            }

            return;
        }

        _fila.RemoveAll(i => i.JogadorId == jogadorId);
    }

    /// <summary>RF06 / RN05 — só confirmado vira participante. Quem está na fila não entra.</summary>
    public void RegistrarPresenca(IEnumerable<string> jogadorIds)
    {
        var confirmados = _confirmados.Select(i => i.JogadorId).ToHashSet();
        _participantesEfetivos.Clear();
        _participantesEfetivos.AddRange(jogadorIds.Where(confirmados.Contains));
    }

    public ItemLoot RegistrarLoot(ItemLoot item)
    {
        if (_loots.Any(i => i.Id == item.Id))
        {
            throw new RegraNegocioException("item_duplicado", "Item já registrado nesta raid.");
        }

        _loots.Add(item);
        return item;
    }

    public ItemLoot? LootPorId(string itemId) => _loots.FirstOrDefault(i => i.Id == itemId);

    /// <summary>RF09 — participou, confirmado ou lista_espera. Quem foi removido não aparece.</summary>
    public string? SituacaoDe(string jogadorId)
    {
        if (_participantesEfetivos.Contains(jogadorId))
        {
            return "participou";
        }

        if (_confirmados.Any(i => i.JogadorId == jogadorId))
        {
            return "confirmado";
        }

        if (_fila.Any(i => i.JogadorId == jogadorId))
        {
            return "lista_espera";
        }

        return null;
    }

    public bool JaInscrito(string jogadorId) =>
        _confirmados.Any(i => i.JogadorId == jogadorId) || _fila.Any(i => i.JogadorId == jogadorId);

    private int LimiteDe(Funcao funcao) =>
        funcao switch
        {
            Funcao.Tank => LimiteTank,
            Funcao.Healer => LimiteHealer,
            _ => LimiteDps
        };

    private int Ocupados(Funcao funcao) => _confirmados.Count(i => i.Funcao == funcao);
}
