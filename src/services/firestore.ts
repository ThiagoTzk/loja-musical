import { FirebaseAuthUser, firebaseConfig } from "@/src/config/firebase-config";
import type {
  CartaoPadrao,
  DadosPerfilUsuario,
  EnderecoPadrao,
} from "@/src/context/UsuarioContext";
import {
  Produto,
  resolverImagemProduto,
} from "@/src/data/produto";
import { formatarMoeda, precoParaNumero } from "@/src/utils/preco";

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  mapValue?: {
    fields?: FirestoreFields;
  };
  arrayValue?: {
    values?: FirestoreValue[];
  };
};

type FirestoreFields = Record<string, FirestoreValue>;

type FirestoreDocument = {
  name: string;
  fields?: FirestoreFields;
};

type FirestoreListResponse = {
  documents?: FirestoreDocument[];
};

type FirestoreRunQueryResponse = {
  document?: FirestoreDocument;
}[];

type UsuarioFirestore = {
  email: string;
  idToken?: string;
  uid?: string;
};

export type PedidoStatus = "realizado" | "entregue" | "cancelado";

export type PedidoProduto = {
  categoria: string;
  descricao: string;
  imagemLocal: string;
  imagemUrl?: string;
  nome: string;
  preco: string;
  precoNumero: number;
  produtoId: string;
  quantidade: number;
};

export type Pedido = {
  atualizadoEm: string;
  cpf: string;
  criadoEm: string;
  endereco: string;
  formaPagamento: string;
  id: string;
  itens: PedidoProduto[];
  parcelas?: string;
  status: PedidoStatus;
  total: number;
  totalTexto: string;
  usuarioEmail: string;
  usuarioId: string;
};

export type ProdutoAdmin = Produto & {
  ativo: boolean;
  estoque?: number;
  ordem: number;
  parcelasMaximas?: number;
};

export type ProdutoAdminInput = {
  ativo: boolean;
  categoria: string;
  descricao: string;
  estoque?: number;
  id: string;
  imagemLocal: string;
  imagemUrl?: string;
  nome: string;
  ordem: number;
  parcelasMaximas?: number;
  preco: number;
  precoTexto: string;
};

export type UsuarioAdmin = DadosPerfilUsuario & {
  atualizadoEm: string;
  criadoEm: string;
  email: string;
  uid: string;
  ultimoLoginEm: string;
};

type CriarPedidoParams = {
  cpf: string;
  endereco: string;
  formaPagamento: string;
  parcelas?: string;
  produtos: (Produto & { quantidade?: number })[];
  total: number;
  usuario: UsuarioFirestore;
};

type FirestoreErrorResponse = {
  error?: {
    message?: string;
    status?: string;
  };
};

const DATABASE_ID = "(default)";

