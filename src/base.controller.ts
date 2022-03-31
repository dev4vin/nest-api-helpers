import { hasOwnProperty } from '@dev4vin/commons';
import { InfoType, PaginatedEntity, PaginateDto } from './entities';
import { applyDecorators, Body, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Type, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiForbiddenResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, PartialType } from '@nestjs/swagger';
import { Public } from './auth/auth.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RoleGuard, Role } from './auth/roles.guard';
import { BaseServiceImpl } from './base.service';
import { BaseView, BaseViewImpl, BaseViewOptions, FnRole, FnType } from './base.view';
import { Api404Response, ApiModel200Response, ApiPaginatedResponse } from './res/api.paginated.dto';

export const Authenticated = (guards: Role[] = []) => {
  if (guards.length > 0) {
    return applyDecorators(UseGuards(RoleGuard(...guards)), ApiBearerAuth('JWT-auth'));
  }
  return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth('JWT-auth'));
};

export const ApiResource = () => {
  return applyDecorators(ApiNotFoundResponse, ApiNoContentResponse, ApiOkResponse, ApiForbiddenResponse);
};

export const ApiGate = (fnType: FnType, fnTypes: FnType[] = [], roleFns: FnRole[] = []) => {
  const decorators = [];
  if (fnType in fnTypes) {
    decorators.push(Public());
  } else {
    const guards: Role[] = [];
    roleFns.forEach((roleFn) => {
      roleFn.roles.forEach((role) => {
        if (roleFn.fnType.toString() === fnType.toString()) {
          guards.push(role);
        }
      });
    });
    decorators.push(ApiBearerAuth('JWT-auth'));
    if (guards.length >= 1) {
      decorators.push(
        ApiOperation({
          summary: `Guards ${guards.map((g) => g.toString()).join(', ')}`
        })
      );
      decorators.push(UseGuards(RoleGuard(...guards)));
    } else {
      decorators.push(UseGuards(JwtAuthGuard));
    }
    decorators.push(ApiForbiddenResponse({ description: 'Forbidden.' }));
  }
  return applyDecorators(...decorators);
};
/**
 *
 *
 * @export
 * @template T
 * @param {T} classRef
 * @param {FnType[]} [publicFns=[]]
 * @param {FnRole[]} [roleFns=[]]
 * @return {*}  {Type<BaseViewImpl<T>>}
 */
export function BaseController<T extends Type<any>>(ref: T | BaseViewOptions<T>): Type<BaseViewImpl<T>> {
  const {
    classRef,
    publicFns,
    roleFns,
    hiddenFns
  }: {
    classRef: T;
    publicFns: FnType[];
    roleFns: FnRole[];
    hiddenFns: FnType[];
  } = ((param: T | BaseViewOptions<T>) => {
    if (typeof param === 'object' && hasOwnProperty(param, 'ref')) {
      return {
        classRef: param.ref,
        publicFns: param.publicFns || [],
        roleFns: param.roleFns || [],
        hiddenFns: param.hiddenFns || []
      };
    }
    return { classRef: param, publicFns: [], roleFns: [], hiddenFns: [] };
  })(ref);

  class InputType extends PartialType(classRef) {}
  /**
   *
   *
   * @class BaseControllerHost
   * @extends {BaseView<T>}
   */
  @ApiTags(`${classRef.name.toLowerCase()}`)
  @ApiExtraModels(PaginatedEntity, classRef)
  class BaseControllerHost extends BaseView<T> {
    constructor(baseService: BaseServiceImpl<T>) {
      super(baseService);
    }

    @Delete()
    @ApiGate(FnType.DELETE, publicFns, roleFns)
    @ApiNotFoundResponse()
    override async removeMany(@Query() data: InfoType): Promise<boolean> {
      const result = await super.removeMany(data);
      if (!result) {
        throw new NotFoundException();
      }
      return result;
    }

    @Patch(':id')
    @ApiNotFoundResponse()
    @ApiGate(FnType.UPDATE, publicFns, roleFns)
    override updateOne(@Param('id', ParseIntPipe) id: number, @Body() data: any): Promise<T> {
      return super.updateOne(id, data);
    }

    @ApiPaginatedResponse(classRef)
    @Get()
    @ApiGate(FnType.FIND, publicFns, roleFns)
    override findAll(@Query() info: PaginateDto) {
      return super.findAll(info);
    }

    @Get(':id')
    @ApiGate(FnType.FIND, publicFns, roleFns)
    @ApiModel200Response(classRef)
    @Api404Response(classRef)
    @ApiNotFoundResponse()
    override async findOne(@Param('id', ParseIntPipe) id: number) {
      const data = await super.findOne(id);
      if (!data) {
        throw new NotFoundException();
      }
      return data;
    }

    @Delete(':id')
    @ApiNotFoundResponse()
    @ApiGate(FnType.DELETE, publicFns, roleFns)
    override remove(@Param('id', ParseIntPipe) id: number) {
      return super.remove(id);
    }

    @Post()
    @ApiGate(FnType.CREATE, publicFns, roleFns)
    @ApiModel200Response(classRef)
    @ApiBody({ type: InputType })
    override createOne(@Body() data: any): Promise<T> {
      return super.createOne(data);
    }
  }

  function hideFn(name: string) {
    Object.defineProperty(BaseControllerHost.prototype, name, {
      value: undefined,
      writable: false,
      enumerable: false,
      configurable: false
    });
  }

  hiddenFns.forEach((fn) => {
    if (fn === FnType.FIND) {
      hideFn('findOne');
      hideFn('findAll');
    } else if (fn === FnType.CREATE) {
      hideFn('createOne');
    }
  });

  return BaseControllerHost;
}
