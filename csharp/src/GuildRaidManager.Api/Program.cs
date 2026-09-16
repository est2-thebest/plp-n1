// Camada HTTP fina: JSON ↔ Guilda. Vaga, fila e loot ficam no Domain (POO), não aqui.
using GuildRaidManager.Api.Http;
using GuildRaidManager.Domain;
using GuildRaidManager.Domain.Excecoes;
using Microsoft.AspNetCore.Http.Json;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://localhost:5000");
builder.Services.Configure<JsonOptions>(opcoes =>
{
    opcoes.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});
builder.Services.AddSingleton<Guilda>();
builder.Services.AddCors(opcoes =>
{
    opcoes.AddDefaultPolicy(politica =>
        politica.WithOrigins("http://localhost:5500")
            .AllowAnyHeader()
            .AllowAnyMethod());
}); // Sem CORS o browser em :5500 bloqueia o fetch.

var app = builder.Build();
app.UseCors();
app.Use(async (contexto, proximo) =>
{
    try
    {
        await proximo();
    }
    catch (RegraNegocioException ex)
    {
        contexto.Response.StatusCode = StatusCodes.Status400BadRequest;
        await contexto.Response.WriteAsJsonAsync(new ErroResposta(ex.Codigo, ex.Message));
    }
    catch (NaoEncontradoException ex)
    {
        contexto.Response.StatusCode = StatusCodes.Status404NotFound;
        await contexto.Response.WriteAsJsonAsync(new ErroResposta("nao_encontrado", ex.Message));
    }
    catch (BadHttpRequestException)
    {
        contexto.Response.StatusCode = StatusCodes.Status400BadRequest;
        await contexto.Response.WriteAsJsonAsync(new ErroResposta("json_invalido", "JSON inválido."));
    }
});

app.MapPost("/jogadores", (CadastroJogadorRequest corpo, Guilda guilda) =>
{
    var jogador = guilda.CadastrarJogador(
        Jogador.Criar(corpo.Id ?? "", corpo.Nome ?? "", corpo.Classe ?? "", Contrato.Funcao(corpo.Funcao)));
    return Results.Created($"/jogadores/{jogador.Id}", Contrato.Jogador(jogador));
});

app.MapGet("/jogadores", (Guilda guilda) =>
    Results.Ok(guilda.Jogadores.Select(Contrato.Jogador)));

app.MapGet("/jogadores/{id}", (string id, Guilda guilda) =>
    Results.Ok(Contrato.Jogador(guilda.ObterJogador(id))));

app.MapGet("/jogadores/{id}/historico", (string id, Guilda guilda) =>
    Results.Ok(Contrato.Historico(guilda.ObterHistorico(id))));

app.MapPost("/raids", (CadastroRaidRequest corpo, Guilda guilda) =>
{
    var raid = guilda.CriarRaid(new Raid(
        corpo.Id ?? "",
        corpo.Nome ?? "",
        corpo.Data ?? throw new RegraNegocioException("data_invalida", "Data da raid inválida."),
        corpo.LimiteTank ?? 0,
        corpo.LimiteHealer ?? 0,
        corpo.LimiteDps ?? 0));
    return Results.Created($"/raids/{raid.Id}", Contrato.Raid(raid));
});

app.MapGet("/raids", (Guilda guilda) =>
    Results.Ok(guilda.Raids.Select(Contrato.Raid)));

app.MapGet("/raids/{id}", (string id, Guilda guilda) =>
    Results.Ok(Contrato.Raid(guilda.ObterRaid(id))));

app.MapPost("/raids/{id}/inscricoes", (string id, InscricaoRequest corpo, Guilda guilda) =>
{
    if (string.IsNullOrWhiteSpace(corpo.JogadorId))
    {
        throw new RegraNegocioException("id_invalido", "Id do jogador inválido.");
    }

    var inscricao = guilda.Inscrever(id, corpo.JogadorId);
    return Results.Ok(Contrato.Inscricao(inscricao));
});

app.MapDelete("/raids/{id}/inscricoes/{jogadorId}", (string id, string jogadorId, Guilda guilda) =>
{
    guilda.RemoverInscricao(id, jogadorId);
    return Results.NoContent();
});

app.MapPost("/raids/{id}/presenca", (string id, PresencaRequest corpo, Guilda guilda) =>
{
    var raid = guilda.RegistrarPresenca(id, corpo.JogadorIds ?? []);
    return Results.Ok(Contrato.Raid(raid));
});

app.MapPost("/raids/{id}/loots", (string id, CadastroLootRequest corpo, Guilda guilda) =>
{
    var item = guilda.RegistrarLoot(
        id,
        new ItemLoot(
            corpo.Id ?? "",
            corpo.Nome ?? "",
            Contrato.Categoria(corpo.Categoria),
            Contrato.Funcao(corpo.FuncaoRequerida)));
    return Results.Created($"/raids/{id}/loots/{item.Id}", Contrato.Loot(item));
});

app.MapPost("/raids/{id}/loots/{itemId}/distribuir", (string id, string itemId, Guilda guilda) =>
    Results.Ok(Contrato.Loot(guilda.DistribuirLoot(id, itemId))));

app.Run();
