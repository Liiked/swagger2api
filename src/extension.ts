"use strict";

import * as vscode from "vscode";
import ConverToApi from "./toAPI";
import { readFileSync } from "fs";
import { parseModule } from "./parser";
import { JsonDataProvider } from "./swaggerData";
import { Fetch } from "./fetch";
import Storage from "./helper/storage";

let fullApi: any = null;

export function activate(context: vscode.ExtensionContext) {
  console.log('swagger2api says "Hello"');
  console.log(context.storagePath);

  const { subscriptions } = context;

  const convertTool = new ConverToApi();

  const saveFile: Storage = new Storage(context);
  const jsonDataProvider = new JsonDataProvider(
    vscode.workspace.rootPath || "",
    saveFile
  );
  const fetch = new Fetch(context);

  vscode.window.registerTreeDataProvider("swaggerToApi", jsonDataProvider);
  vscode.commands.registerCommand("s2a.refresh", () =>
    jsonDataProvider.refresh()
  );

  subscriptions.push(
    vscode.commands.registerCommand("s2a.readjson", async _ => {
      // read file content
      if (vscode.window.activeTextEditor) {
        const d = vscode.window.activeTextEditor.document;
        const content = d.getText();
        try {
          fullApi = convertTool.convert(content);
          const saveBuffer = saveFile.jsonToBuffer(fullApi);
          saveFile.writeFile(saveBuffer as Buffer);
        } catch (error) {
          vscode.window.showInformationMessage(error.message);
          console.error(error);
          return;
        }
      }
      // read template
      const temp = readFileSync(context.asAbsolutePath("./temp"), "utf8");
      let doc = await vscode.workspace.openTextDocument({
        content: temp,
        language: "javascript"
      });
      await vscode.window.showTextDocument(doc, { preview: false });
    })
  );

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

  subscriptions.push(
    vscode.commands.registerCommand("s2a.fetchSourceData", async () => {
      const result = await vscode.window.showInputBox({
        placeHolder:
          "For example: http://gitlab.XXX.com/project/raw/master/project/src/swagger/openapi.yaml"
      });
      console.log(result);
      if (!result) {
        return;
      }
      fetch.fetchYaml(saveFile, result as string).then(d => {
        const data = d;
        console.log(data);
      });
    })
  );
}
