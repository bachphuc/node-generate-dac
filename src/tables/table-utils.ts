import { match_all } from "../utils/utils";
import { SQLColumn, SQLColumnChange, SQLTable, SQLTableChange, SQLType } from "./sql-interface";

export function schema_to_table_models(content: string): SQLTable[]{
  const tableStrs: string[] = split_to_table_schema(content);
  console.log(`Table split ${tableStrs.length}`.green);
  const tables = tableStrs.map(e => parse_table(e)).filter(e => e);

  return tables;
}

function split_to_table_schema(content: string): string[]{
  // /****** Object:  Table [dbo].[Profile_Application_Step]
  let result: string[] = content.split(/\/\*\*\*\*\*\*\s*Object\s*:\s*Table\s*\[dbo\]\.\[[^\[\]]+\]/i).filter(e => /CREATE\s+TABLE/i.test(e)).map(e => e.trim());

    return result;
}

function parse_table(content: string): SQLTable | null{
  let result: SQLTable = {
    tableName: parse_table_name(content),
    columns: [],
    content: content,
  };

  // Ignore table begin with "_"
  if(/^_/.test(result.tableName)){
    console.log(`Ignore table ${result.tableName}`.yellow);
    return null;
  }

  const columnMatchs: any[] = split_to_column_content(content);
  const columns = columnMatchs.map(e => parse_table_column(e)).filter(e => e);
  result.columns = columns;

  return result;
}

function parse_table_name(content: string): string{
  // CREATE TABLE [dbo].[_imp_Insp_Template_Stage]
  const reg = /CREATE\s*TABLE\s*\[dbo\]\.\[([^\[\]]+)\]/i;
  if(reg.test(content)){
    const match = reg.exec(content);
    return match[1];
  }
  return '';
}

function split_to_column_content(content: string): any[]{
  // [Create_DateTime] [datetime] NULL,
  const result = match_all(/\[([^\[\]]+)\][ ]+\[([^\[\]]+)\][ ]*(.*)$/gm, content);
  return result;
}

function parse_table_column(match: string[]): SQLColumn | null{
  const content = match[0];
  const type = match[2].toLowerCase() as SQLType;
  let result: SQLColumn = {
    columnName: match[1],
    type: type,
    content: content,
    isNull: true,
  };

  // [nvarchar](255)
  // [decimal](18, 2)
  if(type === 'nvarchar' || type === 'decimal'){
    const reg = /\[(nvarchar|decimal)\](\([^\(\)]+\))/i;
    if(reg.test(content)){
      const match = reg.exec(content);
      result.typeArgs = match[2];
    }
  }

  // NULL
  if(/NOT[ ]+NULL/i.test(content)){
    result.isNull = false;
  }

  // IDENTITY
  if(/IDENTITY/i.test(content)){
    result.isPrimary = true;
  }

  return result;
}

export function table_compares(tables: SQLTable[], targetTables: SQLTable[]): SQLTableChange[]{
  const changes: SQLTableChange[] = [];
  tables.forEach(source => {
    const target = targetTables.find(e => e.tableName === source.tableName);
    if(!target){
      changes.push({
        action: 'new',
        source: source,
      })
    }
    else{
      const change = table_change(source, target);
      if(change){
        changes.push(change);
      }
    }
  });

  return changes;
}

export function table_change(source: SQLTable, target: SQLTable): SQLTableChange | null{
  const result: SQLTableChange = {
    source: source,
    target: target,
    action: 'modify',
  };
  const changes: SQLColumnChange[] = [];
  source.columns.forEach((sourceCol) => {
    const targetCol = target.columns.find(e => e.columnName === sourceCol.columnName);
    if(!targetCol){
      changes.push({
        action: 'new',
        source: sourceCol,
      })
    }
    else{
      if(sourceCol.type !== targetCol.type 
        || sourceCol.typeArgs !== targetCol.typeArgs
        || sourceCol.isNull !== targetCol.isNull
      ){
        changes.push({
          action: 'modify',
          source: sourceCol,
          target: targetCol,
        })
      }
    }
  })

  result.columnChanges = changes;

  return changes.length ? result : null;
}