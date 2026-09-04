import { TcService, TcDbService, TcContext } from 'tailchat-server-sdk';
import type { PartLineDocument, PartLineModel } from '../models/part';
import { assertCanWrite, assertMember } from '../utils/group';
import { nextSeq } from '../utils/counter';

/**
 * Parts — one line from "we need one" through to "it is installed".
 *
 * `status` is a documented lifecycle but deliberately not an enforced state
 * machine: parts turn up without ever having been ordered, and a transition
 * table that forbids that is one people route around by lying to it.
 */
interface PartsService
  extends TcService,
    TcDbService<PartLineDocument, PartLineModel> {}
class PartsService extends TcService {
  get serviceName() {
    return 'plugin:com.stcworldwide.projectops.parts';
  }

  onInit() {
    this.registerLocalDb(require('../models/part').default);

    this.registerAction('list', this.list, {
      params: {
        groupId: 'string',
        status: { type: 'string', optional: true },
        deviceName: { type: 'string', optional: true },
      },
    });
    this.registerAction('add', this.add, {
      params: {
        groupId: 'string',
        description: 'string',
        manufacturer: { type: 'string', optional: true },
        partNumber: { type: 'string', optional: true },
        quantity: { type: 'number', optional: true },
        unit: { type: 'string', optional: true },
        status: { type: 'string', optional: true },
        supplier: { type: 'string', optional: true },
        poNumber: { type: 'string', optional: true },
        unitCost: { type: 'number', optional: true },
        currency: { type: 'string', optional: true },
        expectedAt: { type: 'string', optional: true },
        deviceName: { type: 'string', optional: true },
        building: { type: 'string', optional: true },
        level: { type: 'string', optional: true },
        punchlistIds: { type: 'array', items: 'string', optional: true },
      },
    });
    this.registerAction('update', this.update, {
      params: {
        groupId: 'string',
        partId: 'string',
        description: { type: 'string', optional: true },
        manufacturer: { type: 'string', optional: true },
        partNumber: { type: 'string', optional: true },
        quantity: { type: 'number', optional: true },
        status: { type: 'string', optional: true },
        supplier: { type: 'string', optional: true },
        poNumber: { type: 'string', optional: true },
        unitCost: { type: 'number', optional: true },
        expectedAt: { type: 'string', optional: true },
        deviceName: { type: 'string', optional: true },
        serialNumber: { type: 'string', optional: true },
        punchlistIds: { type: 'array', items: 'string', optional: true },
      },
    });
    this.registerAction('receive', this.receive, {
      params: {
        groupId: 'string',
        partId: 'string',
        serialNumber: { type: 'string', optional: true },
      },
    });
    this.registerAction('install', this.install, {
      params: {
        groupId: 'string',
        partId: 'string',
        deviceName: { type: 'string', optional: true },
        serialNumber: { type: 'string', optional: true },
      },
    });
    this.registerAction('remove', this.remove, {
      params: {
        groupId: 'string',
        partId: 'string',
      },
    });
  }

  private async list(
    ctx: TcContext<{ groupId: string; status?: string; deviceName?: string }>
  ) {
    const { groupId, status, deviceName } = ctx.params;
    await assertMember(ctx, groupId);

    const query: Record<string, unknown> = {
      groupId,
      deletedAt: { $exists: false },
    };
    if (status) {
      query.status = status;
    }
    if (deviceName) {
      query.deviceName = deviceName;
    }

    const docs = await this.adapter.model
      .find(query)
      .sort({ seq: 'desc' })
      .exec();

    return await this.transformDocuments(ctx, {}, docs);
  }

  private async add(ctx: TcContext<Record<string, any>>) {
    const { groupId, expectedAt, ...rest } = ctx.params;
    await assertMember(ctx, groupId);

    const doc = await this.adapter.model.create({
      ...rest,
      groupId,
      seq: await nextSeq(groupId, 'part'),
      expectedAt: expectedAt ? new Date(expectedAt) : undefined,
    });

    const json = await this.transformDocuments(ctx, {}, doc);
    await this.roomcastNotify(ctx, groupId, 'parts.add', json);

    return json;
  }

  private async update(ctx: TcContext<Record<string, any>>) {
    const { groupId, partId, expectedAt, ...rest } = ctx.params;
    await assertMember(ctx, groupId);

    const part = await this.findPart(groupId, partId);
    // A part line has no single owner, so editing one is a manage-panel job
    // unless nothing else claims it.
    await assertCanWrite(ctx, groupId, undefined);

    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined) {
        (part as Record<string, any>)[key] = value;
      }
    });
    if (expectedAt !== undefined) {
      part.expectedAt = expectedAt ? new Date(expectedAt) : undefined;
    }

    await part.save();

    const json = await this.transformDocuments(ctx, {}, part);
    await this.roomcastNotify(ctx, groupId, 'parts.update', json);

    return json;
  }

  /** Booking a delivery in: any member can do this, it is a field action. */
  private async receive(
    ctx: TcContext<{ groupId: string; partId: string; serialNumber?: string }>
  ) {
    const { groupId, partId, serialNumber } = ctx.params;
    await assertMember(ctx, groupId);

    const part = await this.findPart(groupId, partId);

    part.status = 'received';
    part.receivedAt = new Date();
    part.receivedBy = ctx.meta.userId;
    if (serialNumber) {
      part.serialNumber = serialNumber;
    }

    await part.save();

    const json = await this.transformDocuments(ctx, {}, part);
    await this.roomcastNotify(ctx, groupId, 'parts.update', json);

    return json;
  }

  private async install(
    ctx: TcContext<{
      groupId: string;
      partId: string;
      deviceName?: string;
      serialNumber?: string;
    }>
  ) {
    const { groupId, partId, deviceName, serialNumber } = ctx.params;
    await assertMember(ctx, groupId);

    const part = await this.findPart(groupId, partId);

    part.status = 'installed';
    part.installedAt = new Date();
    part.installedBy = ctx.meta.userId;
    if (deviceName) {
      part.deviceName = deviceName;
    }
    if (serialNumber) {
      part.serialNumber = serialNumber;
    }

    await part.save();

    const json = await this.transformDocuments(ctx, {}, part);
    await this.roomcastNotify(ctx, groupId, 'parts.update', json);

    return json;
  }

  private async remove(ctx: TcContext<{ groupId: string; partId: string }>) {
    const { groupId, partId } = ctx.params;
    await assertMember(ctx, groupId);

    const part = await this.findPart(groupId, partId);
    await assertCanWrite(ctx, groupId, undefined);

    part.deletedAt = new Date();
    await part.save();

    await this.roomcastNotify(ctx, groupId, 'parts.remove', {
      _id: String(part._id),
    });

    return true;
  }

  private async findPart(groupId: string, partId: string) {
    const part = await this.adapter.model.findOne({
      _id: partId,
      groupId,
      deletedAt: { $exists: false },
    });

    if (!part) {
      throw new Error('Part line not found');
    }

    return part;
  }
}

export default PartsService;
