export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

type FirebaseAuthResponse = {
  email: string;
  expiresIn: string;
  idToken: string;
  localId: string;
  refreshToken: string;
};

type FirebaseRestErrorResponse = {
  error?: {
    message?: string;
  };
};

type FirebaseRefreshTokenResponse = {
  access_token: string;
  expires_in: string;
  id_token: string;
  refresh_token: string;
  user_id: string;
};

export type FirebaseAuthUser = {
  email: string;
  expiresIn: string;
  idToken: string;
  localId: string;
  refreshToken: string;
};

const authErrors: Record<string, string> = {
  EMAIL_EXISTS: "auth/email-already-in-use",
  EMAIL_NOT_FOUND: "auth/user-not-found",
  INVALID_EMAIL: "auth/invalid-email",
  INVALID_LOGIN_CREDENTIALS: "auth/invalid-login-credentials",
  INVALID_PASSWORD: "auth/wrong-password",
  MISSING_EMAIL: "auth/missing-email",
  MISSING_PASSWORD: "auth/missing-password",
  OPERATION_NOT_ALLOWED: "auth/operation-not-allowed",
  TOO_MANY_ATTEMPTS_TRY_LATER: "auth/too-many-requests",
  USER_DISABLED: "auth/user-disabled",
  WEAK_PASSWORD: "auth/weak-password",
};

function criarErroFirebaseAuth(message?: string) {
  const mensagem = message ?? "UNKNOWN_ERROR";
  const chave = mensagem.split(" : ")[0];
  const codigo = authErrors[chave] ?? `auth/${chave.toLowerCase().replaceAll("_", "-")}`;

  return {
    code: codigo,
    message: mensagem,
  };
}

async function chamarFirebaseAuth(
  endpoint: "signUp" | "signInWithPassword",
  email: string,
  password: string
): Promise<FirebaseAuthUser> {
  if (!firebaseConfig.apiKey) {
    throw {
      code: "auth/invalid-api-key",
      message: "EXPO_PUBLIC_FIREBASE_API_KEY nao foi encontrada no .env.",
    };
  }

  const resposta = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${firebaseConfig.apiKey}`,
    {
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );

  const dados = (await resposta.json()) as FirebaseAuthResponse & FirebaseRestErrorResponse;

  if (!resposta.ok) {
    throw criarErroFirebaseAuth(dados.error?.message);
  }

  return {
    email: dados.email,
    expiresIn: dados.expiresIn,
    idToken: dados.idToken,
    localId: dados.localId,
    refreshToken: dados.refreshToken,
  };
}

export function cadastrarUsuarioFirebase(email: string, password: string) {
  return chamarFirebaseAuth("signUp", email, password);
}

export function entrarUsuarioFirebase(email: string, password: string) {
  return chamarFirebaseAuth("signInWithPassword", email, password);
}

export async function renovarTokenFirebase(refreshToken: string) {
  if (!firebaseConfig.apiKey) {
    throw {
      code: "auth/invalid-api-key",
      message: "EXPO_PUBLIC_FIREBASE_API_KEY nao foi encontrada no .env.",
    };
  }

  const resposta = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`,
    {
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    }
  );

  const dados = (await resposta.json()) as FirebaseRefreshTokenResponse &
    FirebaseRestErrorResponse;

  if (!resposta.ok) {
    throw criarErroFirebaseAuth(dados.error?.message);
  }

  return {
    expiresIn: dados.expires_in,
    idToken: dados.id_token || dados.access_token,
    localId: dados.user_id,
    refreshToken: dados.refresh_token,
  };
}
