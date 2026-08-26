import type { PointerEvent } from "react";

export function updateCardDepth<T extends HTMLElement>(event: PointerEvent<T>) {
  if (event.pointerType !== "mouse") return;

  const bounds = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  const horizontal = x - 0.5;
  const vertical = y - 0.5;

  event.currentTarget.style.setProperty("--depth-x", `${x * 100}%`);
  event.currentTarget.style.setProperty("--depth-y", `${y * 100}%`);
  event.currentTarget.style.setProperty(
    "--depth-rotate-x",
    `${vertical * -5}deg`,
  );
  event.currentTarget.style.setProperty(
    "--depth-rotate-y",
    `${horizontal * 7}deg`,
  );
  event.currentTarget.style.setProperty(
    "--depth-image-x",
    `${horizontal * -10}px`,
  );
  event.currentTarget.style.setProperty(
    "--depth-image-y",
    `${vertical * -8}px`,
  );
  event.currentTarget.style.setProperty(
    "--depth-shadow-x",
    `${horizontal * -22}px`,
  );
}

export function resetCardDepth<T extends HTMLElement>(event: PointerEvent<T>) {
  event.currentTarget.style.removeProperty("--depth-x");
  event.currentTarget.style.removeProperty("--depth-y");
  event.currentTarget.style.removeProperty("--depth-rotate-x");
  event.currentTarget.style.removeProperty("--depth-rotate-y");
  event.currentTarget.style.removeProperty("--depth-image-x");
  event.currentTarget.style.removeProperty("--depth-image-y");
  event.currentTarget.style.removeProperty("--depth-shadow-x");
}
