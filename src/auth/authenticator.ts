import { Role } from './roles.guard';

export const AUTHENTICATOR = "nest_api_utils_authenticator";

export abstract class Authenticator {
 
  /**
   * checks if the scope of the user is in the roles requested by the function guard
   *
   * @param {*} { scope } user scope CLIENT | PROVIDER | ADMIN
   * @param {...UserRole[]} roles function requested roles
   * @return {*}  {Promise<boolean>} true if scope is in roles otherwise not
   * @memberof AuthService
   * @example true = await validateRoles({ CLIENT }, UserRole.CLIENT, UserRole.PROVIDER)
   * @example false = await validateRoles({ ADMIN }, UserRole.CLIENT, UserRole.PROVIDER)
   */
  async validateRoles(scope: Role, ...roles: Role[]): Promise<boolean> {
    return new Promise((resolve) => {
      resolve(roles.map((r) => r.toLowerCase()).includes(scope.toLowerCase()));
    });
  }
}
