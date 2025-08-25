import { promises as fs } from "fs";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function imageToBase64(path) {
  const imageBuffer = await fs.readFile(path);
  return imageBuffer.toString("base64");
}

export const printJson = (json: any) => {
  console.log(JSON.stringify(json, null, 2));
};
