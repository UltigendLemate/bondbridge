import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

export type CaptchaProps = {
  onSolve?: (ok: boolean) => void;
  className?: string;
  length?: number;
  minSolveMs?: number;
};

export type CaptchaHandle = {
  reset: () => void;
};

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomText(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return out;
}

function drawCaptcha(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string
) {
  ctx.clearRect(0, 0, width, height);
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#e2e8f0");
  grad.addColorStop(1, "#cbd5e1");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.bezierCurveTo(
      Math.random() * width,
      Math.random() * height,
      Math.random() * width,
      Math.random() * height,
      Math.random() * width,
      Math.random() * height
    );
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.strokeStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.2})`;
    ctx.stroke();
  }

  const letterSpace = width / (text.length + 1);
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const fontSize = 22 + Math.floor(Math.random() * 10);
    ctx.save();
    ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, -apple-system`;
    ctx.fillStyle = `hsl(${Math.floor(Math.random() * 360)} 60% 30%)`;
    ctx.textBaseline = "middle";
    const x = letterSpace * (i + 1) + (Math.random() * 6 - 3);
    const y = height / 2 + (Math.random() * 6 - 3);
    const angle = (Math.random() - 0.5) * 0.6;
    ctx.translate(x, y);
    ctx.rotate(angle);
    const skewX = (Math.random() - 0.5) * 0.6;
    const skewY = (Math.random() - 0.5) * 0.3;
    ctx.transform(1, skewY, skewX, 1, 0, 0);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }

  for (let i = 0; i < 80; i++) {
    ctx.beginPath();
    const r = Math.random() * 1.5;
    ctx.arc(Math.random() * width, Math.random() * height, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
    ctx.fill();
  }
}

export const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(
  ({ onSolve, className, length = 6, minSolveMs = 1500 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [solution, setSolution] = useState("");
    const [input, setInput] = useState("");
    const [startAt, setStartAt] = useState<number>(Date.now());
    const width = 200;
    const height = 60;

    const expected = useMemo(() => randomText(length), [length, startAt]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawCaptcha(ctx, width, height, expected);
    }, [expected]);

    function reset() {
      setInput("");
      setSolution("");
      setStartAt(Date.now());
      if (onSolve) onSolve(false);
    }

    useImperativeHandle(ref, () => ({ reset }), [reset]);

    function handleChange(value: string) {
      const sanitized = value.replace(/[^A-Za-z0-9]/g, "");
      setInput(sanitized);
      const elapsed = Date.now() - startAt;
      const matched = sanitized.toUpperCase() === expected;
      const ok = matched && elapsed >= minSolveMs;
      if (onSolve) onSolve(ok);
      setSolution(ok ? expected : "");
    }

    const solved = Boolean(solution);

    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="rounded-md border border-input bg-background"
            aria-label="CAPTCHA image"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            aria-label="Refresh CAPTCHA"
            className="h-8 px-2"
          >
            Refresh
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="relative w-full">
            <Input
              aria-label="Enter the characters you see"
              inputMode="text"
              autoComplete="off"
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              maxLength={length}
              placeholder="Type the text"
              className={solved ? "pr-10" : undefined}
            />
            {solved && (
              <CheckCircle2
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500"
                aria-hidden="true"
              />
            )}
            <span className="sr-only" aria-live="polite">
              {solved ? "CAPTCHA verified" : "CAPTCHA not verified"}
            </span>
          </div>
        </div>
        <input
          type="text"
          name="website"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
    );
  }
);

export type { Captcha as CaptchaComponent };
export default Captcha;
