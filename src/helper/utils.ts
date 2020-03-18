import { isString } from "lodash"
import { REQUEST_ERROR } from "../errorMap"
import { window } from "vscode"
import { FileType, FileVersion } from "../storeManage"

export const pipe = (...functions: Function[]) => (input: Function) =>
  functions.reduce((acc, fn) => fn(acc), input)

export const jsonToBuffer = (json: object): Buffer => {
  const str = JSON.stringify(json)
  return Buffer.from(str)
}

/**
 * encode store manage file name
 * @param type store file type
 * @param version store file version
 * @param fileName
 */
export const encodeStoreFileName = (
  type: FileType,
  version: FileVersion,
  fileName: string
) => {
  return `${type}_${version}_${fileName}`
}

/**
 * decode store manage file name
 * @param name fileName
 * @param p filePath
 */
export const decodeStoreFileName = (name: string, p: string) => {
  const [type, version, fileName] = name.split("_")
  return {
    type: Number(type),
    version,
    fileName,
    path: p
  }
}

export const isPath = (str: string) => {
  return /\/\S+/g.test(str)
}

export const isUrl = (str: string) => {
  return /^((https|http)?:\/\/)[^\s]+(\.json|\.yaml)$/.test(str)
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