function firestoreBaseUrl() {
  if (!firebaseConfig.projectId) {
    throw criarErroFirestore(
      "firestore/missing-project-id",
      "EXPO_PUBLIC_FIREBASE_PROJECT_ID não foi encontrado no .env."
    );
  }

  return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${DATABASE_ID}/documents`;
}

function criarErroFirestore(code: string, message: string) {
  return { code, message };
}

function mapearErroFirestore(status?: string, message?: string) {
  const codigo = status ? status.toLowerCase().replaceAll("_", "-") : "unknown";

  return criarErroFirestore(
    `firestore/${codigo}`,
    message ?? "Erro desconhecido ao acessar o Firestore."
  );
}

function montarQuery(params: Record<string, string | string[] | undefined>) {
  const pares: string[] = [];

  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach((item) => pares.push(`${key}=${encodeURIComponent(item)}`));
      return;
    }

    pares.push(`${key}=${encodeURIComponent(value)}`);
  });

  if (firebaseConfig.apiKey) {
    pares.push(`key=${encodeURIComponent(firebaseConfig.apiKey)}`);
  }

  return pares.length > 0 ? `?${pares.join("&")}` : "";
}

function valorFirestore(valor: unknown): FirestoreValue {
  if (valor === null || valor === undefined) {
    return { nullValue: null };
  }

  if (Array.isArray(valor)) {
    return valor.length > 0
      ? { arrayValue: { values: valor.map(valorFirestore) } }
      : { arrayValue: {} };
  }

  if (typeof valor === "string") {
    return { stringValue: valor };
  }

  if (typeof valor === "number") {
    return Number.isInteger(valor)
      ? { integerValue: String(valor) }
      : { doubleValue: valor };
  }

  if (typeof valor === "boolean") {
    return { booleanValue: valor };
  }

  if (valor instanceof Date) {
    return { timestampValue: valor.toISOString() };
  }

  if (typeof valor === "object") {
    return {
      mapValue: {
        fields: objetoParaFirestore(valor as Record<string, unknown>),
      },
    };
  }

  return { stringValue: String(valor) };
}

function objetoParaFirestore(objeto: Record<string, unknown>) {
  return Object.entries(objeto).reduce<FirestoreFields>((fields, [key, value]) => {
    fields[key] = valorFirestore(value);
    return fields;
  }, {});
}

async function chamarFirestore<T>(
  caminho: string,
  opcoes: {
    body?: Record<string, unknown>;
    idToken?: string;
    method?: "DELETE" | "GET" | "PATCH";
    updateMask?: string[];
  } = {}
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (opcoes.idToken) {
    headers.Authorization = `Bearer ${opcoes.idToken}`;
  }

  const resposta = await fetch(
    `${firestoreBaseUrl()}/${caminho}${montarQuery({
      "updateMask.fieldPaths": opcoes.updateMask,
    })}`,
    {
      body: opcoes.body
        ? JSON.stringify({ fields: objetoParaFirestore(opcoes.body) })
        : undefined,
      headers,
      method: opcoes.method ?? "GET",
    }
  );

  const textoResposta = await resposta.text();
  const dados = (textoResposta ? JSON.parse(textoResposta) : {}) as T &
    FirestoreErrorResponse;

  if (!resposta.ok) {
    throw mapearErroFirestore(dados.error?.status, dados.error?.message);
  }

  return dados;
}

async function consultarFirestore<T>(
  body: Record<string, unknown>,
  idToken?: string
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  const resposta = await fetch(
    `${firestoreBaseUrl()}:runQuery${montarQuery({})}`,
    {
      body: JSON.stringify(body),
      headers,
      method: "POST",
    }
  );

  const textoResposta = await resposta.text();
  const dados = (textoResposta ? JSON.parse(textoResposta) : {}) as T &
    FirestoreErrorResponse;

  if (!resposta.ok) {
    throw mapearErroFirestore(dados.error?.status, dados.error?.message);
  }

  return dados;
}

function documentId(documento: FirestoreDocument) {
  return documento.name.split("/").pop() ?? "";
}

function stringField(fields: FirestoreFields | undefined, key: string) {
  return fields?.[key]?.stringValue;
}

function numberField(fields: FirestoreFields | undefined, key: string) {
  const valor = fields?.[key];

  if (!valor) return undefined;
  if (typeof valor.doubleValue === "number") return valor.doubleValue;
  if (typeof valor.integerValue === "string") return Number(valor.integerValue);

  return undefined;
}

function booleanField(fields: FirestoreFields | undefined, key: string) {
  return fields?.[key]?.booleanValue;
}

function timestampField(fields: FirestoreFields | undefined, key: string) {
  return fields?.[key]?.timestampValue ?? stringField(fields, key);
}

function arrayField(fields: FirestoreFields | undefined, key: string) {
  return fields?.[key]?.arrayValue?.values ?? [];
}

function mapFields(valor: FirestoreValue | undefined) {
  return valor?.mapValue?.fields;
}

function cartaoPadraoDoFields(fields: FirestoreFields | undefined): CartaoPadrao | null {
  const cartaoFields = mapFields(fields?.cartaoPadrao);

  if (!cartaoFields) return null;

  const apelido = stringField(cartaoFields, "apelido") ?? "";
  const bandeira = stringField(cartaoFields, "bandeira") ?? "Cartão";
  const titular = stringField(cartaoFields, "titular") ?? "";
  const ultimos4 = stringField(cartaoFields, "ultimos4") ?? "";
  const validade = stringField(cartaoFields, "validade") ?? "";

  if (!apelido && !titular && !ultimos4 && !validade) return null;

  return {
    apelido,
    bandeira,
    titular,
    ultimos4,
    validade,
  };
}

function enderecoVazio(): EnderecoPadrao {
  return {
    bairro: "",
    cep: "",
    cidade: "",
    complemento: "",
    estado: "",
    numero: "",
    rua: "",
  };
}

function enderecoPadraoDoFields(fields: FirestoreFields | undefined): EnderecoPadrao | null {
  const enderecoString = stringField(fields, "enderecoPadrao");

  if (enderecoString) {
    return {
      ...enderecoVazio(),
      rua: enderecoString,
    };
  }

  const enderecoFields = mapFields(fields?.enderecoPadrao);

  if (!enderecoFields) return null;

  const endereco = {
    bairro: stringField(enderecoFields, "bairro") ?? "",
    cep: stringField(enderecoFields, "cep") ?? "",
    cidade: stringField(enderecoFields, "cidade") ?? "",
    complemento: stringField(enderecoFields, "complemento") ?? "",
    estado: stringField(enderecoFields, "estado") ?? "",
    numero: stringField(enderecoFields, "numero") ?? "",
    rua: stringField(enderecoFields, "rua") ?? "",
  };
  const temValor = Object.values(endereco).some((valor) => valor.trim() !== "");

  return temValor ? endereco : null;
}

function dadosPerfilDoDocumento(documento: FirestoreDocument): DadosPerfilUsuario {
  const fields = documento.fields;

  return {
    cartaoPadrao: cartaoPadraoDoFields(fields),
    admin: booleanField(fields, "admin") ?? false,
    cpf: stringField(fields, "cpf") ?? "",
    dataNascimento: stringField(fields, "dataNascimento") ?? "",
    enderecoPadrao: enderecoPadraoDoFields(fields),
    nome: stringField(fields, "nome") ?? "",
    perfilCompleto: booleanField(fields, "perfilCompleto") ?? false,
    telefone: stringField(fields, "telefone") ?? "",
  };
}

function usuarioAdminDoDocumento(documento: FirestoreDocument): UsuarioAdmin {
  const fields = documento.fields;

  return {
    ...dadosPerfilDoDocumento(documento),
    atualizadoEm: timestampField(fields, "atualizadoEm") ?? "",
    criadoEm: timestampField(fields, "criadoEm") ?? "",
    email: stringField(fields, "email") ?? "",
    uid: stringField(fields, "uid") ?? documentId(documento),
    ultimoLoginEm: timestampField(fields, "ultimoLoginEm") ?? "",
  };
}

function produtoDoDocumento(
  documento: FirestoreDocument
): ProdutoAdmin {
  const fields = documento.fields;
  const id = documentId(documento);
  const imagemLocal = stringField(fields, "imagemLocal") ?? id;
  const imagemUrl = stringField(fields, "imagemUrl");
  const precoNumero = numberField(fields, "preco") ?? numberField(fields, "precoNumero");
  const precoTexto = stringField(fields, "precoTexto");

  return {
    id,
    nome: stringField(fields, "nome") ?? "Produto sem nome",
    preco: precoTexto ?? (precoNumero ? formatarMoeda(precoNumero) : "R$ 0,00"),
    precoNumero,
    categoria: stringField(fields, "categoria") ?? "Produto",
    descricao: stringField(fields, "descricao") ?? "",
    imagem: resolverImagemProduto(imagemLocal, imagemUrl),
    imagemLocal,
    imagemUrl,
    ativo: booleanField(fields, "ativo") ?? true,
    estoque: numberField(fields, "estoque"),
    ordem: numberField(fields, "ordem") ?? 999,
    parcelasMaximas: numberField(fields, "parcelasMaximas"),
  };
}

export async function listarProdutosFirestore() {
  const dados = await chamarFirestore<FirestoreListResponse>("produtos", {
    method: "GET",
  });

  const produtos = (dados.documents ?? [])
    .map(produtoDoDocumento)
    .filter((produto) => produto.ativo)
    .sort((a, b) => a.ordem - b.ordem)
    .map(({ ativo: _ativo, ordem: _ordem, ...produto }) => produto);

  return produtos;
}

export async function listarProdutosAdminFirestore(usuario: UsuarioFirestore) {
  const usuarioAutenticado = garantirUsuarioAutenticado(usuario);
  const dados = await chamarFirestore<FirestoreListResponse>("produtos", {
    idToken: usuarioAutenticado.idToken,
    method: "GET",
  });

  return (dados.documents ?? [])
    .map(produtoDoDocumento)
    .sort((a, b) => a.ordem - b.ordem);
}

export async function salvarProdutoAdminFirestore(
  usuario: UsuarioFirestore,
  produto: ProdutoAdminInput
) {
  const usuarioAutenticado = garantirUsuarioAutenticado(usuario);

  return chamarFirestore<FirestoreDocument>(
    `produtos/${produto.id}`,
    {
      body: {
        ativo: produto.ativo,
        categoria: produto.categoria,
        descricao: produto.descricao,
        estoque: produto.estoque ?? 0,
        imagemLocal: produto.imagemLocal,
        imagemUrl: produto.imagemUrl ?? "",
        nome: produto.nome,
        ordem: produto.ordem,
        parcelasMaximas: produto.parcelasMaximas ?? 10,
        preco: produto.preco,
        precoTexto: produto.precoTexto,
      },
      idToken: usuarioAutenticado.idToken,
      method: "PATCH",
    }
  );
}

export async function excluirProdutoAdminFirestore(
  usuario: UsuarioFirestore,
  produtoId: string
) {
  const usuarioAutenticado = garantirUsuarioAutenticado(usuario);

  return chamarFirestore<Record<string, never>>(
    `produtos/${produtoId}`,
    {
      idToken: usuarioAutenticado.idToken,
      method: "DELETE",
    }
  );
}

export async function salvarUsuarioFirestore(usuario: FirebaseAuthUser) {
  const agora = new Date();

  return chamarFirestore(`usuarios/${usuario.localId}`, {
    body: {
      admin: false,
      atualizadoEm: agora,
      cartaoPadrao: null,
      cpf: "",
      criadoEm: agora,
      dataNascimento: "",
      email: usuario.email,
      enderecoPadrao: null,
      fotoPerfil: null,
      nome: "",
      perfilCompleto: false,
      telefone: "",
      uid: usuario.localId,
      ultimoLoginEm: agora,
    },
    idToken: usuario.idToken,
    method: "PATCH",
  });
}

export async function atualizarLoginUsuarioFirestore(usuario: FirebaseAuthUser) {
  const agora = new Date();

  return chamarFirestore(`usuarios/${usuario.localId}`, {
    body: {
      atualizadoEm: agora,
      ultimoLoginEm: agora,
    },
    idToken: usuario.idToken,
    method: "PATCH",
    updateMask: ["atualizadoEm", "ultimoLoginEm"],
  });
}

export async function obterDadosUsuarioFirestore(usuario: UsuarioFirestore) {
  const usuarioAutenticado = garantirUsuarioAutenticado(usuario);
  const dados = await chamarFirestore<FirestoreDocument>(
    `usuarios/${usuarioAutenticado.uid}`,
    {
      idToken: usuarioAutenticado.idToken,
      method: "GET",
    }
  );

  return dadosPerfilDoDocumento(dados);
}

export async function atualizarDadosPerfilUsuarioFirestore(
  usuario: UsuarioFirestore,
  dados: DadosPerfilUsuario
) {
  const usuarioAutenticado = garantirUsuarioAutenticado(usuario);
  const perfilCompleto = Boolean(
    dados.nome?.trim() ||
      dados.telefone?.trim() ||
      dados.cpf?.trim() ||
      dados.dataNascimento?.trim() ||
      dados.enderecoPadrao ||
      dados.cartaoPadrao
  );
  const body: Record<string, unknown> = {
    atualizadoEm: new Date(),
    cpf: dados.cpf ?? "",
    dataNascimento: dados.dataNascimento ?? "",
    enderecoPadrao: dados.enderecoPadrao ?? null,
    nome: dados.nome ?? "",
    perfilCompleto,
    telefone: dados.telefone ?? "",
  };
  const updateMask = [
    "atualizadoEm",
    "cpf",
    "dataNascimento",
    "enderecoPadrao",
    "nome",
    "perfilCompleto",
    "telefone",
  ];

  if (dados.cartaoPadrao !== undefined) {
    body.cartaoPadrao = dados.cartaoPadrao;
    updateMask.push("cartaoPadrao");
  }

  await chamarFirestore<FirestoreDocument>(
    `usuarios/${usuarioAutenticado.uid}`,
    {
      body,
      idToken: usuarioAutenticado.idToken,
      method: "PATCH",
      updateMask,
    }
  );

  return {
    ...dados,
    perfilCompleto,
  };
}

function garantirUsuarioAutenticado(usuario: UsuarioFirestore) {
  if (!usuario.uid || !usuario.idToken) {
    throw criarErroFirestore(
      "firestore/unauthenticated",
      "Usuário autenticado não encontrado para acessar pedidos."
    );
  }

  return {
    email: usuario.email,
    idToken: usuario.idToken,
    uid: usuario.uid,
  };
}

function produtoParaPedido(produto: Produto & { quantidade?: number }): PedidoProduto {
  return {
    categoria: produto.categoria,
    descricao: produto.descricao,
    imagemLocal: produto.imagemLocal ?? produto.id,
    imagemUrl: produto.imagemUrl ?? "",
    nome: produto.nome,
    preco: produto.preco,
    precoNumero: produto.precoNumero ?? precoParaNumero(produto.preco),
    produtoId: produto.id,
    quantidade: produto.quantidade ?? 1,
  };
}

function produtoPedidoDoValor(valor: FirestoreValue): PedidoProduto {
  const fields = mapFields(valor);
  const produtoId = stringField(fields, "produtoId") ?? "";

  return {
    categoria: stringField(fields, "categoria") ?? "Produto",
    descricao: stringField(fields, "descricao") ?? "",
    imagemLocal: stringField(fields, "imagemLocal") ?? produtoId,
    imagemUrl: stringField(fields, "imagemUrl") ?? "",
    nome: stringField(fields, "nome") ?? "Produto sem nome",
    preco: stringField(fields, "preco") ?? "R$ 0,00",
    precoNumero: numberField(fields, "precoNumero") ?? 0,
    produtoId,
    quantidade: numberField(fields, "quantidade") ?? 1,
  };
}

function pedidoDoDocumento(documento: FirestoreDocument): Pedido {
  const fields = documento.fields;
  const id = stringField(fields, "id") ?? documentId(documento);
  const total = numberField(fields, "total") ?? 0;
  const status = (stringField(fields, "status") ?? "realizado") as PedidoStatus;

  return {
    atualizadoEm: timestampField(fields, "atualizadoEm") ?? "",
    cpf: stringField(fields, "cpf") ?? "",
    criadoEm: timestampField(fields, "criadoEm") ?? "",
    endereco: stringField(fields, "endereco") ?? "",
    formaPagamento: stringField(fields, "formaPagamento") ?? "",
    id,
    itens: arrayField(fields, "itens").map(produtoPedidoDoValor),
    parcelas: stringField(fields, "parcelas") || undefined,
    status,
    total,
    totalTexto: stringField(fields, "totalTexto") ?? formatarMoeda(total),
    usuarioEmail: stringField(fields, "usuarioEmail") ?? "",
    usuarioId: stringField(fields, "usuarioId") ?? "",
  };
}

export async function criarPedidoFirestore({
  cpf,
  endereco,
  formaPagamento,
  parcelas,
  produtos,
  total,
  usuario,
}: CriarPedidoParams) {
  const usuarioAutenticado = garantirUsuarioAutenticado(usuario);
  const agora = new Date();
  const pedidoId = `pedido_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  await chamarFirestore<FirestoreDocument>(
    `pedidos/${pedidoId}`,
    {
      body: {
        atualizadoEm: agora,
        cpf,
        criadoEm: agora,
        endereco,
        formaPagamento,
        id: pedidoId,
        itens: produtos.map(produtoParaPedido),
        parcelas: parcelas ?? "",
        status: "realizado",
        total,
        totalTexto: formatarMoeda(total),
        usuarioEmail: usuarioAutenticado.email,
        usuarioId: usuarioAutenticado.uid,
      },
      idToken: usuarioAutenticado.idToken,
      method: "PATCH",
    }
  );

  return pedidoId;
}

