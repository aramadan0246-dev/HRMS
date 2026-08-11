import "@pnp/sp/items";
import { IItems } from "@pnp/sp/items";
import { getSP } from "./SPContext";

/**
 * Thin CRUD wrapper shared by every list service. Each entity service supplies
 * its list title and (optionally) which columns are lookups, since those need
 * the "Id" suffix (e.g. EmployeeId/Id) when read from SharePoint.
 */
export class ListService<T extends { Id: number }> {
  constructor(protected listTitle: string, protected selectFields: string[] = ["*"]) {}

  protected get items(): IItems {
    return getSP().web.lists.getByTitle(this.listTitle).items;
  }

  public async getAll(filter?: string, orderBy?: string, ascending = true): Promise<T[]> {
    let query = this.items.select(...this.selectFields).top(2000);
    if (filter) {
      query = query.filter(filter);
    }
    if (orderBy) {
      query = query.orderBy(orderBy, ascending);
    }
    return (await query()) as T[];
  }

  public async getById(id: number): Promise<T> {
    return (await this.items.getById(id).select(...this.selectFields)()) as T;
  }

  public async add(item: Partial<T>): Promise<T> {
    const result = await this.items.add(item);
    return result as unknown as T;
  }

  public async update(id: number, item: Partial<T>): Promise<void> {
    await this.items.getById(id).update(item);
  }

  public async delete(id: number): Promise<void> {
    await this.items.getById(id).delete();
  }
}
