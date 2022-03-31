import { Visitor, DeepCopy } from "@dev4vin/commons";
import { Injectable } from "@nestjs/common";
import { BaseEntity } from "typeorm";

@Injectable()
export class EntityVisitor<T extends BaseEntity> implements Visitor<T, T> {
    visit(t: T, _: any = []): T {
        return DeepCopy(t)
    }
}

