import {
  handledResponseType,
  handledcommonPayloadValue,
  schema
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
    [type.url]: string;
    [type.title]: string;
    [type.params]: Parser.ParamType[];
    [type.payload]: schema;
    [type.response]: schema;
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

  enum TreeViewType {
    apiProject = "apiProject", // 多项目时使用
    apiModule = "apiModule", // api模块
    apiItem = "apiItem", // 单个api
    method = "method",
    operationId = "operationId",
    params = "params",
    payload = "payload",
    response = "response",
    title = "title",
    url = "url",
    // subItem类型
    swaggerItem = "swaggerItem",
    name = "name",
    type = "type",
    required = "required",
    description = "description"
  }

  // 左值同上
  const enum TreeViewTypeToIcon {
    apiProject = "module",
    apiModule = "module",
    apiItem = "api",
    method = "method",
    operationId = "text",
    params = "object",
    payload = "object",
    response = "object",
    title = "text",
    url = "url",
    // subItem类型
    swaggerItem = "property",
    name = "item",
    type = "item",
    required = "required",
    description = "item",
    subItems = ""
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
