import {Agent, run, Tool} from '@openai/agents';
import {aisdk} from '@openai/agents-extensions';

import {
  generateScreenshotTool,
  openWebpage,
  openWebpageTool,
  closeBrowserTool,
  getCurrentTimeTool,
  scrollToFormTool,
  fillFormTool,
  findFormAndInputsTool,
  prepareDummyDataForFormTool,
  findFormAndInputs,
  fillForm,
  prepareDummyDataForForm,
} from './tools';
import { printJson } from './utils';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

const models = {
  gemini_flash_2: aisdk(google('gemini-2.0-flash')),
  gpt_4o: aisdk(openai('gpt-4o-mini')),
};


const tools: Tool[] = [
  closeBrowserTool,
  fillFormTool,
  findFormAndInputsTool,
  generateScreenshotTool,
  getCurrentTimeTool,
  openWebpageTool,
  prepareDummyDataForFormTool,
  scrollToFormTool,
];  

const websiteAutomationAgent = new Agent({
  name: 'Website Automation Agent',
  model: models.gemini_flash_2,
  tools,
  // instructions: ``,
});

const main = async () => {


  const result = await run(
    websiteAutomationAgent,
    'Open https://ui.chaicode.com/auth-sada/signup and fill the form .'
  );

  // printJson(result.history);

  
  console.log(result.finalOutput);
};

main();
