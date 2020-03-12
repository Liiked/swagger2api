import axios from "axios"
import { REQUEST_ERROR } from "../errorMap"
import { isValidRequestBody } from "./utils"

export const fetchSwagger = async (url: string) => {
  const result = await axios.get(url)
  if (result.status !== 200) {
    throw REQUEST_ERROR.FAIL
  }
  const requestBodyValidateResult = isValidRequestBody(result.data)
  if (requestBodyValidateResult !== true) {
    throw requestBodyValidateResult
  }
  return result.data
}
