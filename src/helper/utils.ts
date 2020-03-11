export const pipe = (...functions: Function[]) => (input: Function) =>
  functions.reduce((acc, fn) => fn(acc), input)

export const jsonToBuffer = (json: object): Buffer => {
  const str = JSON.stringify(json)
  return Buffer.from(str)
}

export const isPath = (str: string) => {
  return /\/\S+/g.test(str)
}

export const isTempalte = (content: string) => /#swagger2api/.test(content)
