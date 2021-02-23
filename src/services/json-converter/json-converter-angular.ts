import * as JSZip from 'jszip';
import { JsonConverterController } from '../../controllers/json-converter-controller';
import { EntityConvert } from '../../models/entity-convert';

export class JsonConverterAngular {
    private indentation = '  ';
    private entity: EntityConvert;
    private entities: EntityConvert[];
    private name: string;
    private zip: JSZip;
    private imports: string;

    // eslint-disable-next-line no-useless-constructor
    constructor (private jsonConverter: JsonConverterController) {

    }

    public generate (entity: EntityConvert, entities: EntityConvert[], zip: JSZip): void {
      this.entity = entity;
      this.entities = entities;
      this.zip = zip;
      this.name = entity.name[0].toUpperCase() + entity.name.slice(1) + 'Model';

      this.generateModel();
      this.generateService();
    }

    private generateModel (): void {
      this.generateModelImports();
      const modelBody = this.generateModelBody();
      const pageableBody = this.generatePageBody();
      this.generateExternalModels();

      const folder = 'models';
      const modelsFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      modelsFolder.file(`${fileModelName}.ts`, this.imports + modelBody);
      modelsFolder.file('page.ts', pageableBody);
    }

    private generateService (): void {
      this.generateServiceImports();

      const serviceBody = this.generateServiceBody();

      const folder = 'services';
      const servicesFolder = this.zip.folder(folder);
      const fileName = this.name.replace('Model', '.service')
        .replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();

      servicesFolder.file(`${fileName}.ts`, this.imports + serviceBody);
    }

    private generateServiceImports (): void {
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      this.imports = 'import { Injectable } from \'@angular/core\';\n' +
                       'import { HttpClient } from \'@angular/common/http\';\n' +
                       'import { Observable } from \'rxjs\';\n\n' +

                       'import { environment } from \'src/environments/environment\';\n' +
                       `import { ${this.name} } from '../models/${fileModelName}'; \n` +
                       'import { Page } from \'../models/page\'; \n\n';
    }

    private generateModelImports (): void {
      this.imports = '';
    }

