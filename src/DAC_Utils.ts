import dayjs from "dayjs";
import { SheetData, json_read_all_sheets_from_excel, json_to_file} from "./utils/excel-utils";
import { str_className, str_plural } from "./utils/str-utils";
import { ColumnSchema } from "./interface";
import { __parent_dir, dir_create, file_exists, get_filename_without_extension, str_to_file, text_from_file } from "./utils/file_utils";
import { IFile } from "./utils/UtilsInterface";

const OUTPUT_DIR = './output/';
const TEMPLATE_DIR = __parent_dir(__dirname) + '/';

const now = dayjs();
const CREATED_DATETIME = now.format('DD-ddd-YYYY HH:mm');
const GENERATOR_BY = `TigerBabySoft V1.0.0`;

const DataAccess_Structure_Template = text_from_file(`${TEMPLATE_DIR}/templates/DataAccess_Structure_Template.cs`);
const DataServiceObjects_Template = text_from_file(`${TEMPLATE_DIR}/templates/DataServiceObjects_Template.cs`);
const MakeDSO_Template = text_from_file(`${TEMPLATE_DIR}/templates/MakeDSO_Template.cs`);

export function binding_template(content: string, data: any){
  let result = content;
  data.datetime = CREATED_DATETIME;
  data.generator = GENERATOR_BY;
  for(const key in data){
    result = result.replace(new RegExp(`\{${key}\}`, 'g'), data[key]);
  }

  return result;
}

export type SqlDbTypeType = '' | 'Int' | 'TinyInt' | 'NVarChar' | 'DateTime' | 'Bit' | 'Money' | 'Decimal' | 'Date' | 'NText';
export type CSharpType = 'int' | 'string' | 'DateTime' | 'bool' | 'decimal';
export type CShareGetMethodType = '' | 'GetDateTime' | 'GetInt32' | 'GetBoolean' | 'GetString' | 'GetByte' | 'GetDecimal';


export interface SqlDbType{
  type: SqlDbTypeType,
  option?: any,
  codeType?: CSharpType,
  codeGetMethodType?: CShareGetMethodType,
  sqlType?: string
}

export function get_SqlDbType(type: string): SqlDbType{
  type = type.toLowerCase();

  if(type === 'int'){
    return {
      type: 'Int',
      codeType: 'int',
      codeGetMethodType: 'GetInt32',
      sqlType: 'int'
    };
  }

  if(type === 'date'){
    return {
      type: 'Date',
      codeType: 'DateTime',
      codeGetMethodType: 'GetDateTime',
      sqlType: 'date'
    };
  }

  if(type === 'money'){
    return {
      type: 'Money',
      codeType: 'decimal',
      codeGetMethodType: 'GetDecimal',
      sqlType: 'money'
    };
  }

  if(type === 'tinyint'){
    return {
      type: 'TinyInt',
      codeGetMethodType: 'GetByte',
      sqlType: 'tinyint',
      codeType: 'int'
    };
  }
  if(type === 'ntext'){
    return {
      type: 'NText',
      codeGetMethodType: 'GetString',
      sqlType: 'ntext',
      codeType: 'string'
    };
  }
  const nvarcharReg = /NVARCHAR\(([^\(\)]+)\)/i;
  if(nvarcharReg.test(type)){
    const match = nvarcharReg.exec(type);
    const length = match ? match[1] : 250;
    return {
      type: 'NVarChar',
      option: length,
      codeType: 'string',
      codeGetMethodType: 'GetString',
      sqlType: `nvarchar(${length})`
    };
  }

  const decimalReg = /Decimal\(([^\(\)]+)\)/i;
  if(decimalReg.test(type)){
    const match = decimalReg.exec(type);
    const length = match ? match[1] : 250;
    return {
      type: 'Decimal',
      option: length,
      codeType: 'decimal',
      codeGetMethodType: 'GetDecimal',
      sqlType: `decimal(${length})`
    };
  }

  if(/DateTime/i.test(type)){
    return {
      type: 'DateTime',
      codeGetMethodType: 'GetDateTime',
      sqlType: 'datetime',
      codeType: 'DateTime'
    }
  }

  if(/Bit/i.test(type)){
    return {
      type: 'Bit',
      codeGetMethodType: 'GetBoolean',
      sqlType: 'bit',
      codeType: 'bool'
    }
  }

  return {
    type: '',
  };
}

