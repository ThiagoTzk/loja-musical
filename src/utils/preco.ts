export function precoParaNumero(preco: string) {
  const valor = preco.replace("R$", "").replace(/\./g, "").replace(",", ".");
  return Number(valor.trim()) || 0;
}

export function formatarMoeda(valor: number) {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}
