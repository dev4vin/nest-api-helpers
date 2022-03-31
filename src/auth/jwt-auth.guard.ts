import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './auth.guard';

/**
 *
 *
 * @export
 * @class JwtAuthGuard
 * @extends {AuthGuard('jwt')}
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Creates an instance of JwtAuthGuard.
   * @param {Reflector} reflector
   * @memberof JwtAuthGuard
   */
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   *
   *
   * @param {ExecutionContext} context
   * @return {*}
   * @memberof JwtAuthGuard
   */
  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}

/**
 *
 *
 * @export
 * @class GqlJwtAuthGuard
 * @extends {AuthGuard('jwt')}
 */
@Injectable()
export class GqlJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Creates an instance of GqlJwtAuthGuard.
   * @param {Reflector} reflector
   * @memberof GqlJwtAuthGuard
   */
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   *
   *
   * @param {ExecutionContext} ctx
   * @return {*}
   * @memberof GqlJwtAuthGuard
   */
  override canActivate(ctx: ExecutionContext) {
    const context = GqlExecutionContext.create(ctx);
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }
    const { req } = context.getContext();
    return super.canActivate(new ExecutionContextHost([req])); // NOTE
  }
}
