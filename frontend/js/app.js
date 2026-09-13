const backends = {
  csharp: "http://localhost:5000",
  erlang: "http://localhost:8080",
};

const select = document.getElementById("backend");

function apiBase() {
  return backends[select?.value ?? "csharp"];
}

window.apiBase = apiBase;
