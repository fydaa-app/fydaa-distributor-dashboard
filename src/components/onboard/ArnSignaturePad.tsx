"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface ArnSignaturePadHandle {
  isEmpty(): boolean;
  clear(): void;
  toBase64Png(): string | null;
  toPngFile(filename?: string): Promise<File | null>;
}

interface ArnSignaturePadProps {
  className?: string;
}

function stripDataUrlPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

function flattenSignatureCanvas(source: HTMLCanvasElement): HTMLCanvasElement | null {
  const width = Math.max(1, Math.round(source.clientWidth || source.width));
  const height = Math.max(1, Math.round(source.clientHeight || source.height));
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return out;
}

const ArnSignaturePad = forwardRef<ArnSignaturePadHandle, ArnSignaturePadProps>(
  function ArnSignaturePad({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawingRef = useRef(false);
    const emptyRef = useRef(true);
    const [isEmpty, setIsEmpty] = useState(true);

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || 480;
      const height = 180;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1f1f1b";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      emptyRef.current = true;
      setIsEmpty(true);
    };

    useEffect(() => {
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    const pointFromEvent = (
      event: React.PointerEvent<HTMLCanvasElement>
    ): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      canvas.setPointerCapture(event.pointerId);
      drawingRef.current = true;
      const point = pointFromEvent(event);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const point = pointFromEvent(event);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      if (emptyRef.current) {
        emptyRef.current = false;
        setIsEmpty(false);
      }
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
      drawingRef.current = false;
      try {
        canvasRef.current?.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    };

    useImperativeHandle(ref, () => ({
      isEmpty: () => emptyRef.current,
      clear: () => resizeCanvas(),
      toBase64Png: () => {
        const canvas = canvasRef.current;
        if (!canvas || emptyRef.current) return null;
        const exported = flattenSignatureCanvas(canvas);
        if (!exported) return null;
        return stripDataUrlPrefix(exported.toDataURL("image/png"));
      },
      toPngFile: async (filename = "signature.png") => {
        const canvas = canvasRef.current;
        if (!canvas || emptyRef.current) return null;
        const exported = flattenSignatureCanvas(canvas) ?? canvas;
        const blob = await new Promise<Blob | null>((resolve) => {
          exported.toBlob((value) => resolve(value), "image/png");
        });
        if (!blob) return null;
        return new File([blob], filename, { type: "image/png" });
      },
    }));

    return (
      <div className={className}>
        <div className="overflow-hidden rounded-[12px] border border-[var(--arn-bdr-2)] bg-white">
          <canvas
            ref={canvasRef}
            className="block w-full touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--arn-txt-3)]">
          <span>{isEmpty ? "Draw the signature above" : "Signature captured"}</span>
          <button
            type="button"
            className="font-semibold text-[var(--arn-amber-txt)]"
            onClick={() => resizeCanvas()}
          >
            Clear
          </button>
        </div>
      </div>
    );
  }
);

export default ArnSignaturePad;
