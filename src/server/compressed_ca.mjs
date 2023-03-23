export default function(mem, chainLength, entryLength) {
    const floatSize = Float32Array.BYTES_PER_ELEMENT;
    const intSize = Int32Array.BYTES_PER_ELEMENT;
    const shortSize = Int16Array.BYTES_PER_ELEMENT;

    if (entryLength >= (chainLength * 3) * floatSize) {
        return new Float32Array(mem, 0, chainLength * 3);
    }

    let buffer = new Float32Array(chainLength * 3);

    const data = new Uint8Array(mem, 0, entryLength);
    let offset = 0;
    let diffSum = 0;
    let start = new Int32Array(data.buffer, offset, 1)[0];
    offset += intSize;
    buffer[0] = start / 1000.0;

    for (let i = 1; i < chainLength; ++i) {
        const intDiff = new Int16Array(data.buffer, offset, 1)[0];
        offset += shortSize;
        diffSum += intDiff;
        buffer[i] = (start + diffSum) / 1000.0;
    }

    diffSum = 0;
    start = new Int32Array(data.buffer, offset, 1)[0];
    offset += intSize;
    buffer[chainLength] = start / 1000.0;

    for (let i = chainLength + 1; i < 2 * chainLength; ++i) {
        const intDiff = new Int16Array(data.buffer, offset, 1)[0];
        offset += shortSize;
        diffSum += intDiff;
        buffer[i] = (start + diffSum) / 1000.0;
    }

    diffSum = 0;
    start = new Int32Array(data.buffer, offset, 1)[0];
    offset += intSize;
    buffer[2 * chainLength] = start / 1000.0;

    for (let i = 2 * chainLength + 1; i < 3 * chainLength; ++i) {
        const intDiff = new Int16Array(data.buffer, offset, 1)[0];
        offset += shortSize;
        diffSum += intDiff;
        buffer[i] = (start + diffSum) / 1000.0;
    }

    return buffer;
}
