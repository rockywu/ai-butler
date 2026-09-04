interface Resource {
  close: () => Promise<void> | void;
  name: string;
}

export class ResourceRegistry {
  #closePromise: Promise<void> | undefined;
  readonly #resources: Resource[] = [];

  closeAll(): Promise<void> {
    this.#closePromise ??= this.#closeOnce();
    return this.#closePromise;
  }

  register(name: string, close: Resource['close']): void {
    if (this.#closePromise) {
      throw new Error(`Cannot register ${name} while closing`);
    }
    this.#resources.push({ close, name });
  }

  async #closeOnce(): Promise<void> {
    const errors: Error[] = [];
    for (const resource of this.#resources.toReversed()) {
      try {
        await resource.close();
      } catch (error) {
        errors.push(
          new Error(`Failed to close ${resource.name}`, { cause: error }),
        );
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, 'One or more resources failed to close');
    }
  }
}
