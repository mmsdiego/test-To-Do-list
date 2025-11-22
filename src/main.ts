import { Modal } from "bootstrap"

import type { Task } from "./types"
import { loadTasks, saveTasks } from "./storage"
import { nowString, showToast } from "./ui"

(() => {
  const form = document.querySelector<HTMLFormElement>("#taskForm")
  const taskInput = document.querySelector<HTMLInputElement>("#taskInput")
  const tasksTbody = document.querySelector<HTMLTableSectionElement>("#tasksTbody")
  const tasksCount = document.querySelector<HTMLElement>("#tasksCount")
  const pageInfoTop = document.querySelector<HTMLElement>("#pageInfoTop")
  const pageInfoBottom = document.querySelector<HTMLElement>("#pageInfoBottom")

  const prevPageTop = document.querySelector<HTMLButtonElement>("#prevPageTop")
  const currentPageTop = document.querySelector<HTMLButtonElement>("#currentPageTop")
  const nextPageTop = document.querySelector<HTMLButtonElement>("#nextPageTop")
  const perPageTop = document.querySelector<HTMLSelectElement>("#perPageTop")

  const prevPageBottom = document.querySelector<HTMLButtonElement>("#prevPageBottom")
  const currentPageBottom = document.querySelector<HTMLButtonElement>("#currentPageBottom")
  const nextPageBottom = document.querySelector<HTMLButtonElement>("#nextPageBottom")
  const perPageBottom = document.querySelector<HTMLSelectElement>("#perPageBottom")
  const toastContainer = document.querySelector<HTMLElement>("#toastContainer")

  const confirmDeleteModalEl = document.querySelector("#confirmDeleteModal") as HTMLElement
  const confirmDeleteBtn = document.querySelector<HTMLButtonElement>("#confirmDeleteBtn")
  let taskIdToDelete: number | null = null
  let confirmDeleteModal: { show: () => void; hide: () => void }

  if (confirmDeleteModalEl) {
    confirmDeleteModal = new Modal(confirmDeleteModalEl)
  }

  if (
    !form || 
    !taskInput || 
    !tasksTbody || 
    !tasksCount || 
    !pageInfoTop || 
    !pageInfoBottom || 
    !prevPageTop ||
    !currentPageTop ||
    !nextPageTop ||
    !perPageTop ||
    !prevPageBottom ||
    !currentPageBottom ||
    !nextPageBottom ||
    !perPageBottom ||
    !toastContainer
  ) return

  let tasks: Task[] = loadTasks();
  let currentPage = 1;
  let perPage = Number(perPageTop.value);

  function updatePerPage(newValue: number) {
    if (!perPageTop || !perPageBottom) return

    perPage = newValue;
    perPageTop.value = String(newValue);
    perPageBottom.value = String(newValue);
    currentPage = 1;
    render();
  }

  perPageTop.addEventListener("change", () => updatePerPage(Number(perPageTop.value)));
  perPageBottom.addEventListener("change", () => updatePerPage(Number(perPageBottom.value)));

  function goPrev() {
    if (currentPage > 1) {
      currentPage--;
      render();
    }
  }

  function goNext() {
    if (currentPage < totalPages()) {
      currentPage++;
      render();
    }
  }

  prevPageTop.addEventListener("click", goPrev);
  nextPageTop.addEventListener("click", goNext);
  prevPageBottom.addEventListener("click", goPrev);
  nextPageBottom.addEventListener("click", goNext);

  function addTask(description: string): void {
    const trimmed = description.trim();
    if (!trimmed) {
      showToast("A descrição não pode estar vazia", "warning", toastContainer!);
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      description: trimmed,
      createdAt: nowString(),
      completed: false,
      completedAt: null,
    };

    if (trimmed.length <= 3) {
      showToast("A tarefa deve ter mais de 3 caracteres", "warning", toastContainer!);
      return;
    }

    if (tasks.some(t => t.description.toLowerCase() === trimmed.toLowerCase())) {
      showToast("Esta tarefa já foi adicionada", "danger", toastContainer!);
      return;
    }

    tasks.unshift(newTask);
    saveTasks(tasks);
    showToast("Tarefa adicionada", "success", toastContainer!);
    currentPage = 1;
    render();
  }

  function toggleTask(id: number): void {
    tasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? nowString() : null,
          }
        : task
    );

    saveTasks(tasks);
    showToast("Tarefa concluida", "success", toastContainer!);
    render();
  }

  function deleteTask(id: number): void {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks(tasks);
    showToast("Tarefa excluída", "success", toastContainer!);

    const totalPagesCount = Math.max(1, Math.ceil(tasks.length / perPage));
    if (currentPage > totalPagesCount) currentPage = totalPagesCount;

    render();
  }

  function totalPages(): number {
    return Math.max(1, Math.ceil(tasks.length / perPage));
  }

  function getDisplayedTasks(): Task[] {
    const start = (currentPage - 1) * perPage;
    return tasks.slice(start, start + perPage);
  }

  function render(): void {
    if (
      !tasksTbody ||
      !tasksCount ||
      !pageInfoTop ||
      !pageInfoBottom ||
      !prevPageTop ||
      !nextPageTop ||
      !prevPageBottom ||
      !nextPageBottom ||
      !currentPageTop ||
      !currentPageBottom
    ) return

    tasksTbody.innerHTML = "";

    const displayed = getDisplayedTasks();

    if (displayed.length === 0) {
      tasksTbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted">
            Nenhuma tarefa nesta página
          </td>
        </tr>`;
    } else {
      displayed.forEach((task) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td class="task-col">
            <div class="d-flex gap-2 align-items-center">
              <input type="checkbox" class="form-check-input" ${task.completed ? "checked" : ""}>
              <span 
                class="task-text ${task.completed ? "text-strike" : ""}" 
                title="${task.description}"
              >
                ${task.description}
              </span>
              ${task.completed ? '<span class="badge bg-success ms-2">Concluída</span>' : ""}
            </div>
          </td>
          <td>${task.createdAt}</td>
          <td>${task.completed ? task.completedAt ?? "-" : "-"}</td>
          <td><button class="btn btn-danger btn-soft btn-sm">Excluir</button></td>
        `;

        const checkbox = tr.querySelector("input[type=checkbox]") as HTMLInputElement;
        checkbox.addEventListener("change", () => toggleTask(task.id));

        const deleteBtn = tr.querySelector("button") as HTMLButtonElement;
        deleteBtn.addEventListener("click", () => {
          taskIdToDelete = task.id;
          confirmDeleteModal.show();
        });

        tasksTbody.appendChild(tr);
      });
    }

    tasksCount.textContent = String(tasks.length);

    const pages = totalPages();

    pageInfoTop.textContent = `Página ${currentPage} de ${pages}`;
    pageInfoBottom.textContent = `Página ${currentPage} de ${pages}`;

    currentPageTop.textContent = `${currentPage}`
    currentPageBottom.textContent = `${currentPage}`

    prevPageTop.disabled = prevPageBottom.disabled = currentPage <= 1;
    nextPageTop.disabled = nextPageBottom.disabled = currentPage >= pages;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (taskInput) {
      addTask(taskInput.value);
      taskInput.value = "";
      taskInput.focus();
    }
  });

  confirmDeleteBtn?.addEventListener("click", () => {
    if (taskIdToDelete !== null) {
      deleteTask(taskIdToDelete);
      taskIdToDelete = null;
    }
    confirmDeleteModal.hide();
  });

  render();

  // @ts-ignore
  window.__TODO_APP = { getTasks: () => tasks, reload: () => render() };
})();
