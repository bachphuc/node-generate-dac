import dayjs from "dayjs";
import { DAC_Generate_From_XLSX } from "../DAC_Utils";
import { fileName_in_folder, file_exists } from "../utils/file_utils";

export function start_generate_dac_for_new_table(INPUT_DIR: string) {
  if (!file_exists(INPUT_DIR)) {
    console.log(`There's no input folder. Please create input folder and put excel file to generate.`.red);
    return;
  }
  const files = fileName_in_folder(INPUT_DIR);

  if (!files || !files.length) {
    console.log(`No input files.`.red);
    return;
  }

  const now = dayjs().format('DD-ddd-YYYY HH:mm');
  console.log(`Process Generate DAC ${now}`.green);

  files.forEach((file, i) => {
    console.log(`Begin to process file ${file.name}`.yellow);
    DAC_Generate_From_XLSX(file.path);
  })
}