/**
 * Centralized error handler for friendly user messages.
 * Maps technical error codes or messages to human-readable text.
 */

export type ErrorSeverity = "info" | "warning" | "error";

export interface FriendlyError {
  message: string;
  actionLabel?: string;
  action?: () => void;
  technicalDetails?: string;
}

const ERROR_MAP: Record<string, string> = {
  // Auth Errors
  "invalid-credentials": "E-mail ou senha incorretos. Verifique seus dados e tente novamente.",
  "signup-failed": "Não foi possível criar sua conta agora. Revise os dados ou tente outro e-mail.",
  "auth-unavailable": "O serviço de autenticação está temporariamente indisponível. Verifique sua conexão.",
  "oauth-callback-failed": "Houve um problema ao processar seu login social. Tente novamente ou use e-mail/senha.",
  "oauth-failed": "Não conseguimos iniciar o acesso com o Google. Tente novamente em instantes.",
  "supabase-not-configured": "O sistema está em modo de demonstração. Algumas funções de banco de dados podem estar limitadas.",
  "too-many-requests": "Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.",
  "User already registered": "Este e-mail já está cadastrado. Tente fazer login ou recupere sua senha.",
  "email-already-registered": "Este e-mail já está cadastrado. Tente fazer login ou recupere sua senha.",
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "disposable-email": "Use um e-mail permanente. Endereços temporários ou descartáveis não são aceitos no cadastro.",
  "invalid-email-domain": "Não conseguimos validar o domínio do seu e-mail. Confira se digitou corretamente.",
  "weak-password": "Senha fraca. Use ao menos 8 caracteres com letras e números e evite senhas comuns ou que já vazaram.",
  "captcha-failed": "Não foi possível validar o desafio de segurança. Recarregue a página e tente novamente.",
  "reset-link-invalid": "Seu link de redefinição expirou ou é inválido. Solicite um novo abaixo.",
  "password-mismatch": "As senhas não coincidem. Digite a mesma senha nos dois campos.",
  "reset-update-failed": "Não foi possível redefinir sua senha agora. Tente novamente em instantes.",
  
  // Database / Supabase Errors
  "PGRST116": "O registro solicitado não foi encontrado.",
  "23505": "Este registro já existe em nossa base de dados.",
  "42P01": "Erro de configuração no banco de dados. Por favor, avise o suporte técnico.",
  "JWT expired": "Sua sessão expirou. Por favor, faça login novamente para continuar.",
  
  // Network / API Errors
  "Failed to fetch": "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
  "Network request failed": "Erro de rede. Verifique se você está conectado e tente novamente.",
  "Internal Server Error": "Ocorreu um erro interno no servidor. Nossa equipe já foi notificada.",
  "fetch failed": "Falha na comunicação com o servidor. Tente atualizar a página.",
  
  // AI / OpenAI Errors
  "insufficient_quota": "A cota de uso de IA da sua organização acabou. Revise seu plano ou fale com o gestor.",
  "rate_limit_reached": "Muitas solicitações ao mesmo tempo. Aguarde alguns segundos e tente novamente.",
  "context_length_exceeded": "O texto fornecido é muito longo para ser processado pela IA. Tente resumir as informações.",
  
  // Common UI Errors
  "Comentario obrigatorio.": "Por favor, escreva um comentário antes de enviar.",
  "Nao foi possivel salvar o pedido.": "Houve um problema ao salvar seu pedido. Revise os campos e tente novamente.",
  "Nao foi possivel carregar os leads": "Não conseguimos carregar a lista de leads agora. Verifique sua conexão e tente atualizar a página.",
  "Nao foi possivel atualizar a etapa do lead. Tente novamente.": "Erro ao mudar etapa. Verifique sua conexão e tente novamente em instantes.",
  "Nao foi possivel gerar a mensagem.": "A IA não conseguiu gerar a mensagem agora. Tente novamente em alguns segundos.",
  "Nao foi possivel gerar a campanha.": "Houve um erro ao preparar sua campanha. Revise os dados e tente novamente.",
  "Nao foi possivel anexar o arquivo.": "O arquivo não pôde ser enviado. Verifique o tamanho e o formato.",
  "Nao foi possivel enviar a imagem para a Meta.": "Não foi possível enviar a imagem para a biblioteca da Meta agora. Verifique a conexão e tente novamente.",
  "A conexao Meta nao possui a permissao ads_management. Reconecte a conta para liberar o upload.": "A conta Meta conectada não tem a permissão necessária para enviar imagens. Reconecte com acesso a anúncios.",
  "auth/invalid-email": "O e-mail informado parece inválido. Revise o campo e tente novamente.",
  "auth/user-not-found": "Não encontramos uma conta com este e-mail.",
  "auth/wrong-password": "Senha incorreta. Se esqueceu sua senha, use a recuperação de conta.",
};

/**
 * Normalizes an error object or string into a friendly message for the UI.
 * Technical details are kept for logging but hidden from the end user.
 */
export function getFriendlyErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado. Tente novamente."): FriendlyError {
  let technicalMessage = "";
  let code = "";

  if (typeof error === "string") {
    technicalMessage = error;
  } else if (error instanceof Error) {
    technicalMessage = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    technicalMessage = String((error as { message: unknown }).message);
    if ("code" in error) {
      code = String((error as { code: unknown }).code);
    }
  }

  // Log technical details for debugging
  if (technicalMessage || code) {
    console.error("[Technical Error Detail]:", { code, message: technicalMessage });
  }

  // Try to find a match in the map
  const friendlyMessage = ERROR_MAP[code] || ERROR_MAP[technicalMessage] || findPartialMatch(technicalMessage) || fallback;

  return {
    message: friendlyMessage,
    technicalDetails: technicalMessage || code || undefined,
    actionLabel: getActionLabel(code || technicalMessage)
  };
}

function findPartialMatch(message: string): string | null {
  const lowercaseMessage = message.toLowerCase();
  
  if (lowercaseMessage.includes("supabase") && lowercaseMessage.includes("configured")) {
    return ERROR_MAP["supabase-not-configured"];
  }
  if (lowercaseMessage.includes("failed to fetch") || lowercaseMessage.includes("network")) {
    return ERROR_MAP["Failed to fetch"];
  }
  if (lowercaseMessage.includes("quota") || lowercaseMessage.includes("limit")) {
    return ERROR_MAP["insufficient_quota"];
  }
  if (lowercaseMessage.includes("duplicate") || lowercaseMessage.includes("unique violation")) {
    return ERROR_MAP["23505"];
  }
  
  return null;
}

function getActionLabel(errorKey: string): string | undefined {
  const lowercaseKey = errorKey.toLowerCase();
  
  if (lowercaseKey.includes("session") || lowercaseKey.includes("expired") || lowercaseKey.includes("unauthenticated")) {
    return "Fazer login";
  }
  if (lowercaseKey.includes("fetch") || lowercaseKey.includes("network") || lowercaseKey.includes("timeout")) {
    return "Tentar novamente";
  }
  if (lowercaseKey.includes("configured") || lowercaseKey.includes("support") || lowercaseKey.includes("42p01")) {
    return "Falar com suporte";
  }
  
  return "Revisar e tentar novamente";
}
