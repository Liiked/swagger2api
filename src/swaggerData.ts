import {
  TreeItem,
  TreeItemCollapsibleState,
  Command,
  TreeDataProvider,
  window,
  Event,
  EventEmitter
} from "vscode";

export class JsonDataProvider implements TreeDataProvider<JsonData> {
  private _onDidChangeTree: EventEmitter<
    JsonData | undefined
  > = new EventEmitter<JsonData | undefined>();
  readonly onDidChangeTreeData: Event<JsonData | undefined> = this
    ._onDidChangeTree.event;
  constructor(private workspaceRoot: string) {}

  refresh(data?: any): void {
    // if (!data) {
    //   return;
    // }
    // const arr = this.parseFullData(data);
    // this._onDidChangeTree.fire(arr[0]);
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
      return Promise.resolve([item]);
    }
    return Promise.resolve([]);
  }
  parseFullData(data: any) {
    const arr: JsonData[] = [];
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // const el = data[key];
        arr.push(new JsonData(key, TreeItemCollapsibleState.None));
      }
    }
    return arr;
  }
}

export class JsonData extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly command?: Command
  ) {
    super(label, collapsibleState);
  }

  get tooltip() {
    return `${this.label}`;
  }

  get description(): string {
    return this.label;
  }
}
