export function limparCPF(valor: string) {
  return valor.replace(/\D/g, "");
}

export function cpfValido(valor: string) {
  const cpf = limparCPF(valor);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  const calcularDigito = (base: string, fatorInicial: number) => {
    const soma = base
      .split("")
      .reduce((total, digito, index) => total + Number(digito) * (fatorInicial - index), 0);
    const resto = (soma * 10) % 11;

    return resto === 10 ? 0 : resto;
  };

  const primeiroDigito = calcularDigito(cpf.slice(0, 9), 10);
  const segundoDigito = calcularDigito(cpf.slice(0, 10), 11);

  return primeiroDigito === Number(cpf[9]) && segundoDigito === Number(cpf[10]);
}
