import { AccessibleButton } from "@/components/accessible-button";
import { FocusablePressable } from "@/components/focusable-pressable";
import { CarrinhoContext } from "@/src/context/CarrinhoContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { criarPedidoFirestore } from "@/src/services/firestore";
import { formatarMoeda, precoParaNumero } from "@/src/utils/preco";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FORMAS_PAGAMENTO = ["Crédito", "Débito", "Pix"];
const PARCELAS = Array.from({ length: 10 }, (_, index) => String(index + 1));
const PAGAMENTO_CREDITO = FORMAS_PAGAMENTO[0];
const PAGAMENTO_PIX = FORMAS_PAGAMENTO[2];

function apenasNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function cpfValido(valor: string) {
  const cpf = apenasNumeros(valor);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  return true;
}

function cartaoValido(valor: string) {
  const numeros = apenasNumeros(valor);

  if (numeros.length !== 16) return false;

  let soma = 0;
  let dobrar = false;

  for (let index = numeros.length - 1; index >= 0; index -= 1) {
    let digito = Number(numeros[index]);

    if (dobrar) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }

    soma += digito;
    dobrar = !dobrar;
  }

  return soma % 10 === 0;
}

function validadeCartaoValida(valor: string) {
  const [mesTexto, anoTexto] = valor.split("/");
  const mes = Number(mesTexto);
  const ano = Number(anoTexto);

  if (!mesTexto || !anoTexto || mes < 1 || mes > 12) return false;

  const anoCompleto = 2000 + ano;
  const agora = new Date();
  const ultimoDiaDoMes = new Date(anoCompleto, mes, 0, 23, 59, 59);

  return ultimoDiaDoMes >= agora;
}

