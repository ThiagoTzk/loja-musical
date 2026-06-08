type FirebaseAuthAction = "cadastro" | "login";
type AppLanguage = "pt" | "en";

type FirebaseAuthErrorLike = {
  code?: string;
  message?: string;
  name?: string;
};

const mensagens: Record<AppLanguage, Record<string, string>> = {
  pt: {
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
  },
  en: {
    "auth/app-not-authorized":
      "This app is not authorized to use Firebase Authentication for this project.",
    "auth/configuration-not-found":
      "Authentication configuration was not found for this Firebase project.",
    "auth/email-already-in-use": "This email is already registered in Firebase.",
    "auth/invalid-api-key":
      "The Firebase apiKey is invalid or does not belong to this project.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-email": "The email address is not valid.",
    "auth/invalid-login-credentials": "Email or password is incorrect.",
    "auth/missing-email": "Enter an email to continue.",
    "auth/missing-password": "Enter a password to continue.",
    "auth/network-request-failed":
      "Could not connect to Firebase. Check your internet connection and try again.",
    "auth/operation-not-allowed":
      "Email and password sign-in is not enabled in Firebase Console yet.",
    "auth/too-many-requests":
      "Too many attempts in a short time. Wait a bit and try again.",
    "auth/user-disabled": "This account was disabled in Firebase.",
    "auth/user-not-found": "No account was found with this email.",
    "auth/weak-password": "The password is weak. Use at least 6 characters.",
    "auth/wrong-password": "Password is incorrect.",
    "firestore/empty": "No product was found in Firestore.",
    "firestore/missing-project-id":
      "The Firebase project ID was not found in the .env file.",
    "firestore/not-found":
      "Firestore has not been created for this Firebase project yet.",
    "firestore/permission-denied":
      "Firestore denied the operation. Check the database security rules.",
    "firestore/unauthenticated":
      "Firestore requires an authenticated user for this operation.",
  },
};

const errosCredenciaisLogin = new Set([
  "auth/invalid-credential",
  "auth/invalid-login-credentials",
  "auth/user-not-found",
  "auth/wrong-password",
]);

export function descreverErroFirebaseAuth(
  error: unknown,
  action: FirebaseAuthAction,
  language: AppLanguage = "pt"
) {
  const firebaseError = error as FirebaseAuthErrorLike;
  const codigo = firebaseError.code ?? firebaseError.name ?? "";
  const dicionario = mensagens[language] ?? mensagens.pt;

  const mensagemPadrao =
    action === "cadastro"
      ? language === "en"
        ? "Could not create the account."
        : "Nao foi possivel criar a conta."
      : language === "en"
        ? "Could not sign in."
        : "Nao foi possivel entrar na conta.";

  if (action === "login" && errosCredenciaisLogin.has(codigo)) {
    return language === "en"
      ? "Email or password is incorrect. Check your details and try again."
      : "Email ou senha incorretos. Verifique os dados e tente novamente.";
  }

  return dicionario[codigo] ?? mensagemPadrao;
}
