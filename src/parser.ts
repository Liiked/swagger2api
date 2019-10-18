export function paramFactory(
  obj: Parser.ProccessedData | Parser.ProccessedData[]
): Parser.ParamType[] {
  if (!obj) {
    return [];
  }
  return (obj as any[]).map((d: Parser.ProccessedData) => ({
    name: d.name,
    type: d.schema.type,
    required: d.required,
    description: d.description
  }));
}

export function payloadFactory(
  obj: Parser.ProccessedData | Parser.ProccessedData[],
  fullObj: Parser.ProccessedData
): Parser.SwaggerItem[] {
  if (!obj) {
    return [];
  }
  const ref = (obj as Parser.ProccessedData).content["application/json"].schema
    .$ref;
  const requestBody = retriveJSON(fullObj, parseRef(ref));
  return extractParamFromRequest(requestBody, fullObj);
}

export function returnFactory(
  obj: Parser.ProccessedData,
  fullObj: Parser.ProccessedData
): Parser.SwaggerItem[] {
  const successObj = obj["200"];
  const schema = Object.values(successObj.content)[0].schema;
  const ref = schema.$ref;
  if (ref) {
    const returnData = retriveJSON(fullObj, parseRef(ref));
    return extractParamFromRequest(returnData, fullObj);
  }
  return [];
}

export function parseModule(modules: Property, parser: (obj: object) => {}) {
  const apiObj: Property = {};
  for (const key in modules) {
    const apis = modules[key];

    const apiMaps = apis.map((e: object) => {
      return parser(e);
    });
    apiObj[key] = apiMaps;
  }
  return apiObj;
}

function extractParamFromRequest(
  obj: Parser.ProccessedData,
  fullObj: Parser.ProccessedData
): Parser.SwaggerItem[] {
  const { properties, description: desc, required } = obj;
  const allJSONFile = fullObj;
  if (!properties) {
    return [];
  }
  return Object.keys(properties).map(name => {
    const { type, items, description: subDesc } = (properties as Property)[
      name
    ];
    let innerItem = null;

    if (type === "array") {
      if (items.type === "object") {
        const subItem: Parser.SwaggerItem[] = extractParamFromRequest(
          items,
          allJSONFile
        );
        innerItem = subItem;
      } else {
        const subItem = items.$ref
          ? extractParamFromRequest(
              retriveJSON(allJSONFile, parseRef(items.$ref)),
              allJSONFile
            )
          : {
              type: items.type
            };
        innerItem = subItem;
      }
    }

    if (items && items.$ref) {
      const subItem = items.$ref
        ? extractParamFromRequest(
            retriveJSON(allJSONFile, parseRef(items.$ref)),
            allJSONFile
          )
        : {
            type: items.type
          };
      innerItem = subItem;
    }

    return Object.assign(
      {
        name,
        type,
        description: subDesc ? subDesc : desc,
        required
      },
      {
        subItems: innerItem
      }
    );
  });
}

function parseRef(path: string): string[] {
  return path
    .replace(/#/, "")
    .replace(/\//, "")
    .split("/");
}

function retriveJSON(
  obj: Parser.ProccessedData,
  path: string[]
): Parser.ProccessedData {
  if (path.length > 1) {
    return retriveJSON(obj[path.shift() as string], path);
  }
  return obj[path.shift() as string];
}
