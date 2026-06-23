import { renovarTokenFirebase } from "@/src/config/firebase-config";
import { Produto } from "@/src/data/produto";
import { obterDadosUsuarioFirestore } from "@/src/services/firestore";
import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

export type ItemHistoricoCompra = Produto & {
  compradoEm: string;
  formaPagamento: string;
  parcelas?: string;
  quantidade?: number;
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
  admin?: boolean;
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
  expiresIn?: string;
  fotoPerfil: string | null;
  historico: ItemHistoricoCompra[];
  idToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  uid?: string;
};

type UsuarioContextType = {
  usuario: Usuario | null;
  sincronizarUsuario: (dados: string | Partial<Usuario>) => void;
  logout: () => void;
  adicionarHistorico: (
    produtos: (Produto & { quantidade?: number })[],
    dadosCompra: DadosCompra
  ) => void;
  atualizarDadosPerfil: (dados: DadosPerfilUsuario) => void;
  atualizarFotoPerfil: (fotoPerfil: string) => void;
};

export const UsuarioContext = createContext<UsuarioContextType>(
  {} as UsuarioContextType
);

const INTERVALO_ATUALIZACAO_USUARIO_MS = 15000;

const enderecoVazio: EnderecoPadrao = {
  bairro: "",
  cep: "",
  cidade: "",
  complemento: "",
  estado: "",
  numero: "",
  rua: "",
};

function calcularExpiracaoToken(expiresIn?: string) {
  const segundos = Number(expiresIn);

  if (!Number.isFinite(segundos) || segundos <= 0) return undefined;

  return Date.now() + segundos * 1000;
}

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

function normalizarCartao(cartao?: CartaoPadrao | null) {
  if (!cartao) return null;

  return {
    apelido: cartao.apelido ?? "",
    bandeira: cartao.bandeira ?? "",
    titular: cartao.titular ?? "",
    ultimos4: cartao.ultimos4 ?? "",
    validade: cartao.validade ?? "",
  };
}

function serializarPerfil(dados: DadosPerfilUsuario) {
  return JSON.stringify({
    admin: dados.admin ?? false,
    cartaoPadrao: normalizarCartao(dados.cartaoPadrao),
    cpf: dados.cpf ?? "",
    dataNascimento: dados.dataNascimento ?? "",
    enderecoPadrao: normalizarEndereco(dados.enderecoPadrao),
    nome: dados.nome ?? "",
    perfilCompleto: dados.perfilCompleto ?? false,
    telefone: dados.telefone ?? "",
  });
}

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const recarregandoUsuarioRef = useRef(false);
  const usuarioRef = useRef<Usuario | null>(null);

  function sincronizarUsuario(dados: string | Partial<Usuario>) {
    const email = typeof dados === "string" ? dados : dados.email ?? "";

    if (!email) return;

    const dadosUsuario = typeof dados === "string" ? {} : dados;

    setUsuario((usuarioAtual) => ({
      cartaoPadrao:
        "cartaoPadrao" in dadosUsuario
          ? dadosUsuario.cartaoPadrao ?? null
          : usuarioAtual?.cartaoPadrao ?? null,
      admin: dadosUsuario.admin ?? usuarioAtual?.admin ?? false,
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
      tokenExpiresAt:
        dadosUsuario.tokenExpiresAt ??
        calcularExpiracaoToken("expiresIn" in dadosUsuario ? String(dadosUsuario.expiresIn) : undefined) ??
        usuarioAtual?.tokenExpiresAt,
      uid: dadosUsuario.uid,
    }));
  }

  function logout() {
    setUsuario(null);
  }

  function adicionarHistorico(
    produtos: (Produto & { quantidade?: number })[],
    dadosCompra: DadosCompra
  ) {
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

  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

  const recarregarUsuario = useCallback(async () => {
    const usuarioAtual = usuarioRef.current;

    if (!usuarioAtual?.uid || !usuarioAtual.idToken) return;
    if (recarregandoUsuarioRef.current) return;

    recarregandoUsuarioRef.current = true;

    try {
      const dadosRemotos = await obterDadosUsuarioFirestore({
        email: usuarioAtual.email,
        idToken: usuarioAtual.idToken,
        uid: usuarioAtual.uid,
      });

      setUsuario((usuarioMaisRecente) => {
        if (!usuarioMaisRecente || usuarioMaisRecente.uid !== usuarioAtual.uid) {
          return usuarioMaisRecente;
        }

        if (serializarPerfil(usuarioMaisRecente) === serializarPerfil(dadosRemotos)) {
          return usuarioMaisRecente;
        }

        return {
          ...usuarioMaisRecente,
          ...dadosRemotos,
          cartaoPadrao: normalizarCartao(dadosRemotos.cartaoPadrao),
          enderecoPadrao: normalizarEndereco(dadosRemotos.enderecoPadrao),
        };
      });
    } catch (error) {
      console.warn("Nao foi possivel atualizar os dados do usuario.", error);
    } finally {
      recarregandoUsuarioRef.current = false;
    }
  }, []);

  useEffect(() => {
    const intervalo = setInterval(() => {
      void recarregarUsuario();
    }, INTERVALO_ATUALIZACAO_USUARIO_MS);

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void recarregarUsuario();
      }
    });

    return () => {
      clearInterval(intervalo);
      appStateSubscription.remove();
    };
  }, [recarregarUsuario]);

  useEffect(() => {
    if (!usuario?.refreshToken || !usuario.tokenExpiresAt) return;

    const tempoAteRenovar = Math.max(usuario.tokenExpiresAt - Date.now() - 5 * 60 * 1000, 30 * 1000);
    const timer = setTimeout(async () => {
      try {
        const tokens = await renovarTokenFirebase(usuario.refreshToken ?? "");

        setUsuario((usuarioAtual) => {
          if (!usuarioAtual) return usuarioAtual;

          return {
            ...usuarioAtual,
            idToken: tokens.idToken,
            refreshToken: tokens.refreshToken,
            tokenExpiresAt: calcularExpiracaoToken(tokens.expiresIn),
            uid: tokens.localId || usuarioAtual.uid,
          };
        });
      } catch (error) {
        console.warn("Nao foi possivel renovar a sessao Firebase.", error);
      }
    }, tempoAteRenovar);

    return () => clearTimeout(timer);
  }, [usuario?.refreshToken, usuario?.tokenExpiresAt]);

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