export function repeat(str: string, count: number){
  let result = '';

  for(let i = 0; i < count; i++){``
    result+= str;
  }

  return result;
}

interface DAC_generate_data_access_Result{
  files: IFile[],
  classes: string[]
}

export function dac_generate_data_access(tableName: string, schemas: ColumnSchema[]): DAC_generate_data_access_Result{
  let result: DAC_generate_data_access_Result = {
    files: [],
    classes: []
  };
  const createColumn = schemas.find(e => e.col_name === 'Create_User_Account_ID');

  const dacTemplateGeneratedContent = text_from_file(`${TEMPLATE_DIR}/templates/DAC_Template.generated.cs`);

  let columnEnumStr = schemas.map((e, i) => `${e.col_name} = ${i}`).join(",\n\t\t\t");
  if(createColumn){
    let createUserFields = [
      'CreatedByLogonName',
      'CreatedByFirstName',
      'CreatedByLastName',
      'UpdatedByLogonName',
      'UpdatedByFirstName',
      'UpdatedByLastName'
    ];
    const createUserStr = createUserFields.map((e, i) => `${e} = ${schemas.length + i}`).join(",\n\t\t\t");
    columnEnumStr+= ",\n\t\t\t" + createUserStr;
  }

  const tableNamePlural = str_plural(tableName);

  const insertParamsStart = schemas.filter(e => 
    e.col_name !== 'ID'
    && e.col_name !== 'Create_DateTime'
    && e.col_name !== 'Update_DateTime'
  ).map((e, i) => {
    const types = get_SqlDbType(e.type);
    if(types.type === 'DateTime'){
      return `CreateParameter(dbCommand, "@${e.col_name}", SqlDbType.${types.type}, FixDBDateTime(obj${tableNamePlural}.Collection[i].${e.col_name}));`;
    }
    return `CreateParameter(dbCommand, "@${e.col_name}", SqlDbType.${types.type}, obj${tableNamePlural}.Collection[i].${e.col_name});`;
  }).join("\n" + repeat("\t", 5));

  const updateParamsStart = schemas.filter(e => 
    e.col_name !== 'Create_DateTime'
    && e.col_name !== 'Update_DateTime'
    && e.col_name !== 'Create_User_Account_ID'
  ).map((e, i) => {
    const types = get_SqlDbType(e.type);
    if(types.type === 'DateTime'){
      return `CreateParameter(dbCommand, "@${e.col_name}", SqlDbType.${types.type}, FixDBDateTime(obj${tableNamePlural}.Collection[i].${e.col_name}));`;
    }
    
    return `CreateParameter(dbCommand, "@${e.col_name}", SqlDbType.${types.type}, obj${tableNamePlural}.Collection[i].${e.col_name});`;
  }).join("\n" + repeat("\t", 5));

  const fillStr = schemas.map((e, i) => {
    return `\t\t\tif (!objDataReader.IsDBNull((int)${tableName}Column.${e.col_name}))\n\t\t\t\tobj${tableName}.${e.col_name} = objDataReader.${get_SqlDbType(e.type).codeGetMethodType}((int)${tableName}Column.${e.col_name});`
  }).join("\n\n");

  let createField = '';
  let updateField = '';

  if(createColumn){
    createField = `obj${tableName}.CreatedByUser = ReadUserAccount(objDataReader, (int)${tableName}Column.Create_User_Account_ID, (int)${tableName}Column.CreatedByLogonName, (int)${tableName}Column.CreatedByFirstName, (int)${tableName}Column.CreatedByLastName);`
  }

  const updateColumn = schemas.find(e => e.col_name === 'Update_User_Account_ID');
  if(updateColumn){
    updateField = `obj${tableName}.UpdatedByUser = ReadUserAccount(objDataReader, (int)${tableName}Column.Update_User_Account_ID, (int)${tableName}Column.UpdatedByLogonName, (int)${tableName}Column.UpdatedByFirstName, (int)${tableName}Column.UpdatedByLastName);`
  }
  
  const dacTemplateGeneratedContentOutput = binding_template(dacTemplateGeneratedContent, {
    Table_Name: tableName,
    Table_Name_Plural: tableNamePlural,
    table_name_lower: tableName.toLowerCase(),
    table_column_enum: columnEnumStr,
    insert_params: insertParamsStart,
    update_params: updateParamsStart,
    fill: fillStr,
    datetime: CREATED_DATETIME,
    createField: createField,
    updateField: updateField
  });

  str_to_file(get_output_filepath(tableName, `DAC_${tableName}.generated.cs`), dacTemplateGeneratedContentOutput);

  result.files.push({
    name: `DAC_${tableName}.generated.cs`,
    path: `${OUTPUT_DIR}${tableName}/DAC_${tableName}.generated.cs`,
    content: dacTemplateGeneratedContentOutput
  })

  const dacTemplateContent = text_from_file(`${TEMPLATE_DIR}/templates/DAC_Template.cs`);

  const str = binding_template(dacTemplateContent, {
    Table_Name: tableName
  });

  str_to_file(get_output_filepath(tableName, `DAC_${tableName}.cs`), str);

  result.files.push({
    name: `DAC_${tableName}.cs`,
    path: `${OUTPUT_DIR}${tableName}/DAC_${tableName}.cs`,
    content: str
  })

  return result;
}

