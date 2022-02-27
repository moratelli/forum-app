import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./User";
import { Thread } from "./Thread";
import { Auditable } from "./Auditable";

@Entity({ name: "ThreadPoints" })
export class ThreadPoint extends Auditable {
  @PrimaryGeneratedColumn({ name: "Id", type: "bigint" })
  id: string;

  @Column("boolean", { name: "isDecrement", default: false, nullable: false })
  isDecrement: boolean;

  @ManyToOne(() => User, (user) => user.threadPoints)
  user: User;

  @ManyToOne(() => Thread, (thread) => thread.threadPoints)
  thread: Thread;
}
