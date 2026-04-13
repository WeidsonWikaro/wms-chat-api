export interface RefreshJwtPayload {
  sub: string;
  jti: string;
  typ: 'refresh';
}
