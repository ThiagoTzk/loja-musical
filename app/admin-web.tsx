import { AccessibleButton } from "@/components/accessible-button";
import { BrandLogo } from "@/components/brand-logo";
import { FocusablePressable } from "@/components/focusable-pressable";
import { entrarUsuarioFirebase } from "@/src/config/firebase-config";
import { ProdutosContext } from "@/src/context/ProdutosContext";
import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import {
  atualizarLoginUsuarioFirestore,
  atualizarPermissaoAdminUsuarioFirestore,
  atualizarStatusPedidoFirestore,
  excluirPedidoFirestore,
  excluirProdutoAdminFirestore,
  listarPedidosAdminFirestore,
  listarProdutosAdminFirestore,
  listarUsuariosAdminFirestore,
  obterDadosUsuarioFirestore,
  Pedido,
  PedidoStatus,
  ProdutoAdmin,
  ProdutoAdminInput,
  salvarProdutoAdminFirestore,
  UsuarioAdmin,
} from "@/src/services/firestore";
import { descreverErroFirebaseAuth } from "@/src/utils/firebase-auth-errors";
import { formatarMoeda, precoParaNumero } from "@/src/utils/preco";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AbaAdminWeb = "visao" | "produtos" | "pedidos" | "usuarios";

type ProdutoFormWeb = {
  ativo: boolean;
  categoria: string;
  descricao: string;
  estoque: string;
  id: string;
  imagemLocal: string;
  imagemUrl: string;
  nome: string;
  ordem: string;
  parcelasMaximas: string;
  precoTexto: string;
};

const produtoVazio: ProdutoFormWeb = {
  ativo: true,
  categoria: "",
  descricao: "",
  estoque: "0",
  id: "",
  imagemLocal: "",
  imagemUrl: "",
  nome: "",
  ordem: "1",
  parcelasMaximas: "10",
  precoTexto: "",
};

function novoProdutoId(produtos: ProdutoAdmin[]) {
  const maiorIdNumerico = produtos.reduce((maior, produto) => {
    const numero = Number(produto.id);
    return Number.isFinite(numero) ? Math.max(maior, numero) : maior;
  }, 0);

  return String(maiorIdNumerico + 1 || Date.now());
}

function produtoParaForm(produto: ProdutoAdmin): ProdutoFormWeb {
  return {
    ativo: produto.ativo,
    categoria: produto.categoria,
    descricao: produto.descricao,
    estoque: String(produto.estoque ?? 0),
    id: produto.id,
    imagemLocal: produto.imagemLocal ?? produto.id,
    imagemUrl: produto.imagemUrl ?? "",
    nome: produto.nome,
    ordem: String(produto.ordem),
    parcelasMaximas: String(produto.parcelasMaximas ?? 10),
    precoTexto: produto.preco,
  };
}

function precoFormularioParaNumero(valor: string) {
  if (valor.includes("R$") || valor.includes(",")) {
    return precoParaNumero(valor);
  }

  return Number(valor.replace(/\s/g, "").replace(",", ".")) || 0;
}

function apenasNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function dataCurta(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "Sem data";

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function confirmarAcao(mensagem: string) {
  const confirm = (globalThis as unknown as { confirm?: (texto: string) => boolean }).confirm;
  return typeof confirm === "function" ? confirm(mensagem) : true;
}

function descreverErroAdmin(error: unknown) {
  if (error && typeof error === "object") {
    const erro = error as { code?: string; message?: string };
    const codigo = erro.code ? ` (${erro.code})` : "";

    if (erro.message) return `${erro.message}${codigo}`;
    if (codigo) return codigo.trim();
  }

  return "Erro desconhecido.";
}

function statusLabel(status: PedidoStatus) {
  const labels: Record<PedidoStatus, string> = {
    cancelado: "Cancelado",
    entregue: "Entregue",
    realizado: "Realizado",
  };

  return labels[status] ?? status;
}

export default function AdminWeb() {
  const { colors } = useContext(ThemeContext);
  const { recarregarProdutos } = useContext(ProdutosContext);
  const { logout, sincronizarUsuario, usuario } = useContext(UsuarioContext);

  const [aba, setAba] = useState<AbaAdminWeb>("visao");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregandoLogin, setCarregandoLogin] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [form, setForm] = useState<ProdutoFormWeb>(produtoVazio);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [buscaUsuario, setBuscaUsuario] = useState("");

  const abas = useMemo(
    () => [
      { id: "visao" as const, label: "Visao geral", icon: "analytics" as const },
      { id: "produtos" as const, label: "Produtos", icon: "pricetags" as const },
      { id: "pedidos" as const, label: "Pedidos", icon: "receipt" as const },
      { id: "usuarios" as const, label: "Usuarios", icon: "people" as const },
    ],
    []
  );

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();

    if (!termo) return produtos;

    return produtos.filter((produto) =>
      [produto.nome, produto.categoria, produto.id]
        .join(" ")
        .toLowerCase()
        .includes(termo)
    );
  }, [buscaProduto, produtos]);

  const usuariosFiltrados = useMemo(() => {
    const termo = buscaUsuario.trim().toLowerCase();

    if (!termo) return usuarios;

    return usuarios.filter((conta) =>
      [conta.nome, conta.email, conta.uid]
        .join(" ")
        .toLowerCase()
        .includes(termo)
    );
  }, [buscaUsuario, usuarios]);

  const produtosAtivos = produtos.filter((produto) => produto.ativo).length;
  const estoqueTotal = produtos.reduce((total, produto) => total + (produto.estoque ?? 0), 0);
  const usuariosAdmin = usuarios.filter((conta) => conta.admin).length;
  const totalPedidos = pedidos.reduce((total, pedido) => total + pedido.total, 0);
  const pedidosPendentes = pedidos.filter((pedido) => pedido.status === "realizado").length;

  const carregarAdmin = useCallback(async () => {
    if (!usuario?.admin) return;

    setCarregando(true);
    setErro("");

    try {
      const [produtosAdmin, pedidosAdmin, usuariosAdminLista] = await Promise.all([
        listarProdutosAdminFirestore(usuario),
        listarPedidosAdminFirestore(usuario),
        listarUsuariosAdminFirestore(usuario),
      ]);

      setProdutos(produtosAdmin);
      setPedidos(pedidosAdmin);
      setUsuarios(usuariosAdminLista);
      setForm((formAtual) => {
        if (formAtual.id) return formAtual;

        const id = novoProdutoId(produtosAdmin);

        return {
          ...produtoVazio,
          id,
          imagemLocal: id,
          ordem: String(produtosAdmin.length + 1),
        };
      });
    } catch (error) {
      console.warn("Nao foi possivel carregar o admin web.", error);
      setErro(`Nao foi possivel carregar o painel: ${descreverErroAdmin(error)}`);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    void carregarAdmin();
  }, [carregarAdmin]);

  async function entrarAdmin() {
    if (carregandoLogin) return;

    if (!email.trim() || !senha) {
      setErro("Informe email e senha para acessar o backoffice.");
      return;
    }

    setCarregandoLogin(true);
    setErro("");
    setSucesso("");

    try {
      const credencial = await entrarUsuarioFirebase(email.trim(), senha);
      await atualizarLoginUsuarioFirestore(credencial);
      const dadosPerfil = await obterDadosUsuarioFirestore({
        email: credencial.email,
        idToken: credencial.idToken,
        uid: credencial.localId,
      });

      sincronizarUsuario({
        ...dadosPerfil,
        email: credencial.email,
        expiresIn: credencial.expiresIn,
        idToken: credencial.idToken,
        refreshToken: credencial.refreshToken,
        uid: credencial.localId,
      });
    } catch (error) {
      setErro(descreverErroFirebaseAuth(error, "login", "pt"));
    } finally {
      setCarregandoLogin(false);
    }
  }

  function atualizarCampo(campo: keyof ProdutoFormWeb, valor: string | boolean) {
    setForm((formAtual) => ({
      ...formAtual,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    const id = novoProdutoId(produtos);

    setForm({
      ...produtoVazio,
      id,
      imagemLocal: id,
      ordem: String(produtos.length + 1),
    });
    setErro("");
    setSucesso("");
  }

  function editarProduto(produto: ProdutoAdmin) {
    setAba("produtos");
    setForm(produtoParaForm(produto));
    setErro("");
    setSucesso("");
  }

  function validarProduto() {
    const preco = precoFormularioParaNumero(form.precoTexto);
    const ordem = Number(form.ordem);
    const estoque = Number(form.estoque);
    const parcelasMaximas = Number(form.parcelasMaximas);

    if (!form.id.trim()) return "Informe o ID do produto.";
    if (!form.nome.trim()) return "Informe o nome do produto.";
    if (!form.categoria.trim()) return "Informe a categoria.";
    if (!form.descricao.trim()) return "Informe a descricao.";
    if (preco <= 0) return "Informe um preco valido.";
    if (!Number.isFinite(ordem) || ordem <= 0) return "Informe uma ordem valida.";
    if (!Number.isFinite(estoque) || estoque < 0) return "Informe um estoque valido.";
    if (!Number.isFinite(parcelasMaximas) || parcelasMaximas < 1) {
      return "Informe a quantidade maxima de parcelas.";
    }

    return null;
  }

  async function salvarProduto() {
    if (!usuario?.admin || salvando) return;

    const erroProduto = validarProduto();

    if (erroProduto) {
      setErro(erroProduto);
      setSucesso("");
      return;
    }

    const preco = precoFormularioParaNumero(form.precoTexto);
    const produto: ProdutoAdminInput = {
      ativo: form.ativo,
      categoria: form.categoria.trim(),
      descricao: form.descricao.trim(),
      estoque: Number(form.estoque),
      id: form.id.trim(),
      imagemLocal: form.imagemLocal.trim() || form.id.trim(),
      imagemUrl: form.imagemUrl.trim(),
      nome: form.nome.trim(),
      ordem: Number(form.ordem),
      parcelasMaximas: Number(form.parcelasMaximas),
      preco,
      precoTexto: formatarMoeda(preco),
    };

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      await salvarProdutoAdminFirestore(usuario, produto);
      await carregarAdmin();
      await recarregarProdutos();
      setSucesso("Produto salvo no Firestore.");
    } catch (error) {
      console.warn("Nao foi possivel salvar produto no admin web.", error);
      setErro(`Nao foi possivel salvar o produto: ${descreverErroAdmin(error)}`);
    } finally {
      setSalvando(false);
    }
  }

  async function alternarProduto(produto: ProdutoAdmin) {
    if (!usuario?.admin || salvando) return;

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      await salvarProdutoAdminFirestore(usuario, {
        ativo: !produto.ativo,
        categoria: produto.categoria,
        descricao: produto.descricao,
        estoque: produto.estoque ?? 0,
        id: produto.id,
        imagemLocal: produto.imagemLocal ?? produto.id,
        imagemUrl: produto.imagemUrl ?? "",
        nome: produto.nome,
        ordem: produto.ordem,
        parcelasMaximas: produto.parcelasMaximas ?? 10,
        preco: produto.precoNumero ?? precoParaNumero(produto.preco),
        precoTexto: produto.preco,
      });
      await carregarAdmin();
      await recarregarProdutos();
      setSucesso(produto.ativo ? "Produto desativado." : "Produto ativado.");
    } catch (error) {
      console.warn("Nao foi possivel alternar produto.", error);
      setErro(`Nao foi possivel alterar o produto: ${descreverErroAdmin(error)}`);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirProduto(produto: ProdutoAdmin) {
    if (!usuario?.admin || salvando) return;

    if (!confirmarAcao(`Excluir ${produto.nome}? Essa acao remove o produto do Firestore.`)) {
      return;
    }

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      await excluirProdutoAdminFirestore(usuario, produto.id);
      await carregarAdmin();
      await recarregarProdutos();
      setSucesso("Produto excluido.");
    } catch (error) {
      console.warn("Nao foi possivel excluir produto.", error);
      setErro(`Nao foi possivel excluir o produto: ${descreverErroAdmin(error)}`);
    } finally {
      setSalvando(false);
    }
  }

  async function alterarStatusPedido(pedido: Pedido, status: PedidoStatus) {
    if (!usuario?.admin || salvando) return;

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      await atualizarStatusPedidoFirestore(usuario, pedido.id, status);
      await carregarAdmin();
      setSucesso(`Pedido marcado como ${statusLabel(status).toLowerCase()}.`);
    } catch (error) {
      console.warn("Nao foi possivel atualizar pedido.", error);
      setErro(`Nao foi possivel atualizar o pedido: ${descreverErroAdmin(error)}`);
    } finally {
      setSalvando(false);
    }
  }

  async function removerPedido(pedido: Pedido) {
    if (!usuario?.admin || salvando) return;

    if (!confirmarAcao(`Excluir o pedido ${pedido.id}?`)) return;

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      await excluirPedidoFirestore(usuario, pedido.id);
      await carregarAdmin();
      setSucesso("Pedido excluido.");
    } catch (error) {
      console.warn("Nao foi possivel excluir pedido.", error);
      setErro(`Nao foi possivel excluir o pedido: ${descreverErroAdmin(error)}`);
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAdmin(conta: UsuarioAdmin) {
    if (!usuario?.admin || salvando) return;

    if (conta.uid === usuario.uid) {
      setErro("Voce nao pode remover o admin da propria conta logada.");
      return;
    }

    const proximoAdmin = !conta.admin;
    const mensagem = proximoAdmin
      ? `Promover ${conta.email} para admin?`
      : `Remover permissao admin de ${conta.email}?`;

    if (!confirmarAcao(mensagem)) return;

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      await atualizarPermissaoAdminUsuarioFirestore(usuario, conta.uid, proximoAdmin);
      await carregarAdmin();
      setSucesso(proximoAdmin ? "Usuario promovido a admin." : "Permissao admin removida.");
    } catch (error) {
      console.warn("Nao foi possivel alterar permissao admin.", error);
      setErro(`Nao foi possivel alterar o usuario: ${descreverErroAdmin(error)}`);
    } finally {
      setSalvando(false);
    }
  }

  function MetricCard({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
    return (
      <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.metricIcon, { backgroundColor: colors.backgroundSoft }]}>
          <Ionicons name={icon} size={20} color={colors.accent} />
        </View>
        <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>{label}</Text>
      </View>
    );
  }

  function StatusBadge({ ativo, label }: { ativo: boolean; label: string }) {
    return (
      <View style={[styles.statusBadge, { backgroundColor: ativo ? colors.successBackground : colors.dangerBackground }]}>
        <Text style={[styles.statusBadgeText, { color: ativo ? colors.success : colors.danger }]}>{label}</Text>
      </View>
    );
  }

  function Field({
    keyboard,
    label,
    onChange,
    value,
  }: {
    keyboard?: "default" | "numeric";
    label: string;
    onChange: (value: string) => void;
    value: string;
  }) {
    return (
      <View style={styles.fieldWrap}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <TextInput
          keyboardType={keyboard}
          onChangeText={onChange}
          placeholder={label}
          placeholderTextColor={colors.mutedText}
          style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
          value={value}
        />
      </View>
    );
  }

  if (Platform.OS !== "web") {
    return (
      <SafeAreaView style={[styles.nativeBlock, { backgroundColor: colors.background }]}>
        <View style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BrandLogo size={96} />
          <Text style={[styles.loginTitle, { color: colors.text }]}>Admin Web</Text>
          <Text style={[styles.loginText, { color: colors.secondaryText }]}>
            O painel administrativo foi separado do app mobile. Abra /admin-web no navegador para gerenciar a loja.
          </Text>
          <AccessibleButton onPress={() => router.replace("/(tabs)/perfil")}>Voltar ao perfil</AccessibleButton>
        </View>
      </SafeAreaView>
    );
  }

  if (!usuario) {
    return (
      <SafeAreaView style={[styles.webRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BrandLogo size={104} />
          <Text style={[styles.loginKicker, { color: colors.accent }]}>Backoffice BlackTone</Text>
          <Text accessibilityRole="header" style={[styles.loginTitle, { color: colors.text }]}>Painel administrativo</Text>
          <Text style={[styles.loginText, { color: colors.secondaryText }]}>
            Entre com uma conta marcada como admin no Firestore para gerenciar catalogo, pedidos e usuarios.
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="admin@blacktone.com"
            placeholderTextColor={colors.mutedText}
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={email}
          />

          <Text style={[styles.label, { color: colors.text }]}>Senha</Text>
          <TextInput
            onChangeText={setSenha}
            onSubmitEditing={entrarAdmin}
            placeholder="Senha do admin"
            placeholderTextColor={colors.mutedText}
            secureTextEntry
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={senha}
          />

          {erro !== "" && (
            <Text accessibilityRole="alert" style={[styles.message, { backgroundColor: colors.dangerBackground, color: colors.danger }]}>
              {erro}
            </Text>
          )}

          <AccessibleButton disabled={carregandoLogin} onPress={entrarAdmin}>
            {carregandoLogin ? "Entrando..." : "Entrar no admin"}
          </AccessibleButton>
        </View>
      </SafeAreaView>
    );
  }

  if (!usuario.admin) {
    return (
      <SafeAreaView style={[styles.webRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BrandLogo size={96} />
          <Text style={[styles.loginTitle, { color: colors.text }]}>Acesso restrito</Text>
          <Text style={[styles.loginText, { color: colors.secondaryText }]}>
            A conta {usuario.email} nao possui permissao admin. Marque admin: true no documento do usuario ou entre com outra conta.
          </Text>
          <AccessibleButton onPress={logout} variant="secondary">Sair</AccessibleButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.webRoot, { backgroundColor: colors.background }]}>
      <View style={styles.shell}>
        <View style={[styles.sidebar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BrandLogo size={82} />
          <Text style={[styles.sidebarTitle, { color: colors.text }]}>BlackTone Admin</Text>
          <Text style={[styles.sidebarSubtitle, { color: colors.secondaryText }]}>Backoffice Firebase</Text>

          <View style={styles.navList}>
            {abas.map((item) => {
              const ativo = aba === item.id;

              return (
                <FocusablePressable
                  accessibilityLabel={`Abrir ${item.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                  key={item.id}
                  onPress={() => setAba(item.id)}
                  style={({ pressed }) => [
                    styles.navItem,
                    {
                      backgroundColor: ativo ? colors.accent : colors.backgroundSoft,
                      borderColor: ativo ? colors.borderStrong : colors.border,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <Ionicons name={item.icon} size={18} color={ativo ? colors.accentText : colors.text} />
                  <Text style={[styles.navText, { color: ativo ? colors.accentText : colors.text }]}>
                    {item.label}
                  </Text>
                </FocusablePressable>
              );
            })}
          </View>

          <View style={[styles.adminIdentity, { backgroundColor: colors.backgroundSoft, borderColor: colors.border }]}>
            <Text style={[styles.adminIdentityLabel, { color: colors.mutedText }]}>Conta logada</Text>
            <Text style={[styles.adminIdentityEmail, { color: colors.text }]}>{usuario.email}</Text>
            <Text style={[styles.adminIdentityUid, { color: colors.secondaryText }]}>{usuario.uid}</Text>
          </View>

          <AccessibleButton onPress={logout} variant="secondary">Sair</AccessibleButton>
        </View>

        <ScrollView contentContainerStyle={styles.mainContent} style={styles.main}>
          <View style={styles.topbar}>
            <View>
              <Text style={[styles.kicker, { color: colors.accent }]}>Painel web</Text>
              <Text accessibilityRole="header" style={[styles.pageTitle, { color: colors.text }]}>Controle da loja</Text>
              <Text style={[styles.pageSubtitle, { color: colors.secondaryText }]}>Gerencie os dados que o app mobile renderiza pelo Firebase.</Text>
            </View>
            <View style={styles.topActions}>
              <AccessibleButton disabled={carregando} onPress={() => void carregarAdmin()} variant="secondary">
                {carregando ? "Atualizando..." : "Atualizar"}
              </AccessibleButton>
              <AccessibleButton onPress={() => router.push("/(tabs)" as never)} variant="secondary">
                Abrir loja
              </AccessibleButton>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <MetricCard label="Produtos ativos" value={String(produtosAtivos)} icon="cube" />
            <MetricCard label="Pedidos pendentes" value={String(pedidosPendentes)} icon="time" />
            <MetricCard label="Total vendido" value={formatarMoeda(totalPedidos)} icon="cash" />
            <MetricCard label="Estoque total" value={String(estoqueTotal)} icon="layers" />
            <MetricCard label="Admins" value={String(usuariosAdmin)} icon="shield-checkmark" />
          </View>

          {erro !== "" && (
            <Text accessibilityRole="alert" style={[styles.message, { backgroundColor: colors.dangerBackground, color: colors.danger }]}>
              {erro}
            </Text>
          )}

          {sucesso !== "" && (
            <Text accessibilityLiveRegion="polite" style={[styles.message, { backgroundColor: colors.successBackground, color: colors.success }]}>
              {sucesso}
            </Text>
          )}

          {aba === "visao" && (
            <View style={styles.dashboardGrid}>
              <View style={[styles.panel, styles.dashboardPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.panelTitle, { color: colors.text }]}>Pedidos recentes</Text>
                {pedidos.slice(0, 5).map((pedido) => (
                  <View key={pedido.id} style={[styles.compactRow, { borderColor: colors.border }]}>
                    <View style={styles.flex1}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>#{pedido.id.slice(-6)}</Text>
                      <Text style={[styles.rowMeta, { color: colors.secondaryText }]}>{pedido.usuarioEmail} | {dataCurta(pedido.criadoEm)}</Text>
                    </View>
                    <Text style={[styles.rowPrice, { color: colors.text }]}>{pedido.totalTexto}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.panel, styles.dashboardPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.panelTitle, { color: colors.text }]}>Catalogo em alerta</Text>
                {produtos.filter((produto) => !produto.ativo || (produto.estoque ?? 0) <= 0).slice(0, 6).map((produto) => (
                  <View key={produto.id} style={[styles.compactRow, { borderColor: colors.border }]}>
                    <View style={styles.flex1}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>{produto.nome}</Text>
                      <Text style={[styles.rowMeta, { color: colors.secondaryText }]}>Estoque {produto.estoque ?? 0} | {produto.ativo ? "ativo" : "inativo"}</Text>
                    </View>
                    <AccessibleButton onPress={() => editarProduto(produto)} style={styles.smallButton} textStyle={styles.smallButtonText} variant="secondary">Editar</AccessibleButton>
                  </View>
                ))}
              </View>
            </View>
          )}

          {aba === "produtos" && (
            <View style={styles.contentGrid}>
              <View style={[styles.panel, styles.listPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={[styles.panelTitle, { color: colors.text }]}>Produtos</Text>
                    <Text style={[styles.panelHint, { color: colors.secondaryText }]}>Dados exibidos no aplicativo mobile.</Text>
                  </View>
                  <AccessibleButton onPress={limparFormulario} variant="secondary">Novo produto</AccessibleButton>
                </View>

                <TextInput
                  onChangeText={setBuscaProduto}
                  placeholder="Buscar por nome, categoria ou ID"
                  placeholderTextColor={colors.mutedText}
                  style={[styles.searchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  value={buscaProduto}
                />

                {produtosFiltrados.map((produto) => (
                  <View key={produto.id} style={[styles.productRow, { backgroundColor: colors.backgroundSoft, borderColor: colors.border }]}>
                    <Image source={produto.imagem} style={[styles.productImage, { backgroundColor: colors.card }]} />
                    <View style={styles.flex1}>
                      <View style={styles.rowHeaderLine}>
                        <Text style={[styles.rowTitle, { color: colors.text }]}>{produto.nome}</Text>
                        <Text style={[styles.rowPrice, { color: colors.text }]}>{produto.preco}</Text>
                      </View>
                      <Text style={[styles.rowMeta, { color: colors.secondaryText }]}>#{produto.id} | {produto.categoria} | estoque {produto.estoque ?? 0} | {produto.parcelasMaximas ?? 10}x</Text>
                      <View style={styles.actionRow}>
                        <AccessibleButton onPress={() => editarProduto(produto)} style={styles.smallButton} textStyle={styles.smallButtonText} variant="secondary">Editar</AccessibleButton>
                        <AccessibleButton onPress={() => void alternarProduto(produto)} style={styles.smallButton} textStyle={styles.smallButtonText} variant="secondary">
                          {produto.ativo ? "Desativar" : "Ativar"}
                        </AccessibleButton>
                        <AccessibleButton onPress={() => void excluirProduto(produto)} style={styles.smallButton} textStyle={styles.smallButtonText} variant="danger">Excluir</AccessibleButton>
                      </View>
                    </View>
                    <StatusBadge ativo={produto.ativo} label={produto.ativo ? "Ativo" : "Inativo"} />
                  </View>
                ))}
              </View>

              <View style={[styles.panel, styles.editorPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.panelTitle, { color: colors.text }]}>Editor de produto</Text>
                <Text style={[styles.panelHint, { color: colors.secondaryText }]}>Salva diretamente em produtos no Firestore.</Text>

                <View style={styles.formRow}>
                  <Field label="ID" value={form.id} onChange={(value) => atualizarCampo("id", value)} />
                  <Field label="Ordem" keyboard="numeric" value={form.ordem} onChange={(value) => atualizarCampo("ordem", apenasNumeros(value))} />
                </View>
                <Field label="Nome" value={form.nome} onChange={(value) => atualizarCampo("nome", value)} />
                <Field label="Categoria" value={form.categoria} onChange={(value) => atualizarCampo("categoria", value)} />
                <Text style={[styles.label, { color: colors.text }]}>Descricao</Text>
                <TextInput
                  multiline
                  onChangeText={(text) => atualizarCampo("descricao", text)}
                  placeholder="Descricao comercial do item"
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, styles.textarea, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  value={form.descricao}
                />
                <View style={styles.formRow}>
                  <Field label="Preco" value={form.precoTexto} onChange={(value) => atualizarCampo("precoTexto", value)} />
                  <Field label="Estoque" keyboard="numeric" value={form.estoque} onChange={(value) => atualizarCampo("estoque", apenasNumeros(value))} />
                </View>
                <View style={styles.formRow}>
                  <Field label="Parcelas max." keyboard="numeric" value={form.parcelasMaximas} onChange={(value) => atualizarCampo("parcelasMaximas", apenasNumeros(value))} />
                  <Field label="Imagem local" value={form.imagemLocal} onChange={(value) => atualizarCampo("imagemLocal", value)} />
                </View>
                <Field label="Imagem URL" value={form.imagemUrl} onChange={(value) => atualizarCampo("imagemUrl", value)} />

                <FocusablePressable
                  accessibilityLabel={form.ativo ? "Produto ativo" : "Produto inativo"}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: form.ativo }}
                  onPress={() => atualizarCampo("ativo", !form.ativo)}
                  style={({ pressed }) => [
                    styles.switchRow,
                    {
                      backgroundColor: form.ativo ? colors.successBackground : colors.dangerBackground,
                      borderColor: form.ativo ? colors.success : colors.danger,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.switchText, { color: form.ativo ? colors.success : colors.danger }]}>
                    {form.ativo ? "Produto ativo no app" : "Produto oculto no app"}
                  </Text>
                </FocusablePressable>

                <AccessibleButton disabled={salvando} onPress={salvarProduto}>
                  {salvando ? "Salvando..." : "Salvar produto"}
                </AccessibleButton>
              </View>
            </View>
          )}

          {aba === "pedidos" && (
            <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.panelTitle, { color: colors.text }]}>Pedidos</Text>
              <Text style={[styles.panelHint, { color: colors.secondaryText }]}>Altere status e acompanhe os pedidos salvos em Firestore.</Text>

              {pedidos.map((pedido) => (
                <View key={pedido.id} style={[styles.orderCard, { backgroundColor: colors.backgroundSoft, borderColor: colors.border }]}>
                  <View style={styles.orderHeader}>
                    <View style={styles.flex1}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>Pedido #{pedido.id.slice(-6)}</Text>
                      <Text style={[styles.rowMeta, { color: colors.secondaryText }]}>{pedido.usuarioEmail} | {dataCurta(pedido.criadoEm)} | {pedido.itens.length} itens</Text>
                    </View>
                    <Text style={[styles.orderTotal, { color: colors.text }]}>{pedido.totalTexto}</Text>
                    <StatusBadge ativo={pedido.status !== "cancelado"} label={statusLabel(pedido.status)} />
                  </View>
                  <Text style={[styles.rowMeta, { color: colors.secondaryText }]}>Entrega: {pedido.endereco || "Sem endereco"}</Text>
                  <Text style={[styles.rowMeta, { color: colors.secondaryText }]}>Pagamento: {pedido.formaPagamento}{pedido.parcelas ? ` | ${pedido.parcelas}x` : ""}</Text>
                  <View style={styles.actionRow}>
                    {(["realizado", "entregue", "cancelado"] as PedidoStatus[]).map((status) => (
                      <AccessibleButton
                        key={status}
                        onPress={() => void alterarStatusPedido(pedido, status)}
                        style={styles.smallButton}
                        textStyle={styles.smallButtonText}
                        variant={pedido.status === status ? "primary" : "secondary"}
                      >
                        {statusLabel(status)}
                      </AccessibleButton>
                    ))}
                    <AccessibleButton onPress={() => void removerPedido(pedido)} style={styles.smallButton} textStyle={styles.smallButtonText} variant="danger">Excluir</AccessibleButton>
                  </View>
                </View>
              ))}
            </View>
          )}

          {aba === "usuarios" && (
            <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.panelTitle, { color: colors.text }]}>Usuarios</Text>
              <Text style={[styles.panelHint, { color: colors.secondaryText }]}>Promova usuarios existentes a admin. Criar/excluir contas do Authentication deve ficar para Cloud Functions.</Text>

              <TextInput
                onChangeText={setBuscaUsuario}
                placeholder="Buscar por email, nome ou UID"
                placeholderTextColor={colors.mutedText}
                style={[styles.searchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                value={buscaUsuario}
              />

              {usuariosFiltrados.map((conta) => (
                <View key={conta.uid} style={[styles.userRow, { backgroundColor: colors.backgroundSoft, borderColor: colors.border }]}>
                  <View style={[styles.avatar, { backgroundColor: conta.admin ? colors.accent : colors.cardStrong }]}>
                    <Text style={[styles.avatarText, { color: conta.admin ? colors.accentText : colors.text }]}>
                      {(conta.nome || conta.email || "U").slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.rowTitle, { color: colors.text }]}>{conta.nome || "Usuario sem nome"}</Text>
                    <Text style={[styles.rowMeta, { color: colors.secondaryText }]}>{conta.email}</Text>
                    <Text style={[styles.uidText, { color: colors.mutedText }]}>{conta.uid}</Text>
                  </View>
                  <StatusBadge ativo={Boolean(conta.admin)} label={conta.admin ? "Admin" : "Cliente"} />
                  <AccessibleButton
                    disabled={conta.uid === usuario.uid || salvando}
                    onPress={() => void alternarAdmin(conta)}
                    style={styles.userButton}
                    textStyle={styles.smallButtonText}
                    variant="secondary"
                  >
                    {conta.admin ? "Remover admin" : "Tornar admin"}
                  </AccessibleButton>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  adminIdentity: {
    borderRadius: 20,
    borderWidth: 1,
    marginTop: "auto",
    padding: 14,
  },
  adminIdentityEmail: {
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  adminIdentityLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  adminIdentityUid: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 4,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 18,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "900",
  },
  compactRow: {
    alignItems: "center",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
  },
  contentGrid: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 18,
  },
  dashboardGrid: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 18,
  },
  dashboardPanel: {
    flex: 1,
  },
  editorPanel: {
    flex: 1,
    minWidth: 340,
  },
  fieldWrap: {
    flex: 1,
    minWidth: 140,
  },
  flex1: {
    flex: 1,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 15,
    marginBottom: 12,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 7,
  },
  listPanel: {
    flex: 2,
    minWidth: 520,
  },
  loginCard: {
    alignSelf: "center",
    borderRadius: 30,
    borderWidth: 1,
    margin: 24,
    maxWidth: 480,
    padding: 28,
    width: "100%",
  },
  loginKicker: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
    textAlign: "center",
    textTransform: "uppercase",
  },
  loginText: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 22,
    marginTop: 10,
    textAlign: "center",
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 6,
    textAlign: "center",
  },
  main: {
    flex: 1,
  },
  mainContent: {
    padding: 28,
    paddingBottom: 48,
  },
  message: {
    borderRadius: 16,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginBottom: 16,
    padding: 14,
  },
  metricCard: {
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    minWidth: 170,
    padding: 18,
  },
  metricIcon: {
    alignItems: "center",
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    marginBottom: 14,
    width: 42,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 4,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "900",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 18,
  },
  nativeBlock: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  navItem: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  navList: {
    gap: 10,
    marginTop: 24,
  },
  navText: {
    fontSize: 15,
    fontWeight: "900",
  },
  orderCard: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 7,
    marginTop: 12,
    padding: 16,
  },
  orderHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "900",
  },
  pageSubtitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
  },
  panel: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
  },
  panelHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 14,
  },
  panelHint: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginBottom: 14,
    marginTop: 4,
  },
  panelTitle: {
    fontSize: 23,
    fontWeight: "900",
  },
  productImage: {
    borderRadius: 16,
    height: 66,
    resizeMode: "contain",
    width: 66,
  },
  productRow: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    padding: 12,
  },
  rowHeaderLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  rowMeta: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 3,
  },
  rowPrice: {
    fontSize: 15,
    fontWeight: "900",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  searchInput: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    marginBottom: 14,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  shell: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    borderRightWidth: 1,
    gap: 14,
    padding: 22,
    width: 292,
  },
  sidebarSubtitle: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: -6,
    textAlign: "center",
  },
  smallButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallButtonText: {
    fontSize: 12,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  switchRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  switchText: {
    fontSize: 14,
    fontWeight: "900",
  },
  textarea: {
    minHeight: 104,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  topActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  topbar: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  uidText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 4,
  },
  userButton: {
    minWidth: 130,
  },
  userRow: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginTop: 12,
    padding: 14,
  },
  webRoot: {
    flex: 1,
  },
});
