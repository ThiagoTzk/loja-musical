export function precoParaNumero(preco: string) {
  const valor = preco.replace("R$", "").replace(/\./g, "").replace(",", ".");
  return Number(valor.trim()) || 0;
}

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

export function formatarMoeda(valor: number) {
  return formatadorMoeda.format(valor);
}
