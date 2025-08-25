import {Agent, run, Tool} from '@openai/agents';

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
  model: 'gpt-4.1-nano',
  tools,
  instructions: `
  
  You are a helpful assistant.
  Who can help user to automate the tasks on the websites.

  You have access to the following tools:
  ${tools.map((tool) => tool.name).join(', ')}



  If the user asking to fill the form then use findFormTool to find the form on the page.
  Use the following tools to find the form and fill it:
  findFormAndInputs
  prepareDummyDataForForm
  fillForm
  `,
});

const main = async () => {


  const result = await run(
    websiteAutomationAgent,
    'Open https://ui.chaicode.com/auth-sada/signup and fill the form .'
  );

  printJson(result.history);

  
  console.log(result.finalOutput);


  // const {sessionId} = await openWebpage(
  //   'https://ui.chaicode.com/auth-sada/signup'
  // );
  // const form = await findFormAndInputs(sessionId);
  // const dummyData = prepareDummyDataForForm(form.inputDetails);
  // console.log('🚀 ~ main ~ form:', dummyData);
  // fillForm(sessionId, dummyData);
};

main();
