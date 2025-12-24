export interface ColumnSchema {
  no: number
  table_name: string
  col_name: string,
  colName: string,
  type: string
  allow_null: 'yes' | 'no',
  foreign_table?: string,
  foreign_column?: string,
  primary_key?: 'yes' | 'no',
  enum?: string,
  description?: string,
}