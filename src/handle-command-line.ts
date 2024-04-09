import commandLineArgs from "command-line-args";

export interface StartProcessOptions{
  inputFolder: string
}
export function startProcess(options: StartProcessOptions){
  const optionDefinitions = [
    { name: 'args', type: String, multiple: true, defaultOption: true }
  ]
  const commands = commandLineArgs(optionDefinitions)
  console.log(commands);
}