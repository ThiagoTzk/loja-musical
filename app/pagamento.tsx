import { AccessibleButton } from "@/components/accessible-button";
import { FocusablePressable } from "@/components/focusable-pressable";
import { CarrinhoContext } from "@/src/context/CarrinhoContext";
import { LanguageContext } from "@/src/context/LanguageContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import {
  EnderecoPadrao,
  formatarEndereco,
  UsuarioContext,
} from "@/src/context/UsuarioContext";
import { buscarEnderecoPorCep } from "@/src/services/cep";
import { criarPedidoFirestore } from "@/src/services/firestore";
import { cpfValido } from "@/src/utils/cpf";
import { formatarMoeda, precoParaNumero } from "@/src/utils/preco";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext, useEffect, useState, type ComponentProps } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IconName = ComponentProps<typeof Ionicons>["name"];
type ModoCartao = "padrao" | "outro";

const PARCELAS = Array.from({ length: 10 }, (_, index) => String(index + 1));
const PAGAMENTO_CREDITO = "Crédito";
const PAGAMENTO_PIX = "Pix";

const enderecoVazio: EnderecoPadrao = {
  bairro: "",
  cep: "",
  cidade: "",
  complemento: "",
  estado: "",
  numero: "",
  rua: "",
};

function apenasNumeros(valor: string) {
  return valor.replace(/\D/g, "");
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

function cartaoMascarado(valor: string) {
  const numeros = apenasNumeros(valor);

  if (numeros.length < 16) return "**** **** **** ****";

  return `**** **** **** ${numeros.slice(-4)}`;
}

export default function Pagamento() {
  const { language, t } = useContext(LanguageContext);
  const { colors } = useContext(ThemeContext);
  const { carrinho, removerProduto, limparCarrinho } = useContext(CarrinhoContext);
  const { usuario, adicionarHistorico } = useContext(UsuarioContext);

  const [endereco, setEndereco] = useState<EnderecoPadrao>(
    usuario?.enderecoPadrao ?? enderecoVazio
  );
  const [formaPagamento, setFormaPagamento] = useState("");
  const [modoCartao, setModoCartao] = useState<ModoCartao>(
    usuario?.cartaoPadrao ? "padrao" : "outro"
  );
  const [parcelas, setParcelas] = useState("");
  const [numeroCartao, setNumeroCartao] = useState("");
  const [cvv, setCvv] = useState("");
  const [validade, setValidade] = useState("");
  const [erro, setErro] = useState("");
  const [erroCep, setErroCep] = useState("");
  const [mensagemCep, setMensagemCep] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [mostrarPopup, setMostrarPopup] = useState(false);

  const total = carrinho.reduce((acc, item) => acc + precoParaNumero(item.preco), 0);
  const quantidadeItens = carrinho.length;
  const usaCartao = formaPagamento !== PAGAMENTO_PIX && formaPagamento !== "";
  const usaParcelas = formaPagamento === PAGAMENTO_CREDITO;
  const usandoCartaoPadrao = usaCartao && modoCartao === "padrao" && Boolean(usuario?.cartaoPadrao);
  const cpfUsuario = usuario?.cpf ?? "";
  const enderecoResumo = formatarEndereco(endereco);
  const quantidadeLabel =
    language === "en"
      ? quantidadeItens === 1
        ? "1 selected item"
        : `${quantidadeItens} selected items`
      : quantidadeItens === 1
        ? "1 item selecionado"
        : `${quantidadeItens} itens selecionados`;
  const formasPagamento: {
    detalhe: string;
    icon: IconName;
    titulo: string;
    valor: string;
  }[] = [
    {
      detalhe: t("checkout.creditDetail"),
      icon: "card",
      titulo: t("checkout.credit"),
      valor: PAGAMENTO_CREDITO,
    },
    {
      detalhe: t("checkout.debitDetail"),
      icon: "wallet",
      titulo: t("checkout.debit"),
      valor: "Débito",
    },
    {
      detalhe: t("checkout.pixDetail"),
      icon: "qr-code",
      titulo: t("checkout.pix"),
      valor: PAGAMENTO_PIX,
    },
  ];

  function textoFormaPagamento(valor: string) {
    if (valor === PAGAMENTO_CREDITO) return t("checkout.credit");
    if (valor === PAGAMENTO_PIX) return t("checkout.pix");
    return t("checkout.debit");
  }

  function textoParcelas(valor: string) {
    return language === "en" ? `${valor}x interest-free` : `${valor}x sem juros`;
  }

  useEffect(() => {
    const cepLimpo = apenasNumeros(endereco.cep);

    if (cepLimpo.length !== 8) {
      setBuscandoCep(false);
      setErroCep("");
      setMensagemCep("");
      return;
    }

    let ativo = true;
    setBuscandoCep(true);

    const timer = setTimeout(async () => {
      try {
        const dadosEndereco = await buscarEnderecoPorCep(endereco.cep);

        if (!ativo) return;

        setEndereco((enderecoAtual) => ({
          ...enderecoAtual,
          bairro: dadosEndereco.bairro || enderecoAtual.bairro,
          cep: dadosEndereco.cep || enderecoAtual.cep,
          cidade: dadosEndereco.cidade || enderecoAtual.cidade,
          complemento: enderecoAtual.complemento || dadosEndereco.complemento || "",
          estado: dadosEndereco.estado || enderecoAtual.estado,
          rua: dadosEndereco.rua || enderecoAtual.rua,
        }));
        setErroCep("");
        setMensagemCep(t("cep.found"));
      } catch {
        if (!ativo) return;

        setMensagemCep("");
        setErroCep(t("cep.error"));
      } finally {
        if (ativo) {
          setBuscandoCep(false);
        }
      }
    }, 450);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [endereco.cep, t]);

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

  function formatarCEP(valor: string) {
    return apenasNumeros(valor)
      .slice(0, 8)
      .replace(/(\d{5})(\d{1,3})/, "$1-$2");
  }

  function enderecoCompleto(enderecoAtual: EnderecoPadrao) {
    return Boolean(
      enderecoAtual.rua.trim() &&
        enderecoAtual.numero.trim() &&
        enderecoAtual.bairro.trim() &&
        enderecoAtual.cidade.trim() &&
        enderecoAtual.estado.trim()
    );
  }

  function atualizarEndereco(campo: keyof EnderecoPadrao, valor: string) {
    if (campo === "cep") {
      setMensagemCep("");
      setErroCep("");
    }

    setEndereco((enderecoAtual) => ({
      ...enderecoAtual,
      [campo]: campo === "cep" ? formatarCEP(valor) : valor,
    }));
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
      return;
    }

    setModoCartao(usuario?.cartaoPadrao ? "padrao" : "outro");
  }

  function validar() {
    if (carrinho.length === 0) return t("checkout.cartEmptyError");
    if (!cpfValido(cpfUsuario)) {
      return t("checkout.cpfError");
    }
    if (!enderecoCompleto(endereco)) {
      return t("checkout.addressError");
    }
    if (!formaPagamento) return t("checkout.paymentError");

    if (formaPagamento !== PAGAMENTO_PIX) {
      if (modoCartao === "padrao") {
        if (!usuario?.cartaoPadrao) return t("checkout.defaultCardError");
      } else {
        if (!numeroCartao || !cvv || !validade) return t("checkout.cardDataError");
        if (apenasNumeros(numeroCartao).length < 16) return t("checkout.cardIncompleteError");
        if (!cartaoValido(numeroCartao)) {
          return t("checkout.cardInvalidError");
        }
        if (apenasNumeros(cvv).length < 3) return t("checkout.cvvError");
        if (validade.length < 5) return t("checkout.validityIncompleteError");
        if (!validadeCartaoValida(validade)) return t("checkout.validityError");
      }
      if (formaPagamento === PAGAMENTO_CREDITO && !parcelas) return t("checkout.installmentsError");
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

    const descricaoPagamento =
      usandoCartaoPadrao && usuario.cartaoPadrao
        ? `${textoFormaPagamento(formaPagamento)} - ${usuario.cartaoPadrao.apelido} ${t("checkout.cardFinal")} ${usuario.cartaoPadrao.ultimos4}`
        : textoFormaPagamento(formaPagamento);

    try {
      await criarPedidoFirestore({
        cpf: cpfUsuario,
        endereco: enderecoResumo,
        formaPagamento: descricaoPagamento,
        parcelas: formaPagamento === PAGAMENTO_CREDITO ? parcelas : undefined,
        produtos: carrinho,
        total,
        usuario,
      });

      adicionarHistorico(carrinho, {
        formaPagamento: descricaoPagamento,
        parcelas: formaPagamento === PAGAMENTO_CREDITO ? parcelas : undefined,
      });
      limparCarrinho();
      setMostrarConfirmacao(false);
      setMostrarPopup(true);
    } catch (error) {
      console.warn("Nao foi possivel salvar o pedido no Firestore.", error);
      setMostrarConfirmacao(false);
      setErro(t("checkout.firebaseError"));
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.hero,
              {
                backgroundColor: colors.cardStrong,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroText}>
                <Text style={[styles.kicker, { color: colors.accent }]}>{t("checkout.secure")}</Text>
                <Text accessibilityRole="header" style={[styles.titulo, { color: colors.text }]}>{t("checkout.title")}</Text>
                <Text style={[styles.subtitulo, { color: colors.secondaryText }]}>{t("checkout.subtitle")}</Text>
              </View>

              <View style={[styles.secureBadge, { backgroundColor: colors.card }]}>
                <Ionicons
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  name="shield-checkmark"
                  size={18}
                  color={colors.success}
                />
                <Text style={[styles.secureText, { color: colors.text }]}>{t("checkout.secure")}</Text>
              </View>
            </View>

            <View style={styles.checkoutSteps}>
              {[t("checkout.summary"), t("checkout.delivery"), t("checkout.paymentStep")].map((etapa, index) => (
                <View key={etapa} style={styles.checkoutStep}>
                  <View
                    style={[
                      styles.stepNumber,
                      {
                        backgroundColor: colors.accent,
                        borderColor: colors.borderStrong,
                      },
                    ]}
                  >
                    <Text style={[styles.stepNumberText, { color: colors.accentText }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepLabel, { color: colors.secondaryText }]}>{etapa}</Text>
                </View>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View>
              <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>{t("checkout.total")}</Text>
              <Text accessibilityLiveRegion="polite" style={[styles.summaryTotal, { color: colors.text }]}>
                {formatarMoeda(total)}
              </Text>
            </View>
            <View style={[styles.summaryPill, { backgroundColor: colors.backgroundSoft }]}>
              <Text style={[styles.summaryPillText, { color: colors.secondaryText }]}>
                {quantidadeLabel}
              </Text>
            </View>
          </View>

          {!cpfValido(cpfUsuario) && (
            <View
              style={[
                styles.profileWarning,
                { backgroundColor: colors.dangerBackground, borderColor: colors.danger },
              ]}
            >
              <Ionicons
                accessibilityElementsHidden
                importantForAccessibility="no"
                name="alert-circle"
                size={22}
                color={colors.danger}
              />
              <View style={styles.profileWarningText}>
                <Text style={[styles.warningTitle, { color: colors.danger }]}>{t("checkout.cpfRequired")}</Text>
                <Text style={[styles.helperText, { color: colors.danger }]}>
                  {t("checkout.cpfRequiredText")}
                </Text>
              </View>
              <AccessibleButton
                accessibilityHint={t("checkout.editProfileHint")}
                onPress={() => router.push("/dados-conta")}
                style={styles.warningButton}
                textStyle={styles.warningButtonText}
                variant="danger"
              >
                {t("common.edit")}
              </AccessibleButton>
            </View>
          )}

          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                {t("checkout.productsSelected")}
              </Text>
              <Text style={[styles.sectionMeta, { color: colors.mutedText }]}>
                {quantidadeItens} {quantidadeItens === 1 ? t("common.item") : t("common.items")}
              </Text>
            </View>

            {carrinho.length === 0 && (
              <View style={[styles.emptyCartBox, { backgroundColor: colors.backgroundSoft }]}>
                <Text accessibilityRole="summary" style={[styles.emptyCart, { color: colors.secondaryText }]}>
                  {t("checkout.emptyCart")}
                </Text>
                <AccessibleButton
                  accessibilityHint={t("checkout.emptyCartBackHint")}
                  onPress={() => router.push("/(tabs)")}
                  style={styles.shopButton}
                  variant="secondary"
                >
                  {t("common.viewProducts")}
                </AccessibleButton>
              </View>
            )}

            {carrinho.map((item, index) => (
              <View
                key={`${item.id}-${index}`}
                style={[
                  styles.produto,
                  { backgroundColor: colors.backgroundSoft, borderColor: colors.border },
                ]}
              >
                <Image
                  accessibilityLabel={language === "en" ? `Product image ${item.nome}` : `Imagem do produto ${item.nome}`}
                  accessibilityRole="image"
                  source={item.imagem}
                  style={[styles.imagem, { backgroundColor: colors.card }]}
                />

                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]}>{item.nome}</Text>
                  <Text style={[styles.productCategory, { color: colors.secondaryText }]}>
                    {item.categoria}
                  </Text>
                  <Text style={[styles.productPrice, { color: colors.text }]}>{item.preco}</Text>
                </View>

                <FocusablePressable
                  accessibilityHint={t("checkout.removeProductHint")}
                  accessibilityLabel={language === "en" ? `Remove ${item.nome}` : `Remover ${item.nome}`}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => removerProduto(index)}
                  style={({ pressed }) => [
                    styles.iconButton,
                    {
                      backgroundColor: colors.dangerBackground,
                      borderColor: colors.danger,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                    name="trash-outline"
                    size={20}
                    color={colors.danger}
                  />
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
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>{t("checkout.delivery")}</Text>
            <Text style={[styles.sectionHint, { color: colors.secondaryText }]}>{t("checkout.deliveryHint")}</Text>

            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, styles.flexField]}>
                <Text style={[styles.label, { color: colors.text }]}>CEP</Text>
                <TextInput
                  accessibilityLabel={t("checkout.deliveryCepLabel")}
                  keyboardType="numeric"
                  onChangeText={(text) => atualizarEndereco("cep", text)}
                  placeholder="00000-000"
                  placeholderTextColor={colors.mutedText}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={endereco.cep}
                />
                {(buscandoCep || mensagemCep !== "" || erroCep !== "") && (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[
                      styles.cepStatus,
                      { color: erroCep ? colors.danger : colors.secondaryText },
                    ]}
                  >
                    {buscandoCep ? t("cep.loading") : erroCep || mensagemCep}
                  </Text>
                )}
              </View>

              <View style={[styles.fieldGroup, styles.stateField]}>
                <Text style={[styles.label, { color: colors.text }]}>UF</Text>
                <TextInput
                  accessibilityLabel={t("checkout.deliveryStateLabel")}
                  autoCapitalize="characters"
                  maxLength={2}
                  onChangeText={(text) => atualizarEndereco("estado", text.toUpperCase())}
                  placeholder="SP"
                  placeholderTextColor={colors.mutedText}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={endereco.estado}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t("account.street")}</Text>
              <TextInput
                accessibilityLabel={t("checkout.deliveryStreetLabel")}
                autoCapitalize="words"
                onChangeText={(text) => atualizarEndereco("rua", text)}
                placeholder={t("account.streetPlaceholder")}
                placeholderTextColor={colors.mutedText}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={endereco.rua}
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, styles.numberField]}>
                <Text style={[styles.label, { color: colors.text }]}>{t("account.number")}</Text>
                <TextInput
                  accessibilityLabel={t("checkout.deliveryNumberLabel")}
                  onChangeText={(text) => atualizarEndereco("numero", text)}
                  placeholder="123"
                  placeholderTextColor={colors.mutedText}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={endereco.numero}
                />
              </View>

              <View style={[styles.fieldGroup, styles.flexField]}>
                <Text style={[styles.label, { color: colors.text }]}>{t("account.neighborhood")}</Text>
                <TextInput
                  accessibilityLabel={t("checkout.deliveryNeighborhoodLabel")}
                  autoCapitalize="words"
                  onChangeText={(text) => atualizarEndereco("bairro", text)}
                  placeholder={t("account.neighborhoodPlaceholder")}
                  placeholderTextColor={colors.mutedText}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={endereco.bairro}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t("account.city")}</Text>
              <TextInput
                accessibilityLabel={t("checkout.deliveryCityLabel")}
                autoCapitalize="words"
                onChangeText={(text) => atualizarEndereco("cidade", text)}
                placeholder={t("account.cityPlaceholder")}
                placeholderTextColor={colors.mutedText}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={endereco.cidade}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t("account.complement")}</Text>
              <TextInput
                accessibilityLabel={t("checkout.deliveryComplementLabel")}
                onChangeText={(text) => atualizarEndereco("complemento", text)}
                placeholder={t("account.complementPlaceholder")}
                placeholderTextColor={colors.mutedText}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={endereco.complemento}
              />
            </View>
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>{t("checkout.payment")}</Text>
            <Text style={[styles.sectionHint, { color: colors.secondaryText }]}>{t("checkout.paymentHint")}</Text>

            <View accessibilityRole="radiogroup" style={styles.paymentOptions}>
              {formasPagamento.map((opcao) => {
                const selected = formaPagamento === opcao.valor;

                return (
                  <FocusablePressable
                    accessibilityHint={language === "en" ? `Selects payment by ${opcao.titulo}.` : `Seleciona pagamento por ${opcao.titulo}.`}
                    accessibilityLabel={opcao.titulo}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    hitSlop={6}
                    key={opcao.valor}
                    onPress={() => selecionarPagamento(opcao.valor)}
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
                      name={opcao.icon}
                      size={23}
                      color={selected ? colors.accentText : colors.secondaryText}
                    />
                    <Text
                      style={[
                        styles.paymentText,
                        { color: selected ? colors.accentText : colors.text },
                      ]}
                    >
                      {opcao.titulo}
                    </Text>
                    <Text
                      style={[
                        styles.paymentDetail,
                        { color: selected ? colors.accentText : colors.secondaryText },
                      ]}
                    >
                      {opcao.detalhe}
                    </Text>
                  </FocusablePressable>
                );
              })}
            </View>

            {usaCartao && (
              <View style={styles.cardFields}>
                <View accessibilityRole="radiogroup" style={styles.cardChoiceGrid}>
                  {usuario?.cartaoPadrao && (
                    <FocusablePressable
                      accessibilityHint={t("checkout.useDefaultCardHint")}
                      accessibilityLabel={t("checkout.useDefaultCard")}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: modoCartao === "padrao" }}
                      onPress={() => setModoCartao("padrao")}
                      style={({ pressed }) => [
                        styles.cardChoice,
                        {
                          backgroundColor:
                            modoCartao === "padrao" ? colors.accent : colors.inputBackground,
                          borderColor:
                            modoCartao === "padrao" ? colors.borderStrong : colors.border,
                          opacity: pressed ? 0.84 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cardChoiceTitle,
                          { color: modoCartao === "padrao" ? colors.accentText : colors.text },
                        ]}
                      >{t("checkout.useDefaultCard")}</Text>
                      <Text
                        style={[
                          styles.cardChoiceText,
                          {
                            color:
                              modoCartao === "padrao"
                                ? colors.accentText
                                : colors.secondaryText,
                          },
                        ]}
                      >
                        {usuario.cartaoPadrao.apelido} {t("checkout.cardFinal")} {usuario.cartaoPadrao.ultimos4}
                      </Text>
                    </FocusablePressable>
                  )}

                  <FocusablePressable
                    accessibilityHint={t("checkout.useAnotherCardHint")}
                    accessibilityLabel={t("checkout.useAnotherCard")}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: modoCartao === "outro" }}
                    onPress={() => setModoCartao("outro")}
                    style={({ pressed }) => [
                      styles.cardChoice,
                      {
                        backgroundColor:
                          modoCartao === "outro" ? colors.accent : colors.inputBackground,
                        borderColor:
                          modoCartao === "outro" ? colors.borderStrong : colors.border,
                        opacity: pressed ? 0.84 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cardChoiceTitle,
                        { color: modoCartao === "outro" ? colors.accentText : colors.text },
                      ]}
                    >{t("checkout.useAnotherCard")}</Text>
                    <Text
                      style={[
                        styles.cardChoiceText,
                        {
                          color:
                            modoCartao === "outro"
                            ? colors.accentText
                            : colors.secondaryText,
                        },
                      ]}
                    >{t("checkout.typeAtPurchase")}</Text>
                  </FocusablePressable>
                </View>

                <View style={styles.cardPreview}>
                  <View style={styles.cardPreviewHeader}>
                    <Text style={styles.cardPreviewBrand}>BlackTone Pay</Text>
                    <Ionicons
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                      name="radio-outline"
                      size={21}
                      color="#F8FAFC"
                    />
                  </View>
                  <Text style={styles.cardPreviewNumber}>
                    {usandoCartaoPadrao && usuario?.cartaoPadrao
                      ? `**** **** **** ${usuario.cartaoPadrao.ultimos4}`
                      : cartaoMascarado(numeroCartao)}
                  </Text>
                  <View style={styles.cardPreviewFooter}>
                    <Text style={styles.cardPreviewMeta}>
                      {t("account.cardExpiration")}
                      {usandoCartaoPadrao && usuario?.cartaoPadrao
                        ? usuario.cartaoPadrao.validade
                        : validade || "MM/AA"}
                    </Text>
                    <Text style={styles.cardPreviewMeta}>{textoFormaPagamento(formaPagamento)}</Text>
                  </View>
                </View>

                {modoCartao === "outro" && (
                  <>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>{t("checkout.cardNumber")}</Text>
                  <TextInput
                    accessibilityHint={t("checkout.cardNumberHint")}
                    accessibilityLabel={t("checkout.cardNumber")}
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
                  <Text style={[styles.helperText, { color: colors.secondaryText }]}>
                    {t("checkout.cardTestHint")}
                  </Text>
                </View>

                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, styles.flexField]}>
                    <Text style={[styles.label, { color: colors.text }]}>CVV</Text>
                    <TextInput
                      accessibilityHint={t("checkout.cvvHint")}
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
                    <Text style={[styles.label, { color: colors.text }]}>{t("account.cardExpiration")}</Text>
                    <TextInput
                      accessibilityHint={t("checkout.cardValidityHint")}
                      accessibilityLabel={t("account.cardExpirationLabel")}
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
                  </>
                )}

                {usaParcelas && (
                  <>
                    <Text style={[styles.label, styles.installmentLabel, { color: colors.text }]}>{t("checkout.installments")}</Text>
                    <View accessibilityRole="radiogroup" style={styles.installmentsGrid}>
                      {PARCELAS.map((opcao) => {
                        const selected = parcelas === opcao;

                        return (
                          <FocusablePressable
                            accessibilityHint={language === "en" ? `Select ${opcao} interest-free installment${opcao === "1" ? "" : "s"}.` : `Seleciona ${opcao} parcela${opcao === "1" ? "" : "s"} sem juros.`}
                            accessibilityLabel={textoParcelas(opcao)}
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

          <View
            style={[
              styles.finalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View>
              <Text style={[styles.finalLabel, { color: colors.secondaryText }]}>{t("checkout.finalTotal")}</Text>
              <Text style={[styles.finalTotal, { color: colors.text }]}>
                {formatarMoeda(total)}
              </Text>
            </View>
            <AccessibleButton
              accessibilityHint={t("checkout.reviewHint")}
              disabled={carrinho.length === 0 || finalizando}
              onPress={solicitarConfirmacao}
              style={styles.confirmButton}
            >
              {finalizando ? t("checkout.finalizing") : t("checkout.review")}
            </AccessibleButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        onRequestClose={() => setMostrarConfirmacao(false)}
        transparent
        visible={mostrarConfirmacao}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.overlay }]}>
          <View
            accessibilityLabel={t("checkout.reviewModalLabel")}
            accessibilityRole="alert"
            accessibilityViewIsModal
            accessible
            style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("checkout.reviewTitle")}</Text>
            <Text style={[styles.modalText, { color: colors.secondaryText }]}>{t("checkout.reviewText")}</Text>

            <View style={[styles.reviewBox, { borderColor: colors.border }]}>
              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.secondaryText }]}>{t("common.total")}</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>{formatarMoeda(total)}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.secondaryText }]}>{t("checkout.items")}</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>{quantidadeItens}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.secondaryText }]}>{t("checkout.method")}</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>
                  {usandoCartaoPadrao && usuario?.cartaoPadrao
                    ? `${textoFormaPagamento(formaPagamento)} - ${usuario.cartaoPadrao.apelido} ${t("checkout.cardFinal")} ${usuario.cartaoPadrao.ultimos4}`
                    : textoFormaPagamento(formaPagamento)}
                </Text>
              </View>
              {usaParcelas && (
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: colors.secondaryText }]}>{t("checkout.installments")}</Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{textoParcelas(parcelas)}</Text>
                </View>
              )}
              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, { color: colors.secondaryText }]}>CPF</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>{cpfUsuario}</Text>
              </View>
              <View style={styles.reviewBlock}>
                <Text style={[styles.reviewLabel, { color: colors.secondaryText }]}>{t("checkout.delivery")}</Text>
                <Text style={[styles.reviewValue, { color: colors.text }]}>{enderecoResumo}</Text>
              </View>
            </View>

            <AccessibleButton
              accessibilityHint={t("checkout.backAndEditHint")}
              disabled={finalizando}
              onPress={() => setMostrarConfirmacao(false)}
              style={styles.modalButton}
              variant="secondary"
            >{t("checkout.backAndEdit")}</AccessibleButton>

            <AccessibleButton
              accessibilityHint={t("checkout.confirmOrderHint")}
              disabled={finalizando}
              onPress={finalizar}
              style={styles.modalButton}
            >
              {finalizando ? t("checkout.finalizing") : t("checkout.confirmOrder")}
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

            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("checkout.successTitle")}</Text>
            <Text style={[styles.modalText, { color: colors.secondaryText }]}>{t("checkout.successText")}</Text>

            <AccessibleButton
              accessibilityHint={t("checkout.goHomeHint")}
              onPress={() => router.replace("/(tabs)")}
              style={styles.modalButton}
            >{t("checkout.goHome")}</AccessibleButton>

            <AccessibleButton
              accessibilityHint={t("checkout.goHistoryHint")}
              onPress={() => router.replace("/(tabs)/perfil")}
              style={styles.modalButton}
              variant="secondary"
            >{t("checkout.goHistory")}</AccessibleButton>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardChoice: {
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    minHeight: 78,
    minWidth: 140,
    padding: 12,
  },
  cardChoiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  cardChoiceText: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  cardChoiceTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  cardFields: {
    marginTop: 16,
  },
  cardPreview: {
    backgroundColor: "#111827",
    borderColor: "#334155",
    borderRadius: 24,
    borderWidth: 1,
    gap: 28,
    marginBottom: 4,
    padding: 18,
  },
  cardPreviewBrand: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  cardPreviewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardPreviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardPreviewMeta: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "800",
  },
  cardPreviewNumber: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  checkoutStep: {
    alignItems: "center",
    flex: 1,
    gap: 7,
  },
  checkoutSteps: {
    flexDirection: "row",
    gap: 8,
    marginTop: 22,
  },
  cepStatus: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  confirmButton: {
    flex: 1,
    minWidth: 150,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  emptyCart: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  emptyCartBox: {
    alignItems: "center",
    borderRadius: 18,
    gap: 14,
    padding: 18,
  },
  error: {
    borderRadius: 16,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
    marginBottom: 16,
    padding: 14,
  },
  fieldGroup: {
    gap: 8,
    marginTop: 14,
  },
  finalCard: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "space-between",
    padding: 16,
  },
  finalLabel: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  finalTotal: {
    fontSize: 25,
    fontWeight: "900",
    marginTop: 2,
  },
  flexField: {
    flex: 1,
  },
  hero: {
    borderRadius: 30,
    borderWidth: 1,
    elevation: 6,
    marginBottom: 16,
    padding: 20,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  heroText: {
    flex: 1,
  },
  heroTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  helperText: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  imagem: {
    borderRadius: 16,
    height: 68,
    resizeMode: "contain",
    width: 68,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  installmentLabel: {
    marginTop: 16,
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
  installmentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  keyboardView: {
    flex: 1,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  label: {
    fontSize: 15,
    fontWeight: "900",
  },
  modalBox: {
    alignItems: "center",
    borderRadius: 26,
    borderWidth: 1,
    maxWidth: 400,
    padding: 24,
    width: "100%",
  },
  modalButton: {
    marginTop: 12,
    width: "100%",
  },
  modalContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    marginTop: 8,
    textAlign: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 12,
    textAlign: "center",
  },
  numberField: {
    width: 106,
  },
  paymentDetail: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
    textAlign: "center",
  },
  paymentOption: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 7,
    minHeight: 98,
    minWidth: 96,
    padding: 12,
  },
  paymentOptions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  paymentText: {
    fontSize: 15,
    fontWeight: "900",
  },
  produto: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    padding: 10,
  },
  productCategory: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "900",
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 7,
  },
  profileWarning: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    padding: 12,
  },
  profileWarningText: {
    flex: 1,
  },
  reviewBlock: {
    gap: 4,
    marginTop: 3,
  },
  reviewBox: {
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginBottom: 4,
    marginTop: 8,
    padding: 14,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  reviewRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  reviewValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
    textAlign: "right",
  },
  rowFields: {
    flexDirection: "row",
    gap: 12,
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
    gap: 12,
  },
  sectionHint: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6,
  },
  sectionMeta: {
    fontSize: 13,
    fontWeight: "900",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
  },
  secureBadge: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  secureText: {
    fontSize: 12,
    fontWeight: "900",
  },
  shopButton: {
    alignSelf: "stretch",
  },
  stateField: {
    width: 86,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "900",
  },
  stepNumber: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: "900",
  },
  subtitulo: {
    fontSize: 15,
    lineHeight: 22,
  },
  summaryCard: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    marginBottom: 16,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  summaryPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryPillText: {
    fontSize: 12,
    fontWeight: "900",
  },
  summaryTotal: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 8,
  },
  warningButton: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warningButtonText: {
    fontSize: 13,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
});
