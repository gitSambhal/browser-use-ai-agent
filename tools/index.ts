import { tool } from "@openai/agents";
import path from "path";
import { Browser, ImageFormat, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import z from "zod";
import { sleep } from "../utils";

puppeteer.use(StealthPlugin());

type Session = { browser: Browser; page: Page };
const sessions: Record<string, Session> = {};

function createSession(id: string, browser: Browser, page: Page) {
  sessions[id] = { browser, page };
}

function getSession(id: string): Session | undefined {
  return sessions[id];
}

const generateScreenshot = async (sessionId: string) => {
  const session = getSession(sessionId);
  if (!session) {
    throw new Error(`No active session found for ID: ${sessionId}`);
  }
  const { page } = session;
  // 4. Capture the screenshot.
  const time = new Date().getTime();
  const screenshotPath: `${string}.${ImageFormat}` = `${path.resolve(
    `screenshots/${time}`
  )}.jpeg`;

  await page.screenshot({
    path: screenshotPath,
    quality: 60,
    fullPage: true,
  });
  console.log(screenshotPath);
  // const base64Image = imageToBase64(screenshotPath);

  return screenshotPath;
};

export const openWebpage = async (url: string) => {
  // Using `headless: false` is great for debugging. For automated runs,
  // you might want to use the modern `headless: "new"`.
  const browser = await puppeteer.launch({
    // headless: "false",
    headless: false,
  });
  const page = await browser.newPage();

  // Set a realistic user agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36"
  );

  // 1. Set a consistent viewport for predictable rendering.
  await page.setViewport({ width: 1280, height: 720 });
  // await page.setViewport({ width: 1280, height: 5000 });

  // 2. Navigate and wait for the network to be idle. `networkidle0` is more reliable.
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 5000 });

  await sleep(2000);

  const sessionId = new Date().getTime().toString();
  createSession(sessionId, browser, page);

  return { browser, page, sessionId };
};

const closeBrowserSession = async (sessionId: string) => {
  const session = getSession(sessionId);
  if (!session) return;
  await session.browser.close();
  delete sessions[sessionId];
};

export const generateScreenshotTool = tool({
  name: "generateScreenshotTool",
  description:
    "This tool can take the screenshot of the given browser session and return the image path",
  parameters: z.object({ sessionId: z.string() }),
  async execute({ sessionId }) {
    console.log(`Inside generateScreenshotTool with sessionId: ${sessionId}`);
    return generateScreenshot(sessionId);
  },
});

export const openWebpageTool = tool({
  name: "openWebpageTool",
  strict: true,
  description:
    "This tool can open any webpage in the browser and returns the session id of the browser",
  parameters: z.object({ url: z.string() }),
  async execute({ url }) {
    console.log(`Inside openWebpageTool with url: ${url}`);
    const { sessionId } = await openWebpage(url);
    return sessionId;
  },
});

export const closeBrowserTool = tool({
  name: "closeBrowserTool",
  strict: true,
  description: "This tool can close the browser session",
  parameters: z.object({ sessionId: z.string() }),
  async execute({ sessionId }) {
    console.log(`Inside closeBrowserTool with sessionId: ${sessionId}`);
    return closeBrowserSession(sessionId);
  },
});

export const getCurrentTimeTool = tool({
  name: "getCurrentTimeTool",
  strict: true,
  description: "This tool can return the current time",
  parameters: z.object({}),
  async execute() {
    return new Date().getTime();
  },
});

export const scrollToFormTool = tool({
  name: "scrollToFormTool",
  strict: true,
  description: "This tool can scroll the page to the form by session id",
  parameters: z.object({ sessionId: z.string() }),
  async execute({ sessionId }) {
    console.log(`Inside scrollToFormTool with sessionId: ${sessionId}`);
    const session = getSession(sessionId);
    if (!session) {
      throw new Error(`No active browser session found for ID: ${sessionId}`);
    }
    const { page } = session;
    // Get the position of the first visible form
    const formPosition = await page.$eval("form", (form) => {
      const rect = form.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    });

    // Scroll to ensure it's in view
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.click(formPosition.x, formPosition.y);

    return {
      formPosition,
    };
  },
});

