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
  }

  interface SwaggerItem {
    name: string;
    type: string;
    description: string;
    required: boolean;
    subItems?: SwaggerItem[];
  }
}

declare namespace API {
  interface List {
    [apiName: string]: SingleItem[];
  }
  interface SingleItem {
    method: string;
    operationId: string;
    paramObj: Parser.ParamType[];
    payloadObj: Parser.SwaggerItem[];
    url: string;
    title: string;
    returnObj: Parser.SwaggerItem[];
  }
}

interface Property {
  [param: string]: any;
}
