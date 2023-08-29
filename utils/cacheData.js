const NodeCache = require("node-cache");
const axios = require("axios");

const cache = new NodeCache({
  stdTTL: 1800, // 缓存默认过期时间（单位秒）
  checkperiod: 60, // 定期检查过期缓存的时间（单位秒）
});

/**
 * 从缓存中获取数据
 * @param {string} key 缓存键值
 * @return {Promise<any>} 数据
 */
const get = async (key) => {
  return cache.get(key);
};

/**
 * 将数据写入缓存
 * @param {string} key 缓存键值
 * @param {any} value 数据
 * @param {number} ttl 有效期，单位秒，默认为300秒
 * @return {Promise<void>} 无返回值
 */
const set = async (key, value, ttl = 300) => {
  return cache.set(key, value, ttl);
};

/**
 * 从缓存中删除数据
 * @param {string} key 缓存键值
 * @return {Promise<void>} 无返回值
 */
const del = async (key) => {
  return cache.del(key);
};

// 缓存数据
const cacheData = async (cacheKey, url, callGetData) => {
  try {
    const response = await axios.get(url);
    const data = callGetData(response.data.data.realtime);
    updateTime = new Date().toISOString();
    await del(cacheKey);
    await set(cacheKey, data);
    console.log("缓存微博热搜数据成功");
  } catch (error) {
    console.error("缓存微博热搜数据失败", error);
  }
};

module.exports = {
  get,
  set,
  del,
  cacheData,
};
