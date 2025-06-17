// @ts-nocheck
export class MockKVNamespace implements KVNamespace {
  private store = new Map<string, string>();

  async get(
    key: string,
    type?: "text" | "json" | "arrayBuffer" | "stream",
  ): Promise<string | null | unknown> {
    const value = this.store.get(key);
    if (value === undefined) {
      return null;
    }

    if (type === "json") {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }

    return value;
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: {
    prefix?: string;
  }): Promise<{ keys: { name: string }[] }> {
    const keys = Array.from(this.store.keys());
    const filteredKeys = options?.prefix
      ? keys.filter((key) => key.startsWith(options.prefix!))
      : keys;

    return {
      keys: filteredKeys.map((name) => ({ name })),
    };
  }

  // Clear the store for test cleanup
  clear(): void {
    this.store.clear();
  }

  // Get all stored data for debugging
  getAll(): Map<string, string> {
    return new Map(this.store);
  }
}
