import { Parser } from "../types";

export type schema = {
  description: string;
  properties: properties;
  type: string;
  [property: string]: any; // 其他属性
};

export type properties = {
  [key: string]: {
    description: string;
    type: string;
    items?: schema;
  };
};

export type responseType = {
  [key: string]: {
    content: jsonContent;
    description: string;
  };
};

export type commomPayloadValue = {
  content?: jsonContent;
  description?: string;
  required?: boolean;
};

export type handledcommonPayloadValue = {
  content?: schema;
  description?: string;
  required?: boolean;
};

export type handledResponseType = {
  [key: string]: {
    content: schema;
    description: string;
  };
};

export type jsonContent = {
  "application/json": {
    schema: schema;
  };
  "text/plain": {
    schema: schema;
  };
};

interface Property {
  [param: string]: any;
}

type SingleApiType = Parser.ProccessedData[] | null;

/**
 * 请求数据-params
 * @param obj
 */
export function paramFactory(obj: SingleApiType): Parser.ParamType[] {
  if (!obj) {
    return [];
  }
  return obj.map((d: Parser.ProccessedData) => ({
    name: d.name,
    type: d.schema.type,
    required: d.required,
    description: d.description,
    properties: d.schema.properties
  }));
}

/**
 * 请求数据-payload
 * @param obj
 */
export function payloadFactory(obj: commomPayloadValue): schema {
  if (!obj) {
    return {} as schema;
  }
  const resContent = extractPayloadContent(obj);
  return resContent;
}

/**
 * 解析api中的返回数据
 * @param obj
 */
export function returnFactory(obj: Parser.ProccessedData): schema {
  if (!obj) {
    return {} as schema;
  }
  const resContent = extractResponseContent(obj);
  return resContent;
}

/**
 * 解析swagger中的所有api
 * @param modules
 * @param parser
 */
export function parseModule(
  modules: Property,
  parser: (obj: object, index: number, tag: string) => {}
) {
  const apiObj: Property = {};
  for (const key in modules) {
    const apis = modules[key];

    const apiMaps = apis.map((e: object, index: number) => {
      return parser(e, index, key);
    });
    apiObj[key] = apiMaps;
  }
  return apiObj;
}

/**
 * 解析api中的response
 * @param response
 */
function extractResponseContent(response: responseType): schema {
  const res = response["200"];
  const schema = extractSchema(res.content);
  return schema;
}

/**
 * 解析api中的payload
 * @param payload
 */
function extractPayloadContent(payload: commomPayloadValue): schema {
  if (!payload) {
    return {} as schema;
  }
  const schema = extractSchema(payload.content!);
  return schema;
}

function extractSchema(obj: jsonContent) {
  const origin = obj["application/json"] || obj["text/plain"];
  return origin.schema;
}
