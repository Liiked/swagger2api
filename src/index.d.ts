declare namespace Parser {
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
    $ref: string;
    type: string;
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

declare namespace API {
  interface List {
    [apiName: string]: SingleItem[];
  }
  interface SingleItem {
    [type.method]: string;
    [type.operationId]: string;
    [type.paramObj]: Parser.ParamType[];
    [type.payloadObj]: Parser.SwaggerItem[];
    [type.url]: string;
    [type.title]: string;
    [type.returnObj]: Parser.SwaggerItem[];
    [property: string]: any; // 其他属性
  }

  enum type {
    apiModule = "apiModule", // api模块
    apiItem = "apiItem", // 单个api
    method = "method",
    operationId = "operationId",
    paramObj = "paramObj",
    payloadObj = "payloadObj",
    returnObj = "returnObj",
    title = "title",
    url = "url"
  }
}

declare interface Storage {
  jsonToBuffer(json: object): Buffer | undefined;
  writeFile(content: Buffer): Thenable<void>;
  readFile(): Thenable<Uint8Array>;
}

interface Property {
  [param: string]: any;
}
