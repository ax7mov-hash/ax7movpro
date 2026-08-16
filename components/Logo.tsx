import Image from "next/image";

export function Logo({ light = false }: { light?: boolean }) {
  return <Image className={light ? "logo-image logo-light" : "logo-image"} src="/ax7mov-wordmark.svg" alt="AX7MOV" width={150} height={32} priority />;
}
