import * as JSZip from 'jszip';
import { JsonConverterController } from '../../controllers/json-converter-controller';
import { EntityConvert } from '../../models/entity-convert';

export class JsonConverterFlutter {
    private indentation = '  ';
    private entity: EntityConvert;
    private entities: EntityConvert[];
    private name: string;
    private zip: JSZip;
    private imports: string;
    private appName: string;

    // eslint-disable-next-line no-useless-constructor
    constructor (private jsonConverter: JsonConverterController) {

    }

    public generate (entity: EntityConvert, entities: EntityConvert[], zip: JSZip, appName: string): void {
      this.entity = entity;
      this.entities = entities;
      this.zip = zip;
      this.name = entity.name[0].toUpperCase() + entity.name.slice(1) + 'Model';
      this.appName = appName;
      this.generateModel();
      this.generateService();
    }

    private generateModel (): void {
      this.generateModelImports();
      const modelBody = this.generateModelBody();
      const pageBody = this.generatePageBody();
      this.generateExternalModels();

      const folder = 'models';
      const modelsFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1_').toLowerCase();
      modelsFolder.file(`${fileModelName}.dart`, this.imports + modelBody);

      modelsFolder.file('page.dart', pageBody);
    }

    private generateService (): void {
      this.generateServiceImports();

      const serviceBody = this.generateServiceBody();

      const folder = 'services';
      const servicesFolder = this.zip.folder(folder);
      const fileName = this.name.replace('Model', 'Service')
        .replace(/([a-zA-Z])(?=[A-Z])/g, '$1_').toLowerCase();

      servicesFolder.file(`${fileName}.dart`, this.imports + serviceBody);
    }

    private generateServiceImports (): void {
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1_').toLowerCase();
      this.imports = 'import \'dart:convert\';\n' +
                       'import \'package:http/http.dart\' as http;\n\n' +

                       `import 'package:${this.appName}/config.dart';\n` +
                       `import 'package:${this.appName}/models/page.dart'; \n` +
                       `import 'package:${this.appName}/models/${fileModelName}.dart'; \n\n`;
    }

    generateModelImports (): void {
      this.imports = '';
    }

    generateExternalModels (): void {
      const body = JSON.parse(this.entity.json);
      const properties = Object.keys(body);
      for (const property of properties) {
        const isExternalModel = this.getTypeFromBody(property, body, false).includes('Model');
        const hasInEntities = this.entities.some(entity => entity.name && entity.name.toLowerCase() === property.toLowerCase());
        if (isExternalModel && !hasInEntities) {
          let destObj = body[property];
          if (Array.isArray(destObj)) {
            destObj = body[property][0];
          }
          const destinationEntity: EntityConvert = {
            basePackage: this.entity.basePackage,
            json: JSON.stringify(destObj),
            name: property,
            appName: this.entity.appName,
            relationships: []
          };
          this.jsonConverter.generateFlutter(destinationEntity, [...this.entities, destinationEntity], this.zip, this.appName);
        }
      }
    }

    generateModelBody (properties: string[] = null, name: string = null, types: string[] = null): string {
      const { indentation } = this;
      const body = JSON.parse(this.entity.json);
      properties = properties === null ? Object.keys(body) : properties;
      name = name === null ? this.name : name;
      let modelbody = '\n';
      modelbody += `class ${name}{\n`;
      properties.forEach((property, index) => {
        let type = this.getTypeFromBody(property, body);
        if (types != null) {
          type = types[index];
        }

        modelbody += `${indentation}${type} ${property};\n`;
      });
      modelbody += this.generateModelMethods(types, properties, name.replace('<T>', ''));
      modelbody += '}\n';
      return modelbody;
    }

    generatePageBody (): string {
      let pageBody = '\n';
      pageBody += this.generateModelBody(
        ['content', 'contentObj', 'pageable', 'totalPages', 'last', 'totalElements', 'size', 'number', 'sort', 'numberOfElements', 'first', 'empty'],
        'Page<T>',
        ['List<Map<String, dynamic>>', 'List<T>', 'Pageable', 'int', 'bool', 'int', 'int', 'int', 'Sort', 'int', 'bool', 'bool']);
      pageBody += '\n\n';
      pageBody += this.generateModelBody(
        ['sort', 'offset', 'pageSize', 'pageNumber', 'paged', 'unpaged'],
        'Pageable',
        ['Sort', 'int', 'int', 'int', 'bool', 'bool']);
      pageBody += '\n\n';
      pageBody += this.generateModelBody(
        ['sorted', 'unsorted', 'empty'],
        'Sort',
        ['bool', 'bool', 'bool']);
      return pageBody;
    }

    generateModelMethods (types: string[] = null, properties: string[] = null, name: string = null): string {
      return `${this.generateConstructors(properties, name, types)}\n` +
               `${this.jsonMethods(properties, types)}`;
    }

