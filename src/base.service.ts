import { info as i } from '@dev4vin/commons';
import { Type } from '@nestjs/common';
import { getRepository, In, Like, SelectQueryBuilder } from 'typeorm';
import { isArray } from 'util';
import { InfoType, PaginatedEntity, PaginateDto } from './entities';
/**
 * class BaseViewImpl, basic crud database functions
 * @alias BaseService
 */
export interface BaseServiceImpl<T extends Type<unknown>> {
  /**
   *
   * @param builder current query builder
   * @param paginatedInfo query info
   * @param transform transforms filter key to custom values
   */
  buildWhereWithQueryBuilder(builder: SelectQueryBuilder<T>, paginatedInfo: PaginateDto, transform: (key: any, value: any) => any): SelectQueryBuilder<T>;

  buildWhere(paginatedInfo: PaginateDto, filter?: undefined): {};

  buildSort(paginatedInfo: PaginateDto): {};

  buildSortWithQueryBuilder(builder: SelectQueryBuilder<T>, paginatedInfo: PaginateDto): SelectQueryBuilder<T>;

  buildQuery(paginatedInfo: PaginateDto, alias?: string, transform?: (key: any, value: any) => any, ref?: undefined): SelectQueryBuilder<T>;

  find(paginatedInfo: PaginateDto, ref?: undefined): Promise<PaginatedEntity<T>>;

  findMany(paginatedInfo: PaginateDto, ref?: any): Promise<T[]>;

  findOneWithId(id: number, ref?: undefined): Promise<T>;

  saveInfo(info: any, ref?: undefined): Promise<T>;

  updateInfo(id: number, info: any, ref?: undefined): Promise<T>;

  removeMany(id: InfoType, ref?: undefined): Promise<boolean>;

  remove(id: number, ref?: undefined): Promise<boolean>;
}

/**
 *
 * returns an implementation of BaseService for the given classRef instance
 * @see BaseServiceImpl
 * @export
 * @template T type of classRef i.e @see FAQs
 * @param {T} classRef type value
 * @return { @implements BaseServiceImpl }  implementation of BaseServiceImpl
 */
