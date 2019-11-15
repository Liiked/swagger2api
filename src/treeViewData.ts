import {
  TreeItem,
  TreeItemCollapsibleState,
  Command,
  TreeDataProvider,
  window,
  Event,
  EventEmitter
} from "vscode";
import * as path from "path";
import { API, Parser, Storage } from "./types";

enum type {
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
  description = "description",
  subItems = "subItems"
}

const typeToIcon = {
  [type.apiProject]: "module",
  [type.apiModule]: "module",
  [type.apiItem]: "api",
  [type.method]: "method",
  [type.operationId]: "text",
  [type.params]: "object",
  [type.payload]: "object",
  [type.response]: "object",
  [type.title]: "text",
  [type.url]: "url",
  [type.swaggerItem]: "property",
  [type.name]: "item",
  [type.type]: "item",
  [type.required]: "required",
  [type.description]: "item",
  [type.subItems]: ""
};

// 辅助函数
const Keys = Object.keys;

export class JsonDataProvider implements TreeDataProvider<JsonData> {
  private _onDidChangeTree: EventEmitter<
    JsonData | undefined
  > = new EventEmitter<JsonData | undefined>();
  readonly onDidChangeTreeData: Event<JsonData | undefined> = this
    ._onDidChangeTree.event;
  constructor(private workspaceRoot: string, private storage: Storage) {}

  refresh(): void {
    this._onDidChangeTree.fire();
  }
  getTreeItem(item: JsonData): TreeItem {
    return item;
  }
  getChildren(item: JsonData): Thenable<JsonData[]> {
    if (!this.workspaceRoot) {
      window.showInformationMessage("No dependency in empty workspace");
      return Promise.resolve([]);
    }
    if (item) {
      return this.parseApiData(item);
    }

    return this.parseApiData();
  }
  async parseApiData(el?: JsonData): Promise<JsonData[]> {
    const rawStorage = await this.storage.readFile();
    const apiMetaJSON: API.List = JSON.parse(rawStorage.toString());

    if (!el) {
      const arr = Keys(apiMetaJSON).map(d => {
        return new JsonData(
          d,
          type.apiModule,
          TreeItemCollapsibleState.Collapsed,
          d
        );
      });
      return Promise.resolve(arr);
    }
    if (el.type === "apiModule") {
      const ApiModuleGroup: API.SingleItem[] = this.decodePathParent(
        apiMetaJSON,
        el.parentModule
      );
      const arr = ApiModuleGroup.map((d, index) => {
        return new JsonData(
          d.operationId,
          type.apiItem,
          TreeItemCollapsibleState.Collapsed,
          this.savePath(el.label, index)
        );
      });
      return Promise.resolve(arr);
    }
    if (el.type === "apiItem") {
      const { parentModule } = el;
      const targetApi: API.SingleItem = this.decodePathParent(
        apiMetaJSON,
        parentModule
      );
      const arr = Keys(targetApi).map(d => {
        const itemInApi = targetApi[d];
        const isDescription =
          typeof itemInApi === "number" || typeof itemInApi === "string";
        return new JsonData(
          d,
          d as type,
          !isDescription && itemInApi && itemInApi.length
            ? TreeItemCollapsibleState.Collapsed
            : TreeItemCollapsibleState.None,
          this.savePath(parentModule, d),
          isDescription ? itemInApi : undefined
        );
      });
      return Promise.resolve(arr);
    }
    if (
      el.type === type.params ||
      el.type === type.payload ||
      el.type === type.response
    ) {
      const { parentModule } = el;
      const targetObj: Parser.SwaggerItem[] = this.decodePathParent(
        apiMetaJSON,
        parentModule
      );
      const arr = targetObj.map((d, index) => {
        return new JsonData(
          d.name,
          type.swaggerItem,
          TreeItemCollapsibleState.Collapsed,
          this.savePath(parentModule, index),
          d.description
        );
      });
      return Promise.resolve(arr);
    }
    if (el.type === "swaggerItem") {
      const { parentModule } = el;
      const targetObj: Parser.SwaggerItem = this.decodePathParent(
        apiMetaJSON,
        parentModule
      );
      const arr = Keys(targetObj).map(d => {
        const value = targetObj[d];
        return new JsonData(
          d,
          d === "subItems" ? type.swaggerItem : (d as type),
          (Array.isArray(value) && value.length) || typeof value === "object"
            ? TreeItemCollapsibleState.Collapsed
            : TreeItemCollapsibleState.None,
          this.savePath(parentModule, d),
          typeof value === "string" || value === "number" || value === "boolean"
            ? value
            : undefined
        );
      });
      return Promise.resolve(arr);
    }
    return Promise.resolve([]);
  }
  savePath(former: string, next: string | number) {
    return former ? former + "." + String(next) : String(next);
  }
  decodePathParent(
    parent: { [key: string]: any },
    path: string | string[]
  ): any {
    if (!Array.isArray(path)) {
      const pathArr = path.split(".");
      const first = pathArr.shift();
      if (first) {
        return this.decodePathParent(parent[first], pathArr);
      } else {
        return parent;
      }
    } else {
      if (path.length) {
        return this.decodePathParent(parent[path.shift() as string], path);
      } else {
        return parent;
      }
    }
  }
}

export class JsonData extends TreeItem {
  constructor(
    // 基础描述
    public readonly label: string, // 标签名
    public readonly type: type, // 类型
    public readonly collapsibleState: TreeItemCollapsibleState, // 是否可折叠
    // 详细描述
    public readonly parentModule: string, // 属性路径
    public readonly content?: string, // 描述
    public readonly command?: Command // 调用命令
  ) {
    super(label, collapsibleState);
    this.setIcon(typeToIcon[type]);
  }

  get tooltip() {
    return `${this.label}`;
  }

  get description(): string {
    return this.content || "";
  }

  private setIcon(iconName: string) {
    if (!iconName) {
      return;
    }
    this.iconPath = {
      light: path.join(
        __filename,
        "..",
        "..",
        "media",
        "light",
        `${iconName}.svg`
      ),
      dark: path.join(
        __filename,
        "..",
        "..",
        "media",
        "dark",
        `${iconName}.svg`
      )
    };
  }
}
