import { schema } from "./codeTemplateProvider/swaggerAnalyser"
import { TreeItemCollapsibleState, Command } from "vscode"

export enum TreeViewType {
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
  properties = "properties",
  items = "items",
  // subItem类型
  swaggerItem = "swaggerItem",
  name = "name",
  type = "type",
  required = "required",
  description = "description"
}

// 左值同上
export enum TreeViewTypeToIcon {
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
  properties = "property",
  items = "property",
  // subItem类型
  swaggerItem = "property",
  name = "item",
  type = "type",
  required = "required",
  description = "text"
}

export declare namespace Parser {
  interface ProccessedData {
    [param: string]: any
    name: string
    schema: Schema
    required: boolean
    description: string
    properties: object
    "200": {
      content: Property
      schema: Schema
    }
    content: {
      "application/json": {
        schema: Schema
      }
    }
  }

  interface Schema {
    properties: object | string
    type: string
    $ref: string
  }

  interface ParamType {
    name: string
    type: string
    required: boolean
    description: string
    [key: string]: any
  }

  interface SwaggerItem extends ParamType {
    subItems?: SwaggerItem[]
  }
}

// 返回结果
export declare namespace API {
  interface List {
    [apiName: string]: SingleItem[]
  }
  interface SingleItem {
    [TreeViewType.method]: string
    [TreeViewType.operationId]: string
    [TreeViewType.url]: string
    [TreeViewType.title]: string
    [TreeViewType.params]: Parser.ParamType[]
    [TreeViewType.payload]: schema
    [TreeViewType.response]: schema
    [property: string]: any // 其他属性
  }

  interface TreeviewItemObject {
    label: string
    type: TreeViewType
    collapsibleState: TreeItemCollapsibleState
    command?: Command
    description?: string
    children?: TreeviewItemObject[] | TreeviewItemObject
  }
}

interface Property {
  [param: string]: any
}
