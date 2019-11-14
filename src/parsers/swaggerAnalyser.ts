import { Parser } from "../types";

export type schema = {
  description: string;
  properties: properties;
  type: string;
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
    description: d.description
  }));
}

/**
 * 请求数据-payload
 * @param obj
 */
export function payloadFactory(obj: commomPayloadValue) {
  if (!obj) {
    return {};
  }
  const resContent = extractPayloadContent(obj);
  return resContent;
}

/**
 * 解析api中的返回数据
 * @param obj
 */
export function returnFactory(obj: Parser.ProccessedData): handledResponseType {
  if (!obj) {
    return {};
  }
  const resContent = extractResponseContent(obj);
  return resContent;
}

/**
 * 解析swagger中的所有api
 * @param modules
 * @param parser
 */
export function parseModule(modules: Property, parser: (obj: object) => {}) {
  const apiObj: Property = {};
  for (const key in modules) {
    const apis = modules[key];

    const apiMaps = apis.map((e: object) => {
      return parser(e);
    });
    apiObj[key] = apiMaps;
  }
  return apiObj;
}

/**
 * 解析api中的response
 * @param response
 */
function extractResponseContent(response: responseType): handledResponseType {
  const responses = Object.keys(response);
  const result: handledResponseType = {};
  responses.forEach(d => {
    const res = response[d];
    const schema = extractSchema(res.content);
    result[d] = {
      content: schema,
      description: res.description
    };
  });
  return result;
}

/**
 * 解析api中的payload
 * @param payload
 */
function extractPayloadContent(payload: commomPayloadValue) {
  if (!payload) {
    return {};
  }
  let result: handledcommonPayloadValue = {};
  const schema = extractSchema(payload.content!);
  result = {
    content: schema,
    description: payload.description,
    required: payload.required
  };
  return result;
}

function extractSchema(obj: jsonContent) {
  return obj["application/json"].schema;
}
