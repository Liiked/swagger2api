"use strict";

import * as vscode from "vscode";
import ConverToApi from "./toAPI";
import { readFileSync } from "fs";
import { parseModule } from "./parser";
import { JsonDataProvider } from "./swaggerData";
import Storage from "./helper/storage";

let fullApi: any = null;

export function activate(context: vscode.ExtensionContext) {
  console.log('swagger2api says "Hello"');
  console.log(context.storagePath);

  const convertTool = new ConverToApi();
  const jsonDataProvider = new JsonDataProvider(
    vscode.workspace.rootPath || ""
  );

  const saveFile = new Storage(context);
  const saveBuffer = saveFile.jsonToBuffer({ aaa: "111" });
  saveFile.writeFile(saveBuffer as Buffer).then(() => {
    saveFile.readFile().then(d => {
      console.log('file is');
      console.log(d);
    });
  });

  vscode.window.registerTreeDataProvider("swaggerToApi", jsonDataProvider);
  vscode.commands.registerCommand("s2a.refresh", () =>
    jsonDataProvider.refresh()
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("s2a.readjson", async _ => {
      // read file content
      if (vscode.window.activeTextEditor) {
        const d = vscode.window.activeTextEditor.document;
        const content = d.getText();
        try {
          fullApi = convertTool.convert(content);
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

  context.subscriptions.push(
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
}
