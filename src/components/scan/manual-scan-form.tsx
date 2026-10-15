/**
 * カメラ不可時の手動 JAN 入力。
 */

import type { FormEvent } from "react";

type ManualScanFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ManualScanForm({
  value,
  onChange,
  onSubmit,
}: ManualScanFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label
        htmlFor="manual-scan-value"
        className="block text-sm font-medium text-zinc-200"
      >
        JANコード手動入力
      </label>
      <div className="flex flex-col gap-2">
        <input
          id="manual-scan-value"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="JANコード / QR の文字列"
          className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-400"
        />
        <button
          type="submit"
          className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700"
        >
          照会
        </button>
      </div>
    </form>
  );
}
