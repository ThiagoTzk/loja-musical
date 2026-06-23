import { Produto } from "@/src/data/produto";
import { createContext, ReactNode, useState } from "react";

export type ItemCarrinho = Produto & {
  quantidade: number;
};

type CarrinhoContextType = {
  carrinho: ItemCarrinho[];
  adicionarProduto: (produto: Produto) => void;
  removerProduto: (index: number) => void;
  limparCarrinho: () => void;
};

export const CarrinhoContext = createContext<CarrinhoContextType>(
  {} as CarrinhoContextType
);

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  function adicionarProduto(produto: Produto) {
    setCarrinho((atual) => {
      const itemExistente = atual.find((item) => item.id === produto.id);

      if (!itemExistente) {
        return [...atual, { ...produto, quantidade: 1 }];
      }

      return atual.map((item) =>
        item.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      );
    });
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
