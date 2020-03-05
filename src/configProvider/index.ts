import { ExtensionContext, workspace, Uri, window } from "vscode";
import StoreManage from "../storeManage";
import { Config } from "./processConfig";
import { isPath } from "../helper/utils";
import { isArray, isBoolean, isString } from "lodash";
import { UserInputState } from "../viewManage/selector";
import * as fs from "fs";
import path from "path";

export default async function ConfigProvider(cxt: ExtensionContext) {
  const storeManage = new StoreManage(cxt);
  const userConfigPath = storeManage.userConfigPath;
  const neccessaryConfig = ["source", "out", "templates"];
  // const workpath =  workspace.rootPath;

  /**
   * initaite
   * @param cxt
   */
  async function init(cxt: ExtensionContext) {
    const userConfig = await storeManage.readUserConfig();
    if (!userConfig) {
      throw "config data parse error!";
    }
    if (!integrityValidate(userConfig) || !legalityValidate(userConfig)) {
      throw "config validate failed!";
    }
    return {
      userConfig
    };
  }

  /**
   * validate config integrity
   * @param config
   */
  function integrityValidate(config: Config): boolean {
    const keys = Object.keys(config);
    // neccessary keys check
    if (!neccessaryConfig.every(d => keys.includes(d))) {
      return false;
    }

    const { control, generateDefination, source, out, templates } = config;
    if (!isArray(source) && !isString(source)) {
      return false;
    }
    if (!isString(out)) {
      return false;
    }
    if (!isArray(templates) && !isString(templates)) {
      return false;
    }
    if (control && !isBoolean(control)) {
      return false;
    }
    if (generateDefination && !isBoolean(generateDefination)) {
      return false;
    }
    return true;
  }

  /**
   * validate config legality
   * @param config
   */
  function legalityValidate(config: Config): boolean {
    const { source, out, templates } = config;
    if (typeof source === "string" && !isPath(source)) {
      window.showErrorMessage("source illegal");
      return false;
    }
    if (typeof out === "string" && !isPath(out)) {
      window.showErrorMessage("out illegal");
      return false;
    }
    if (typeof templates === "string" && !isPath(templates)) {
      window.showErrorMessage("templates illegal");
      return false;
    }
    return true;
  }

  /**
   * generate user template by config
   */
  function generateConfigFiles() {}
  function generateMetaFiles(sourcePath: string | string[]) {}
  function generateOutFiles(outPath: string) {}
  function generateTemplateFiles(tempPath: string) {}

  return init(cxt);
}

/**
 * make user config by selectors
 * @param inputs
 */
export function parseUserInput(inputs: UserInputState): Config | void {
  const { sourcePath, sourceFrom, outPath } = inputs;
  // TODO: local or remote logic
  if (sourceFrom?.label === "来自远程") {
    window.showErrorMessage("not support remote");
    return;
  }

  return {
    source: sourcePath,
    out: outPath,
    templates: "/.s2a/templates" // TODO: templates file structure
  };
}
