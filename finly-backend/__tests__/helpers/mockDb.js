function createMockDb() {
  const queue = [];

  function clearQueue() {
    queue.length = 0;
  }

  function pushResult(result) {
    queue.push(result);
  }

  function pushError(err) {
    queue.push({ __error: err });
  }

  const query = jest.fn((sql, params, callback) => {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }

    const item = queue.shift() ?? { rows: [], rowCount: 0 };

    if (item.__error) {
      if (callback) {
        callback(item.__error);
        return undefined;
      }
      return Promise.reject(item.__error);
    }

    if (callback) {
      callback(null, item);
      return undefined;
    }

    return Promise.resolve(item);
  });

  return { query, pushResult, pushError, clearQueue };
}

module.exports = { createMockDb };
