import { SetMetadata } from '@nestjs/common';

export const IS_ADMIN_ROUTE_KEY = 'is-admin-route';

export const AdminRoute = () => SetMetadata(IS_ADMIN_ROUTE_KEY, true);
