import { CarrinhoProvider } from "@/src/context/CarrinhoContext";
import { LanguageProvider } from "@/src/context/LanguageContext";
import { ProdutosProvider } from "@/src/context/ProdutosContext";
import { ThemeContext, ThemeProvider } from "@/src/context/ThemeContext";
import { UsuarioProvider } from "@/src/context/UsuarioContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useContext } from "react";

function ThemedStatusBar() {
  const { theme } = useContext(ThemeContext);

  // Ícones claros (brancos) no tema escuro, escuros (pretos) no tema claro,
  // para o relógio/bateria do SO ficarem sempre visíveis.
  return <StatusBar style={theme === "dark" ? "light" : "dark"} />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <UsuarioProvider>
          <ProdutosProvider>
            <CarrinhoProvider>
              <ThemedStatusBar />
              <Stack screenOptions={{ headerShown: false }} />
            </CarrinhoProvider>
          </ProdutosProvider>
        </UsuarioProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
