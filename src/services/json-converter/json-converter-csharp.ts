import * as JSZip from 'jszip';
import { JsonConverterController } from '../../controllers/json-converter-controller';
import { EntityConvert } from '../../models/entity-convert';

export class JsonConverterCSharp {
    private indentation = '  ';
    private entity: EntityConvert;
    private entities: EntityConvert[];
    private name: string;
    private zip: JSZip;
    private basePackage: string;
    private imports: string;
    private appName: string;

    // eslint-disable-next-line no-useless-constructor
    constructor (private jsonConverter: JsonConverterController) {

    }

    public generate (entity: EntityConvert, entities: EntityConvert[], zip: JSZip, basePackage: string): void {
      this.entity = entity;
      this.entities = entities;
      this.zip = zip;
      this.basePackage = basePackage;
      this.name = entity.name[0].toUpperCase() + entity.name.slice(1);

      this.generateController();
      this.generateEntity();
      this.generateViewModel();
      this.generateCommandQueryHandler();
      this.generateCommandQueryBase();
      this.generateCommandQuery();
      this.generateCommandQueryFactory();
      this.generateDataloader();
      this.generateContext();
      this.generateMongoContext();
      this.generateCommandValidatorUpdate();
      this.generateListInputModel();
    }

    private generateListInputModel (): void {
      this.generateListInputModelImports();
      const validatorBody = this.generateListInputModelBody();

      const folder = 'InputModel';
      const inputModelFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      inputModelFolder.file(`${fileModelName}.ts`, this.imports + validatorBody);
    }

    private generateListInputModelBody (): string {
      const { name, basePackage, indentation } = this;
      return `namespace ${basePackage}.API.InputModels.${name}\n` +
             '{\n' +
             `${indentation}public class List${name}QueryInputModel: ListQueryBaseInputModel\n` +
             `${indentation}{` +
             `${indentation}${indentation}public List${name}QueryInputModel()\n` +
             `${indentation}${indentation}{\n` +
             `${indentation}${indentation}}\n` +
             // TODO: implementar input model
             `${indentation}}` +
             '}';
    }

    private generateListInputModelImports (): void {
      this.imports = '';
    }

    private generateCommandValidatorUpdate (): void {
      this.generateValidatorUpdateImports();
      const validatorBody = this.generateValidatorUpdateBody();

      const folder = 'Validator';
      const validatorFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      validatorFolder.file(`${fileModelName}.ts`, this.imports + validatorBody);
    }

    private generateValidatorUpdateBody (): string {
      return `namespace ${this.basePackage}.Application.Diso.${this.name}.Commands.Update\n` +
             '{\n' +
             `${this.indentation}public class Update${this.name}CommandValidator : AbstractValidator<${this.name}Command>\n` +
             `${this.indentation}{` +
             `${this.indentation}}` +
             '{';
    }

    private generateValidatorUpdateImports (): void {
      this.imports = '';
    }

    private generateMongoContext (): void {
      this.generateMongoContextImports();
      const mongoContextBody = this.generateMongoContextBody();

      const folder = 'Context';
      const mongoContextFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      mongoContextFolder.file(`${fileModelName}.ts`, this.imports + mongoContextBody);
    }

    private generateMongoContextImports (): void {
      this.imports = '';
    }

    private generateMongoContextBody (): string {
      return '';
    }

    private generateContext (): void {
      this.generateContextImports();
      const contextBody = this.generateContextBody();

      const folder = 'Context';
      const contextFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      contextFolder.file(`${fileModelName}.ts`, this.imports + contextBody);
    }

    private generateContextImports (): void {
      this.imports = '';
    }

    private generateContextBody (): string {
      return '';
    }

    private generateDataloader (): void {
      this.generateDataloaderImports();
      const dataloaderBody = this.generateDataloaderBody();

      const folder = 'DataLoader';
      const dataloaderFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      dataloaderFolder.file(`${fileModelName}.ts`, this.imports + dataloaderBody);
    }

    private generateDataloaderImports (): void {
      this.imports = '';
    }

    private generateDataloaderBody (): string {
      return '';
    }

    private generateCommandQueryFactory (): void {
      this.generateCommandQueryFactoryImports();
      const commandQueryFactoryBody = this.generateCommandQueryFactoryBody();

      const folder = 'Factory';
      const modelsFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      modelsFolder.file(`${fileModelName}.ts`, this.imports + commandQueryFactoryBody);
    }

    private generateCommandQueryFactoryImports (): void {
      this.imports = `using ${this.basePackage}.Application.Abstracts.Sector.Queries;\n` +
                     'using System;\n' +
                     'using System.Collections.Generic;\n' +
                     'using System.Linq;\n';
    }