    generateConstructors (properties: string[], name: string = null, types: string[] = []): string {
      const { indentation } = this;
      name = name === null ? this.name : name;
      let constructors = `${indentation}${name}({\n`;
      properties.forEach((property, index) => {
        constructors += `${indentation}${indentation}this.${property}${index === properties.length - 1 ? '' : ','}\n`;
      });
      constructors += `${indentation}});\n\n`;

      const body = JSON.parse(this.entity.json);

      constructors += `${indentation}${name}.fromJson(Map<String, dynamic> json) {\n`;
      properties.forEach((property, index) => {
        let type = this.getTypeFromBody(property, body, false);
        if (types != null) {
          type = types[index];
        }
        if (type[0] === type[0].toUpperCase() && !type.startsWith('List<') && !type.startsWith('Map<') && type !== 'String') {
          constructors += `${indentation}${indentation}if(json['${property}'] != null){\n` +
                                `${indentation}${indentation}${indentation}${property} = ${type}.fromJson(json['${property}']);\n` +
                                `${indentation}${indentation}}\n`;
        } else if (type.startsWith('List<') && type !== 'List<T>' && type[5] === type[5].toUpperCase() && !type.startsWith('List<Map')) {
          constructors += `${indentation}${indentation}if(json['${property}'] != null){\n` +
                                `${indentation}${indentation}${indentation}${property}  = ${type}();\n` +
                                `${indentation}${indentation}${indentation}json['${property}'].forEach((v){\n` +
                                `${indentation}${indentation}${indentation}${indentation}${property}.add(${type.replace('List<', '').replace(/.$/, '')}.fromJson(v));\n` +
                                `${indentation}${indentation}${indentation}});\n` +
                                `${indentation}${indentation}}`;
        } else {
          constructors += `${indentation}${indentation}${property} = json['${property}'];\n`;
        }
      });
      constructors += `${indentation}}\n`;
      return constructors;
    }

    jsonMethods (properties: string[], types: string[] = []): string {
      const { indentation } = this;
      let jsonMethods = `${indentation}Map<String, dynamic> toJson() {\n`;
      jsonMethods += `${indentation}${indentation}final Map<String, dynamic> data = Map<String, dynamic>();\n`;
      properties.forEach((property, index) => {
        const body = JSON.parse(this.entity.json);

        let type = this.getTypeFromBody(property, body, false);
        if (types != null) {
          type = types[index];
        }

        if (type[0] === type[0].toUpperCase() && !type.startsWith('List<') && !type.startsWith('Map<') && type !== 'String') {
          jsonMethods += `\n${indentation}${indentation}if(this.${property} != null){\n` +
                                `${indentation}${indentation}${indentation}data['${property}'] = this.${property}.toJson();\n` +
                                `${indentation}${indentation}}`;
        } else if (type.startsWith('List<') && type !== 'List<T>' && type[5] === type[5].toUpperCase() && !type.startsWith('List<Map')) {
          jsonMethods += `\n${indentation}${indentation}if(this.${property} != null){\n` +
                               `${indentation}${indentation}${indentation}data['${property}'] = this.${property}.map((v) => v.toJson()).toList();\n` +
                               `${indentation}${indentation}}`;
        } else {
          jsonMethods += `\n${indentation}${indentation}data['${property}'] = this.${property};`;
        }
      });
      jsonMethods += `\n${indentation}}\n`;
      return jsonMethods;
    }

    generateServiceBody (): string {
      let serviceBody = '\n';
      const className = this.name.replace('Model', 'Service');
      serviceBody += `class ${className}{\n`;

      serviceBody += `\n\n${this.generateServiceMethods()}`;

      serviceBody += '}\n';
      return serviceBody;
    }

