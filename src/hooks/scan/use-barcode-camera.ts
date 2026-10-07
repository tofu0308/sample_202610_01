/**
 * html5-qrcode の開始／停止とプレビュー要素 ID を管理する。
 * 読取成功時のビジネス処理（商品照会など）は onDecode に任せる。
 */

import { Html5Qrcode, type Html5QrcodeResult } from "html5-qrcode";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toCameraFriendlyError } from "@/lib/scan/camera-errors";

export type BarcodeDecodePayload = {
  rawValue: string;
  format?: string;
};

type UseBarcodeCameraOptions = {
  onDecode: (payload: BarcodeDecodePayload) => void;
};

export function useBarcodeCamera({ onDecode }: UseBarcodeCameraOptions) {
  const reactId = useId();
  // html5-qrcode は elementId 文字列を要求する。useId の「:」は CSS セレクタで困るので除去する
  const regionId = `barcode-reader-${reactId.replace(/:/g, "")}`;

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onDecodeRef = useRef(onDecode);

  // 開始後のコールバックから常に最新の onDecode を呼ぶ（render 中に ref を触らない）
  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setScanning(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // 閉じる操作を優先
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  }, []);

  // アンマウント時は必ず stop してカメラインジケータを残さない
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner?.isScanning) {
        void scanner.stop().catch(() => {
          // アンマウント中の失敗は握りつぶす
        });
      }
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setOverlayOpen(true);
    setStarting(true);

    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(regionId, { verbose: false });
      }
      const scanner = scannerRef.current;

      const onSuccess = (
        decodedText: string,
        decodedResult: Html5QrcodeResult,
      ) => {
        onDecodeRef.current({
          rawValue: decodedText,
          format: decodedResult.result.format?.formatName,
        });
      };

      const cameraConfig = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const width = Math.floor(Math.min(320, viewfinderWidth * 0.85));
          const height = Math.floor(Math.min(200, viewfinderHeight * 0.3));
          return { width, height };
        },
      };

      try {
        await scanner.start(
          { facingMode: "environment" },
          cameraConfig,
          onSuccess,
          () => {
            // フレームごとの「見つからない」は正常系
          },
        );
      } catch {
        await scanner.start(
          { facingMode: "user" },
          cameraConfig,
          onSuccess,
          () => {},
        );
      }

      setScanning(true);
    } catch (err) {
      setError(toCameraFriendlyError(err));
      setScanning(false);
      scannerRef.current = null;
      setOverlayOpen(false);
    } finally {
      setStarting(false);
    }
  }, [regionId]);

  const cancelOverlay = useCallback(async () => {
    await stop();
    setOverlayOpen(false);
    setStarting(false);
  }, [stop]);

  const closeOverlay = useCallback(async () => {
    await stop();
    setOverlayOpen(false);
    setStarting(false);
  }, [stop]);

  return {
    regionId,
    overlayOpen,
    scanning,
    starting,
    error,
    setError,
    start,
    stop,
    cancelOverlay,
    closeOverlay,
  };
}
