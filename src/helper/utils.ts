export const pipe = (...functions: Function[]) => (input: Function) =>
  functions.reduce((acc, fn) => fn(acc), input);