    private generateExternalModels (): void {
      const body = JSON.parse(this.entity.json);
      const properties = Object.keys(body);
      for (const property of properties) {
        const isExternalModel = this.getType(property, body, false).includes('Model');
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
          this.jsonConverter.generateAngular(destinationEntity, [...this.entities, destinationEntity], this.zip);
        }
      }
    }

    private generateModelBody (): string {
      const { indentation } = this;
      const body = JSON.parse(this.entity.json);
      const properties = Object.keys(body);
      let modelbody = '\n';
      modelbody += `export interface ${this.name}{\n`;
      for (const property of properties) {
        modelbody += `${indentation}${property}: ${this.getType(property, body)};\n`;
      }
      modelbody += '}\n';
      return modelbody;
    }

    private generatePageBody (): string {
      const { indentation } = this;
      let pageBody = '\n';
      pageBody += 'export interface Page<T>{\n' +
                     `${indentation} content: T[];\n` +
                     `${indentation} pageable: Pageable;\n` +
                     `${indentation} totalPages: number;\n` +
                     `${indentation} last: boolean;\n` +
                     `${indentation} totalElements: number;\n` +
                     `${indentation} size: number;\n` +
                     `${indentation} number: number;\n` +
                     `${indentation} sort: Sort;\n` +
                     `${indentation} numberOfElements: number;\n` +
                     `${indentation} first: boolean;\n` +
                     `${indentation} empty: boolean;\n` +
                     '}\n\n';

      pageBody += 'interface Pageable{\n' +
                    `${indentation} sort: Sort;\n` +
                    `${indentation} offset: number;\n` +
                    `${indentation} pageSize: number;\n` +
                    `${indentation} pageNumber: number;\n` +
                    `${indentation} paged: boolean;\n` +
                    `${indentation} unpaged: boolean;\n` +
                    '}\n\n';

      pageBody += 'interface Sort{\n' +
                    `${indentation} sorted: boolean;\n` +
                    `${indentation} unsorted: boolean;\n` +
                    `${indentation} empty: boolean;\n` +
                    '}\n\n';
      return pageBody;
    }

    private generateServiceBody (): string {
      const { indentation } = this;
      let serviceBody = '\n';
      const className = this.name.replace('Model', 'Service');
      serviceBody +=
            '@Injectable({\n' +
                `${indentation}providedIn: 'root'\n` +
              '})\n' +
            `export class ${className}{\n`;

      serviceBody += `\n${this.generateServiceConstructor()}\n${this.generateServiceMethods()}`;

      serviceBody += '}\n';
      return serviceBody;
    }

    private generateServiceMethods (): string {
      const { indentation, name } = this;
      const endpointName = name.replace('Model', '').replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();

      const body = JSON.parse(this.entity.json);
      let properties = Object.keys(body);

      let findAllParams = '{';
      properties = properties.filter(property => property !== 'id');
      properties.forEach((property) => {
        const type = this.getType(property, body, false);
        const typeIsObject = type !== 'String' && type[0].toUpperCase() === type[0];
        if (!typeIsObject) {
          findAllParams += `${property}, `;
        }
      });
      if (findAllParams !== '{') {
        findAllParams += `}: ${name},`;
      } else {
        findAllParams = '';
      }
      findAllParams += 'page: number = null, size: number = null';

      let filters = '';
      properties.forEach((property) => {
        const type = this.getType(property, body, false);
        const typeIsObject = type !== 'String' && type[0].toUpperCase() === type[0];
        if (!typeIsObject) {
          filters += `${indentation}${indentation}if(${property} != null){\n` +
                           `${indentation}${indentation}${indentation}filters += \`${property}=\${${property}}&\`;\n` +
                           `${indentation}${indentation}}\n\n`;
        }
      });

      filters += `${indentation}${indentation}if(page != null){\n` +
                   `${indentation}${indentation}${indentation}filters += 'page=\${page}&';\n` +
                   `${indentation}${indentation}}\n\n`;

      filters += `${indentation}${indentation}if(size != null){\n` +
                    `${indentation}${indentation}${indentation}filters += 'size=\${size}&';\n` +
                    `${indentation}${indentation}}\n\n`;

      return `${indentation}\nfindAll(${findAllParams}): Observable<Page<${name}>>{\n` +
               `${indentation}${indentation}let filters = '?';\n` +
               `${filters}` +
               `${indentation}${indentation}filters = filters.substring(0, filters.length -1);\n` +
               `${indentation}${indentation}return this.http.get<Page<${name}>>(\`\${environment.apiEndpoint}/${endpointName}\${filters}\`);\n` +
               `${indentation}}\n` +
               `${indentation}\nfindById(id: number): Observable<${name}>{\n` +
               `${indentation}${indentation}return this.http.get<${name}>(\`\${environment.apiEndpoint}/${endpointName}/\${id}\`);\n` +
               `${indentation}}\n` +
               `${indentation}\ninsert(model: ${name}): Observable<${name}>{\n` +
               `${indentation}${indentation}return this.http.post<${name}>(\`\${environment.apiEndpoint}/${endpointName}\`,model);\n` +
               `${indentation}}\n` +
               `${indentation}\ndelete(id: number): Observable<${name}>{\n` +
               `${indentation}${indentation}return this.http.delete<${name}>(\`\${environment.apiEndpoint}/${endpointName}/\${id}\`);\n` +
               `${indentation}}\n` +
               `${indentation}\nupdate(model: ${name}, id: number): Observable<${name}>{\n` +
               `${indentation}${indentation}return this.http.put<${name}>(\`\${environment.apiEndpoint}/${endpointName}/\${id}\`,model);\n` +
               `${indentation}}\n`;
    }

    private generateServiceConstructor (): string {
      return `${this.indentation}constructor(private http: HttpClient) { }\n`;
    }

    private getType (property: string, body: Record<string, unknown>, changeImports = true): string {
      let type: string = typeof body[property];
      if (type === 'object' && !Array.isArray(body[property])) {
        type = `${property[0].toUpperCase() + property.slice(1)}Model`;
        const fileModelDestinationName = type.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
        if (changeImports) { this.imports += `import { ${type} } from './${fileModelDestinationName}';\n`; };
      } else if (Array.isArray(body[property]) && !!(body[property] as Array<unknown>).length) {
        if (typeof body[property][0] === 'object') {
          const propertyName = `${property[0].toUpperCase() + property.slice(1)}Model`;
          type = propertyName + '[]';
          const fileModelDestinationName = propertyName.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
          if (changeImports) { this.imports += `import { ${propertyName} } from './${fileModelDestinationName}';\n`; };
        } else {
          type = `${typeof body[property][0]}[]`;
        }
      }
      return type;
    }
}
