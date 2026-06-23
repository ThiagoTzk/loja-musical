import { Produto, produtos as produtosLocais } from "@/src/data/produto";
import { listarProdutosFirestore } from "@/src/services/firestore";
import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

type OrigemProdutos = "firestore" | "local";

type RecarregarProdutosOpcoes = {
  silencioso?: boolean;
};

type ProdutosContextType = {
  carregando: boolean;
  erro: string;
  origem: OrigemProdutos;
  produtos: Produto[];
  recarregarProdutos: (opcoes?: RecarregarProdutosOpcoes) => Promise<void>;
};

export const ProdutosContext = createContext<ProdutosContextType>(
  {} as ProdutosContextType
);

const INTERVALO_ATUALIZACAO_PRODUTOS_MS = 8000;

export function ProdutosProvider({ children }: { children: ReactNode }) {
  const [produtos, setProdutos] = useState<Produto[]>(produtosLocais);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [origem, setOrigem] = useState<OrigemProdutos>("local");
  const carregandoRef = useRef(false);
  const montadoRef = useRef(true);

  const recarregarProdutos = useCallback(async (opcoes: RecarregarProdutosOpcoes = {}) => {
    if (carregandoRef.current) return;

    carregandoRef.current = true;

    if (!opcoes.silencioso) {
      setCarregando(true);
    }

    try {
      const produtosFirestore = await listarProdutosFirestore();

      if (!montadoRef.current) return;

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
      if (!montadoRef.current) return;

      const firebaseError = error as { code?: string; message?: string };

      if (!opcoes.silencioso) {
        setProdutos(produtosLocais);
        setOrigem("local");
      }

      setErro(
        `${firebaseError.code ?? "firestore/unknown"}: ${
          firebaseError.message ?? "Nao foi possivel carregar produtos do Firestore."
        }`
      );
    } finally {
      if (montadoRef.current && !opcoes.silencioso) {
        setCarregando(false);
      }

      carregandoRef.current = false;
    }
  }, []);

  useEffect(() => {
    void recarregarProdutos();

    const intervalo = setInterval(() => {
      void recarregarProdutos({ silencioso: true });
    }, INTERVALO_ATUALIZACAO_PRODUTOS_MS);

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void recarregarProdutos({ silencioso: true });
      }
    });

    return () => {
      montadoRef.current = false;
      clearInterval(intervalo);
      appStateSubscription.remove();
    };
  }, [recarregarProdutos]);

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
