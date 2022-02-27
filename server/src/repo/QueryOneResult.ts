export class QueryOneResult<T> {
  constructor(public messages?: Array<string>, public entity?: T) {}
}
