type FirebaseAuthAction = "cadastro" | "login";

type FirebaseAuthErrorLike = {
  code?: string;
  message?: string;
  name?: string;
};

const mensagens: Record<string, string> = {
  "auth/app-not-authorized":
    "Este app nao esta autorizado a usar o Firebase Authentication deste projeto.",
  "auth/configuration-not-found":
    "A configuracao de Authentication nao foi encontrada neste projeto Firebase.",
  "auth/email-already-in-use": "Este email ja esta cadastrado no Firebase.",
  "auth/invalid-api-key":
    "A chave apiKey do Firebase esta invalida ou nao pertence a este projeto.",
  "auth/invalid-credential": "Email ou senha incorretos.",
  "auth/invalid-email": "O email informado nao e valido.",
  "auth/invalid-login-credentials": "Email ou senha incorretos.",
  "auth/missing-email": "Informe um email para continuar.",
  "auth/missing-password": "Informe uma senha para continuar.",
  "auth/network-request-failed":
    "Nao foi possivel conectar ao Firebase. Confira sua internet e tente novamente.",
  "auth/operation-not-allowed":
    "O login por email e senha ainda nao esta habilitado no Firebase Console.",
  "auth/too-many-requests":
    "Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente.",
  "auth/user-disabled": "Esta conta foi desativada no Firebase.",
  "auth/user-not-found": "Nenhuma conta foi encontrada com este email.",
  "auth/weak-password": "A senha esta fraca. Use pelo menos 6 caracteres.",
  "auth/wrong-password": "Senha incorreta.",
  "firestore/empty": "Nenhum produto foi encontrado no Firestore.",
  "firestore/missing-project-id":
    "O ID do projeto Firebase nao foi encontrado no arquivo .env.",
  "firestore/not-found":
    "O Firestore ainda nao foi criado neste projeto Firebase.",
  "firestore/permission-denied":
    "O Firestore recusou a operacao. Confira as regras de seguranca do banco.",
  "firestore/unauthenticated":
    "O Firestore exige um usuario autenticado para esta operacao.",
};

const errosCredenciaisLogin = new Set([
  "auth/invalid-credential",
  "auth/invalid-login-credentials",
  "auth/user-not-found",
  "auth/wrong-password",
]);

export function descreverErroFirebaseAuth(
  error: unknown,
  action: FirebaseAuthAction
) {
  const firebaseError = error as FirebaseAuthErrorLike;
  const codigo = firebaseError.code ?? firebaseError.name ?? "";

  const mensagemPadrao =
    action === "cadastro"
      ? "Nao foi possivel criar a conta."
      : "Nao foi possivel entrar na conta.";

  if (action === "login" && errosCredenciaisLogin.has(codigo)) {
    return "Email ou senha incorretos. Verifique os dados e tente novamente.";
  }

  return mensagens[codigo] ?? mensagemPadrao;
}
