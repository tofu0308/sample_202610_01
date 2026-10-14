/**
 * ページ描画を error.tsx へ流すための意図的エラー。
 * 想定内の操作失敗（ログイン・API）はインラインのまま。
 * 不正操作など「この画面では続行しない」ときに throwAppError する。
 *
 * 用途: Server / Client Component の描画パス。
 * API Route では JSON を返す（ここへ throw しても error.tsx にはならない）。
 *
 * 注意: 本番の Server Component では message が伏せられることがある。
 * その場合もタイトルは「操作を完了できません」側に寄せ、digest でログ照合する。
 */

export const APP_ERROR_CODES = {
  invalid_operation: "invalid_operation",
  forbidden: "forbidden",
} as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];

const APP_ERROR_MESSAGES: Record<AppErrorCode, string> = {
  invalid_operation: "不正な操作が行われたため、処理を中止しました。",
  forbidden: "この操作を行う権限がありません。",
};

export class AppError extends Error {
  readonly name = "AppError";
  readonly code: AppErrorCode | undefined;

  constructor(
    message: string,
    options?: { code?: AppErrorCode; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.code = options?.code;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError || (error instanceof Error && error.name === "AppError");
}

/**
 * error.tsx へ進める。戻らない（never）。
 * @example throwAppError("invalid_operation")
 * @example throwAppError("カスタム文言")
 * @example throwAppError("forbidden", { message: "上書き文言" })
 */
export function throwAppError(
  codeOrMessage: AppErrorCode | (string & {}),
  options?: { message?: string; cause?: unknown },
): never {
  if (isAppErrorCode(codeOrMessage)) {
    throw new AppError(options?.message ?? APP_ERROR_MESSAGES[codeOrMessage], {
      code: codeOrMessage,
      cause: options?.cause,
    });
  }

  throw new AppError(options?.message ?? codeOrMessage, {
    cause: options?.cause,
  });
}

function isAppErrorCode(value: string): value is AppErrorCode {
  return Object.hasOwn(APP_ERROR_MESSAGES, value);
}

/** error.tsx 向けの見出し・本文 */
export function getAppErrorPresentation(error: Error): {
  intentional: boolean;
  title: string;
  description: string;
} {
  if (isAppError(error)) {
    return {
      intentional: true,
      title: "操作を完了できませんでした",
      description: error.message || APP_ERROR_MESSAGES.invalid_operation,
    };
  }

  return {
    intentional: false,
    title: "表示中に問題が起きました",
    description:
      "一時的な不具合のことがあります。もう一度試すか、登録一覧へ戻ってください。",
  };
}
