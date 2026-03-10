import { createContext, ReactNode, useState } from "react";
import { Produto } from "./CarrinhoContext";

type Usuario = {
  email: string;
  historico: Produto[];
};

type UsuarioContextType = {
  usuario: Usuario | null;
  login: (email: string, senha: string) => true | string;
  cadastrar: (email: string, senha: string) => true | string;
  logout: () => void;
  adicionarHistorico: (produtos: Produto[]) => void;
};

export const UsuarioContext = createContext<UsuarioContextType>(
  {} as UsuarioContextType
);

export function UsuarioProvider({ children }: { children: ReactNode }) {

  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [usuarios, setUsuarios] = useState([
    {
      email: "thiago@thiago.com",
      senha: "thiago1234!",
      historico: [] as Produto[]
    }
  ]);

  function login(email: string, senha: string): true | string {

    const user = usuarios.find(u => u.email === email);

    if (!user) return "Email não existente";

    if (user.senha !== senha) return "Senha incorreta";

    setUsuario({
      email: user.email,
      historico: user.historico
    });

    return true;
  }

  function cadastrar(email: string, senha: string): true | string {

    const existe = usuarios.find(u => u.email === email);

    if (existe) return "Email já cadastrado";

    const novoUsuario = {
      email,
      senha,
      historico: [] as Produto[]
    };

    setUsuarios([...usuarios, novoUsuario]);

    setUsuario({
      email,
      historico: []
    });

    return true;
  }

  function logout() {
    setUsuario(null);
  }

  function adicionarHistorico(produtos: Produto[]) {

    if (!usuario) return;

    setUsuario({
      ...usuario,
      historico: [...usuario.historico, ...produtos]
    });
  }

  return (
    <UsuarioContext.Provider
      value={{
        usuario,
        login,
        cadastrar,
        logout,
        adicionarHistorico
      }}
    >
      {children}
    </UsuarioContext.Provider>
  );
}