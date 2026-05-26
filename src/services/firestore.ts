import { FirebaseAuthUser, firebaseConfig } from "@/src/config/firebase-config";
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

type CriarPedidoParams = {
  cpf: string;
  endereco: string;
  formaPagamento: string;
  parcelas?: string;
  produtos: Produto[];
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
      "EXPO_PUBLIC_FIREBASE_PROJECT_ID nao foi encontrado no .env."
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

function produtoDoDocumento(
  documento: FirestoreDocument
): Produto & { ativo: boolean; ordem: number } {
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
    ordem: numberField(fields, "ordem") ?? 999,
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

export async function salvarUsuarioFirestore(usuario: FirebaseAuthUser) {
  const agora = new Date();

  return chamarFirestore(`usuarios/${usuario.localId}`, {
    body: {
      criadoEm: agora,
      email: usuario.email,
      fotoPerfil: null,
      uid: usuario.localId,
      ultimoLoginEm: agora,
      atualizadoEm: agora,
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
      email: usuario.email,
      uid: usuario.localId,
      ultimoLoginEm: agora,
    },
    idToken: usuario.idToken,
    method: "PATCH",
    updateMask: ["atualizadoEm", "email", "uid", "ultimoLoginEm"],
  });
}

function garantirUsuarioAutenticado(usuario: UsuarioFirestore) {
  if (!usuario.uid || !usuario.idToken) {
    throw criarErroFirestore(
      "firestore/unauthenticated",
      "Usuario autenticado nao encontrado para acessar pedidos."
    );
  }

  return {
    email: usuario.email,
    idToken: usuario.idToken,
    uid: usuario.uid,
  };
}

function produtoParaPedido(produto: Produto): PedidoProduto {
  return {
    categoria: produto.categoria,
    descricao: produto.descricao,
    imagemLocal: produto.imagemLocal ?? produto.id,
    imagemUrl: produto.imagemUrl ?? "",
    nome: produto.nome,
    preco: produto.preco,
    precoNumero: produto.precoNumero ?? precoParaNumero(produto.preco),
    produtoId: produto.id,
    quantidade: 1,
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
  const pedidoId = `pedido_${Date.now()}`;

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
