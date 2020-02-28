import {
  window,
  Disposable,
  Uri,
  QuickPickItem,
  workspace,
  InputBoxOptions
} from "vscode";
import * as path from "path";
import * as cp from "child_process";

/**
 * 快速列表选择
 * @param options 选项
 * @param handler 处理函数
 * @param placeHolder 占位文本
 */
export async function quickListSelect(
  options: [],
  handler: (item: any) => {},
  placeHolder?: string
) {
  const result = await window.showQuickPick(options, {
    placeHolder,
    onDidSelectItem: handler
  });
  return result;
}

/**
 * 快速输入
 * @param options
 */
export async function quickInput(options: InputBoxOptions) {
  const result = await window.showInputBox(options);
  return result;
}

// TODO: 多步骤选择工具

/**
 * 快速文件选择
 */
export async function quickFileSelect() {
  const uri = await pickFile();
  if (uri) {
    return uri;
  }
  return null;
}

class FileItem implements QuickPickItem {
  label: string;
  description: string;

  constructor(public base: Uri, public uri: Uri) {
    this.label = path.basename(uri.fsPath);
    this.description = path.dirname(path.relative(base.fsPath, uri.fsPath));
  }
}

class MessageItem implements QuickPickItem {
  label: string;
  description = "";
  detail: string;

  constructor(public base: Uri, public message: string) {
    this.label = message.replace(/\r?\n/g, " ");
    this.detail = base.fsPath;
  }
}

async function pickFile() {
  const disposables: Disposable[] = [];
  try {
    return await new Promise<Uri | undefined>((resolve, reject) => {
      const input = window.createQuickPick<FileItem | MessageItem>();
      input.placeholder = "Type to search for files";
      let rgs: cp.ChildProcess[] = [];
      disposables.push(
        input.onDidChangeValue(value => {
          rgs.forEach(rg => rg.kill());
          if (!value) {
            input.items = [];
            return;
          }
          input.busy = true;
          const cwds = workspace.workspaceFolders
            ? workspace.workspaceFolders.map(f => f.uri.fsPath)
            : [process.cwd()];
          const q = process.platform === "win32" ? '"' : "'";
          rgs = cwds.map(cwd => {
            const rg = cp.exec(
              `rg --files -g ${q}*${value}*${q}`,
              { cwd },
              (err, stdout) => {
                const i = rgs.indexOf(rg);
                if (i !== -1) {
                  if (rgs.length === cwds.length) {
                    input.items = [];
                  }
                  if (!err) {
                    input.items = input.items.concat(
                      stdout
                        .split("\n")
                        .slice(0, 50)
                        .map(
                          relative =>
                            new FileItem(
                              Uri.file(cwd),
                              Uri.file(path.join(cwd, relative))
                            )
                        )
                    );
                  }
                  if (
                    err &&
                    !(<any>err).killed &&
                    (<any>err).code !== 1 &&
                    err.message
                  ) {
                    input.items = input.items.concat([
                      new MessageItem(Uri.file(cwd), err.message)
                    ]);
                  }
                  rgs.splice(i, 1);
                  if (!rgs.length) {
                    input.busy = false;
                  }
                }
              }
            );
            return rg;
          });
        }),
        input.onDidChangeSelection(items => {
          const item = items[0];
          if (item instanceof FileItem) {
            resolve(item.uri);
            input.hide();
          }
        }),
        input.onDidHide(() => {
          rgs.forEach(rg => rg.kill());
          resolve(undefined);
          input.dispose();
        })
      );
      input.show();
    });
  } finally {
    disposables.forEach(d => d.dispose());
  }
}