export function get_output_filepath(tableName: string, name: string): string{
  return `${OUTPUT_DIR}Tables/${tableName}/${name}`;
}

interface DAC_generate_sql_Result{
  content: string,
  files: IFile[]
}

export function dac_generate_sql(tableName: string, schemas: ColumnSchema[]): DAC_generate_sql_Result{
  const result: DAC_generate_sql_Result = {
    content: '',
    files: []
  }
  const hasCreateUserColumn = schemas.find(e => e.col_name === 'Create_User_Account_ID');
  const templatePath = hasCreateUserColumn ? `${TEMPLATE_DIR}/templates/sp_stores_template_with_create_user.generated.sql` : `${TEMPLATE_DIR}/templates/sp_stores_template.generated.sql`;
  const template = text_from_file(templatePath);

  const insertParams = schemas.filter(e => e.col_name !== 'ID' && e.col_name !== 'Create_DateTime' && e.col_name !== 'Update_DateTime').map((e, i) => {
    return `@${e.col_name} ${get_SqlDbType(e.type).sqlType}`;
  }).join(',\n\t');

  const insertCols = schemas.filter(e => e.col_name !== 'ID').map((e, i) => {
    return `[${e.col_name}]`;
  }).join(',\n\t\t');

  const insertValues = schemas.filter(e => e.col_name !== 'ID').map((e, i) => {
    if(e.col_name === 'Create_DateTime' || e.col_name === 'Update_DateTime'){
      return 'GETUTCDATE()'
    }
    return `@${e.col_name}`;
  }).join(',\n\t\t');

  const updateParams = schemas.filter(e => e.col_name !== 'ID' 
    && e.col_name !== 'Create_DateTime' 
    && e.col_name !== 'Update_DateTime'
    && e.col_name !== 'Create_User_Account_ID'
  ).map((e, i) => {
    return `@${e.col_name} ${get_SqlDbType(e.type).sqlType}`;
  }).join(',\n\t');

  const updateValues = schemas.filter(e => e.col_name !== 'Create_DateTime'
    && e.col_name !== 'Create_User_Account_ID'
    && e.col_name !== 'ID'
  ).map((e, i) => {
    if( e.col_name === 'Update_DateTime'){
      return '[Update_DateTime] = GETUTCDATE()'
    }
    return `[${e.col_name}] = @${e.col_name}`;
  }).join(',\n\t\t');

  const content = binding_template(template, {
    table_name: tableName,
    table_name_lower: tableName.toLowerCase(),
    insert_params: insertParams,
    insert_cols: insertCols,
    insert_values: insertValues,
    update_params: updateParams,
    update_values: updateValues,
    datetime: CREATED_DATETIME,
  })

  result.content = content;

  const fileName = `sp_${tableName.toLowerCase()}.generated.sql`;
  const filePath = get_output_filepath(tableName, fileName);

  result.files.push({
    name: fileName,
    path: filePath,
    content: content
  })

  str_to_file(filePath, content);

  return result;
}

