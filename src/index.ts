#! /usr/bin/env node

import colors from 'colors';
import { DAC_Generate_From_XLSX } from './DAC_Utils';
import dayjs from 'dayjs';
import commandLineArgs from 'command-line-args';

import { __parent_dir, fileName_in_folder, file_exists } from './utils/file_utils';
import { start_generate_dac_for_new_table } from './generate-table-dac';
import { startProcess } from './handle-command-line';

colors.enable();

const INPUT_DIR = './input/';

start_generate_dac_for_new_table(INPUT_DIR);