    private generateCommandQueryFactoryBody (): string {
      const { indentation, name, basePackage } = this;
      return `namespace ${basePackage}.API.Factories.${name}.Queries\n` +
             '{\n' +
             `${indentation}public class List${name}QueryFactory\n` +
             `${indentation}{\n` +
             `${indentation}${indentation}private IDictionary<Guid, Func<List${name}QueryBase>> _dictionary;\n` +
             `${indentation}${indentation}private List${name}QueryInputModel _data;\n` +
             `${indentation}${indentation}private Guid _userId;\n` +
             `${indentation}${indentation}private Guid _loggedUserId;\n` +
             `${indentation}${indentation}private string _token;\n` +
             `${indentation}${indentation}public List${name}QueryFactory()\n` +
             `${indentation}${indentation}{\n` +
             `${indentation}${indentation}${indentation}_dictionary = new Dictionary<Guid, Func<List${name}QueryBase>>()` +
             `${indentation}${indentation}${indentation}{\n` +
             `${indentation}${indentation}${indentation}${indentation}{ Common.Domain.Enums.Applications.CIBCB, CibcbQuery }\n` +
             `${indentation}${indentation}${indentation}};\n` +
             `${indentation}${indentation}}\n\n` +
             `${indentation}${indentation}public List${name}QueryBase Create(string token, Guid applicationId, Guid userId, Guid loggedUserId, List${name}QueryInputModel data)\n` +
             `${indentation}${indentation}{\n` +
             `${indentation}${indentation}${indentation}_data = data;\n` +
             `${indentation}${indentation}${indentation}_userId = userId;\n` +
             `${indentation}${indentation}${indentation}_token = token;\n` +
             `${indentation}${indentation}${indentation}_loggedUserId = loggedUserId;\n\n` +
             `${indentation}${indentation}${indentation}var command = _dictionary.SingleOrDefault(x => x.Key == applicationId).Value.Invoke();\n\n` +
             `${indentation}${indentation}${indentation}return command;\n` +
             `${indentation}${indentation}}\n\n` +
             `${indentation}${indentation}public Application.CIBCB.${name}.Queries.List${name}Query()\n` +
             `${indentation}${indentation}{\n` +
             `${indentation}${indentation}${indentation}return new Application.CIBCB.${name}.Queries.List${name}Query()\n` +
             `${indentation}${indentation}${indentation}{\n` +
             `${indentation}${indentation}${indentation}${indentation}Token = _token,\n` +
             `${indentation}${indentation}${indentation}${indentation}UserId = _userId,\n` +
             `${indentation}${indentation}${indentation}${indentation}LoggedUserId = _loggedUserId,\n` +
             `${indentation}${indentation}${indentation}${indentation}CustomerKey = _data.CustomerKey,\n` +
             `${indentation}${indentation}${indentation}${indentation}PageIndex = _data.PageIndex,\n` +
             `${indentation}${indentation}${indentation}${indentation}PageSize = _data.PageSize,\n` +
             `${indentation}${indentation}${indentation}${indentation}IsOrderedAsc = _data.IsOrderedAsc,\n` +
             `${indentation}${indentation}${indentation}${indentation}OrderProperty = _data.OrderProperty,\n` +
             `${indentation}${indentation}${indentation}${indentation}LoadHeaders = _data.LoadHeaders,\n` +
             `${indentation}${indentation}${indentation}${indentation}Filters = _data.Filters != null ? _data.Filters.Select(x => \n` +
             `${indentation}${indentation}${indentation}${indentation}${indentation}x.Select(y => new QueryFilter()\n` +
             `${indentation}${indentation}${indentation}${indentation}${indentation}{\n` +
             `${indentation}${indentation}${indentation}${indentation}${indentation}${indentation}Value = y.Value,\n` +
             `${indentation}${indentation}${indentation}${indentation}${indentation}${indentation}Value2 = y.Value2,\n` +
             `${indentation}${indentation}${indentation}${indentation}${indentation}${indentation}Key = y.Key,\n` +
             `${indentation}${indentation}${indentation}${indentation}${indentation}${indentation}Type = y.Type,\n` +
             `${indentation}${indentation}${indentation}${indentation}${indentation}}).ToList()\n` +
             `${indentation}${indentation}${indentation}${indentation}).ToList() : new List<List<QueryFilter>>(),\n` +
             `${indentation}${indentation}${indentation}};\n` +
             `${indentation}${indentation}}\n` +
             `${indentation}${indentation}}\n` +
             `${indentation}}\n` +
             '}\n';
    }

