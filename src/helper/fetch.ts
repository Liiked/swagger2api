import axios from "axios";
import SwaggerParser from "swagger-parser";
import { ExtensionContext, Uri } from "vscode";
import Storage from "./storage";
import path = require("path");
import fs = require("fs");

export class Fetch {
  constructor(private cxt: ExtensionContext) {}
  async fetchYaml(storage: Storage, url: string): Promise<Uri> {
    const result = await axios.get(url);
    const { data } = result;
    await storage.write(data, "remoteSourceData.yaml");
    fs.accessSync(storage.cxt.storagePath + "/remoteSourceData.yaml");
    return Uri.parse(storage.cxt.storagePath + "/remoteSourceData.yaml");
  }
}
