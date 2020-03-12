import { isString } from "lodash"
import { REQUEST_ERROR } from "../errorMap"
import { window } from "vscode"

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

export const isHTML = (str: string) => {
  return /\<\/html\>/.test(str)
}

export const isValidRequestBody = (body: any) => {
  if (isString(body) && isHTML(body)) {
    return REQUEST_ERROR.ILLEGAL_BODY
  }
  return true
}
