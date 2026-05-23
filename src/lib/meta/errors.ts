export class MetaPermissionError extends Error {
  constructor(message: string = "Permissao insuficiente na Meta.") {
    super(message);
    this.name = "MetaPermissionError";
  }
}

export class MetaTokenError extends Error {
  constructor(message: string = "Token de acesso da Meta invalido ou expirado.") {
    super(message);
    this.name = "MetaTokenError";
  }
}

export class MetaGraphError extends Error {
  public code?: number;
  public subcode?: number;
  public type?: string;

  constructor(
    message: string,
    details?: { code?: number; subcode?: number; type?: string }
  ) {
    super(message);
    this.name = "MetaGraphError";
    this.code = details?.code;
    this.subcode = details?.subcode;
    this.type = details?.type;
  }
}

export class MetaWebhookError extends Error {
  constructor(message: string = "Falha ao processar webhook da Meta.") {
    super(message);
    this.name = "MetaWebhookError";
  }
}
