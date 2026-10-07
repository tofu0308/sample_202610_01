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
      <label htmlFor="manual-scan-value" className="block text-sm font-medium">
        手動入力（カメラが使えないときの確認用）
      </label>
      <div className="flex flex-col gap-2">
        <input
          id="manual-scan-value"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="JAN / QR の文字列"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
        />
        <button
          type="submit"
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900"
        >
          表示
        </button>
      </div>
    </form>
  );
}