export default function Pagamento() {
  const { colors } = useContext(ThemeContext);
  const { carrinho, removerProduto, limparCarrinho } = useContext(CarrinhoContext);
  const { usuario, adicionarHistorico } = useContext(UsuarioContext);

  const [cpf, setCpf] = useState("");
  const [endereco, setEndereco] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [parcelas, setParcelas] = useState("");
  const [numeroCartao, setNumeroCartao] = useState("");
  const [cvv, setCvv] = useState("");
  const [validade, setValidade] = useState("");
  const [erro, setErro] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [mostrarPopup, setMostrarPopup] = useState(false);

  function formatarCPF(valor: string) {
    let v = apenasNumeros(valor).slice(0, 11);

    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    return v;
  }

  function formatarCartao(valor: string) {
    return apenasNumeros(valor)
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatarValidade(valor: string) {
    let v = apenasNumeros(valor).slice(0, 4);

    if (v.length >= 3) {
      v = v.replace(/(\d{2})(\d{1,2})/, "$1/$2");
    }

    return v;
  }

  function selecionarPagamento(opcao: string) {
    setFormaPagamento(opcao);
    setErro("");

    if (opcao !== PAGAMENTO_CREDITO) {
      setParcelas("");
    }

    if (opcao === PAGAMENTO_PIX) {
      setNumeroCartao("");
      setCvv("");
      setValidade("");
    }
  }

  function validar() {
    if (carrinho.length === 0) return "Seu carrinho está vazio";
    if (!cpfValido(cpf)) return "CPF inválido";
    if (endereco.trim().length < 5) return "Endereço muito curto";
    if (!formaPagamento) return "Selecione a forma de pagamento";

    if (formaPagamento !== PAGAMENTO_PIX) {
      if (!numeroCartao || !cvv || !validade) return "Preencha os dados do cartão";
      if (apenasNumeros(numeroCartao).length < 16) return "Número do cartão incompleto";
      if (!cartaoValido(numeroCartao)) return "Número do cartão inválido";
      if (apenasNumeros(cvv).length < 3) return "CVV incompleto";
      if (validade.length < 5) return "Validade incompleta";
      if (!validadeCartaoValida(validade)) return "Validade do cartão inválida ou vencida";
      if (formaPagamento === PAGAMENTO_CREDITO && !parcelas) return "Selecione as parcelas";
    }

    return null;
  }

  function solicitarConfirmacao() {
    if (!usuario) {
      router.push("/login");
      return;
    }

    const erroValidacao = validar();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setErro("");
    setMostrarConfirmacao(true);
  }

  async function finalizar() {
    if (finalizando) return;

    if (!usuario) {
      router.push("/login");
      return;
    }

    setFinalizando(true);
    setErro("");

    try {
      await criarPedidoFirestore({
        cpf,
        endereco,
        formaPagamento,
        parcelas: formaPagamento === PAGAMENTO_CREDITO ? parcelas : undefined,
        produtos: carrinho,
        total,
        usuario,
      });

      adicionarHistorico(carrinho, {
        formaPagamento,
        parcelas: formaPagamento === PAGAMENTO_CREDITO ? parcelas : undefined,
      });
      limparCarrinho();
      setMostrarConfirmacao(false);
      setMostrarPopup(true);
    } catch (error) {
      console.warn("Nao foi possivel salvar o pedido no Firestore.", error);
      setMostrarConfirmacao(false);
      setErro(
        "Nao foi possivel salvar o pedido no Firebase. Confira as regras do Firestore e tente novamente."
      );
    } finally {
      setFinalizando(false);
    }
  }

  const total = carrinho.reduce((acc, item) => acc + precoParaNumero(item.preco), 0);
  const usaCartao = formaPagamento !== PAGAMENTO_PIX && formaPagamento !== "";
  const usaParcelas = formaPagamento === PAGAMENTO_CREDITO;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={[styles.titulo, { color: colors.text }]}> 
          Pagamento
        </Text>
        <Text style={[styles.subtitulo, { color: colors.secondaryText }]}> 
          Complete os dados com calma. Campos e erros são anunciados para tecnologias assistivas.
        </Text>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}> 
              Resumo do pedido
            </Text>
            <Text style={[styles.total, { color: colors.text }]}>{formatarMoeda(total)}</Text>
          </View>

          {carrinho.length === 0 && (
            <Text accessibilityRole="summary" style={[styles.emptyCart, { color: colors.secondaryText }]}> 
              Seu carrinho está vazio.
            </Text>
          )}

          {carrinho.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.produto}>
              <Image
                accessibilityLabel={`Imagem do produto ${item.nome}`}
                accessibilityRole="image"
                source={item.imagem}
                style={[styles.imagem, { backgroundColor: colors.backgroundSoft }]}
              />

              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]}>{item.nome}</Text>
                <Text style={[styles.productPrice, { color: colors.secondaryText }]}> 
                  {item.preco}
                </Text>
              </View>

              <FocusablePressable
                accessibilityHint="Remove este produto do pedido."
                accessibilityLabel={`Remover ${item.nome}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => removerProduto(index)}
                style={({ pressed }) => [
                  styles.removeButton,
                  {
                    backgroundColor: colors.dangerBackground,
                    borderColor: colors.danger,
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                <Text style={[styles.removeText, { color: colors.danger }]}>Remover</Text>
              </FocusablePressable>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}> 
            Dados de entrega
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>CPF</Text>
            <TextInput
              accessibilityHint="Digite os 11 números do CPF. A máscara será aplicada automaticamente."
              accessibilityLabel="CPF"
              keyboardType="numeric"
              onChangeText={(text) => setCpf(formatarCPF(text))}
              placeholder="000.000.000-00"
              placeholderTextColor={colors.mutedText}
              returnKeyType="next"
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={cpf}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Endereço</Text>
            <TextInput
              accessibilityHint="Digite o endereço de entrega."
              accessibilityLabel="Endereço de entrega"
              autoCapitalize="words"
              onChangeText={setEndereco}
              placeholder="Rua, número, bairro e cidade"
              placeholderTextColor={colors.mutedText}
              returnKeyType="next"
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={endereco}
            />
          </View>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}> 
            Forma de pagamento
          </Text>

          <View accessibilityRole="radiogroup" style={styles.paymentOptions}>
            {FORMAS_PAGAMENTO.map((opcao) => {
              const selected = formaPagamento === opcao;

              return (
                <FocusablePressable
                  accessibilityHint={`Seleciona pagamento por ${opcao}.`}
                  accessibilityLabel={opcao}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  hitSlop={6}
                  key={opcao}
                  onPress={() => selecionarPagamento(opcao)}
                  style={({ pressed }) => [
                    styles.paymentOption,
                    {
                      backgroundColor: selected ? colors.accent : colors.inputBackground,
                      borderColor: selected ? colors.borderStrong : colors.border,
                      opacity: pressed ? 0.84 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                    name={selected ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={selected ? colors.accentText : colors.secondaryText}
                  />
                  <Text
                    style={[
                      styles.paymentText,
                      { color: selected ? colors.accentText : colors.text },
                    ]}
                  >
                    {opcao}
                  </Text>
                </FocusablePressable>
              );
            })}
          </View>

          {usaCartao && (
            <View style={styles.cardFields}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Número do cartão</Text>
                <TextInput
                  accessibilityHint="Digite os 16 números do cartão."
                  accessibilityLabel="Número do cartão"
                  keyboardType="numeric"
                  onChangeText={(text) => setNumeroCartao(formatarCartao(text))}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor={colors.mutedText}
                  returnKeyType="next"
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={numeroCartao}
                />
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.fieldGroup, styles.flexField]}>
                  <Text style={[styles.label, { color: colors.text }]}>CVV</Text>
                  <TextInput
                    accessibilityHint="Digite os três ou quatro números do código de segurança."
                    accessibilityLabel="CVV"
                    keyboardType="numeric"
                    maxLength={4}
                    onChangeText={(text) => setCvv(text.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    placeholderTextColor={colors.mutedText}
                    returnKeyType="next"
                    secureTextEntry
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={cvv}
                  />
                </View>

                <View style={[styles.fieldGroup, styles.flexField]}>
                  <Text style={[styles.label, { color: colors.text }]}>Validade</Text>
                  <TextInput
                    accessibilityHint="Digite mês e ano da validade no formato mês barra ano."
                    accessibilityLabel="Validade do cartão"
                    keyboardType="numeric"
                    onChangeText={(text) => setValidade(formatarValidade(text))}
                    placeholder="MM/AA"
                    placeholderTextColor={colors.mutedText}
                    returnKeyType="done"
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={validade}
                  />
                </View>
              </View>

              {usaParcelas && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Parcelas</Text>
                  <View accessibilityRole="radiogroup" style={styles.installmentsGrid}>
                    {PARCELAS.map((opcao) => {
                      const selected = parcelas === opcao;

                      return (
                        <FocusablePressable
                          accessibilityHint={`Seleciona ${opcao} parcela${opcao === "1" ? "" : "s"} sem juros.`}
                          accessibilityLabel={`${opcao}x sem juros`}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          hitSlop={6}
                          key={opcao}
                          onPress={() => setParcelas(opcao)}
                          style={({ pressed }) => [
                            styles.installmentOption,
                            {
                              backgroundColor: selected ? colors.accent : colors.inputBackground,
                              borderColor: selected ? colors.borderStrong : colors.border,
                              opacity: pressed ? 0.84 : 1,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.installmentText,
                              { color: selected ? colors.accentText : colors.text },
                            ]}
                          >
                            {opcao}x
                          </Text>
                        </FocusablePressable>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {erro !== "" && (
          <Text
            accessibilityRole="alert"
            style={[
              styles.error,
              { backgroundColor: colors.dangerBackground, color: colors.danger },
            ]}
          >
            {erro}
          </Text>
        )}

        <AccessibleButton
          accessibilityHint="Valida os dados e abre a revisão do pedido antes de concluir."
          disabled={carrinho.length === 0 || finalizando}
          onPress={solicitarConfirmacao}
          style={styles.confirmButton}
        >
          {finalizando ? "Finalizando pedido..." : "Confirmar pagamento"}
        </AccessibleButton>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setMostrarConfirmacao(false)}
        transparent
        visible={mostrarConfirmacao}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.overlay }]}> 
          <View
            accessibilityLabel="Revisar e confirmar pedido"
            accessibilityRole="alert"
            accessibilityViewIsModal
            accessible
            style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}> 
              Revisar pedido
            </Text>
            <Text style={[styles.modalText, { color: colors.secondaryText }]}> 
              Confira os dados antes de concluir a compra.
            </Text>

            <View style={[styles.reviewBox, { borderColor: colors.border }]}> 
              <Text style={[styles.reviewLine, { color: colors.text }]}> 
                Total: {formatarMoeda(total)}
              </Text>
              <Text style={[styles.reviewLine, { color: colors.text }]}> 
                Forma: {formaPagamento}
              </Text>
              {usaParcelas && (
                <Text style={[styles.reviewLine, { color: colors.text }]}> 
                  Parcelas: {parcelas}x sem juros
                </Text>
              )}
              <Text style={[styles.reviewLine, { color: colors.text }]}> 
                CPF: {cpf}
              </Text>
              <Text style={[styles.reviewLine, { color: colors.text }]}> 
                Endereço: {endereco}
              </Text>
            </View>

            <AccessibleButton
              accessibilityHint="Volta ao formulário de pagamento para corrigir os dados."
              disabled={finalizando}
              onPress={() => setMostrarConfirmacao(false)}
              style={styles.modalButton}
              variant="secondary"
            >
              Voltar e editar
            </AccessibleButton>

            <AccessibleButton
              accessibilityHint="Conclui a compra com os dados revisados."
              disabled={finalizando}
              onPress={finalizar}
              style={styles.modalButton}
            >
              {finalizando ? "Finalizando pedido..." : "Confirmar pedido"}
            </AccessibleButton>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setMostrarPopup(false)}
        transparent
        visible={mostrarPopup}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.overlay }]}> 
          <View
            accessibilityRole="alert"
            accessibilityViewIsModal
            accessible
            style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons
              accessibilityElementsHidden
              importantForAccessibility="no"
              name="checkmark-circle"
              size={54}
              color={colors.success}
            />

            <Text style={[styles.modalTitle, { color: colors.text }]}> 
              Compra realizada com sucesso!
            </Text>
            <Text style={[styles.modalText, { color: colors.secondaryText }]}> 
              Seu pedido foi salvo no histórico do perfil.
            </Text>

            <AccessibleButton
              accessibilityHint="Fecha o aviso e volta para a página inicial."
              onPress={() => router.replace("/(tabs)")}
              style={styles.modalButton}
            >
              Ir para Home
            </AccessibleButton>

            <AccessibleButton
              accessibilityHint="Fecha o aviso e abre o histórico no perfil."
              onPress={() => router.replace("/(tabs)/perfil")}
              style={styles.modalButton}
              variant="secondary"
            >
              Ir para histórico
            </AccessibleButton>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 22,
  },
  section: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
  },
  total: {
    fontSize: 20,
    fontWeight: "900",
  },
  produto: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  imagem: {
    borderRadius: 14,
    height: 64,
    resizeMode: "contain",
    width: 64,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "900",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  removeButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  removeText: {
    fontSize: 13,
    fontWeight: "900",
  },
  emptyCart: {
    fontSize: 15,
    lineHeight: 22,
  },
  fieldGroup: {
    gap: 8,
    marginTop: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: "900",
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  paymentOptions: {
    gap: 10,
    marginTop: 14,
  },
  paymentOption: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: "900",
  },
  cardFields: {
    marginTop: 6,
  },
  rowFields: {
    flexDirection: "row",
    gap: 12,
  },
  flexField: {
    flex: 1,
  },
  installmentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  installmentOption: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 58,
    paddingHorizontal: 14,
  },
  installmentText: {
    fontSize: 15,
    fontWeight: "900",
  },
  error: {
    borderRadius: 16,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
    marginBottom: 16,
    padding: 14,
  },
  confirmButton: {
    marginTop: 2,
  },
  modalContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    alignItems: "center",
    borderRadius: 26,
    borderWidth: 1,
    maxWidth: 380,
    padding: 24,
    width: "100%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    marginTop: 8,
    textAlign: "center",
  },
  modalButton: {
    marginTop: 12,
    width: "100%",
  },
  reviewBox: {
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    marginBottom: 4,
    marginTop: 8,
    padding: 14,
  },
  reviewLine: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
});
