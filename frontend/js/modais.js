function dialogDoModal(nome) {
  return document.getElementById(`modal-${nome}`);
}

function abrirModal(nome) {
  const dialog = dialogDoModal(nome);
  if (!dialog) {
    return;
  }

  if (nome === "jogador" || nome === "raid") {
    const form = dialog.querySelector("form");
    if (form) {
      form.reset();
      limparErros(form);
    }
  }

  if (!dialog.open) {
    dialog.showModal();
  }

  posicionarBanner();

  const primeiro = dialog.querySelector("input, select, button[type=submit]");
  if (primeiro && nome !== "detalhe-raid") {
    primeiro.focus();
  }
}

function fecharModal(nome) {
  const dialog = dialogDoModal(nome);
  if (dialog?.open) {
    dialog.close();
  }
}

function fecharTodosOsModais() {
  document.querySelectorAll("dialog.modal").forEach((dialog) => {
    if (dialog.open) {
      dialog.close();
    }
  });
}

function modalAberto(nome) {
  return Boolean(dialogDoModal(nome)?.open);
}

document.addEventListener("click", (evento) => {
  const abrir = evento.target.dataset.abrirModal;
  const fechar = evento.target.dataset.fecharModal;
  if (abrir) {
    abrirModal(abrir);
  }
  if (fechar) {
    fecharModal(fechar);
  }
});

document.querySelectorAll("dialog.modal").forEach((dialog) => {
  dialog.addEventListener("click", (evento) => {
    if (evento.target !== dialog) {
      return;
    }
    if (evento.detail === 0 || (evento.clientX === 0 && evento.clientY === 0)) {
      return;
    }
    dialog.close();
  });

  dialog.addEventListener("close", () => {
    posicionarBanner();
  });
});
