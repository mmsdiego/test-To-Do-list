export function nowString(): string {
  return new Date().toLocaleString();
}

export function showToast(
  message: string,
  type: "success" | "warning" | "danger" = "success",
  container: HTMLElement
): void {
  const toast = document.createElement("div");
  toast.className = `toast show align-items-center text-bg-${type} custom-toast`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close"></button>
    </div>
  `;

  container?.appendChild(toast);

  const remove = () => {
    toast.classList.remove("show");
    toast.remove();
  };

  const closeBtn = toast.querySelector(".btn-close") as HTMLButtonElement | null;
  closeBtn?.addEventListener("click", remove);

  setTimeout(remove, 2000);
}