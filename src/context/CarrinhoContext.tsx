import { createContext, ReactNode, useState } from "react";

export type Produto = {
  nome: string;
  preco: string;
  imagem: any;
};

type CarrinhoContextType = {
  carrinho: Produto[];
  adicionarProduto: (produto: Produto) => void;
  removerProduto: (index: number) => void;
  limparCarrinho: () => void;
};

export const CarrinhoContext = createContext<CarrinhoContextType>(
  {} as CarrinhoContextType
);

export function CarrinhoProvider({ children }: { children: ReactNode }) {

  const [carrinho, setCarrinho] = useState<Produto[]>([]);

  function adicionarProduto(produto: Produto) {
    setCarrinho([...carrinho, produto]);
  }

  function removerProduto(index: number) {
    const novo = carrinho.filter((_, i) => i !== index);
    setCarrinho(novo);
  }

  function limparCarrinho() {
    setCarrinho([]);
  }

  return (
    <CarrinhoContext.Provider
      value={{
        carrinho,
        adicionarProduto,
        removerProduto,
        limparCarrinho
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}