    private generateCommandQuery (): void {
      this.generateCommandQueryImports();
      const commandQueryBody = this.generateCommandQueryBody();

      const folder = 'CommandQuery';
      const modelsFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      modelsFolder.file(`${fileModelName}.ts`, this.imports + commandQueryBody);
    }

    private generateCommandQueryImports (): void {
      this.imports = '';
    }

    private generateCommandQueryBody (): string {
      return '';
    }

    private generateViewModel (): void {
      this.generateViewModelImports();
      const viewModelsBody = this.generateViewModelBody();

      const folder = 'ViewModels';
      const modelsFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      modelsFolder.file(`${fileModelName}.ts`, this.imports + viewModelsBody);
    }

    private generateViewModelImports (): void {
      this.imports = '';
    }

    private generateViewModelBody (): string {
      return '';
    }

    private generateQueryHandler (): void {
      this.generateQueryHandlerImports();
      const queryHandlerBody = this.generateQueryHandlerBody();

      const folder = 'Query';
      const queryHandlerFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      queryHandlerFolder.file(`${fileModelName}.ts`, this.imports + queryHandlerBody);
    }

    private generateQueryHandlerBody (): string {
      return `namespace ${this.basePackage}.Application.Diso.${this.name}.Commands.Update\n` +
             '{\n' +
             `${this.indentation}public class List${this.name}QueryHandler : IRequestHandler<${this.name}Query, ${this.name}ViewModel>\n` +
             `${this.indentation}{` +
             `${this.indentation}}` +
             '{';
    }

    private generateQueryHandlerImports (): void {
      this.imports = '';
    }

    private generateCommandQueryHandler (): void {
      this.generateCommandQueryHandlerImports();
      const commandQueryHandlerBody = this.generateCommandQueryHandlerBody();

      const folder = 'CommandQuery';
      const queryHandlerFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      queryHandlerFolder.file(`${fileModelName}.ts`, this.imports + commandQueryHandlerBody);
    }

    private generateCommandQueryHandlerBody (): string {
      return '';
    }

    private generateCommandQueryHandlerImports (): void {
      this.imports = '';
    }

    private generateCommandQueryBase (): void {
      this.generateCommandQueryBaseImports();
      const commandQueryBase = this.generateCommandQueryBaseBody();

      const folder = 'CommandQuery';
      const modelsFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      modelsFolder.file(`${fileModelName}.ts`, this.imports + commandQueryBase);
    }

    private generateCommandQueryBaseBody (): string {
      return '';
    }

    private generateCommandQueryBaseImports (): void {
      this.imports = '';
    }

    private generateController (): void {
      this.generateControllerImports();
      const controllerBody = this.generateControllerBody();

      const folder = 'Controllers';
      const modelsFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      modelsFolder.file(`${fileModelName}.ts`, this.imports + controllerBody);
    }

    private generateControllerImports () {
      this.imports = `using ${this.basePackage}.API.Factories.${this.name}.Commands;` +
                     `using ${this.basePackage}.API.Factories.${this.name}.Queries;` +
                     `using ${this.basePackage}.API.InputModels.${this.name};` +
                     'using System;\n' +
                     'using System.Threading.Tasks;\n' +
                     'using MediatR;\n' +
                     'using Microsoft.AspNetCore.Mvc;\n' +
                     'using Microsoft.AspNetCore.Cors;\n' +
                     'using System.Threading.Tasks;\n\n';
    }

