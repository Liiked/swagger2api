import {
  TreeItem,
  TreeItemCollapsibleState,
  Command,
  commands,
  TreeDataProvider,
  window,
  Event,
  EventEmitter,
  workspace,
  Uri
} from "vscode"
import * as path from "path"
import { TreeViewType, TreeViewTypeToIcon, API, Parser } from "../../types"
import * as _ from "lodash"
import { schema } from "../../codeTemplateProvider/swaggerAnalyser"
import Storage from "../../storeManage/storage"

const Icons: { [key in TreeViewType]: TreeViewTypeToIcon } = {
  [TreeViewType.apiProject]: TreeViewTypeToIcon.apiProject,
  [TreeViewType.apiModule]: TreeViewTypeToIcon.apiModule,
  [TreeViewType.apiItem]: TreeViewTypeToIcon.apiItem,
  [TreeViewType.method]: TreeViewTypeToIcon.method,
  [TreeViewType.operationId]: TreeViewTypeToIcon.operationId,
  [TreeViewType.params]: TreeViewTypeToIcon.params,
  [TreeViewType.payload]: TreeViewTypeToIcon.payload,
  [TreeViewType.response]: TreeViewTypeToIcon.response,
  [TreeViewType.title]: TreeViewTypeToIcon.title,
  [TreeViewType.url]: TreeViewTypeToIcon.url,
  [TreeViewType.properties]: TreeViewTypeToIcon.properties,
  [TreeViewType.swaggerItem]: TreeViewTypeToIcon.swaggerItem,
  [TreeViewType.name]: TreeViewTypeToIcon.name,
  [TreeViewType.type]: TreeViewTypeToIcon.type,
  [TreeViewType.items]: TreeViewTypeToIcon.items,
  [TreeViewType.required]: TreeViewTypeToIcon.required,
  [TreeViewType.description]: TreeViewTypeToIcon.description
}

// 辅助函数
const Keys = Object.keys

