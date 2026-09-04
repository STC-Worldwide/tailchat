import counterModel from '../models/counter';

/**
 * Next per-group sequence number for a record kind.
 *
 * One atomic findOneAndUpdate rather than read-then-write: two people adding
 * a punch item at the same moment must not both get 15.
 */
export async function nextSeq(groupId: string, name: string): Promise<number> {
  const doc = await counterModel.findOneAndUpdate(
    { groupId, name },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return doc.value;
}

/** '861' + 'PL' + 14 -> '861-PL-014'; without a prefix, 'PL-014'. */
export function formatRef(
  prefix: string | undefined,
  kind: string,
  seq: number
): string {
  const tail = `${kind}-${String(seq).padStart(3, '0')}`;
  return prefix ? `${prefix}-${tail}` : tail;
}