    private generateControllerBody (): string {
      const { indentation } = this;
      return `namespace ${this.basePackage}.API.Controllers\n` +
             '{\n' +
             `${indentation}[EnableCors("CorsPolicy")]\n` +
             `${indentation}[ApiController]\n` +
             `${indentation}[Route("api/[controller]")]\n` +
             `${indentation}public class ${this.name}Controller : BaseController\n` +
             `${indentation}{\n` +
             `${indentation}${indentation}// POST: api/${this.name}/ \n` +
             `${indentation}${indentation}[HttpPost]\n` +
             `${indentation}${indentation}public async Task<IActionResult> Post([FromBody] ${this.name}CreateInputModel createModel)\n` +
             `${indentation}${indentation}{\n` +
             `${indentation}${indentation}${indentation}var factory = new Create${this.name}CommandFactory();\n\n` +
             `${indentation}${indentation}${indentation}var command = factory.Create(ApplicationId, Token, UserId, LoggedUserId, LoggedUserRoleId, createModel);\n\n` +
             `${indentation}${indentation}${indentation}var entityId = await Mediator.Send(command);\n\n` +
             `${indentation}${indentation}${indentation}Log.Create("${this.name}", entityId.ToString(), LoggedUserId.ToString());\n\n` +
             `${indentation}${indentation}${indentation}return Ok(entityId);\n` +
             `${indentation}${indentation}}\n\n` +
             `${indentation}${indentation}// PUT: api/${this.name} \n` +
             `${indentation}${indentation}[HttpPut]\n` +
             `${indentation}${indentation}public async Task<IActionResult> Put([FromBody] ${this.name}UpdateInputModel updateModel)\n` +
             `${indentation}${indentation}{\n` +
             `${indentation}${indentation}${indentation}var factory = new Update${this.name}CommandFactory();\n\n` +
             `${indentation}${indentation}${indentation}var command = factory.Create(ApplicationId, Token, UserId, LoggedUserId, LoggedUserRoleId, updateModel);\n\n` +
             `${indentation}${indentation}${indentation}var response = await Mediator.Send(command);\n\n` +
             `${indentation}${indentation}${indentation}Log.Update("${this.name}", updateModel.Id.ToString(), LoggedUserId.ToString());\n\n` +
             `${indentation}${indentation}${indentation}return Ok(response);\n` +
             `${indentation}${indentation}}\n\n` +
             `${indentation}${indentation}[HttpDelete("{id}")]\n` +
             `${indentation}${indentation}public async Task<IActionResult> Delete(int id)\n` +
             `${indentation}${indentation}{\n` +
             `${indentation}${indentation}${indentation}var factory = new Delete${this.name}CommandFactory();\n\n` +
             `${indentation}${indentation}${indentation}var command = factory.Create(ApplicationId, Token, UserId, LoggedUserId, LoggedUserRoleId, id);\n\n` +
             `${indentation}${indentation}${indentation}var response = await Mediator.Send(command);\n\n` +
             `${indentation}${indentation}${indentation}Log.Delete("${this.name}", id.ToString(), LoggedUserId.ToString());\n\n` +
             `${indentation}${indentation}${indentation}return Ok(response);\n` +
             `${indentation}${indentation}}\n\n` +
             `${indentation}${indentation}[HttpGet]\n` +
             `${indentation}${indentation}public async Task<IActionResult> GetAll([FromQuery] List${this.name}QueryInputModel getModel)\n` +
             `${indentation}${indentation}{\n` +
             `${indentation}${indentation}${indentation}var factory = new List${this.name}QueryFactory();\n\n` +
             `${indentation}${indentation}${indentation}var query = factory.Create(ApplicationId, Token, UserId, LoggedUserId, LoggedUserRoleId, getModel);\n\n` +
             `${indentation}${indentation}${indentation}var response = await Mediator.Send(query);\n\n` +
             `${indentation}${indentation}${indentation}Log.Read("${this.name}", LoggedUserId.ToString());\n\n` +
             `${indentation}${indentation}${indentation}return Ok(response);\n` +
             `${indentation}${indentation}}\n\n` +
             `${indentation}${indentation}[HttpGet("{id}")]\n` +
             `${indentation}${indentation}public async Task<IActionResult> Get(int id)\n` +
             `${indentation}${indentation}{\n` +
             `${indentation}${indentation}${indentation}var factory = new Get${this.name}QueryFactory();\n\n` +
             `${indentation}${indentation}${indentation}var query = factory.Create(ApplicationId, Token, UserId, LoggedUserId, LoggedUserRoleId, id);\n\n` +
             `${indentation}${indentation}${indentation}var response = await Mediator.Send(query);\n\n` +
             `${indentation}${indentation}${indentation}Log.Read("${this.name}", id, LoggedUserId.ToString());\n\n` +
             `${indentation}${indentation}${indentation}return Ok(response);\n` +
             `${indentation}${indentation}}\n` +
             `${indentation}}\n\n` +
             '}\n';
    }

    private generateEntity (): void {
      this.generateEntityImports();
      const entityBody = this.generateEntityBody();

      const folder = 'Entities';
      const modelsFolder = this.zip.folder(folder);
      const fileModelName = this.name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
      modelsFolder.file(`${fileModelName}.ts`, this.imports + entityBody);
    }

    private generateEntityImports (): void {
      this.imports = '';
    }

    private generateEntityBody (): string {
      let modelBody = `public class ${this.name}\n` +
                        '{\n';
      modelBody += '}\n';
      return modelBody;
    }

    private getType (): string {
      return '';
    }
}
