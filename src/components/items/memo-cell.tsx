"use client";

/**
 * メモ列の表示。2 行で切りつつ、ホバー／タップで全文バルーンを出す。
 * 表は overflow-x があるので、クリップされないよう portal + fixed で出す。
 */

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

type MemoCellProps = {
  note: string | null;
  label: string;
};

type BalloonPos = {
  top: number;
  left: number;
  maxWidth: number;
};

export function MemoCell({ note, label }: MemoCellProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const balloonRef = useRef<HTMLDivElement>(null);
  const balloonId = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<BalloonPos | null>(null);

  function placeBalloon() {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const maxWidth = Math.min(22 * 16, window.innerWidth - 24);
    let left = rect.left;
    if (left + maxWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - maxWidth - 12);
    }
    setPos({
      top: rect.bottom + 6,
      left,
      maxWidth,
    });
  }

  function openBalloon() {
    placeBalloon();
    setOpen(true);
  }

  function closeBalloon() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        balloonRef.current?.contains(target)
      ) {
        return;
      }
      closeBalloon();
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        closeBalloon();
      }
    }

    function onReposition() {
      placeBalloon();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open]);

  if (note == null || note === "") {
    return <span className="text-zinc-400">—</span>;
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // タッチでも開ける。既に開いていれば閉じる
    event.preventDefault();
    if (open) {
      closeBalloon();
      return;
    }
    openBalloon();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) {
        closeBalloon();
      } else {
        openBalloon();
      }
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        // 表セル内では幅が不定だと line-clamp が効かず行が高さ伸びるため、幅を親に合わせる
        className="block w-full min-w-0 cursor-pointer overflow-hidden rounded text-left text-zinc-600 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500"
        aria-label={`${label}のメモ（全文を表示）`}
        aria-expanded={open}
        aria-controls={open ? balloonId : undefined}
        onMouseEnter={openBalloon}
        onMouseLeave={(event) => {
          // バルーン側へ移ったときは閉じない
          const next = event.relatedTarget as Node | null;
          if (next && balloonRef.current?.contains(next)) {
            return;
          }
          closeBalloon();
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <span className="line-clamp-2 break-words">{note}</span>
      </button>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={balloonRef}
              id={balloonId}
              role="tooltip"
              className="fixed z-[60] max-h-64 overflow-y-auto rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-lg"
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.maxWidth,
              }}
              onMouseEnter={openBalloon}
              onMouseLeave={closeBalloon}
            >
              <p className="whitespace-pre-wrap break-words">{note}</p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
