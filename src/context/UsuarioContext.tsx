import { Produto } from "@/src/data/produto";
import { createContext, ReactNode, useState } from "react";

export type ItemHistoricoCompra = Produto & {
  compradoEm: string;
  formaPagamento: string;
  parcelas?: string;
};

type DadosCompra = {
  compradoEm?: string;
  formaPagamento: string;
  parcelas?: string;
};

export type EnderecoPadrao = {
  bairro: string;
  cep: string;
  cidade: string;
  complemento: string;
  estado: string;
  numero: string;
  rua: string;
};

export type CartaoPadrao = {
  apelido: string;
  bandeira: string;
  titular: string;
  ultimos4: string;
  validade: string;
};

export type DadosPerfilUsuario = {
  cartaoPadrao?: CartaoPadrao | null;
  cpf?: string;
  dataNascimento?: string;
  enderecoPadrao?: EnderecoPadrao | null;
  nome?: string;
  perfilCompleto?: boolean;
  telefone?: string;
};

export type Usuario = DadosPerfilUsuario & {
  email: string;
  fotoPerfil: string | null;
  historico: ItemHistoricoCompra[];
  idToken?: string;
  refreshToken?: string;
  uid?: string;
};

type UsuarioContextType = {
  usuario: Usuario | null;
  sincronizarUsuario: (dados: string | Partial<Usuario>) => void;
  logout: () => void;
  adicionarHistorico: (produtos: Produto[], dadosCompra: DadosCompra) => void;
  atualizarDadosPerfil: (dados: DadosPerfilUsuario) => void;
  atualizarFotoPerfil: (fotoPerfil: string) => void;
};

export const UsuarioContext = createContext<UsuarioContextType>(
  {} as UsuarioContextType
);

const enderecoVazio: EnderecoPadrao = {
  bairro: "",
  cep: "",
  cidade: "",
  complemento: "",
  estado: "",
  numero: "",
  rua: "",
};

function normalizarEndereco(endereco?: EnderecoPadrao | string | null) {
  if (!endereco) return null;

  if (typeof endereco === "string") {
    const texto = endereco.trim();

    return texto ? { ...enderecoVazio, rua: texto } : null;
  }

  const normalizado = {
    ...enderecoVazio,
    ...endereco,
  };
  const temValor = Object.values(normalizado).some((valor) => valor.trim() !== "");

  return temValor ? normalizado : null;
}

export function formatarEndereco(endereco?: EnderecoPadrao | null) {
  if (!endereco) return "";

  return [
    [endereco.rua, endereco.numero].filter(Boolean).join(", "),
    endereco.complemento,
    endereco.bairro,
    [endereco.cidade, endereco.estado].filter(Boolean).join(" - "),
    endereco.cep ? `CEP ${endereco.cep}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  function sincronizarUsuario(dados: string | Partial<Usuario>) {
    const email = typeof dados === "string" ? dados : dados.email ?? "";

    if (!email) return;

    const dadosUsuario = typeof dados === "string" ? {} : dados;

    setUsuario((usuarioAtual) => ({
      cartaoPadrao:
        "cartaoPadrao" in dadosUsuario
          ? dadosUsuario.cartaoPadrao ?? null
          : usuarioAtual?.cartaoPadrao ?? null,
      cpf: dadosUsuario.cpf ?? usuarioAtual?.cpf ?? "",
      dataNascimento: dadosUsuario.dataNascimento ?? usuarioAtual?.dataNascimento ?? "",
      email,
      enderecoPadrao:
        "enderecoPadrao" in dadosUsuario
          ? normalizarEndereco(dadosUsuario.enderecoPadrao)
          : usuarioAtual?.enderecoPadrao ?? null,
      fotoPerfil: dadosUsuario.fotoPerfil ?? usuarioAtual?.fotoPerfil ?? null,
      historico: dadosUsuario.historico ?? usuarioAtual?.historico ?? [],
      idToken: dadosUsuario.idToken,
      nome: dadosUsuario.nome ?? usuarioAtual?.nome ?? "",
      perfilCompleto: dadosUsuario.perfilCompleto ?? usuarioAtual?.perfilCompleto ?? false,
      refreshToken: dadosUsuario.refreshToken,
      telefone: dadosUsuario.telefone ?? usuarioAtual?.telefone ?? "",
      uid: dadosUsuario.uid,
    }));
  }

  function logout() {
    setUsuario(null);
  }

  function adicionarHistorico(produtos: Produto[], dadosCompra: DadosCompra) {
    if (!usuario) return;

    const compradoEm = dadosCompra.compradoEm ?? new Date().toISOString();
    const itensComprados = produtos.map((produto) => ({
      ...produto,
      compradoEm,
      formaPagamento: dadosCompra.formaPagamento,
      parcelas: dadosCompra.parcelas,
    }));

    setUsuario({
      ...usuario,
      historico: [...itensComprados, ...usuario.historico],
    });
  }

  function atualizarFotoPerfil(fotoPerfil: string) {
    if (!usuario) return;

    setUsuario({
      ...usuario,
      fotoPerfil,
    });
  }

  function atualizarDadosPerfil(dados: DadosPerfilUsuario) {
    if (!usuario) return;

    setUsuario({
      ...usuario,
      ...dados,
      enderecoPadrao:
        "enderecoPadrao" in dados
          ? normalizarEndereco(dados.enderecoPadrao)
          : usuario.enderecoPadrao ?? null,
    });
  }

  return (
    <UsuarioContext.Provider
      value={{
        usuario,
        sincronizarUsuario,
        logout,
        adicionarHistorico,
        atualizarDadosPerfil,
        atualizarFotoPerfil,
      }}
    >
      {children}
    </UsuarioContext.Provider>
  );
}
