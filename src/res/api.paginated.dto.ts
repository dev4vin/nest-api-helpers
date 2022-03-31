import { applyDecorators, Type } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedEntity } from '../entities';
/**
 *
 * @param model
 * @returns
 */
export const ApiPaginatedResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        title: `PaginatedResponseOf${model.name}`,
        allOf: [
          // @ts-ignore
          { $ref: getSchemaPath(PaginatedEntity) },
          {
            properties: {
              data: {
                type: 'array',
                $ref: getSchemaPath(model)
              },
              count: {
                type: 'number'
              }
            }
          }
        ]
      }
    })
  );
};
/**
 *
 * @param model
 * @returns
 */
export const ApiModel200Response = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        title: `200ResponseOf${model.name}`,
        properties: {
          fields: { $ref: getSchemaPath(model) }
        }
      }
    })
  );
};
/**
 *
 * @param model
 * @param code
 * @returns
 */
export const ApiResponse = <TModel extends Record<string, any>>(model: TModel, code = 200) => {
  let decorator;
  switch (code) {
    case 201: {
      decorator = ApiCreatedResponse({
        schema: {
          title: `200Response`,
          properties: model
        }
      });
      break;
    }
    default: {
      decorator = ApiOkResponse({
        schema: {
          title: `200Response`,
          properties: model
        }
      });
    }
  }
  return applyDecorators(decorator);
};
/**
 *
 * @param model
 * @returns
 */
export const Api404Response = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiNotFoundResponse({
      schema: {
        title: `404ResponseOf${model.name}`,
        properties: {
          statusCode: {
            default: 404
          },
          message: {
            default: `${model.name} not found`
          }
        }
      }
    })
  );
};
