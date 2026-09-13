function irPara(pagina) {
  estado.pagina = pagina === "raids" ? "raids" : "jogadores";
  document.querySelectorAll(".pagina").forEach((secao) => {
    secao.hidden = secao.id !== `pagina-${estado.pagina}`;
  });
  document.querySelectorAll(".nav__item").forEach((item) => {
    item.classList.toggle("nav__item--ativo", item.dataset.pagina === estado.pagina);
  });
}

document.querySelector(".nav").addEventListener("click", (evento) => {
  const pagina = evento.target.dataset.pagina;
  if (!pagina) {
    return;
  }
  fecharTodosOsModais();
  irPara(pagina);
});