export async function listarPedidosUsuarioFirestore(usuario: UsuarioFirestore) {
  const usuarioAutenticado = garantirUsuarioAutenticado(usuario);
  const dados = await consultarFirestore<FirestoreRunQueryResponse>(
    {
      structuredQuery: {
        from: [{ collectionId: "pedidos" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "usuarioId" },
            op: "EQUAL",
            value: { stringValue: usuarioAutenticado.uid },
          },
        },
      },
    },
    usuarioAutenticado.idToken
  );

  return dados
    .map((resultado) => resultado.document)
    .filter((documento): documento is FirestoreDocument => Boolean(documento))
    .map(pedidoDoDocumento)
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
}

export async function listarPedidosAdminFirestore(usuario: UsuarioFirestore) {
  const usuarioAutenticado = garantirUsuarioAutenticado(usuario);
  const dados = await chamarFirestore<FirestoreListResponse>("pedidos", {
    idToken: usuarioAutenticado.idToken,
    method: "GET",
  });

  return (dados.documents ?? [])
    .map(pedidoDoDocumento)
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
}

export async function listarUsuariosAdminFirestore(usuario: UsuarioFirestore) {
  const usuarioAutenticado = garantirUsuarioAutenticado(usuario);
  const dados = await chamarFirestore<FirestoreListResponse>("usuarios", {
    idToken: usuarioAutenticado.idToken,
    method: "GET",
  });

  return (dados.documents ?? [])
    .map(usuarioAdminDoDocumento)
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function atualizarPermissaoAdminUsuarioFirestore(
  usuario: UsuarioFirestore,
  userId: string,
  admin: boolean
) {
  const usuarioAutenticado = garantirUsuarioAutenticado(usuario);

  return chamarFirestore<FirestoreDocument>(
    `usuarios/${userId}`,
    {
      body: {
        admin,
        atualizadoEm: new Date(),
      },
      idToken: usuarioAutenticado.idToken,
      method: "PATCH",
      updateMask: ["admin", "atualizadoEm"],
    }
  );
}

export async function atualizarStatusPedidoFirestore(
  usuario: UsuarioFirestore,
  pedidoId: string,
  status: PedidoStatus
) {
  const usuarioAutenticado = garantirUsuarioAutenticado(usuario);

  return chamarFirestore<FirestoreDocument>(
    `pedidos/${pedidoId}`,
    {
      body: {
        atualizadoEm: new Date(),
        status,
      },
      idToken: usuarioAutenticado.idToken,
      method: "PATCH",
      updateMask: ["atualizadoEm", "status"],
    }
  );
}

export async function excluirPedidoFirestore(
  usuario: UsuarioFirestore,
  pedidoId: string
) {
  const usuarioAutenticado = garantirUsuarioAutenticado(usuario);

  return chamarFirestore<Record<string, never>>(
    `pedidos/${pedidoId}`,
    {
      idToken: usuarioAutenticado.idToken,
      method: "DELETE",
    }
  );
}
