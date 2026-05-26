import { AccessibleButton } from "@/components/accessible-button";
import { FocusablePressable } from "@/components/focusable-pressable";
import { ThemeContext } from "@/src/context/ThemeContext";
import { UsuarioContext } from "@/src/context/UsuarioContext";
import { resolverImagemProduto } from "@/src/data/produto";
import {
  atualizarStatusPedidoFirestore,
  excluirPedidoFirestore,
  listarPedidosUsuarioFirestore,
  Pedido,
  PedidoStatus,
} from "@/src/services/firestore";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatarDataCompra(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Data da compra indisponivel";
  }

  return `Comprado em ${data.toLocaleDateString("pt-BR")} as ${data.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  )}`;
}

function statusPedidoTexto(status: PedidoStatus) {
  const labels: Record<PedidoStatus, string> = {
    cancelado: "Cancelado",
    entregue: "Entregue",
    realizado: "Realizado",
  };

  return labels[status] ?? "Realizado";
}

export default function Perfil() {
  const { colors } = useContext(ThemeContext);
  const { usuario, logout, atualizarFotoPerfil } = useContext(UsuarioContext);

  const [mostrarCamera, setMostrarCamera] = useState(false);
  const [tipoCamera, setTipoCamera] = useState<"front" | "back">("back");
  const [erroCamera, setErroCamera] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);
  const [erroPedidos, setErroPedidos] = useState("");
  const [pedidoEmAcao, setPedidoEmAcao] = useState("");

  const [, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const usandoFirestore = Boolean(usuario?.uid && usuario?.idToken);
  const totalHistorico = usandoFirestore
    ? pedidos.reduce((total, pedido) => total + pedido.itens.length, 0)
    : usuario?.historico.length ?? 0;

  const carregarPedidos = useCallback(async () => {
    if (!usuario?.uid || !usuario.idToken) {
      setPedidos([]);
      return;
    }

    setCarregandoPedidos(true);
    setErroPedidos("");

    try {
      const pedidosFirestore = await listarPedidosUsuarioFirestore(usuario);
      setPedidos(pedidosFirestore);
    } catch (error) {
      console.warn("Nao foi possivel carregar pedidos do Firestore.", error);
      setErroPedidos(
        "Nao foi possivel carregar o historico do Firebase. Confira as regras do Firestore."
      );
    } finally {
      setCarregandoPedidos(false);
    }
  }, [usuario]);

  useEffect(() => {
    void carregarPedidos();
  }, [carregarPedidos]);

  async function tirarFoto() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      atualizarFotoPerfil(photo.uri);
      setMostrarCamera(false);
    }
  }

  function trocarCamera() {
    setTipoCamera((prev) => (prev === "back" ? "front" : "back"));
  }

  async function abrirCamera() {
    const status = await requestPermission();

    if (status.granted) {
      setErroCamera("");
      setMostrarCamera(true);
      return;
    }

    setErroCamera("Permissão da câmera negada. Verifique as configurações do aparelho.");
  }

  async function atualizarStatusPedido(pedidoId: string, status: PedidoStatus) {
    if (!usuario) return;

    setPedidoEmAcao(pedidoId);
    setErroPedidos("");

    try {
      await atualizarStatusPedidoFirestore(usuario, pedidoId, status);
      await carregarPedidos();
    } catch (error) {
      console.warn("Nao foi possivel atualizar o pedido no Firestore.", error);
      setErroPedidos("Nao foi possivel atualizar o pedido no Firebase.");
    } finally {
      setPedidoEmAcao("");
    }
  }

  async function excluirPedido(pedidoId: string) {
    if (!usuario) return;

    setPedidoEmAcao(pedidoId);
    setErroPedidos("");

    try {
      await excluirPedidoFirestore(usuario, pedidoId);
      setPedidos((pedidosAtuais) =>
        pedidosAtuais.filter((pedido) => pedido.id !== pedidoId)
      );
    } catch (error) {
      console.warn("Nao foi possivel excluir o pedido do Firestore.", error);
      setErroPedidos("Nao foi possivel excluir o pedido no Firebase.");
    } finally {
      setPedidoEmAcao("");
    }
  }

  if (!usuario) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.accessCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text accessibilityRole="header" style={[styles.titulo, { color: colors.text }]}> 
            Perfil
          </Text>
          <Text style={[styles.subtitulo, { color: colors.secondaryText }]}> 
            Entre ou crie uma conta para salvar histórico de compras e personalizar seu perfil.
          </Text>

          <AccessibleButton
            accessibilityHint="Abre a tela de login."
            onPress={() => router.push("/login")}
          >
            Login
          </AccessibleButton>

          <AccessibleButton
            accessibilityHint="Abre a tela de cadastro."
            onPress={() => router.push("/cadastro")}
            style={styles.secondaryButton}
            variant="secondary"
          >
            Cadastro
          </AccessibleButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={[styles.titulo, { color: colors.text }]}> 
          Perfil
        </Text>

        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={styles.avatarWrap}>
            {usuario.fotoPerfil ? (
              <Image
                accessibilityLabel="Foto de perfil do usuário"
                accessibilityRole="image"
                source={{ uri: usuario.fotoPerfil }}
                style={styles.foto}
              />
            ) : (
              <View
                accessibilityLabel="Perfil sem foto"
                accessibilityRole="image"
                style={[styles.foto, styles.avatarPlaceholder, { backgroundColor: colors.backgroundSoft }]}
              >
                <Text style={[styles.avatarInitials, { color: colors.text }]}>BT</Text>
              </View>
            )}

            <View style={styles.profileInfo}>
              <Text style={[styles.emailLabel, { color: colors.mutedText }]}>Conta</Text>
              <Text style={[styles.email, { color: colors.text }]}>{usuario.email}</Text>
              {usuario.uid && (
                <>
                  <Text style={[styles.emailLabel, styles.uidLabel, { color: colors.mutedText }]}>
                    UID Firebase
                  </Text>
                  <Text style={[styles.uid, { color: colors.secondaryText }]}>{usuario.uid}</Text>
                </>
              )}
            </View>
          </View>

          {erroCamera !== "" && (
            <Text
              accessibilityRole="alert"
              style={[
                styles.error,
                { backgroundColor: colors.dangerBackground, color: colors.danger },
              ]}
            >
              {erroCamera}
            </Text>
          )}

          <AccessibleButton
            accessibilityHint="Solicita permissão e abre a câmera para tirar uma foto de perfil."
            onPress={abrirCamera}
            variant="secondary"
          >
            Adicionar foto de perfil
          </AccessibleButton>
        </View>

        <View style={styles.historyHeader}>
          <Text accessibilityRole="header" style={[styles.subtituloHistorico, { color: colors.text }]}> 
            Histórico de compras
          </Text>
          <Text style={[styles.historyCount, { color: colors.mutedText }]}> 
            {carregandoPedidos
              ? "Carregando"
              : `${totalHistorico} ${totalHistorico === 1 ? "item" : "itens"}`}
          </Text>
        </View>

        {erroPedidos !== "" && (
          <Text
            accessibilityRole="alert"
            style={[
              styles.error,
              { backgroundColor: colors.dangerBackground, color: colors.danger },
            ]}
          >
            {erroPedidos}
          </Text>
        )}

        {usandoFirestore && !carregandoPedidos && pedidos.length === 0 && (
          <View
            accessibilityRole="summary"
            style={[
              styles.emptyHistory,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma compra ainda</Text>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}> 
              Quando você finalizar uma compra, os produtos aparecem aqui.
            </Text>
          </View>
        )}

        {usandoFirestore &&
          pedidos.map((pedido) => (
            <View
              key={pedido.id}
              style={[
                styles.pedidoCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.pedidoHeader}>
                <View style={styles.pedidoHeaderInfo}>
                  <Text style={[styles.pedidoTitle, { color: colors.text }]}> 
                    Pedido #{pedido.id.slice(-6)}
                  </Text>
                  <Text style={[styles.historyDate, { color: colors.secondaryText }]}> 
                    {formatarDataCompra(pedido.criadoEm)}
                  </Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: colors.backgroundSoft }]}> 
                  <Text style={[styles.statusText, { color: colors.text }]}> 
                    {statusPedidoTexto(pedido.status)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.historyPayment, { color: colors.secondaryText }]}> 
                Pagamento: {pedido.formaPagamento}
                {pedido.parcelas ? ` em ${pedido.parcelas}x` : ""} | Total: {pedido.totalTexto}
              </Text>

              {pedido.itens.map((item) => (
                <View
                  key={`${pedido.id}-${item.produtoId}`}
                  style={[
                    styles.itemHistorico,
                    { backgroundColor: colors.backgroundSoft, borderColor: colors.border },
                  ]}
                >
                  <Image
                    accessibilityLabel={`Imagem do produto ${item.nome}`}
                    accessibilityRole="image"
                    source={resolverImagemProduto(item.imagemLocal, item.imagemUrl)}
                    style={[styles.imagem, { backgroundColor: colors.backgroundSoft }]}
                  />

                  <View style={styles.historyInfo}>
                    <FocusablePressable
                      accessibilityHint="Abre a pagina de detalhes deste produto comprado."
                      accessibilityLabel={`Abrir detalhes de ${item.nome}`}
                      accessibilityRole="button"
                      hitSlop={6}
                      onPress={() => router.push(`/produto/${item.produtoId}`)}
                      style={({ pressed }) => [
                        styles.historyNameLink,
                        {
                          borderColor: colors.border,
                          opacity: pressed ? 0.78 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.historyName, { color: colors.text }]}> 
                        {item.nome}
                      </Text>
                    </FocusablePressable>
                    <Text style={[styles.historyCategory, { color: colors.secondaryText }]}> 
                      {item.categoria}
                    </Text>
                    <Text style={[styles.historyPrice, { color: colors.text }]}>{item.preco}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.historyActions}>
                <AccessibleButton
                  accessibilityHint="Atualiza o status do pedido no Firebase para entregue."
                  disabled={pedido.status === "entregue" || pedidoEmAcao === pedido.id}
                  onPress={() => atualizarStatusPedido(pedido.id, "entregue")}
                  style={styles.historyActionButton}
                  variant="secondary"
                >
                  {pedido.status === "entregue" ? "Pedido entregue" : "Marcar entregue"}
                </AccessibleButton>

                <AccessibleButton
                  accessibilityHint="Exclui este pedido do historico no Firebase."
                  disabled={pedidoEmAcao === pedido.id}
                  onPress={() => excluirPedido(pedido.id)}
                  style={styles.historyActionButton}
                  variant="danger"
                >
                  Excluir historico
                </AccessibleButton>
              </View>
            </View>
          ))}

        {!usandoFirestore && usuario.historico.length === 0 && (
          <View
            accessibilityRole="summary"
            style={[
              styles.emptyHistory,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma compra ainda</Text>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}> 
              Quando você finalizar uma compra, os produtos aparecem aqui.
            </Text>
          </View>
        )}

        {!usandoFirestore &&
          usuario.historico.map((item, index) => (
            <View
              key={`${item.id}-${index}`}
              style={[
                styles.itemHistorico,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Image
                accessibilityLabel={`Imagem do produto ${item.nome}`}
                accessibilityRole="image"
                source={item.imagem}
                style={[styles.imagem, { backgroundColor: colors.backgroundSoft }]}
              />

              <View style={styles.historyInfo}>
                <FocusablePressable
                  accessibilityHint="Abre a pagina de detalhes deste produto comprado."
                  accessibilityLabel={`Abrir detalhes de ${item.nome}`}
                  accessibilityRole="button"
                  hitSlop={6}
                  onPress={() => router.push(`/produto/${item.id}`)}
                  style={({ pressed }) => [
                    styles.historyNameLink,
                    {
                      borderColor: colors.border,
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.historyName, { color: colors.text }]}>{item.nome}</Text>
                </FocusablePressable>
                <Text style={[styles.historyCategory, { color: colors.secondaryText }]}> 
                  {item.categoria}
                </Text>
                <Text style={[styles.historyDate, { color: colors.secondaryText }]}> 
                  {formatarDataCompra(item.compradoEm)}
                </Text>
                <Text style={[styles.historyPayment, { color: colors.secondaryText }]}> 
                  Pagamento: {item.formaPagamento}
                  {item.parcelas ? ` em ${item.parcelas}x` : ""}
                </Text>
                <Text style={[styles.historyPrice, { color: colors.text }]}>{item.preco}</Text>
              </View>
            </View>
          ))}
        <AccessibleButton
          accessibilityHint="Sai da conta atual."
          onPress={logout}
          style={styles.logoutButton}
          variant="danger"
        >
          Sair
        </AccessibleButton>
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setMostrarCamera(false)}
        visible={mostrarCamera}
      >
        <View accessibilityViewIsModal style={styles.cameraModal}>
          <CameraView ref={cameraRef} facing={tipoCamera} style={styles.camera} />

          <View style={styles.cameraActions}>
            <FocusablePressable
              accessibilityHint="Tira a foto de perfil."
              accessibilityLabel="Tirar foto"
              accessibilityRole="button"
              hitSlop={8}
              onPress={tirarFoto}
              style={({ pressed }) => [styles.botaoCamera, { opacity: pressed ? 0.82 : 1 }]}
            >
              <Text style={styles.textoCamera}>Tirar foto</Text>
            </FocusablePressable>

            <FocusablePressable
              accessibilityHint="Alterna entre câmera frontal e traseira."
              accessibilityLabel="Trocar câmera"
              accessibilityRole="button"
              hitSlop={8}
              onPress={trocarCamera}
              style={({ pressed }) => [styles.botaoCamera, { opacity: pressed ? 0.82 : 1 }]}
            >
              <Text style={styles.textoCamera}>Trocar câmera</Text>
            </FocusablePressable>

            <FocusablePressable
              accessibilityHint="Fecha a câmera sem salvar uma foto."
              accessibilityLabel="Cancelar foto"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setMostrarCamera(false)}
              style={({ pressed }) => [
                styles.botaoCamera,
                styles.botaoCameraDanger,
                { opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Text style={styles.textoCamera}>Cancelar</Text>
            </FocusablePressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    paddingBottom: 34,
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
  accessCard: {
    borderRadius: 28,
    borderWidth: 1,
    elevation: 6,
    marginTop: 70,
    padding: 22,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  secondaryButton: {
    marginTop: 12,
  },
  profileCard: {
    borderRadius: 28,
    borderWidth: 1,
    elevation: 5,
    marginTop: 12,
    padding: 18,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  avatarWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  foto: {
    borderRadius: 42,
    height: 84,
    width: 84,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  profileInfo: {
    flex: 1,
  },
  emailLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  email: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 4,
  },
  uidLabel: {
    marginTop: 10,
  },
  uid: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 3,
  },
  error: {
    borderRadius: 14,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
    marginBottom: 14,
    padding: 12,
  },
  historyHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 12,
  },
  subtituloHistorico: {
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
  },
  historyCount: {
    fontSize: 14,
    fontWeight: "800",
  },
  pedidoCard: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    marginBottom: 14,
    padding: 14,
  },
  pedidoHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  pedidoHeaderInfo: {
    flex: 1,
  },
  pedidoTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  itemHistorico: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    padding: 12,
  },
  imagem: {
    borderRadius: 14,
    height: 68,
    resizeMode: "contain",
    width: 68,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: "900",
  },
  historyNameLink: {
    alignSelf: "flex-start",
    borderBottomWidth: 1,
    paddingBottom: 2,
  },
  historyCategory: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 6,
  },
  historyPayment: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 2,
  },
  historyPrice: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 6,
  },
  historyActions: {
    gap: 10,
    marginTop: 2,
  },
  historyActionButton: {
    width: "100%",
  },
  emptyHistory: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  logoutButton: {
    marginTop: 22,
  },
  cameraModal: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraActions: {
    bottom: 30,
    gap: 12,
    left: 20,
    position: "absolute",
    right: 20,
  },
  botaoCamera: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 52,
    padding: 14,
  },
  botaoCameraDanger: {
    backgroundColor: "#991B1B",
  },
  textoCamera: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
