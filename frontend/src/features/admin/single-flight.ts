export function createSingleFlight() {
  let active = false;

  return {
    async run(task: () => Promise<void>) {
      if (active) {
        return false;
      }

      active = true;
      try {
        await task();
        return true;
      } finally {
        active = false;
      }
    },
  };
}

export function isExactDeleteConfirmation(value: string) {
  return value === "EXCLUIR";
}
