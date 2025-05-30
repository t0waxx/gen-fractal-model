
export function debounce<F extends (...args: any[]) => any>(func: F, delay: number): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function(this: ThisParameterType<F>, ...args: Parameters<F>): void {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
          func.apply(context, args);
      }, delay);
  };
}
