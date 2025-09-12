import { SetMetadata } from '@nestjs/common';

export const REQUIRE_AUTH_KEY = 'require-auth';

export const RequireAuth = () => SetMetadata(REQUIRE_AUTH_KEY, true);
