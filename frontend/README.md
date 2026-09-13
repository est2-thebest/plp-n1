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
index.html    # tela inicial
css/styles.css
js/app.js     # troca a URL do backend (C# ou Erlang)
```

Quando as APIs existirem, o seletor de backend aponta para `http://localhost:5000` (C#) ou `http://localhost:8080` (Erlang), com o mesmo JSON nos dois lados.

Contrato compartilhado (caminhos, JSON, CORS): [`../contrato-api.md`](../contrato-api.md).

O arquivo `js/api.js` já tem o `fetch` de cada endpoint. Sem os backends no ar, as chamadas falham — esperado até C# e Erlang subirem HTTP.
