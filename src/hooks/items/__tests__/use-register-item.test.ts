/** @vitest-environment jsdom */
/**
 * 単件／一括登録 hook。request と router を mock。
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useRegisterItem,
  useRegisterItems,
} from "@/hooks/items/use-register-item";

const refresh = vi.fn();
const postRegisterItem = vi.fn();
const postRegisterItemsBulk = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/items/register-item-request", () => ({
  postRegisterItem: (...args: unknown[]) => postRegisterItem(...args),
  postRegisterItemsBulk: (...args: unknown[]) => postRegisterItemsBulk(...args),
}));

const product = {
  found: true as const,
  code: "4901234567890",
  name: "塗料",
  source: "yahoo_shopping" as const,
};

describe("useRegisterItem", () => {
  beforeEach(() => {
    refresh.mockReset();
    postRegisterItem.mockReset();
  });

  it("成功時は onRegistered があれば refresh しない", async () => {
    const onRegistered = vi.fn();
    const { result } = renderHook(() => useRegisterItem({ onRegistered }));
    postRegisterItem.mockResolvedValue({ ok: true });

    await act(async () => {
      await result.current.register(product);
    });
    expect(result.current.successMessage).toBe("登録しました");
    expect(onRegistered).toHaveBeenCalledOnce();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("失敗・throw は error。onRegistered 無しなら refresh", async () => {
    const { result } = renderHook(() => useRegisterItem());
    postRegisterItem.mockResolvedValue({ ok: false, message: "登録済み" });
    await act(async () => {
      await result.current.register(product);
    });
    expect(result.current.error).toBe("登録済み");

    postRegisterItem.mockResolvedValue({ ok: true });
    await act(async () => {
      await result.current.register(product);
    });
    expect(refresh).toHaveBeenCalled();

    postRegisterItem.mockRejectedValue(new Error("boom"));
    await act(async () => {
      await result.current.register(product);
    });
    expect(result.current.error).toBe("登録処理でエラーが発生しました");
  });
});

describe("useRegisterItems", () => {
  beforeEach(() => {
    refresh.mockReset();
    postRegisterItemsBulk.mockReset();
  });

  it("0 件は何もしない", async () => {
    const { result } = renderHook(() => useRegisterItems());
    await act(async () => {
      await result.current.registerMany([]);
    });
    expect(postRegisterItemsBulk).not.toHaveBeenCalled();
  });

  it("作成ありは onRegistered、失敗件数は error", async () => {
    const onRegistered = vi.fn();
    const { result } = renderHook(() => useRegisterItems({ onRegistered }));
    postRegisterItemsBulk.mockResolvedValue({
      ok: true,
      created: 1,
      duplicates: 1,
      failed: 1,
      requested: 3,
    });

    await act(async () => {
      await result.current.registerMany([product, product]);
    });
    expect(result.current.successMessage).toContain("1 件登録");
    expect(result.current.error).toBe("一部の登録に失敗しました");
    expect(onRegistered).toHaveBeenCalledOnce();
  });

  it("作成0・重複のみなら refresh。全滅は error", async () => {
    const { result } = renderHook(() => useRegisterItems());
    postRegisterItemsBulk.mockResolvedValue({
      ok: true,
      created: 0,
      duplicates: 2,
      failed: 0,
      requested: 2,
    });
    await act(async () => {
      await result.current.registerMany([product]);
    });
    expect(refresh).toHaveBeenCalled();

    postRegisterItemsBulk.mockResolvedValue({
      ok: true,
      created: 0,
      duplicates: 0,
      failed: 0,
      requested: 1,
    });
    await act(async () => {
      await result.current.registerMany([product]);
    });
    expect(result.current.error).toBe("登録できる商品がありませんでした");
  });
});
