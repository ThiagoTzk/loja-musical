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

type Usuario = {
  email: string;
  fotoPerfil: string | null;
  historico: ItemHistoricoCompra[];
  idToken?: string;
  refreshToken?: string;
  uid?: string;
};

type UsuarioSalvo = Usuario & {
  senha: string;
};

type UsuarioContextType = {
  usuario: Usuario | null;
  login: (email: string, senha: string) => true | string;
  cadastrar: (email: string, senha: string) => true | string;
  sincronizarUsuario: (dados: string | Partial<Usuario>) => void;
  logout: () => void;
  adicionarHistorico: (produtos: Produto[], dadosCompra: DadosCompra) => void;
  atualizarFotoPerfil: (fotoPerfil: string) => void;
};

export const UsuarioContext = createContext<UsuarioContextType>(
  {} as UsuarioContextType
);

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [usuarios, setUsuarios] = useState<UsuarioSalvo[]>([
    {
      email: "thiago@thiago.com",
      fotoPerfil: null,
      senha: "thiago1234!",
      historico: [] as ItemHistoricoCompra[],
    },
  ]);

  function login(email: string, senha: string): true | string {
    const user = usuarios.find((u) => u.email === email);

    if (!user) return "Email nao existente";

    if (user.senha !== senha) return "Senha incorreta";

    setUsuario({
      email: user.email,
      fotoPerfil: user.fotoPerfil,
      historico: user.historico,
    });

    return true;
  }

  function cadastrar(email: string, senha: string): true | string {
    const existe = usuarios.find((u) => u.email === email);

    if (existe) return "Email ja cadastrado";

    const novoUsuario = {
      email,
      fotoPerfil: null,
      senha,
      historico: [] as ItemHistoricoCompra[],
    };

    setUsuarios([...usuarios, novoUsuario]);

    setUsuario({
      email,
      fotoPerfil: null,
      historico: [],
    });

    return true;
  }

  function sincronizarUsuario(dados: string | Partial<Usuario>) {
    const email = typeof dados === "string" ? dados : dados.email ?? "";
    const dadosUsuario = typeof dados === "string" ? {} : dados;
    const user = usuarios.find((u) => u.email === email);

    if (user) {
      setUsuario({
        email: user.email,
        fotoPerfil: user.fotoPerfil,
        historico: user.historico,
        idToken: dadosUsuario.idToken,
        refreshToken: dadosUsuario.refreshToken,
        uid: dadosUsuario.uid,
      });
      return;
    }

    const novoUsuario = {
      email,
      fotoPerfil: null,
      senha: "",
      historico: [] as ItemHistoricoCompra[],
    };

    setUsuarios([...usuarios, novoUsuario]);

    setUsuario({
      email,
      fotoPerfil: null,
      historico: [],
      idToken: dadosUsuario.idToken,
      refreshToken: dadosUsuario.refreshToken,
      uid: dadosUsuario.uid,
    });
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
    const historico = [...itensComprados, ...usuario.historico];

    setUsuario({
      ...usuario,
      historico,
    });

    setUsuarios((usuariosAtuais) =>
      usuariosAtuais.map((user) =>
        user.email === usuario.email ? { ...user, historico } : user
      )
    );
  }

  function atualizarFotoPerfil(fotoPerfil: string) {
    if (!usuario) return;

    setUsuario({
      ...usuario,
      fotoPerfil,
    });

    setUsuarios((usuariosAtuais) =>
      usuariosAtuais.map((user) =>
        user.email === usuario.email ? { ...user, fotoPerfil } : user
      )
    );
  }

  return (
    <UsuarioContext.Provider
      value={{
        usuario,
        login,
        cadastrar,
        sincronizarUsuario,
        logout,
        adicionarHistorico,
        atualizarFotoPerfil,
      }}
    >
      {children}
    </UsuarioContext.Provider>
  );
}
