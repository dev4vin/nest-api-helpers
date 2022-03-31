import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/**
 * decorates function as can be accessed by guests
 * @returns metadata with public key
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