interface DAC_generate_dataServiceObject_Result{
  content: string,
  classes: string[],
}
export function dac_generate_dataServiceObject(tableName: string, schemas: ColumnSchema[]): DAC_generate_dataServiceObject_Result{
  const result: DAC_generate_dataServiceObject_Result = {
    content: '',
    classes: []
  }
  const classTemplate = text_from_file(`${TEMPLATE_DIR}/templates/DataServiceObjects_Class_Template.cs`);

  const strProperties = schemas.map((e, i) => {
    // Use enum if enum is defined
    return `public ${e.enum || get_SqlDbType(e.type).codeType} ${e.col_name.replace(/[ _]+/g, '')} { get; set; }`;
  }).join('\n' + repeat("\t", 2));

  let created_by_user = '';
  let updated_by_user = '';
  if(schemas.find(e => e.col_name === 'Create_User_Account_ID')){
    created_by_user = `public RPMAdminUser CreatedByUser { get; set; }`
  }

  if(schemas.find(e => e.col_name === 'Update_User_Account_ID')){
    updated_by_user = `public RPMAdminUser UpdatedByUser { get; set; }`
  }

  const className = get_className(tableName);
  const tableNameLower = tableName.toLowerCase();
  const classNamePlural = str_plural(className);

  const classStr = binding_template(classTemplate, {
    table_name: tableName,
    table_name_lower: tableNameLower,
    class_name: className,
    class_name_plural: classNamePlural,
    properties: strProperties,
    created_by_user: created_by_user,
    updated_by_user: updated_by_user,
    datetime: CREATED_DATETIME
  });

  result.classes.push(classStr);

  const content = binding_template(DataServiceObjects_Template, {
    table_name: tableName,
    table_name_lower: tableNameLower,
    class_name: className,
    class_name_plural: classNamePlural,
    datetime: CREATED_DATETIME,
    content: classStr
  });

  result.content = content;
  
  str_to_file(get_output_filepath(tableName, `DataServiceObjects_${className}.cs`), content);

  return result;
}

interface DAC_generate_conversions_Result{
  content: string,
  methods: string[]
}
export function dac_generate_conversions(tableName: string, schemas: ColumnSchema[]): DAC_generate_conversions_Result{
  const result: DAC_generate_conversions_Result = {
    content: '',
    methods: []
  }
  
  const className = get_className(tableName);
  const methodTemplate = text_from_file(`${TEMPLATE_DIR}/templates/MakeDSO_Template_Method.cs`);

  const dsoFields = schemas.map((e, i) => {
    return `ds${className}.${e.colName} =${e.enum ? `(${e.enum})` : ''} db${className}.${e.col_name};`;
  }).join('\n' + repeat("\t", 3));

  const dbFields = schemas.map((e, i) => {
    const type = get_SqlDbType(e.type);
    if(type.codeType === 'string' && e.allow_null !== 'yes'){
      return `db${className}.${e.col_name} = this.NoNull(ds${className}.${e.colName});`;
    }

    if(type.codeType === 'DateTime'){
      return `db${className}.${e.col_name} = DateTimeHelper.MakeDBDefaultValue(ds${className}.${e.colName});`;
    }

    return `db${className}.${e.col_name} = ds${className}.${e.colName}${e.enum ? `.GetHashCode()` : ''};`;
  }).join('\n' + repeat("\t", 3));

  let created_by_user = '';
  let updated_by_user = '';
  if(schemas.find(e => e.col_name === 'Create_User_Account_ID')){
  }

  if(schemas.find(e => e.col_name === 'Update_User_Account_ID')){
  }

  const methodStr = binding_template(methodTemplate, {
    table_name: tableName,
    table_name_lower: tableName.toLowerCase(),
    class_name: className,
    created_by_user: created_by_user,
    updated_by_user: updated_by_user,
    datetime: CREATED_DATETIME,
    db_fields: dbFields,
    dso_fields: dsoFields
  });

  result.methods.push(methodStr);

  const content = binding_template(MakeDSO_Template, {
    table_name: tableName,
    table_name_lower: tableName.toLowerCase(),
    class_name: className,
    datetime: CREATED_DATETIME,
    content: methodStr
  });

  result.content = content;
  
  str_to_file(get_output_filepath(tableName, `Conversions_${className}.cs`), content);

  return result;
}