    generateServiceMethods (): string {
      const { indentation, name } = this;
      const endpointName = name.replace('Model', '').replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      const body = JSON.parse(this.entity.json);
      let properties = Object.keys(body);

      let params = '{';
      properties = properties.filter(property => property !== 'id');
      properties.forEach((property) => {
        const type = this.getTypeFromBody(property, body, false);
        const typeIsObject = type !== 'String' && type[0].toUpperCase() === type[0];
        if (!typeIsObject) {
          params += `${type} ${property}, `;
        }
      });
      params += 'int page, int size}';

      let filters = '';
      properties.forEach((property) => {
        const type = this.getTypeFromBody(property, body, false);
        const typeIsObject = type !== 'String' && type[0].toUpperCase() === type[0];
        if (!typeIsObject) {
          filters += `${indentation}${indentation}if(${property} != null){\n` +
                           `${indentation}${indentation}${indentation}filters += '${property}=$${property}&';\n` +
                           `${indentation}${indentation}}\n\n`;
        }
      });

      filters += `${indentation}${indentation}if(page != null){\n` +
                   `${indentation}${indentation}${indentation}filters += 'page=$page&';\n` +
                   `${indentation}${indentation}}\n\n`;

      filters += `${indentation}${indentation}if(size != null){\n` +
                    `${indentation}${indentation}${indentation}filters += 'size=$size&';\n` +
                    `${indentation}${indentation}}\n\n`;

      return `${indentation}Future<Page<${name}>> findAll(${params}){\n` +
               `${indentation}${indentation}var filters = '?';\n` +
               `${filters}` +
               `${indentation}${indentation}filters = filters.substring(0, filters.length -1);\n` +
               `${indentation}${indentation}return http.get('$apiEndpoint/${endpointName}?$filters').then((response) {\n` +
               `${indentation}${indentation}${indentation}var modelJSON = json.decode(Utf8Decoder().convert(response.bodyBytes)); \n` +
               `${indentation}${indentation}${indentation}Page<${name}> model = Page.fromJson(modelJSON); \n` +
               `${indentation}${indentation}${indentation}model.contentObj = model.content.map<${name}>((modelJson) => ${name}.fromJson(modelJson)).toList(); \n` +
               `${indentation}${indentation}${indentation}return model; \n` +
               `${indentation}${indentation}});\n` +
               `${indentation}}\n` +
               `${indentation}Future<${name}> findById(int id){\n` +
               `${indentation}${indentation}return http.get('$apiEndpoint/${endpointName}/$id').then((response) {\n` +
               `${indentation}${indentation}${indentation}var modelJSON = json.decode(Utf8Decoder().convert(response.bodyBytes)); \n` +
               `${indentation}${indentation}${indentation}${name} model = ${name}.fromJson(modelJSON); \n` +
               `${indentation}${indentation}${indentation}return model; \n` +
               `${indentation}${indentation}});\n` +
               `${indentation}}\n` +
               `${indentation}Future<${name}> insert(${name} model){\n` +
               `${indentation}${indentation}return http.post('$apiEndpoint/${endpointName}',headers: {'Content-type': 'application/json'},body: json.encode(model)).then((response) {\n` +
               `${indentation}${indentation}${indentation}var modelJSON = json.decode(Utf8Decoder().convert(response.bodyBytes)); \n` +
               `${indentation}${indentation}${indentation}${name} model = ${name}.fromJson(modelJSON); \n` +
               `${indentation}${indentation}${indentation}return model; \n` +
               `${indentation}${indentation}});\n` +
               `${indentation}}\n` +
               `${indentation}Future<${name}> delete(int id){\n` +
               `${indentation}${indentation}return http.delete('$apiEndpoint/${endpointName}/$id').then((response) {\n` +
               `${indentation}${indentation}${indentation}var modelJSON = json.decode(Utf8Decoder().convert(response.bodyBytes)); \n` +
               `${indentation}${indentation}${indentation}${name} model = ${name}.fromJson(modelJSON); \n` +
               `${indentation}${indentation}${indentation}return model; \n` +
               `${indentation}${indentation}});\n` +
               `${indentation}}\n` +
               `${indentation}Future<${name}> update(${name} model, int id){\n` +
               `${indentation}${indentation}return http.put('$apiEndpoint/${endpointName}/$id',headers: {'Content-type': 'application/json'},body: json.encode(model)).then((response) {\n` +
               `${indentation}${indentation}${indentation}var modelJSON = json.decode(Utf8Decoder().convert(response.bodyBytes)); \n` +
               `${indentation}${indentation}${indentation}${name} model = ${name}.fromJson(modelJSON); \n` +
               `${indentation}${indentation}${indentation}return model; \n` +
               `${indentation}${indentation}});\n` +
               `${indentation}}\n`;
    }

    getTypeFromBody (property: string, body: Record<string, unknown>, changeImports = true): string {
      return this.getType(property, body[property], changeImports);
    }

    getType (property: string, value: unknown, changeImports = true): string {
      let type: string = typeof value;
      if (type === 'object' && !Array.isArray(value)) {
        type = `${property[0].toUpperCase() + property.slice(1)}Model`;
        const fileModelDestinationName = type.replace(/([a-zA-Z])(?=[A-Z])/g, '$1_').toLowerCase();
        if (changeImports) { this.imports += `import 'package:${this.appName}/models/${fileModelDestinationName}.dart';\n`; };
      } else if (Array.isArray(value) && !!value.length) {
        if (typeof value[0] === 'object') {
          const propertyName = `${property[0].toUpperCase() + property.slice(1)}Model`;
          type = `List<${propertyName}>`;
          const fileModelDestinationName = propertyName.replace(/([a-zA-Z])(?=[A-Z])/g, '$1_').toLowerCase();
          if (changeImports) { this.imports += `import 'package:${this.appName}/models/${fileModelDestinationName}.dart';\n`; };
        } else {
          type = `List<${this.getType('0', value[0])}}>`;
        }
      } else if (type === 'number') {
        if (value.toString().includes('.')) {
          return 'double';
        } else {
          return 'int';
        }
      } else if (type === 'boolean') {
        return 'bool';
      } else if (type === 'string') {
        return 'String';
      }
      return type;
    }
}
