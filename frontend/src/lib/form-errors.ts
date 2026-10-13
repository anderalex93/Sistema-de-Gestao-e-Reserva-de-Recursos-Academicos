import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { ApiError } from '@/lib/api/api-error';

interface ApplyApiErrorOptions<Form extends FieldValues> {
  setError: UseFormSetError<Form>;
  /** Campos do formulário que o backend pode apontar num 422 de validação. */
  fields: readonly Path<Form>[];
  /** Erros de domínio que pertencem a um campo (`RECURSO_JA_EXISTE` → `nome`). */
  fieldByCode?: Partial<Record<string, Path<Form>>>;
  setFormError: (message: string) => void;
}

/** Leva o erro da API para o campo certo; o que não tem campo vira erro do formulário. */
export function applyApiError<Form extends FieldValues>(
  error: unknown,
  { setError, fields, fieldByCode = {}, setFormError }: ApplyApiErrorOptions<Form>,
): void {
  const apiError = ApiError.from(error);
  const byCode = fieldByCode[apiError.code];
  if (byCode) {
    setError(byCode, { message: apiError.message }, { shouldFocus: true });
    return;
  }
  const known = apiError.fieldErrors.filter((issue) =>
    (fields as readonly string[]).includes(issue.field),
  );
  if (known.length === 0) {
    setFormError(apiError.message);
    return;
  }
  known.forEach((issue, index) =>
    setError(issue.field as Path<Form>, { message: issue.message }, { shouldFocus: index === 0 }),
  );
}
