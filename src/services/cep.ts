import type { EnderecoPadrao } from "@/src/context/UsuarioContext";

type ViaCepResponse = {
  bairro?: string;
  cep?: string;
  complemento?: string;
  erro?: boolean | string;
  localidade?: string;
  logradouro?: string;
  uf?: string;
};

export function limparCep(cep: string) {
  return cep.replace(/\D/g, "");
}

export async function buscarEnderecoPorCep(cep: string): Promise<Partial<EnderecoPadrao>> {
  const cepLimpo = limparCep(cep);

  if (cepLimpo.length !== 8) {
    throw new Error("CEP deve ter 8 dígitos.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

  if (!response.ok) {
    throw new Error("Não foi possível consultar o CEP.");
  }

  const data = (await response.json()) as ViaCepResponse;

  if (data.erro === true || data.erro === "true") {
    throw new Error("CEP não encontrado.");
  }

  return {
    bairro: data.bairro ?? "",
    cep: data.cep ?? cep,
    cidade: data.localidade ?? "",
    complemento: data.complemento ?? "",
    estado: data.uf ?? "",
    rua: data.logradouro ?? "",
  };
}
