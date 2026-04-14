import { CarrinhoContext } from "@/src/context/CarrinhoContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { router } from "expo-router";
import { useContext, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Pagamento() {
  const { colors, theme } = useContext(ThemeContext);
  const { carrinho, removerProduto, limparCarrinho } =
    useContext(CarrinhoContext);
  const { usuario, adicionarHistorico } = useContext(UsuarioContext);

  const [cpf, setCpf] = useState("");
  const [endereco, setEndereco] = useState("");

  const [formaPagamento, setFormaPagamento] = useState("");
  const [parcelas, setParcelas] = useState("");

  const [mostrarPagamento, setMostrarPagamento] = useState(false);
  const [mostrarParcelas, setMostrarParcelas] = useState(false);

  const [numeroCartao, setNumeroCartao] = useState("");
  const [cvv, setCvv] = useState("");
  const [validade, setValidade] = useState("");

  const [erro, setErro] = useState("");
  const [mostrarPopup, setMostrarPopup] = useState(false);


  function formatarCPF(valor: string) {
    let v = valor.replace(/\D/g, "").slice(0, 11);

    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    return v;
  }

  function formatarCartao(valor: string) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatarValidade(valor: string) {
    let v = valor.replace(/\D/g, "").slice(0, 4);

    if (v.length >= 3) {
      v = v.replace(/(\d{2})(\d{1,2})/, "$1/$2");
    }

    return v;
  }

  function calcularTotal() {
    return carrinho.reduce((acc, item) => {
      const valor = parseFloat(
        item.preco.replace("R$", "").replace(",", ".")
      );
      return acc + valor;
    }, 0);
  }

  function validar() {
    if (cpf.length < 14) return "CPF inválido";
    if (endereco.length < 5) return "Endereço muito curto";
    if (!formaPagamento) return "Selecione a forma de pagamento";

    if (formaPagamento !== "Pix") {
      if (!numeroCartao || !cvv || !validade) {
        return "Preencha os dados do cartão";
      }
    }

    if (formaPagamento !== "Pix") {
      const p = Number(parcelas);
      if (!p || p < 1 || p > 10) return "Parcelas de 1 a 10";
    }

    return null;
  }

  function finalizar() {
    if (!usuario) {
      router.push("/login");
      return;
    }

    const erroValidacao = validar();
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    adicionarHistorico(carrinho);
    limparCarrinho();
    setMostrarPopup(true);
  }

  const total = calcularTotal();

 

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>

        <Text style={[styles.titulo, { color: colors.text }]}>
          Pagamento
        </Text>

        {carrinho.map((item, index) => (
          <View key={index} style={styles.produto}>
            <Image source={item.imagem} style={styles.imagem} />

            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text }}>{item.nome}</Text>
              <Text style={{ color: colors.text }}>{item.preco}</Text>
            </View>

            <Pressable onPress={() => removerProduto(index)}>
              <Text style={{ color: "red" }}>Remover</Text>
            </Pressable>
          </View>
        ))}

        <Text style={[styles.total, { color: colors.text }]}>
          Total: R$ {total.toFixed(2)}
        </Text>

        {/* CPF */}
        <TextInput
          placeholder="CPF"
          placeholderTextColor={colors.secondaryText}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.text,
              backgroundColor: colors.card,
            },
          ]}
          value={cpf}
          onChangeText={(text) => setCpf(formatarCPF(text))}
          keyboardType="numeric"
        />

        {/* ENDEREÇO */}
        <TextInput
          placeholder="Endereço"
          placeholderTextColor={colors.secondaryText}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.text,
              backgroundColor: colors.card,
            },
          ]}
          value={endereco}
          onChangeText={setEndereco}
        />

        {/* PAGAMENTO */}
        <Pressable
          style={[styles.select, { borderColor: colors.text }]}
          onPress={() => setMostrarPagamento(!mostrarPagamento)}
        >
          <Text style={{ color: colors.text }}>
            {formaPagamento || "Selecionar forma de pagamento"}
          </Text>
        </Pressable>

        {mostrarPagamento && (
          <View style={[styles.dropdown, { backgroundColor: colors.card }]}>
            {["Crédito", "Débito", "Pix"].map((opcao) => (
              <Pressable
                key={opcao}
                onPress={() => {
                  setFormaPagamento(opcao);
                  setMostrarPagamento(false);
                }}
              >
                <Text style={{ color: colors.text, padding: 10 }}>
                  {opcao}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* CARTÃO */}
        {formaPagamento !== "Pix" && formaPagamento !== "" && (
          <>
            <TextInput
              placeholder="Número do cartão"
              placeholderTextColor={colors.secondaryText}
              style={[styles.input, { color: colors.text, backgroundColor: colors.card }]}
              value={numeroCartao}
              onChangeText={(t) => setNumeroCartao(formatarCartao(t))}
              keyboardType="numeric"
            />

            <TextInput
              placeholder="CVV"
              placeholderTextColor={colors.secondaryText}
              style={[styles.input, { color: colors.text, backgroundColor: colors.card }]}
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
            />

            <TextInput
              placeholder="Validade (MM/AA)"
              placeholderTextColor={colors.secondaryText}
              style={[styles.input, { color: colors.text, backgroundColor: colors.card }]}
              value={validade}
              onChangeText={(t) => setValidade(formatarValidade(t))}
              keyboardType="numeric"
            />

            <Pressable
              style={[styles.select, { borderColor: colors.text }]}
              onPress={() => setMostrarParcelas(!mostrarParcelas)}
            >
              <Text style={{ color: colors.text }}>
                {parcelas ? `${parcelas}x` : "Selecionar parcelas"}
              </Text>
            </Pressable>

            {mostrarParcelas && (
              <View style={[styles.dropdown, { backgroundColor: colors.card }]}>
                {[...Array(10)].map((_, i) => (
                  <Pressable
                    key={i}
                    onPress={() => {
                      setParcelas(String(i + 1));
                      setMostrarParcelas(false);
                    }}
                  >
                    <Text style={{ color: colors.text, padding: 10 }}>
                      {i + 1}x sem juros
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}

        {erro !== "" && <Text style={{ color: "red" }}>{erro}</Text>}

        <Pressable
          style={[styles.botao, { backgroundColor: colors.accent }]}
          onPress={finalizar}
        >
          <Text style={styles.textoBotao}>
            Confirmar pagamento
          </Text>
        </Pressable>

      </ScrollView>

      {/* POPUP */}
      <Modal visible={mostrarPopup} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.card }
            ]}
          >
            <Text style={styles.check}>✅</Text>

            <Text style={{ color: colors.text, fontSize: 18 }}>
              Compra realizada com sucesso!
            </Text>

            <Pressable
              style={[styles.botaoModal, { backgroundColor: colors.accent }]}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text>Ir para Home</Text>
            </Pressable>

            <Pressable
              style={[styles.botaoModal, { backgroundColor: colors.accent }]}
              onPress={() => router.replace("/(tabs)/perfil")}
            >
              <Text>Ir para Histórico</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  titulo: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },

  produto: { flexDirection: "row", alignItems: "center", marginBottom: 15 },

  imagem: { width: 60, height: 60, marginRight: 10 },

  total: { fontSize: 20, fontWeight: "bold", marginVertical: 20 },

  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
  },

  select: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  dropdown: {
    borderRadius: 8,
    marginBottom: 10,
  },

  botao: {
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
  },

  textoBotao: { fontWeight: "bold" },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000aa",
  },

  modalBox: {
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
  },

  check: { fontSize: 40, marginBottom: 10 },

  botaoModal: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: 200,
    alignItems: "center",
  },
});