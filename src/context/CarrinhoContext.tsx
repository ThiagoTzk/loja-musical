import { Produto } from "@/src/data/produto";
import { createContext, ReactNode, useState } from "react";

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
    setCarrinho((atual) => [...atual, produto]);
  }

  function removerProduto(index: number) {
    setCarrinho((atual) => atual.filter((_, i) => i !== index));
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
        limparCarrinho,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}