function get_className(tableName: string): string{
  return tableName.replace(/[_ ]+/g, '');
}

interface DAC_generate_structure_Result{
  classes: string[],
  content: string
}
export function dac_generate_structure(tableName: string, schemas: ColumnSchema[]): DAC_generate_structure_Result{
  const result: DAC_generate_structure_Result = {
    classes: [],
    content: ''
  }

  const classItemTemplate = text_from_file(`${TEMPLATE_DIR}/templates/DataAccess_Structure_Class_Template.cs`);

  const strProperties = schemas.map((e, i) => {
    return `public ${get_SqlDbType(e.type).codeType} ${e.col_name};`;
  }).join('\n' + repeat("\t", 2));

  let created_by_user = '';
  let updated_by_user = '';
  if(schemas.find(e => e.col_name === 'Create_User_Account_ID')){
    created_by_user = `public User_AccountInfo CreatedByUser;`
  }

  if(schemas.find(e => e.col_name === 'Update_User_Account_ID')){
    updated_by_user = `public User_AccountInfo UpdatedByUser;`
  }

  const className = tableName.replace(/[_ ]+/g, '');
  const classNamePlural = str_plural(className);
  const tableNamePlural = str_plural(tableName);
  const tableNameLower = tableName.toLowerCase();

  const classStr = binding_template(classItemTemplate, {
    table_name: tableName,
    table_name_plural: tableNamePlural,
    table_name_lower: tableNameLower,
    class_name: className,
    properties: strProperties,
    datetime: CREATED_DATETIME,
    created_by_user: created_by_user,
    updated_by_user: updated_by_user,
  });

  result.classes.push(classStr);

  const content = binding_template(DataAccess_Structure_Template, {
    table_name: tableName,
    table_name_plural: tableNamePlural,
    table_name_lower: tableNameLower,
    class_name: className,
    datetime: CREATED_DATETIME,
    content: classStr,
  });

  result.content = content;
  
  str_to_file(get_output_filepath(tableName, `Structure_${tableName}.cs`), content);
  
  return result;
}

interface DAC_generate_table_schema_Result{
  content?: string,
  dropTable?: string,
  dropConstrains?: string
}

