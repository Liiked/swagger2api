import {
  QuickPickItem,
  window,
  QuickInputButton,
  ExtensionContext,
  Uri
} from "vscode";

import { MultiStepInput } from "./multiStepInput";

// TODO: 非必要按钮
class MyButton implements QuickInputButton {
  constructor(
    public iconPath: { light: Uri; dark: Uri },
    public tooltip: string
  ) {}
}

export interface UserInputState {
  title: string;
  step: number;
  totalSteps: number;
  sourceFrom: QuickPickItem | null;
  sourcePath: string;
  outPath: string;
}

export default async function ConfigSelector(cxt: ExtensionContext) {
  const title = "创建swagger2api配置文件";
  const createResourceGroupButton = new MyButton(
    {
      dark: Uri.file(cxt.asAbsolutePath("media/dark/url.svg")),
      light: Uri.file(cxt.asAbsolutePath("media/light/url.svg"))
    },
    "Create Resource Group"
  );
  const sourceOptions: QuickPickItem[] = [
    "来自本地",
    "来自远程"
  ].map(label => ({ label }));

  async function collectInputs() {
    const state = {} as Partial<UserInputState>;
    await MultiStepInput.run(input => pickSourceType(input, state));
    return state as UserInputState;
  }

  async function pickSourceType(
    input: MultiStepInput,
    state: Partial<UserInputState>
  ) {
    const pick = await input.showQuickPick({
      title,
      step: 1,
      totalSteps: 4,
      placeholder: "原始数据来源",
      items: sourceOptions,
      buttons: [createResourceGroupButton],
      shouldResume
    });
    // TODO: 按钮样式丢失
    if (pick instanceof MyButton) {
      console.log("click button");
      return (input: MultiStepInput) => inputSource(input, state);
    }
    state.sourceFrom = pick;
    return (input: MultiStepInput) => inputSource(input, state);
  }

  async function inputSource(
    input: MultiStepInput,
    state: Partial<UserInputState>
  ) {
    const isLocal =
      state.sourceFrom && state.sourceFrom.label === "来自本地" ? true : false;
    const prompt = isLocal
      ? "请输入本地路径，如 src/swagger.json"
      : "请输入远程路径，如 https://xxx.com/file.json";
    const defaultValue = isLocal
      ? "src/swagger.json"
      : "https://xxx.com/file.json";
    state.sourcePath = await input.showInputBox({
      title,
      step: 2,
      totalSteps: 4,
      value: defaultValue,
      prompt,
      validate: validateNameIsUnique, // TODO: 校验
      shouldResume: shouldResume
    });
    return (input: MultiStepInput) => inputOutPath(input, state);
  }

  async function inputOutPath(
    input: MultiStepInput,
    state: Partial<UserInputState>
  ) {
    state.outPath = await input.showInputBox({
      title,
      step: 3,
      totalSteps: 3,
      value: "/exportApi",
      prompt: "输出文件夹路径",
      validate: validateNameIsUnique, // TODO: 校验
      shouldResume: shouldResume
    });
  }

  async function validateNameIsUnique(name: string) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return name === "vscode" ? "Name not unique" : undefined;
  }

  function shouldResume() {
    // Could show a notification with the option to resume.
    return new Promise<boolean>((resolve, reject) => {});
  }

  const state = await collectInputs();
  window.showInformationMessage(`swagger2api 配置文件创建成功!`);
  return state;
}
