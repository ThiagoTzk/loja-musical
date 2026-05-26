import { CarrinhoProvider } from "@/src/context/CarrinhoContext";
import { ProdutosProvider } from "@/src/context/ProdutosContext";
import { ThemeProvider } from "@/src/context/ThemeContext";
import { UsuarioProvider } from "@/src/context/UsuarioContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <UsuarioProvider>
        <ProdutosProvider>
          <CarrinhoProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </CarrinhoProvider>
        </ProdutosProvider>
      </UsuarioProvider>
    </ThemeProvider>
  );
}
