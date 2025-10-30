import colors from 'colors';
import fs from 'fs';

import { text_from_file } from "./utils/file_utils";
import { schema_to_table_models, table_compares } from './tables/table-utils';
import { json_to_file } from './utils/excel-utils';
// import { createCanvas } from 'canvas';
import { SQLTable } from './tables/sql-interface';

colors.enable();

const SOURCE_FILE_NAME = 'source_schema.sql';
const SOURCE_FILE_PATH = `./input/${SOURCE_FILE_NAME}`;

const sourceSchemaData = text_from_file(SOURCE_FILE_PATH);
const sourceTables = schema_to_table_models(sourceSchemaData);
console.log(`sourceTables=${sourceTables.length}`.green);
json_to_file(`./output/source-schema.json`, sourceTables);

const TARGET_FILE_NAME = 'target_schema.sql';
const TARGET_FILE_PATH = `./input/${TARGET_FILE_NAME}`;

const targetSchemaData = text_from_file(TARGET_FILE_PATH);
const targetTables = schema_to_table_models(targetSchemaData);

console.log(`targetTables=${targetTables.length}`.green);
json_to_file(`./output/target-schema.json`, targetTables);

const changes = table_compares(sourceTables, targetTables);
const newTable = changes.filter(e => e.action === 'new');
console.log(`changes ${changes.length}, newTable=${newTable.length}`.yellow);

json_to_file(`./output/changes-schema.json`, changes);
