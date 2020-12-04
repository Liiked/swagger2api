import { ViewColumn, MessageItem, window } from "vscode"

enum ErrorActions {
  ShowDetail = "Show Detail"
}

export default class ErrorHandler {
  static async showErrorMsg(msg: string, detail?: string) {
    const open: MessageItem = { title: ErrorActions.ShowDetail }
    const result = await window.showErrorMessage(msg, open)
    console.log(result)
    if (result && result.title === ErrorActions.ShowDetail && detail) {
      this.createErrorView(detail)
    }
  }

  static createView(title: string) {
    return window.createWebviewPanel(
      "swagger2api_error_handler",
      title,
      ViewColumn.One,
      {}
    )
  }
  static createErrorView(msg: string) {
    // TODO: 添加样式，处理错误显示
    const view = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Swagger2api ErrorHandler</title>
    </head>
    <body>
       ${msg}
    </body>
    </html>
    `
    const panel = this.createView("Swagger2api ErrorHandler")
    panel.webview.html = view
  }
}
