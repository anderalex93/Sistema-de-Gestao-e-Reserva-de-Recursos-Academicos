export interface FieldError {
  field: string;
  message: string;
}

interface ApiErrorInit {
  status: number;
  code: string;
  fieldErrors?: readonly FieldError[];
}

interface DomainErrorBody {
  detail: string;
  code: string;
}

interface ValidationIssue {
  loc: (string | number)[];
  msg: string;
}

const MESSAGES = {
  network: 'Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.',
  timeout: 'O servidor demorou para responder. Tente de novo em instantes.',
  validation: 'Revise os campos destacados.',
  server: 'O servidor não conseguiu responder. Tente de novo em instantes.',
  unknown: 'Algo deu errado. Tente de novo.',
} as const;

function isDomainErrorBody(body: unknown): body is DomainErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as Partial<DomainErrorBody>).detail === 'string' &&
    typeof (body as Partial<DomainErrorBody>).code === 'string'
  );
}

function validationIssues(body: unknown): ValidationIssue[] | null {
  if (typeof body !== 'object' || body === null) return null;
  const { detail } = body as { detail?: unknown };
  return Array.isArray(detail) ? (detail as ValidationIssue[]) : null;
}

/** Erro de qualquer chamada à API, já traduzido para mensagem exibível ao usuário. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: readonly FieldError[];

  constructor(message: string, init: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors ?? [];
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** Qualquer falha vira `ApiError`; o que não veio da API é tratado como erro desconhecido. */
  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;
    return new ApiError(MESSAGES.unknown, { status: 0, code: 'ERRO_DESCONHECIDO' });
  }

  /** A requisição nem chegou a ter resposta: sem conexão ou tempo esgotado. */
  static fromTransport(error: unknown): ApiError {
    // Pelo nome, não por instanceof: o DOMException do navegador e o do Node são classes diferentes.
    const timedOut =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'TimeoutError';
    return timedOut
      ? new ApiError(MESSAGES.timeout, { status: 0, code: 'TEMPO_ESGOTADO' })
      : new ApiError(MESSAGES.network, { status: 0, code: 'SEM_CONEXAO' });
  }

  /** Resposta fora da faixa 2xx, com o corpo já lido. */
  static fromResponse(status: number, data: unknown): ApiError {
    if (isDomainErrorBody(data)) {
      return new ApiError(data.detail, { status, code: data.code });
    }
    const issues = validationIssues(data);
    if (status === 422 && issues) {
      const fieldErrors = issues.map((issue) => ({
        field: String(issue.loc.at(-1) ?? ''),
        message: issue.msg,
      }));
      return new ApiError(MESSAGES.validation, { status, code: 'VALIDACAO', fieldErrors });
    }
    return new ApiError(status >= 500 ? MESSAGES.server : MESSAGES.unknown, {
      status,
      code: `HTTP_${status}`,
    });
  }
}
