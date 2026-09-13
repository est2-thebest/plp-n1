# Frontend

Interface web compartilhada da N1. Fala com a API em **C#** ou em **Erlang** — a regra de negócio fica nos backends.

HTML, CSS e JS estáticos. Sem framework.

## Como abrir

Ainda não há API. Para ver a página:

```bash
cd frontend
python3 -m http.server 5500
```

Abra http://localhost:5500

## Estrutura

```
js/mock.js        # dados de demo da tela
js/api.js         # fetch (C# / Erlang / mock)
js/ui.js          # estado, listas, filtros e validação
js/modais.js      # cadastro, histórico e detalhe da raid
js/navegacao.js   # duas abas: Jogadores e Raids
js/app.js         # liga formulários e API
```

A lista fica nas abas. Cadastro, histórico e o detalhe da raid abrem em modal.

Quando as APIs existirem, o seletor de backend aponta para `http://localhost:5000` (C#) ou `http://localhost:8080` (Erlang), com o mesmo JSON nos dois lados.

Contrato compartilhado (caminhos, JSON, CORS): [`../contrato-api.md`](../contrato-api.md).

O seletor **Mock · demo da tela** carrega a massa do roteiro (Aria confirmada, Breno na fila). Remover Aria promove Breno. Isso **não** testa C# nem Erlang.
