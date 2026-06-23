import { AccessibleButton } from "@/components/accessible-button";
import { FocusablePressable } from "@/components/focusable-pressable";
import {
  EnderecoPadrao,
  UsuarioContext,
} from "@/src/context/UsuarioContext";
import { LanguageContext } from "@/src/context/LanguageContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { buscarEnderecoPorCep } from "@/src/services/cep";
import { atualizarDadosPerfilUsuarioFirestore } from "@/src/services/firestore";
import { cpfValido } from "@/src/utils/cpf";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const enderecoVazio: EnderecoPadrao = {
  bairro: "",
  cep: "",
  cidade: "",
  complemento: "",
  estado: "",
  numero: "",
  rua: "",
};

type SecaoConta = "todas" | "pessoal" | "endereco" | "cartao";

function apenasNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function formatarCPF(valor: string) {
  let cpf = apenasNumeros(valor).slice(0, 11);

  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

  return cpf;
}

function formatarDataNascimento(valor: string) {
  let data = apenasNumeros(valor).slice(0, 8);

  if (data.length >= 5) {
    data = data.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
  } else if (data.length >= 3) {
    data = data.replace(/(\d{2})(\d{1,2})/, "$1/$2");
  }

  return data;
}

function dataNascimentoValida(valor: string) {
  const [diaTexto, mesTexto, anoTexto] = valor.split("/");
  const dia = Number(diaTexto);
  const mes = Number(mesTexto);
  const ano = Number(anoTexto);

  if (!diaTexto || !mesTexto || !anoTexto || anoTexto.length !== 4) return false;
  if (ano < 1900 || ano > new Date().getFullYear()) return false;
  if (mes < 1 || mes > 12) return false;

  const data = new Date(ano, mes - 1, dia);

  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia &&
    data <= new Date()
  );
}

function formatarCEP(valor: string) {
  return apenasNumeros(valor)
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})/, "$1-$2");
}

function enderecoTemValor(endereco: EnderecoPadrao) {
  return Object.values(endereco).some((valor) => valor.trim() !== "");
}

