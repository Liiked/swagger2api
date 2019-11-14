import axios from "axios";
import SwaggerParser from "swagger-parser";
import { ExtensionContext } from "vscode";
import Storage from "./storage";
import path = require("path");
import fs = require("fs");

export class Fetch {
  constructor(private cxt: ExtensionContext) {}
  async fetchYaml(storage: Storage, url: string): Promise<any> {
    const result = await axios.get(url);
    const { data } = result;
    await storage.write(data, "remoteSourceData.yaml");
    const file = await storage.read("remoteSourceData.yaml");
    try {
      fs.accessSync(storage.cxt.storagePath + "/remoteSourceData.yaml");
    } catch (error) {
      console.error(error);
    }
    let api = await SwaggerParser.parse(
      storage.cxt.storagePath + "/remoteSourceData.yaml"
    );
    return api;
  }
}
