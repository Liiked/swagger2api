import {
  handledResponseType,
  handledcommonPayloadValue
} from "./parsers/swaggerAnalyser";

// 空数据字符
const defaultArrayPlaceholder = "[]";
const defaultObjectPlaceholder = "{}";

export declare namespace Parser {
  interface ProccessedData {
    [param: string]: any;
    name: string;
    schema: Schema;
    required: boolean;
    description: string;
    properties: object;
    "200": {
      content: Property;
      schema: Schema;
    };
    content: {
      "application/json": {
        schema: Schema;
      };
    };
  }

  interface Schema {
    properties: object | string;
    type: string;
    $ref: string;
  }

  interface ParamType {
    name: string;
    type: string;
    required: boolean;
    description: string;
    [key: string]: any;
  }

  interface SwaggerItem extends ParamType {
    subItems?: SwaggerItem[];
  }
}

// 返回结果
export declare namespace API {
  interface List {
    [apiName: string]: SingleItem[];
  }
  interface SingleItem {
    [type.method]: string;
    [type.operationId]: string;
    [type.params]: Parser.ParamType[];
    [type.payload]: handledcommonPayloadValue;
    [type.url]: string;
    [type.title]: string;
    [type.response]: handledResponseType;
    [property: string]: any; // 其他属性
  }

  enum type {
    apiModule = "apiModule", // api模块
    apiItem = "apiItem", // 单个api
    method = "method",
    operationId = "operationId",
    params = "params",
    payload = "payload",
    response = "response",
    title = "title",
    url = "url"
  }
}

export declare interface Storage {
  jsonToBuffer(json: object): Buffer | undefined;
  writeFile(content: Buffer): Thenable<void>;
  readFile(): Thenable<Uint8Array>;
}

interface Property {
  [param: string]: any;
}
