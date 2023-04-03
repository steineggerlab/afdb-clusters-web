const { createHash } = await import('node:crypto');
const sha256 =  (x) => createHash('sha256').update(x).digest('hex');

function convertToQueryUrl(obj) {
    var params = new URLSearchParams(obj);
    var entries = Object.entries(obj);
    for (var entry in entries) {
        var key = entries[entry][0];
        var value = entries[entry][1];
        if (Array.isArray(value)) {
            params.delete(key);
            value.forEach(function (v) {
                return params.append(key + '[]', v);
            });
        }
    }
    return params.toString();
}

export {
    sha256,
    convertToQueryUrl
}