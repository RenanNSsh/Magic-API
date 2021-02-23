
import JSZip from 'jszip';
import { EntityConvert } from '../models/entity-convert';
import { JsonConverterAngular } from '../services/json-converter/json-converter-angular';
import { RelationshipField } from '../models/relationship';
import { JsonConverterJava } from '../services/json-converter/json-converter-java';
import { JsonConverterFlutter } from '../services/json-converter/json-converter-flutter';
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { ConvertedJson } from '../models/converted-json';

export class JsonConverterController {
  public async jsonConvert (req: Request, res: Response): Promise<void> {
    const startTime = new Date();
    const entitiesConvert: EntityConvert[] = req.body;
    const fileName = 'exception.zip';
    this.convert(entitiesConvert, fileName);

    const endTime = new Date();

    const convertedJson: ConvertedJson = {
      endTime,
      startTime,
      status: true,
      urlFile: `http://localhost:3000/public/${fileName}`
    };

    res.json(convertedJson);
  }

  private convert (entities: EntityConvert[], fileName: string) : fs.WriteStream {
    const zip = new JSZip();
    entities.forEach(entity => {
      this.toJava(entity.json, entity.name, entity.basePackage, entity.relationships, zip, entities);
      this.toAngular(entity, entities, zip);
      this.toFlutter(entity, entities, zip, entity.appName);
    });
    return zip.generateNodeStream({ streamFiles: true }).pipe(fs.createWriteStream(path.join(__dirname, fileName)));
  }

  public toJava (json: string, name: string, basePackage: string, relationships: RelationshipField[], zip: JSZip, entities: EntityConvert[]): void {
    const javaZip = zip.folder('java');
    this.generateJava(json, name, basePackage, relationships, javaZip, entities);
  }

  public toAngular (entity: EntityConvert, entities: EntityConvert[], zip: JSZip):void {
    const angularZip = zip.folder('angular');
    this.generateAngular(entity, entities, angularZip);
  }

  public generateAngular (entity: EntityConvert, entities: EntityConvert[], zip: JSZip):void {
    const angularConverter = new JsonConverterAngular(this);
    angularConverter.generate(entity, entities, zip);
  }

  public toFlutter (entity: EntityConvert, entities: EntityConvert[], zip: JSZip, appName: string):void {
    const flutterZip = zip.folder('flutter');
    this.generateFlutter(entity, entities, flutterZip, appName);
  }

  public generateFlutter (entity: EntityConvert, entities: EntityConvert[], zip: JSZip, appName: string):void {
    const flutterConverter = new JsonConverterFlutter(this);
    flutterConverter.generate(entity, entities, zip, appName);
  }

  public generateJava (json: string, name: string, basePackage: string, relationships: RelationshipField[], zip: JSZip, entities: EntityConvert[]): void {
    const javaConverter = new JsonConverterJava(this);
    javaConverter.generate(json, name, basePackage, relationships, zip, entities);
  }
}

export default new JsonConverterController();
