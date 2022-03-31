import { Type } from '@nestjs/common';
import { Role } from './auth/roles.guard';
import { BaseServiceImpl } from './base.service';
import { PaginateDto, InfoType, PaginatedEntity } from './entities';

export type BaseViewOptions<T> = {
  ref: T;
  publicFns?: FnType[];
  roleFns?: FnRole[];
  hiddenFns?: FnType[];
};

/**
 *
 * Function type enum used to denote function operation kind
 * @export
 * @enum {string}
 */
export enum FnType {
  /**
   * Fetch operations
   */
  FIND,
  /**
   * Update operations
   */
  UPDATE,
  /**
   * Create operations
   */
  CREATE,
  /**
   * Delete operations
   */
  DELETE
}
/**
 * Role enum used to attach a number of user roles to a given function operation
 */
export type FnRole = {
  /**
   * the give function type
   */
  fnType: FnType;
  /**
   * the roles of users that can execute it
   */
  roles: Role[];
};

/**
 * Base crud operations for a service
 * All services should implement this through extending
 * <example-url>http://localhost/demo/mysample.component.html</example-url>
 * @export
 * @interface BaseViewImpl
 * @template T
 */
export interface BaseViewImpl<T extends Type<any>> {
  /**
   * finds one record
   * @param {number} id the record id to be fetched
   * @return {*}  {Promise<T>}
   * @memberof BaseViewImpl
   */
  findOne(id: number): Promise<T>;

  /**
   *
   *  finds all records
   * @param {PaginateDto} info
   * @return {*}  {Promise<PaginatedEntity<T>>}
   * @memberof BaseViewImpl
   */
  findAll(info: PaginateDto): Promise<PaginatedEntity<T>>;

  /**
   *
   *
   * @param {number} id
   * @return {*}  {Promise<boolean>}
   * @memberof BaseViewImpl
   */
  remove(id: number): Promise<boolean>;
  /**
   *
   *
   * @param {*} data
   * @return {*}  {Promise<T>}
   * @memberof BaseViewImpl
   */
  createOne(data: any): Promise<T>;
  /**
   *
   *
   * @param {number} id
   * @param {*} data
   * @return {*}  {Promise<T>}
   * @memberof BaseViewImpl
   */
  updateOne(id: number, data: any): Promise<T>;
  /**
   *
   *
   * @param {InfoType} data
   * @return {*}  {Promise<boolean>}
   * @memberof BaseViewImpl
   */
  removeMany(data: InfoType): Promise<boolean>;
  /**
   *
   *
   * @param {FnHook<T>} hook
   * @memberof BaseViewImpl
   */
  // @ts-ignore
  registerCreateHook(hook: FnHook<T>);
}
/**
 * Hook functions for views
 */
export type FnHook<T> = {
  /**
   * called before current function
   */
  preFn?: (t: T) => Promise<T>;
  /**
   * called after current function
   */
  postFn?: (t: T) => Promise<any>;
};

/**
 * Base crud functions
 * Example usage:
 * <example-url>http://localhost/demo/mysample.component.html</example-url>
 * <example-url>/demo/mysample.component.html</example-url>
 */
export class BaseView<T extends Type<any>> implements BaseViewImpl<T> {
  // @ts-ignore
  createHook: FnHook<T> = undefined;

  /**
   *
   * @param hook hook for create functions
   */
  registerCreateHook(hook: FnHook<T>) {
    this.createHook = hook;
  }
  constructor(private baseService: BaseServiceImpl<T>) {}

  async updateOne(id: number, data: any): Promise<T> {
    return await this.baseService.updateInfo(id, data);
  }
  async findOne(id: number): Promise<T> {
    return await this.baseService.findOneWithId(id);
  }
  async findAll(info: PaginateDto): Promise<PaginatedEntity<T>> {
    return await this.baseService.find(info);
  }
  async remove(id: number): Promise<boolean> {
    return await this.baseService.remove(id);
  }
  async createOne(data: any): Promise<T> {
    if (this.createHook !== undefined && this.createHook.preFn !== undefined) {
      await this.createHook.preFn(data);
    }
    const result = await this.baseService.saveInfo(data);
    if (this.createHook !== undefined && this.createHook.postFn !== undefined) {
      await this.createHook.postFn(result);
    }
    return result;
  }
  async removeMany(data: InfoType): Promise<boolean> {
    return await this.baseService.removeMany(data);
  }
}
