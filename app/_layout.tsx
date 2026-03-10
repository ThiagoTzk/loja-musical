import { CarrinhoProvider } from "@/src/context/CarrinhoContext";
import { ThemeProvider } from "@/src/context/ThemeContext";
import { UsuarioProvider } from "@/src/context/UsuarioContext";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <UsuarioProvider>
        <CarrinhoProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </CarrinhoProvider>
      </UsuarioProvider>
    </ThemeProvider>
  );
}