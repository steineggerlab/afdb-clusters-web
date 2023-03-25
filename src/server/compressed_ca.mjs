export default function(mem, chainLength, entryLength) {
    const floatSize = Float32Array.BYTES_PER_ELEMENT;
    const intSize = Int32Array.BYTES_PER_ELEMENT;
    const shortSize = Int16Array.BYTES_PER_ELEMENT;

    if (entryLength >= (chainLength * 3) * floatSize) {
        let buffer = new Float32Array(mem.buffer, 0, chainLength * 3);
        return buffer;
    }

    let buffer = new Float32Array(chainLength * 3);

    let offset = 0;
    let diffSum = 0;
    let start = mem.readInt32LE(offset);
    offset += intSize;
    buffer[0] = start / 1000.0;

    for (let i = 1; i < chainLength; ++i) {
        const intDiff = mem.readInt16LE(offset);
        offset += shortSize;
        diffSum += intDiff;
        buffer[i] = (start + diffSum) / 1000.0;
    }

    diffSum = 0;
    start = mem.readInt32LE(offset);
    offset += intSize;
    buffer[chainLength] = start / 1000.0;

    for (let i = chainLength + 1; i < 2 * chainLength; ++i) {
        const intDiff = mem.readInt16LE(offset);
        offset += shortSize;
        diffSum += intDiff;
        buffer[i] = (start + diffSum) / 1000.0;
    }

    diffSum = 0;
    start = mem.readInt32LE(offset);
    offset += intSize;
    buffer[2 * chainLength] = start / 1000.0;

    for (let i = 2 * chainLength + 1; i < 3 * chainLength; ++i) {
        const intDiff = mem.readInt16LE(offset);
        offset += shortSize;
        diffSum += intDiff;
        buffer[i] = (start + diffSum) / 1000.0;
    }

    return buffer;
}