export function dac_generate_table_schema(tableName: string, schemas: ColumnSchema[]): DAC_generate_table_schema_Result{
  const template = text_from_file(`${TEMPLATE_DIR}/templates/Table_Schema.sql`);

  const strColumns = schemas.map(e => {
    return `\t${e.col_name} ${get_SqlDbType(e.type).sqlType}${e.primary_key === 'yes' ? ' IDENTITY(1,1)' : ''} ${e.allow_null === 'yes' && e.primary_key !== 'yes' ? `NULL`: `NOT NULL`}`
  }).join(",\n");

  const dropConstraints: string[] = [];

  const strForeignKeys = schemas.filter(e => e.foreign_table).map((e, i) => {
    dropConstraints.push(`ALTER TABLE [dbo].${tableName} DROP CONSTRAINT [FK_${tableName}_${e.foreign_table}]`);

    const foreignKey = e.foreign_column ? e.foreign_column : `ID`;
    return `ALTER TABLE [dbo].${tableName}  WITH CHECK ADD  CONSTRAINT [FK_${tableName}_${e.foreign_table}] FOREIGN KEY(${e.col_name}) REFERENCES [dbo].${e.foreign_table} ([${foreignKey}])
GO`;
  }).join('\n\n');

  const dropContent = dropConstraints.length ? dropConstraints.join("\n\t") : '';

  const content = binding_template(template, {
    Table_Name: tableName,
    columns: strColumns,
    foreign_keys: strForeignKeys,
    drop_constraint: dropContent
  });
  str_to_file(get_output_filepath(tableName, `${tableName}_table_schema.sql`), content);

  return {
    content: content,
    dropConstrains: dropConstraints.join("\n"),
    dropTable: `DROP TABLE [dbo].${tableName}`
  };
}

interface DAC_Generate_From_XLSX_Sheet_Result{
  conversions?: DAC_generate_conversions_Result;
  store?: DAC_generate_sql_Result;
  dataAccess?: DAC_generate_data_access_Result;
  dataServiceObjects?: DAC_generate_dataServiceObject_Result;
  structures?: DAC_generate_structure_Result;
  schema?: DAC_generate_table_schema_Result,
}

export function DAC_Generate_From_XLSX_Sheet(sheetData: SheetData): DAC_Generate_From_XLSX_Sheet_Result | undefined{
  console.log(`[BEGIN] Generate DAC for SheetName=${sheetData.name}`.yellow);

  let result: DAC_Generate_From_XLSX_Sheet_Result = {
  };

  if(!sheetData || !sheetData.data || !sheetData.data.length){
    console.log(`[END] Generate DAC for SheetName=${sheetData.name} failed. Data is empty`.red);
    return;
  }
  const columSchemas: ColumnSchema[] = sheetData.data;

  const missingColumnName = columSchemas.find(e => !e.col_name);
  if(missingColumnName){
    console.log(`[END] Generate DAC for SheetName=${sheetData.name} failed. Some column names are missing. Check again`.red);
    return;
  } 

  const missingType = columSchemas.find(e => !e.type);
  if(missingType){
    console.log(`[END] Generate DAC for SheetName=${sheetData.name} failed. Data for [${missingType.col_name}] is missing`.red);
    return;
  }

  columSchemas.forEach(e => {
    e.colName = e.col_name.replace(/[ _]+/g, '');
  })

  const tableName = columSchemas.find(e => e.table_name)?.table_name || '';

  const dataAccess = dac_generate_data_access(tableName, columSchemas);
  const tableSchema = dac_generate_table_schema(tableName, columSchemas);
  const stores = dac_generate_sql(tableName, columSchemas);
  const structures = dac_generate_structure(tableName, columSchemas);
  const dataServiceObjects = dac_generate_dataServiceObject(tableName, columSchemas);
  const conversions = dac_generate_conversions(tableName, columSchemas);

  console.log(`[END] Generate DAC for SheetName=${sheetData.name}`.yellow);

  result.schema = tableSchema;
  result.store = stores;
  result.structures = structures;
  result.dataServiceObjects = dataServiceObjects;
  result.dataAccess = dataAccess;
  result.conversions = conversions;

  return result;
}

