import path from "path";
import fs from 'fs';
import fse from 'fs-extra';
import Encoding from 'encoding-japanese';

import { IFile } from "./UtilsInterface";

const FileEncodings: string[] = ['ascii' , 'utf8' , 'utf-8' , 'utf16le' , 'ucs2' , 'ucs-2' , 'base64' , 'base64url' , 'latin1' , 'binary' , 'hex'];

export function get_filename(filePath: string): string{
  return path.basename(filePath);
}

export function get_filename_without_extension(filePath: string): string{
  const fileNameWithExtension = path.basename(filePath); // Get the file name with extension
    const fileNameWithoutExtension = path.parse(fileNameWithExtension).name; // Extract the file name without extension
    return fileNameWithoutExtension;
}


export function fileName_in_folder(folderPath: string): IFile[] {
  const files: IFile[] = [];
  const entries = fs.readdirSync(folderPath);

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry);
    const stats = fs.statSync(entryPath);

    if (stats.isDirectory()) {
      // Recursively read files in subdirectories
      // const subfolderFiles = fileName_in_folder(entryPath);
      // files.push(...subfolderFiles);
    } else if (stats.isFile()) {
      files.push({
        path: entryPath,
        name: entry
      });
    }
  }

  return files;
}

export function dir_create(path: string){
  if(fs.existsSync(path)) return;

  fs.mkdirSync(path, {recursive: true});
}

export function dir_create_and_empty(path: string){
  dir_create(path);
  dir_empty(path);
}

export function dir_empty(path: string){
  if(!fs.existsSync(path)) return;

  fse.emptyDirSync(path);
}

export function json_from_file(path: string){
  const str = fs.readFileSync(path, 'utf8');
  if(!str) return null;

  try {
    const data = JSON.parse(str);
    return data;
  } catch (error) {
    return null;
  }
}

export function text_from_file(path: string, encoding?: BufferEncoding): string{
  if(!encoding){
    var fileBuffer = fs.readFileSync(path);
    // Auto detech encoding
    let fileEncode = Encoding.detect(fileBuffer) as string;
    if(fileEncode){
      fileEncode = fileEncode.toLowerCase();
      if(FileEncodings.includes(fileEncode)){
        encoding = fileEncode.toLowerCase() as any;
      }
      else if(fileEncode === 'utf16'){
        encoding = 'utf16le';
      }

      // console.log(`File ${path} encode: ${encoding}`);
    }
  }
  const data = fs.readFileSync(path, {
    encoding: encoding || 'utf8',
    flag: 'r'
  });
  return data;
}

export function str_to_file(filePath: string, data: string, callback?: (error: any) => void){
  const dirName = path.dirname(filePath);
  dir_create(dirName);

  fs.writeFile(filePath, data, (err) => {
    if(err){
      console.log(`Failed to export data to ${filePath}, error: ${err.message}`.red);
      callback && callback(err);
      return;
    }
  
    console.log(`Wrote to ${filePath}`.green);
    callback && callback(null);
  })
}

export function __parent_dir(str: string): string{
  return path.dirname(str);
}

export function file_exists(path: string): boolean{
  return fs.existsSync(path);
}