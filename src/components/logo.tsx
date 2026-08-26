import Image from "next/image";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`logo${compact ? " logo-compact" : ""}`}
      role="img"
      aria-label="AX7MOV"
    >
      <Image
        src="/logo-light.png"
        alt=""
        width={2098}
        height={749}
        sizes="(max-width: 640px) 118px, 148px"
        className="logo-image logo-image-light"
        priority
      />
      <Image
        src="/logo-dark.png"
        alt=""
        width={2094}
        height={751}
        sizes="(max-width: 640px) 118px, 148px"
        className="logo-image logo-image-dark"
        aria-hidden="true"
        priority
      />
    </span>
  );
}
