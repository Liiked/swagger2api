/* #swagger2api */

/**
 * Your code must be written within the 'eachApiTemplate' function which returns a string template.
 * Code written out the function will raise error.
 *
 * The demo function 'eachApiTemplate' have shown what you can get,
 * use those parameters to build your own template.
 *
 * It's free to use any javascript type file as the template,
 * just keep the format in accrodance with this file.
 *
 * Warning: comment #swagger2api can't be removed or you will find the Error 'No Template Found'.
 */
function eachApiTemplate(
  { method, operationId, params, payload, response, title, url },
  index,
  tag
) {
  // some help variable
  const basePath = ""
  const { properties } = payload

  // some help function
  function upperFirstLetter([str, ...rest]) {
    return str.toUpperCase() + rest.join("")
  }

  function docs(title, params, properties) {
    return `
    /**
     * ${title}
     ${paramDoc(params)}
     ${payloadDoc(properties)}
     * 
    */
    `
  }

  function paramDoc(params) {
    if (!params) {
      return ""
    }
    return params
      .map(
        d => `* @param ${d.name} {${d.type ? d.type : "*"}} ${d.description}\n`
      )
      .join("")
  }

  function payloadDoc(payload) {
    const payloadDoc = []
    if (!payload) {
      return ""
    }
    for (const key in payload) {
      const el = payload[key]
      payloadDoc.push(
        `* @param ${key} {${el.type ? el.type : "*"}} ${el.description}\n`
      )
    }
    return payloadDoc.join("")
  }

  return {
    apiImplement: `
      ${docs(title, params, properties)}
      export const api${
        operationId
          ? upperFirstLetter(operationId)
          : upperFirstLetter(tag) + index
      } = async (data) => {
        const res = request('${basePath}${url}', {
          method: '${method}',
          ${`${properties ? "data" : "params"}`}: data
        });
        return {}
      }
    `
  }
}
