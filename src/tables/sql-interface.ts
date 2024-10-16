export interface SQLColumn{
  content: string,
  columnName: string,
  type: SQLType,
  typeArgs?: string,
  isNull?: boolean,
  isPrimary?: boolean,
}

export interface SQLTable{
  tableName: string,
  content: string,
  columns: SQLColumn[],
}

export type SQLType = 'decimal' | 'tinyint' | 'datetime' | 'int' | 'nvarchar' | 'ntext';

export type SQLTableChangeAction = 'new' | 'modify' | 'deleted';

export interface SQLTableChange{
  source: SQLTable,
  target?: SQLTable,
  action: SQLTableChangeAction,
  columnChanges?: SQLColumnChange[],
}

export interface SQLColumnChange{
  action: SQLTableChangeAction,
  source?: SQLColumn,
  target?: SQLColumn,
}