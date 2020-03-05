"use strict";

import * as vscode from "vscode";
import ConverToApi from "./sourceProvider/sourceDataProcessor";
import { readFileSync } from "fs";
import { parseModule } from "./codeTemplateProvider/swaggerAnalyser";
import { JsonDataProvider as TreeViewDataProvider } from "./viewManage/treeview/treeViewData";
import { Fetch } from "./storeManage/fetch";
import Storage from "./storeManage/storage";
import StoreManage from "./storeManage";
import SourceDataFetch from "./storeManage/sourceDataFetch";
import { ConfigSelector } from "./viewManage/selector";
import { parseUserInput } from "./configProvider";

import { showQuickPick, showInputBox } from "./viewManage/selector/basicInput";
// import { multiStepInput } from "./viewManage/selector/multiStepInput";
import { quickOpen } from "./viewManage/selector/quickOpen";

export function activate(context: vscode.ExtensionContext) {
  console.log('swagger2api says "Hello"');
  console.log(context.storagePath);

  const { subscriptions } = context;

  const convertTool = new ConverToApi();

  /**
   *
   * 初始化
   *
   */

  const storeManage = new StoreManage(context);

  const saveFile: Storage = new Storage(context);
  const treeProvider = new TreeViewDataProvider(
    vscode.workspace.rootPath || "",
    saveFile
  );

  // 远程数据
  const fetch = new Fetch(context);

  // 树视图
  vscode.window.registerTreeDataProvider("swaggerToApi", treeProvider);
  vscode.commands.registerCommand("s2a.refresh", () => treeProvider.refresh());

  /**
   *
   * 提交事件
   *
   **/
  subscriptions.push(
    vscode.commands.registerCommand(
      "s2a.test.viewManage.configSelector",
      async () => {
        const result = await ConfigSelector(context);
        const config = parseUserInput(result);
        if (!config) {
          return;
        }
        storeManage.saveUserConfig(config);
        console.log(config);
      }
    )
  );
  subscriptions.push(
    vscode.commands.registerCommand(
      "s2a.test.storeManage.genConfig",
      async () => {
        storeManage.saveUserConfig({
          source: ["http://www.example.com/swagger.json"],
          out: "/exportApi",
          templates: "/.s2a/templates/template.js"
        });
      }
    )
  );

  subscriptions.push(
    vscode.commands.registerCommand("s2a.quickInput", async () => {
      const options: {
        [key: string]: (context: vscode.ExtensionContext) => Promise<void>;
      } = {
        showQuickPick,
        showInputBox,
        // multiStepInput,
        quickOpen
      };
      const quickPick = vscode.window.createQuickPick();
      quickPick.items = Object.keys(options).map(label => ({ label }));
      quickPick.onDidChangeSelection(selection => {
        if (selection[0]) {
          options[selection[0].label](context).catch(console.error);
        }
      });
      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    })
  );

  // 获取数据源-当前打开文件
  subscriptions.push(
    vscode.commands.registerCommand("s2a.readjson", async _ => {
      // read file content
      try {
        SourceDataFetch.fromActiveFile(context);
        // read template
        const temp = readFileSync(context.asAbsolutePath("./temp"), "utf8");
        let doc = await vscode.workspace.openTextDocument({
          content: temp,
          language: "javascript"
        });
        await vscode.window.showTextDocument(doc, { preview: false });
      } catch (error) {
        vscode.window.showErrorMessage(error.message);
      }
    })
  );

  // 获取数据源-选择一个文件
  subscriptions.push(
    vscode.commands.registerCommand("s2a.fetchSourceBySelect", async _ => {
      // read file content
      try {
        SourceDataFetch.fromSelectFile();
      } catch (error) {
        vscode.window.showErrorMessage(error.message);
      }
    })
  );

  // 获取数据源-远程数据源
  subscriptions.push(
    vscode.commands.registerCommand("s2a.fetchSourceData", async () => {
      try {
        SourceDataFetch.fromRemoteFile(context);
      } catch (error) {
        vscode.window.showErrorMessage(error.message);
      }
    })
  );

  // 转换数据
  subscriptions.push(
    vscode.commands.registerCommand("s2a.convert", async () => {
      const rootPath = vscode.workspace.rootPath;

      if (!rootPath) {
        vscode.window.showErrorMessage("Error: no workspace found!");
        return;
      }
      const workspacePath = vscode.Uri.parse("file://" + rootPath);
      convertTool.cleanDir(workspacePath);
      convertTool.genDir(workspacePath);

      // reading file content
      if (vscode.window.activeTextEditor) {
        const d = vscode.window.activeTextEditor.document;
        const content = d.getText();
        const isTempalte = /#swagger2api/.test(content);
        let eachApiTemplate;
        if (!isTempalte) {
          vscode.window.showErrorMessage(
            "Template parse error: incorrect template identifier"
          );
          return;
        }
        try {
          eachApiTemplate = eval("(" + content + ")");
        } catch (error) {
          vscode.window.showErrorMessage(
            "Template parse error: check help here."
          );
          vscode.window.showInformationMessage(error.message);
          console.error(error);
          return;
        }
        try {
          const saveFile: Storage = new Storage(context);
          const apiBuffer = await saveFile.readFile();
          const fullApi = JSON.parse(apiBuffer.toString());
          if (fullApi) {
            const parsed = parseModule(fullApi, eachApiTemplate);
            // jsonDataProvider.refresh(fullApi);
            for (const key in parsed) {
              const el = parsed[key];
              convertTool.genFile(`/${key}.js`, el.join("\n"));
            }
          }
          vscode.window.showInformationMessage(
            'Api exported successfully! Files has been exported to "exportAPI"'
          );
        } catch (error) {
          vscode.window.showErrorMessage(error.message);
          console.error(error);
        }
      }
    })
  );
  // 生成配置文件
  subscriptions.push(
    vscode.commands.registerCommand("s2a.createConfig", async params => {
      const defaultConfig = readFileSync(
        context.asAbsolutePath("./s2a.config.js"),
        "utf8"
      );
      const savePath = vscode.workspace.rootPath + "/s2a.config.js";
      const isExisted = saveFile.pathExists(savePath);
      // 判断文件是否存在
      if (isExisted) {
        vscode.window.showErrorMessage("Swagger2api config exists!");
        return;
      }
      vscode.workspace.fs.writeFile(
        vscode.Uri.parse(savePath),
        Buffer.from(defaultConfig)
      );
      vscode.window.showInformationMessage(
        "Swagger2api config successfully generated!"
      );
    })
  );
  // 清理缓存
  subscriptions.push(
    vscode.commands.registerCommand("s2a.clearCache", async () => {
      saveFile.clearFile();
    })
  );
}
