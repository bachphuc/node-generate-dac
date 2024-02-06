#! /usr/bin/env node

import colors from 'colors';
import { DAC_Generate_From_XLSX } from './DAC_Utils';
import dayjs from 'dayjs';
import { __parent_dir, fileName_in_folder, file_exists } from './utils/file_utils';

colors.enable();

const INPUT_DIR = './input/';

start();

function start() {
  if(!file_exists(INPUT_DIR)){
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