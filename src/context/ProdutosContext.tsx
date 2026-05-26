import { Produto, produtos as produtosLocais } from "@/src/data/produto";
import { listarProdutosFirestore } from "@/src/services/firestore";
import { createContext, ReactNode, useEffect, useState } from "react";

type OrigemProdutos = "firestore" | "local";

type ProdutosContextType = {
  carregando: boolean;
  erro: string;
  origem: OrigemProdutos;
  produtos: Produto[];
  recarregarProdutos: () => Promise<void>;
};

export const ProdutosContext = createContext<ProdutosContextType>(
  {} as ProdutosContextType
);

export function ProdutosProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>(produtosLocais);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [origem, setOrigem] = useState<OrigemProdutos>("local");

  async function recarregarProdutos() {
    setCarregando(true);

    try {
      const produtosFirestore = await listarProdutosFirestore();

      if (produtosFirestore.length > 0) {
        setProdutos(produtosFirestore);
        setOrigem("firestore");
        setErro("");
        return;
      }

      setProdutos(produtosLocais);
      setOrigem("local");
      setErro("firestore/empty: Nenhum produto cadastrado no Firestore.");
    } catch (error) {
      const firebaseError = error as { code?: string; message?: string };

      setProdutos(produtosLocais);
      setOrigem("local");
      setErro(
        `${firebaseError.code ?? "firestore/unknown"}: ${
          firebaseError.message ?? "Nao foi possivel carregar produtos do Firestore."
        }`
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void recarregarProdutos();
  }, []);

  return (
    <ProdutosContext.Provider
      value={{
        carregando,
        erro,
        origem,
        produtos,
        recarregarProdutos,
      }}
    >
      {children}
    </ProdutosContext.Provider>
  );
}