export function DAC_Generate_From_XLSX(filePath: string, sheetIndex: number = 0){
  if(!file_exists(filePath)){
    console.log(`Failed to generate DAC. File is not exists. Path=${filePath}`.red);
    return;
  }

  const outputFolder = get_filename_without_extension(filePath);
  console.log(`DAC_Generate_From_XLSX: ${outputFolder}`.yellow);

  const sheets: SheetData[] = json_read_all_sheets_from_excel(filePath, { sheetIndex: sheetIndex, transformColumnName: true });

  const schemas: string[] = [];
  const stores: string[] = [];
  const dropTables: string[] = [];
  const dropConstrains: string[] = [];
  const dataAccessClasses: string[] = [];
  const dataObjectClasses: string[] = [];
  const conversionsMethods: string[] = [];

  const files: IFile[] = [];

  sheets.forEach((sheet) => {
    const result = DAC_Generate_From_XLSX_Sheet(sheet);

    if(result){
      if(result.schema){
        schemas.push(result.schema.content || '');
        dropTables.push(result.schema.dropTable || '');
        dropConstrains.push(result.schema.dropConstrains || '');
      }

      if(result.dataAccess){
        if(result.dataAccess.files){
          result.dataAccess.files.forEach(e => {
            files.push(e);
          })
        }
      }

      if(result.store){
        stores.push(result.store.content);

        if(result.store.files && result.store.files.length){
          result.store.files.forEach(e => {
            files.push(e);
          })
        }
      }

      if(result.structures && result.structures.classes && result.structures.classes.length){
        result.structures.classes.forEach(e => {
          dataAccessClasses.push(e);
        })
      }

      if(result.dataServiceObjects && result.dataServiceObjects.classes && result.dataServiceObjects.classes.length){
        result.dataServiceObjects.classes.forEach(e => {
          dataObjectClasses.push(e);
        })
      }

      if(result.conversions && result.conversions.methods && result.conversions.methods.length){
        result.conversions.methods.forEach(e => {
          conversionsMethods.push(e);
        })
      }
    }
  })
  
  if(!schemas.length && !stores.length){
    return;
  }

  // Save Structure
  if(dataAccessClasses.length){
    const content = binding_template(DataAccess_Structure_Template, {
      content: dataAccessClasses.join("\n\n"),
      table_name: ''
    })
    files.push({
      name: 'Structure.cs',
      content: content
    })
  }

  // Save DataSerivceObject
  if(dataObjectClasses.length){
    const content = binding_template(DataServiceObjects_Template, {
      content: dataObjectClasses.join("\n\n")
    })
    files.push({
      name: 'DataServiceObject.cs',
      content: content
    })
  }

  // Save Conversions
  if(conversionsMethods.length){
    const content = binding_template(MakeDSO_Template, {
      content: conversionsMethods.join("\n\n"),
      table_name: ''
    })
    files.push({
      name: 'Conversions.cs',
      content: content,
    })
  }

  if(stores.length){
    files.push({
      name: 'stores.sql',
      content: stores.join("\n\n")
    })
  }

  if(schemas.length){
    files.push({
      name: 'table_schema.sql',
      content: schemas.join("\n\n\n")
    });

    const content = `${dropConstrains.filter(e => e).join("\nGO\n")}
    
${dropTables.join("\nGO\n")}`;

    files.push({
      name: 'table_schema_reset.sql',
      content: content
    })
  }

  if(files.length){
    dir_create(`${OUTPUT_DIR}${outputFolder}`);
    dir_create(`${OUTPUT_DIR}${outputFolder}/DAC`);
    dir_create(`${OUTPUT_DIR}${outputFolder}/DataServiceObjects`);
    dir_create(`${OUTPUT_DIR}${outputFolder}/sql`);
    dir_create(`${OUTPUT_DIR}${outputFolder}/stores`);

    files.forEach(e => {
      if(e.content){
        if(/\.sql$/.test(e.name) && /^sp_/.test(e.name)){
          str_to_file(`${OUTPUT_DIR}${outputFolder}/stores/${e.name}`, e.content);
        }
        else if(/\.sql$/.test(e.name)){
          str_to_file(`${OUTPUT_DIR}${outputFolder}/sql/${e.name}`, e.content);
        }
        else if(/^DAC_/.test(e.name)){
          str_to_file(`${OUTPUT_DIR}${outputFolder}/DAC/${e.name}`, e.content);
        }
        else{
          str_to_file(`${OUTPUT_DIR}${outputFolder}/DataServiceObjects/${e.name}`, e.content);
        }
        
      }
    })
  }
}