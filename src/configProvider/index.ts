import { ExtensionContext, workspace, Uri, window } from "vscode";
import StoreManage from "../storeManage";
import { Config } from "./processConfig";
import { isPath } from "../helper/utils";
import { isArray, isBoolean, isString } from "lodash";
import { UserInputState } from "../viewManage/selector";
import SourceProvider from "../sourceProvider";
import { SourcePath, TemplatePath } from "../configProvider/processConfig";
import CodeTemplateProvider from "../codeTemplateProvider";
// import * as fs from "fs";
// import path from "path";

export default function ConfigProvider(cxt: ExtensionContext) {
  const storeManage = new StoreManage(cxt);
  const neccessaryConfig = ["source", "out", "templates"];
  const sourceProvider = new SourceProvider(cxt, storeManage);
  const codeTemplateProvider = new CodeTemplateProvider(cxt, storeManage);
  // const userConfigPath = storeManage.userConfigPath;
  // const workpath =  workspace.rootPath;

  /**
   * initaite
   * @param cxt
   */
  async function init(config?: Config) {
    const userConfig = config || (await storeManage.readUserConfig());
    if (!userConfig) {
      throw "config data parse error!";
    }
    if (validate(userConfig)) {
      throw "config validate failed!";
    }
    return {
      userConfig
    };
  }

  /**
   * validate config
   * @param config
   */
  function validate(config: Config) {
    return integrityValidate(config) && legalityValidate(config);
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
  async function generateConfigFiles(userConfig?: Config) {
    const config = userConfig || (await storeManage.readUserConfig());
    if (!config) {
      return;
    }
    generateMetaFiles(config.source);
    generateTemplateFiles(config.templates);
  }
  /**
   * generate s2a meta files
   * @param sourcePath
   */
  async function generateMetaFiles(
    sourcePath: string | string[] | SourcePath[]
  ) {
    if (isString(sourcePath)) {
      sourceProvider.save(sourcePath);
    }
    if (isArray(sourcePath) && isString(sourcePath[0])) {
      sourceProvider.save(sourcePath[0]);
    }
    console.log("Meta Files Generated!");
  }

  /**
   * generate final export code folder
   * @param outPath
   */
  async function generateOutFiles(outPath: string) {}

  /**
   * generate code template folder & files
   * @param tempPath
   */
  async function generateTemplateFiles(tempPath: string | TemplatePath[]) {
    const {
      codeTemp,
      mockTemp
    } = await codeTemplateProvider.exportOriginTemp();
    if (isString(tempPath)) {
      await storeManage.workSpaceSave(tempPath + "/codeTemp.js", codeTemp);
      await storeManage.workSpaceSave(tempPath + "/mockTemp.js", mockTemp);
      console.log("Tempalte Files Generated!");
    }
  }

  return { init, generateConfigFiles };
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