export function BaseService<T extends Type<unknown>>(classRef: T): Type<BaseServiceImpl<T>> {
  class BaseServiceHost implements BaseServiceImpl<T> {
    // @ts-ignore
    buildWhereWithQueryBuilder(builder: SelectQueryBuilder<T>, paginatedInfo: PaginateDto, transform: ((key: any, value: any) => any) = undefined): SelectQueryBuilder<T> {
      const alias = builder.alias;
      let where = {};
      if (paginatedInfo.filter) {
        try {
          where = JSON.parse(paginatedInfo.filter);
          i({
            name: 'where body buider',
            msg: where
          });
          for (const [key, value] of Object.entries(where)) {
            if (isArray(value)) {
              if (key === 'ids') {
                builder.andWhere(`${alias}.id IN (:...ids)`, {
                  ids: value
                });
              }
            } else {
              const value1 = transform ? transform(key, value) : value;
              if (value1 === value) {
                builder.andWhere(`${alias}.${key} LIKE :${key}`, {
                  [key]: '%' + value + '%'
                });
              } else {
                builder.andWhere(value1);
              }
            }
          }
        } catch (e) {
          where = {};
        }
      } else {
        i({
          name: 'where body buider no filter',
          msg: where
        });
      }
      return builder.skip(paginatedInfo.offset).take(paginatedInfo.limit);
    }

    buildWhere(paginatedInfo: InfoType, filter = {}) {
      let where = {};
      if (paginatedInfo.filter) {
        try {
          where = JSON.parse(paginatedInfo.filter);
          for (const [key, value] of Object.entries(where)) {
            if (isArray(value)) {
              if (key === 'ids') {
                Object.defineProperty(where, 'id', {
                  value: In(value),
                  writable: false,
                  enumerable: true,
                  configurable: true
                });
              }
            } else {
              Object.defineProperty(where, key, {
                value: Like('%' + value + '%'),
                writable: false,
                enumerable: true,
                configurable: true
              });
            }
          }
        } catch (e) {
          where = {};
        }
      }
      for (const [key, value] of Object.entries(filter)) {
        Object.defineProperty(where, key, {
          value,
          writable: false,
          enumerable: true,
          configurable: true
        });
      }
      i({
        name: 'where body',
        msg: where
      });
      return where;
    }

    buildSort(paginatedInfo: PaginateDto) {
      const sort = {};
      if (paginatedInfo.sort) {
        try {
          const [id, name] = JSON.parse(paginatedInfo.sort);
          Object.defineProperty(sort, id, {
            value: name,
            writable: false,
            enumerable: true,
            configurable: true
          });
        } catch (e) {}
      }
      i({
        name: 'sort body',
        msg: sort
      });
      return sort;
    }

    buildSortWithQueryBuilder(builder: SelectQueryBuilder<T>, paginatedInfo: PaginateDto): SelectQueryBuilder<T> {
      const alias = builder.alias;
      const sort = this.buildSort(paginatedInfo);
      for (const [key, value] of Object.entries(sort)) {
        if ((value as string).includes('ASC')) {
          builder.orderBy(`${alias}.${key}`, 'ASC');
        } else {
          builder.orderBy(`${alias}.${key}`, 'DESC');
        }
      }
      return builder;
    }
    // @ts-ignore
    buildQuery(paginatedInfo: PaginateDto, alias = 'alias', transform: (key: any, value: any) => any = undefined, ref = undefined): SelectQueryBuilder<T> {
      const repo = getRepository(ref ?? classRef);
      return this.buildSortWithQueryBuilder(
        this.buildWhereWithQueryBuilder(
          //@ts-ignore
          repo.createQueryBuilder(alias),
          paginatedInfo,
          transform
        ),
        paginatedInfo
      );
    }

    // @ts-ignore
    async findOneWithId(id: number, ref = undefined) {
      const repo = getRepository(ref ?? classRef);
      return await repo.findOne({
        where: { id }
      });
    }

    async saveInfo(info: any, ref = undefined) {
      i({
        name: 'Info',
        msg: info
      });
      const repo = getRepository(ref ?? classRef);
      return await repo.save(info);
    }

    async updateInfo(id: number, info: any, ref = undefined) {
      const repo = getRepository(ref ?? classRef);
      const model = await repo.findOne({
        where: { id }
      });
      // @ts-ignore
      return await repo.save({ ...info, id: model.id });
    }

    async removeMany(id: InfoType, ref = undefined): Promise<boolean> {
      const joinRepo = getRepository(ref ?? classRef);
      const records = await joinRepo.delete(this.buildWhere(id));
      // @ts-ignore
      return records.affected > 0;
    }

    async find(paginatedInfo: PaginateDto, ref = undefined): Promise<PaginatedEntity<any>> {
      // const repo = getRepository(classRef);
      try {
        // @ts-
        return (
          this.buildQuery(paginatedInfo, 'm', undefined, ref)
            .getManyAndCount()
            // return repo
            //   .findAndCount({
            //     where: this.buildWhere(paginatedInfo),
            //     skip: paginatedInfo.offset,
            //     take: paginatedInfo.limit,
            //     order: this.buildSort(paginatedInfo),
            //   })
            .then(([data, count]) => ({
              data,
              count
            }))
        );
      } catch (e) {
        // console.error(e);
        throw e;
      }
    }

    findMany(paginatedInfo: PaginateDto, ref = undefined): Promise<T[]> {
      try {
        // @ts-
        return (
          this.buildQuery(paginatedInfo, 'm', undefined, ref)
            .getMany()
            // return repo
            //   .findAndCount({
            //     where: this.buildWhere(paginatedInfo),
            //     skip: paginatedInfo.offset,
            //     take: paginatedInfo.limit,
            //     order: this.buildSort(paginatedInfo),
            //   })
            .then((data) => data)
        );
      } catch (e) {
        // console.error(e);
        throw e;
      }
    }

    async remove(id: number, ref = undefined): Promise<boolean> {
      const repo = getRepository(ref ?? classRef);
      return await repo
        .delete({
          where: { id }
        })
        .then((res) => {
          // @ts-ignore
          return  res.affected > 0;
        });
    }
  }

  // @ts-ignore
  return BaseServiceHost;
}

