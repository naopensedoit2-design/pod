import Image from "next/image";
import { cn } from "@/lib/format";

/** Origens que o otimizador de imagens aceita (ver `images` em next.config.ts). */
const OPTIMIZABLE = /^\/(media|products|demo)\/[^?]+$|^https:\/\/cdn\.youdraw\.com\.br\/[^?]+$/;

type Props = {
  src: string;
  alt: string;
  /** Largura ocupada na tela (atributo `sizes`), para o navegador baixar só o necessário. */
  sizes: string;
  quality?: 75 | 90;
  eager?: boolean;
  className?: string;
  decorative?: boolean;
};

/**
 * Foto de produto: ocupa o quadro inteiro sem cortar (contain sobre o fundo da galeria) e é
 * entregue no tamanho e densidade de cada tela (inclusive celulares com tela 3x).
 */
export function ProductImage({ src, alt, sizes, quality = 75, eager = false, className, decorative = false }: Props) {
  return (
    <Image
      src={src}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      fill
      sizes={sizes}
      quality={quality}
      unoptimized={!OPTIMIZABLE.test(src)}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      className={cn("object-contain", className)}
    />
  );
}