export class JsonDataProvider
  implements TreeDataProvider<JsonData | JsonData[]> {
  private _onDidChangeTree: EventEmitter<
    JsonData | JsonData[] | undefined
  > = new EventEmitter<JsonData | undefined>()
  readonly onDidChangeTreeData: Event<JsonData | JsonData[] | undefined> = this
    ._onDidChangeTree.event
  constructor(private workspaceRoot: string, private storage: Storage) {}

  /**
   * 接口实现
   * @param item
   */
  async refresh() {
    await commands.executeCommand("s2a.test.configProvider.genMetaData")
    this._onDidChangeTree.fire()
  }
  export() {}
  /**
   * 接口实现
   * @param item treeview项
   */
  getTreeItem(item: JsonData): TreeItem {
    return item
  }
  /**
   * 接口实现
   * @param item treeview项
   */
  getChildren(item?: JsonData): Thenable<JsonData[]> {
    if (!this.workspaceRoot) {
      window.showInformationMessage("No dependency in empty workspace")
      return Promise.resolve([])
    }
    if (item) {
      return this.parseApiData(item)
    }
    return this.parseApiData()
  }

  /**
   * getChildren的具体实现
   * @param el treeview项
   */
  async parseApiData(el?: JsonData): Promise<JsonData[]> {
    if (!el) {
      const rawStorage = await this.storage.readFile()
      if (!rawStorage) {
        await commands.executeCommand("s2a.test.configProvider.genMetaData")
        // TODO: 用户弹框选择是否刷新数据
        window.showWarningMessage(
          "Workspace doesn't include any swagger data. You can try convert a Swagger file first."
        )
        return []
      }
      const apiMetaJSON: API.List = JSON.parse(rawStorage.toString())
      if (!Keys(apiMetaJSON).length) {
        return []
      }
      const arr = this.generateTreeItemOfTags(apiMetaJSON)
      return Promise.resolve(
        arr.map(
          d => new JsonData(d.label, d.type, d.collapsibleState, d.children)
        )
      )
    } else {
      return el.children
        ? Array.isArray(el.children)
          ? el.children.map(
              d =>
                new JsonData(
                  d.label,
                  d.type,
                  d.collapsibleState,
                  d.children,
                  d.description
                )
            )
          : [
              new JsonData(
                el.children.label,
                el.children.type,
                el.children.collapsibleState,
                el.children.children,
                el.children.description
              )
            ]
        : []
    }
  }

  private generateTreeItemOfTags(apis: API.List) {
    const ApiOfTags = []
    for (const key in apis) {
      const apiInTags = apis[key]
      const template = {
        label: key,
        type: TreeViewType.apiModule,
        collapsibleState: apiInTags.length,
        children: this.generateTreeItemOfAPIs(apiInTags)
      }
      ApiOfTags.push(template)
    }
    return ApiOfTags
  }

  private generateTreeItemOfAPIs = (
    apiCollection: API.SingleItem[]
  ): API.TreeviewItemObject[] => {
    return apiCollection.map(api => {
      return {
        label: api.operationId,
        type: TreeViewType.apiItem,
        collapsibleState: TreeItemCollapsibleState.Collapsed,
        children: this.generateTreeItemOfAPI(api),
        description: api.title
      }
    })
  }

  private generateTreeItemOfAPI = (
    singleAPI: API.SingleItem | schema | Parser.ParamType
  ): API.TreeviewItemObject[] => {
    if (_.isArray(singleAPI)) {
      return (singleAPI as Parser.ParamType[]).map(d => {
        const kString = d.type as keyof typeof TreeViewType
        return {
          label: d.name || d.description,
          type: TreeViewType[kString],
          collapsibleState:
            this.isCollaspe(d.properties) ||
            (d.description
              ? TreeItemCollapsibleState.Collapsed
              : TreeItemCollapsibleState.None),
          description: d.description,
          children: this.generateTreeItemOfAPI(d)
        }
      })
    }
    if (_.isObject(singleAPI)) {
      return Keys(singleAPI).map((key: string) => {
        const property: API.SingleItem | schema = singleAPI[key]
        const kString = key as keyof typeof TreeViewType
        const readable =
          _.isString(property) || _.isNumber(property) || _.isBoolean(property)
        const desc = readable
          ? String(property)
          : property.title ||
            `${property.type || ""} ${property.description || ""}`
        return {
          label: key,
          type: TreeViewType[kString],
          collapsibleState: this.isCollaspe(property),
          description: this.descriptionOfKey(key, desc),
          children: this.generateTreeItemOfAPI(property)
        }
      })
    }
    return []
  }

  /**
   * 辅助函数-展示内置类型
   * @param key 键名
   * @param desc
   */
  private descriptionOfKey(key: string, desc: string) {
    if (key === TreeViewType.properties) {
      return "{} object"
    }
    if (key === TreeViewType.params) {
      return "[] array"
    }
    return desc
  }

  /**
   * 辅助函数-是否可展开
   * @param data 任意数据
   */
  isCollaspe = (data: API.SingleItem | schema) => {
    if (data instanceof Array && data.length) {
      return TreeItemCollapsibleState.Collapsed
    }
    if (_.isObject(data) && Keys(data).length) {
      return TreeItemCollapsibleState.Collapsed
    }
    return TreeItemCollapsibleState.None
  }

  /**
   * 储存路径
   * @param former
   * @param next
   */
  savePath(former: string, next: string | number) {
    return former ? former + "." + String(next) : String(next)
  }
}

export class JsonData extends TreeItem {
  constructor(
    // 基础描述
    public readonly label: string, // 标签名
    public readonly type: TreeViewType, // 类型
    public readonly collapsibleState: TreeItemCollapsibleState, // 是否可折叠
    // 详细描述
    public readonly children?:
      | API.TreeviewItemObject[]
      | API.TreeviewItemObject, // 子treeview
    public readonly content?: string, // 描述
    public readonly command?: Command, // 调用命令
    public readonly diffStatus?: string // diff结果
  ) {
    super(label, collapsibleState)
    const itemInIcon = type in TreeViewType
    this.setIcon(Icons[itemInIcon ? type : TreeViewType.name])
  }

  get tooltip() {
    return `${this.label}`
  }

  get description(): string {
    return this.content || ""
  }

  private setIcon(iconName: string) {
    if (!iconName) {
      return
    }
    // TODO: 需要将media文件夹打包进去
    this.iconPath = {
      light: Uri.parse(
        path.join(
          __filename,
          "..",
          "..",
          "..",
          "media",
          "light",
          `${iconName}.svg`
        )
      ),
      dark: Uri.parse(
        path.join(
          __filename,
          "..",
          "..",
          "..",
          "media",
          "dark",
          `${iconName}.svg`
        )
      )
    }
  }
}