export const findFormAndInputs = async (sessionId: string) => {
  const session = getSession(sessionId);
  if (!session) {
    throw new Error(`No active browser session found for ID: ${sessionId}`);
  }
  const { page } = session;
  const form = await page.$("form");
  if (!form) {
    throw new Error("No form found on the page");
  }

  const inputs = await form.$$("input");
  if (inputs.length === 0) {
    throw new Error("No input found on the form");
  }
  const inputDetails = await Promise.all(
    inputs.map(async (input) => {
      return await input.evaluate((el) => ({
        name: el.getAttribute("name") || "",
        type: el.getAttribute("type") || "",
        id: el.getAttribute("id") || "",
        placeholder: el.getAttribute("placeholder") || "",
        value: el.value || "",
      }));
    })
  );

  return {
    inputDetails,
  };
};

export const prepareDummyDataForForm = (
  inputDetails: {
    name: string;
    type: string;
    id: string;
    placeholder: string;
    value: string;
  }[]
) => {
  return inputDetails.map((input) => {
    if (input.type === "text") {
      input.value = "test";
    }
    if (input.type === "email") {
      input.value = "test@example.com";
    }
    if (input.type === "password") {
      input.value = "test123";
    }
    if (input.type === "number") {
      input.value = "123456";
    }
    if (input.type === "tel") {
      input.value = "1234567890";
    }
    if (input.type === "select-one") {
      input.value = "test";
    }
    if (input.type === "radio") {
      input.value = "test";
    }
    if (input.type === "checkbox") {
      input.value = "test";
    }
    if (input.type === "submit") {
      input.value = "test";
    }
    return input;
  });
};

export const prepareDummyDataForFormTool = tool({
  name: "prepareDummyDataForFormTool",
  description: "This tool can prepare dummy data for the form",
  parameters: z.object({
    inputDetails: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        id: z.string(),
        placeholder: z.string(),
        value: z.string(),
      })
    ),
  }),
  async execute({ inputDetails }) {
    console.log(
      `Inside prepareDummyDataForFormTool with inputDetails: ${inputDetails}`
    );
  },
});

export const findFormAndInputsTool = tool({
  name: "findFormAndInputsTool",
  strict: true,
  description: "This tool can find the form and inputs by session id",
  parameters: z.object({ sessionId: z.string() }),
  async execute({ sessionId }) {
    console.log(`Inside findFormAndInputsTool with sessionId: ${sessionId}`);
    return findFormAndInputs(sessionId);
  },
});

export const fillForm = async (
  sessionId: string,
  inputDetails: {
    name: string;
    type: string;
    id: string;
    placeholder: string;
    value: string;
  }[]
) => {
  const session = getSession(sessionId);
  if (!session) {
    throw new Error(`No active browser session found for ID: ${sessionId}`);
  }
  const { page } = session;

  await page.waitForSelector("form");

  const form = await page.$("form"); // First form on the page
  if (!form) {
    throw new Error("No form found on the page");
  }
  const inputs = await form.$$("input"); // All inputs inside the form
  if (inputs.length === 0) {
    throw new Error("No input fields found in the form");
  }

  // Fill the form

  for (const index of [...inputs.keys()]) {
    await inputs[index].type(inputDetails[index].value);
  }

  // Submit the form
  await page.click("form button");

  return {
    message: "Form filled successfully",
  };
};

export const fillFormTool = tool({
  name: "fillFormTool",
  description: "This tool can fill the form by session id",
  parameters: z.object({
    sessionId: z.string(),
    inputDetails: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        id: z.string(),
        placeholder: z.string(),
        value: z.string(),
      })
    ),
  }),
  async execute({ sessionId, inputDetails }) {
    console.log(`Inside fillFormTool with sessionId: ${sessionId}`);
    return fillForm(sessionId, inputDetails);
  },
});