export default function DadosConta() {
  const { t } = useContext(LanguageContext);
  const { colors } = useContext(ThemeContext);
  const { atualizarDadosPerfil, usuario } = useContext(UsuarioContext);
  const { secao } = useLocalSearchParams<{ secao?: string }>();

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState<EnderecoPadrao>(enderecoVazio);
  const [cartaoApelido, setCartaoApelido] = useState("");
  const [cartaoBandeira, setCartaoBandeira] = useState("");
  const [cartaoTitular, setCartaoTitular] = useState("");
  const [cartaoUltimos4, setCartaoUltimos4] = useState("");
  const [cartaoValidade, setCartaoValidade] = useState("");
  const [erro, setErro] = useState("");
  const [erroCep, setErroCep] = useState("");
  const [mensagemCep, setMensagemCep] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const secaoAtual: SecaoConta =
    secao === "pessoal" || secao === "endereco" || secao === "cartao"
      ? secao
      : "todas";
  const mostraPessoal = secaoAtual === "todas" || secaoAtual === "pessoal";
  const mostraEndereco = secaoAtual === "todas" || secaoAtual === "endereco";
  const mostraCartao = secaoAtual === "todas" || secaoAtual === "cartao";
  const tituloTela =
    secaoAtual === "pessoal"
      ? t("account.personal")
      : secaoAtual === "endereco"
        ? t("account.address")
        : secaoAtual === "cartao"
          ? t("account.card")
          : t("account.header");
  const subtituloTela =
    secaoAtual === "pessoal"
      ? t("account.personalHint")
      : secaoAtual === "endereco"
        ? t("account.addressHint")
        : secaoAtual === "cartao"
          ? t("account.cardHint")
          : t("account.subtitle");

  useEffect(() => {
    if (!usuario) return;

    setNome(usuario.nome ?? "");
    setCpf(usuario.cpf ?? "");
    setDataNascimento(usuario.dataNascimento ?? "");
    setTelefone(usuario.telefone ?? "");
    setEndereco(usuario.enderecoPadrao ?? enderecoVazio);
    setCartaoApelido(usuario.cartaoPadrao?.apelido ?? "");
    setCartaoBandeira(usuario.cartaoPadrao?.bandeira ?? "");
    setCartaoTitular(usuario.cartaoPadrao?.titular ?? "");
    setCartaoUltimos4(usuario.cartaoPadrao?.ultimos4 ?? "");
    setCartaoValidade(usuario.cartaoPadrao?.validade ?? "");
  }, [usuario]);

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

  function validarFormulario() {
    if (mostraPessoal && nome.trim().length > 0 && nome.trim().length < 3) {
      return t("account.nameError");
    }

    if (mostraPessoal && cpf && !cpfValido(cpf)) {
      return t("account.cpfError");
    }

    if (mostraPessoal && dataNascimento && !dataNascimentoValida(dataNascimento)) {
      return t("account.birthDateError");
    }

    const querSalvarCartao = mostraCartao && Boolean(
      cartaoApelido.trim() ||
        cartaoBandeira.trim() ||
        cartaoTitular.trim() ||
        cartaoUltimos4.trim() ||
        cartaoValidade.trim()
    );

    if (querSalvarCartao && apenasNumeros(cartaoUltimos4).length !== 4) {
      return t("account.cardLastFourError");
    }

    if (querSalvarCartao && cartaoValidade.trim().length < 5) {
      return t("account.cardExpirationError");
    }

    return null;
  }

  async function salvar() {
    if (!usuario) {
      router.replace("/login");
      return;
    }

    if (!usuario.uid || !usuario.idToken) {
      setErro(t("account.loginAgainError"));
      return;
    }

    const erroFormulario = validarFormulario();

    if (erroFormulario) {
      setErro(erroFormulario);
      return;
    }

    setErro("");
    setSucesso("");
    setSalvando(true);

    const enderecoLimpo: EnderecoPadrao = {
      bairro: endereco.bairro.trim(),
      cep: endereco.cep.trim(),
      cidade: endereco.cidade.trim(),
      complemento: endereco.complemento.trim(),
      estado: endereco.estado.trim().toUpperCase().slice(0, 2),
      numero: endereco.numero.trim(),
      rua: endereco.rua.trim(),
    };
    const ultimos4 = apenasNumeros(cartaoUltimos4).slice(-4);
    const cartaoPadrao = ultimos4
      ? {
          apelido: cartaoApelido.trim() || t("account.cardDefaultName"),
          bandeira: cartaoBandeira.trim() || t("account.cardDefaultBrand"),
          titular: cartaoTitular.trim(),
          ultimos4,
          validade: cartaoValidade.trim(),
        }
      : null;

    try {
      const dadosSalvos = await atualizarDadosPerfilUsuarioFirestore(usuario, {
        cartaoPadrao,
        cpf: cpf.trim(),
        dataNascimento: dataNascimento.trim(),
        enderecoPadrao: enderecoTemValor(enderecoLimpo) ? enderecoLimpo : null,
        nome: nome.trim(),
        telefone: telefone.trim(),
      });

      atualizarDadosPerfil(dadosSalvos);
      setCartaoUltimos4(cartaoPadrao?.ultimos4 ?? "");
      setEndereco(dadosSalvos.enderecoPadrao ?? enderecoVazio);
      setSucesso(t("account.saved"));
    } catch (error) {
      console.warn("Nao foi possivel salvar dados da conta.", error);
      setErro(t("account.saveError"));
    } finally {
      setSalvando(false);
    }
  }

  if (!usuario) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{t("account.loginRequiredTitle")}</Text>
          <Text style={[styles.description, { color: colors.secondaryText }]}>{t("account.loginRequiredText")}</Text>
          <AccessibleButton onPress={() => router.replace("/login")}>{t("common.goToLogin")}</AccessibleButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FocusablePressable
            accessibilityHint={t("account.backHint")}
            accessibilityLabel={t("common.back")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.72 : 1 }]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>{t("common.back")}</Text>
          </FocusablePressable>

          <View style={[styles.hero, { backgroundColor: colors.cardStrong, borderColor: colors.border }]}>
            <View style={[styles.heroIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="person-circle" size={34} color={colors.accentText} />
            </View>
            <View style={styles.heroText}>
              <Text style={[styles.kicker, { color: colors.accent }]}>{t("account.myAccount")}</Text>
              <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{tituloTela}</Text>
              <Text style={[styles.description, { color: colors.secondaryText }]}>{subtituloTela}</Text>
            </View>
          </View>

          {mostraPessoal && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("account.personal")}</Text>
            <Text style={[styles.sectionHint, { color: colors.secondaryText }]}>{t("account.personalHint")}</Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t("account.fullName")}</Text>
              <TextInput
                accessibilityLabel={t("account.fullName")}
                autoCapitalize="words"
                editable={!salvando}
                onChangeText={setNome}
                placeholder={t("account.namePlaceholder")}
                placeholderTextColor={colors.mutedText}
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                value={nome}
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, styles.flexField]}>
                <Text style={[styles.label, { color: colors.text }]}>{t("account.cpf")}</Text>
                <TextInput
                  accessibilityLabel={t("account.cpf")}
                  editable={!salvando}
                  keyboardType="numeric"
                  onChangeText={(text) => setCpf(formatarCPF(text))}
                  placeholder="000.000.000-00"
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  value={cpf}
                />
              </View>

              <View style={[styles.fieldGroup, styles.flexField]}>
                <Text style={[styles.label, { color: colors.text }]}>{t("account.birthDate")}</Text>
                <TextInput
                  accessibilityLabel={t("account.birthDateLabel")}
                  editable={!salvando}
                  keyboardType="numeric"
                  onChangeText={(text) => setDataNascimento(formatarDataNascimento(text))}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  value={dataNascimento}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t("account.phone")}</Text>
              <TextInput
                accessibilityLabel={t("account.phone")}
                editable={!salvando}
                keyboardType="phone-pad"
                onChangeText={setTelefone}
                placeholder="(00) 00000-0000"
                placeholderTextColor={colors.mutedText}
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                value={telefone}
              />
            </View>
          </View>
          )}

          {mostraEndereco && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("account.address")}</Text>
            <Text style={[styles.sectionHint, { color: colors.secondaryText }]}>{t("account.addressHint")}</Text>

            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, styles.flexField]}>
                <Text style={[styles.label, { color: colors.text }]}>CEP</Text>
                <TextInput
                  accessibilityLabel="CEP"
                  editable={!salvando}
                  keyboardType="numeric"
                  onChangeText={(text) => atualizarEndereco("cep", text)}
                  placeholder="00000-000"
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
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
                <Text style={[styles.label, { color: colors.text }]}>{t("account.state")}</Text>
                <TextInput
                  accessibilityLabel={t("account.state")}
                  autoCapitalize="characters"
                  editable={!salvando}
                  maxLength={2}
                  onChangeText={(text) => atualizarEndereco("estado", text.toUpperCase())}
                  placeholder="SP"
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  value={endereco.estado}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t("account.street")}</Text>
              <TextInput
                accessibilityLabel={t("account.street")}
                autoCapitalize="words"
                editable={!salvando}
                onChangeText={(text) => atualizarEndereco("rua", text)}
                placeholder={t("account.streetPlaceholder")}
                placeholderTextColor={colors.mutedText}
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                value={endereco.rua}
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, styles.numberField]}>
                <Text style={[styles.label, { color: colors.text }]}>{t("account.number")}</Text>
                <TextInput
                  accessibilityLabel={t("checkout.deliveryNumberLabel")}
                  editable={!salvando}
                  onChangeText={(text) => atualizarEndereco("numero", text)}
                  placeholder={t("account.numberPlaceholder")}
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  value={endereco.numero}
                />
              </View>

              <View style={[styles.fieldGroup, styles.flexField]}>
                <Text style={[styles.label, { color: colors.text }]}>{t("account.neighborhood")}</Text>
                <TextInput
                  accessibilityLabel={t("account.neighborhood")}
                  autoCapitalize="words"
                  editable={!salvando}
                  onChangeText={(text) => atualizarEndereco("bairro", text)}
                  placeholder={t("account.neighborhoodPlaceholder")}
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  value={endereco.bairro}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t("account.city")}</Text>
              <TextInput
                accessibilityLabel={t("account.city")}
                autoCapitalize="words"
                editable={!salvando}
                onChangeText={(text) => atualizarEndereco("cidade", text)}
                placeholder={t("account.cityPlaceholder")}
                placeholderTextColor={colors.mutedText}
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                value={endereco.cidade}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t("account.complement")}</Text>
              <TextInput
                accessibilityLabel={t("checkout.deliveryComplementLabel")}
                editable={!salvando}
                onChangeText={(text) => atualizarEndereco("complemento", text)}
                placeholder={t("account.complementPlaceholder")}
                placeholderTextColor={colors.mutedText}
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                value={endereco.complemento}
              />
            </View>
          </View>
          )}

          {mostraCartao && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("account.card")}</Text>
            <Text style={[styles.sectionHint, { color: colors.secondaryText }]}>{t("account.cardHint")}</Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t("account.cardNickname")}</Text>
              <TextInput
                accessibilityLabel={t("account.cardNicknameLabel")}
                editable={!salvando}
                onChangeText={setCartaoApelido}
                placeholder={t("account.cardNicknamePlaceholder")}
                placeholderTextColor={colors.mutedText}
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                value={cartaoApelido}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t("account.cardholder")}</Text>
              <TextInput
                accessibilityLabel={t("account.cardholder")}
                autoCapitalize="characters"
                editable={!salvando}
                onChangeText={setCartaoTitular}
                placeholder={t("account.cardholderPlaceholder")}
                placeholderTextColor={colors.mutedText}
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                value={cartaoTitular}
              />
            </View>

            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, styles.flexField]}>
                <Text style={[styles.label, { color: colors.text }]}>{t("account.cardBrand")}</Text>
                <TextInput
                  accessibilityLabel={t("account.cardBrandLabel")}
                  editable={!salvando}
                  onChangeText={setCartaoBandeira}
                  placeholder={t("account.cardBrandPlaceholder")}
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  value={cartaoBandeira}
                />
              </View>

              <View style={[styles.fieldGroup, styles.flexField]}>
                <Text style={[styles.label, { color: colors.text }]}>{t("account.cardLastFour")}</Text>
                <TextInput
                  accessibilityLabel={t("account.cardLastFourLabel")}
                  editable={!salvando}
                  keyboardType="numeric"
                  maxLength={4}
                  onChangeText={(text) => setCartaoUltimos4(apenasNumeros(text).slice(0, 4))}
                  placeholder="4242"
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  value={cartaoUltimos4}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t("account.cardExpiration")}</Text>
              <TextInput
                accessibilityLabel={t("account.cardExpirationLabel")}
                editable={!salvando}
                keyboardType="numeric"
                onChangeText={(text) => setCartaoValidade(formatarDataNascimento(text).slice(0, 5))}
                placeholder="MM/AA"
                placeholderTextColor={colors.mutedText}
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                value={cartaoValidade}
              />
            </View>
          </View>
          )}

          {erro !== "" && (
            <Text accessibilityRole="alert" style={[styles.message, { backgroundColor: colors.dangerBackground, color: colors.danger }]}>{erro}</Text>
          )}

          {sucesso !== "" && (
            <Text accessibilityLiveRegion="polite" style={[styles.message, { backgroundColor: colors.successBackground, color: colors.success }]}>{sucesso}</Text>
          )}

          <AccessibleButton
            accessibilityHint={t("account.saveHint")}
            disabled={salvando}
            onPress={salvar}
            style={styles.saveButton}
          >
            {salvando ? t("common.saving") : t("account.save")}
          </AccessibleButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
    minHeight: 44,
  },
  backText: {
    fontSize: 16,
    fontWeight: "900",
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 38,
  },
  cepStatus: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  description: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 6,
  },
  fieldGroup: {
    gap: 8,
    marginTop: 14,
  },
  flexField: {
    flex: 1,
  },
  hero: {
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
    padding: 18,
  },
  heroIcon: {
    alignItems: "center",
    borderRadius: 18,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  heroText: {
    flex: 1,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  keyboardView: {
    flex: 1,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  label: {
    fontSize: 14,
    fontWeight: "900",
  },
  message: {
    borderRadius: 16,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 14,
    padding: 14,
  },
  numberField: {
    width: 106,
  },
  rowFields: {
    flexDirection: "row",
    gap: 12,
  },
  saveButton: {
    marginTop: 2,
  },
  sectionHint: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
  },
  stateField: {
    width: 86,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 34,
  },
});

