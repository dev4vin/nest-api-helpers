import { Type } from '@nestjs/common';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { PaginatedEntity } from '../entities';

/**
 * entity record status
 *
 * @export
 * @enum {number}
 */
export enum Status {
  /**
   * active state
   */
  ACTIVE = 'ACTIVE',
  /**
   * inactive state
   */
  INACTIVE = 'INACTIVE'
}

registerEnumType(Status, {
  name: 'Status',
  description: 'The supported status types'
});

/**
 *
 *
 * @export
 * @template T
 * @param {T} classRef
 * @return {*}  {Type<PaginatedEntity<T>>}
 */
export function Paginated<T extends Type<unknown>>(classRef: T): Type<PaginatedEntity<T>> {
  /**
   *
   *
   * @class PaginatedType
   * @extends {PaginatedEntity<T>}
   */
  @ObjectType()
  class PaginatedType extends PaginatedEntity<T> {
    /**
     *
     *
     * @type {T[]}
     * @memberof PaginatedType
     */
    @Field(() => [classRef], { nullable: true })
    override data!: T[];
  }
  // @ts-ignore
  return PaginatedType as Type<PaginatedEntity<T>>;
}
