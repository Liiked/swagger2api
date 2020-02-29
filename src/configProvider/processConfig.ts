import { Uri, workspace } from "vscode";

interface PathObject {
  path: string;
  out: string;
}

interface SourcePath extends PathObject {
  from: string;
}

interface TemplatePath extends PathObject {
  out: string;
  templatePath: string;
  excludeApiPath: string[];
}

type Config = {
  control: boolean;
  generateDefination: boolean;
  source: string | string[] | SourcePath[];
  out: string;
  templates: TemplatePath[];
  excludeApiPath: string[];
};

export default class ProcessConfig {
  private configPath: Uri; // 配置文件路径
  private isControl: boolean; // 接管模式
  private useTypes: boolean; // 生成ts
  private source = []; // 源数据路径
  private out: Uri; // 输出文件夹
  private templates = []; // 输出模板
  constructor(configPath: string) {
    this.configPath = Uri.parse(configPath);
    this.isControl = false;
    this.useTypes = false;
    this.out = Uri.parse("");
  }
  // 将默认文件存入工作区
  static saveDefault() {}

  // 扫描和检查文件
  private scan() {}

  // 加载默认文件
  private loadDefault() {}
}
