export const pipe = (...functions: Function[]) => (input: Function) =>
  functions.reduce((acc, fn) => fn(acc), input);

export const jsonToBuffer = (json: object): Buffer => {
  const str = JSON.stringify(json);
  return Buffer.from(str);
};
