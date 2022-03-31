import { hasOwnProperty, info as i } from '@dev4vin/commons';
import { applyDecorators, ExecutionContext, Type, UseGuards } from '@nestjs/common';
import { Args, GqlContextType, GqlExecutionContext, InputType, Int, Mutation, ObjectType, PartialType, Query, Resolver } from '@nestjs/graphql';
import { Public } from './auth/auth.guard';
import { GqlJwtAuthGuard } from './auth/jwt-auth.guard';
import { GqlRoleGuard, Role } from './auth/roles.guard';
import { BaseServiceImpl } from './base.service';
import { BaseView, BaseViewImpl, BaseViewOptions, FnRole, FnType } from './base.view';
import { InfoType, PaginateDto } from './entities';
import { Paginated } from './res/gql.paginated.dto';

export function isResolvingGraphQLField(context: ExecutionContext): boolean {
  if (context.getType<GqlContextType>() === 'graphql') {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    const parentType = info.parentType.name;
    return parentType !== 'Query' && parentType !== 'Mutation';
  }
  return false;
}

export const GqlGate = (fnType: FnType, fnTypes: FnType[] = [], roleFns: FnRole[] = []) => {
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
    if (guards.length >= 1) {
      // decorators.push(
      //   ApiOperation({
      //     summary: `Guards ${guards.map((g) => g.toString()).join(', ')}`,
      //   }),
      // );
      decorators.push(UseGuards(GqlRoleGuard(...guards)));
    } else {
      decorators.push(UseGuards(GqlJwtAuthGuard));
    }
  }
  return applyDecorators(...decorators);
};

export function BaseResolver<T extends Type<any>>(ref: T | BaseViewOptions<T>): Type<BaseViewImpl<T>> {
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

  const singleRef = (() => {
    i({
      name: 'resolver type ref',
      msg: classRef
    });
    return classRef.name.substring(0, classRef.name.length - 1);
  })();

  @InputType(`${singleRef}Input`)
  class InputTypeT extends PartialType(classRef) {}

  @InputType(`${singleRef}Info`)
  class InfoTypeT extends InfoType {}

  @ObjectType(`${classRef.name}PaginatedType`)
  class PaginatedType extends Paginated(classRef) {}

  @Resolver({ isAbstract: true })
  class BaseResolverHost extends BaseView<T> {
    constructor(baseService: BaseServiceImpl<T>) {
      super(baseService);
    }

    @GqlGate(FnType.CREATE, publicFns, roleFns)
    @Mutation(() => classRef, {
      name: `${classRef.name.toLowerCase()}`,
      nullable: false
    })
    override createOne(@Args('input', { type: () => InputTypeT }) data: InputTypeT): Promise<T> {
      return super.createOne({ ...data });
    }

    @GqlGate(FnType.FIND, publicFns, roleFns)
    @Query(() => classRef, {
      name: `${singleRef.toLowerCase()}`,
      nullable: true
    })
    override findOne(@Args('id', { type: () => Int }) id: number): Promise<T> {
      return super.findOne(id);
    }

    @GqlGate(FnType.FIND, publicFns, roleFns)
    @Query(() => PaginatedType, { name: `${classRef.name.toLowerCase()}` })
    override findAll(@Args() paginateInfo: PaginateDto): Promise<PaginatedType> {
      const info = { ...paginateInfo, filter: { ...paginateInfo.filter } };
      return super.findAll(info);
    }

    @GqlGate(FnType.DELETE, publicFns, roleFns)
    @Mutation(() => Boolean, {
      name: `removeMany${classRef.name}`,
      nullable: false
    })
    override removeMany(@Args('info', { type: () => InfoTypeT }) data: InfoTypeT): Promise<boolean> {
      return super.removeMany(data);
    }

    @GqlGate(FnType.UPDATE, publicFns, roleFns)
    @Mutation(() => classRef, {
      name: `patch${singleRef}`,
      nullable: false
    })
    override updateOne(@Args('id', { type: () => Int }) id: number, @Args('data', { type: () => InputTypeT }) data: any): Promise<T> {
      return super.updateOne(id, data);
    }

    @GqlGate(FnType.DELETE, publicFns, roleFns)
    @Mutation(() => Boolean, {
      name: `remove${singleRef}`,
      nullable: false
    })
    override remove(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
      return super.remove(id);
    }
  }

  function hideFn(name: string) {
    Object.defineProperty(BaseResolverHost.prototype, name, {
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

  return BaseResolverHost;
}
