/** Normalises a Buffer field from a lean() query (BSON Binary) into a Node Buffer without copying. */
export function toBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value;
  const inner = (value as { buffer?: unknown })?.buffer;
  if (inner instanceof Uint8Array) return Buffer.from(inner.buffer, inner.byteOffset, inner.byteLength);
  if (value instanceof Uint8Array) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  throw new Error("Unsupported binary value");
}
