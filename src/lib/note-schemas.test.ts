import { describe, expect, it } from "vitest";
import {
  createNoteSchema,
  resolveNoteBodyUpdate,
  updateNoteSchema,
} from "./note-schemas";

describe("createNoteSchema", () => {
  it("タイトルと本文があれば成功する", () => {
    const result = createNoteSchema.safeParse({
      title: "疎通確認",
      body: "本文",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("疎通確認");
      expect(result.data.body).toBe("本文");
    }
  });

  it("前後空白だけのタイトルは拒否する", () => {
    const result = createNoteSchema.safeParse({ title: "   " });
    expect(result.success).toBe(false);
  });

  it("本文なしでも成功する", () => {
    const result = createNoteSchema.safeParse({ title: "タイトルのみ" });
    expect(result.success).toBe(true);
  });
});

describe("updateNoteSchema", () => {
  it("空の title は拒否する", () => {
    const result = updateNoteSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});

describe("resolveNoteBodyUpdate", () => {
  it("未送信なら更新オブジェクトを空にする", () => {
    expect(resolveNoteBodyUpdate(undefined)).toEqual({});
  });

  it("空文字なら null にする（本文クリア）", () => {
    expect(resolveNoteBodyUpdate("")).toEqual({ body: null });
  });

  it("文字列ならそのまま返す", () => {
    expect(resolveNoteBodyUpdate("残す")).toEqual({ body: "残す" });
  });
});
